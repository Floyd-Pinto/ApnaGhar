# Quick Start Guide - ApnaGhar RAG Pipeline

## 🚀 Setup (5 minutes)

### 1. Install Dependencies

```bash
cd /home/floydpinto/ApnaGhar/rag-pipeline
pip install -r requirements.txt
```

This will install:

- `sentence-transformers` - For embeddings
- `faiss-cpu` - For vector search
- `langchain` - For document processing
- `pandas` - For CSV handling
- `groq` - For LLM (optional)

### 2. Copy Your CSV Files

Copy the CSV files from your Downloads folder to the `data/` directory:

```bash
# From the rag-pipeline directory
cp ~/Downloads/projects_rows.csv data/projects.csv
cp ~/Downloads/properties_rows.csv data/properties.csv
cp ~/Downloads/developers_rows.csv data/developers.csv
cp ~/Downloads/construction_milestones_rows.csv data/construction_milestones.csv
```

Or manually:

1. Open `data/` folder
2. Copy your CSV files
3. Rename them as shown above

### 3. (Optional) Set up Groq API

For enhanced LLM responses:

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Groq API key
# Get free key from: https://console.groq.com/keys
```

Edit `.env`:

```
GROQ_API_KEY=your_actual_key_here
```

### 4. Test Installation

```bash
python test_rag.py
```

You should see:

```
✓ Config loaded successfully
✓ All modules imported successfully
✓ CSV files found
```

## 📦 Build the Vector Store

This creates the FAISS index from your CSV data:

```bash
python app.py build
```

Expected output:

```
[Step 1/3] Loading CSV files...
[INFO] Processing 10 developers...
[INFO] Processing 67 projects...
[INFO] Processing 9202 properties...
[INFO] Total documents created: 9279

[Step 2/3] Building vector store...
[INFO] Split 9279 documents into 18500 chunks
[INFO] Generating embeddings...
[INFO] Added 18500 vectors to index

[Step 3/3] Testing vector store...
[SUCCESS] Vector store built successfully
```

⏱️ Time: ~2-3 minutes depending on your hardware

## 🔍 Query the Data

### Interactive Mode (Recommended)

```bash
python app.py interactive
```

Example queries:

```
[You] Show me 3BHK properties in Bangalore under 1 crore
[You] Which projects have swimming pool and gym?
[You] Tell me about Prestige Estates
[You] What are the amenities in Whitefield properties?
```

Type `help` for more examples, `exit` to quit.

### Single Query Mode

```bash
python app.py query "3BHK property in Bangalore with swimming pool"
```

### Check Vector Store Status

```bash
python app.py info
```

## 🐍 Use in Python Code

### Simple Query

```python
from src.query_engine import RealEstateRAG

rag = RealEstateRAG()
result = rag.query("Show me 2BHK apartments in Mumbai")
print(result['answer'])
```

### Structured Search

```python
from src.query_engine import RealEstateRAG

rag = RealEstateRAG()

# Search by criteria
result = rag.search_properties(
    bedrooms=3,
    city='Bangalore',
    max_price=10000000,  # 1 crore
    status='available'
)

print(result['answer'])
print(f"Found {len(result['results'])} properties")
```

### Amenity-Based Search

```python
result = rag.search_by_amenities(
    amenities=['Swimming Pool', 'Gym', 'Clubhouse'],
    city='Pune'
)
```

### Developer Information

```python
result = rag.get_developer_info('Prestige Estates')
print(result['answer'])
```

## 🔧 Troubleshooting

### Error: "FAISS index not found"

**Solution:** Run `python app.py build` first

### Error: "No module named 'faiss'"

**Solution:** Install dependencies: `pip install -r requirements.txt`

### Error: "CSV files not found"

**Solution:** Copy CSV files to `data/` directory (see step 2)

### Poor Search Results

**Solution:**

- Increase `TOP_K_RESULTS` in `config.py`
- Try different embedding models in `config.py`
- Be more specific in your queries

### Out of Memory

**Solution:**

- Reduce `CHUNK_SIZE` in `config.py` (default: 500)
- Process fewer documents at once
- Use smaller embedding model

## 📊 Performance Tips

1. **First Build**: Takes 2-3 minutes for ~9000 properties
2. **Query Speed**: 100-200ms per query
3. **Memory Usage**: ~500MB RAM during operation
4. **Disk Space**: ~50MB for FAISS index

## 🔌 Integration with Django Backend

### Add to Django Views

```python
# backend/projects/rag_views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
import sys
sys.path.append('/home/floydpinto/ApnaGhar/rag-pipeline')
from src.query_engine import RealEstateRAG

rag = RealEstateRAG()

@api_view(['POST'])
def rag_search(request):
    query = request.data.get('query')
    result = rag.search_and_format(query, format_type='brief')
    return Response(result)
```

### Add URL

```python
# backend/projects/urls.py
urlpatterns = [
    path('rag-search/', rag_search, name='rag-search'),
    # ... other urls
]
```

### Frontend Usage

```typescript
// frontend/src/services/api.ts
export const ragSearch = async (query: string) => {
  const response = await fetch(`${API_BASE_URL}/api/projects/rag-search/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return response.json();
};
```

## 📚 Next Steps

1. ✅ Build vector store
2. ✅ Test queries
3. 🔄 Integrate with Django backend
4. 🎨 Add search UI in frontend
5. 📈 Monitor and optimize

## 🆘 Need Help?

1. Check `README.md` for detailed documentation
2. Run `python test_rag.py` to diagnose issues
3. Review `config.py` for customization options

## 🎯 Example Use Cases

- **Property Search**: "3BHK in Bangalore under 1 crore"
- **Amenity Filter**: "Projects with gym and pool"
- **Developer Info**: "Tell me about Godrej Properties"
- **Location Based**: "Properties in Whitefield"
- **Price Range**: "2BHK between 50 lakhs and 80 lakhs in Mumbai"
- **Comparison**: "Compare Prestige Estates and Sobha Limited"

Happy querying! 🏡✨
