/**
 * User Management Functions
 * Handles user CRUD operations with role-based access control
 */

/**
 * Show user management interface
 */
function showUserManager() {
  if (!hasPermission('manage_users')) {
    SpreadsheetApp.getUi().alert('Access Denied', 'You do not have permission to manage users.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  const html = HtmlService.createTemplateFromFile('UserManager');
  html.userRole = getCurrentUserRole();
  
  const htmlOutput = html.evaluate()
    .setWidth(700)
    .setHeight(500)
    .setTitle('User Management');
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'User Management');
}

/**
 * Get all users (excluding sensitive info based on role)
 */
function getUsers() {
  if (!hasPermission('manage_users')) {
    throw new Error('Access denied: You do not have permission to view users');
  }
  
  const currentUserRole = getCurrentUserRole();
  const data = getSheetData(CONFIG.SHEETS.USERS);
  
  return data.map((row, index) => {
    const user = {
      rowIndex: index + 2,
      email: row[0],
      name: row[1],
      role: row[2],
      status: row[3],
      dateAdded: row[4]
    };
    
    // Admins cannot see or manage Super Admins
    if (currentUserRole === CONFIG.ROLES.ADMIN && user.role === CONFIG.ROLES.SUPER_ADMIN) {
      return null;
    }
    
    return user;
  }).filter(user => user !== null);
}

/**
 * Add new user
 */
function addUser(userData) {
  if (!hasPermission('manage_users')) {
    throw new Error('Access denied: You do not have permission to add users');
  }
  
  try {
    const currentUserRole = getCurrentUserRole();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
    
    // Validate required fields
    if (!userData.email || !userData.name || !userData.role) {
      throw new Error('Email, Name, and Role are required fields');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }
    
    // Check if user already exists
    if (findRowByColumnValue(CONFIG.SHEETS.USERS, 0, userData.email) > 0) {
      throw new Error('User with this email already exists');
    }
    
    // Validate role permissions
    if (currentUserRole === CONFIG.ROLES.ADMIN && userData.role === CONFIG.ROLES.SUPER_ADMIN) {
      throw new Error('Admins cannot create Super Admin users');
    }
    
    // Validate role value
    const validRoles = [CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN, CONFIG.ROLES.CASHIER];
    if (!validRoles.includes(userData.role)) {
      throw new Error('Invalid role specified');
    }
    
    const newUser = [
      userData.email,
      userData.name,
      userData.role,
      userData.status || 'Active',
      new Date()
    ];
    
    sheet.appendRow(newUser);
    
    // Log the activity
    logActivity('Add User', `Added new user: ${userData.name} (${userData.email}) with role: ${userData.role}`);
    
    return { success: true, message: 'User added successfully' };
    
  } catch (error) {
    console.error('Error adding user:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Update existing user
 */
function updateUser(email, userData) {
  if (!hasPermission('manage_users')) {
    throw new Error('Access denied: You do not have permission to update users');
  }
  
  try {
    const currentUserRole = getCurrentUserRole();
    const currentUserEmail = Session.getActiveUser().getEmail();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
    const rowIndex = findRowByColumnValue(CONFIG.SHEETS.USERS, 0, email);
    
    if (rowIndex === -1) {
      throw new Error('User not found');
    }
    
    const currentData = sheet.getRange(rowIndex, 1, 1, 5).getValues()[0];
    const targetUserRole = currentData[2];
    
    // Role-based restrictions
    if (currentUserRole === CONFIG.ROLES.ADMIN && targetUserRole === CONFIG.ROLES.SUPER_ADMIN) {
      throw new Error('Admins cannot modify Super Admin users');
    }
    
    if (currentUserRole === CONFIG.ROLES.ADMIN && userData.role === CONFIG.ROLES.SUPER_ADMIN) {
      throw new Error('Admins cannot assign Super Admin role');
    }
    
    // Prevent users from changing their own Super Admin role
    if (email === currentUserEmail && targetUserRole === CONFIG.ROLES.SUPER_ADMIN && userData.role !== CONFIG.ROLES.SUPER_ADMIN) {
      throw new Error('Super Admins cannot change their own role');
    }
    
    // Validate role if provided
    if (userData.role) {
      const validRoles = [CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN, CONFIG.ROLES.CASHIER];
      if (!validRoles.includes(userData.role)) {
        throw new Error('Invalid role specified');
      }
    }
    
    const updatedUser = [
      currentData[0], // Email cannot be changed
      userData.name || currentData[1],
      userData.role || currentData[2],
      userData.status || currentData[3],
      currentData[4] // Keep original date added
    ];
    
    sheet.getRange(rowIndex, 1, 1, updatedUser.length).setValues([updatedUser]);
    
    // Log the activity
    logActivity('Update User', `Updated user: ${updatedUser[1]} (${updatedUser[0]})`);
    
    return { success: true, message: 'User updated successfully' };
    
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Delete user (actually deactivate)
 */
function deleteUser(email) {
  if (!hasPermission('manage_users')) {
    throw new Error('Access denied: You do not have permission to delete users');
  }
  
  try {
    const currentUserRole = getCurrentUserRole();
    const currentUserEmail = Session.getActiveUser().getEmail();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
    const rowIndex = findRowByColumnValue(CONFIG.SHEETS.USERS, 0, email);
    
    if (rowIndex === -1) {
      throw new Error('User not found');
    }
    
    const userData = sheet.getRange(rowIndex, 1, 1, 5).getValues()[0];
    const targetUserRole = userData[2];
    
    // Prevent self-deletion
    if (email === currentUserEmail) {
      throw new Error('You cannot delete your own account');
    }
    
    // Role-based restrictions
    if (currentUserRole === CONFIG.ROLES.ADMIN && targetUserRole === CONFIG.ROLES.SUPER_ADMIN) {
      throw new Error('Admins cannot delete Super Admin users');
    }
    
    // Instead of deleting, we deactivate the user
    sheet.getRange(rowIndex, 4).setValue('Inactive'); // Status column
    
    // Log the activity
    logActivity('Deactivate User', `Deactivated user: ${userData[1]} (${userData[0]})`);
    
    return { success: true, message: 'User deactivated successfully' };
    
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Reactivate user
 */
function reactivateUser(email) {
  if (!hasPermission('manage_users')) {
    throw new Error('Access denied: You do not have permission to reactivate users');
  }
  
  try {
    const currentUserRole = getCurrentUserRole();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
    const rowIndex = findRowByColumnValue(CONFIG.SHEETS.USERS, 0, email);
    
    if (rowIndex === -1) {
      throw new Error('User not found');
    }
    
    const userData = sheet.getRange(rowIndex, 1, 1, 5).getValues()[0];
    const targetUserRole = userData[2];
    
    // Role-based restrictions
    if (currentUserRole === CONFIG.ROLES.ADMIN && targetUserRole === CONFIG.ROLES.SUPER_ADMIN) {
      throw new Error('Admins cannot reactivate Super Admin users');
    }
    
    sheet.getRange(rowIndex, 4).setValue('Active'); // Status column
    
    // Log the activity
    logActivity('Reactivate User', `Reactivated user: ${userData[1]} (${userData[0]})`);
    
    return { success: true, message: 'User reactivated successfully' };
    
  } catch (error) {
    console.error('Error reactivating user:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Get user by email
 */
function getUserByEmail(email) {
  if (!hasPermission('manage_users')) {
    throw new Error('Access denied');
  }
  
  const currentUserRole = getCurrentUserRole();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
  const rowIndex = findRowByColumnValue(CONFIG.SHEETS.USERS, 0, email);
  
  if (rowIndex === -1) {
    return null;
  }
  
  const userData = sheet.getRange(rowIndex, 1, 1, 5).getValues()[0];
  
  // Admins cannot see Super Admin details
  if (currentUserRole === CONFIG.ROLES.ADMIN && userData[2] === CONFIG.ROLES.SUPER_ADMIN) {
    return null;
  }
  
  return {
    email: userData[0],
    name: userData[1],
    role: userData[2],
    status: userData[3],
    dateAdded: userData[4]
  };
}

/**
 * Get user statistics
 */
function getUserStats() {
  if (!hasPermission('manage_users')) {
    throw new Error('Access denied');
  }
  
  const currentUserRole = getCurrentUserRole();
  const data = getSheetData(CONFIG.SHEETS.USERS);
  
  const stats = {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    roleDistribution: {
      [CONFIG.ROLES.SUPER_ADMIN]: 0,
      [CONFIG.ROLES.ADMIN]: 0,
      [CONFIG.ROLES.CASHIER]: 0
    }
  };
  
  data.forEach(row => {
    const role = row[2];
    const status = row[3];
    
    // Admins cannot see Super Admin statistics
    if (currentUserRole === CONFIG.ROLES.ADMIN && role === CONFIG.ROLES.SUPER_ADMIN) {
      return;
    }
    
    stats.totalUsers++;
    
    if (status === 'Active') {
      stats.activeUsers++;
    } else {
      stats.inactiveUsers++;
    }
    
    if (stats.roleDistribution.hasOwnProperty(role)) {
      stats.roleDistribution[role]++;
    }
  });
  
  return stats;
}

/**
 * Validate user permissions for specific actions
 */
function validateUserAction(targetEmail, action) {
  const currentUserRole = getCurrentUserRole();
  const currentUserEmail = Session.getActiveUser().getEmail();
  const targetUser = getUserByEmail(targetEmail);
  
  if (!targetUser) {
    throw new Error('Target user not found');
  }
  
  // Self-modification restrictions
  if (targetEmail === currentUserEmail) {
    if (action === 'delete') {
      throw new Error('You cannot delete your own account');
    }
    if (action === 'role_change' && currentUserRole === CONFIG.ROLES.SUPER_ADMIN) {
      throw new Error('Super Admins cannot change their own role');
    }
  }
  
  // Admin restrictions on Super Admin users
  if (currentUserRole === CONFIG.ROLES.ADMIN && targetUser.role === CONFIG.ROLES.SUPER_ADMIN) {
    throw new Error('Admins cannot modify Super Admin users');
  }
  
  return true;
}

/**
 * Bulk user operations
 */
function bulkUpdateUsers(userUpdates) {
  if (!hasPermission('manage_users')) {
    throw new Error('Access denied: You do not have permission to perform bulk user updates');
  }
  
  const results = [];
  
  userUpdates.forEach(update => {
    try {
      let result;
      switch (update.action) {
        case 'activate':
          result = reactivateUser(update.email);
          break;
        case 'deactivate':
          result = deleteUser(update.email);
          break;
        case 'update_role':
          result = updateUser(update.email, { role: update.newRole });
          break;
        default:
          result = { success: false, message: 'Invalid action' };
      }
      
      results.push({
        email: update.email,
        action: update.action,
        success: result.success,
        message: result.message
      });
      
    } catch (error) {
      results.push({
        email: update.email,
        action: update.action,
        success: false,
        message: error.toString()
      });
    }
  });
  
  // Log bulk operation
  logActivity('Bulk User Update', `Performed bulk update on ${userUpdates.length} users`);
  
  return results;
}

/**
 * Get available roles based on current user's permissions
 */
function getAvailableRoles() {
  const currentUserRole = getCurrentUserRole();
  
  if (currentUserRole === CONFIG.ROLES.SUPER_ADMIN) {
    return [CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN, CONFIG.ROLES.CASHIER];
  } else if (currentUserRole === CONFIG.ROLES.ADMIN) {
    return [CONFIG.ROLES.ADMIN, CONFIG.ROLES.CASHIER];
  }
  
  return [];
}