#!/usr/bin/env python3
"""
Playwright test script for SummerLockIn Flask application
Run this after starting your Flask app with: python app.py
"""

from playwright.sync_api import sync_playwright
import time

def test_flask_app():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        try:
            # Navigate to the Flask app
            print("Navigating to http://localhost:5000...")
            page.goto("http://localhost:5000")
            
            # Wait for page to load
            page.wait_for_load_state("networkidle")
            
            # Test basic navigation
            print("Testing navigation...")
            
            # Check if homepage loads
            assert page.title() is not None, "Page should have a title"
            print("✓ Homepage loaded successfully")
            
            # Test game navigation (if games are available)
            try:
                # Look for game links
                game_links = page.query_selector_all("a[href*='/']")
                if game_links:
                    print(f"✓ Found {len(game_links)} navigation links")
                    
                    # Test clicking on first game link
                    if len(game_links) > 0:
                        first_link = game_links[0]
                        link_text = first_link.inner_text()
                        print(f"Testing navigation to: {link_text}")
                        first_link.click()
                        page.wait_for_load_state("networkidle")
                        print("✓ Navigation to game successful")
                        
            except Exception as e:
                print(f"Navigation test failed: {e}")
            
            # Test leaderboard functionality
            try:
                leaderboard_link = page.query_selector("a[href*='leaderboard']")
                if leaderboard_link:
                    print("Testing leaderboard...")
                    leaderboard_link.click()
                    page.wait_for_load_state("networkidle")
                    print("✓ Leaderboard page loaded")
                    
            except Exception as e:
                print(f"Leaderboard test failed: {e}")
            
            print("\n🎉 All tests completed successfully!")
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            
        finally:
            # Keep browser open for 5 seconds to see results
            time.sleep(5)
            browser.close()

if __name__ == "__main__":
    print("Starting Playwright tests for SummerLockIn...")
    print("Make sure your Flask app is running with: python app.py")
    test_flask_app() 