/**
 * Initialize System with Your Exact Sheet Structure
 */

function initializeWithYourStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    // Create Inventory Sheet
    let inventorySheet = ss.getSheetByName('Inventory');
    if (!inventorySheet) {
      inventorySheet = ss.insertSheet('Inventory');
    }
    inventorySheet.clear();
    inventorySheet.getRange('A1:J1').setValues([[
      'SKU', 'Product Name', 'Category', 'Quantity', 'Unit Price', 
      'Supplier', 'Expiry Date', 'Min Stock Level', 'Last Updated', 'Last Updated By'
    ]]);
    inventorySheet.getRange('A1:J1').setFontWeight('bold');
    
    // Create Users Sheet
    let usersSheet = ss.getSheetByName('Users');
    if (!usersSheet) {
      usersSheet = ss.insertSheet('Users');
    }
    usersSheet.clear();
    usersSheet.getRange('A1:F1').setValues([[
      'Email', 'Name', 'Password', 'Role', 'Status', 'Date Added'
    ]]);
    usersSheet.getRange('A1:F1').setFontWeight('bold');
    
    // Add initial Super Admin
    usersSheet.getRange('A2:F2').setValues([[
      Session.getActiveUser().getEmail(),
      'System Administrator',
      'admin123',
      'Super Admin',
      'Active',
      new Date()
    ]]);
    
    // Create Stock_log Sheet
    let stockLogSheet = ss.getSheetByName('Stock_log');
    if (!stockLogSheet) {
      stockLogSheet = ss.insertSheet('Stock_log');
    }
    stockLogSheet.clear();
    stockLogSheet.getRange('A1:G1').setValues([[
      'Timestamp', 'SKU', 'Product Name', 'Action', 'Quantity', 'Updated By', 'Remarks'
    ]]);
    stockLogSheet.getRange('A1:G1').setFontWeight('bold');
    
    // Create Activity_log Sheet
    let activityLogSheet = ss.getSheetByName('Activity_log');
    if (!activityLogSheet) {
      activityLogSheet = ss.insertSheet('Activity_log');
    }
    activityLogSheet.clear();
    activityLogSheet.getRange('A1:D1').setValues([[
      'Timestamp', 'User Email', 'Action', 'Description'
    ]]);
    activityLogSheet.getRange('A1:D1').setFontWeight('bold');
    
    // Create Reports Sheet
    let reportsSheet = ss.getSheetByName('Reports');
    if (!reportsSheet) {
      reportsSheet = ss.insertSheet('Reports');
    }
    reportsSheet.clear();
    reportsSheet.getRange('A1').setValue('Reports will be generated here');
    
    // Format date/time columns
    inventorySheet.getRange('I:I').setNumberFormat('MM/dd/yyyy hh:mm');
    usersSheet.getRange('F:F').setNumberFormat('MM/dd/yyyy hh:mm');
    stockLogSheet.getRange('A:A').setNumberFormat('MM/dd/yyyy hh:mm:ss');
    activityLogSheet.getRange('A:A').setNumberFormat('MM/dd/yyyy hh:mm:ss');
    
    // Format number columns
    inventorySheet.getRange('D:D').setNumberFormat('#,##0'); // Quantity
    inventorySheet.getRange('E:E').setNumberFormat('$#,##0.00'); // Price
    inventorySheet.getRange('H:H').setNumberFormat('#,##0'); // Min Stock
    stockLogSheet.getRange('E:E').setNumberFormat('#,##0'); // Quantity
    
    // Format date columns
    inventorySheet.getRange('G:G').setNumberFormat('MM/dd/yyyy'); // Expiry Date
    
    // Log the initialization
    activityLogSheet.appendRow([
      new Date(),
      Session.getActiveUser().getEmail(),
      'System Initialization',
      'System initialized with your exact sheet structure'
    ]);
    
    SpreadsheetApp.getUi().alert(
      'System Initialized!',
      'Your inventory management system has been set up with the exact structure you specified:\n\n' +
      '✓ Inventory - with all your columns\n' +
      '✓ Users - including Password column\n' +
      '✓ Stock_log - with Timestamp first\n' +
      '✓ Activity_log - simple 4-column structure\n' +
      '✓ Reports - empty and ready\n\n' +
      'Default login:\n' +
      'Email: ' + Session.getActiveUser().getEmail() + '\n' +
      'Password: admin123\n\n' +
      'You can now deploy as a web app!',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return {
      success: true,
      message: 'System initialized with your exact structure'
    };
    
  } catch (error) {
    console.error('Error initializing system:', error);
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Add a sample inventory item for testing
 */
function addSampleData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const inventorySheet = ss.getSheetByName('Inventory');
    const stockLogSheet = ss.getSheetByName('Stock_log');
    const activityLogSheet = ss.getSheetByName('Activity_log');
    
    // Add sample inventory item
    inventorySheet.appendRow([
      'MILK001',
      'Whole Milk 1L',
      'Dairy',
      50,
      2.99,
      'ABC Dairy Farm',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      10,
      new Date(),
      Session.getActiveUser().getEmail()
    ]);
    
    // Log the stock addition
    stockLogSheet.appendRow([
      new Date(),
      'MILK001',
      'Whole Milk 1L',
      'Stock In',
      50,
      Session.getActiveUser().getEmail(),
      'Initial stock - sample data'
    ]);
    
    // Log the activity
    activityLogSheet.appendRow([
      new Date(),
      Session.getActiveUser().getEmail(),
      'Add Sample Data',
      'Added sample inventory item: Whole Milk 1L (MILK001)'
    ]);
    
    SpreadsheetApp.getUi().alert(
      'Sample Data Added!',
      'Added sample inventory item:\n\n' +
      '• SKU: MILK001\n' +
      '• Product: Whole Milk 1L\n' +
      '• Category: Dairy\n' +
      '• Quantity: 50\n' +
      '• Price: $2.99\n\n' +
      'Check the Inventory, Stock_log, and Activity_log sheets!',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    console.error('Error adding sample data:', error);
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
}

/**
 * Menu function for easy access
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Setup Inventory System')
    .addItem('Initialize with Your Structure', 'initializeWithYourStructure')
    .addItem('Add Sample Data', 'addSampleData')
    .addSeparator()
    .addItem('Deploy Web App Guide', 'showDeploymentGuide')
    .addToUi();
}

/**
 * Show deployment guide
 */
function showDeploymentGuide() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    '🌐 Web App Deployment Guide',
    'To deploy your inventory system as a web app:\n\n' +
    '1. Go to Extensions > Apps Script\n' +
    '2. Copy all the .gs and .html files from the workspace\n' +
    '3. Click Deploy > New Deployment\n' +
    '4. Type: Web app\n' +
    '5. Execute as: Me\n' +
    '6. Who has access: Anyone\n' +
    '7. Click Deploy\n' +
    '8. Copy the web app URL\n' +
    '9. Share URL with your team\n\n' +
    'Default login:\n' +
    'Email: ' + Session.getActiveUser().getEmail() + '\n' +
    'Password: admin123\n\n' +
    'Users access via web browser - no Google Sheet access needed!',
    ui.ButtonSet.OK
  );
}