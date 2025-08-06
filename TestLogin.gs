/**
 * Test Login Functions
 * Debug authentication issues
 */

/**
 * Test login for current user
 */
function testMyLogin() {
  try {
    const currentEmail = Session.getActiveUser().getEmail();
    
    console.log('Testing login for:', currentEmail);
    
    // Check if Users sheet exists
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    if (!usersSheet) {
      SpreadsheetApp.getUi().alert('❌ Error', 'Users sheet not found!', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    console.log('Users sheet found');
    
    // Get all users
    const lastRow = usersSheet.getLastRow();
    console.log('Users sheet has', lastRow, 'rows');
    
    if (lastRow < 2) {
      SpreadsheetApp.getUi().alert('❌ Error', 'No users in Users sheet!', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    // Get user data
    const userData = usersSheet.getRange(2, 1, lastRow - 1, 6).getValues();
    console.log('User data:', userData);
    
    // Find current user
    let foundUser = null;
    for (let i = 0; i < userData.length; i++) {
      const row = userData[i];
      console.log(`Checking row ${i + 2}:`, row);
      
      if (row[0] === currentEmail) {
        foundUser = {
          email: row[0],
          name: row[1],
          password: row[2],
          role: row[3],
          status: row[4],
          dateAdded: row[5]
        };
        console.log('Found user:', foundUser);
        break;
      }
    }
    
    if (!foundUser) {
      SpreadsheetApp.getUi().alert(
        '❌ User Not Found',
        `Your email (${currentEmail}) is not in the Users sheet.\n\n` +
        `Available users:\n${userData.map(row => row[0]).join('\n')}\n\n` +
        `Click "Add Me as User" to add yourself.`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    // Test password validation
    const testPassword = 'admin123';
    console.log('Testing password:', testPassword, 'against stored:', foundUser.password);
    
    if (foundUser.password === testPassword) {
      SpreadsheetApp.getUi().alert(
        '✅ Login Test Success',
        `Login should work with these credentials:\n\n` +
        `Email: ${foundUser.email}\n` +
        `Password: ${foundUser.password}\n` +
        `Role: ${foundUser.role}\n` +
        `Status: ${foundUser.status}\n\n` +
        `Try logging into the web app now!`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      SpreadsheetApp.getUi().alert(
        '❌ Password Mismatch',
        `Password doesn't match:\n\n` +
        `Expected: admin123\n` +
        `Stored: ${foundUser.password}\n\n` +
        `Update your password in the Users sheet or use the correct password.`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
    
  } catch (error) {
    console.error('Test login error:', error);
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Fix user login by setting correct password
 */
function fixMyLogin() {
  try {
    const currentEmail = Session.getActiveUser().getEmail();
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    
    if (!usersSheet) {
      SpreadsheetApp.getUi().alert('❌ Error', 'Users sheet not found!', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    const lastRow = usersSheet.getLastRow();
    let userFound = false;
    
    // Find and update user
    for (let i = 2; i <= lastRow; i++) {
      if (usersSheet.getRange(i, 1).getValue() === currentEmail) {
        // Update password to 'admin123'
        usersSheet.getRange(i, 3).setValue('admin123');
        // Ensure status is Active
        usersSheet.getRange(i, 5).setValue('Active');
        userFound = true;
        break;
      }
    }
    
    if (!userFound) {
      // Add new user
      const newUser = [
        currentEmail,
        'User',
        'admin123',
        'Super Admin',
        'Active',
        new Date()
      ];
      usersSheet.appendRow(newUser);
    }
    
    SpreadsheetApp.getUi().alert(
      '✅ Login Fixed',
      `Your login has been fixed:\n\n` +
      `Email: ${currentEmail}\n` +
      `Password: admin123\n` +
      `Status: Active\n\n` +
      `Try logging into the web app now!`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    console.error('Fix login error:', error);
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Test the web app authentication function directly
 */
function testWebAuthentication() {
  try {
    const currentEmail = Session.getActiveUser().getEmail();
    const testPassword = 'admin123';
    
    console.log('Testing web authentication for:', currentEmail);
    
    // Test the actual function used by the web app
    const result = validateWebCredentials(currentEmail, testPassword);
    
    console.log('Authentication result:', result);
    
    const ui = SpreadsheetApp.getUi();
    
    if (result && result.success) {
      ui.alert(
        '✅ Web Authentication Success',
        `Web app authentication working:\n\n` +
        `Email: ${result.user.email}\n` +
        `Name: ${result.user.name}\n` +
        `Role: ${result.user.role}\n` +
        `Status: ${result.user.status}\n\n` +
        `Web app login should work!`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        '❌ Web Authentication Failed',
        `Web app authentication failed:\n\n` +
        `Error: ${result ? result.error : 'No result returned'}\n\n` +
        `Check the console for detailed logs.`,
        ui.ButtonSet.OK
      );
    }
    
  } catch (error) {
    console.error('Web authentication test error:', error);
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Show web app URL for easy access
 */
function showWebAppUrl() {
  try {
    const webAppUrl = ScriptApp.getService().getUrl();
    
    SpreadsheetApp.getUi().alert(
      '🌐 Web App URL',
      `Your web app URL:\n\n${webAppUrl}\n\n` +
      `Copy this URL to access your inventory system.\n\n` +
      `Login with:\n` +
      `Email: ${Session.getActiveUser().getEmail()}\n` +
      `Password: admin123`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    console.log('Web App URL:', webAppUrl);
    
  } catch (error) {
    console.error('Error getting web app URL:', error);
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Menu for test functions
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🧪 Test Login')
    .addItem('🔍 Test My Login', 'testMyLogin')
    .addItem('🔧 Fix My Login', 'fixMyLogin')
    .addItem('🌐 Test Web Authentication', 'testWebAuthentication')
    .addSeparator()
    .addItem('📋 Show Web App URL', 'showWebAppUrl')
    .addToUi();
}