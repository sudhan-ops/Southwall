# Site Management - Excel Import/Export Setup Guide

## 📋 Overview
This guide will help you set up Site Management with Excel import/export functionality and the new fields:
- Reporting Manager Name
- Manager Name
- Field Officer Names (multiple)
- Backend Field Officer Name

---

## 🗄️ Step 1: Update Database

### Run these SQL queries in Supabase SQL Editor:

```sql
-- Add new columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS reporting_manager_name TEXT,
ADD COLUMN IF NOT EXISTS manager_name TEXT,
ADD COLUMN IF NOT EXISTS field_officer_names TEXT[], -- Array for multiple field officers
ADD COLUMN IF NOT EXISTS backend_field_officer_name TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_manager ON organizations(manager_name);
CREATE INDEX IF NOT EXISTS idx_organizations_reporting_manager ON organizations(reporting_manager_name);
CREATE INDEX IF NOT EXISTS idx_organizations_backend_officer ON organizations(backend_field_officer_name);
```

### Verify the changes:
```sql
SELECT 
    id,
    short_name,
    full_name,
    address,
    manpower_approved_count,
    reporting_manager_name,
    manager_name,
    field_officer_names,
    backend_field_officer_name
FROM organizations
LIMIT 5;
```

---

## 📊 Step 2: Excel Format

### Excel Column Headers:
Your Excel sheet should have these columns (in this order):

| id | shortName | fullName | address | manpowerApprovedCount | reportingManagerName | managerName | fieldOfficerNames | backendFieldOfficerName |
|----|-----------|----------|---------|----------------------|---------------------|-------------|-------------------|------------------------|

### Example Excel Data:
```
id,shortName,fullName,address,manpowerApprovedCount,reportingManagerName,managerName,fieldOfficerNames,backendFieldOfficerName
SITE-001,Site A,Site A Full Name,123 Main St,50,John Doe,Jane Smith,"Officer1;Officer2;Officer3",Backend Officer
SITE-002,Site B,Site B Corp,456 Oak Ave,30,Mike Wilson,Sarah Johnson,"Officer4;Officer5",Backend Officer2
```

**Important Notes:**
- For `fieldOfficerNames`: Separate multiple names with semicolon (;)
- All text fields should be enclosed in quotes if they contain commas
- Keep headers exactly as shown (case-sensitive)

---

## 🔄 Step 3: Using Import/Export

### To Export:
1. Go to Site Management page
2. Click "Export" button
3. Excel file will download with all current sites

### To Import:
1. Prepare your Excel file with correct format
2. Save as CSV (Comma Separated Values)
3. Click "Import" button in Site Management
4. Select your CSV file
5. System will validate and import data

---

## ✅ Step 4: CRUD Operations

### Create (Add New Site):
1. Click "Add Site" or "Quick Add Site"
2. Fill in all fields including new ones
3. Click Save

### Read (View Sites):
- All sites display in the main table
- Click to view details

### Update (Edit Site):
1. Click Edit icon on any site
2. Modify fields (including new ones)
3. Click Update

### Delete (Remove Site):
1. Click Delete icon
2. Confirm deletion
3. Site and related data removed

---

## 📝 Field Descriptions

### reportingManagerName
- Text field
- Name of the person who oversees this site
- Example: "John Doe"

### managerName
- Text field
- Site manager's name
- Example: "Jane Smith"

### fieldOfficerNames
- Array/List field
- Multiple field officer names
- In Excel: Use semicolon to separate (e.g., "Officer1;Officer2;Officer3")
- In UI: Add/remove officers individually

### backendFieldOfficerName
- Text field
- Backend support officer's name
- Example: "Backend Officer Name"

---

## 🎯 Testing

### Test Data Insert (SQL):
```sql
INSERT INTO organizations (
    id, 
    short_name, 
    full_name, 
    address, 
    manpower_approved_count,
    reporting_manager_name,
    manager_name,
    field_officer_names,
    backend_field_officer_name
) VALUES (
    'SITE-TEST-001',
    'Test Site',
    'Test Site Full Name',
    '123 Test Street, Test City',
    50,
    'Test Reporting Manager',
    'Test Manager',
    ARRAY['Field Officer 1', 'Field Officer 2', 'Field Officer 3'],
    'Test Backend Officer'
);
```

---

## 🔧 Troubleshooting

### Import Fails:
- **Issue**: "CSV is missing headers"
  - **Solution**: Ensure all required headers are present and spelled correctly

- **Issue**: "Failed to import CSV"
  - **Solution**: Check CSV format, ensure no special characters in data

### Field Officer Names Not Showing:
- **Issue**: Multiple names not displaying
  - **Solution**: In Excel, use semicolon (;) to separate names, not commas

### Database Error:
- **Issue**: Column doesn't exist
  - **Solution**: Run the ALTER TABLE queries again in Supabase

---

## 📱 Mobile Support

All features work on mobile:
- Responsive table view
- Touch-friendly buttons
- Mobile-optimized forms
- Excel import/export on mobile browsers

---

## 🔐 Permissions

Required permission: `manage_sites`

Roles with access:
- Admin
- Developer
- Site Managers (view only in some cases)

---

## 📞 Support

If you encounter any issues:
1. Check that SQL queries ran successfully in Supabase
2. Verify Excel file format matches exactly
3. Check browser console for error messages
4. Ensure you have proper permissions

---

## ✨ New Features Added

✅ Excel Import/Export with new fields
✅ Full CRUD operations
✅ Array support for multiple field officers
✅ Validation on import
✅ Mobile-responsive design
✅ Real-time updates
✅ Error handling and user feedback

---

**Last Updated**: November 26, 2025
**Version**: 2.0
