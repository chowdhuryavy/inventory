/**
 * Inventory Management Functions
 * Handles CRUD operations for inventory items with role-based permissions
 */

/**
 * Show inventory management interface
 */
function showInventoryManager() {
  if (!hasPermission('view_inventory')) {
    SpreadsheetApp.getUi().alert('Access Denied', 'You do not have permission to access inventory management.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  const html = HtmlService.createTemplateFromFile('WebInventory');
  html.userRole = getCurrentUserRole();
  
  const htmlOutput = html.evaluate()
    .setWidth(800)
    .setHeight(600)
    .setTitle('Inventory Management');
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Inventory Management');
}

/**
 * Get all inventory items
 */
function getInventoryItems() {
  if (!hasPermission('view_inventory')) {
    throw new Error('Access denied');
  }
  
  const data = getSheetData(CONFIG.SHEETS.INVENTORY);
  return data.map((row, index) => ({
    rowIndex: index + 2, // Add 2 because array is 0-based and we skip header
    sku: row[0],
    productName: row[1],
    category: row[2],
    quantity: row[3],
    unitPrice: row[4],
    supplier: row[5],
    expiryDate: row[6],
    minStockLevel: row[7],
    lastUpdated: row[8],
    lastUpdatedBy: row[9]
  }));
}

/**
 * Add new inventory item
 */
function addInventoryItem(itemData) {
  if (!hasPermission('add_inventory')) {
    throw new Error('Access denied: You do not have permission to add inventory items');
  }
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.INVENTORY);
    const currentUserEmail = Session.getActiveUser().getEmail();
    
    // Check if SKU already exists
    if (findRowByColumnValue(CONFIG.SHEETS.INVENTORY, 0, itemData.sku) > 0) {
      throw new Error('SKU already exists');
    }
    
    // Validate required fields
    if (!itemData.sku || !itemData.productName || !itemData.category) {
      throw new Error('SKU, Product Name, and Category are required fields');
    }
    
    const newRow = [
      itemData.sku,
      itemData.productName,
      itemData.category,
      itemData.quantity || 0,
      itemData.unitPrice || 0,
      itemData.supplier || '',
      itemData.expiryDate ? new Date(itemData.expiryDate) : '',
      itemData.minStockLevel || 0,
      new Date(),
      currentUserEmail
    ];
    
    sheet.appendRow(newRow);
    
    // Log the activity
    logActivity('Add Inventory', `Added new item: ${itemData.productName} (SKU: ${itemData.sku})`);
    
    // Log stock change if quantity > 0
    if (itemData.quantity > 0) {
      logStockChange(itemData.sku, itemData.productName, 'Stock In', itemData.quantity, 'Initial stock');
    }
    
    return { success: true, message: 'Item added successfully' };
    
  } catch (error) {
    console.error('Error adding inventory item:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Update existing inventory item
 */
function updateInventoryItem(sku, itemData) {
  if (!hasPermission('edit_inventory')) {
    throw new Error('Access denied: You do not have permission to edit inventory items');
  }
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.INVENTORY);
    const rowIndex = findRowByColumnValue(CONFIG.SHEETS.INVENTORY, 0, sku);
    
    if (rowIndex === -1) {
      throw new Error('Item not found');
    }
    
    const currentUserEmail = Session.getActiveUser().getEmail();
    const currentData = sheet.getRange(rowIndex, 1, 1, 10).getValues()[0];
    const oldQuantity = currentData[3];
    
    const updatedRow = [
      itemData.sku || currentData[0],
      itemData.productName || currentData[1],
      itemData.category || currentData[2],
      itemData.quantity !== undefined ? itemData.quantity : currentData[3],
      itemData.unitPrice !== undefined ? itemData.unitPrice : currentData[4],
      itemData.supplier !== undefined ? itemData.supplier : currentData[5],
      itemData.expiryDate ? new Date(itemData.expiryDate) : currentData[6],
      itemData.minStockLevel !== undefined ? itemData.minStockLevel : currentData[7],
      new Date(),
      currentUserEmail
    ];
    
    sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
    
    // Log the activity
    logActivity('Update Inventory', `Updated item: ${updatedRow[1]} (SKU: ${updatedRow[0]})`);
    
    // Log stock change if quantity changed
    if (itemData.quantity !== undefined && itemData.quantity !== oldQuantity) {
      const quantityDiff = itemData.quantity - oldQuantity;
      const action = quantityDiff > 0 ? 'Stock In' : 'Stock Out';
      const remarks = itemData.remarks || 'Inventory update';
      logStockChange(updatedRow[0], updatedRow[1], action, Math.abs(quantityDiff), remarks);
    }
    
    return { success: true, message: 'Item updated successfully' };
    
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Delete inventory item
 */
function deleteInventoryItem(sku) {
  if (!hasPermission('delete_inventory')) {
    throw new Error('Access denied: You do not have permission to delete inventory items');
  }
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.INVENTORY);
    const rowIndex = findRowByColumnValue(CONFIG.SHEETS.INVENTORY, 0, sku);
    
    if (rowIndex === -1) {
      throw new Error('Item not found');
    }
    
    const itemData = sheet.getRange(rowIndex, 1, 1, 10).getValues()[0];
    sheet.deleteRow(rowIndex);
    
    // Log the activity
    logActivity('Delete Inventory', `Deleted item: ${itemData[1]} (SKU: ${itemData[0]})`);
    
    return { success: true, message: 'Item deleted successfully' };
    
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Update stock quantity (Stock In/Out operation)
 */
function updateStock(sku, quantityChange, action, remarks) {
  if (!hasPermission('edit_inventory')) {
    throw new Error('Access denied: You do not have permission to update stock');
  }
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.INVENTORY);
    const rowIndex = findRowByColumnValue(CONFIG.SHEETS.INVENTORY, 0, sku);
    
    if (rowIndex === -1) {
      throw new Error('Item not found');
    }
    
    const currentData = sheet.getRange(rowIndex, 1, 1, 10).getValues()[0];
    const currentQuantity = currentData[3] || 0;
    
    let newQuantity;
    if (action === 'Stock In') {
      newQuantity = currentQuantity + Math.abs(quantityChange);
    } else if (action === 'Stock Out') {
      newQuantity = currentQuantity - Math.abs(quantityChange);
      if (newQuantity < 0) {
        throw new Error('Insufficient stock. Current quantity: ' + currentQuantity);
      }
    } else {
      throw new Error('Invalid action. Use "Stock In" or "Stock Out"');
    }
    
    const currentUserEmail = Session.getActiveUser().getEmail();
    
    // Update the quantity and last updated fields
    sheet.getRange(rowIndex, 4).setValue(newQuantity); // Quantity column
    sheet.getRange(rowIndex, 9).setValue(new Date()); // Last Updated column
    sheet.getRange(rowIndex, 10).setValue(currentUserEmail); // Last Updated By column
    
    // Log the stock change
    logStockChange(sku, currentData[1], action, Math.abs(quantityChange), remarks);
    
    // Log the activity
    logActivity('Stock Update', `${action}: ${currentData[1]} (SKU: ${sku}) - Quantity: ${Math.abs(quantityChange)}`);
    
    return { 
      success: true, 
      message: `Stock updated successfully. New quantity: ${newQuantity}`,
      newQuantity: newQuantity
    };
    
  } catch (error) {
    console.error('Error updating stock:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Log stock changes (updated for your sheet structure)
 */
function logStockChange(sku, productName, action, quantity, remarks) {
  try {
    const stockLogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.STOCK_LOG);
    const currentUserEmail = Session.getActiveUser().getEmail();
    
    const logEntry = [
      new Date(),         // Timestamp
      sku,                // SKU
      productName,        // Product Name
      action,             // Action
      quantity,           // Quantity
      currentUserEmail,   // Updated By
      remarks || ''       // Remarks
    ];
    
    stockLogSheet.appendRow(logEntry);
  } catch (error) {
    console.error('Error logging stock change:', error);
  }
}

/**
 * Get low stock items
 */
function getLowStockItems() {
  if (!hasPermission('view_inventory')) {
    throw new Error('Access denied');
  }
  
  const data = getSheetData(CONFIG.SHEETS.INVENTORY);
  return data.filter(row => {
    const quantity = row[3] || 0;
    const minStock = row[7] || 0;
    return quantity <= minStock && minStock > 0;
  }).map(row => ({
    sku: row[0],
    productName: row[1],
    category: row[2],
    quantity: row[3],
    minStockLevel: row[7],
    supplier: row[5]
  }));
}

/**
 * Get expired items
 */
function getExpiredItems() {
  if (!hasPermission('view_inventory')) {
    throw new Error('Access denied');
  }
  
  const today = new Date();
  const data = getSheetData(CONFIG.SHEETS.INVENTORY);
  
  return data.filter(row => {
    const expiryDate = row[6];
    return expiryDate && new Date(expiryDate) <= today;
  }).map(row => ({
    sku: row[0],
    productName: row[1],
    category: row[2],
    quantity: row[3],
    expiryDate: row[6],
    supplier: row[5]
  }));
}

/**
 * Get items expiring soon
 */
function getExpiringSoonItems(days = 7) {
  if (!hasPermission('view_inventory')) {
    throw new Error('Access denied');
  }
  
  const today = new Date();
  const warningDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
  const data = getSheetData(CONFIG.SHEETS.INVENTORY);
  
  return data.filter(row => {
    const expiryDate = row[6];
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    return expiry > today && expiry <= warningDate;
  }).map(row => ({
    sku: row[0],
    productName: row[1],
    category: row[2],
    quantity: row[3],
    expiryDate: row[6],
    daysUntilExpiry: Math.ceil((new Date(row[6]) - today) / (24 * 60 * 60 * 1000)),
    supplier: row[5]
  }));
}

/**
 * Search inventory items
 */
function searchInventoryItems(searchTerm) {
  if (!hasPermission('view_inventory')) {
    throw new Error('Access denied');
  }
  
  const data = getSheetData(CONFIG.SHEETS.INVENTORY);
  const term = searchTerm.toLowerCase();
  
  return data.filter(row => {
    return (row[0] && row[0].toLowerCase().includes(term)) || // SKU
           (row[1] && row[1].toLowerCase().includes(term)) || // Product Name
           (row[2] && row[2].toLowerCase().includes(term)) || // Category
           (row[5] && row[5].toLowerCase().includes(term));   // Supplier
  }).map((row, index) => ({
    rowIndex: index + 2,
    sku: row[0],
    productName: row[1],
    category: row[2],
    quantity: row[3],
    unitPrice: row[4],
    supplier: row[5],
    expiryDate: row[6],
    minStockLevel: row[7],
    lastUpdated: row[8],
    lastUpdatedBy: row[9]
  }));
}

/**
 * Get inventory statistics
 */
function getInventoryStats() {
  if (!hasPermission('view_inventory')) {
    throw new Error('Access denied');
  }
  
  const data = getSheetData(CONFIG.SHEETS.INVENTORY);
  
  const stats = {
    totalItems: data.length,
    totalValue: 0,
    lowStockItems: 0,
    expiredItems: 0,
    categoryCounts: {},
    averagePrice: 0
  };
  
  const today = new Date();
  let totalPrices = 0;
  let priceCount = 0;
  
  data.forEach(row => {
    const quantity = row[3] || 0;
    const unitPrice = row[4] || 0;
    const minStock = row[7] || 0;
    const expiryDate = row[6];
    const category = row[2] || 'Uncategorized';
    
    // Total value
    stats.totalValue += quantity * unitPrice;
    
    // Average price calculation
    if (unitPrice > 0) {
      totalPrices += unitPrice;
      priceCount++;
    }
    
    // Low stock check
    if (quantity <= minStock && minStock > 0) {
      stats.lowStockItems++;
    }
    
    // Expired items check
    if (expiryDate && new Date(expiryDate) <= today) {
      stats.expiredItems++;
    }
    
    // Category counts
    stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;
  });
  
  stats.averagePrice = priceCount > 0 ? totalPrices / priceCount : 0;
  
  return stats;
}