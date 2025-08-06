# 📁 **Inventory Management System - File Structure**

## 🗂️ **Complete File Overview (18 Files)**

### **📊 Core System Files (4 files)**
```
Code.gs                  - Core functions, settings, utilities (12KB)
WebApp.gs               - Main web application logic (28KB)
SetupExactSheets.gs     - Google Sheets initialization (8.2KB)
SettingsManager.gs      - Company settings management (10KB)
```

### **🔧 Feature Modules (4 files)**
```
InventoryManager.gs     - Inventory CRUD operations (12KB)
UserManager.gs          - User management functions (13KB)
Reports.gs              - Reporting and analytics (16KB)
Notifications.gs        - Email notifications system (12KB)
```

### **🌐 Web Interface Files (7 files)**
```
WebLogin-Mobile.html    - Mobile-optimized login page (25KB)
WebDashboard.html       - Professional dashboard with sidebar (20KB)
WebInventory.html       - Inventory management interface (9.9KB)
WebUsers.html           - User management interface (10KB)
WebReports.html         - Reports and analytics page (14KB)
WebAccessDenied.html    - Professional 403 error page (5KB)
WebLoading.html         - Animated loading page (9.4KB)
```

### **📚 Documentation (3 files)**
```
FILE_STRUCTURE.md       - This file structure overview
PROFESSIONAL_IMPROVEMENTS.md - Design improvements summary (5.3KB)
CLEANUP_SUMMARY.md      - File cleanup summary (4.8KB)
CODE_REVIEW_FIXES.md    - Code review and fixes (7.2KB)
```

## 🏗️ **System Architecture**

### **📱 Web Application Flow:**
```
1. User visits web app URL
2. WebApp.gs -> doGet() -> Routes to appropriate page
3. Login: WebLogin-Mobile.html
4. Loading: WebLoading.html (with company branding)
5. Dashboard: WebDashboard.html (professional sidebar)
6. Features: WebInventory/WebUsers/WebReports.html
```

### **🔐 Authentication Flow:**
```
1. User enters credentials in WebLogin-Mobile.html
2. Form submits to WebApp.gs -> doPost() -> handleWebLogin()
3. Validates against Users sheet via validateWebCredentials()
4. Creates session token via createSession()
5. Redirects to loading page, then dashboard
```

### **🗄️ Data Management:**
```
Google Sheets Backend:
├── Inventory (SKU, Product Name, Category, Quantity, etc.)
├── Users (Email, Name, Password, Role, Status, Date Added)
├── Stock_log (Timestamp, SKU, Product Name, Action, etc.)
├── Activity_log (Timestamp, User Email, Action, Description)
├── Reports (Generated reports data)
└── Settings (Company Name, Slogan, Logo)
```

## 📋 **Function Distribution**

### **🔹 Code.gs - Core Functions:**
```javascript
- CONFIG object (sheets, roles, permissions)
- initializeSystem() - Setup all sheets
- getCurrentUserRole() - Get user permissions
- hasPermission() - Check user access
- logActivity() - Log user actions
- getCompanySettings() - Read from Settings sheet
- createSettingsSheet() - Initialize Settings sheet
```

### **🔹 WebApp.gs - Web Logic:**
```javascript
- doGet() - Handle page routing
- doPost() - Handle form submissions and AJAX
- showLoginPage() - Render login page
- showWebDashboard() - Render dashboard
- showLoadingPage() - Render loading page
- handleWebLogin() - Process login
- validateWebCredentials() - Check user credentials
- Session management functions
- handleGetDashboardData() - Dashboard statistics
- handleGetUsers() - User management data
- handleGetReports() - Reports data
```

### **🔹 InventoryManager.gs:**
```javascript
- showInventoryManager() - Main inventory UI
- getInventoryData() - Fetch inventory
- addInventoryItem() - Add new product
- updateInventoryItem() - Update existing product
- deleteInventoryItem() - Remove product
- updateStock() - Stock in/out operations
- logStockChange() - Track stock changes
```

