"""
ApnaGhar RAG Pipeline - Main Application
Build vector store, run queries, interactive mode
"""
import sys
import argparse
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.data_loader import RealEstateDataLoader
from src.vectorstore import FaissVectorStore
from src.query_engine import RealEstateRAG
from config import PERSIST_DIR, CSV_FILES


def build_index():
    """Build FAISS index from CSV files"""
    print("\n" + "="*80)
    print("BUILDING RAG INDEX")
    print("="*80 + "\n")
    
    # Check if CSV files exist
    missing_files = []
    for name, path in CSV_FILES.items():
        if not path.exists():
            missing_files.append(str(path))
    
    if missing_files:
        print("[ERROR] Missing CSV files:")
        for f in missing_files:
            print(f"  - {f}")
        print("\nPlease place your CSV files in the data/ directory:")
        print("  - projects_rows.csv → data/projects.csv")
        print("  - properties_rows.csv → data/properties.csv")
        print("  - developers_rows.csv → data/developers.csv")
        print("  - construction_milestones_rows.csv → data/construction_milestones.csv")
        return False
    
    # Load documents
    print("[Step 1/3] Loading CSV files...")
    loader = RealEstateDataLoader()
    documents = loader.load_all_documents()
    
    if not documents:
        print("[ERROR] No documents loaded. Check CSV files.")
        return False
    
    print(f"[INFO] Loaded {len(documents)} documents")
    
    # Build vector store
    print("\n[Step 2/3] Building vector store...")
    vectorstore = FaissVectorStore()
    vectorstore.build_from_documents(documents)
    
    # Test query
    print("\n[Step 3/3] Testing vector store...")
    test_query = "3BHK property in Bangalore"
    results = vectorstore.query(test_query, top_k=3)
    
    if results:
        print(f"[SUCCESS] Test query returned {len(results)} results")
        print(f"[SUCCESS] Vector store built successfully at: {PERSIST_DIR}")
        return True
    else:
        print("[ERROR] Test query failed")
        return False


def query_mode(query_text: str):
    """Run a single query"""
    print("\n" + "="*80)
    print(f"QUERY: {query_text}")
    print("="*80 + "\n")
    
    rag = RealEstateRAG()
    result = rag.query(query_text)
    
    print("[ANSWER]")
    print(result['answer'])
    
    print(f"\n[RETRIEVED DOCUMENTS: {len(result['results'])}]")
    for i, res in enumerate(result['results'][:3], 1):
        meta = res['metadata']
        print(f"\n{i}. {meta.get('source', 'Unknown source')}")
        print(f"   Similarity: {res['similarity_score']:.3f}")
        print(f"   Preview: {meta.get('text', '')[:150]}...")
    
    print("\n" + "="*80)


def interactive_mode():
    """Interactive query mode"""
    print("\n" + "="*80)
    print("APNAGHAR RAG - INTERACTIVE MODE")
    print("="*80)
    print("\nType 'exit' or 'quit' to stop")
    print("Type 'help' for example queries")
    print("="*80 + "\n")
    
    rag = RealEstateRAG()
    
    example_queries = [
        "Show me 3BHK properties in Bangalore under 1 crore",
        "Which projects have swimming pool and gym?",
        "Tell me about Prestige Estates developer",
        "What properties are available in Whitefield?",
        "List 2BHK apartments in Mumbai between 50 lakhs and 80 lakhs",
        "Which completed projects are in Pune?",
    ]
    
    while True:
        try:
            query = input("\n[You] ").strip()
            
            if not query:
                continue
            
            if query.lower() in ['exit', 'quit', 'q']:
                print("\nGoodbye!")
                break
            
            if query.lower() in ['help', 'h']:
                print("\n[EXAMPLE QUERIES]")
                for i, ex in enumerate(example_queries, 1):
                    print(f"{i}. {ex}")
                continue
            
            # Process query
            result = rag.query(query)
            
            print(f"\n[ApnaGhar RAG]")
            print(result['answer'])
            
            # Show top results
            if result['results']:
                print(f"\n[Found {len(result['results'])} relevant results]")
            
        except KeyboardInterrupt:
            print("\n\nInterrupted. Goodbye!")
            break
        except Exception as e:
            print(f"\n[ERROR] {e}")


def info_mode():
    """Show vector store information"""
    print("\n" + "="*80)
    print("VECTOR STORE INFORMATION")
    print("="*80 + "\n")
    
    try:
        vectorstore = FaissVectorStore()
        vectorstore.load()
        
        stats = vectorstore.get_stats()
        
        print(f"Location: {stats['persist_dir']}")
        print(f"Total Vectors: {stats['total_vectors']:,}")
        print(f"Embedding Dimension: {stats['dimension']}")
        print(f"Total Metadata: {stats['total_metadata']:,}")
        
        # Source breakdown
        sources = {}
        for meta in vectorstore.metadata[:100]:  # Sample first 100
            source = meta.get('source', 'unknown')
            sources[source] = sources.get(source, 0) + 1
        
        print(f"\nSource Distribution (sample):")
        for source, count in sources.items():
            print(f"  {source}: {count}")
        
        print("\n" + "="*80)
        
    except Exception as e:
        print(f"[ERROR] {e}")
        print("\nVector store not found. Build it first:")
        print("  python app.py build")


def main():
    parser = argparse.ArgumentParser(
        description='ApnaGhar RAG Pipeline - Real Estate Intelligent Search'
    )
    
    parser.add_argument(
        'command',
        choices=['build', 'query', 'interactive', 'info'],
        help='Command to run'
    )
    
    parser.add_argument(
        'query_text',
        nargs='*',
        help='Query text (for query command)'
    )
    
    args = parser.parse_args()
    
    if args.command == 'build':
        success = build_index()
        sys.exit(0 if success else 1)
    
    elif args.command == 'query':
        if not args.query_text:
            print("[ERROR] Please provide a query")
            print("Example: python app.py query \"3BHK in Bangalore\"")
            sys.exit(1)
        query_text = ' '.join(args.query_text)
        query_mode(query_text)
    
    elif args.command == 'interactive':
        interactive_mode()
    
    elif args.command == 'info':
        info_mode()


if __name__ == "__main__":
    main()
