# 🔍 How to Find QR Codes on ApnaGhar Website

## Quick Answer
**QR codes are in the Builder Dashboard!** Look for the gray **"QR Codes"** button on each project card.

---

## 📍 Step-by-Step Instructions

### Step 1: Login as Builder
```
URL: http://localhost:8080/login
Username: prestige.builder
Password: Prestige@123
```

### Step 2: Navigate to Builder Dashboard
After login, you'll be automatically redirected to:
```
URL: http://localhost:8080/dashboard/builder
```

Or click: **Profile Icon (top-right) → "Builder Dashboard"**

### Step 3: Find Your Projects
You'll see a list of your projects. Each project card has **4 buttons**:

```
┌─────────────────────────────────────────────────┐
│  Project Name                    [Status Badge] │
│  City, State                                    │
│  👁 123 views   👥 45 interested   🏠 20/50     │
│                                                 │
│  [View] [Edit] [QR Codes] [Upload Updates]    │
└─────────────────────────────────────────────────┘
```

### Step 4: Click "QR Codes" Button
- It's the **3rd button** (gray/secondary color)
- Has a **QR code icon** 📱
- Located between "Edit" and "Upload Updates"

### Step 5: QR Code Management Page Opens
You'll see:
```
┌──────────────────────────────────────────┐
│  ← Back to Dashboard                     │
│  QR Code Management                      │
│  Project Name                            │
│                                          │
│  [Milestones] [Properties]  <- Tabs     │
│                                          │
│  ┌────────────────────────────────┐    │
│  │ Phase 1: Foundation Work       │    │
│  │ Description...                 │    │
│  │ [Show QR Code]                 │    │
│  └────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

### Step 6: Click "Show QR Code"
Click on any milestone or property's "Show QR Code" button

### Step 7: View the QR Code! 🎉
You'll see:
```
┌──────────────────────────────────────────┐
│  ← Back to List                          │
│                                          │
│  ┌────────────────────┐                 │
│  │                    │                 │
│  │   [QR CODE IMAGE]  │                 │
│  │                    │                 │
│  └────────────────────┘                 │
│                                          │
│  Milestone: Foundation Work              │
│  Project: Prestige Heights              │
│                                          │
│  [🖨 Print QR Code] [⬇ Download PNG]   │
│                                          │
│  Security Instructions:                  │
│  • Display at construction site          │
│  • Scan with mobile device only          │
│  • Camera-only capture                   │
└──────────────────────────────────────────┘
```

---

## 🎨 Visual Location Map

```
Homepage
    ↓ (Login)
Builder Dashboard ← YOU ARE HERE
    ↓ (Click "QR Codes" button on project card)
QR Code Management Page
    ↓ (Select milestone/property)
    ↓ (Click "Show QR Code")
QR Code Display ← QR CODE IS HERE! 🎯
```

---

## 🔧 What If I Don't See the "QR Codes" Button?

### Troubleshooting:

1. **Check if you're logged in as a builder**:
   - Only builders can see the "QR Codes" button
   - Buyers don't have access to this feature

2. **Refresh the page**:
   ```bash
   Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   ```

3. **Clear browser cache**:
   - Open Developer Tools (F12)
   - Right-click on refresh button
   - Select "Empty Cache and Hard Reload"

4. **Check the console for errors**:
   - Press F12
   - Go to Console tab
   - Look for any red errors

5. **Verify frontend is running**:
   ```bash
   # Should show frontend on port 8080
   ps aux | grep vite
   ```

---

## 📱 What Can I Do with the QR Code?

### 1. **Print It**
- Click "Print QR Code" button
- Browser print dialog opens
- Print on A4 paper
- Display at construction site

### 2. **Download It**
- Click "Download PNG" button
- Save as image file
- Share digitally or print later

### 3. **Use for Secure Uploads**
- Workers scan the QR code at construction site
- Mobile phone camera only
- Upload construction progress photos
- Prevents fake uploads from gallery

---

## 🎯 Quick Test

To verify everything is working:

1. Open: `http://localhost:8080`
2. Login as: `prestige.builder` / `Prestige@123`
3. Should see: Builder Dashboard with projects
4. Look for: Gray "QR Codes" button on project cards
5. Click it: Opens QR Code Management page
6. Click "Show QR Code": Displays the QR code!

---

## 📞 Still Can't Find It?

The QR codes button should be visible here in the code:

**File**: `frontend/src/pages/BuilderDashboard.tsx`
**Line**: ~371

```tsx
<Link to={`/projects/${project.id}/qr-codes`}>
  <Button variant="secondary" size="sm">
    <QrCode className="h-4 w-4 mr-2" />
    QR Codes
  </Button>
</Link>
```

If you still don't see it, check:
- Browser console for JavaScript errors
- Network tab for failed API calls
- Make sure you're viewing the builder dashboard (not buyer dashboard)

---

## 🌐 Alternate Route

You can also access QR codes directly via URL:

```
http://localhost:8080/projects/{PROJECT_ID}/qr-codes
```

Example:
```
http://localhost:8080/projects/2eb76adf-8671-4f06-a39d-b326a281cbe3/qr-codes
```

Replace `{PROJECT_ID}` with any project ID from your projects list.

---

## ✅ Expected Result

When everything is working, you should see:
- ✅ "QR Codes" button on each project card
- ✅ Button has QR code icon
- ✅ Button is gray/secondary colored
- ✅ Clicking opens QR Code Management page
- ✅ Can view, print, and download QR codes

---

**Last Updated**: November 9, 2025
**Frontend Build**: ✅ Successful
**Backend Status**: ✅ Running on port 8000
