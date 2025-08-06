/**
 * Helper Functions to View/Set Passwords from Users Sheet
 */

/**
 * Show current user's password from the Users sheet
 */
function showMyPassword() {
  try {
    const currentEmail = Session.getActiveUser().getEmail();
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    
    if (!usersSheet) {
      SpreadsheetApp.getUi().alert('❌ Error', 'Users sheet not found!', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    const lastRow = usersSheet.getLastRow();
    if (lastRow < 2) {
      SpreadsheetApp.getUi().alert('❌ Error', 'No users found in Users sheet!', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    // Find current user
    const data = usersSheet.getRange(2, 1, lastRow - 1, 6).getValues();
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row[0] === currentEmail) {
        const password = row[2]; // Column C
        const role = row[3];     // Column D
        const status = row[4];   // Column E
        
        SpreadsheetApp.getUi().alert(
          '🔐 Your Login Credentials',
          `Email: ${currentEmail}\n` +
          `Password: ${password}\n` +
          `Role: ${role}\n` +
          `Status: ${status}\n\n` +
          `Use these credentials to login to the web app!`,
          SpreadsheetApp.getUi().ButtonSet.OK
        );
        return;
      }
    }
    
    SpreadsheetApp.getUi().alert(
      '❌ User Not Found',
      `Your email (${currentEmail}) is not found in the Users sheet.\n\n` +
      `Click "Add Me as User" to add yourself.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Add current user to Users sheet
 */
function addMeAsUser() {
  try {
    const currentEmail = Session.getActiveUser().getEmail();
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    
    if (!usersSheet) {
      SpreadsheetApp.getUi().alert('❌ Error', 'Users sheet not found! Run sheet setup first.', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    // Check if user already exists
    const lastRow = usersSheet.getLastRow();
    if (lastRow > 1) {
      const data = usersSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      const userExists = data.some(row => row[0] === currentEmail);
      
      if (userExists) {
        SpreadsheetApp.getUi().alert(
          'ℹ️ User Already Exists',
          `You (${currentEmail}) are already in the Users sheet.\n\nClick "Show My Password" to see your credentials.`,
          SpreadsheetApp.getUi().ButtonSet.OK
        );
        return;
      }
    }
    
    // Add new user
    const newUser = [
      currentEmail,           // Email
      'User',                 // Name (can be changed later)
      'admin123',            // Password
      'Super Admin',         // Role
      'Active',              // Status
      new Date()             // Date Added
    ];
    
    usersSheet.appendRow(newUser);
    
    SpreadsheetApp.getUi().alert(
      '✅ User Added Successfully',
      `You have been added to the system:\n\n` +
      `Email: ${currentEmail}\n` +
      `Password: admin123\n` +
      `Role: Super Admin\n` +
      `Status: Active\n\n` +
      `You can now login to the web app!`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Set a new password for current user
 */
function setMyPassword() {
  try {
    const ui = SpreadsheetApp.getUi();
    const currentEmail = Session.getActiveUser().getEmail();
    
    // Prompt for new password
    const response = ui.prompt(
      '🔑 Set New Password',
      'Enter your new password:',
      ui.ButtonSet.OK_CANCEL
    );
    
    if (response.getSelectedButton() === ui.Button.CANCEL) {
      return;
    }
    
    const newPassword = response.getResponseText().trim();
    
    if (!newPassword) {
      ui.alert('❌ Error', 'Password cannot be empty!', ui.ButtonSet.OK);
      return;
    }
    
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    if (!usersSheet) {
      ui.alert('❌ Error', 'Users sheet not found!', ui.ButtonSet.OK);
      return;
    }
    
    const lastRow = usersSheet.getLastRow();
    if (lastRow < 2) {
      ui.alert('❌ Error', 'No users found in Users sheet!', ui.ButtonSet.OK);
      return;
    }
    
    // Find and update user password
    let userFound = false;
    for (let i = 2; i <= lastRow; i++) {
      if (usersSheet.getRange(i, 1).getValue() === currentEmail) {
        usersSheet.getRange(i, 3).setValue(newPassword); // Column C = Password
        userFound = true;
        break;
      }
    }
    
    if (userFound) {
      ui.alert(
        '✅ Password Updated',
        `Your password has been updated successfully!\n\n` +
        `Email: ${currentEmail}\n` +
        `New Password: ${newPassword}\n\n` +
        `Use these credentials to login to the web app.`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        '❌ User Not Found',
        `Your email (${currentEmail}) is not found in the Users sheet.\n\n` +
        `Click "Add Me as User" first.`,
        ui.ButtonSet.OK
      );
    }
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Show all users and their passwords (for debugging)
 */
function showAllUsers() {
  try {
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    
    if (!usersSheet) {
      SpreadsheetApp.getUi().alert('❌ Error', 'Users sheet not found!', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    const lastRow = usersSheet.getLastRow();
    if (lastRow < 2) {
      SpreadsheetApp.getUi().alert('❌ Error', 'No users found in Users sheet!', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    const data = usersSheet.getRange(2, 1, lastRow - 1, 6).getValues();
    
    let userList = 'All Users in System:\n\n';
    
    data.forEach((row, index) => {
      userList += `${index + 1}. Email: ${row[0]}\n`;
      userList += `   Name: ${row[1]}\n`;
      userList += `   Password: ${row[2]}\n`;
      userList += `   Role: ${row[3]}\n`;
      userList += `   Status: ${row[4]}\n\n`;
    });
    
    SpreadsheetApp.getUi().alert(
      '👥 All System Users',
      userList,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Menu for password functions
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔑 Password Helper')
    .addItem('🔍 Show My Password', 'showMyPassword')
    .addItem('👤 Add Me as User', 'addMeAsUser')
    .addItem('🔑 Set New Password', 'setMyPassword')
    .addSeparator()
    .addItem('👥 Show All Users', 'showAllUsers')
    .addToUi();
}