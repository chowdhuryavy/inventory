/**
 * Setup Your Exact Sheet Structure
 * Handles existing sheets properly to avoid naming conflicts
 */

function setupYourExactSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    console.log('Starting sheet setup...');
    
    // Sheet configurations with your exact names
    const sheetConfigs = [
      {
        name: 'Inventory',
        headers: ['SKU', 'Product Name', 'Category', 'Quantity', 'Unit Price', 'Supplier', 'Expiry Date', 'Min Stock Level', 'Last Updated', 'Last Updated By']
      },
      {
        name: 'Users', 
        headers: ['Email', 'Name', 'Password', 'Role', 'Status', 'Date Added']
      },
      {
        name: 'Stock_log',
        headers: ['Timestamp', 'SKU', 'Product Name', 'Action', 'Quantity', 'Updated By', 'Remarks']
      },
      {
        name: 'Activity_log',
        headers: ['Timestamp', 'User Email', 'Action', 'Description']
      },
      {
        name: 'Reports',
        headers: ['Report Type', 'Generated On', 'Data']
      },
      {
        name: 'Settings',
        headers: ['Company Name', 'Slogan', 'Logo']
      }
    ];
    
    // Create or update each sheet
    for (const config of sheetConfigs) {
      console.log(`Processing sheet: ${config.name}`);
      
      let sheet = ss.getSheetByName(config.name);
      
      if (!sheet) {
        console.log(`Creating new sheet: ${config.name}`);
        sheet = ss.insertSheet(config.name);
      } else {
        console.log(`Sheet ${config.name} already exists, clearing and updating...`);
      }
      
      // Clear and set up headers
      sheet.clear();
      sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
      sheet.getRange(1, 1, 1, config.headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      
      // Apply specific formatting based on sheet type
      if (config.name === 'Inventory') {
        sheet.getRange('D:D').setNumberFormat('#,##0'); // Quantity
        sheet.getRange('E:E').setNumberFormat('$#,##0.00'); // Price
        sheet.getRange('G:G').setNumberFormat('MM/dd/yyyy'); // Expiry Date
        sheet.getRange('H:H').setNumberFormat('#,##0'); // Min Stock
        sheet.getRange('I:I').setNumberFormat('MM/dd/yyyy hh:mm'); // Last Updated
      } else if (config.name === 'Users') {
        sheet.getRange('F:F').setNumberFormat('MM/dd/yyyy hh:mm'); // Date Added
      } else if (config.name === 'Stock_log') {
        sheet.getRange('A:A').setNumberFormat('MM/dd/yyyy hh:mm:ss'); // Timestamp
        sheet.getRange('E:E').setNumberFormat('#,##0'); // Quantity
      } else if (config.name === 'Activity_log') {
        sheet.getRange('A:A').setNumberFormat('MM/dd/yyyy hh:mm:ss'); // Timestamp
      } else if (config.name === 'Settings') {
        sheet.setColumnWidth(1, 200); // Company Name
        sheet.setColumnWidth(2, 300); // Slogan
        sheet.setColumnWidth(3, 100); // Logo
        
        // Add default settings
        sheet.appendRow([
          'Your Company Name',
          'Professional Inventory Management System',
          '📦'
        ]);
      }
    }
    
    // Add initial Super Admin user
    const usersSheet = ss.getSheetByName('Users');
    const currentEmail = Session.getActiveUser().getEmail();
    
    // Check if user already exists
    const lastRow = usersSheet.getLastRow();
    let userExists = false;
    
    if (lastRow > 1) {
      const existingUsers = usersSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      userExists = existingUsers.some(row => row[0] === currentEmail);
    }
    
    if (!userExists) {
      usersSheet.appendRow([
        currentEmail,           // Email
        'System Administrator', // Name
        'admin123',            // Password
        'Super Admin',         // Role
        'Active',              // Status
        new Date()             // Date Added
      ]);
      console.log('Added Super Admin user');
    } else {
      console.log('Super Admin user already exists');
    }
    
    // Log the setup
    const activitySheet = ss.getSheetByName('Activity_log');
    activitySheet.appendRow([
      new Date(),
      currentEmail,
      'System Setup',
      'Sheets initialized with exact structure: ' + sheetConfigs.map(c => c.name).join(', ')
    ]);
    
    // Show success message
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      '✅ Success!',
      `All sheets created successfully with your exact structure:\n\n` +
      `📋 Inventory - ${sheetConfigs[0].headers.length} columns\n` +
      `👥 Users - ${sheetConfigs[1].headers.length} columns (with Password)\n` +
      `📦 Stock_log - ${sheetConfigs[2].headers.length} columns\n` +
      `📋 Activity_log - ${sheetConfigs[3].headers.length} columns\n` +
      `📊 Reports - ${sheetConfigs[4].headers.length} columns\n\n` +
      `Default login:\n` +
      `Email: ${currentEmail}\n` +
      `Password: admin123\n\n` +
      `Ready to deploy as web app!`,
      ui.ButtonSet.OK
    );
    
    return {
      success: true,
      message: 'All sheets created successfully',
      sheets: sheetConfigs.map(c => c.name)
    };
    
  } catch (error) {
    console.error('Error setting up sheets:', error);
    SpreadsheetApp.getUi().alert(
      '❌ Error',
      `Failed to setup sheets: ${error.toString()}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Quick check of current sheets
 */
function checkCurrentSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  const sheetInfo = sheets.map(sheet => ({
    name: sheet.getName(),
    rows: sheet.getLastRow(),
    columns: sheet.getLastColumn()
  }));
  
  console.log('Current sheets:', sheetInfo);
  
  const ui = SpreadsheetApp.getUi();
  const sheetList = sheetInfo.map(s => `• ${s.name} (${s.rows} rows, ${s.columns} cols)`).join('\n');
  
  ui.alert(
    '📊 Current Sheets',
    `Your spreadsheet currently has:\n\n${sheetList}\n\nReady to setup with your exact structure?`,
    ui.ButtonSet.OK
  );
  
  return sheetInfo;
}

/**
 * Delete all sheets except the first one (for clean start)
 */
function cleanStart() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  if (sheets.length <= 1) {
    SpreadsheetApp.getUi().alert('Only one sheet exists, nothing to clean.');
    return;
  }
  
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '⚠️ Clean Start',
    `This will delete all sheets except the first one.\n\nAre you sure you want to continue?`,
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    // Keep only the first sheet, delete the rest
    for (let i = sheets.length - 1; i > 0; i--) {
      ss.deleteSheet(sheets[i]);
    }
    
    // Clear and rename the first sheet
    const firstSheet = ss.getSheets()[0];
    firstSheet.clear();
    firstSheet.setName('Temp');
    
    ui.alert('✅ Clean start completed. Run setup now.');
  }
}

/**
 * Simple menu for easy access
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔧 Sheet Setup')
    .addItem('📋 Check Current Sheets', 'checkCurrentSheets')
    .addItem('🚀 Setup Your Exact Sheets', 'setupYourExactSheets')
    .addSeparator()
    .addItem('🧹 Clean Start (Delete All)', 'cleanStart')
    .addSeparator()
    .addItem('📖 Show Setup Guide', 'showSetupGuide')
    .addToUi();
}

/**
 * Show complete setup guide
 */
function showSetupGuide() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    '📖 Complete Setup Guide',
    `1. 📋 Click "Check Current Sheets" to see what you have\n\n` +
    `2. 🚀 Click "Setup Your Exact Sheets" to create:\n` +
    `   • Inventory (10 columns)\n` +
    `   • Users (6 columns with Password)\n` +
    `   • Stock_log (7 columns)\n` +
    `   • Activity_log (4 columns)\n` +
    `   • Reports (3 columns)\n\n` +
    `3. 📁 Copy all .gs and .html files to Apps Script\n\n` +
    `4. 🌐 Deploy as Web App:\n` +
    `   • Extensions > Apps Script\n` +
    `   • Deploy > New Deployment\n` +
    `   • Type: Web app\n` +
    `   • Execute as: Me\n` +
    `   • Access: Anyone\n\n` +
    `5. ✅ Share the web app URL - no Sheet access needed!`,
    ui.ButtonSet.OK
  );
}