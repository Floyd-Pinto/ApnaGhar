"""
Embedding Pipeline for ApnaGhar RAG
Chunks documents and generates vector embeddings
"""
from typing import List, Any
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import numpy as np
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from config import EMBEDDING_MODEL, CHUNK_SIZE, CHUNK_OVERLAP, MIN_CHUNK_SIZE, DEBUG


class EmbeddingPipeline:
    """Generate embeddings for real estate documents"""
    
    def __init__(
        self, 
        model_name: str = EMBEDDING_MODEL,
        chunk_size: int = CHUNK_SIZE,
        chunk_overlap: int = CHUNK_OVERLAP
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.model = SentenceTransformer(model_name)
        print(f"[INFO] Loaded embedding model: {model_name}")
        print(f"[INFO] Model dimension: {self.model.get_sentence_embedding_dimension()}")
    
    def chunk_documents(self, documents: List[Any]) -> List[Any]:
        """
        Split documents into smaller chunks for better retrieval
        Preserves metadata from parent documents
        """
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""],
            is_separator_regex=False
        )
        
        chunks = splitter.split_documents(documents)
        
        # Filter out very small chunks
        filtered_chunks = [
            chunk for chunk in chunks 
            if len(chunk.page_content) >= MIN_CHUNK_SIZE
        ]
        
        print(f"[INFO] Split {len(documents)} documents into {len(chunks)} chunks")
        print(f"[INFO] After filtering: {len(filtered_chunks)} chunks")
        
        return filtered_chunks
    
    def embed_chunks(self, chunks: List[Any], batch_size: int = 32) -> np.ndarray:
        """
        Generate embeddings for document chunks
        Uses batching for efficiency
        """
        texts = [chunk.page_content for chunk in chunks]
        print(f"[INFO] Generating embeddings for {len(texts)} chunks...")
        
        # Generate embeddings with progress bar
        embeddings = self.model.encode(
            texts, 
            batch_size=batch_size,
            show_progress_bar=True,
            convert_to_numpy=True
        )
        
        print(f"[INFO] Embeddings shape: {embeddings.shape}")
        print(f"[INFO] Embedding dimension: {embeddings.shape[1]}")
        
        return embeddings
    
    def embed_query(self, query: str) -> np.ndarray:
        """Generate embedding for a single query"""
        return self.model.encode([query], convert_to_numpy=True)[0]
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of the embedding model"""
        return self.model.get_sentence_embedding_dimension()


# Example usage
if __name__ == "__main__":
    from data_loader import RealEstateDataLoader
    
    # Load documents
    loader = RealEstateDataLoader()
    docs = loader.load_all_documents()
    
    # Create embeddings
    emb_pipeline = EmbeddingPipeline()
    chunks = emb_pipeline.chunk_documents(docs)
    embeddings = emb_pipeline.embed_chunks(chunks)
    
    print(f"\n[INFO] Example embedding (first 10 dims):")
    print(embeddings[0][:10])
    
    # Test query embedding
    query = "3BHK property in Bangalore"
    query_emb = emb_pipeline.embed_query(query)
    print(f"\n[INFO] Query embedding shape: {query_emb.shape}")
