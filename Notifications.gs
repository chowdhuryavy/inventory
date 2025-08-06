/**
 * Notification System
 * Handles email notifications for low stock, expired items, and other alerts
 */

/**
 * Send low stock notifications
 */
function sendLowStockNotifications() {
  if (!hasPermission('view_reports')) {
    return;
  }
  
  try {
    const lowStockItems = getLowStockItems();
    
    if (lowStockItems.length === 0) {
      console.log('No low stock items found');
      return;
    }
    
    const recipients = getNotificationRecipients();
    const report = generateLowStockReport();
    
    recipients.forEach(recipient => {
      sendReportEmail('Low Stock', recipient, report);
    });
    
    logActivity('Low Stock Notification', `Sent low stock alerts for ${lowStockItems.length} items to ${recipients.length} recipients`);
    
  } catch (error) {
    console.error('Error sending low stock notifications:', error);
  }
}

/**
 * Send expiry notifications
 */
function sendExpiryNotifications() {
  if (!hasPermission('view_reports')) {
    return;
  }
  
  try {
    const expiredItems = getExpiredItems();
    const expiringSoonItems = getExpiringSoonItems();
    
    if (expiredItems.length === 0 && expiringSoonItems.length === 0) {
      console.log('No expired or expiring items found');
      return;
    }
    
    const recipients = getNotificationRecipients();
    const report = generateExpiryReport();
    
    recipients.forEach(recipient => {
      sendReportEmail('Expiry', recipient, report);
    });
    
    logActivity('Expiry Notification', `Sent expiry alerts for ${expiredItems.length} expired and ${expiringSoonItems.length} expiring items`);
    
  } catch (error) {
    console.error('Error sending expiry notifications:', error);
  }
}

/**
 * Get notification recipients (all active admins and super admins)
 */
function getNotificationRecipients() {
  const usersData = getSheetData(CONFIG.SHEETS.USERS);
  
  return usersData
    .filter(row => {
      const role = row[2];
      const status = row[3];
      return status === 'Active' && (role === CONFIG.ROLES.SUPER_ADMIN || role === CONFIG.ROLES.ADMIN);
    })
    .map(row => row[0]); // Return email addresses
}

/**
 * Send daily summary notification
 */
function sendDailySummary() {
  if (!hasPermission('view_reports')) {
    return;
  }
  
  try {
    const dashboardData = getDashboardData();
    const recipients = getNotificationRecipients();
    
    const summary = {
      date: new Date().toLocaleDateString(),
      stats: dashboardData.stats,
      alerts: dashboardData.alerts,
      recentActivities: dashboardData.recentActivities.slice(0, 5)
    };
    
    recipients.forEach(recipient => {
      sendDailySummaryEmail(recipient, summary);
    });
    
    logActivity('Daily Summary', `Sent daily summary to ${recipients.length} recipients`);
    
  } catch (error) {
    console.error('Error sending daily summary:', error);
  }
}

/**
 * Send daily summary email
 */
