# Delete Button Standardization Plan

## ✅ Design Standard (Based on AttendanceSettings)

### Visual Style:
```tsx
<Button 
  variant="icon" 
  className="p-2 hover:bg-red-500/10 rounded-full transition-colors"
>
  <Trash2 className="h-5 w-5 text-red-500" />
</Button>
```

### Container Layout:
```tsx
<div className="flex justify-between items-start p-4 pr-6">
  <div className="flex-1 min-w-0">
    <p className="font-medium">Title</p>
    <p className="text-sm text-muted">Subtitle</p>
  </div>
  <div className="ml-4 shrink-0">
    <DeleteButton />  {/* Aligns with first line */}
  </div>
</div>
```

---

## 📋 Files That Need Updates

### Priority 1: HR/Admin Pages (Most Visible)
1. ✅ **pages/hr/AttendanceSettings.tsx** - ALREADY DONE
2. **pages/hr/LocationManagement.tsx** - Lines 345, 383
3. **pages/hr/EntityManagement.tsx** - Lines 545, 561, 571
4. **pages/admin/UserManagement.tsx** - Line 214
5. **pages/admin/ModuleManagement.tsx** - Line 96
6. **pages/admin/RoleManagement.tsx** - Line 216
7. **pages/admin/OrganizationManagement.tsx** - Line 532

### Priority 2: Onboarding/Forms
8. **pages/onboarding/EducationDetails.tsx** - Lines 154, 187
9. **pages/onboarding/FamilyDetails.tsx** - Lines 183, 218
10. **pages/onboarding/PreUpload.tsx** - Lines 338, 360
11. **pages/onboarding/UniformRequests.tsx** - Line 399

### Priority 3: Other Features
12. **pages/tasks/TaskManagement.tsx** - Lines 313, 335
13. **pages/uniforms/UniformDashboard.tsx** - Line 407
14. **pages/attendance/MyLocations.tsx** - Lines 400, 456
15. **pages/billing/CostAnalysis.tsx** - Line 324

---

## 🎯 Changes to Make

### For Each File:
1. Import the new `DeleteButton` component
2. Replace existing `<Trash2>` icons with `<DeleteButton>`
3. Ensure parent container uses:
   - `flex justify-between items-start`
   - `p-4 pr-6` (padding with extra right space)
   - Delete button in `<div className="ml-4 shrink-0">`

---

## 📦 New Component Created

**File:** `components/ui/DeleteButton.tsx`

**Usage:**
```tsx
import DeleteButton from './components/ui/DeleteButton';

<DeleteButton 
  onClick={() => handleDelete(item)}
  ariaLabel="Delete holiday"
  title="Delete this holiday"
/>
```

**Props:**
- `onClick`: Function to call when clicked
- `ariaLabel`: Accessibility label (default: "Delete")
- `title`: Tooltip text (default: "Delete")
- `disabled`: Whether button is disabled (default: false)
- `className`: Additional classes (optional)

---

## ⚡ Recommendation

**Option A: Update All Files** (Comprehensive)
- Updates ~15 files
- Consistent UX across entire app
- Takes more time

**Option B: Update Priority 1 Only** (Quick Win)
- Updates 7 HR/Admin files
- Covers most-used features
- Faster implementation

**Which option would you like me to proceed with?**
