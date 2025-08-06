/**
 * Debug Login Issues
 * Use these functions to troubleshoot authentication problems
 */

/**
 * Debug: Check what's in the Users sheet
 */
function debugUsersSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Check if Users sheet exists
    const usersSheet = ss.getSheetByName('Users');
    if (!usersSheet) {
      console.log('❌ ERROR: Users sheet not found!');
      return {
        error: 'Users sheet not found',
        availableSheets: ss.getSheets().map(s => s.getName())
      };
    }
    
    console.log('✅ Users sheet found');
    
    // Get all data from Users sheet
    const lastRow = usersSheet.getLastRow();
    const lastCol = usersSheet.getLastColumn();
    
    console.log(`Users sheet has ${lastRow} rows and ${lastCol} columns`);
    
    if (lastRow < 2) {
      console.log('❌ ERROR: No users found in Users sheet!');
      return {
        error: 'No users in sheet',
        headers: lastRow > 0 ? usersSheet.getRange(1, 1, 1, lastCol).getValues()[0] : [],
        rowCount: lastRow
      };
    }
    
    // Get headers
    const headers = usersSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    console.log('Headers:', headers);
    
    // Get all user data
    const userData = usersSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    console.log('User data:', userData);
    
    // Format for display
    const users = userData.map((row, index) => ({
      rowNumber: index + 2,
      email: row[0],
      name: row[1],
      password: row[2] ? '***' + row[2].toString().slice(-3) : 'NO PASSWORD',
      role: row[3],
      status: row[4],
      dateAdded: row[5]
    }));
    
    return {
      success: true,
      headers: headers,
      users: users,
      totalUsers: users.length
    };
    
  } catch (error) {
    console.error('Debug error:', error);
    return {
      error: error.toString()
    };
  }
}

/**
 * Debug: Test specific email/password combination
 */
function debugLogin(email, password) {
  console.log(`Testing login for: ${email} with password: ${password}`);
  
  try {
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    if (!usersSheet) {
      return { error: 'Users sheet not found' };
    }
    
    const lastRow = usersSheet.getLastRow();
    if (lastRow < 2) {
      return { error: 'No users in sheet' };
    }
    
    const data = usersSheet.getRange(2, 1, lastRow - 1, 6).getValues();
    console.log('All user data:', data);
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      console.log(`Checking row ${i + 2}:`, {
        email: row[0],
        name: row[1],
        storedPassword: row[2],
        role: row[3],
        status: row[4]
      });
      
      if (row[0] === email) {
        console.log(`✅ Email match found at row ${i + 2}`);
        console.log(`Stored password: "${row[2]}", Provided password: "${password}"`);
        console.log(`Password match: ${row[2] === password}`);
        console.log(`User status: ${row[4]}`);
        
        if (row[4] !== 'Active') {
          return {
            error: 'User account is not active',
            userStatus: row[4]
          };
        }
        
        if (row[2] === password) {
          return {
            success: true,
            user: {
              email: row[0],
              name: row[1],
              role: row[3],
              status: row[4]
            }
          };
        } else {
          return {
            error: 'Password mismatch',
            storedPassword: row[2],
            providedPassword: password
          };
        }
      }
    }
    
    return {
      error: 'Email not found',
      checkedEmails: data.map(row => row[0])
    };
    
  } catch (error) {
    console.error('Login test error:', error);
    return { error: error.toString() };
  }
}

/**
 * Quick fix: Add a test user manually
 */
function addTestUser() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = ss.getSheetByName('Users');
    
    if (!usersSheet) {
      console.log('❌ Users sheet not found!');
      return;
    }
    
    const currentEmail = Session.getActiveUser().getEmail();
    
    // Check if user already exists
    const lastRow = usersSheet.getLastRow();
    if (lastRow > 1) {
      const existingData = usersSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      const userExists = existingData.some(row => row[0] === currentEmail);
      
      if (userExists) {
        console.log('User already exists, updating password...');
        // Find and update the user
        for (let i = 2; i <= lastRow; i++) {
          if (usersSheet.getRange(i, 1).getValue() === currentEmail) {
            usersSheet.getRange(i, 3).setValue('admin123'); // Update password
            console.log('✅ Password updated to "admin123"');
            break;
          }
        }
        return;
      }
    }
    
    // Add new user
    const newUser = [
      currentEmail,           // Email
      'System Administrator', // Name
      'admin123',            // Password
      'Super Admin',         // Role
      'Active',              // Status
      new Date()             // Date Added
    ];
    
    usersSheet.appendRow(newUser);
    console.log('✅ Test user added:', currentEmail);
    
    SpreadsheetApp.getUi().alert(
      '✅ Test User Added',
      `User added successfully:\n\n` +
      `Email: ${currentEmail}\n` +
      `Password: admin123\n` +
      `Role: Super Admin\n\n` +
      `Try logging in now!`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    console.error('Error adding test user:', error);
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
}

/**
 * Show debug results in UI
 */
function showDebugInfo() {
  const debug = debugUsersSheet();
  const ui = SpreadsheetApp.getUi();
  
  if (debug.error) {
    ui.alert(
      '❌ Debug Error',
      `Problem found: ${debug.error}\n\n` +
      `Available sheets: ${debug.availableSheets ? debug.availableSheets.join(', ') : 'None'}\n\n` +
      `Try running "Add Test User" first.`,
      ui.ButtonSet.OK
    );
  } else {
    const userList = debug.users.map(u => 
      `• ${u.email} (${u.role}) - Password ends: ${u.password.slice(-3)}`
    ).join('\n');
    
    ui.alert(
      '🔍 Debug Info',
      `Users sheet found with ${debug.totalUsers} users:\n\n${userList}\n\n` +
      `Headers: ${debug.headers.join(', ')}\n\n` +
      `If you can't login, try "Add Test User" to fix credentials.`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Test login with current user
 */
function testCurrentUserLogin() {
  const currentEmail = Session.getActiveUser().getEmail();
  const result = debugLogin(currentEmail, 'admin123');
  
  const ui = SpreadsheetApp.getUi();
  
  if (result.success) {
    ui.alert(
      '✅ Login Test Success',
      `Login works for:\n\n` +
      `Email: ${currentEmail}\n` +
      `Password: admin123\n` +
      `Role: ${result.user.role}\n\n` +
      `You should be able to login to the web app now!`,
      ui.ButtonSet.OK
    );
  } else {
    ui.alert(
      '❌ Login Test Failed',
      `Login failed for: ${currentEmail}\n\n` +
      `Error: ${result.error}\n\n` +
      `Click "Add Test User" to fix this.`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Menu for debug functions
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔍 Debug Login')
    .addItem('📊 Show Debug Info', 'showDebugInfo')
    .addItem('👤 Add Test User', 'addTestUser')
    .addItem('🧪 Test Current User Login', 'testCurrentUserLogin')
    .addSeparator()
    .addItem('📋 Show All Users (Console)', 'debugUsersSheet')
    .addToUi();
}