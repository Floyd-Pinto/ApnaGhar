"""
Configuration file for ApnaGhar RAG Pipeline
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Base directories
BASE_DIR = Path(__file__).parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / '.env')
DATA_DIR = BASE_DIR / "data"
FAISS_STORE_DIR = BASE_DIR / "faiss_store"
NOTEBOOKS_DIR = BASE_DIR / "notebooks"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
FAISS_STORE_DIR.mkdir(exist_ok=True)
NOTEBOOKS_DIR.mkdir(exist_ok=True)

# CSV File Paths
CSV_FILES = {
    'projects': DATA_DIR / 'projects.csv',
    'properties': DATA_DIR / 'properties.csv',
    'developers': DATA_DIR / 'developers.csv',
    'milestones': DATA_DIR / 'construction_milestones.csv'
}

# Embedding Configuration
EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # Fast and efficient for English
# Alternative models:
# "all-mpnet-base-v2"  # Better quality, slower
# "paraphrase-MiniLM-L6-v2"  # Good for paraphrasing
EMBEDDING_DIMENSION = 384  # Dimension for all-MiniLM-L6-v2

# Chunking Configuration
CHUNK_SIZE = 500  # Characters per chunk
CHUNK_OVERLAP = 50  # Overlap to maintain context
MIN_CHUNK_SIZE = 100  # Minimum viable chunk size

# Vector Store Configuration
FAISS_INDEX_TYPE = "FlatL2"  # L2 distance metric
# Alternative: "FlatIP" for inner product (cosine similarity)
PERSIST_DIR = str(FAISS_STORE_DIR)

# Retrieval Configuration
TOP_K_RESULTS = 5  # Number of similar documents to retrieve
SIMILARITY_THRESHOLD = 0.7  # Minimum similarity score (0-1)

# LLM Configuration
LLM_MODEL = "llama-3.3-70b-versatile"  # Groq model (latest, fast, and accurate)
# Alternative models:
# "llama-3.1-70b-versatile"
# "mixtral-8x7b-32768"
# "gemma2-9b-it" (decommissioned)
LLM_TEMPERATURE = 0.3  # Lower = more focused, Higher = more creative
LLM_MAX_TOKENS = 1024

# Query Templates
QUERY_TEMPLATES = {
    'property_search': """Based on the following real estate data, answer the user's question about properties:

Context:
{context}

Question: {question}

Provide a clear, structured answer with:
1. Direct answer to the question
2. Relevant property details (price, location, features)
3. Any important considerations

Answer:""",
    
    'project_info': """Based on the following project information, answer the user's question:

Context:
{context}

Question: {question}

Provide details about:
1. Project name and location
2. Developer information
3. Amenities and features
4. Status and completion date

Answer:""",
    
    'developer_info': """Based on the following developer information, answer the user's question:

Context:
{context}

Question: {question}

Include:
1. Developer name and credentials
2. Trust score and verification status
3. Notable projects
4. Contact information if available

Answer:""",
    
    'comparison': """Based on the following property/project data, help compare options:

Context:
{context}

Question: {question}

Provide a comparison highlighting:
1. Key similarities and differences
2. Price and value analysis
3. Location and amenities comparison
4. Recommendation if applicable

Answer:"""
}

# CSV Column Mappings for structured data extraction
PROPERTY_COLUMNS = {
    'id': 'id',
    'unit_number': 'unit_number',
    'type': 'property_type',
    'bedrooms': 'bedrooms',
    'bathrooms': 'bathrooms',
    'price': 'price',
    'status': 'status',
    'features': 'features',
    'floor': 'floor_number',
    'carpet_area': 'carpet_area'
}

PROJECT_COLUMNS = {
    'id': 'id',
    'name': 'name',
    'city': 'city',
    'state': 'state',
    'status': 'status',
    'amenities': 'amenities',
    'starting_price': 'starting_price',
    'total_units': 'total_units',
    'developer': 'developer_id'
}

DEVELOPER_COLUMNS = {
    'id': 'id',
    'name': 'company_name',
    'rera': 'rera_number',
    'verified': 'verified',
    'trust_score': 'trust_score',
    'total_projects': 'total_projects'
}

# Search Keywords for intent detection
SEARCH_INTENTS = {
    'property_search': ['property', 'apartment', 'flat', 'unit', 'bhk', 'bedroom'],
    'project_search': ['project', 'building', 'complex', 'tower', 'development'],
    'location_search': ['city', 'area', 'location', 'near', 'in'],
    'price_search': ['price', 'cost', 'budget', 'under', 'between', 'lakh', 'crore'],
    'amenity_search': ['amenity', 'amenities', 'facility', 'facilities', 'feature'],
    'developer_search': ['developer', 'builder', 'company'],
    'status_search': ['available', 'sold', 'booked', 'ongoing', 'completed', 'upcoming']
}

# Price conversion helpers
PRICE_UNITS = {
    'lakh': 100000,
    'lakhs': 100000,
    'lac': 100000,
    'crore': 10000000,
    'crores': 10000000,
    'million': 1000000,
    'thousand': 1000,
    'k': 1000
}

# Logging Configuration
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Environment Variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Debug Mode
DEBUG = os.getenv("RAG_DEBUG", "False").lower() == "true"
