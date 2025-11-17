# ApnaGhar Deployment Workflow

## Architecture Overview

- **Frontend**: Vercel (https://apnagharr.vercel.app/)
- **Backend**: Render (https://apnaghar-2emb.onrender.com)
- **AI Chatbot**: Local machine via ngrok (only when needed)

---

## Initial Setup (One-time per team member)

### 1. Clone Repository
```bash
git clone https://github.com/Floyd-Pinto/ApnaGhar.git
cd ApnaGhar
```

### 2. Install Python Dependencies
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r rag-pipeline/requirements.txt
pip install flask flask-cors
```

### 3. Install ngrok
```bash
# Linux (Arch/Manjaro)
yay -S chaotic-aur/ngrok

# Ubuntu/Debian
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# macOS
brew install ngrok/ngrok/ngrok

# Windows: Download from https://ngrok.com/download
```

### 4. Setup ngrok Account (Free)
1. Sign up: https://dashboard.ngrok.com/signup
2. Get authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. Add token:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

### 5. Setup Environment Files

**Backend** (`backend/.env`):
```env
SECRET_KEY=your-secret-key
DEBUG=False
DATABASE_URL=your-supabase-postgresql-url
GROQ_API_KEY=gsk_your_groq_key
CORS_ALLOWED_ORIGINS=https://apnagharr.vercel.app,http://localhost:5173
FRONTEND_URL=https://apnagharr.vercel.app
BACKEND_URL=https://apnaghar-2emb.onrender.com
# ... other credentials
```

**RAG Pipeline** (`rag-pipeline/.env`):
```env
GROQ_API_KEY=gsk_your_groq_key
RAG_DEBUG=true
```

---

## Daily Development Workflow

### For Regular Backend/Frontend Changes (No AI Chatbot)

```bash
# 1. Make your changes
git add .
git commit -m "Your descriptive message"
git push origin main

# 2. Wait for auto-deployment
# - Render: ~2 minutes
# - Vercel: ~1 minute
```

### For AI Chatbot Testing/Demo

**Step 1: Start Local Services**

Terminal 1 - RAG Service:
```bash
cd /home/floydpinto/ApnaGhar
source venv/bin/activate
python rag-service.py
```

Terminal 2 - ngrok:
```bash
ngrok http 8000
```

**Step 2: Copy ngrok URL**

From ngrok terminal, copy the HTTPS URL:
```
Forwarding  https://abc-123-xyz.ngrok-free.app -> http://localhost:8000
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            Copy this URL!
```

**Step 3: Update Render Environment (if URL changed)**

⚠️ **Only needed if ngrok URL is different from last time**

1. Go to: https://dashboard.render.com/
2. Click your backend service
3. Go to **Environment** tab
4. Find `RAG_SERVICE_URL` and update it with new ngrok URL
5. Click **Save Changes** (auto-redeploys in ~2 min)

**Step 4: Test**

Local test:
```bash
curl https://YOUR-NGROK-URL.ngrok-free.app/health
```

Production test (after Render deploys):
```bash
curl https://apnaghar-2emb.onrender.com/api/chatbot/health/
```

**Step 5: Use the App**

Open https://apnagharr.vercel.app/ and test the AI chatbot!

**Step 6: After Demo**

Stop both terminals (Ctrl+C in each):
- Terminal 1: RAG service
- Terminal 2: ngrok

---

## Important Notes

### ngrok Free Tier Limitations
- ⚠️ **URL changes every restart** - You'll get a new URL each time you run `ngrok http 8000`
- ⏰ **2-hour session limit** - Free tier expires after 2 hours
- 📝 **Update Render** - Must update `RAG_SERVICE_URL` in Render each time URL changes

### When AI Chatbot is NOT Running
- Frontend and backend work normally
- Chatbot shows fallback messages: "I'm your ApnaGhar AI assistant! The advanced AI is currently unavailable."
- All other features (login, browse projects, bookings) work fine

### Production Deployment Checklist

Before presentation/demo:
- [ ] Render backend is awake (visit https://apnaghar-2emb.onrender.com/api/projects/projects/)
- [ ] RAG service running (`python rag-service.py`)
- [ ] ngrok running (`ngrok http 8000`)
- [ ] Render has correct `RAG_SERVICE_URL`
- [ ] Vercel frontend is up-to-date

---

## Troubleshooting

### "502 Bad Gateway" on Render
**Cause**: Render free tier sleeps after 15 min inactivity  
**Fix**: Visit any API endpoint to wake it up (takes 30-50 seconds)

### Chatbot shows fallback responses
**Cause**: RAG service not running or ngrok URL outdated  
**Fix**: 
1. Check `python rag-service.py` is running
2. Check `ngrok http 8000` is running
3. Verify `RAG_SERVICE_URL` in Render matches current ngrok URL

### ngrok "endpoint offline"
**Cause**: RAG service not running on port 8000  
**Fix**: Start `python rag-service.py` first, then ngrok

### CORS errors
**Cause**: Backend is down or restarting  
**Fix**: Wait for Render to fully wake up/deploy

---

## Quick Commands Reference

```bash
# Activate virtual environment
source venv/bin/activate

# Start RAG service
python rag-service.py

# Start ngrok
ngrok http 8000

# Test RAG locally
curl http://localhost:8000/health

# Test RAG via ngrok
curl https://YOUR-NGROK-URL/health

# Test production backend
curl https://apnaghar-2emb.onrender.com/api/chatbot/health/

# Git workflow
git add .
git commit -m "Description"
git push origin main
```

---

## Team Coordination

### Before Demo Day
1. **Coordinator**: Start RAG service and ngrok at least 10 min before demo
2. **Verify**: Test production chatbot works
3. **Backup**: Have fallback plan if ngrok fails (chatbot still shows fallback messages gracefully)

### During Development
- Push code changes normally - no need to run RAG for regular development
- Only start RAG when specifically testing/demoing the AI chatbot feature
- Communicate in team chat when updating Render environment variables

---

## Contact & Support

- **Groq API**: https://console.groq.com/ (free tier: 14,400 requests/day)
- **ngrok Dashboard**: https://dashboard.ngrok.com/
- **Render Dashboard**: https://dashboard.render.com/
- **Vercel Dashboard**: https://vercel.com/dashboard

Last Updated: November 17, 2025
