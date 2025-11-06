# Deployment Checklist for ApnaGhar

## ✅ Ready to Deploy

### Backend (Render)
- [x] `requirements.txt` updated with `django-filter==25.2`
- [x] `settings.py` has `django_filters` in INSTALLED_APPS
- [x] CORS configured for production URLs
- [x] Environment variables needed on Render:
  - `SECRET_KEY`
  - `DATABASE_URL` (Supabase PostgreSQL)
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `DEBUG=False`
  - `ALLOWED_HOSTS` (comma-separated: apnaghar-2emb.onrender.com)

### Frontend (Vercel)
- [x] `VITE_API_BASE_URL` points to production backend
- [x] New `/explore-projects` route added
- [x] Environment variable needed on Vercel:
  - `VITE_API_BASE_URL=https://apnaghar-2emb.onrender.com`

### Database Migrations
⚠️ **IMPORTANT**: After deploying backend to Render, you need to run:

```bash
# On Render Console or via SSH
python manage.py migrate
python manage.py seed_projects
```

## 📋 Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "feat: add explore projects page with 23 seeded projects"
git push origin main
```

### 2. Backend (Render) - Automatic Deploy
- Render will automatically detect the push and redeploy
- Monitor build logs for any errors
- After successful deploy, run migrations via Render Shell:
  ```bash
  python manage.py migrate
  python manage.py seed_projects
  ```

### 3. Frontend (Vercel) - Automatic Deploy
- Vercel will automatically detect the push and redeploy
- Build should complete in ~2 minutes
- Verify deployment at: https://apnaghar-five.vercel.app

### 4. Verify Deployment
- [ ] Backend API accessible: https://apnaghar-2emb.onrender.com/api/projects/projects/
- [ ] Frontend loads: https://apnaghar-five.vercel.app
- [ ] Can navigate to Explore Projects page
- [ ] Projects load from API
- [ ] Filters work (city, status)
- [ ] Search works
- [ ] Can view project details

## 🔄 Post-Deployment Tasks

### Test Core Functionality
1. Visit homepage
2. Click "Search" or "Explore Projects" in header
3. Verify 23 projects are displayed
4. Test city filter (Mumbai, Pune, Bangalore, Delhi, Hyderabad)
5. Test status filter (ongoing, upcoming, completed)
6. Test search functionality
7. Click "View Details" on a project (will need project detail page - coming next)

### Known Limitations (To Build Next)
- [ ] Project detail page (`/projects/{id}`) - needs implementation
- [ ] Construction tracker visualization
- [ ] Cloudinary integration for real images
- [ ] Maps integration for location view
- [ ] Reviews section
- [ ] Fractional ownership features
- [ ] Blockchain verification display

## 🚨 Potential Issues & Solutions

### Issue: "django_filters template not found"
**Solution**: Already fixed - `django_filters` added to INSTALLED_APPS

### Issue: "No projects showing on frontend"
**Solution**: 
1. Check browser console for CORS errors
2. Verify `VITE_API_BASE_URL` is correct
3. Ensure migrations ran on production database
4. Run `python manage.py seed_projects` on Render

### Issue: "verification_score field overflow"
**Solution**: Already fixed - changed to `max_digits=5, decimal_places=2`

### Issue: Images not loading
**Current**: Using Unsplash placeholders (will work)
**Future**: Replace with Cloudinary URLs

## 📝 Environment Variables Summary

### Render (Backend)
```
SECRET_KEY=<your-secret-key>
DATABASE_URL=<supabase-postgresql-url>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-secret>
DEBUG=False
ALLOWED_HOSTS=apnaghar-2emb.onrender.com
```

### Vercel (Frontend)
```
VITE_API_BASE_URL=https://apnaghar-2emb.onrender.com
```

## ✅ Yes, You Can Deploy Now!

All critical changes are in place. The system will work on production with:
- 23 projects across 5 cities
- Explore Projects page with search and filters
- Responsive design
- API integration

After deployment, you can continue building:
- Project detail page
- Construction tracker
- Cloudinary integration
- Additional features from wireframe
