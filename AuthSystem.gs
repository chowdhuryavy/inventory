/**
 * Enhanced Authentication System
 * Provides additional login controls and session management
 */

/**
 * Enhanced user authentication with login tracking
 */
function authenticateUser() {
  const userEmail = Session.getActiveUser().getEmail();
  const userRole = getCurrentUserRole();
  
  if (!userRole) {
    // User not found in system
    logActivity('Access Denied', `Unauthorized access attempt by ${userEmail}`);
    return {
      authenticated: false,
      message: 'Access denied. Please contact your administrator for access.',
      userEmail: userEmail
    };
  }
  
  // Check if user is active
  const user = getUserByEmailInternal(userEmail);
  if (!user || user.status !== 'Active') {
    logActivity('Access Denied', `Inactive user access attempt by ${userEmail}`);
    return {
      authenticated: false,
      message: 'Your account is inactive. Please contact your administrator.',
      userEmail: userEmail
    };
  }
  
  // Log successful login
  logActivity('User Login', `Successful login by ${user.name} (${user.role})`);
  
  return {
    authenticated: true,
    user: user,
    permissions: getUserPermissions(userRole)
  };
}

/**
 * Get user by email (internal function)
 */
function getUserByEmailInternal(email) {
  try {
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
    if (!usersSheet) return null;
    
    const lastRow = usersSheet.getLastRow();
    if (lastRow < 2) return null;
    
    const data = usersSheet.getRange(2, 1, lastRow - 1, 5).getValues();
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === email) {
        return {
          email: data[i][0],
          name: data[i][1],
          role: data[i][2],
          status: data[i][3],
          dateAdded: data[i][4]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Get detailed permissions for a role
 */
function getUserPermissions(role) {
  const permissions = {
    'view_dashboard': false,
    'view_inventory': false,
    'add_inventory': false,
    'edit_inventory': false,
    'delete_inventory': false,
    'manage_users': false,
    'manage_super_admin': false,
    'view_reports': false,
    'view_logs': false,
    'send_notifications': false,
    'manage_system': false
  };
  
  switch (role) {
    case CONFIG.ROLES.SUPER_ADMIN:
      // Super Admin gets all permissions
      Object.keys(permissions).forEach(key => permissions[key] = true);
      break;
      
    case CONFIG.ROLES.ADMIN:
      permissions.view_dashboard = true;
      permissions.view_inventory = true;
      permissions.add_inventory = true;
      permissions.edit_inventory = true;
      permissions.delete_inventory = true;
      permissions.manage_users = true;
      permissions.view_reports = true;
      permissions.view_logs = true;
      permissions.send_notifications = true;
      permissions.manage_system = true;
      break;
      
    case CONFIG.ROLES.CASHIER:
      permissions.view_dashboard = true;
      permissions.view_inventory = true;
      permissions.add_inventory = true;
      permissions.edit_inventory = true;
      permissions.view_reports = true;
      permissions.view_logs = true;
      break;
  }
  
  return permissions;
}

/**
 * Check if user can access a specific feature
 */
function canUserAccess(feature) {
  const userRole = getCurrentUserRole();
  if (!userRole) return false;
  
  const permissions = getUserPermissions(userRole);
  return permissions[feature] || false;
}

/**
 * Enhanced login page with user verification
 */
function showLoginStatus() {
  const auth = authenticateUser();
  
  const html = HtmlService.createTemplateFromFile('LoginStatus');
  html.authResult = auth;
  
  const htmlOutput = html.evaluate()
    .setWidth(500)
    .setHeight(400)
    .setTitle('Login Status');
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'System Access Status');
}

/**
 * Force user logout by showing access denied message
 */
function showAccessDenied(reason = 'Access denied') {
  const ui = SpreadsheetApp.getUi();
  const currentUserEmail = Session.getActiveUser().getEmail();
  
  ui.alert(
    'Access Denied',
    `${reason}\n\nUser: ${currentUserEmail}\n\nPlease contact your system administrator.`,
    ui.ButtonSet.OK
  );
}

/**
 * Get login history for current user
 */
function getUserLoginHistory(days = 30) {
  if (!hasPermission('view_logs')) {
    throw new Error('Access denied');
  }
  
  const currentUserEmail = Session.getActiveUser().getEmail();
  const activityData = getSheetData(CONFIG.SHEETS.ACTIVITY_LOG);
  const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  
  return activityData.filter(row => {
    const timestamp = new Date(row[0]);
    const userEmail = row[1];
    const action = row[2];
    
    return userEmail === currentUserEmail && 
           action === 'User Login' && 
           timestamp >= cutoffDate;
  }).map(row => ({
    timestamp: row[0],
    description: row[3]
  }));
}

/**
 * Get all user login activity (Admin/Super Admin only)
 */
function getAllLoginActivity(days = 7) {
  if (!hasPermission('manage_users')) {
    throw new Error('Access denied');
  }
  
  const activityData = getSheetData(CONFIG.SHEETS.ACTIVITY_LOG);
  const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  
  return activityData.filter(row => {
    const timestamp = new Date(row[0]);
    const action = row[2];
    
    return action === 'User Login' && timestamp >= cutoffDate;
  }).map(row => ({
    timestamp: row[0],
    userEmail: row[1],
    description: row[3]
  }));
}

/**
 * Validate session and redirect if needed
 */
function validateSession() {
  const auth = authenticateUser();
  
  if (!auth.authenticated) {
    showAccessDenied(auth.message);
    return false;
  }
  
  return true;
}

/**
 * Check if user has valid Google Sheets access
 */
function checkSheetAccess() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const protection = ss.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    
    // Check if user can edit the spreadsheet
    const userEmail = Session.getActiveUser().getEmail();
    const editors = ss.getEditors().map(editor => editor.getEmail());
    
    return {
      canEdit: editors.includes(userEmail) || ss.getOwner().getEmail() === userEmail,
      sheetName: ss.getName(),
      userEmail: userEmail
    };
  } catch (error) {
    return {
      canEdit: false,
      error: error.toString()
    };
  }
}

