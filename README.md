# 📦 Inventory Management System

A comprehensive inventory management solution for small grocery stores and supermarkets, built with Google Sheets as the database and Google Apps Script for automation and user interface.

## 🌟 Features

### Core Functionality
- **Inventory Management**: Add, edit, delete, and search products with comprehensive details
- **Stock Management**: Real-time stock in/out operations with automatic logging
- **User Management**: Role-based access control with three user levels
- **Reports & Analytics**: Dynamic reports with data visualization
- **Notifications**: Automated email alerts for low stock and expired items
- **Activity Logging**: Complete audit trail of all system activities

### User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full system access, manage all users including other admins, cannot delete own account |
| **Admin** | Manage inventory fully, manage users (except Super Admins), view all reports and logs |
| **Cashier** | Add/edit inventory items, update stock levels, view reports (cannot delete items or users) |

### Key Benefits
- ✅ No additional software installation required
- ✅ Accessible from any device with internet
- ✅ Real-time collaboration
- ✅ Automatic backups through Google Drive
- ✅ Mobile-friendly interface
- ✅ Cost-effective solution

## 🚀 Setup Instructions

### Step 1: Create Google Sheets Document

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Rename it to "Inventory Management System" or your preferred name

### Step 2: Set Up Google Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code in the script editor
3. Copy and paste each of the following files into separate script files:

#### Create the following script files:

1. **Code.gs** - Main system functions and initialization
2. **InventoryManager.gs** - Inventory CRUD operations
3. **UserManager.gs** - User management functions
4. **Reports.gs** - Reporting and analytics functions
5. **Notifications.gs** - Email notification system

#### Create the following HTML files:

1. **Dashboard.html** - Main dashboard interface
2. **InventoryManager.html** - Inventory management interface
3. **UserManager.html** - User management interface

### Step 3: Configure Permissions

1. In the Apps Script editor, click **Run** on the `initializeSystem` function
2. When prompted, review and accept the permissions:
   - **Google Sheets**: To read and write data
   - **Gmail**: To send notification emails
   - **Script Triggers**: For automated notifications

### Step 4: Initialize the System

1. Go back to your Google Sheet
2. Refresh the page
3. You should see a new menu called "Inventory Management"
4. Click **Inventory Management > Initialize System**
5. The system will create all required sheets and set you as the first Super Admin

### Step 5: Configure Automated Notifications (Optional)

1. In your Google Sheet, go to **Inventory Management > Setup System**
2. Run the function `setupAutomatedNotifications()` from the Apps Script editor
3. This will set up automated triggers for:
   - Daily summary emails (8 AM)
   - Low stock notifications (every 3 days at 9 AM)
   - Expiry notifications (daily at 7 AM)
   - Critical stock level checks (every 4 hours)

## 📋 Google Sheets Structure

The system automatically creates the following sheets:

### Inventory Sheet
| Column | Description |
|--------|-------------|
| SKU | Unique product identifier |
| Product Name | Name of the product |
| Category | Product category |
| Quantity | Current stock quantity |
| Unit Price | Price per unit |
| Supplier | Supplier information |
| Expiry Date | Product expiry date |
| Min Stock Level | Minimum stock threshold |
| Last Updated | Last modification timestamp |
| Last Updated By | User who made the last update |

### Users Sheet
| Column | Description |
|--------|-------------|
| Email | User's email address |
| Name | User's full name |
| Role | User role (Super Admin/Admin/Cashier) |
| Status | Account status (Active/Inactive) |
| Date Added | Account creation date |

### Stock_Log Sheet
| Column | Description |
|--------|-------------|
| Timestamp | When the stock change occurred |
| SKU | Product SKU |
| Product Name | Product name |
| Action | Stock In or Stock Out |
| Quantity | Amount changed |
| Updated By | User who made the change |
| Remarks | Additional notes |

### Activity_Log Sheet
| Column | Description |
|--------|-------------|
| Timestamp | When the activity occurred |
| User Email | Who performed the action |
| Action | Type of action performed |
| Description | Detailed description |

### Reports Sheet
Dynamic sheet for generated reports and analytics.

## 🎯 How to Use

### Getting Started

1. **Access the System**: Open your Google Sheet and use the "Inventory Management" menu
2. **View Dashboard**: Click "📊 Dashboard" for an overview of your inventory
3. **Manage Inventory**: Click "📦 Manage Inventory" to add, edit, or update products
4. **User Management**: (Admin/Super Admin only) Click "👥 Manage Users" to add team members

