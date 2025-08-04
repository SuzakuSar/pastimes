#!/usr/bin/env python3
"""
Simple debug script for Claude agent JSON parsing issue
This script will help identify what's causing the "no JSON object found in response" error
"""

import urllib.request
import urllib.error
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
        
        # Create request
        req = urllib.request.Request(f"{base_url}/dev/generate-admin-key")
        req.add_header('User-Agent', 'Claude-Agent-Debug/1.0')
        
        # Make request
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            content_type = response.headers.get('content-type', 'Not set')
            response_text = response.read().decode('utf-8')
            
            print(f"   Status Code: {status_code}")
            print(f"   Content-Type: {content_type}")
            print(f"   Response Length: {len(response_text)} characters")
            
            # Try to parse as JSON
            try:
                json_data = json.loads(response_text)
                print("   ✅ JSON parsing successful!")
                print(f"   JSON Keys: {list(json_data.keys())}")
                if 'admin_key' in json_data:
                    print(f"   Admin Key: {json_data['admin_key'][:20]}...")
                if 'admin_url' in json_data:
                    print(f"   Admin URL: {json_data['admin_url']}")
            except json.JSONDecodeError as e:
                print(f"   ❌ JSON parsing failed: {e}")
                print(f"   Response preview: {response_text[:200]}...")
                
            # Check if response is HTML instead of JSON
            if response_text.strip().startswith('<!DOCTYPE html>') or response_text.strip().startswith('<html'):
                print("   ⚠️  Response appears to be HTML instead of JSON!")
                print("   This could be causing the Claude agent issue.")
                
    except urllib.error.URLError as e:
        if "Connection refused" in str(e):
            print("   ❌ Could not connect to server. Is Flask running?")
            print("   Run: python app.py")
        else:
            print(f"   ❌ Connection error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    print("\n" + "=" * 50)
    return True

def test_claude_agent_endpoint():
    """Test the new Claude agent endpoint"""
    base_url = "http://127.0.0.1:5000"
    
    try:
        print("2. Testing /api/claude-agent endpoint...")
        
        # Create request
        req = urllib.request.Request(f"{base_url}/api/claude-agent")
        req.add_header('User-Agent', 'Claude-Agent-Debug/1.0')
        
        # Make request
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            content_type = response.headers.get('content-type', 'Not set')
            response_text = response.read().decode('utf-8')
            
            print(f"   Status Code: {status_code}")
            print(f"   Content-Type: {content_type}")
            print(f"   Response Length: {len(response_text)} characters")
            
            # Try to parse as JSON
            try:
                json_data = json.loads(response_text)
                print("   ✅ JSON parsing successful!")
                print(f"   Success: {json_data.get('success', 'Not found')}")
                if 'agent_config' in json_data:
                    print(f"   Agent Name: {json_data['agent_config'].get('name', 'Not found')}")
                if 'session_key' in json_data:
                    print(f"   Session Key: {json_data['session_key'][:20]}...")
            except json.JSONDecodeError as e:
                print(f"   ❌ JSON parsing failed: {e}")
                print(f"   Response preview: {response_text[:200]}...")
                
    except urllib.error.URLError as e:
        if "Connection refused" in str(e):
            print("   ❌ Could not connect to server. Is Flask running?")
        else:
            print(f"   ❌ Connection error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    print("\n" + "=" * 50)
    return True

def provide_solutions():
    """Provide solutions for the JSON parsing issue"""
    print("3. Solutions to try:")
    print("=" * 50)
    
    print("🔧 Solution 1: Check Flask server")
    print("   - Make sure Flask is running: python app.py")
    print("   - Check for any error messages in the Flask console")
    
    print("\n🔧 Solution 2: Use the new Claude agent endpoint")
    print("   - Try using /api/claude-agent instead of /dev/generate-admin-key")
    print("   - This endpoint is specifically designed for Claude agent creation")
    
    print("\n🔧 Solution 3: Test endpoints manually")
    print("   - Open browser to: http://127.0.0.1:5000/dev/generate-admin-key")
    print("   - Open browser to: http://127.0.0.1:5000/api/claude-agent")
    print("   - You should see JSON, not HTML")
    
    print("\n🔧 Solution 4: Check for authentication issues")
    print("   - The endpoints might require authentication")
    print("   - Try accessing with proper session cookies")
    
    print("\n🔧 Solution 5: Alternative approach")
    print("   - Create a simpler endpoint for Claude agent creation")
    print("   - Ensure it always returns valid JSON")

def main():
    """Main debug function"""
    print("🚀 Claude Agent JSON Debug Tool")
    print("=" * 50)
    
    # Test the endpoints
    if test_admin_key_endpoint():
        test_claude_agent_endpoint()
        provide_solutions()
    else:
        print("\n❌ Cannot proceed without a running Flask server")
        print("Please start the Flask app first: python app.py")

if __name__ == "__main__":
    main() 