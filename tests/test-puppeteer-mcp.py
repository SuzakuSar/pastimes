#!/usr/bin/env python3
"""
Test script for Puppeteer MCP server
Verifies that the MCP server is running and can be connected to
"""

import requests
import json
import time
import sys

def test_puppeteer_mcp():
    """Test the Puppeteer MCP server connection"""
    
    print("Testing Puppeteer MCP Server...")
    print("=" * 50)
    
    # Test server availability
    try:
        response = requests.get("http://localhost:3001/health", timeout=5)
        if response.status_code == 200:
            print("✅ Puppeteer MCP server is running on port 3001")
        else:
            print(f"❌ Puppeteer MCP server responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Puppeteer MCP server on port 3001")
        print("   Make sure the server is running with: .\\scripts\\mcp\\start-puppeteer-mcp.ps1")
        return False
    except requests.exceptions.Timeout:
        print("❌ Puppeteer MCP server connection timed out")
        return False
    
    # Test Flask app availability
    try:
        response = requests.get("http://localhost:5000", timeout=5)
        if response.status_code == 200:
            print("✅ Flask app is running on port 5000")
        else:
            print(f"❌ Flask app responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Flask app on port 5000")
        print("   Make sure the Flask app is running with: python app.py")
        return False
    
    print("\n🎉 All tests passed!")
    print("Puppeteer MCP is ready to use with Claude")
    print("\nYou can now:")
    print("- Connect to http://localhost:3001 in Claude")
    print("- Ask Claude to navigate to http://localhost:5000")
    print("- Test browser automation features")
    
    return True

def test_playwright_mcp():
    """Test the Playwright MCP server connection for comparison"""
    
    print("\nTesting Playwright MCP Server...")
    print("=" * 50)
    
    try:
        response = requests.get("http://localhost:3000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Playwright MCP server is running on port 3000")
            return True
        else:
            print(f"❌ Playwright MCP server responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Playwright MCP server on port 3000")
        print("   Make sure the server is running with: .\\scripts\\mcp\\start-playwright-mcp.ps1")
        return False

def main():
    """Main test function"""
    
    print("MCP Server Test Suite")
    print("=" * 50)
    
    # Test Puppeteer MCP
    puppeteer_ok = test_puppeteer_mcp()
    
    # Test Playwright MCP for comparison
    playwright_ok = test_playwright_mcp()
    
    print("\n" + "=" * 50)
    print("Test Summary:")
    print(f"Puppeteer MCP: {'✅ PASS' if puppeteer_ok else '❌ FAIL'}")
    print(f"Playwright MCP: {'✅ PASS' if playwright_ok else '❌ FAIL'}")
    
    if puppeteer_ok and playwright_ok:
        print("\n🎉 Both MCP servers are ready!")
        print("You can use either or both for browser automation testing.")
    elif puppeteer_ok:
        print("\n✅ Puppeteer MCP is ready to use.")
    elif playwright_ok:
        print("\n✅ Playwright MCP is ready to use.")
    else:
        print("\n❌ No MCP servers are running.")
        print("Please start at least one MCP server.")

if __name__ == "__main__":
    main() 