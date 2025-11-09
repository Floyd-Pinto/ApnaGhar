# QR Code Integration - Where QR Codes Are Displayed

## Overview
This document explains where and how QR codes are displayed on the ApnaGhar website after the integration.

## Current Implementation Status

### ✅ Completed Features

#### 1. **Backend Implementation** (Already Done)
- **QR Code Fields**: Added to `Property` and `ConstructionMilestone` models
- **API Endpoints**:
  - `POST /api/projects/milestones/verify_qr/` - Verifies QR code and returns upload token
  - `POST /api/projects/milestones/{id}/secure_upload/` - Secure upload for milestones
  - `POST /api/projects/properties/{id}/secure_upload/` - Secure upload for properties
- **Management Command**: `generate_qr_codes` - Generated 9,584 QR codes (383 milestones + 9,201 properties)
- **Security Features**:
  - Mobile device detection
  - QR token validation
  - Camera-only capture enforcement
  - Upload token verification (SHA-256 hashed)
  - Developer authorization checks

#### 2. **Frontend Components** (Already Created)
- **`QRCodeDisplay.tsx`**: Component for displaying, printing, and downloading QR codes
  - Shows QR code with entity details
  - Print-optimized view
  - PNG download functionality
  - Security instructions
  
- **`SecureUpload.tsx`**: 5-step wizard for secure uploads
  - Step 1: Scan QR code (with html5-qrcode library)
  - Step 2: Verify QR code with server
  - Step 3: Capture photos/videos (camera-only)
  - Step 4: Upload with progress indicator
  - Step 5: Success confirmation

#### 3. **Website Integration** (Just Completed)

##### **A. QR Code Management Page**
**Route**: `/projects/:projectId/qr-codes`

**Features**:
- Lists all milestones and properties for a project
- Displays QR codes for each milestone and property
- Shows QR code with entity details
- Print and download QR codes
- Access secure upload flow

**Access**:
- Available to builders/developers only
- Accessible from Builder Dashboard

##### **B. Builder Dashboard Integration**
**Page**: `/dashboard/builder`

**New Button Added**: "QR Codes" button on each project card

**Location**: Next to "View", "Edit", and "Upload Updates" buttons

**What It Does**:
- Clicking "QR Codes" button navigates to `/projects/{projectId}/qr-codes`
- Shows all milestones and properties with their QR codes
- Allows printing/downloading QR codes for physical display at construction sites

## How It Works

### For Builders/Developers:

1. **Generate QR Codes** (Already Done)
   - All existing milestones and properties have QR codes
   - New milestones/properties automatically get QR codes on creation

2. **Display QR Codes on Website**
   - Login to Builder Dashboard
   - Click "QR Codes" button on any project
   - Select milestone or property tab
   - Click "Show QR Code" on any item
   - Print or download the QR code

3. **Physical Display**
   - Print the QR code
   - Display it at the construction site (milestone location or property unit)
   - Workers scan the QR code using their mobile phones

4. **Secure Upload**
   - Scan QR code using mobile phone camera
   - System verifies the QR code and location
   - Capture photos/videos using camera only (gallery disabled)
   - Upload construction updates securely
   - Updates are tagged with metadata (timestamp, location, device info)

### For Site Workers/Supervisors:

1. **Scan QR Code**
   - Open website on mobile phone
   - Navigate to secure upload page (or builder provides direct link)
   - Scan the printed QR code at the site

2. **Capture Updates**
   - Take photos using phone camera
   - Take videos using phone camera
   - Cannot upload from gallery (prevents fake photos)

3. **Upload**
   - Add description
   - Submit upload
   - System verifies everything and uploads to Cloudinary

## Security Features

### 5-Layer Security System:
1. **Mobile Device Detection**: Desktop uploads blocked
2. **QR Code Verification**: Unique tokens per entity
3. **Camera-Only Capture**: Gallery uploads blocked
4. **Upload Token Validation**: SHA-256 hashed tokens
5. **Developer Authorization**: Only authorized builders can upload

