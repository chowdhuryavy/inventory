/**
 * Reports and Dashboard Functions
 * Generates various reports and analytics for the inventory system
 */

/**
 * Show dashboard interface
 */
function showDashboard() {
  if (!hasPermission('view_reports')) {
    SpreadsheetApp.getUi().alert('Access Denied', 'You do not have permission to view the dashboard.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  const html = HtmlService.createTemplateFromFile('Dashboard');
  html.userRole = getCurrentUserRole();
  html.dashboardData = getDashboardData();
  
  const htmlOutput = html.evaluate()
    .setWidth(1000)
    .setHeight(700)
    .setTitle('Inventory Dashboard');
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Inventory Dashboard');
}

/**
 * Show reports interface
 */
function showReports() {
  if (!hasPermission('view_reports')) {
    SpreadsheetApp.getUi().alert('Access Denied', 'You do not have permission to view reports.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  const html = HtmlService.createTemplateFromFile('Reports');
  html.userRole = getCurrentUserRole();
  
  const htmlOutput = html.evaluate()
    .setWidth(900)
    .setHeight(650)
    .setTitle('Reports');
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Reports');
}

/**
 * Show logs interface
 */
function showLogs() {
  if (!hasPermission('view_logs')) {
    SpreadsheetApp.getUi().alert('Access Denied', 'You do not have permission to view logs.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  const html = HtmlService.createTemplateFromFile('Logs');
  html.userRole = getCurrentUserRole();
  
  const htmlOutput = html.evaluate()
    .setWidth(900)
    .setHeight(600)
    .setTitle('Activity & Stock Logs');
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Logs');
}

/**
 * Get comprehensive dashboard data
 */
function getDashboardData() {
  if (!hasPermission('view_reports')) {
    throw new Error('Access denied');
  }
  
  const inventoryStats = getInventoryStats();
  const lowStockItems = getLowStockItems();
  const expiredItems = getExpiredItems();
  const expiringSoonItems = getExpiringSoonItems();
  const recentActivities = getRecentActivities(10);
  const recentStockChanges = getRecentStockChanges(10);
  
  return {
    stats: inventoryStats,
    alerts: {
      lowStock: lowStockItems,
      expired: expiredItems,
      expiringSoon: expiringSoonItems
    },
    recentActivities: recentActivities,
    recentStockChanges: recentStockChanges,
    generatedAt: new Date()
  };
}

/**
 * Generate inventory summary report
 */
function generateInventorySummaryReport() {
  if (!hasPermission('view_reports')) {
    throw new Error('Access denied');
  }
  
  const inventoryData = getSheetData(CONFIG.SHEETS.INVENTORY);
  const summary = {
    totalItems: inventoryData.length,
    totalValue: 0,
    categories: {},
    suppliers: {},
    stockLevels: {
      sufficient: 0,
      low: 0,
      outOfStock: 0
    },
    expiryStatus: {
      fresh: 0,
      expiringSoon: 0,
      expired: 0
    }
  };
  
  const today = new Date();
  const warningDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
  
  inventoryData.forEach(row => {
    const category = row[2] || 'Uncategorized';
    const quantity = row[3] || 0;
    const unitPrice = row[4] || 0;
    const supplier = row[5] || 'Unknown';
    const expiryDate = row[6];
    const minStock = row[7] || 0;
    
    // Total value calculation
    summary.totalValue += quantity * unitPrice;
    
    // Category distribution
    summary.categories[category] = (summary.categories[category] || 0) + 1;
    
    // Supplier distribution
    summary.suppliers[supplier] = (summary.suppliers[supplier] || 0) + 1;
    
    // Stock level analysis
    if (quantity === 0) {
      summary.stockLevels.outOfStock++;
    } else if (quantity <= minStock && minStock > 0) {
      summary.stockLevels.low++;
    } else {
      summary.stockLevels.sufficient++;
    }
    
    // Expiry analysis
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry <= today) {
        summary.expiryStatus.expired++;
      } else if (expiry <= warningDate) {
        summary.expiryStatus.expiringSoon++;
      } else {
        summary.expiryStatus.fresh++;
      }
    } else {
      summary.expiryStatus.fresh++;
    }
  });
  
  return summary;
}

/**
 * Generate stock movement report
 */
function generateStockMovementReport(startDate, endDate) {
  if (!hasPermission('view_reports')) {
    throw new Error('Access denied');
  }
  
  const stockLogData = getSheetData(CONFIG.SHEETS.STOCK_LOG);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const movements = stockLogData.filter(row => {
    const timestamp = new Date(row[0]);
    return timestamp >= start && timestamp <= end;
  });
  
  const report = {
    period: { start: startDate, end: endDate },
    totalMovements: movements.length,
    stockIn: {
      transactions: 0,
      totalQuantity: 0,
      items: {}
    },
    stockOut: {
      transactions: 0,
      totalQuantity: 0,
      items: {}
    },
    topItems: {},
    userActivity: {}
  };
  
  movements.forEach(row => {
    const action = row[3];
    const quantity = row[4] || 0;
    const sku = row[1];
    const productName = row[2];
    const user = row[5];
    
    // Track user activity
    report.userActivity[user] = (report.userActivity[user] || 0) + 1;
    
    // Track item movements
    const itemKey = `${sku} - ${productName}`;
    if (!report.topItems[itemKey]) {
      report.topItems[itemKey] = { stockIn: 0, stockOut: 0, totalMovements: 0 };
    }
    
    if (action === 'Stock In') {
      report.stockIn.transactions++;
      report.stockIn.totalQuantity += quantity;
      report.stockIn.items[itemKey] = (report.stockIn.items[itemKey] || 0) + quantity;
      report.topItems[itemKey].stockIn += quantity;
    } else if (action === 'Stock Out') {
      report.stockOut.transactions++;
      report.stockOut.totalQuantity += quantity;
      report.stockOut.items[itemKey] = (report.stockOut.items[itemKey] || 0) + quantity;
      report.topItems[itemKey].stockOut += quantity;
    }
    
    report.topItems[itemKey].totalMovements++;
  });
  
  return report;
}

/**
 * Generate low stock report
 */
function generateLowStockReport() {
  if (!hasPermission('view_reports')) {
    throw new Error('Access denied');
  }
  
  const lowStockItems = getLowStockItems();
  const report = {
    generatedAt: new Date(),
    totalLowStockItems: lowStockItems.length,
    items: lowStockItems,
    categorizedItems: {},
    supplierBreakdown: {}
  };
  
  lowStockItems.forEach(item => {
    const category = item.category || 'Uncategorized';
    const supplier = item.supplier || 'Unknown';
    
    if (!report.categorizedItems[category]) {
      report.categorizedItems[category] = [];
    }
    report.categorizedItems[category].push(item);
    
    if (!report.supplierBreakdown[supplier]) {
      report.supplierBreakdown[supplier] = [];
    }
    report.supplierBreakdown[supplier].push(item);
  });
  
  return report;
}

/**
 * Generate expiry report
 */
function generateExpiryReport() {
  if (!hasPermission('view_reports')) {
    throw new Error('Access denied');
  }
  
  const expiredItems = getExpiredItems();
  const expiringSoonItems = getExpiringSoonItems();
  
  const report = {
    generatedAt: new Date(),
    expired: {
      count: expiredItems.length,
      items: expiredItems,
      totalValue: 0
    },
    expiringSoon: {
      count: expiringSoonItems.length,
      items: expiringSoonItems,
      totalValue: 0
    }
  };
  
  // Calculate total value of expired items
  const inventoryData = getSheetData(CONFIG.SHEETS.INVENTORY);
  const inventoryMap = {};
  inventoryData.forEach(row => {
    inventoryMap[row[0]] = { // SKU as key
      quantity: row[3] || 0,
      unitPrice: row[4] || 0
    };
  });
  
  expiredItems.forEach(item => {
    if (inventoryMap[item.sku]) {
      report.expired.totalValue += inventoryMap[item.sku].quantity * inventoryMap[item.sku].unitPrice;
    }
  });
  
  expiringSoonItems.forEach(item => {
    if (inventoryMap[item.sku]) {
      report.expiringSoon.totalValue += inventoryMap[item.sku].quantity * inventoryMap[item.sku].unitPrice;
    }
  });
  
  return report;
}

/**
 * Generate user activity report
 */
function generateUserActivityReport(startDate, endDate) {
  if (!hasPermission('view_reports')) {
    throw new Error('Access denied');
  }
  
  const activityData = getSheetData(CONFIG.SHEETS.ACTIVITY_LOG);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const activities = activityData.filter(row => {
    const timestamp = new Date(row[0]);
    return timestamp >= start && timestamp <= end;
  });
  
  const report = {
    period: { start: startDate, end: endDate },
    totalActivities: activities.length,
    userBreakdown: {},
    actionBreakdown: {},
    dailyActivity: {},
    hourlyDistribution: {}
  };
  
  activities.forEach(row => {
    const timestamp = new Date(row[0]);
    const userEmail = row[1];
    const action = row[2];
    const day = timestamp.toDateString();
    const hour = timestamp.getHours();
    
    // User activity breakdown
    if (!report.userBreakdown[userEmail]) {
      report.userBreakdown[userEmail] = { total: 0, actions: {} };
    }
    report.userBreakdown[userEmail].total++;
    report.userBreakdown[userEmail].actions[action] = (report.userBreakdown[userEmail].actions[action] || 0) + 1;
    
    // Action breakdown
    report.actionBreakdown[action] = (report.actionBreakdown[action] || 0) + 1;
    
    // Daily activity
    report.dailyActivity[day] = (report.dailyActivity[day] || 0) + 1;
    
    // Hourly distribution
    report.hourlyDistribution[hour] = (report.hourlyDistribution[hour] || 0) + 1;
  });
  
  return report;
}

/**
 * Get recent activities
 */
function getRecentActivities(limit = 50) {
  if (!hasPermission('view_logs')) {
    throw new Error('Access denied');
  }
  
  const activityData = getSheetData(CONFIG.SHEETS.ACTIVITY_LOG);
  return activityData
    .sort((a, b) => new Date(b[0]) - new Date(a[0])) // Sort by timestamp descending
    .slice(0, limit)
    .map(row => ({
      timestamp: row[0],
      userEmail: row[1],
      action: row[2],
      description: row[3]
    }));
}

/**
 * Get recent stock changes
 */
function getRecentStockChanges(limit = 50) {
  if (!hasPermission('view_logs')) {
    throw new Error('Access denied');
  }
  
  const stockData = getSheetData(CONFIG.SHEETS.STOCK_LOG);
  return stockData
    .sort((a, b) => new Date(b[0]) - new Date(a[0])) // Sort by timestamp descending
    .slice(0, limit)
    .map(row => ({
      timestamp: row[0],
      sku: row[1],
      productName: row[2],
      action: row[3],
      quantity: row[4],
      updatedBy: row[5],
      remarks: row[6]
    }));
}

/**
 * Export report to PDF (placeholder for future implementation)
 */
function exportReportToPDF(reportType, reportData) {
  // This would be implemented using Google Apps Script's document creation capabilities
  // For now, return a message indicating this feature is coming soon
  return {
    success: false,
    message: 'PDF export feature coming soon. Please use the print function in your browser for now.'
  };
}

/**
 * Send report via email
 */
function sendReportEmail(reportType, recipientEmail, reportData) {
  if (!hasPermission('view_reports')) {
    throw new Error('Access denied');
  }
  
  try {
    const subject = `Inventory ${reportType} Report - ${new Date().toLocaleDateString()}`;
    let body = `Dear User,\n\nPlease find the ${reportType} report below:\n\n`;
    
    switch (reportType) {
      case 'Inventory Summary':
        body += formatInventorySummaryEmail(reportData);
        break;
      case 'Low Stock':
        body += formatLowStockEmail(reportData);
        break;
      case 'Expiry':
        body += formatExpiryEmail(reportData);
        break;
      default:
        body += JSON.stringify(reportData, null, 2);
    }
    
    body += '\n\nThis report was generated automatically by the Inventory Management System.';
    
    GmailApp.sendEmail(recipientEmail, subject, body);
    
    logActivity('Email Report', `Sent ${reportType} report to ${recipientEmail}`);
    
    return { success: true, message: 'Report sent successfully' };
    
  } catch (error) {
    console.error('Error sending report email:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Format inventory summary for email
 */
function formatInventorySummaryEmail(data) {
  let content = `INVENTORY SUMMARY REPORT\n`;
  content += `Generated: ${new Date().toLocaleString()}\n\n`;
  content += `📊 OVERVIEW:\n`;
  content += `• Total Items: ${data.totalItems}\n`;
  content += `• Total Inventory Value: $${data.totalValue.toFixed(2)}\n`;
  content += `• Average Item Price: $${data.averagePrice.toFixed(2)}\n\n`;
  
  content += `⚠️ ALERTS:\n`;
  content += `• Low Stock Items: ${data.lowStockItems}\n`;
  content += `• Expired Items: ${data.expiredItems}\n\n`;
  
  content += `📦 CATEGORIES:\n`;
  Object.entries(data.categoryCounts).forEach(([category, count]) => {
    content += `• ${category}: ${count} items\n`;
  });
  
  return content;
}

/**
 * Format low stock report for email
 */
function formatLowStockEmail(data) {
  let content = `LOW STOCK ALERT REPORT\n`;
  content += `Generated: ${data.generatedAt.toLocaleString()}\n\n`;
  content += `⚠️ ITEMS REQUIRING ATTENTION: ${data.totalLowStockItems}\n\n`;
  
  data.items.forEach(item => {
    content += `• ${item.productName} (${item.sku})\n`;
    content += `  Current Stock: ${item.quantity} | Minimum: ${item.minStockLevel}\n`;
    content += `  Category: ${item.category} | Supplier: ${item.supplier}\n\n`;
  });
  
  return content;
}

/**
 * Format expiry report for email
 */
function formatExpiryEmail(data) {
  let content = `EXPIRY ALERT REPORT\n`;
  content += `Generated: ${data.generatedAt.toLocaleString()}\n\n`;
  
  content += `🚨 EXPIRED ITEMS: ${data.expired.count}\n`;
  content += `💰 Total Value at Risk: $${data.expired.totalValue.toFixed(2)}\n\n`;
  
  data.expired.items.forEach(item => {
    content += `• ${item.productName} (${item.sku}) - Expired: ${new Date(item.expiryDate).toLocaleDateString()}\n`;
  });
  
  content += `\n⏰ EXPIRING SOON: ${data.expiringSoon.count}\n`;
  content += `💰 Total Value: $${data.expiringSoon.totalValue.toFixed(2)}\n\n`;
  
  data.expiringSoon.items.forEach(item => {
    content += `• ${item.productName} (${item.sku}) - Expires in ${item.daysUntilExpiry} days\n`;
  });
  
  return content;
}

/**
 * Generate custom report based on filters
 */
function generateCustomReport(filters) {
  if (!hasPermission('view_reports')) {
    throw new Error('Access denied');
  }
  
  const inventoryData = getSheetData(CONFIG.SHEETS.INVENTORY);
  let filteredData = inventoryData;
  
  // Apply filters
  if (filters.category && filters.category !== 'All') {
    filteredData = filteredData.filter(row => row[2] === filters.category);
  }
  
  if (filters.supplier && filters.supplier !== 'All') {
    filteredData = filteredData.filter(row => row[5] === filters.supplier);
  }
  
  if (filters.stockLevel) {
    filteredData = filteredData.filter(row => {
      const quantity = row[3] || 0;
      const minStock = row[7] || 0;
      
      switch (filters.stockLevel) {
        case 'low': return quantity <= minStock && minStock > 0;
        case 'sufficient': return quantity > minStock;
        case 'outOfStock': return quantity === 0;
        default: return true;
      }
    });
  }
  
  return {
    filters: filters,
    items: filteredData.map((row, index) => ({
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
    })),
    summary: {
      totalItems: filteredData.length,
      totalValue: filteredData.reduce((sum, row) => sum + ((row[3] || 0) * (row[4] || 0)), 0)
    }
  };
}