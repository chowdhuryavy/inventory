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
    STOCK_LOG: 'Stock_log',
    ACTIVITY_LOG: 'Activity_log',
    REPORTS: 'Reports',
    SETTINGS: 'Settings'
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
  const ui = SpreadsheetApp.getUi();
  
  // Main Inventory System Menu
  ui.createMenu('📦 Inventory System')
    .addItem('🚀 Initialize System', 'initializeSystem')
    .addItem('👤 Current User Role', 'showCurrentUserRole')
    .addSeparator()
    .addItem('📊 Dashboard', 'showDashboard')
    .addItem('📋 Inventory Manager', 'showInventoryManager')
    .addItem('👥 User Manager', 'showUserManager')
    .addItem('📈 Reports', 'showReports')
    .addSeparator()
    .addItem('🌐 Open Web App', 'openWebApp')
    .addToUi();
    
  // Sheet Setup Menu
  ui.createMenu('🔧 Sheet Setup')
    .addItem('📋 Check Current Sheets', 'checkCurrentSheets')
    .addItem('🚀 Setup Your Exact Sheets', 'setupYourExactSheets')
    .addSeparator()
    .addItem('🧹 Clean Start (Delete All)', 'cleanStart')
    .addItem('📖 Show Setup Guide', 'showSetupGuide')
    .addToUi();
    
  // Company Settings Menu
  ui.createMenu('⚙️ Company Settings')
    .addItem('👁️ Show Current Settings', 'showCurrentSettings')
    .addItem('🔍 Debug Settings Data', 'debugSettings')
    .addItem('🧪 Test Settings Sheet', 'testSettingsSheet')
    .addSeparator()
    .addItem('🏢 Manage Settings', 'showSettingsManager')
    .addItem('➕ Create Settings Sheet', 'createSettingsSheetIfNeeded')
    .addItem('🔄 Reset to Default', 'resetSettingsToDefault')
    .addToUi();
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
    createSettingsSheet(ss);
    
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
 * Create Inventory sheet with proper headers (matching your structure)
 */
function createInventorySheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.INVENTORY);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.INVENTORY);
  }
  
  // Clear existing content and set headers to match your structure
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
 * Create Users sheet with proper headers (matching your structure)
 */
function createUsersSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.USERS);
  }
  
  sheet.clear();
  const headers = ['Email', 'Name', 'Password', 'Role', 'Status', 'Date Added'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Format date column
  sheet.getRange('F:F').setNumberFormat('MM/dd/yyyy hh:mm');
  
  return sheet;
}

/**
 * Create Stock Log sheet with proper headers (matching your structure)
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
  sheet.getRange('A:A').setNumberFormat('MM/dd/yyyy hh:mm:ss'); // Timestamp
  sheet.getRange('E:E').setNumberFormat('#,##0'); // Quantity column
  
  return sheet;
}

/**
 * Create Activity Log sheet with proper headers (matching your structure)
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
  
  // Set column widths for better readability
  sheet.setColumnWidth(1, 150); // Timestamp
  sheet.setColumnWidth(2, 200); // User Email
  sheet.setColumnWidth(3, 150); // Action
  sheet.setColumnWidth(4, 400); // Description
  
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
 * Create Settings sheet with company information
 */
function createSettingsSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.SETTINGS);
  }
  
  sheet.clear();
  const headers = ['Company Name', 'Slogan', 'Logo'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Add default company settings
  const defaultSettings = [
    'Your Company Name',
    'Professional Inventory Management',
    '📦' // Default logo emoji
  ];
  
  sheet.getRange(2, 1, 1, defaultSettings.length).setValues([defaultSettings]);
  
  // Format columns
  sheet.setColumnWidth(1, 200); // Company Name
  sheet.setColumnWidth(2, 300); // Slogan
  sheet.setColumnWidth(3, 100); // Logo
  
  return sheet;
}

/**
 * Setup initial Super Admin user (updated for your sheet structure)
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
    currentUserEmail,           // Email
    'System Administrator',     // Name
    'admin123',                // Default Password (user can change)
    CONFIG.ROLES.SUPER_ADMIN,  // Role
    'Active',                  // Status
    new Date()                 // Date Added
  ];
  
  usersSheet.getRange(2, 1, 1, newUser.length).setValues([newUser]);
}

/**
 * Get current user's role (updated for your sheet structure)
 */