/**
 * Enhanced menu with authentication check
 */
function onOpenWithAuth() {
  const ui = SpreadsheetApp.getUi();
  
  // First check if user has sheet access
  const sheetAccess = checkSheetAccess();
  if (!sheetAccess.canEdit) {
    ui.alert(
      'Access Denied', 
      'You do not have edit permissions for this spreadsheet. Please contact the owner.',
      ui.ButtonSet.OK
    );
    return;
  }
  
  // Then check system authentication
  const auth = authenticateUser();
  
  const menu = ui.createMenu('Inventory Management');
  
  if (auth.authenticated) {
    const permissions = auth.user ? getUserPermissions(auth.user.role) : {};
    
    if (permissions.view_dashboard) {
      menu.addItem('📊 Dashboard', 'showDashboard');
    }
    
    if (permissions.view_inventory) {
      menu.addItem('📦 Manage Inventory', 'showInventoryManager');
    }
    
    if (permissions.manage_users) {
      menu.addItem('👥 Manage Users', 'showUserManager');
    }
    
    if (permissions.view_reports) {
      menu.addItem('📈 View Reports', 'showReports');
    }
    
    if (permissions.view_logs) {
      menu.addItem('📋 View Logs', 'showLogs');
    }
    
    menu.addSeparator();
    menu.addItem('🔍 Login Status', 'showLoginStatus');
    
    if (permissions.manage_system) {
      menu.addItem('⚙️ Setup System', 'initializeSystem');
    }
  } else {
    menu.addItem('🔧 Initialize System', 'initializeSystem');
    menu.addItem('👤 Request Access', 'requestAccess');
    menu.addItem('🔍 Check Access', 'showLoginStatus');
  }
  
  menu.addToUi();
}

/**
 * Request access for unauthorized users
 */
function requestAccess() {
  const ui = SpreadsheetApp.getUi();
  const currentUserEmail = Session.getActiveUser().getEmail();
  
  // Get all admins to send request to
  const adminEmails = getNotificationRecipients(); // Gets active admins and super admins
  
  if (adminEmails.length === 0) {
    ui.alert(
      'No Administrators Found',
      'No active administrators found in the system. Please contact the system owner.',
      ui.ButtonSet.OK
    );
    return;
  }
  
  // Send access request email
  const subject = 'Inventory System Access Request';
  const body = `A new user is requesting access to the Inventory Management System.\n\n` +
               `User Details:\n` +
               `Email: ${currentUserEmail}\n` +
               `Request Time: ${new Date().toLocaleString()}\n\n` +
               `To grant access:\n` +
               `1. Go to the Inventory Management System\n` +
               `2. Open User Management\n` +
               `3. Add this user with appropriate role\n\n` +
               `This is an automated request from the Inventory Management System.`;
  
  try {
    adminEmails.forEach(adminEmail => {
      GmailApp.sendEmail(adminEmail, subject, body);
    });
    
    logActivity('Access Request', `Access request sent by ${currentUserEmail}`);
    
    ui.alert(
      'Access Request Sent',
      `Your access request has been sent to the system administrators.\n\nYou will receive access once an administrator approves your request.`,
      ui.ButtonSet.OK
    );
  } catch (error) {
    ui.alert(
      'Error',
      'Failed to send access request. Please contact the system administrator directly.',
      ui.ButtonSet.OK
    );
  }
}