function sendDailySummaryEmail(recipientEmail, summaryData) {
  try {
    const subject = `Daily Inventory Summary - ${summaryData.date}`;
    let body = `Daily Inventory Management Summary\n`;
    body += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    body += `📊 INVENTORY OVERVIEW:\n`;
    body += `• Total Items: ${summaryData.stats.totalItems}\n`;
    body += `• Total Value: $${summaryData.stats.totalValue.toFixed(2)}\n`;
    body += `• Average Price: $${summaryData.stats.averagePrice.toFixed(2)}\n\n`;
    
    body += `🚨 ALERTS:\n`;
    body += `• Low Stock Items: ${summaryData.alerts.lowStock.length}\n`;
    body += `• Expired Items: ${summaryData.alerts.expired.length}\n`;
    body += `• Expiring Soon: ${summaryData.alerts.expiringSoon.length}\n\n`;
    
    if (summaryData.alerts.lowStock.length > 0) {
      body += `⚠️ LOW STOCK ITEMS:\n`;
      summaryData.alerts.lowStock.slice(0, 5).forEach(item => {
        body += `• ${item.productName} (${item.sku}) - Current: ${item.quantity}, Min: ${item.minStockLevel}\n`;
      });
      if (summaryData.alerts.lowStock.length > 5) {
        body += `... and ${summaryData.alerts.lowStock.length - 5} more items\n`;
      }
      body += '\n';
    }
    
    if (summaryData.alerts.expired.length > 0) {
      body += `🚨 EXPIRED ITEMS:\n`;
      summaryData.alerts.expired.slice(0, 5).forEach(item => {
        body += `• ${item.productName} (${item.sku}) - Expired: ${new Date(item.expiryDate).toLocaleDateString()}\n`;
      });
      if (summaryData.alerts.expired.length > 5) {
        body += `... and ${summaryData.alerts.expired.length - 5} more items\n`;
      }
      body += '\n';
    }
    
    body += `📝 RECENT ACTIVITIES:\n`;
    summaryData.recentActivities.forEach(activity => {
      body += `• ${new Date(activity.timestamp).toLocaleString()}: ${activity.action} by ${activity.userEmail}\n`;
    });
    
    body += '\n\nFor detailed reports, please access the Inventory Management System.';
    body += '\n\nThis is an automated notification from the Inventory Management System.';
    
    GmailApp.sendEmail(recipientEmail, subject, body);
    
  } catch (error) {
    console.error('Error sending daily summary email:', error);
    throw error;
  }
}

/**
 * Send critical alert notification
 */
function sendCriticalAlert(alertType, alertData) {
  if (!hasPermission('view_reports')) {
    return;
  }
  
  try {
    const recipients = getNotificationRecipients();
    const subject = `🚨 CRITICAL ALERT: ${alertType}`;
    
    let body = `CRITICAL INVENTORY ALERT\n`;
    body += `Alert Type: ${alertType}\n`;
    body += `Time: ${new Date().toLocaleString()}\n\n`;
    body += `Details:\n${alertData}\n\n`;
    body += `Please take immediate action.\n\n`;
    body += `This is an automated critical alert from the Inventory Management System.`;
    
    recipients.forEach(recipient => {
      GmailApp.sendEmail(recipient, subject, body);
    });
    
    logActivity('Critical Alert', `Sent critical alert: ${alertType}`);
    
  } catch (error) {
    console.error('Error sending critical alert:', error);
  }
}

/**
 * Check for critical stock levels and send alerts
 */
function checkCriticalStockLevels() {
  if (!hasPermission('view_reports')) {
    return;
  }
  
  try {
    const inventoryData = getSheetData(CONFIG.SHEETS.INVENTORY);
    const criticalItems = [];
    
    inventoryData.forEach(row => {
      const productName = row[1];
      const quantity = row[3] || 0;
      const minStock = row[7] || 0;
      
      // Check for zero stock
      if (quantity === 0) {
        criticalItems.push(`OUT OF STOCK: ${productName} (${row[0]})`);
      }
      // Check for critically low stock (below 20% of minimum)
      else if (minStock > 0 && quantity < (minStock * 0.2)) {
        criticalItems.push(`CRITICALLY LOW: ${productName} (${row[0]}) - Only ${quantity} remaining`);
      }
    });
    
    if (criticalItems.length > 0) {
      const alertData = criticalItems.join('\n');
      sendCriticalAlert('Critical Stock Levels', alertData);
    }
    
  } catch (error) {
    console.error('Error checking critical stock levels:', error);
  }
}

/**
 * Setup automated notifications (to be called manually or via triggers)
 */
function setupAutomatedNotifications() {
  // Delete existing triggers first
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction().includes('Notification') || 
        trigger.getHandlerFunction().includes('Summary') ||
        trigger.getHandlerFunction().includes('Check')) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Setup daily summary (every day at 8 AM)
  ScriptApp.newTrigger('sendDailySummary')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
  
  // Setup low stock notifications (every 3 days at 9 AM)
  ScriptApp.newTrigger('sendLowStockNotifications')
    .timeBased()
    .everyDays(3)
    .atHour(9)
    .create();
  
  // Setup expiry notifications (every day at 7 AM)
  ScriptApp.newTrigger('sendExpiryNotifications')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();
  
  // Setup critical stock level checks (every 4 hours)
  ScriptApp.newTrigger('checkCriticalStockLevels')
    .timeBased()
    .everyHours(4)
    .create();
  
  logActivity('Notification Setup', 'Automated notification triggers have been configured');
  
  return { success: true, message: 'Automated notifications have been set up successfully' };
}

