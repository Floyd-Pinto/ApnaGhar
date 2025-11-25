#!/usr/bin/env python3
"""
Test ApnaGhar Chatbot API
Quick command-line tester for chatbot endpoints
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    """Test chatbot health endpoint"""
    print("🏥 Testing chatbot health...")
    response = requests.get(f"{BASE_URL}/api/chatbot/health/")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print()

def test_query(query):
    """Test chatbot query endpoint"""
    print(f"💬 Querying: '{query}'")
    response = requests.post(
        f"{BASE_URL}/api/chatbot/query/",
        json={"query": query, "format": "detailed"},
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return
    
    data = response.json()
    print(f"\n🤖 Answer:")
    print("-" * 80)
    print(data.get('answer', 'No answer'))
    print("-" * 80)
    
    if 'count' in data:
        print(f"\n📊 Found {data['count']} relevant results")
    
    if 'results' in data and data['results']:
        print("\n🏘️  Top Results:")
        for i, result in enumerate(data['results'][:3], 1):
            print(f"\n{i}. {result.get('name', 'Unknown')}")
            if 'location' in result:
                print(f"   📍 {result['location']}")
            if 'price' in result and result['price']:
                print(f"   💰 ₹{result['price']:,.0f}")
            if 'bedrooms' in result and result['bedrooms']:
                print(f"   🛏️  {result['bedrooms']} BHK")
    
    print()

def test_search_properties():
    """Test structured property search"""
    print("🔍 Testing structured property search...")
    response = requests.post(
        f"{BASE_URL}/api/chatbot/search-properties/",
        json={
            "bedrooms": 3,
            "city": "Mumbai",
            "max_price": 10000000,
            "status": "available"
        },
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    data = response.json()
    
    if 'answer' in data:
        print(f"\n🤖 Answer:")
        print(data['answer'][:300] + "...")
    
    print()

def main():
    print("="*80)
    print("ApnaGhar AI Chatbot - API Test Suite")
    print("="*80)
    print()
    
    # Test 1: Health check
    try:
        test_health()
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        print("Make sure Django backend is running: python manage.py runserver")
        sys.exit(1)
    
    # Test 2: Sample queries
    queries = [
        "Tell me about ApnaGhar platform",
        "Show me 3BHK properties under 1 crore",
        "What are the construction tracking features?",
        "How does blockchain security work?",
        "What payment options are available?",
    ]
    
    for query in queries:
        try:
            test_query(query)
            input("Press Enter to continue...")
        except Exception as e:
            print(f"❌ Query failed: {e}")
    
    # Test 3: Structured search
    try:
        test_search_properties()
    except Exception as e:
        print(f"❌ Search failed: {e}")
    
    print("="*80)
    print("✅ Test suite completed!")
    print("="*80)

if __name__ == "__main__":
    main()
