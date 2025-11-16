# ApnaGhar Deployment Guide - Render & Vercel

## Pre-Deployment Checklist

### 1. Build RAG Index Locally
```bash
cd /home/floydpinto/ApnaGhar
./rebuild_rag.sh
```

This creates the FAISS vector store that will be committed to Git.

### 2. Prepare Environment Variables

**Backend (.env variables for Render):**
- All existing variables (DATABASE_URL, CLOUDINARY_*, PINATA_*, etc.)
- **NEW:** `GROQ_API_KEY` - Your Groq API key for RAG chatbot

**Frontend (.env for Vercel):**
- `VITE_API_BASE_URL=https://apnaghar-2emb.onrender.com`

---

## Step-by-Step Deployment

### Step 1: Commit RAG Pipeline to Git

```bash
cd /home/floydpinto/ApnaGhar

# Check what's being added
git status

# Stage all changes
git add .gitignore
git add rag-pipeline/
git add backend/chatbot/
git add frontend/src/components/AIChatbot.tsx
git add backend/backend/settings.py
git add backend/backend/urls.py
git add backend/projects/management/commands/export_for_rag.py
git add rebuild_rag.sh
git add test_chatbot_api.py
git add CHATBOT_INTEGRATION.md

# Commit
git commit -m "Add AI chatbot with RAG pipeline integration

- Integrated RAG (Retrieval-Augmented Generation) pipeline
- Added Django chatbot API endpoints
- Updated frontend chatbot to use AI responses
- Added ApnaGhar context for intelligent answers
- Included pre-built FAISS vector store
- Support for natural language property search
"

# Push to GitHub
git push origin main
```

### Step 2: Deploy Backend to Render

#### A. Add New Environment Variable
Go to Render Dashboard → Your Service → Environment

**Add:**
```
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
```

Get your key from: https://console.groq.com/keys

#### B. Update Build Command (if needed)
**Build Command:**
```bash
cd backend && pip install -r requirements.txt
```

**Start Command:**
```bash
cd backend && gunicorn backend.wsgi:application
```

#### C. Deploy
- Render will auto-deploy from GitHub push
- Check logs for any errors
- Verify: `https://apnaghar-2emb.onrender.com/api/chatbot/health/`

### Step 3: Deploy Frontend to Vercel

#### A. Update Environment Variable
Vercel Dashboard → Your Project → Settings → Environment Variables

**Ensure:**
```
VITE_API_BASE_URL=https://apnaghar-2emb.onrender.com
```

#### B. Deploy
```bash
cd frontend
npm run build  # Test build locally first
git push  # Vercel will auto-deploy
```

#### C. Verify
- Open your Vercel URL
- Click chatbot icon
- Test with: "Show me 3BHK properties under 1 crore"

---

## Important Notes

### RAG Pipeline on Render

**Good News:** The FAISS vector store is pre-built and committed to Git, so Render will use it directly. No need to rebuild on server.

**If you need to update data later:**

1. **Option A: Rebuild locally and push**
   ```bash
   ./rebuild_rag.sh
   git add rag-pipeline/faiss_store/
   git commit -m "Update RAG index with latest data"
   git push
   ```

2. **Option B: Rebuild on Render (manual)**
   ```bash
   # In Render shell
   cd backend
   python manage.py export_for_rag
   cd ../rag-pipeline
   python app.py build
   ```

### Dependencies

**Backend requirements.txt already includes:**
- Django and existing packages
- RAG pipeline uses separate `rag-pipeline/requirements.txt` (already committed)

**Note:** Python dependencies for RAG are installed when Django imports the chatbot app.

### File Structure in Git

