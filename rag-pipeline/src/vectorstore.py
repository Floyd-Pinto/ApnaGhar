"""
FAISS Vector Store for ApnaGhar RAG
Stores and retrieves document embeddings efficiently
"""
import os
import faiss
import numpy as np
import pickle
from typing import List, Any, Dict
from sentence_transformers import SentenceTransformer
from pathlib import Path
import sys
sys.path.append(str(Path(__file__).parent.parent))
from config import PERSIST_DIR, EMBEDDING_MODEL, EMBEDDING_DIMENSION, DEBUG
from src.embedding import EmbeddingPipeline


class FaissVectorStore:
    """FAISS-based vector store for fast similarity search"""
    
    def __init__(
        self, 
        persist_dir: str = PERSIST_DIR,
        embedding_model: str = EMBEDDING_MODEL,
        chunk_size: int = 500,
        chunk_overlap: int = 50
    ):
        self.persist_dir = persist_dir
        os.makedirs(self.persist_dir, exist_ok=True)
        
        self.index = None
        self.metadata = []  # Store document metadata
        self.chunks = []    # Store original chunks for retrieval
        
        self.embedding_model = embedding_model
        self.model = SentenceTransformer(embedding_model)
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        print(f"[INFO] Initialized FAISS vector store")
        print(f"[INFO] Persist directory: {self.persist_dir}")
    
    def build_from_documents(self, documents: List[Any]):
        """
        Build vector store from raw documents
        - Chunks documents
        - Generates embeddings
        - Creates FAISS index
        - Saves to disk
        """
        print(f"[INFO] Building vector store from {len(documents)} documents...")
        
        # Create embedding pipeline
        emb_pipeline = EmbeddingPipeline(
            model_name=self.embedding_model,
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )
        
        # Chunk and embed
        chunks = emb_pipeline.chunk_documents(documents)
        embeddings = emb_pipeline.embed_chunks(chunks)
        
        # Store chunks for retrieval
        self.chunks = chunks
        
        # Extract metadata
        metadatas = [
            {
                "text": chunk.page_content,
                **chunk.metadata
            } 
            for chunk in chunks
        ]
        
        # Add to index
        self.add_embeddings(
            np.array(embeddings).astype('float32'), 
            metadatas
        )
        
        # Save to disk
        self.save()
        print(f"[INFO] Vector store built and saved")
    
    def add_embeddings(self, embeddings: np.ndarray, metadatas: List[Dict] = None):
        """Add embeddings to FAISS index"""
        dim = embeddings.shape[1]
        
        if self.index is None:
            # Create index
            self.index = faiss.IndexFlatL2(dim)  # L2 distance
            print(f"[INFO] Created FAISS index with dimension {dim}")
        
        # Add vectors
        self.index.add(embeddings)
        
        # Store metadata
        if metadatas:
            self.metadata.extend(metadatas)
        
        print(f"[INFO] Added {embeddings.shape[0]} vectors to index")
        print(f"[INFO] Total vectors in index: {self.index.ntotal}")
    
    def save(self):
        """Save FAISS index and metadata to disk"""
        faiss_path = os.path.join(self.persist_dir, "faiss.index")
        meta_path = os.path.join(self.persist_dir, "metadata.pkl")
        chunks_path = os.path.join(self.persist_dir, "chunks.pkl")
        
        # Save FAISS index
        faiss.write_index(self.index, faiss_path)
        
        # Save metadata
        with open(meta_path, "wb") as f:
            pickle.dump(self.metadata, f)
        
        # Save chunks
        with open(chunks_path, "wb") as f:
            pickle.dump(self.chunks, f)
        
        print(f"[INFO] Saved vector store to {self.persist_dir}")
    
    def load(self):
        """Load FAISS index and metadata from disk"""
        faiss_path = os.path.join(self.persist_dir, "faiss.index")
        meta_path = os.path.join(self.persist_dir, "metadata.pkl")
        chunks_path = os.path.join(self.persist_dir, "chunks.pkl")
        
        if not os.path.exists(faiss_path):
            raise FileNotFoundError(
                f"FAISS index not found at {faiss_path}. "
                "Please build the index first using build_from_documents()"
            )
        
        # Load FAISS index
        self.index = faiss.read_index(faiss_path)
        
        # Load metadata
        with open(meta_path, "rb") as f:
            self.metadata = pickle.load(f)
        
        # Load chunks if available
        if os.path.exists(chunks_path):
            with open(chunks_path, "rb") as f:
                self.chunks = pickle.load(f)
        
        print(f"[INFO] Loaded vector store from {self.persist_dir}")
        print(f"[INFO] Index contains {self.index.ntotal} vectors")
    
    def search(
        self, 
        query_embedding: np.ndarray, 
        top_k: int = 5
    ) -> List[Dict]:
        """
        Search for similar documents using embedding
        Returns list of results with metadata and distances
        """
        if self.index is None:
            raise ValueError("Index not loaded. Call load() first.")
        
        # Ensure query is 2D
        if len(query_embedding.shape) == 1:
            query_embedding = query_embedding.reshape(1, -1)
        
        # Search
        distances, indices = self.index.search(
            query_embedding.astype('float32'), 
            top_k
        )
        
        # Format results
        results = []
        for idx, dist in zip(indices[0], distances[0]):
            if idx < len(self.metadata):
                result = {
                    "index": int(idx),
                    "distance": float(dist),
                    "similarity_score": float(1 / (1 + dist)),  # Convert distance to similarity
                    "metadata": self.metadata[idx]
                }
                results.append(result)
        
        return results
    
    def query(self, query_text: str, top_k: int = 5) -> List[Dict]:
        """
        Query vector store with text
        Generates embedding and searches
        """
        if DEBUG:
            print(f"[DEBUG] Querying: '{query_text}'")
        
        # Generate query embedding
        query_emb = self.model.encode([query_text]).astype('float32')
        
        # Search
        results = self.search(query_emb, top_k=top_k)
        
        if DEBUG:
            print(f"[DEBUG] Found {len(results)} results")
            for i, result in enumerate(results[:3]):
                print(f"  Result {i+1}: similarity={result['similarity_score']:.3f}")
        
        return results
    
    def filter_by_metadata(
        self, 
        results: List[Dict], 
        filters: Dict[str, Any]
    ) -> List[Dict]:
        """
        Filter search results by metadata criteria
        
        Example filters:
        - {'city': 'Bangalore', 'bedrooms': 3}
        - {'status': 'available', 'price': {'$lt': 10000000}}
        """
        filtered = []
        
        for result in results:
            metadata = result['metadata']
            match = True
            
            for key, value in filters.items():
                if key not in metadata:
                    match = False
                    break
                
                # Handle range queries
                if isinstance(value, dict):
                    meta_val = metadata[key]
                    if '$lt' in value and meta_val >= value['$lt']:
                        match = False
                        break
                    if '$gt' in value and meta_val <= value['$gt']:
                        match = False
                        break
                    if '$lte' in value and meta_val > value['$lte']:
                        match = False
                        break
                    if '$gte' in value and meta_val < value['$gte']:
                        match = False
                        break
                # Exact match
                elif metadata[key] != value:
                    match = False
                    break
            
            if match:
                filtered.append(result)
        
        return filtered
    
    def get_stats(self) -> Dict:
        """Get vector store statistics"""
        return {
            'total_vectors': self.index.ntotal if self.index else 0,
            'dimension': self.index.d if self.index else 0,
            'total_metadata': len(self.metadata),
            'persist_dir': self.persist_dir
        }


# Example usage
if __name__ == "__main__":
    from data_loader import RealEstateDataLoader
    
    # Load documents
    loader = RealEstateDataLoader()
    docs = loader.load_all_documents()
    
    # Build vector store
    store = FaissVectorStore()
    store.build_from_documents(docs)
    
    # Test query
    results = store.query("3BHK property in Bangalore with swimming pool", top_k=5)
    
    print("\n[INFO] Top 3 results:")
    for i, result in enumerate(results[:3], 1):
        print(f"\n{i}. Similarity: {result['similarity_score']:.3f}")
        print(f"   Source: {result['metadata'].get('source')}")
        print(f"   Preview: {result['metadata']['text'][:200]}...")
