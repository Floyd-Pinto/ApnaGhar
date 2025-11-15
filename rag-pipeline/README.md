# RAG Pipeline for ApnaGhar Real Estate Data

This RAG (Retrieval-Augmented Generation) pipeline is specifically designed for the ApnaGhar real estate platform. It enables intelligent querying of projects, properties, developers, and construction milestones using natural language.

## 🎯 Purpose

Query your real estate data using natural language questions like:

- "Show me 3BHK properties in Bangalore under 1 crore"
- "Which projects by Prestige Estates are completed?"
- "What are the amenities in Whitefield properties?"
- "List all properties with swimming pool and gym"

## 🏗️ Architecture

```
CSV Data → Data Loader → Chunking → Embeddings → Vector Store (FAISS) → RAG Search → LLM Response
```

## 📁 Project Structure

```
rag-pipeline/
├── README.md                  # This file
├── requirements.txt           # Python dependencies
├── config.py                  # Configuration settings
├── data/                      # CSV data files
│   ├── projects.csv          # Project data
│   ├── properties.csv        # Property listings
│   ├── developers.csv        # Developer information
│   └── construction_milestones.csv
├── src/
│   ├── __init__.py
│   ├── data_loader.py        # CSV data loading
│   ├── embedding.py          # Text chunking & embeddings
│   ├── vectorstore.py        # FAISS vector database
│   ├── search.py             # RAG search & retrieval
│   └── query_engine.py       # Real estate specific queries
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   ├── 02_embedding_generation.ipynb
│   └── 03_rag_testing.ipynb
├── app.py                    # Main application
└── faiss_store/              # Vector database storage
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd rag-pipeline
pip install -r requirements.txt
```

### 2. Place Your CSV Files

Copy your CSV files to the `data/` directory:

- `projects_rows.csv` → `data/projects.csv`
- `properties_rows.csv` → `data/properties.csv`
- `developers_rows.csv` → `data/developers.csv`
- `construction_milestones_rows.csv` → `data/construction_milestones.csv`

### 3. Build the Vector Store

```bash
python app.py build
```

This will:

- Load all CSV files
- Convert to structured documents
- Generate embeddings
- Create FAISS index
- Save to `faiss_store/`

### 4. Query the Data

```bash
python app.py query "Show me 3BHK properties in Bangalore"
```

Or use the interactive mode:

```bash
python app.py interactive
```

## 💡 Example Queries

### Properties

- "Find 2BHK apartments in Mumbai under 80 lakhs"
- "What properties are available in Electronic City?"
- "Show me penthouses with 4 bedrooms"
- "List properties with modular kitchen and wooden flooring"

### Projects

- "Which projects have swimming pool and gym?"
- "Show ongoing projects in Pune"
- "What is the expected completion date for Royal Towers?"
- "List all residential projects in Delhi"

### Developers

- "Tell me about Prestige Estates"
- "Which developers have the highest trust score?"
- "Show projects by verified developers"
- "What is the RERA number for Godrej Properties?"

### Amenities & Features

- "Which projects have tennis court?"
- "Show properties with spacious balcony"
- "List all projects with clubhouse and parking"

## 🔧 Configuration

Edit `config.py` to customize:

```python
EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # Sentence transformer model
CHUNK_SIZE = 500                       # Characters per chunk
CHUNK_OVERLAP = 50                     # Overlap between chunks
TOP_K_RESULTS = 5                      # Number of results to retrieve
LLM_MODEL = "gemma2-9b-it"            # Groq LLM model
```

## 📊 Data Schema

### Projects

- ID, name, city, state, status, amenities, developer, etc.

### Properties

- ID, unit_number, type, bedrooms, price, status, features, etc.

### Developers

- ID, company_name, RERA number, verified status, trust_score

### Construction Milestones

- Phase number, status, completion dates, progress

## 🧪 Testing with Notebooks

### 01_data_exploration.ipynb

- Load and explore CSV data
- Visualize distributions
- Check data quality

### 02_embedding_generation.ipynb

- Test different embedding models
- Analyze chunk sizes
- Visualize embeddings

### 03_rag_testing.ipynb

- Test RAG queries
- Compare results
- Fine-tune parameters

## 🔌 Integration with Backend

### Django Integration

```python
# In your Django views
from rag_pipeline.src.query_engine import RealEstateRAG

rag = RealEstateRAG()
result = rag.query("3BHK in Bangalore")
```

### API Endpoint

```python
# backend/projects/views.py
@api_view(['POST'])
def rag_search(request):
    query = request.data.get('query')
    rag = RealEstateRAG()
    results = rag.search_and_format(query)
    return Response(results)
```

## 📈 Performance

- **Embedding Generation**: ~2-3 seconds for 9000 properties
- **Query Time**: ~100-200ms per query
- **Index Size**: ~50MB for full dataset
- **RAM Usage**: ~500MB during operation

## 🔐 Security

- No API keys stored in code
- Use `.env` file for sensitive data
- FAISS index stored locally

## 🤝 Contributing

1. Add new query templates in `query_engine.py`
2. Improve chunking strategies in `embedding.py`
3. Add new data sources in `data_loader.py`

## 📝 License

Same as ApnaGhar project

## 🐛 Troubleshooting

### Issue: "FAISS index not found"

**Solution**: Run `python app.py build` first

### Issue: "Out of memory"

**Solution**: Reduce `CHUNK_SIZE` in `config.py`

### Issue: "Poor search results"

**Solution**: Increase `TOP_K_RESULTS` or adjust embedding model

## 📞 Support

For issues or questions, check the main ApnaGhar documentation or create an issue.