```
ApnaGhar/
├── backend/
│   ├── chatbot/              ✅ Committed (new)
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── rag_wrapper.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── projects/management/commands/
│   │   └── export_for_rag.py  ✅ Committed (new)
│   └── backend/
│       ├── settings.py        ✅ Modified
│       └── urls.py            ✅ Modified
├── frontend/src/components/
│   └── AIChatbot.tsx         ✅ Modified
├── rag-pipeline/             ✅ NOW COMMITTED
│   ├── .env.example          ✅ Committed
│   ├── .env                  ❌ Ignored (secrets)
│   ├── data/                 ✅ Committed (CSV + context)
│   ├── faiss_store/          ✅ Committed (pre-built index)
│   ├── src/                  ✅ Committed (source code)
│   ├── app.py                ✅ Committed
│   ├── config.py             ✅ Committed
│   └── requirements.txt      ✅ Committed
├── rebuild_rag.sh            ✅ Committed
├── test_chatbot_api.py       ✅ Committed
├── CHATBOT_INTEGRATION.md    ✅ Committed
└── .gitignore                ✅ Modified
```

---

## Testing After Deployment

### 1. Test Backend API
```bash
curl https://apnaghar-2emb.onrender.com/api/chatbot/health/
```

Expected:
```json
{
  "rag_available": true,
  "status": "healthy",
  "message": "RAG service is operational"
}
```

### 2. Test Query
```bash
curl -X POST https://apnaghar-2emb.onrender.com/api/chatbot/query/ \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about ApnaGhar"}'
```

### 3. Test Frontend
- Open your Vercel URL
- Click chatbot button
- Ask: "Show me properties in Mumbai"
- Should get AI-powered response with property details

---

## Troubleshooting

### "RAG service not available" on Render

**Check:**
1. `GROQ_API_KEY` is set in Render environment variables
2. FAISS store was committed: Check GitHub repo for `rag-pipeline/faiss_store/` folder
3. Render logs show no import errors

**Fix:**
```bash
# Rebuild locally and push
./rebuild_rag.sh
git add rag-pipeline/faiss_store/
git commit -m "Fix FAISS store"
git push
```

### Frontend shows connection error

**Check:**
1. Backend is running: `curl https://apnaghar-2emb.onrender.com/api/chatbot/health/`
2. CORS is configured in `backend/backend/settings.py`
3. `VITE_API_BASE_URL` is correct in Vercel

### Slow chatbot responses

**Optimize:**
1. Use faster embedding model in `rag-pipeline/config.py`:
   ```python
   EMBEDDING_MODEL = "all-MiniLM-L6-v2"
   ```
2. Reduce results:
   ```python
   TOP_K_RESULTS = 3
   ```
3. Rebuild and push:
   ```bash
   ./rebuild_rag.sh
   git add rag-pipeline/faiss_store/
   git commit -m "Optimize RAG performance"
   git push
   ```

---

## Updating RAG with New Data

When you add new projects/properties:

```bash
# 1. Export new data and rebuild
./rebuild_rag.sh

# 2. Commit updated index
git add rag-pipeline/data/
git add rag-pipeline/faiss_store/
git commit -m "Update RAG with latest property data"

# 3. Push to deploy
git push origin main
```

Render will auto-deploy with updated data.

---

## Cost Optimization

### Groq API (Free Tier)
- 14,400 requests/day free
- Should be sufficient for most use cases
- Monitor usage: https://console.groq.com

### FAISS Storage
- Pre-built index is ~5-50MB depending on data size
- Included in Git repo (no extra storage cost)

### Alternative: OpenAI
If Groq limit reached, add `OPENAI_API_KEY` to Render and update `rag-pipeline/config.py`:
```python
LLM_MODEL = "gpt-3.5-turbo"  # or "gpt-4"
```

---

## Security Checklist

- [x] `.env` files excluded from Git
- [x] API keys in Render environment variables (not code)
- [x] CORS configured for frontend domain only
- [x] Chatbot endpoint rate limiting (optional, add if needed)
- [x] No sensitive data in committed FAISS index (only property info)

---

## Next Steps After Deployment

1. **Monitor Performance**
   - Check Render logs for errors
   - Monitor Groq API usage
   - Track chatbot query patterns

2. **Gather Feedback**
   - Add user feedback buttons (thumbs up/down)
   - Log failed queries for improvement
   - A/B test different prompts

3. **Optimize**
   - Fine-tune RAG parameters based on usage
   - Add more context documents
   - Improve query preprocessing

4. **Scale**
   - Add caching for common queries
   - Consider dedicated RAG service if needed
   - Implement query analytics dashboard

---

**Ready to deploy? Follow the steps above! 🚀**
