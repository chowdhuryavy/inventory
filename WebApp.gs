/**
 * Standalone Web Application for Inventory Management
 * Users access via web URL, no direct Google Sheet access needed
 * Complete logging of all user interactions
 */

/**
 * Main web app entry point
 */
function doGet(e) {
  // Check if user is trying to access a specific page
  const page = e.parameter.page || 'login';
  
  // Log the access attempt
  logWebAccess(e);
  
  switch (page) {
    case 'login':
      return showLoginPage();
    case 'dashboard':
      return showWebDashboard(e);
    case 'inventory':
      return showWebInventory(e);
    case 'users':
      return showWebUsers(e);
    case 'reports':
      return showWebReports(e);
    default:
      return showLoginPage();
  }
}

/**
 * Handle POST requests (form submissions, AJAX calls)
 */
function doPost(e) {
  const action = e.parameter.action;
  const sessionToken = e.parameter.sessionToken;
  
  // Log the action attempt
  logWebAction(e);
  
  // Verify session for protected actions
  if (action !== 'login' && !verifySession(sessionToken)) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid session. Please login again.',
        redirect: 'login'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    let result;
    switch (action) {
      case 'login':
        result = handleWebLogin(e);
        break;
      case 'logout':
        result = handleWebLogout(e);
        break;
      case 'getInventory':
        result = handleGetInventory(e);
        break;
      case 'addInventory':
        result = handleAddInventory(e);
        break;
      case 'updateInventory':
        result = handleUpdateInventory(e);
        break;
      case 'deleteInventory':
        result = handleDeleteInventory(e);
        break;
      case 'updateStock':
        result = handleUpdateStock(e);
        break;
      case 'getUsers':
        result = handleGetUsers(e);
        break;
      case 'addUser':
        result = handleAddUser(e);
        break;
      case 'updateUser':
        result = handleUpdateUser(e);
        break;
      case 'deleteUser':
        result = handleDeleteUser(e);
        break;
      case 'getDashboardData':
        result = handleGetDashboardData(e);
        break;
      case 'getReports':
        result = handleGetReports(e);
        break;
      default:
        result = { success: false, error: 'Unknown action' };
    }
    
    // Log the result
    logActionResult(action, result, e);
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    const errorResult = { success: false, error: error.toString() };
    logActionResult(action, errorResult, e);
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Show login page
 */
function showLoginPage() {
  const template = HtmlService.createTemplateFromFile('WebLogin');
  template.appUrl = ScriptApp.getService().getUrl();
  
  return template.evaluate()
    .setTitle('Inventory Management System - Login')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Show web dashboard
 */
function showWebDashboard(e) {
  const sessionToken = e.parameter.sessionToken;
  
  if (!verifySession(sessionToken)) {
    return showLoginPage();
  }
  
  const session = getSessionData(sessionToken);
  const template = HtmlService.createTemplateFromFile('WebDashboard');
  template.user = session.user;
  template.sessionToken = sessionToken;
  template.appUrl = ScriptApp.getService().getUrl();
  
  return template.evaluate()
    .setTitle('Inventory Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Show web inventory management
 */
function showWebInventory(e) {
  const sessionToken = e.parameter.sessionToken;
  
  if (!verifySession(sessionToken)) {
    return showLoginPage();
  }
  
  const session = getSessionData(sessionToken);
  
  // Check permissions
  if (!hasWebPermission(session.user, 'view_inventory')) {
    return showAccessDeniedPage();
  }
  
  const template = HtmlService.createTemplateFromFile('WebInventory');
  template.user = session.user;
  template.sessionToken = sessionToken;
  template.appUrl = ScriptApp.getService().getUrl();
  
  return template.evaluate()
    .setTitle('Inventory Management')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Show web user management
 */
function showWebUsers(e) {
  const sessionToken = e.parameter.sessionToken;
  
  if (!verifySession(sessionToken)) {
    return showLoginPage();
  }
  
  const session = getSessionData(sessionToken);
  
  // Check permissions
  if (!hasWebPermission(session.user, 'manage_users')) {
    return showAccessDeniedPage();
  }
  
  const template = HtmlService.createTemplateFromFile('WebUsers');
  template.user = session.user;
  template.sessionToken = sessionToken;
  template.appUrl = ScriptApp.getService().getUrl();
  
  return template.evaluate()
    .setTitle('User Management')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Show access denied page
 */
function showAccessDeniedPage() {
  const template = HtmlService.createTemplateFromFile('WebAccessDenied');
  template.appUrl = ScriptApp.getService().getUrl();
  
  return template.evaluate()
    .setTitle('Access Denied')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handle web login
 */
function handleWebLogin(e) {
  const email = e.parameter.email;
  const password = e.parameter.password;
  
  // Log login attempt
  logDetailedActivity('Login Attempt', `Login attempt for email: ${email}`, {
    email: email,
    userAgent: e.parameter.userAgent || 'Unknown',
    timestamp: new Date()
  });
  
  // Validate credentials
  const result = validateWebCredentials(email, password);
  
  if (!result || !result.success) {
    const errorMessage = result?.error || 'Invalid email or password';
    logDetailedActivity('Login Failed', `Failed login for email: ${email}`, {
      email: email,
      reason: errorMessage
    });
    return { success: false, error: errorMessage };
  }
  
  const user = result.user;
  
  // Create session
  const sessionToken = createSession(user);
  
  logDetailedActivity('Login Success', `Successful login for: ${user.name}`, {
    email: user.email,
    role: user.role,
    sessionToken: sessionToken
  });
  
  return {
    success: true,
    sessionToken: sessionToken,
    user: {
      email: user.email,
      name: user.name,
      role: user.role
    },
    redirectUrl: `${ScriptApp.getService().getUrl()}?page=dashboard&sessionToken=${sessionToken}`
  };
}

/**
 * Handle web logout
 */
function handleWebLogout(e) {
  const sessionToken = e.parameter.sessionToken;
  
  if (sessionToken) {
    const session = getSessionData(sessionToken);
    if (session) {
      logDetailedActivity('Logout', `User logged out: ${session.user.name}`, {
        email: session.user.email,
        sessionToken: sessionToken
      });
    }
    
    destroySession(sessionToken);
  }
  
  return { 
    success: true, 
    redirectUrl: `${ScriptApp.getService().getUrl()}?page=login`
  };
}

/**
 * Validate web credentials
 */
function validateWebCredentials(email, password) {
  try {
    console.log(`Validating credentials for: ${email}`);
    
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    if (!usersSheet) {
      console.log('❌ Users sheet not found');
      return { error: 'Users sheet not found' };
    }
    
    const lastRow = usersSheet.getLastRow();
    console.log(`Users sheet has ${lastRow} rows`);
    
    if (lastRow < 2) {
      console.log('❌ No users in sheet');
      return { error: 'No users found in system' };
    }
    
    // Get all user data
    const data = usersSheet.getRange(2, 1, lastRow - 1, 6).getValues();
    console.log(`Checking ${data.length} users`);
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      console.log(`Checking user ${i + 1}: ${row[0]}`);
      
      if (row[0] === email) {
        console.log(`✅ Email match found`);
        console.log(`User status: ${row[4]}`);
        
        // Check if user is active
        if (row[4] !== 'Active') {
          console.log(`❌ User account not active: ${row[4]}`);
          return { error: 'Account is not active' };
        }
        
        // Check password
        const storedPassword = row[2];
        console.log(`Password check: stored="${storedPassword}", provided="${password}"`);
        
        if (storedPassword === password) {
          console.log('✅ Password match - login successful');
          return {
            success: true,
            user: {
              email: row[0],      // Email
              name: row[1],       // Name
              role: row[3],       // Role (column D)
              status: row[4],     // Status (column E)
              dateAdded: row[5]   // Date Added (column F)
            }
          };
        } else {
          console.log('❌ Password mismatch');
          return { error: 'Invalid password' };
        }
      }
    }
    
    console.log(`❌ Email not found: ${email}`);
    const allEmails = data.map(row => row[0]);
    console.log('Available emails:', allEmails);
    return { error: 'Email not found' };
    
  } catch (error) {
    console.error('Error validating credentials:', error);
    return { error: error.toString() };
  }
}

/**
 * Session management functions
 */
function createSession(user) {
  const sessionToken = Utilities.getUuid();
  const sessionData = {
    user: user,
    createdAt: new Date(),
    lastAccess: new Date(),
    ipAddress: 'unknown' // You could capture this from the request
  };
  
  // Store session in PropertiesService (temporary storage)
  PropertiesService.getScriptProperties().setProperty(
    `session_${sessionToken}`, 
    JSON.stringify(sessionData)
  );
  
  // Also log session creation
  logSessionActivity('Session Created', sessionToken, user);
  
  return sessionToken;
}

function verifySession(sessionToken) {
  if (!sessionToken) return false;
  
  try {
    const sessionData = PropertiesService.getScriptProperties().getProperty(`session_${sessionToken}`);
    if (!sessionData) return false;
    
    const session = JSON.parse(sessionData);
    const now = new Date();
    const sessionAge = now - new Date(session.createdAt);
    
    // Session expires after 8 hours
    if (sessionAge > 8 * 60 * 60 * 1000) {
      destroySession(sessionToken);
      return false;
    }
    
    // Update last access
    session.lastAccess = now;
    PropertiesService.getScriptProperties().setProperty(
      `session_${sessionToken}`, 
      JSON.stringify(session)
    );
    
    return true;
  } catch (error) {
    console.error('Error verifying session:', error);
    return false;
  }
}

function getSessionData(sessionToken) {
  try {
    const sessionData = PropertiesService.getScriptProperties().getProperty(`session_${sessionToken}`);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Error getting session data:', error);
    return null;
  }
}

function destroySession(sessionToken) {
  PropertiesService.getScriptProperties().deleteProperty(`session_${sessionToken}`);
  
  // Log session destruction
  logSessionActivity('Session Destroyed', sessionToken);
}

/**
 * Enhanced logging functions
 */
function logWebAccess(e) {
  const details = {
    page: e.parameter.page || 'login',
    userAgent: e.parameter.userAgent || 'Unknown',
    timestamp: new Date(),
    parameters: JSON.stringify(e.parameter)
  };
  
  logDetailedActivity('Web Access', `Page access: ${details.page}`, details);
}

function logWebAction(e) {
  const details = {
    action: e.parameter.action,
    sessionToken: e.parameter.sessionToken ? 'Present' : 'Missing',
    timestamp: new Date(),
    parameterCount: Object.keys(e.parameter).length
  };
  
  logDetailedActivity('Web Action', `Action: ${details.action}`, details);
}

function logActionResult(action, result, e) {
  const session = e.parameter.sessionToken ? getSessionData(e.parameter.sessionToken) : null;
  const user = session ? session.user : null;
  
  const details = {
    action: action,
    success: result.success,
    user: user ? user.email : 'Anonymous',
    timestamp: new Date(),
    error: result.error || null
  };
  
  logDetailedActivity('Action Result', `${action}: ${result.success ? 'Success' : 'Failed'}`, details);
}

function logSessionActivity(action, sessionToken, user = null) {
  const details = {
    sessionToken: sessionToken.substring(0, 8) + '...',
    user: user ? user.email : 'Unknown',
    timestamp: new Date()
  };
  
  logDetailedActivity('Session Activity', action, details);
}

function logDetailedActivity(category, description, details = {}) {
  try {
    const activitySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.ACTIVITY_LOG);
    
    // Format: Timestamp, User Email, Action, Description
    const logEntry = [
      new Date(),
      details.user || 'System',
      category,
      `${description} | Details: ${JSON.stringify(details)}`
    ];
    
    activitySheet.appendRow(logEntry);
  } catch (error) {
    console.error('Error logging detailed activity:', error);
  }
}

/**
 * Enhanced permission checking for web app
 */
function hasWebPermission(user, permission) {
  const permissions = getUserPermissions(user.role);
  return permissions[permission] || false;
}

/**
 * Simple password storage (in production, use proper encryption)
 */
function getStoredPassword(email) {
  return PropertiesService.getScriptProperties().getProperty(`pwd_${email}`);
}

function setStoredPassword(email, password) {
  // In production, hash the password properly
  PropertiesService.getScriptProperties().setProperty(`pwd_${email}`, password);
  logDetailedActivity('Password Set', `Password set for user: ${email}`, { email: email });
}

/**
 * Web-specific inventory handlers
 */
function handleGetInventory(e) {
  const session = getSessionData(e.parameter.sessionToken);
  
  if (!hasWebPermission(session.user, 'view_inventory')) {
    return { success: false, error: 'Access denied' };
  }
  
  logDetailedActivity('Inventory View', `User viewed inventory`, {
    user: session.user.email,
    action: 'view_inventory'
  });
  
  return {
    success: true,
    data: getInventoryItems()
  };
}

function handleAddInventory(e) {
  const session = getSessionData(e.parameter.sessionToken);
  
  if (!hasWebPermission(session.user, 'add_inventory')) {
    return { success: false, error: 'Access denied' };
  }
  
  const itemData = JSON.parse(e.parameter.itemData);
  
  logDetailedActivity('Inventory Add', `User added inventory item: ${itemData.productName}`, {
    user: session.user.email,
    item: itemData,
    action: 'add_inventory'
  });
  
  return addInventoryItem(itemData);
}

function handleUpdateInventory(e) {
  const session = getSessionData(e.parameter.sessionToken);
  
  if (!hasWebPermission(session.user, 'edit_inventory')) {
    return { success: false, error: 'Access denied' };
  }
  
  const sku = e.parameter.sku;
  const itemData = JSON.parse(e.parameter.itemData);
  
  logDetailedActivity('Inventory Update', `User updated inventory item: ${sku}`, {
    user: session.user.email,
    sku: sku,
    changes: itemData,
    action: 'update_inventory'
  });
  
  return updateInventoryItem(sku, itemData);
}

function handleDeleteInventory(e) {
  const session = getSessionData(e.parameter.sessionToken);
  
  if (!hasWebPermission(session.user, 'delete_inventory')) {
    return { success: false, error: 'Access denied' };
  }
  
  const sku = e.parameter.sku;
  
  logDetailedActivity('Inventory Delete', `User deleted inventory item: ${sku}`, {
    user: session.user.email,
    sku: sku,
    action: 'delete_inventory'
  });
  
  return deleteInventoryItem(sku);
}

function handleUpdateStock(e) {
  const session = getSessionData(e.parameter.sessionToken);
  
  if (!hasWebPermission(session.user, 'edit_inventory')) {
    return { success: false, error: 'Access denied' };
  }
  
  const sku = e.parameter.sku;
  const quantity = parseInt(e.parameter.quantity);
  const action = e.parameter.stockAction;
  const remarks = e.parameter.remarks;
  
  logDetailedActivity('Stock Update', `User updated stock for: ${sku}`, {
    user: session.user.email,
    sku: sku,
    quantity: quantity,
    action: action,
    remarks: remarks
  });
  
  return updateStock(sku, quantity, action, remarks);
}

/**
 * Get web app URL for deployment
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Initialize web app data
 */
function initializeWebApp() {
  // Make sure the basic system is initialized
  initializeSystem();
  
  // Set up any web-specific configurations
  logDetailedActivity('Web App Init', 'Web application initialized', {
    timestamp: new Date(),
    url: ScriptApp.getService().getUrl()
  });
  
  return {
    success: true,
    url: ScriptApp.getService().getUrl(),
    message: 'Web application initialized successfully'
  };
}