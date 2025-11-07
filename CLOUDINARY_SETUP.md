# Cloudinary Setup Guide for ApnaGhar

## Overview

This guide explains how to setup Cloudinary for video and photo uploads in ApnaGhar's property management system. Cloudinary will handle:

- Project-level videos (visible to all buyers)
- Unit-specific videos (visible only to unit owner + builder)
- Progress photos for projects and units
- QR code-triggered uploads from mobile devices

## Prerequisites

1. Sign up for a free Cloudinary account at [https://cloudinary.com/](https://cloudinary.com/)
2. After signup, navigate to your Dashboard to get your credentials

## Step 1: Get Your Cloudinary Credentials

From your Cloudinary Dashboard, you'll find:

```
Cloud Name: your_cloud_name
API Key: your_api_key
API Secret: your_api_secret
```

## Step 2: Update Backend Environment Variables

Add the following to your `backend/.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Step 3: Install Required Packages

The packages are already added to `requirements.txt`. Install them:

```bash
cd backend
pip install -r requirements.txt
```

Packages installed:

- `cloudinary==1.41.0` - Cloudinary Python SDK
- `django-cloudinary-storage==0.3.0` - Django integration
- `Pillow==11.0.0` - Image processing
- `qrcode==8.0` - QR code generation

## Step 4: Run Migrations

Create and apply migrations for the new progress tracking fields:

```bash
cd backend
python manage.py makemigrations projects users
python manage.py migrate
```

## Step 5: Verify Configuration

Test that Cloudinary is configured correctly:

```bash
python manage.py shell
```

Then run:

```python
import cloudinary
print(cloudinary.config().cloud_name)  # Should print your cloud name
```

## How It Works

### Project-Level Videos

1. **Builder Dashboard** → Select Project → Click "Upload Progress Video"
2. QR code is displayed on screen
3. Builder scans QR code with mobile device
4. QR code opens a secure camera page: `/builder/upload/project/<project_id>/video`
5. Builder records video
6. Video uploads directly to Cloudinary via API
7. Cloudinary URL is stored in `Project.project_videos` JSON field
8. **All buyers** of units in that project can see the video

### Unit-Level Videos

1. **Builder Dashboard** → Select Project → Select Specific Unit → Click "Upload Unit Video"
2. Unique QR code is displayed
3. Builder scans QR code
4. QR code opens camera page: `/builder/upload/unit/<property_id>/video`
5. Builder records video
6. Video uploads to Cloudinary
7. URL stored in `Property.unit_videos` JSON field
8. **Only the buyer** who owns that unit (and the builder) can see the video

### API Endpoints for Upload

#### Upload Project Video

```
POST /api/projects/builder/projects/<project_id>/upload_video/
Headers: Authorization: Bearer <token>
Body: multipart/form-data with 'video' file
Response: { "message": "Video uploaded", "video_url": "..." }
```

#### Upload Unit Video

```
POST /api/projects/builder/properties/<property_id>/upload_video/
Headers: Authorization: Bearer <token>
Body: multipart/form-data with 'video' file
Response: { "message": "Video uploaded", "video_url": "..." }
```

#### Update Unit Progress

```
POST /api/projects/builder/properties/<property_id>/update_progress/
Headers: Authorization: Bearer <token>
Body: {
  "progress_percentage": 65,
  "phase": "Tiling",
  "description": "Kitchen tiling completed"
}
```

## Data Structure

### Project Model

```python
project_videos = [
    {
        "url": "https://res.cloudinary.com/...",
        "uploaded_at": "2025-11-07T10:30:00Z",
        "description": "Foundation work completed",
        "cloudinary_public_id": "apnaghar/projects/proj123_video1"
    }
]
qr_code_data = "PROJECT_<uuid>"  # Used to generate QR
```

### Property Model

```python
unit_videos = [
    {
        "url": "https://res.cloudinary.com/...",
        "uploaded_at": "2025-11-07T12:00:00Z",
        "description": "Unit interior progress",
        "cloudinary_public_id": "apnaghar/units/unit456_video1"
    }
]
unit_progress_updates = [
    {
        "phase": "Tiling",
        "description": "Floor tiling completed",
        "date": "2025-11-07",
        "progress": 40
    },
    {
        "phase": "Painting",
        "description": "First coat applied",
        "date": "2025-11-10",
        "progress": 65
    }
]
unit_progress_percentage = 65
qr_code_data = "UNIT_<uuid>"  # Unique QR per unit
```

## Frontend Integration

### Display Videos in PropertyUnitDetails

```typescript
// Show unit-specific videos (only for owner/builder)
{
  property.unit_videos && property.unit_videos.length > 0 && (
    <div className="space-y-4">
      <h3>Unit Progress Videos</h3>
      {property.unit_videos.map((video, idx) => (
        <video key={idx} controls className="w-full">
          <source src={video.url} type="video/mp4" />
        </video>
      ))}
    </div>
  );
}

// Show project-level videos (for all buyers)
{
  property.project.project_videos &&
    property.project.project_videos.length > 0 && (
      <div className="space-y-4">
        <h3>Project Progress Videos</h3>
        {property.project.project_videos.map((video, idx) => (
          <video key={idx} controls className="w-full">
            <source src={video.url} type="video/mp4" />
          </video>
        ))}
      </div>
    );
}
```

### QR Code Generation (Builder Dashboard)

```typescript
import QRCode from "qrcode";

// Generate QR for project video upload
const generateProjectQR = async (projectId: string) => {
  const uploadUrl = `${window.location.origin}/builder/upload/project/${projectId}/video`;
  const qrDataUrl = await QRCode.toDataURL(uploadUrl);
  setQrCodeImage(qrDataUrl);
};
```

## Cloudinary Folder Structure

Organize uploads in folders:

```
apnaghar/
  ├── projects/
  │   ├── <project_id>/
  │   │   ├── videos/
  │   │   └── photos/
  └── units/
      ├── <property_id>/
      │   ├── videos/
      │   └── photos/
```

## Security & Permissions

✅ **Builder ViewSets** (backend/projects/builder_views.py)

- Only authenticated builders/developers can upload
- Builders can only upload to their own projects
- Permission class: `IsBuilderOrReadOnly`

✅ **Property Privacy**

- Unit videos only visible to owner + builder
- Permission class: `IsOwnerOrBuilderOrReadOnly`
- Returns 403 for unauthorized access

✅ **Mobile Upload Authentication**

- QR code contains JWT token in URL
- Token validates builder identity
- Expired tokens are rejected

## Cloudinary Upload Settings (Optional)

Configure upload presets in Cloudinary Dashboard:

1. Go to Settings → Upload
2. Add upload preset: `apnaghar_videos`
3. Set:
   - Folder: auto
   - Resource type: video
   - Max file size: 100MB
   - Allowed formats: mp4, mov, avi
   - Access mode: authenticated

## Testing the Setup

1. **Test Cloudinary Connection:**

   ```bash
   python manage.py shell
   from cloudinary.uploader import upload
   result = upload("test_image.jpg")
   print(result['url'])
   ```

2. **Test Video Upload via API:**

   ```bash
   curl -X POST http://localhost:8000/api/projects/builder/projects/<id>/upload_video/ \
     -H "Authorization: Bearer <token>" \
     -F "video=@test_video.mp4"
   ```

3. **Generate QR Code:**
   - Navigate to Builder Dashboard
   - Select a project
   - Click "Generate QR for Video Upload"
   - QR should display and be scannable

## Production Deployment

### Render (Backend)

Add environment variables in Render Dashboard:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Vercel (Frontend)

No additional env vars needed for Cloudinary (backend handles it).

## Troubleshooting

### Issue: "Import cloudinary could not be resolved"

**Solution:** Install packages: `pip install -r requirements.txt`

### Issue: "cloudinary.config().cloud_name is empty"

**Solution:** Check that `.env` file exists and contains correct credentials

### Issue: Videos not displaying

**Solution:**

- Check Cloudinary URL in database
- Verify URL is publicly accessible
- Check browser console for CORS errors

### Issue: QR code not scanning

**Solution:**

- Ensure QR contains full URL with protocol (https://)
- Test QR with online scanner first
- Check camera permissions on mobile device

## Cost Considerations

**Cloudinary Free Tier:**

- 25 GB storage
- 25 GB bandwidth/month
- Up to 10,000 transformations/month

This is sufficient for MVP. Monitor usage in Cloudinary Dashboard.

## Next Steps

1. ✅ Run migrations
2. ✅ Install Cloudinary packages
3. ✅ Add credentials to `.env`
4. 🔨 Create Builder Dashboard UI components
5. 🔨 Implement QR code generation and display
6. 🔨 Create mobile upload page
7. 🔨 Build video player components
8. 🔨 Add progress update forms

---

## Support

- Cloudinary Docs: https://cloudinary.com/documentation
- ApnaGhar Issues: https://github.com/Floyd-Pinto/ApnaGhar/issues
