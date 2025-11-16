"""
Test script for ApnaGhar RAG Pipeline
Quick tests without CSV data
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

print("[INFO] ApnaGhar RAG Pipeline - Test Script")
print("="*80)

# Test 1: Config loading
print("\n[Test 1] Loading configuration...")
try:
    from config import CSV_FILES, EMBEDDING_MODEL, PERSIST_DIR
    print(f"✓ Config loaded successfully")
    print(f"  - Embedding model: {EMBEDDING_MODEL}")
    print(f"  - Persist dir: {PERSIST_DIR}")
    print(f"  - CSV files configured: {len(CSV_FILES)}")
except Exception as e:
    print(f"✗ Config loading failed: {e}")
    sys.exit(1)

# Test 2: Import modules
print("\n[Test 2] Importing modules...")
try:
    from src.data_loader import RealEstateDataLoader
    from src.embedding import EmbeddingPipeline
    from src.vectorstore import FaissVectorStore
    from src.search import RAGSearch
    from src.query_engine import RealEstateRAG
    print("✓ All modules imported successfully")
except Exception as e:
    print(f"✗ Import failed: {e}")
    print("\nPlease install dependencies:")
    print("  pip install -r requirements.txt")
    sys.exit(1)

# Test 3: Check CSV files
print("\n[Test 3] Checking CSV files...")
csv_found = 0
csv_missing = 0
for name, path in CSV_FILES.items():
    if path.exists():
        csv_found += 1
        print(f"✓ {name}: {path.name}")
    else:
        csv_missing += 1
        print(f"✗ {name}: {path.name} (not found)")

if csv_missing > 0:
    print(f"\n[WARNING] {csv_missing} CSV files missing")
    print("\nTo use the RAG pipeline, copy your CSV files to:")
    for name, path in CSV_FILES.items():
        print(f"  {path}")
else:
    print(f"\n✓ All {csv_found} CSV files found")

# Test 4: Check vector store
print("\n[Test 4] Checking vector store...")
faiss_index = Path(PERSIST_DIR) / "faiss.index"
if faiss_index.exists():
    print(f"✓ Vector store exists at: {PERSIST_DIR}")
    print("\nYou can run queries:")
    print('  python app.py query "3BHK in Bangalore"')
    print('  python app.py interactive')
else:
    print(f"✗ Vector store not found")
    print("\nBuild the vector store first:")
    print("  python app.py build")

# Summary
print("\n" + "="*80)
print("TEST SUMMARY")
print("="*80)
print(f"CSV Files: {csv_found}/{len(CSV_FILES)} found")
print(f"Vector Store: {'Ready' if faiss_index.exists() else 'Not built'}")

if csv_found == len(CSV_FILES) and not faiss_index.exists():
    print("\n[NEXT STEP] Build the vector store:")
    print("  python app.py build")
elif faiss_index.exists():
    print("\n[READY] You can start querying:")
    print("  python app.py interactive")
else:
    print("\n[ACTION REQUIRED] Add CSV files to data/ directory")

print("="*80)