### **🔹 UserManager.gs:**
```javascript
- showUserManager() - User management UI
- getUsersData() - Fetch all users
- addUser() - Create new user
- updateUser() - Modify user details
- deleteUser() - Remove user (with restrictions)
- validateUserData() - Input validation
```

### **🔹 Reports.gs:**
```javascript
- showReports() - Reports interface
- getDashboardData() - Dashboard statistics
- generateInventoryReport() - Full inventory
- generateLowStockReport() - Items below minimum
- generateExpiringReport() - Items expiring soon
- generateStockLogReport() - Transaction history
- generateActivityReport() - User activity logs
```

## 🎯 **Key Features by File**

### **🔹 WebLogin-Mobile.html:**
```
✅ Mobile-responsive design
✅ Company branding integration
✅ Forgot password functionality
✅ Remember me checkbox
✅ Loading spinner in button
✅ Professional styling
✅ Input validation
```

### **🔹 WebDashboard.html:**
```
✅ Sidebar navigation
✅ Company branding header
✅ User avatar and info
✅ Real-time statistics cards
✅ Quick action buttons
✅ Mobile hamburger menu
✅ Role-based navigation
✅ Professional design
```

### **🔹 WebLoading.html:**
```
✅ Company logo animation
✅ Progress bar with shimmer
✅ Floating particles
✅ Dynamic status messages
✅ Auto-redirect functionality
✅ Mobile-responsive
✅ Company branding
```

## 🔗 **File Dependencies**

### **🔹 Core Dependencies:**
```
WebApp.gs ←→ Code.gs (settings, utilities)
WebApp.gs ←→ All HTML files (templates)
All .gs files ←→ Google Sheets (data backend)
```

### **🔹 HTML Template Dependencies:**
```
All HTML files use these template variables:
- companyName (from Settings sheet)
- slogan (from Settings sheet) 
- logo (from Settings sheet)
- user (session user object)
- sessionToken (authentication)
- appUrl (web app URL)
```

### **🔹 Google Sheets Dependencies:**
```
Code.gs creates/manages:
├── Inventory sheet
├── Users sheet  
├── Stock_log sheet
├── Activity_log sheet
├── Reports sheet
└── Settings sheet
```

## 🚀 **Deployment Files**

### **🔹 Required Files for Deployment:**
```
Core (Required):
├── Code.gs ✅
├── WebApp.gs ✅
├── SetupExactSheets.gs ✅
└── SettingsManager.gs ✅

Web Interface (Required):
├── WebLogin-Mobile.html ✅
├── WebDashboard.html ✅
├── WebLoading.html ✅
└── WebAccessDenied.html ✅

Features (Optional but Recommended):
├── WebInventory.html ✅
├── WebUsers.html ✅
├── WebReports.html ✅
├── InventoryManager.gs ✅
├── UserManager.gs ✅
├── Reports.gs ✅
└── Notifications.gs ✅
```

### **🔹 Optional Files:**
```
Documentation (can be deleted in production):
├── FILE_STRUCTURE.md
├── PROFESSIONAL_IMPROVEMENTS.md
├── CLEANUP_SUMMARY.md
└── CODE_REVIEW_FIXES.md
```

## 📊 **File Size Summary**
```
Total: 18 files, ~280KB
Largest: WebApp.gs (28KB) - Main application logic
HTML Files: 7 files, ~103KB total
GS Files: 8 files, ~115KB total
Docs: 3 files, ~17KB total
```

## 🎯 **Next Steps**
1. **Deploy as Google Apps Script web app**
2. **Run SetupExactSheets.gs to initialize sheets**
3. **Update Settings sheet with your company info**
4. **Add initial Super Admin user**
5. **Test login and navigation**

Your inventory management system is now complete and production-ready! 🚀