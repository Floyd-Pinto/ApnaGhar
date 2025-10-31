# Google OAuth Setup Guide for ApnaGhar

## Overview

This guide will help you set up Google OAuth authentication for your ApnaGhar application, with the backend hosted on Render and frontend on Vercel.

## Step 1: Install Backend Dependencies

1. **Install new packages on your local environment**:

   ```bash
   cd backend
   source ../venv/bin/activate  # Activate your virtual environment
   pip install -r requirements.txt
   ```

2. **Run migrations to create necessary database tables**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

## Step 2: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Create a new project or select an existing one

3. Enable Google+ API:

   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "ApnaGhar"
5. **Configure Authorized JavaScript origins**:

   - Add these URLs:
     ```
     https://apnaghar-five.vercel.app
     http://localhost:8080
     ```

6. **Configure Authorized redirect URIs**:

   - Add these URLs:
     ```
     https://apnaghar-2emb.onrender.com/api/auth/google/callback/
     https://apnaghar-2emb.onrender.com/accounts/google/login/callback/
     http://localhost:8000/api/auth/google/callback/
     http://localhost:8000/accounts/google/login/callback/
     ```

7. **Save and copy**:
   - Copy the "Client ID"
   - Copy the "Client Secret"

## Step 3: Configure Render Backend Environment Variables

1. Go to your Render dashboard: https://dashboard.render.com/

2. Select your backend service: `apnaghar-2emb`

3. Go to "Environment" tab

4. Add these new environment variables:

   ```
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   FRONTEND_URL=https://apnaghar-five.vercel.app
   BACKEND_URL=https://apnaghar-2emb.onrender.com
   ```

5. Click "Save Changes" - this will trigger a redeploy

## Step 4: Configure Google OAuth in Django Admin

1. After your Render backend is deployed, go to:

   ```
   https://apnaghar-2emb.onrender.com/admin/
   ```

2. Log in with your superuser credentials (create one if you haven't):

   ```bash
   python manage.py createsuperuser
   ```

3. Navigate to "Sites" and ensure you have:

   - Domain name: `apnaghar-2emb.onrender.com`
   - Display name: `ApnaGhar`

4. Navigate to "Social applications" > "Add social application"
   - Provider: `Google`
   - Name: `Google OAuth`
   - Client id: `<your-google-client-id>`
   - Secret key: `<your-google-client-secret>`
   - Sites: Select your site (apnaghar-2emb.onrender.com)
   - Click "Save"

## Step 5: Configure Vercel Frontend

Your frontend is already updated with Google login buttons. Just ensure:

1. Environment variable is set in Vercel:

   ```
   VITE_API_BASE_URL=https://apnaghar-2emb.onrender.com
   ```

2. Redeploy if needed:
   ```bash
   git push origin floyd
   ```

## Step 6: Test the OAuth Flow

### Local Testing (Optional):

1. **Start backend**:

   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start frontend**:

   ```bash
   cd frontend
   npm run dev
   ```

3. **Update local .env files**:
   - `backend/.env`:
     ```
     GOOGLE_CLIENT_ID=<your-client-id>
     GOOGLE_CLIENT_SECRET=<your-client-secret>
     FRONTEND_URL=http://localhost:8080
     BACKEND_URL=http://localhost:8000
     ```
   - `frontend/.env`:
     ```
     VITE_API_BASE_URL=http://localhost:8000
     ```

### Production Testing:

1. Go to https://apnaghar-five.vercel.app/login

2. Click "Sign in with Google"

3. You should be redirected to Google's login page

4. After authenticating, you'll be redirected back to your app's dashboard

## How OAuth Works in Your App

1. **User clicks "Sign in with Google"** on Login or Register page

   - Frontend redirects to: `https://apnaghar-2emb.onrender.com/api/auth/google/`

2. **Backend redirects to Google**

   - User authenticates with Google
   - Google redirects back to: `https://apnaghar-2emb.onrender.com/api/auth/google/callback/`

3. **Backend processes OAuth**

   - Creates or fetches user account
   - Sets default role to 'buyer' for new users
   - Generates JWT tokens
   - Redirects to: `https://apnaghar-five.vercel.app/auth/callback?access=<token>&refresh=<token>`

4. **Frontend callback page**
   - Stores tokens in localStorage
   - Fetches user profile
   - Redirects to dashboard

## Troubleshooting

### "Redirect URI mismatch" error:

- Double-check all redirect URIs in Google Console
- Make sure there are no trailing slashes inconsistencies

### "Site matching query does not exist" error:

- Go to Django admin > Sites
- Create or update the site with correct domain

### OAuth works but user not created:

- Check Render logs for errors
- Ensure migrations are run
- Check if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set

### Tokens not stored in frontend:

- Check browser console for errors
- Ensure CORS is properly configured (already done)
- Check if callback URL matches in both Google Console and code

## Security Notes

1. **Never commit credentials**: Keep `.env` files in `.gitignore`
2. **Use environment variables**: Always use env vars for secrets in production
3. **HTTPS only in production**: OAuth requires HTTPS for security
4. **Restrict redirect URIs**: Only add trusted URIs to Google Console

## Next Steps

After OAuth is working:

1. **Add role selection for OAuth users**: Currently defaults to 'buyer'
2. **Add profile completion flow**: For users who sign up via Google
3. **Add social account linking**: Allow users to connect Google to existing accounts
4. **Add more OAuth providers**: Facebook, GitHub, etc.

## Files Changed

### Backend:

- `requirements.txt` - Added django-allauth, dj-rest-auth
- `backend/settings.py` - Added allauth apps and configuration
- `users/adapters.py` - Custom adapters for OAuth flow
- `users/views.py` - Added GoogleLogin and GoogleLoginCallback views
- `users/urls.py` - Added OAuth routes
- `backend/urls.py` - Added allauth URLs

### Frontend:

- `services/api.ts` - Added getGoogleAuthUrl function
- `pages/Login.tsx` - Added Google sign-in button
- `pages/Register.tsx` - Added Google sign-up button
- `pages/OAuthCallback.tsx` - New page to handle OAuth redirect
- `App.tsx` - Added /auth/callback route
