#!/usr/bin/env python3
"""
Debug script for Claude agent JSON parsing issue
This script will help identify what's causing the "no JSON object found in response" error
"""

import requests
import json
import sys

def test_admin_key_endpoint():
    """Test the admin key generation endpoint to see what it returns"""
    base_url = "http://127.0.0.1:5000"
    
    print("🔍 Testing Claude agent JSON response issue...")
    print("=" * 50)
    
    try:
        # Test the admin key endpoint
        print("1. Testing /dev/generate-admin-key endpoint...")
        response = requests.get(f"{base_url}/dev/generate-admin-key")
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('content-type', 'Not set')}")
        print(f"   Response Length: {len(response.text)} characters")
        
        # Try to parse as JSON
        try:
            json_data = response.json()
            print("   ✅ JSON parsing successful!")
            print(f"   JSON Keys: {list(json_data.keys())}")
            print(f"   Admin Key: {json_data.get('admin_key', 'Not found')[:20]}...")
            print(f"   Admin URL: {json_data.get('admin_url', 'Not found')}")
        except json.JSONDecodeError as e:
            print(f"   ❌ JSON parsing failed: {e}")
            print(f"   Response preview: {response.text[:200]}...")
            
        # Check if response is HTML instead of JSON
        if response.text.strip().startswith('<!DOCTYPE html>') or response.text.strip().startswith('<html'):
            print("   ⚠️  Response appears to be HTML instead of JSON!")
            print("   This could be causing the Claude agent issue.")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Could not connect to server. Is Flask running?")
        print("   Run: python app.py")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    print("\n" + "=" * 50)
    return True

def test_claude_agent_creation():
    """Simulate what Claude might be doing when creating an agent"""
    print("2. Simulating Claude agent creation process...")
    
    # This is what Claude might be trying to do
    print("   Claude would typically:")
    print("   - Call an API endpoint")
    print("   - Expect JSON response")
    print("   - Parse the response as JSON")
    print("   - Use the data to configure the agent")
    
    print("\n   If you're getting 'no JSON object found in response', it means:")
    print("   - The endpoint is returning HTML instead of JSON")
    print("   - The endpoint is returning an error page")
    print("   - The endpoint is not responding correctly")
    print("   - There's a server error")

def provide_solutions():
    """Provide solutions for the JSON parsing issue"""
    print("\n3. Solutions to try:")
    print("=" * 50)
    
    print("🔧 Solution 1: Check Flask server")
    print("   - Make sure Flask is running: python app.py")
    print("   - Check for any error messages in the Flask console")
    
    print("\n🔧 Solution 2: Test the endpoint manually")
    print("   - Open browser to: http://127.0.0.1:5000/dev/generate-admin-key")
    print("   - You should see JSON, not HTML")
    
    print("\n🔧 Solution 3: Check for authentication issues")
    print("   - The endpoint might require authentication")
    print("   - Try accessing with proper session cookies")
    
    print("\n🔧 Solution 4: Debug the endpoint")
    print("   - Add error handling to the endpoint")
    print("   - Ensure it always returns JSON")
    
    print("\n🔧 Solution 5: Alternative approach")
    print("   - Create a simpler endpoint for Claude agent creation")
    print("   - Ensure it always returns valid JSON")

def main():
    """Main debug function"""
    print("🚀 Claude Agent JSON Debug Tool")
    print("=" * 50)
    
    # Test the endpoint
    if test_admin_key_endpoint():
        test_claude_agent_creation()
        provide_solutions()
    else:
        print("\n❌ Cannot proceed without a running Flask server")
        print("Please start the Flask app first: python app.py")

if __name__ == "__main__":
    main() 