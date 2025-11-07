# Progress Upload Feature - Quick Setup Guide

## Current Issue
You're seeing "Progress (0)" because there are no milestones created yet for the project.

## Solution: Create Test Milestones

### Step 1: Get the Project ID
1. Go to your project page (e.g., Tranquil Apartments)
2. Look at the URL - it will be something like: `/projects/abc-123-def-456`
3. Copy that ID (the UUID part)

### Step 2: Run the Management Command

```bash
cd /Users/ameysonvadkar/Desktop/ApnaGhar/backend
source ../venv/bin/activate
python manage.py create_test_milestones <PROJECT_ID>
```

**Example:**
```bash
python manage.py create_test_milestones "f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

This will create 5 sample milestones:
1. Site Preparation & Foundation (100% - Completed)
2. Structural Framework (65% - In Progress)
3. Walls & Partitions (40% - In Progress)
4. Plumbing & Electrical (15% - Pending)
5. Finishing Work (0% - Pending)

### Step 3: Refresh the Page
After creating milestones, refresh your browser. You should now see:
- "Progress (5)" in the tab
- Each milestone listed with upload forms (if you're logged in as a builder)

## How to Upload

### For Builders:
1. Login with a builder account
2. Go to any project
3. Click "Progress" tab
4. Scroll to any milestone
5. You'll see an **"Upload Media (Builder Only)"** section with:
   - Description field
   - Images upload button
   - Videos upload button
   - "Upload to Cloudinary" button

6. Select files, add description, click upload
7. Files will be uploaded to Cloudinary with SHA256 hashing
8. Page will auto-refresh showing the uploaded media

### For Buyers:
1. Login with a buyer account
2. Go to any project
3. Click "Progress" tab
4. View photos and videos uploaded by the builder
5. Hover over images to see descriptions
6. Play videos inline

## Debug Info

The page now shows debug information in development mode:
- Your current user role (builder/buyer)
- Number of milestones
- Project ID

## Architecture

**Upload Flow:**
1. Builder selects files → Frontend
2. Compute SHA256 hash → Backend
3. Check if exists in Cloudinary (dedupe) → Backend
4. Upload to Cloudinary (if new) → Cloudinary
5. Store hash in DB → PostgreSQL
6. Display using dynamic URL → Frontend

**Storage:**
- **Cloudinary**: Stores actual files
- **Database**: Stores only SHA256 hash + metadata
- **Public ID**: Uses SHA256 as the unique identifier

## Troubleshooting

### "No milestones available yet"
- Run the `create_test_milestones` command above

### "Not seeing upload forms"
- Make sure you're logged in as a **builder**
- Check the debug info shows "User Role: builder"

### "Upload button disabled"
- You need to create milestones first using the command

### "403 Forbidden on upload"
- Make sure your account has a Developer profile
- Only developers/builders can upload

## Next Steps

After milestones are created and you can upload:
1. Test uploading an image
2. Test uploading a video  
3. Verify hash is stored in database
4. Check Cloudinary dashboard for uploaded files
5. Login as a buyer to verify viewing permissions

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend terminal for API errors
3. Verify Cloudinary credentials in backend/.env
4. Ensure you have milestones created for the project
