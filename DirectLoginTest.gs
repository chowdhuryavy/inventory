/**
 * Direct Login Test
 * Test the web app login directly from Apps Script
 */

/**
 * Test login by calling the web app directly
 */
function testDirectLogin() {
  try {
    const currentEmail = Session.getActiveUser().getEmail();
    const password = 'admin123';
    
    console.log('=== Testing Direct Login ===');
    console.log('Email:', currentEmail);
    console.log('Password:', password);
    
    // Create test event object like the web app receives
    const testEvent = {
      parameter: {
        action: 'login',
        email: currentEmail,
        password: password
      }
    };
    
    console.log('Test event:', JSON.stringify(testEvent));
    
    // Call handleWebLogin directly
    const loginResult = handleWebLogin(testEvent);
    console.log('Direct login result:', loginResult);
    
    // If it returns a ContentService response, we need to get the content
    if (loginResult && typeof loginResult.getContent === 'function') {
      const content = loginResult.getContent();
      console.log('Response content:', content);
      
      try {
        const parsed = JSON.parse(content);
        console.log('Parsed response:', JSON.stringify(parsed, null, 2));
        
        if (parsed.success) {
          SpreadsheetApp.getUi().alert(
            '✅ Direct Login Success',
            `Direct login test successful!\n\n` +
            `User: ${parsed.user.name}\n` +
            `Role: ${parsed.user.role}\n` +
            `Session Token: ${parsed.sessionToken}\n\n` +
            `Web app login should work now!`,
            SpreadsheetApp.getUi().ButtonSet.OK
          );
        } else {
          SpreadsheetApp.getUi().alert(
            '❌ Direct Login Failed',
            `Direct login test failed:\n\n` +
            `Error: ${parsed.error}\n\n` +
            `Check the console for detailed logs.`,
            SpreadsheetApp.getUi().ButtonSet.OK
          );
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        SpreadsheetApp.getUi().alert(
          '❌ Parse Error',
          `Could not parse login response:\n\n${content}`,
          SpreadsheetApp.getUi().ButtonSet.OK
        );
      }
    } else {
      console.log('Unexpected response format:', loginResult);
      SpreadsheetApp.getUi().alert(
        '❌ Unexpected Response',
        `Unexpected response format:\n\n${JSON.stringify(loginResult)}`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
    
  } catch (error) {
    console.error('Direct login test error:', error);
    SpreadsheetApp.getUi().alert(
      '❌ Test Error',
      `Direct login test error:\n\n${error.toString()}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Test doPost function directly
 */
function testDoPostDirect() {
  try {
    const currentEmail = Session.getActiveUser().getEmail();
    
    console.log('=== Testing doPost Direct ===');
    
    // Create test event object
    const testEvent = {
      parameter: {
        action: 'login',
        email: currentEmail,
        password: 'admin123'
      }
    };
    
    console.log('Test event:', JSON.stringify(testEvent));
    
    // Call doPost directly
    const result = doPost(testEvent);
    console.log('doPost result:', result);
    
    if (result && typeof result.getContent === 'function') {
      const content = result.getContent();
      console.log('doPost content:', content);
      
      try {
        const parsed = JSON.parse(content);
        console.log('Parsed doPost response:', JSON.stringify(parsed, null, 2));
        
        SpreadsheetApp.getUi().alert(
          '📊 doPost Test Result',
          `doPost response:\n\n${JSON.stringify(parsed, null, 2)}`,
          SpreadsheetApp.getUi().ButtonSet.OK
        );
      } catch (parseError) {
        SpreadsheetApp.getUi().alert(
          '❌ Parse Error',
          `Could not parse doPost response:\n\n${content}`,
          SpreadsheetApp.getUi().ButtonSet.OK
        );
      }
    } else {
      SpreadsheetApp.getUi().alert(
        '❌ Unexpected doPost Response',
        `Unexpected doPost response:\n\n${JSON.stringify(result)}`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
    
  } catch (error) {
    console.error('doPost test error:', error);
    SpreadsheetApp.getUi().alert(
      '❌ doPost Test Error',
      `doPost test error:\n\n${error.toString()}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Test validation function step by step
 */
function testValidationStepByStep() {
  try {
    const currentEmail = Session.getActiveUser().getEmail();
    const password = 'admin123';
    
    console.log('=== Step by Step Validation Test ===');
    
    // Step 1: Check if Users sheet exists
    console.log('Step 1: Checking Users sheet...');
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    if (!usersSheet) {
      throw new Error('Users sheet not found');
    }
    console.log('✓ Users sheet exists');
    
    // Step 2: Check sheet data
    console.log('Step 2: Getting sheet data...');
    const lastRow = usersSheet.getLastRow();
    console.log('Last row:', lastRow);
    
    if (lastRow < 2) {
      throw new Error('No users in sheet');
    }
    
    const data = usersSheet.getRange(2, 1, lastRow - 1, 6).getValues();
    console.log('User data:', data);
    
    // Step 3: Find user
    console.log('Step 3: Finding user...');
    let foundUser = null;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      console.log(`Checking row ${i}:`, row);
      if (row[0] === currentEmail) {
        foundUser = row;
        console.log('✓ User found:', foundUser);
        break;
      }
    }
    
    if (!foundUser) {
      throw new Error(`User ${currentEmail} not found`);
    }
    
    // Step 4: Check password
    console.log('Step 4: Checking password...');
    const storedPassword = foundUser[2];
    console.log('Stored password:', storedPassword);
    console.log('Provided password:', password);
    console.log('Password match:', storedPassword === password);
    
    if (storedPassword !== password) {
      throw new Error(`Password mismatch. Stored: "${storedPassword}", Provided: "${password}"`);
    }
    
    // Step 5: Check status
    console.log('Step 5: Checking status...');
    const status = foundUser[4];
    console.log('User status:', status);
    
    if (status !== 'Active') {
      throw new Error(`User status is not active: ${status}`);
    }
    
    // Step 6: Test validateWebCredentials function
    console.log('Step 6: Testing validateWebCredentials...');
    const validationResult = validateWebCredentials(currentEmail, password);
    console.log('Validation result:', JSON.stringify(validationResult, null, 2));
    
    if (validationResult && validationResult.success) {
      SpreadsheetApp.getUi().alert(
        '✅ All Tests Passed',
        `All validation tests passed!\n\n` +
        `Email: ${validationResult.user.email}\n` +
        `Name: ${validationResult.user.name}\n` +
        `Role: ${validationResult.user.role}\n` +
        `Status: ${validationResult.user.status}\n\n` +
        `Login should work in the web app!`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      SpreadsheetApp.getUi().alert(
        '❌ Validation Failed',
        `Validation function failed:\n\n` +
        `Result: ${JSON.stringify(validationResult, null, 2)}`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
    
  } catch (error) {
    console.error('Step by step test error:', error);
    SpreadsheetApp.getUi().alert(
      '❌ Validation Test Failed',
      `Validation test failed at:\n\n${error.toString()}\n\nCheck console for details.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Menu for direct test functions
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🧪 Direct Tests')
    .addItem('🔬 Test Direct Login', 'testDirectLogin')
    .addItem('📡 Test doPost Direct', 'testDoPostDirect')
    .addItem('🔍 Test Step by Step', 'testValidationStepByStep')
    .addToUi();
}