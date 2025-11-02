# OAuth Configuration Guide

## Overview

This project uses `django-allauth` for Google OAuth authentication. OAuth credentials are configured in `settings.py` (not in Django admin).

## Important Changes Made

### 1. Settings Configuration (`backend/backend/settings.py`)

- OAuth credentials are now in `SOCIALACCOUNT_PROVIDERS` settings
- Added proper social login settings following best practices
- Credentials are loaded from environment variables

### 2. Custom Adapters (`backend/users/adapters.py`)

- `CustomAccountAdapter`: Handles regular login/signup redirects
- `CustomSocialAccountAdapter`: Handles social login with:
  - Auto-connection of social accounts to existing users with same email
  - Email verification for social login users
  - Default role assignment for new users
  - Proper redirect after successful OAuth

### 3. OAuth Flow

```
1. User clicks "Sign in with Google" on frontend
   ↓
2. Frontend redirects to: https://apnaghar-2emb.onrender.com/accounts/google/login/
   ↓
3. User authenticates with Google
   ↓
4. Google redirects back to: https://apnaghar-2emb.onrender.com/accounts/google/login/callback/
   ↓
5. Django-allauth processes OAuth and logs user in
   ↓
6. CustomSocialAccountAdapter redirects to: https://apnaghar-2emb.onrender.com/api/auth/google/redirect/
   ↓
7. GoogleOAuthRedirect view generates JWT tokens
   ↓
8. Redirects to frontend: https://apnaghar-five.vercel.app/auth/callback?access=TOKEN&refresh=TOKEN
   ↓
9. Frontend OAuthCallback component stores tokens and redirects to dashboard
```

## Configuration Steps

### 1. Environment Variables

Ensure these are set in `backend/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
FRONTEND_URL=https://apnaghar-five.vercel.app
BACKEND_URL=https://apnaghar-2emb.onrender.com
```

### 2. Google Cloud Console Setup

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:8000/accounts/google/login/callback/
   https://apnaghar-2emb.onrender.com/accounts/google/login/callback/
   ```
4. Save changes

### 3. Django Site Configuration

Run these commands to set up the site:

```bash
cd backend
python manage.py shell
```

Then in Python shell:

```python
from django.contrib.sites.models import Site

# Update site domain
site = Site.objects.get(id=1)
site.domain = 'apnaghar-2emb.onrender.com'
site.name = 'ApnaGhar'
site.save()
print(f'Site configured: {site.domain}')
```

### 4. Remove Django Admin OAuth Apps (IMPORTANT!)

Since OAuth is now configured in `settings.py`, remove any Google OAuth apps from Django admin to avoid conflicts:

```bash
python manage.py shell -c "from allauth.socialaccount.models import SocialApp; SocialApp.objects.filter(provider='google').delete(); print('Removed Google OAuth apps from database')"
```

Or via Django Admin:

1. Go to: https://apnaghar-2emb.onrender.com/admin/
2. Navigate to: Social Accounts → Social applications
3. Delete all Google OAuth entries

## Testing OAuth Locally

### 1. Start the backend server:

```bash
cd backend
python manage.py runserver
```

### 2. Update Google Cloud Console:

Add local redirect URI:

```
http://localhost:8000/accounts/google/login/callback/
```

### 3. Update frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/
```

### 4. Test the flow:

- Open frontend
- Click "Sign in with Google"
- Should redirect through OAuth and back to your app with tokens

## Troubleshooting

### Error: `MultipleObjectsReturned`

**Cause:** Multiple Google OAuth apps exist (in database AND settings.py)
**Solution:** Delete all apps from Django admin (see step 4 above)

### Error: `redirect_uri_mismatch`

**Cause:** Redirect URI not added to Google Cloud Console
**Solution:** Add the correct callback URL to Google Cloud Console

### Error: OAuth succeeds but redirects to wrong URL

**Cause:** Environment variables not set correctly
**Solution:** Check `BACKEND_URL` and `FRONTEND_URL` in `.env`

### Error: Tokens not being generated

**Cause:** `GoogleOAuthRedirect` view not being called
**Solution:** Check that adapters are properly configured and imported

## Key Settings Explained

| Setting                                           | Purpose                                              |
| ------------------------------------------------- | ---------------------------------------------------- |
| `SOCIALACCOUNT_LOGIN_ON_GET`                      | Allow GET requests for OAuth (required for callback) |
| `SOCIALACCOUNT_AUTO_SIGNUP`                       | Automatically create user on first social login      |
| `ACCOUNT_UNIQUE_EMAIL`                            | Prevent duplicate emails                             |
| `SOCIALACCOUNT_EMAIL_AUTHENTICATION`              | Use email for authentication                         |
| `SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT` | Connect social accounts with same email              |

## Reference

Implementation based on: https://github.com/andyjud/social-logins