function getCurrentUserRole() {
  try {
    const currentUserEmail = Session.getActiveUser().getEmail();
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
    
    if (!usersSheet) return null;
    
    const lastRow = usersSheet.getLastRow();
    if (lastRow < 2) return null;
    
    const data = usersSheet.getRange(2, 1, lastRow - 1, 6).getValues();
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === currentUserEmail && data[i][4] === 'Active') {
        return data[i][3]; // Return role (column D)
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
 * Log user activity (updated for your sheet structure)
 */
function logActivity(action, description) {
  try {
    const activitySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.ACTIVITY_LOG);
    const currentUserEmail = Session.getActiveUser().getEmail();
    
    // Format: Timestamp, User Email, Action, Description
    const logEntry = [
      new Date(),        // Timestamp
      currentUserEmail,  // User Email
      action,           // Action
      description       // Description
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
 * Get company settings from Settings sheet
 */
function getCompanySettings() {
  try {
    console.log('Getting company settings...');
    
    // First try with CONFIG.SHEETS.SETTINGS, then fallback to 'Settings'
    let settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.SETTINGS);
    if (!settingsSheet) {
      settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
    }
    
    console.log('Settings sheet found:', !!settingsSheet);
    
    if (!settingsSheet) {
      console.log('No Settings sheet found, using defaults');
      return {
        companyName: 'Inventory System',
        slogan: 'Professional Inventory Management',
        logo: '📦'
      };
    }
    
    const lastRow = settingsSheet.getLastRow();
    console.log('Settings sheet last row:', lastRow);
    
    if (lastRow < 2) {
      console.log('No data in Settings sheet, using defaults');
      return {
        companyName: 'Inventory System',
        slogan: 'Professional Inventory Management',
        logo: '📦'
      };
    }
    
    // Get settings data from row 2
    const data = settingsSheet.getRange(2, 1, 1, 3).getValues()[0];
    console.log('Settings data from sheet:', data);
    
    const settings = {
      companyName: data[0] && data[0].toString().trim() ? data[0].toString().trim() : 'Inventory System',
      slogan: data[1] && data[1].toString().trim() ? data[1].toString().trim() : 'Professional Inventory Management',
      logo: data[2] && data[2].toString().trim() ? data[2].toString().trim() : '📦'
    };
    
    console.log('Processed settings:', settings);
    return settings;
    
  } catch (error) {
    console.error('Error getting company settings:', error);
    return {
      companyName: 'Inventory System',
      slogan: 'Professional Inventory Management',
      logo: '📦'
    };
  }
}

/**
 * Show current user role
 */
function showCurrentUserRole() {
  const role = getCurrentUserRole();
  const email = Session.getActiveUser().getEmail();
  
  SpreadsheetApp.getUi().alert(
    'Current User Role',
    `Email: ${email}\nRole: ${role}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Show dashboard (legacy function for menu)
 */
function showDashboard() {
  SpreadsheetApp.getUi().alert(
    'Web Dashboard',
    'Please use the web application for the full dashboard experience.\n\nClick "Open Web App" from the menu or deploy the script as a web app.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Open web app URL
 */
function openWebApp() {
  const url = ScriptApp.getService().getUrl();
  if (url) {
    const template = HtmlService.createTemplate(`
      <p>Your web app URL is:</p>
      <p><a href="<?= url ?>" target="_blank"><?= url ?></a></p>
      <p>Click the link above to open your inventory management system.</p>
      <script>
        setTimeout(function() {
          window.open('<?= url ?>', '_blank');
        }, 2000);
      </script>
    `);
    template.url = url;
    
    const htmlOutput = template.evaluate()
      .setWidth(400)
      .setHeight(200)
      .setTitle('Web App URL');
      
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Open Web App');
  } else {
    SpreadsheetApp.getUi().alert(
      'Web App Not Deployed',
      'Please deploy this script as a web app first.\n\nGo to Deploy > New Deployment > Web app',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Test function to ensure Settings sheet exists and has proper data
 */
function testSettingsSheet() {
  try {
    console.log('Testing Settings sheet...');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let settingsSheet = ss.getSheetByName('Settings');
    
    if (!settingsSheet) {
      console.log('Settings sheet not found, creating it...');
      settingsSheet = createSettingsSheet(ss);
    }
    
    const lastRow = settingsSheet.getLastRow();
    console.log('Settings sheet last row:', lastRow);
    
    if (lastRow < 2) {
      console.log('Adding default data to Settings sheet...');
      const defaultData = ['My Company', 'Professional Inventory Management', '🏢'];
      settingsSheet.getRange(2, 1, 1, 3).setValues([defaultData]);
    }
    
    // Test getCompanySettings function
    const settings = getCompanySettings();
    console.log('Final settings test result:', settings);
    
    SpreadsheetApp.getUi().alert(
      'Settings Test Complete',
      `Settings sheet test completed!\n\n` +
      `Company Name: ${settings.companyName}\n` +
      `Slogan: ${settings.slogan}\n` +
      `Logo: ${settings.logo}\n\n` +
      `These settings will now appear in your web app.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return settings;
    
  } catch (error) {
    console.error('Error in testSettingsSheet:', error);
    SpreadsheetApp.getUi().alert('Settings Test Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
    return null;
  }
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