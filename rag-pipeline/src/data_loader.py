"""
Data Loader for ApnaGhar Real Estate CSV Files
Converts CSV data into LangChain Document format for RAG pipeline
"""
import pandas as pd
import json
from pathlib import Path
from typing import List, Dict, Any
from langchain_core.documents import Document
import sys
sys.path.append(str(Path(__file__).parent.parent))
from config import CSV_FILES, DEBUG


class RealEstateDataLoader:
    """Load and process real estate CSV files into Document objects"""
    
    def __init__(self, csv_files: Dict[str, Path] = None):
        self.csv_files = csv_files or CSV_FILES
        self.data = {}
        
    def load_csv(self, file_path: Path, file_type: str) -> pd.DataFrame:
        """Load a single CSV file"""
        try:
            df = pd.read_csv(file_path)
            if DEBUG:
                print(f"[DEBUG] Loaded {len(df)} rows from {file_path.name}")
            return df
        except Exception as e:
            print(f"[ERROR] Failed to load {file_path}: {e}")
            return pd.DataFrame()
    
    def load_all_csv_files(self):
        """Load all CSV files into dataframes"""
        for name, path in self.csv_files.items():
            if path.exists():
                self.data[name] = self.load_csv(path, name)
            else:
                print(f"[WARNING] File not found: {path}")
                
    def safe_json_parse(self, value):
        """Safely parse JSON strings from CSV"""
        if pd.isna(value) or value == '' or value == '[]':
            return []
        if isinstance(value, list):
            return value
        try:
            parsed = json.loads(value.replace("'", '"'))
            return parsed if isinstance(parsed, list) else [parsed]
        except:
            # If JSON parsing fails, treat as comma-separated string
            if isinstance(value, str):
                return [v.strip() for v in value.split(',')]
            return []
    
    def property_to_document(self, row: pd.Series, project_info: Dict = None) -> Document:
        """Convert a property row to a LangChain Document"""
        # Parse features
        features = self.safe_json_parse(row.get('features', '[]'))
        features_text = ', '.join(features) if features else 'No features listed'
        
        # Build comprehensive text content
        content_parts = [
            f"Property ID: {row['id']}",
            f"Unit Number: {row['unit_number']}",
            f"Property Type: {row['property_type'].upper() if pd.notna(row.get('property_type')) else 'N/A'}",
            f"Bedrooms: {row['bedrooms']} | Bathrooms: {row['bathrooms']} | Balconies: {row.get('balconies', 0)}",
            f"Floor: {row.get('floor_number', 'N/A')} | Tower: {row.get('tower', 'N/A')}",
            f"Carpet Area: {row.get('carpet_area', 'N/A')} sq ft",
            f"Price: ₹{row['price']:,.2f}" if pd.notna(row.get('price')) else "Price: Not available",
            f"Status: {row['status'].upper()}",
            f"Features: {features_text}",
        ]
        
        # Add project information if available
        if project_info:
            content_parts.extend([
                f"\nProject: {project_info.get('name', 'Unknown')}",
                f"Location: {project_info.get('city', '')}, {project_info.get('state', '')}",
                f"Project Status: {project_info.get('status', 'N/A')}",
            ])
        
        page_content = '\n'.join(content_parts)
        
        # Metadata for filtering and retrieval
        metadata = {
            'source': 'properties',
            'id': str(row['id']),
            'unit_number': str(row['unit_number']),
            'property_type': str(row.get('property_type', '')),
            'bedrooms': int(row['bedrooms']) if pd.notna(row.get('bedrooms')) else 0,
            'bathrooms': int(row['bathrooms']) if pd.notna(row.get('bathrooms')) else 0,
            'price': float(row['price']) if pd.notna(row.get('price')) else 0,
            'status': str(row['status']),
            'floor': int(row.get('floor_number', 0)) if pd.notna(row.get('floor_number')) else 0,
            'carpet_area': float(row.get('carpet_area', 0)) if pd.notna(row.get('carpet_area')) else 0,
            'features': features,
            'project_id': str(row.get('project_id', ''))
        }
        
        if project_info:
            metadata.update({
                'project_name': project_info.get('name', ''),
                'city': project_info.get('city', ''),
                'state': project_info.get('state', ''),
                'project_status': project_info.get('status', '')
            })
        
        return Document(page_content=page_content, metadata=metadata)
    
    def project_to_document(self, row: pd.Series, developer_info: Dict = None) -> Document:
        """Convert a project row to a LangChain Document"""
        # Parse amenities
        amenities = self.safe_json_parse(row.get('amenities', '[]'))
        amenities_text = ', '.join(amenities) if amenities else 'No amenities listed'
        
        # Build content
        content_parts = [
            f"Project ID: {row['id']}",
            f"Project Name: {row['name']}",
            f"Location: {row['city']}, {row['state']}",
            f"Address: {row.get('address', 'N/A')}",
            f"Project Type: {row.get('project_type', 'N/A').title()}",
            f"Status: {row['status'].upper()}",
            f"Starting Price: ₹{row.get('starting_price', 0):,.2f}" if pd.notna(row.get('starting_price')) else "Starting Price: Contact for details",
            f"Total Units: {row.get('total_units', 'N/A')} | Available Units: {row.get('available_units', 'N/A')}",
            f"Total Floors: {row.get('total_floors', 'N/A')}",
            f"Total Area: {row.get('total_area_sqft', 'N/A')} sq ft",
            f"Launch Date: {row.get('launch_date', 'N/A')}",
            f"Expected Completion: {row.get('expected_completion', 'N/A')}",
            f"Amenities: {amenities_text}",
        ]
        
        # Add developer info
        if developer_info:
            content_parts.extend([
                f"\nDeveloper: {developer_info.get('company_name', 'Unknown')}",
                f"Developer Trust Score: {developer_info.get('trust_score', 'N/A')}/5",
                f"Verified Developer: {'Yes' if developer_info.get('verified') else 'No'}",
            ])
        
        page_content = '\n'.join(content_parts)
        
        metadata = {
            'source': 'projects',
            'id': str(row['id']),
            'name': str(row['name']),
            'city': str(row['city']),
            'state': str(row['state']),
            'status': str(row['status']),
            'project_type': str(row.get('project_type', '')),
            'starting_price': float(row.get('starting_price', 0)) if pd.notna(row.get('starting_price')) else 0,
            'total_units': int(row.get('total_units', 0)) if pd.notna(row.get('total_units')) else 0,
            'amenities': amenities,
            'developer_id': str(row.get('developer_id', ''))
        }
        
        if developer_info:
            metadata['developer_name'] = developer_info.get('company_name', '')
            metadata['developer_verified'] = developer_info.get('verified', False)
        
        return Document(page_content=page_content, metadata=metadata)
    
    def developer_to_document(self, row: pd.Series) -> Document:
        """Convert a developer row to a LangChain Document"""
        # Add rich keywords for better search matching
        content_parts = [
            f"🏢 REAL ESTATE DEVELOPER / BUILDER PROFILE",
            f"",
            f"Company Name: {row['company_name']}",
            f"Builder ID: {row['id']}",
            f"",
            f"This is a real estate developer/builder company that constructs residential and commercial properties.",
            f"",
            f"📋 CREDENTIALS:",
            f"RERA Registration Number: {row.get('rera_number', 'Not registered')}",
            f"Verification Status: {'✓ VERIFIED DEVELOPER' if row.get('verified') else '✗ Not Verified'}",
            f"Trust Score: {row.get('trust_score', 'N/A')}/5.0 ⭐",
            f"Established Since: {row.get('established_year', 'N/A')}",
            f"",
            f"📊 PROJECT PORTFOLIO:",
            f"Total Projects Built: {row.get('total_projects', 0)}",
            f"Successfully Completed Projects: {row.get('completed_projects', 0)}",
            f"",
            f"ℹ️ ABOUT THE BUILDER:",
            f"{row.get('description', 'No description available')}",
        ]
        
        if pd.notna(row.get('website')):
            content_parts.append(f"")
            content_parts.append(f"🌐 Website: {row['website']}")
        
        # Add searchable keywords
        content_parts.append("")
        content_parts.append(f"Keywords: builder, developer, real estate company, construction company, property developer, {row['company_name']}")
        
        page_content = '\n'.join(content_parts)
        
        metadata = {
            'source': 'developers',
            'id': str(row['id']),
            'company_name': str(row['company_name']),
            'verified': bool(row.get('verified', False)),
            'trust_score': float(row.get('trust_score', 0)) if pd.notna(row.get('trust_score')) else 0,
            'total_projects': int(row.get('total_projects', 0)) if pd.notna(row.get('total_projects')) else 0,
            'rera_number': str(row.get('rera_number', '')),
            'text': page_content  # Include full text for LLM context
        }
        
        return Document(page_content=page_content, metadata=metadata)
    
    def milestone_to_document(self, row: pd.Series) -> Document:
        """Convert a construction milestone row to a LangChain Document"""
        progress = row.get('progress_percentage', 0)
        status = row.get('status', 'N/A').upper()
        
        # Add rich context for construction tracking queries
        content_parts = [
            f"🏗️ CONSTRUCTION MILESTONE / PROGRESS TRACKING",
            f"",
            f"Project ID: {row.get('project_id', 'N/A')}",
            f"Construction Phase: {row.get('name', 'Unknown Phase')} (Phase #{row.get('phase_number', 'N/A')})",
            f"",
            f"📊 CURRENT STATUS:",
            f"Status: {status}",
            f"Progress: {progress}% Complete",
            f"",
            f"📅 TIMELINE:",
            f"Start Date: {row.get('start_date', 'N/A')}",
            f"Target Completion: {row.get('target_date', 'N/A')}",
            f"Actual Completion: {row.get('completion_date', 'Not completed yet')}",
            f"",
            f"📝 DETAILS:",
            f"{row.get('description', 'No description')}",
            f"",
            f"This milestone tracks the construction progress and phase completion status.",
        ]
        
        # Add searchable keywords for construction tracking
        content_parts.append(f"Keywords: construction tracking, construction progress, building phase, milestone, construction status, project progress, {status.lower()}")
        
        page_content = '\n'.join(content_parts)
        
        metadata = {
            'source': 'milestones',
            'id': str(row.get('id', '')),
            'project_id': str(row.get('project_id', '')),
            'phase_number': int(row.get('phase_number', 0)) if pd.notna(row.get('phase_number')) else 0,
            'status': str(row.get('status', '')),
            'progress': float(row.get('progress_percentage', 0)) if pd.notna(row.get('progress_percentage')) else 0,
            'text': page_content  # Include full text for LLM context
        }
        
        return Document(page_content=page_content, metadata=metadata)
    
    def load_all_documents(self) -> List[Document]:
        """Load all CSV files and convert to Document objects"""
        print("[INFO] Loading CSV files...")
        self.load_all_csv_files()
        
        documents = []
        
        # Create lookup dictionaries for relationships
        projects_dict = {}
        developers_dict = {}
        
        # Load developers first
        if 'developers' in self.data and not self.data['developers'].empty:
            print(f"[INFO] Processing {len(self.data['developers'])} developers...")
            for _, row in self.data['developers'].iterrows():
                developers_dict[row['id']] = row.to_dict()
                doc = self.developer_to_document(row)
                documents.append(doc)
        
        # Load projects with developer info
        if 'projects' in self.data and not self.data['projects'].empty:
            print(f"[INFO] Processing {len(self.data['projects'])} projects...")
            for _, row in self.data['projects'].iterrows():
                projects_dict[row['id']] = row.to_dict()
                developer_id = row.get('developer_id')
                developer_info = developers_dict.get(developer_id)
                doc = self.project_to_document(row, developer_info)
                documents.append(doc)
        
        # Load properties with project info
        if 'properties' in self.data and not self.data['properties'].empty:
            print(f"[INFO] Processing {len(self.data['properties'])} properties...")
            for _, row in self.data['properties'].iterrows():
                project_id = row.get('project_id')
                project_info = projects_dict.get(project_id)
                doc = self.property_to_document(row, project_info)
                documents.append(doc)
        
        # Load construction milestones
        if 'milestones' in self.data and not self.data['milestones'].empty:
            print(f"[INFO] Processing {len(self.data['milestones'])} construction milestones...")
            for _, row in self.data['milestones'].iterrows():
                doc = self.milestone_to_document(row)
                documents.append(doc)
        
        print(f"[INFO] Total documents created: {len(documents)}")
        return documents


# Example usage
if __name__ == "__main__":
    loader = RealEstateDataLoader()
    docs = loader.load_all_documents()
    
    print(f"\n[INFO] Sample document:")
    if docs:
        print(f"Source: {docs[0].metadata['source']}")
        print(f"Content preview:\n{docs[0].page_content[:500]}...")
    else:
        print("[WARNING] No documents loaded. Make sure CSV files are in the data/ directory.")
