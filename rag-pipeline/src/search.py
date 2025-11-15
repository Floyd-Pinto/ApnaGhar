"""
RAG Search Module for ApnaGhar
Combines vector search with LLM generation
"""
import os
from typing import List, Dict, Any
from pathlib import Path
import sys
sys.path.append(str(Path(__file__).parent.parent))
from config import (
    PERSIST_DIR, EMBEDDING_MODEL, TOP_K_RESULTS, 
    LLM_MODEL, LLM_TEMPERATURE, LLM_MAX_TOKENS,
    QUERY_TEMPLATES, GROQ_API_KEY, DEBUG
)
from src.vectorstore import FaissVectorStore

try:
    from langchain_groq import ChatGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("[WARNING] Groq not available. Install with: pip install langchain-groq")


class RAGSearch:
    """RAG-based search for real estate data"""
    
    def __init__(
        self,
        persist_dir: str = PERSIST_DIR,
        embedding_model: str = EMBEDDING_MODEL,
        llm_model: str = LLM_MODEL,
        groq_api_key: str = None
    ):
        # Initialize vector store
        self.vectorstore = FaissVectorStore(persist_dir, embedding_model)
        
        # Load or warn about building index
        faiss_path = os.path.join(persist_dir, "faiss.index")
        if os.path.exists(faiss_path):
            self.vectorstore.load()
        else:
            print("[WARNING] FAISS index not found. Build it first using:")
            print("  python app.py build")
        
        # Initialize LLM if available
        self.llm = None
        if GROQ_AVAILABLE:
            api_key = groq_api_key or GROQ_API_KEY
            if api_key:
                try:
                    self.llm = ChatGroq(
                        groq_api_key=api_key,
                        model_name=llm_model,
                        temperature=LLM_TEMPERATURE,
                        max_tokens=LLM_MAX_TOKENS
                    )
                    print(f"[INFO] Groq LLM initialized: {llm_model}")
                except Exception as e:
                    print(f"[WARNING] Failed to initialize Groq: {e}")
            else:
                print("[WARNING] GROQ_API_KEY not set. LLM features disabled.")
        else:
            print("[INFO] Running without LLM. Set up Groq for enhanced responses.")
    
    def retrieve_context(
        self, 
        query: str, 
        top_k: int = TOP_K_RESULTS,
        filters: Dict = None
    ) -> List[Dict]:
        """Retrieve relevant documents from vector store"""
        results = self.vectorstore.query(query, top_k=top_k)
        
        # Apply filters if provided
        if filters:
            results = self.vectorstore.filter_by_metadata(results, filters)
        
        return results
    
    def format_context(self, results: List[Dict]) -> str:
        """Format search results into context string"""
        context_parts = []
        
        for i, result in enumerate(results, 1):
            text = result['metadata']['text']
            source = result['metadata'].get('source', 'unknown')
            score = result['similarity_score']
            
            context_parts.append(
                f"[Document {i}] (Source: {source}, Relevance: {score:.2f})\n{text}\n"
            )
        
        return "\n".join(context_parts)
    
    def detect_query_intent(self, query: str) -> str:
        """Detect query intent for template selection"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ['compare', 'vs', 'versus', 'difference']):
            return 'comparison'
        elif any(word in query_lower for word in ['developer', 'builder', 'company']):
            return 'developer_info'
        elif any(word in query_lower for word in ['project', 'complex', 'development']):
            return 'project_info'
        else:
            return 'property_search'
    
    def generate_response(
        self, 
        query: str, 
        context: str,
        template_type: str = None
    ) -> str:
        """Generate LLM response using context"""
        if not self.llm:
            return f"[Context-only response]\n\n{context}"
        
        # Select template
        if template_type is None:
            template_type = self.detect_query_intent(query)
        
        template = QUERY_TEMPLATES.get(template_type, QUERY_TEMPLATES['property_search'])
        
        # Format prompt
        prompt = template.format(context=context, question=query)
        
        try:
            # Generate response
            response = self.llm.invoke(prompt)
            return response.content
        except Exception as e:
            print(f"[ERROR] LLM generation failed: {e}")
            return f"[Context-only response due to error]\n\n{context}"
    
    def search(
        self, 
        query: str, 
        top_k: int = TOP_K_RESULTS,
        filters: Dict = None,
        return_raw: bool = False
    ) -> Dict[str, Any]:
        """
        Main search function
        
        Args:
            query: Natural language query
            top_k: Number of results to retrieve
            filters: Metadata filters (e.g., {'city': 'Bangalore'})
            return_raw: If True, return raw results without LLM generation
        
        Returns:
            Dictionary with query, context, results, and answer
        """
        if DEBUG:
            print(f"[DEBUG] Search query: '{query}'")
        
        # Retrieve relevant documents
        results = self.retrieve_context(query, top_k=top_k, filters=filters)
        
        if not results:
            return {
                'query': query,
                'results': [],
                'context': '',
                'answer': 'No relevant results found. Try refining your query.'
            }
        
        # Format context
        context = self.format_context(results)
        
        # Return raw results if requested
        if return_raw:
            return {
                'query': query,
                'results': results,
                'context': context,
                'answer': None
            }
        
        # Generate answer
        answer = self.generate_response(query, context)
        
        return {
            'query': query,
            'results': results,
            'context': context,
            'answer': answer
        }
    
    def search_and_summarize(
        self, 
        query: str, 
        top_k: int = TOP_K_RESULTS,
        filters: Dict = None
    ) -> str:
        """
        Search and return a summarized answer
        Convenient method for simple use cases
        """
        result = self.search(query, top_k=top_k, filters=filters)
        return result['answer']
    
    def batch_search(
        self,
        queries: List[str],
        top_k: int = TOP_K_RESULTS
    ) -> List[Dict]:
        """Process multiple queries in batch"""
        return [self.search(q, top_k=top_k) for q in queries]


# Example usage
if __name__ == "__main__":
    # Initialize RAG search
    rag_search = RAGSearch()
    
    # Example queries
    queries = [
        "Show me 3BHK properties in Bangalore under 1 crore",
        "Which projects have swimming pool and gym?",
        "Tell me about Prestige Estates developer",
        "What properties are available in Whitefield?",
    ]
    
    print("\n" + "="*80)
    print("RAG SEARCH EXAMPLES")
    print("="*80)
    
    for query in queries:
        print(f"\n[Query] {query}")
        print("-" * 80)
        
        try:
            result = rag_search.search(query, top_k=3)
            print(f"\n[Answer]\n{result['answer']}")
            print(f"\n[Retrieved {len(result['results'])} documents]")
        except Exception as e:
            print(f"[ERROR] {e}")
        
        print("\n" + "="*80)
