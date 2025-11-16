#!/bin/bash
# Rebuild RAG Pipeline with ApnaGhar Context

echo "🔄 Rebuilding RAG Pipeline with ApnaGhar Context..."
echo ""

# Step 1: Re-export Django data
echo "📊 Step 1: Exporting Django data to CSV..."
cd /home/floydpinto/ApnaGhar/backend
python manage.py export_for_rag

if [ $? -ne 0 ]; then
    echo "❌ Failed to export data"
    exit 1
fi

echo "✅ Data exported successfully"
echo ""

# Step 2: Build FAISS index
echo "🏗️  Step 2: Building FAISS vector index with context..."
cd ../rag-pipeline
python app.py build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build FAISS index"
    exit 1
fi

echo "✅ FAISS index built successfully"
echo ""

# Step 3: Test queries
echo "🧪 Step 3: Testing sample queries..."
echo ""

echo "Query 1: General platform info"
python -c "
from src.query_engine import RealEstateRAG
rag = RealEstateRAG()
result = rag.query('Tell me about ApnaGhar platform')
print(f\"Answer: {result['answer'][:300]}...\")
"

echo ""
echo "Query 2: Property search"
python -c "
from src.query_engine import RealEstateRAG
rag = RealEstateRAG()
result = rag.query('Show me 3BHK properties under 1 crore')
print(f\"Answer: {result['answer'][:300]}...\")
"

echo ""
echo "✅ RAG Pipeline rebuilt successfully!"
echo ""
echo "Next steps:"
echo "  1. Start Django backend: cd backend && python manage.py runserver"
echo "  2. Test chatbot API: curl -X POST http://localhost:8000/api/chatbot/query/ -H 'Content-Type: application/json' -d '{\"query\": \"Tell me about ApnaGhar\"}'"
echo "  3. Start frontend: cd frontend && npm run dev"
echo "  4. Test chatbot in browser"