/**
 * Disable automated notifications
 */
function disableAutomatedNotifications() {
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction().includes('Notification') || 
        trigger.getHandlerFunction().includes('Summary') ||
        trigger.getHandlerFunction().includes('Check')) {
      ScriptApp.deleteTrigger(trigger);
      deletedCount++;
    }
  });
  
  logActivity('Notification Disable', `Disabled ${deletedCount} automated notification triggers`);
  
  return { success: true, message: `Disabled ${deletedCount} automated notifications` };
}

/**
 * Send test notification
 */
function sendTestNotification() {
  if (!hasPermission('view_reports')) {
    throw new Error('Access denied');
  }
  
  try {
    const currentUserEmail = Session.getActiveUser().getEmail();
    const subject = 'Test Notification - Inventory Management System';
    const body = `This is a test notification from the Inventory Management System.\n\n` +
                 `Sent to: ${currentUserEmail}\n` +
                 `Time: ${new Date().toLocaleString()}\n\n` +
                 `If you received this message, the notification system is working correctly.`;
    
    GmailApp.sendEmail(currentUserEmail, subject, body);
    
    logActivity('Test Notification', 'Sent test notification');
    
    return { success: true, message: 'Test notification sent successfully' };
    
  } catch (error) {
    console.error('Error sending test notification:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Get notification settings and status
 */
function getNotificationStatus() {
  if (!hasPermission('view_reports')) {
    throw new Error('Access denied');
  }
  
  const triggers = ScriptApp.getProjectTriggers();
  const notificationTriggers = triggers.filter(trigger => 
    trigger.getHandlerFunction().includes('Notification') || 
    trigger.getHandlerFunction().includes('Summary') ||
    trigger.getHandlerFunction().includes('Check')
  );
  
  const status = {
    enabled: notificationTriggers.length > 0,
    triggers: notificationTriggers.map(trigger => ({
      function: trigger.getHandlerFunction(),
      type: trigger.getTriggerSource().toString(),
      created: new Date(trigger.getUniqueId()).toLocaleString() // Approximate
    })),
    recipients: getNotificationRecipients(),
    lastActivity: getLastNotificationActivity()
  };
  
  return status;
}

/**
 * Get last notification activity from logs
 */
function getLastNotificationActivity() {
  const activityData = getSheetData(CONFIG.SHEETS.ACTIVITY_LOG);
  
  const notificationActivities = activityData.filter(row => 
    row[2] && (row[2].includes('Notification') || row[2].includes('Summary'))
  );
  
  if (notificationActivities.length === 0) {
    return null;
  }
  
  // Sort by timestamp and get the most recent
  notificationActivities.sort((a, b) => new Date(b[0]) - new Date(a[0]));
  
  return {
    timestamp: notificationActivities[0][0],
    action: notificationActivities[0][2],
    description: notificationActivities[0][3]
  };
}

/**
 * Send custom notification
 */
function sendCustomNotification(subject, message, recipients) {
  if (!hasPermission('view_reports')) {
    throw new Error('Access denied');
  }
  
  try {
    const senderEmail = Session.getActiveUser().getEmail();
    const fullMessage = `${message}\n\n` +
                       `Sent by: ${senderEmail}\n` +
                       `Time: ${new Date().toLocaleString()}\n\n` +
                       `This message was sent via the Inventory Management System.`;
    
    if (Array.isArray(recipients)) {
      recipients.forEach(recipient => {
        GmailApp.sendEmail(recipient, subject, fullMessage);
      });
    } else {
      GmailApp.sendEmail(recipients, subject, fullMessage);
    }
    
    const recipientCount = Array.isArray(recipients) ? recipients.length : 1;
    logActivity('Custom Notification', `Sent custom notification to ${recipientCount} recipient(s): ${subject}`);
    
    return { success: true, message: `Notification sent to ${recipientCount} recipient(s)` };
    
  } catch (error) {
    console.error('Error sending custom notification:', error);
    return { success: false, message: error.toString() };
  }
}