### Metadata Captured:
- Device information (user agent, platform)
- Capture metadata (timestamp, camera flag)
- Location data (if available)
- QR verification status
- Upload timestamp

## File Structure

```
frontend/src/
├── pages/
│   ├── ManageQRCodes.tsx          (NEW - QR code management page)
│   └── BuilderDashboard.tsx        (UPDATED - Added QR Codes button)
├── components/
│   ├── QRCodeDisplay.tsx           (EXISTING - QR display component)
│   └── SecureUpload.tsx            (EXISTING - Secure upload component)
└── App.tsx                         (UPDATED - Added route)

backend/projects/
├── models.py                       (UPDATED - QR code fields)
├── views.py                        (UPDATED - Secure endpoints)
└── management/commands/
    └── generate_qr_codes.py        (NEW - QR generation command)
```

## Usage Guide

### For Builders:

1. **Access QR Code Management**:
   ```
   Login → Builder Dashboard → Select Project → Click "QR Codes" button
   ```

2. **View QR Codes**:
   - Choose "Milestones" or "Properties" tab
   - Click "Show QR Code" on any item
   - QR code displays with entity information

3. **Print QR Codes**:
   - Click "Print QR Code" button
   - Browser print dialog opens
   - Print optimized view shows
   - Print and display at site

4. **Download QR Codes**:
   - Click "Download PNG" button
   - QR code saved as PNG image
   - Share digitally or print later

### For Site Workers:

1. **Mobile Upload**:
   ```
   Scan QR Code → Verify Location → Capture Photos/Videos → Upload
   ```

2. **Desktop Blocked**:
   - If accessed from desktop, shows error
   - "Construction updates can only be uploaded from mobile devices"

## API Endpoints

### Verify QR Code
```
POST /api/projects/milestones/verify_qr/
Body: { "qr_data": "milestone:project_id:milestone_id:token" }
Response: {
  "entity_type": "milestone",
  "entity_id": "...",
  "upload_token": "...",
  "upload_endpoint": "/api/projects/milestones/{id}/secure_upload/",
  "restrictions": { ... }
}
```

### Secure Upload
```
POST /api/projects/milestones/{id}/secure_upload/
POST /api/projects/properties/{id}/secure_upload/
Headers: Authorization: Bearer {token}
FormData:
  - upload_token: string
  - images: File[]
  - videos: File[]
  - description: string
  - device_info: JSON
  - capture_metadata: JSON
```

## Benefits

1. **Authenticity**: QR codes ensure uploads are from actual construction sites
2. **Location Verification**: Each QR code is unique to a specific location
3. **Prevents Fraud**: Camera-only capture prevents uploading old/fake photos
4. **Mobile-Only**: Ensures real-time updates from field personnel
5. **Audit Trail**: Complete metadata for every upload
6. **Easy Access**: Simple QR scan instead of complex authentication

## Testing Checklist

- [x] QR codes generated for all entities
- [x] QR Code Management page accessible from Builder Dashboard
- [x] QR codes display correctly
- [x] Print functionality works
- [x] Download functionality works
- [ ] Mobile QR scanning works (needs mobile device testing)
- [ ] Camera-only capture enforced (needs mobile device testing)
- [ ] Desktop upload blocked (needs desktop testing)
- [ ] Secure upload flow completes successfully (needs end-to-end testing)

## Next Steps

1. **Test on Mobile Device**:
   - Login as builder on mobile
   - Navigate to QR Code Management
   - Scan a QR code
   - Test secure upload flow

2. **Test on Desktop**:
   - Try to access secure upload
   - Verify desktop blocking works

3. **Print Test**:
   - Print a QR code
   - Display at mock construction site
   - Scan and upload test photos

4. **Production Deployment**:
   - Deploy to staging environment
   - Train builders on QR code usage
   - Deploy to production
   - Monitor usage and feedback
