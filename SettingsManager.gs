/**
 * Settings Management Functions
 * Manage company settings from the Settings sheet
 */

/**
 * Show current settings (quick view)
 */
function showCurrentSettings() {
  try {
    const settings = getCompanySettings();
    
    SpreadsheetApp.getUi().alert(
      '👁️ Current Settings',
      `Your current company settings:\n\n` +
      `Company Name: ${settings.companyName}\n` +
      `Slogan: ${settings.slogan}\n` +
      `Logo: ${settings.logo}\n\n` +
      `These will appear in your web app login form.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Debug Settings - Check raw data from Settings sheet
 */
function debugSettings() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Check if Settings sheet exists
    let settingsSheet = ss.getSheetByName('Settings');
    
    if (!settingsSheet) {
      SpreadsheetApp.getUi().alert(
        '❌ Settings Sheet Not Found',
        'The Settings sheet does not exist. Please create it with:\n\n' +
        'Column A: Company Name\n' +
        'Column B: Slogan\n' +
        'Column C: Logo\n\n' +
        'And add your data in row 2.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    // Get raw data
    const lastRow = settingsSheet.getLastRow();
    const headers = settingsSheet.getRange(1, 1, 1, 3).getValues()[0];
    
    let dataText = '';
    if (lastRow >= 2) {
      const data = settingsSheet.getRange(2, 1, 1, 3).getValues()[0];
      dataText = `Row 2 Data:\n` +
                 `A2: "${data[0]}" (${typeof data[0]})\n` +
                 `B2: "${data[1]}" (${typeof data[1]})\n` +
                 `C2: "${data[2]}" (${typeof data[2]})\n\n`;
    } else {
      dataText = 'No data in row 2!\n\n';
    }
    
    SpreadsheetApp.getUi().alert(
      '🔍 Settings Debug Info',
      `Settings Sheet Found: ✅\n` +
      `Last Row: ${lastRow}\n\n` +
      `Headers (Row 1):\n` +
      `A1: "${headers[0]}"\n` +
      `B1: "${headers[1]}"\n` +
      `C1: "${headers[2]}"\n\n` +
      dataText +
      `TIP: Make sure row 2 has your company data!`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Debug Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Show settings management dialog
 */
function showSettingsManager() {
  try {
    const settings = getCompanySettings();
    
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      '⚙️ Company Settings',
      `Current Settings:\n\n` +
      `Company Name: ${settings.companyName}\n` +
      `Slogan: ${settings.slogan}\n` +
      `Logo: ${settings.logo}\n\n` +
      `Would you like to update these settings?`,
      ui.ButtonSet.YES_NO
    );
    
    if (response === ui.Button.YES) {
      updateCompanySettings();
    }
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Update company settings through prompts
 */
function updateCompanySettings() {
  try {
    const ui = SpreadsheetApp.getUi();
    const settings = getCompanySettings();
    
    // Get company name
    const nameResponse = ui.prompt(
      '🏢 Company Name',
      `Current: ${settings.companyName}\n\nEnter new company name:`,
      ui.ButtonSet.OK_CANCEL
    );
    
    if (nameResponse.getSelectedButton() === ui.Button.CANCEL) {
      return;
    }
    
    const newCompanyName = nameResponse.getResponseText().trim() || settings.companyName;
    
    // Get slogan
    const sloganResponse = ui.prompt(
      '💼 Company Slogan',
      `Current: ${settings.slogan}\n\nEnter new slogan:`,
      ui.ButtonSet.OK_CANCEL
    );
    
    if (sloganResponse.getSelectedButton() === ui.Button.CANCEL) {
      return;
    }
    
    const newSlogan = sloganResponse.getResponseText().trim() || settings.slogan;
    
    // Get logo
    const logoResponse = ui.prompt(
      '🎨 Company Logo',
      `Current: ${settings.logo}\n\nEnter new logo (emoji or text):`,
      ui.ButtonSet.OK_CANCEL
    );
    
    if (logoResponse.getSelectedButton() === ui.Button.CANCEL) {
      return;
    }
    
    const newLogo = logoResponse.getResponseText().trim() || settings.logo;
    
    // Save settings
    const success = saveCompanySettings(newCompanyName, newSlogan, newLogo);
    
    if (success) {
      ui.alert(
        '✅ Settings Updated',
        `Company settings have been updated successfully!\n\n` +
        `Company Name: ${newCompanyName}\n` +
        `Slogan: ${newSlogan}\n` +
        `Logo: ${newLogo}\n\n` +
        `Changes will appear in the web app immediately.`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert('❌ Error', 'Failed to save settings. Please try again.', ui.ButtonSet.OK);
    }
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Save company settings to Settings sheet
 */
function saveCompanySettings(companyName, slogan, logo) {
  try {
    const settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
    
    if (!settingsSheet) {
      throw new Error('Settings sheet not found. Please run sheet setup first.');
    }
    
    // Update row 2 with new settings
    settingsSheet.getRange(2, 1, 1, 3).setValues([[companyName, slogan, logo]]);
    
    // Log the change
    logActivity('Settings Update', `Updated company settings: ${companyName} | ${slogan} | ${logo}`);
    
    return true;
    
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

/**
 * Reset settings to default
 */
function resetSettingsToDefault() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      '⚠️ Reset Settings',
      'This will reset all company settings to default values.\n\nAre you sure you want to continue?',
      ui.ButtonSet.YES_NO
    );
    
    if (response === ui.Button.YES) {
      const success = saveCompanySettings(
        'Your Company Name',
        'Professional Inventory Management System',
        '📦'
      );
      
      if (success) {
        ui.alert(
          '✅ Settings Reset',
          'Company settings have been reset to default values.',
          ui.ButtonSet.OK
        );
      } else {
        ui.alert('❌ Error', 'Failed to reset settings.', ui.ButtonSet.OK);
      }
    }
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Create Settings sheet if it doesn't exist
 */
function createSettingsSheetIfNeeded() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let settingsSheet = ss.getSheetByName('Settings');
    
    if (!settingsSheet) {
      // Create Settings sheet
      settingsSheet = ss.insertSheet('Settings');
      
      // Add headers
      const headers = ['Company Name', 'Slogan', 'Logo'];
      settingsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      settingsSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      settingsSheet.setFrozenRows(1);
      
      // Add default settings
      const defaultSettings = [
        'Your Company Name',
        'Professional Inventory Management System',
        '📦'
      ];
      settingsSheet.getRange(2, 1, 1, defaultSettings.length).setValues([defaultSettings]);
      
      // Format columns
      settingsSheet.setColumnWidth(1, 200); // Company Name
      settingsSheet.setColumnWidth(2, 300); // Slogan
      settingsSheet.setColumnWidth(3, 100); // Logo
      
      SpreadsheetApp.getUi().alert(
        '✅ Settings Sheet Created',
        'Settings sheet has been created with default values.\n\nYou can now customize your company settings!',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      SpreadsheetApp.getUi().alert(
        'ℹ️ Settings Sheet Exists',
        'Settings sheet already exists.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Export settings for backup
 */
function exportSettings() {
  try {
    const settings = getCompanySettings();
    
    const exportData = {
      companyName: settings.companyName,
      slogan: settings.slogan,
      logo: settings.logo,
      exportDate: new Date().toISOString()
    };
    
    SpreadsheetApp.getUi().alert(
      '📥 Settings Export',
      `Settings Export Data:\n\n${JSON.stringify(exportData, null, 2)}\n\nCopy this data to backup your settings.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return exportData;
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
    return null;
  }
}

/**
 * Validate settings data
 */
function validateSettings(settings) {
  const errors = [];
  
  if (!settings.companyName || settings.companyName.trim().length === 0) {
    errors.push('Company name cannot be empty');
  }
  
  if (!settings.slogan || settings.slogan.trim().length === 0) {
    errors.push('Slogan cannot be empty');
  }
  
  if (!settings.logo || settings.logo.trim().length === 0) {
    errors.push('Logo cannot be empty');
  }
  
  if (settings.companyName && settings.companyName.length > 50) {
    errors.push('Company name should be 50 characters or less');
  }
  
  if (settings.slogan && settings.slogan.length > 100) {
    errors.push('Slogan should be 100 characters or less');
  }
  
  return errors;
}

/**
 * Menu for settings functions
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ Company Settings')
    .addItem('👁️ Show Current Settings', 'showCurrentSettings')
    .addItem('🔍 Debug Settings Data', 'debugSettings')
    .addSeparator()
    .addItem('🏢 Manage Settings', 'showSettingsManager')
    .addItem('➕ Create Settings Sheet', 'createSettingsSheetIfNeeded')
    .addItem('🔄 Reset to Default', 'resetSettingsToDefault')
    .addItem('📥 Export Settings', 'exportSettings')
    .addToUi();
}