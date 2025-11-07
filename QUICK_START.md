# Quick Start Commands - ApnaGhar

## 🚀 Immediate Next Steps

Run these commands in order to deploy the changes:

### 1. Install Backend Packages
```bash
cd /home/floydpinto/ApnaGhar/backend
pip install -r requirements.txt
```

This installs:
- cloudinary==1.41.0
- django-cloudinary-storage==0.3.0
- Pillow==11.0.0
- qrcode==8.0

### 2. Setup Cloudinary (One-Time Setup)

**A. Sign up for Cloudinary:**
1. Go to https://cloudinary.com/ and create a free account
2. After signup, go to your Dashboard
3. Copy these credentials:
   - Cloud Name
   - API Key
   - API Secret

**B. Add to backend/.env:**
```bash
cd /home/floydpinto/ApnaGhar/backend
nano .env  # or use any text editor
```

Add these lines:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 3. Run Database Migrations
```bash
cd /home/floydpinto/ApnaGhar/backend
python manage.py makemigrations users projects
python manage.py migrate
```

This creates:
- `users.saved_projects` field
- `users.recently_viewed` field
- `projects.project.project_videos` field
- `projects.project.qr_code_data` field
- `projects.property.unit_progress_percentage` field
- `projects.property.unit_progress_updates` field
- `projects.property.unit_videos` field
- `projects.property.unit_photos` field
- `projects.property.qr_code_data` field

### 4. Test Locally

**Terminal 1 - Backend:**
```bash
cd /home/floydpinto/ApnaGhar/backend
source ../venv/bin/activate  # if using venv
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
cd /home/floydpinto/ApnaGhar/frontend
npm run dev
```

**Open:** http://localhost:5173

### 5. Test New Features

**As a Buyer:**
1. Login/Register
2. Browse projects at `/explore-projects`
3. Click on a project
4. Click the ❤️ "Save Project" button (should see toast notification)
5. Click "View Details" on any property unit
6. Go to Dashboard → check "My Properties", "Saved Projects", "Recently Viewed" tabs
7. Click "Clear History" in Recently Viewed

**Check Privacy:**
1. Try viewing a property that's `booked` or `sold` by another user
2. Should see "Access Denied" message and redirect

### 6. Verify Cloudinary Connection
```bash
cd /home/floydpinto/ApnaGhar/backend
python manage.py shell
```

In Python shell:
```python
import cloudinary
print(cloudinary.config().cloud_name)  # Should print your cloud name
print(cloudinary.config().api_key)     # Should print your API key
exit()
```

If it prints correctly, Cloudinary is configured! ✅

### 7. Commit and Deploy

```bash
cd /home/floydpinto/ApnaGhar

# Check what's changed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Add buyer features, property privacy, and Cloudinary setup

Bug Fixes:
- Fixed blank View Unit Details page
- Fixed Save to Favorites (heart icon) functionality
- Added proper error handling for private properties

Buyer Features:
- Clear Recently Viewed history button
- Privacy controls for sold/booked properties
- Enhanced BuyerDashboard with real-time data
- Auto-tracking of project views

Backend Infrastructure:
- Custom permission classes (IsOwnerOrBuilderOrReadOnly)
- Clear recently viewed endpoint
- Extended Property model with progress tracking fields
- Cloudinary configuration for media storage

Database Changes:
- Added unit_progress_percentage, unit_progress_updates to Property
- Added unit_videos, unit_photos, qr_code_data to Property
- Added project_videos, qr_code_data to Project

Documentation:
- CLOUDINARY_SETUP.md - Complete Cloudinary guide
- IMPLEMENTATION_SUMMARY.md - Full feature documentation
- QUICK_START.md - Deployment commands

Next: Builder dashboard UI implementation"

# Push to GitHub
git push origin main
```

### 8. Update Production Environment Variables

**Render (Backend):**
1. Go to Render Dashboard → Your Backend Service → Environment
2. Add these variables:
   ```
   CLOUDINARY_CLOUD_NAME = your_cloud_name
   CLOUDINARY_API_KEY = your_api_key
   CLOUDINARY_API_SECRET = your_api_secret
   ```
3. Click "Save Changes"
4. Wait for Render to redeploy automatically

**Vercel (Frontend):**
- No changes needed for this deployment

### 9. Production Testing

After deployment completes:

1. Visit your production site
2. Test save/unsave projects
3. Test View Details on properties
4. Check Recently Viewed
5. Test Clear History button
6. Verify privacy on sold properties

---

## ⚠️ Important Notes

### Migration Warning
- After running migrations locally, your local database will have the new fields
- Render will auto-run migrations on deploy
- **Before deploying**, ensure your production database is backed up

### Cloudinary Free Tier
- 25 GB storage
- 25 GB bandwidth/month
- 10,000 transformations/month
- Sufficient for MVP and testing

### Known Limitations
- Builder dashboard UI not yet implemented
- QR code generation UI not yet implemented
- Video upload endpoints not yet created
- Property upload form not yet created

---

## 🔮 What's Next (Future Implementation)

After deploying these changes, the next priority items are:

### Week 1:
1. Create `backend/projects/builder_views.py` with:
   - upload_project_video endpoint
   - upload_unit_video endpoint
   - update_unit_progress endpoint
   - generate_qr_code endpoint
   - create_project endpoint

2. Create Builder Dashboard UI (`frontend/src/pages/BuilderDashboard.tsx`)

3. Create QR Code Display Component

### Week 2:
4. Create Mobile Video Upload Page

5. Create Upload Property Form

6. Integrate video players in PropertyUnitDetails

### Week 3:
7. Test complete QR upload flow

8. Add builder analytics

9. Implement payment placeholder

---

## 📞 Troubleshooting

### Issue: Migrations fail
```bash
# Check what migrations exist
python manage.py showmigrations

# If conflicts, try:
python manage.py migrate --fake users
python manage.py migrate --fake projects
python manage.py makemigrations users projects
python manage.py migrate
```

### Issue: Cloudinary import error
```bash
# Reinstall packages
pip uninstall cloudinary django-cloudinary-storage
pip install cloudinary==1.41.0 django-cloudinary-storage==0.3.0
```

### Issue: Frontend not connecting to backend
```bash
# Check frontend/.env
cat frontend/.env

# Should have:
VITE_API_BASE_URL=http://localhost:8000
```

### Issue: Git push rejected
```bash
# Pull latest changes first
git pull origin main

# Resolve conflicts if any
# Then push again
git push origin main
```

---

## ✅ Deployment Checklist

Before pushing to production:

- [ ] Backend packages installed
- [ ] Cloudinary credentials in .env
- [ ] Migrations run successfully
- [ ] Local testing passed
- [ ] Cloudinary connection verified
- [ ] Git committed with clear message
- [ ] Production env vars updated on Render
- [ ] Deployment monitoring (check Render logs)
- [ ] Post-deployment testing

---

## 📚 Reference Documentation

- **Cloudinary Setup:** `CLOUDINARY_SETUP.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **OAuth Setup:** `OAUTH_SETUP_GUIDE.md`
- **Project Overview:** `README.md`
- **Copilot Instructions:** `.github/copilot-instructions.md`

---

**Current Status:** Ready to deploy buyer features ✅
**Next Milestone:** Builder dashboard implementation 🔨
