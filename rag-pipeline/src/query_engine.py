"""
Real Estate Query Engine for ApnaGhar
Specialized queries for property search
"""
import re
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import sys
sys.path.append(str(Path(__file__).parent.parent))
from config import PRICE_UNITS, SEARCH_INTENTS, TOP_K_RESULTS
from src.search import RAGSearch


class RealEstateRAG:
    """High-level interface for real estate queries"""
    
    def __init__(self):
        self.rag_search = RAGSearch()
    
    def parse_price_range(self, query: str) -> Optional[Dict]:
        """
        Extract price range from query
        Examples:
        - "under 50 lakhs" -> {'$lt': 5000000}
        - "between 80 lakhs and 1 crore" -> {'$gte': 8000000, '$lte': 10000000}
        - "above 2 crore" -> {'$gt': 20000000}
        """
        query_lower = query.lower()
        
        # Pattern: "under/below X"
        under_match = re.search(r'(?:under|below|less than)\s+(\d+(?:\.\d+)?)\s*(lakh|lakhs|crore|crores)', query_lower)
        if under_match:
            value = float(under_match.group(1))
            unit = under_match.group(2)
            price = value * PRICE_UNITS.get(unit, 1)
            return {'$lt': price}
        
        # Pattern: "above/over X"
        above_match = re.search(r'(?:above|over|more than)\s+(\d+(?:\.\d+)?)\s*(lakh|lakhs|crore|crores)', query_lower)
        if above_match:
            value = float(above_match.group(1))
            unit = above_match.group(2)
            price = value * PRICE_UNITS.get(unit, 1)
            return {'$gt': price}
        
        # Pattern: "between X and Y"
        between_match = re.search(
            r'between\s+(\d+(?:\.\d+)?)\s*(lakh|lakhs|crore|crores)\s+and\s+(\d+(?:\.\d+)?)\s*(lakh|lakhs|crore|crores)',
            query_lower
        )
        if between_match:
            min_val = float(between_match.group(1))
            min_unit = between_match.group(2)
            max_val = float(between_match.group(3))
            max_unit = between_match.group(4)
            
            min_price = min_val * PRICE_UNITS.get(min_unit, 1)
            max_price = max_val * PRICE_UNITS.get(max_unit, 1)
            
            return {'$gte': min_price, '$lte': max_price}
        
        return None
    
    def parse_bhk_type(self, query: str) -> Optional[int]:
        """
        Extract BHK type from query
        Examples: "3BHK", "2 BHK", "1bhk" -> 3, 2, 1
        """
        bhk_match = re.search(r'(\d+)\s*bhk', query.lower())
        if bhk_match:
            return int(bhk_match.group(1))
        return None
    
    def parse_location(self, query: str) -> List[str]:
        """Extract location mentions from query"""
        locations = []
        
        # Common cities
        cities = ['bangalore', 'mumbai', 'delhi', 'pune', 'hyderabad', 'chennai', 'kolkata']
        query_lower = query.lower()
        
        for city in cities:
            if city in query_lower:
                locations.append(city.title())
        
        # Areas (you can expand this list)
        areas = ['whitefield', 'koramangala', 'indiranagar', 'electronic city', 
                 'hinjewadi', 'powai', 'andheri', 'gurgaon', 'dwarka']
        
        for area in areas:
            if area in query_lower:
                locations.append(area.title())
        
        return locations
    
    def build_filters(self, query: str) -> Dict:
        """Build metadata filters from query"""
        filters = {}
        
        # Price filter
        price_range = self.parse_price_range(query)
        if price_range:
            filters['price'] = price_range
        
        # BHK filter
        bhk = self.parse_bhk_type(query)
        if bhk:
            filters['bedrooms'] = bhk
        
        # Location filter (city)
        locations = self.parse_location(query)
        if locations:
            # Use first location mentioned
            filters['city'] = locations[0]
        
        # Status filter
        if 'available' in query.lower():
            filters['status'] = 'available'
        elif 'sold' in query.lower():
            filters['status'] = 'sold'
        
        return filters
    
    def query(
        self, 
        query: str,
        top_k: int = TOP_K_RESULTS,
        apply_filters: bool = True
    ) -> Dict[str, Any]:
        """
        Main query method with automatic filter extraction
        
        Args:
            query: Natural language query
            top_k: Number of results
            apply_filters: Whether to auto-extract and apply filters
        
        Returns:
            Search results with answer
        """
        filters = None
        if apply_filters:
            filters = self.build_filters(query)
            if filters:
                print(f"[INFO] Auto-detected filters: {filters}")
        
        return self.rag_search.search(query, top_k=top_k, filters=filters)
    
    def search_properties(
        self,
        bedrooms: Optional[int] = None,
        city: Optional[str] = None,
        max_price: Optional[float] = None,
        min_price: Optional[float] = None,
        status: str = 'available',
        top_k: int = 10
    ) -> Dict[str, Any]:
        """
        Structured property search
        
        Args:
            bedrooms: Number of bedrooms (e.g., 2, 3, 4)
            city: City name (e.g., 'Bangalore', 'Mumbai')
            max_price: Maximum price in rupees
            min_price: Minimum price in rupees
            status: Property status ('available', 'sold', 'booked')
            top_k: Number of results
        """
        # Build filters
        filters = {'status': status}
        
        if bedrooms:
            filters['bedrooms'] = bedrooms
        
        if city:
            filters['city'] = city
        
        if max_price or min_price:
            price_filter = {}
            if max_price:
                price_filter['$lte'] = max_price
            if min_price:
                price_filter['$gte'] = min_price
            filters['price'] = price_filter
        
        # Build query text
        query_parts = [f"{bedrooms}BHK" if bedrooms else "Property"]
        if city:
            query_parts.append(f"in {city}")
        if max_price:
            query_parts.append(f"under ₹{max_price:,.0f}")
        
        query = " ".join(query_parts)
        
        return self.rag_search.search(query, top_k=top_k, filters=filters)
    
    def search_by_amenities(
        self,
        amenities: List[str],
        city: Optional[str] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Search properties/projects by amenities
        
        Args:
            amenities: List of amenities (e.g., ['swimming pool', 'gym', 'clubhouse'])
            city: Optional city filter
            top_k: Number of results
        """
        amenities_str = ", ".join(amenities)
        query = f"Properties or projects with {amenities_str}"
        
        if city:
            query += f" in {city}"
        
        filters = {}
        if city:
            filters['city'] = city
        
        return self.rag_search.search(query, top_k=top_k, filters=filters)
    
    def compare_properties(
        self,
        property_ids: List[str] = None,
        query: str = None
    ) -> Dict[str, Any]:
        """Compare multiple properties"""
        if query:
            return self.rag_search.search(query, top_k=10)
        
        # If property IDs provided, build comparison query
        if property_ids:
            query = f"Compare properties: {', '.join(property_ids)}"
            return self.rag_search.search(query, top_k=len(property_ids) * 2)
        
        return {'error': 'Provide either query or property_ids'}
    
    def get_developer_info(self, developer_name: str) -> Dict[str, Any]:
        """Get information about a specific developer"""
        query = f"Tell me about {developer_name} developer"
        return self.rag_search.search(query, top_k=5)
    
    def get_project_info(self, project_name: str) -> Dict[str, Any]:
        """Get information about a specific project"""
        query = f"Tell me about {project_name} project"
        return self.rag_search.search(query, top_k=5)
    
    def search_and_format(
        self, 
        query: str,
        format_type: str = 'detailed'
    ) -> Dict[str, Any]:
        """
        Search and format results for API response
        
        Args:
            query: Search query
            format_type: 'detailed' or 'brief'
        
        Returns:
            Formatted response for frontend
        """
        result = self.query(query)
        
        if format_type == 'brief':
            # Brief format for quick display
            return {
                'query': result['query'],
                'answer': result['answer'],
                'count': len(result['results'])
            }
        else:
            # Detailed format with metadata
            formatted_results = []
            for r in result['results'][:5]:  # Top 5
                meta = r['metadata']
                formatted_results.append({
                    'source': meta.get('source'),
                    'id': meta.get('id'),
                    'name': meta.get('name', meta.get('unit_number', 'Unknown')),
                    'location': f"{meta.get('city', '')}, {meta.get('state', '')}",
                    'price': meta.get('price'),
                    'bedrooms': meta.get('bedrooms'),
                    'status': meta.get('status'),
                    'similarity': r['similarity_score'],
                    'preview': meta.get('text', '')[:200]
                })
            
            return {
                'query': result['query'],
                'answer': result['answer'],
                'count': len(result['results']),
                'results': formatted_results
            }


# Example usage
if __name__ == "__main__":
    rag = RealEstateRAG()
    
    print("\n" + "="*80)
    print("REAL ESTATE QUERY ENGINE - EXAMPLES")
    print("="*80)
    
    # Example 1: Natural language query
    print("\n[Example 1] Natural language query")
    result1 = rag.query("Show me 3BHK apartments in Bangalore under 1 crore")
    print(f"Answer: {result1['answer'][:500]}...")
    
    # Example 2: Structured search
    print("\n[Example 2] Structured search")
    result2 = rag.search_properties(
        bedrooms=2,
        city='Mumbai',
        max_price=8000000,
        status='available'
    )
    print(f"Found {len(result2['results'])} properties")
    
    # Example 3: Amenity-based search
    print("\n[Example 3] Amenity search")
    result3 = rag.search_by_amenities(
        amenities=['Swimming Pool', 'Gym', 'Clubhouse'],
        city='Bangalore'
    )
    print(f"Answer: {result3['answer'][:500]}...")
    
    # Example 4: Developer info
    print("\n[Example 4] Developer information")
    result4 = rag.get_developer_info('Prestige Estates')
    print(f"Answer: {result4['answer'][:500]}...")
    
    print("\n" + "="*80)