### Adding Your First Product

1. Go to **Inventory Management > Manage Inventory**
2. Click **Add Item**
3. Fill in the required fields:
   - **SKU**: Unique identifier (e.g., "MILK001")
   - **Product Name**: "Whole Milk 1L"
   - **Category**: "Dairy"
   - **Quantity**: Initial stock amount
   - **Unit Price**: Price per unit
   - **Supplier**: Supplier name
   - **Expiry Date**: When the product expires
   - **Min Stock Level**: When to trigger low stock alerts
4. Click **Save Item**

### Managing Stock

#### Stock In (Receiving New Stock)
1. Go to **Manage Inventory**
2. Click **Update Stock**
3. Select the product
4. Choose "Stock In"
5. Enter quantity received
6. Add remarks (optional)
7. Click **Update Stock**

#### Stock Out (Sales/Usage)
1. Follow the same process but select "Stock Out"
2. System will prevent negative stock levels

### Adding Team Members

1. Go to **User Management** (requires Admin or Super Admin role)
2. Click **Add User**
3. Enter user details:
   - **Email**: User's Google account email
   - **Name**: Full name
   - **Role**: Select appropriate role
   - **Status**: Usually "Active"
4. Click **Save User**

### Viewing Reports

1. Go to **View Reports** from the main menu
2. Available reports:
   - **Inventory Summary**: Overall inventory statistics
   - **Low Stock Report**: Items below minimum levels
   - **Expiry Report**: Expired and expiring items
   - **Stock Movement**: Transaction history
   - **User Activity**: System usage analytics

### Setting Up Notifications

1. Go to the Apps Script editor
2. Run the `setupAutomatedNotifications()` function
3. Or use `sendTestNotification()` to test email functionality

## 🔧 Advanced Features

### Custom Reports
Create filtered reports based on:
- Category
- Supplier
- Stock levels
- Date ranges

### Email Notifications
- **Daily Summaries**: Overview of inventory status
- **Low Stock Alerts**: When items need restocking
- **Expiry Warnings**: Items approaching expiration
- **Critical Alerts**: Out of stock notifications

### Barcode Support (Future Enhancement)
The system is designed to support barcode scanning through mobile devices for quick stock updates.

## 🛡️ Security Features

- **Role-based Access Control**: Users only see what they're authorized to access
- **Audit Trail**: Complete logging of all activities
- **Data Validation**: Prevents invalid data entry
- **Protected Functions**: Critical operations require proper permissions

## 📱 Mobile Usage

The interface is fully responsive and works on mobile devices:
- Touch-friendly buttons and forms
- Optimized layouts for small screens
- Fast loading and minimal data usage

## 🚨 Troubleshooting

### Common Issues

**Menu not appearing**
- Refresh the Google Sheet
- Check if the script has proper permissions
- Ensure the `onOpen()` function is properly set up

**Permission errors**
- Re-run the authorization process
- Check that your Google account has access to the sheet
- Verify Gmail sending permissions

**Data not loading**
- Check your internet connection
- Ensure the sheet names match the configuration
- Verify that the sheets were created properly

**Email notifications not working**
- Test with `sendTestNotification()` function
- Check Gmail quota limits
- Verify email addresses are correct

### Getting Help

1. Check the Activity Log for error messages
2. Use the browser's developer console for JavaScript errors
3. Verify that all required sheets exist and have proper headers
4. Test individual functions in the Apps Script editor

## 🔄 Backup and Maintenance

### Regular Backups
- Google Sheets automatically saves changes
- Consider making periodic copies of your sheet
- Export important data regularly

### Maintenance Tasks
- Review and clean old log entries periodically
- Monitor storage usage in Google Drive
- Update user access as team changes
- Review and update notification settings

## 📈 Future Enhancements

Planned features for future versions:
- **Barcode Scanning**: Mobile barcode input
- **Purchase Orders**: Automated supplier orders
- **Sales Analytics**: Revenue and profit tracking
- **Multi-location Support**: Manage multiple stores
- **API Integration**: Connect with POS systems
- **Advanced Reporting**: Custom dashboard widgets

## 🤝 Support

For technical support or feature requests:
1. Check this documentation first
2. Review the Google Apps Script logs
3. Test with a simplified dataset
4. Document any error messages clearly

## 📄 License

This inventory management system is provided as-is for educational and commercial use. Feel free to modify and adapt it to your specific needs.

---

**Built with ❤️ using Google Apps Script and Google Sheets**

*Last updated: December 2024*