/**
 * Inventory Management System for Grocery Store
 * Google Apps Script + Google Sheets Backend
 * 
 * Main initialization and utility functions
 */

// Global configuration
const CONFIG = {
  SHEETS: {
    INVENTORY: 'Inventory',
    USERS: 'Users', 
    STOCK_LOG: 'Stock_Log',
    ACTIVITY_LOG: 'Activity_Log',
    REPORTS: 'Reports'
  },
  ROLES: {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin', 
    CASHIER: 'Cashier'
  },
  EMAIL_SETTINGS: {
    LOW_STOCK_THRESHOLD: 5, // Days before notification
    EXPIRY_WARNING_DAYS: 7
  }
};

/**
 * Initialize the spreadsheet with required sheets and headers
 * Uses enhanced authentication system
 */
function onOpen() {
  // Use the enhanced authentication system
  onOpenWithAuth();
}

/**
 * Initialize the system - create sheets and setup initial data
 */
function initializeSystem() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Create required sheets
    createInventorySheet(ss);
    createUsersSheet(ss);
    createStockLogSheet(ss);
    createActivityLogSheet(ss);
    createReportsSheet(ss);
    
    // Add initial Super Admin if no users exist
    setupInitialSuperAdmin();
    
    // Log initialization
    logActivity('System Initialization', 'System initialized successfully');
    
    SpreadsheetApp.getUi().alert(
      'System Initialized!',
      'The inventory management system has been set up successfully. ' +
      'Please refresh the page to see the menu options.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    console.error('Error initializing system:', error);
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
}

/**
 * Create Inventory sheet with proper headers
 */
function createInventorySheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.INVENTORY);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.INVENTORY);
  }
  
  // Clear existing content and set headers
  sheet.clear();
  const headers = [
    'SKU', 'Product Name', 'Category', 'Quantity', 'Unit Price', 
    'Supplier', 'Expiry Date', 'Min Stock Level', 'Last Updated', 'Last Updated By'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Format columns
  sheet.getRange('D:D').setNumberFormat('#,##0'); // Quantity
  sheet.getRange('E:E').setNumberFormat('$#,##0.00'); // Price
  sheet.getRange('G:G').setNumberFormat('MM/dd/yyyy'); // Expiry Date
  sheet.getRange('H:H').setNumberFormat('#,##0'); // Min Stock
  sheet.getRange('I:I').setNumberFormat('MM/dd/yyyy hh:mm'); // Last Updated
  
  return sheet;
}

/**
 * Create Users sheet with proper headers
 */
function createUsersSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.USERS);
  }
  
  sheet.clear();
  const headers = ['Email', 'Name', 'Role', 'Status', 'Date Added'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Format date column
  sheet.getRange('E:E').setNumberFormat('MM/dd/yyyy hh:mm');
  
  return sheet;
}

/**
 * Create Stock Log sheet with proper headers
 */
function createStockLogSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.STOCK_LOG);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.STOCK_LOG);
  }
  
  sheet.clear();
  const headers = [
    'Timestamp', 'SKU', 'Product Name', 'Action', 'Quantity', 'Updated By', 'Remarks'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Format columns
  sheet.getRange('A:A').setNumberFormat('MM/dd/yyyy hh:mm:ss');
  sheet.getRange('E:E').setNumberFormat('#,##0');
  
  return sheet;
}

/**
 * Create Activity Log sheet with proper headers
 */
function createActivityLogSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVITY_LOG);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.ACTIVITY_LOG);
  }
  
  sheet.clear();
  const headers = ['Timestamp', 'User Email', 'Action', 'Description'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Format timestamp column
  sheet.getRange('A:A').setNumberFormat('MM/dd/yyyy hh:mm:ss');
  
  return sheet;
}

/**
 * Create Reports sheet
 */
function createReportsSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.REPORTS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.REPORTS);
  }
  
  sheet.clear();
  sheet.getRange('A1').setValue('Reports will be generated dynamically');
  
  return sheet;
}

/**
 * Setup initial Super Admin user
 */
function setupInitialSuperAdmin() {
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
  const lastRow = usersSheet.getLastRow();
  
  // Check if any users already exist
  if (lastRow > 1) {
    return; // Users already exist
  }
  
  const currentUserEmail = Session.getActiveUser().getEmail();
  const newUser = [
    currentUserEmail,
    'System Administrator',
    CONFIG.ROLES.SUPER_ADMIN,
    'Active',
    new Date()
  ];
  
  usersSheet.getRange(2, 1, 1, newUser.length).setValues([newUser]);
}

/**
 * Get current user's role
 */
function getCurrentUserRole() {
  try {
    const currentUserEmail = Session.getActiveUser().getEmail();
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
    
    if (!usersSheet) return null;
    
    const lastRow = usersSheet.getLastRow();
    if (lastRow < 2) return null;
    
    const data = usersSheet.getRange(2, 1, lastRow - 1, 4).getValues();
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === currentUserEmail && data[i][3] === 'Active') {
        return data[i][2]; // Return role
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if user has permission for specific action
 */
function hasPermission(action) {
  const userRole = getCurrentUserRole();
  if (!userRole) return false;
  
  const permissions = {
    'view_inventory': [CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN, CONFIG.ROLES.CASHIER],
    'add_inventory': [CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN, CONFIG.ROLES.CASHIER],
    'edit_inventory': [CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN, CONFIG.ROLES.CASHIER],
    'delete_inventory': [CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN],
    'manage_users': [CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN],
    'manage_super_admin': [CONFIG.ROLES.SUPER_ADMIN],
    'view_reports': [CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN, CONFIG.ROLES.CASHIER],
    'view_logs': [CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN, CONFIG.ROLES.CASHIER]
  };
  
  return permissions[action] && permissions[action].includes(userRole);
}

/**
 * Log user activity
 */
function logActivity(action, description) {
  try {
    const activitySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.ACTIVITY_LOG);
    const currentUserEmail = Session.getActiveUser().getEmail();
    
    const logEntry = [
      new Date(),
      currentUserEmail,
      action,
      description
    ];
    
    activitySheet.appendRow(logEntry);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Request access for new users
 */
function requestAccess() {
  const ui = SpreadsheetApp.getUi();
  const currentUserEmail = Session.getActiveUser().getEmail();
  
  ui.alert(
    'Access Request',
    `Please contact your system administrator to request access.\n\nYour email: ${currentUserEmail}`,
    ui.ButtonSet.OK
  );
}

/**
 * Utility function to get sheet data as array
 */
function getSheetData(sheetName, hasHeaders = true) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow < (hasHeaders ? 2 : 1)) return [];
  
  const startRow = hasHeaders ? 2 : 1;
  const numRows = lastRow - startRow + 1;
  
  return sheet.getRange(startRow, 1, numRows, lastCol).getValues();
}

/**
 * Utility function to find row by column value
 */
function findRowByColumnValue(sheetName, columnIndex, value) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return -1;
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) { // Start from row 2 (index 1)
    if (data[i][columnIndex] === value) {
      return i + 1; // Return 1-based row number
    }
  }
  
  return -1;
}