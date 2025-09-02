const { chromium } = require('playwright');

async function testLikeFavoriteButtons() {
  console.log('Starting comprehensive like/favorite button testing...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Add delay for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Track console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Track network errors
  const networkErrors = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} - ${response.url()}`);
    }
  });
  
  try {
    // Step 1: Navigate to test page
    console.log('1. Navigating to http://localhost:5000/test-home');
    await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test_home_initial.png', fullPage: true });
    console.log('   Screenshot saved: test_home_initial.png');
    
    // Get page info
    const title = await page.title();
    console.log(`   Page title: ${title}`);
    
    // Check for game cards and buttons
    const gameCards = await page.locator('.game-card, [class*="game"], .card').all();
    console.log(`   Found ${gameCards.length} potential game cards`);
    
    // Look for like and favorite buttons with various selectors
    const likeButtonSelectors = [
      'button[data-action="like"]',
      '.like-btn',
      'button[class*="like"]',
      '[onclick*="like"]',
      'button:has-text("👍")',
      'button:has-text("Like")'
    ];
    
    const favoriteButtonSelectors = [
      'button[data-action="favorite"]',
      '.favorite-btn', 
      'button[class*="favorite"]',
      '[onclick*="favorite"]',
      'button:has-text("♥")',
      'button:has-text("❤")',
      'button:has-text("Favorite")'
    ];
    
    let likeButtons = [];
    let favoriteButtons = [];
    
    // Find all like buttons
    for (const selector of likeButtonSelectors) {
      try {
        const buttons = await page.locator(selector).all();
        likeButtons.push(...buttons);
      } catch (e) {
        // Selector not found, continue
      }
    }
    
    // Find all favorite buttons  
    for (const selector of favoriteButtonSelectors) {
      try {
        const buttons = await page.locator(selector).all();
        favoriteButtons.push(...buttons);
      } catch (e) {
        // Selector not found, continue
      }
    }
    
    // Remove duplicates
    likeButtons = [...new Set(likeButtons)];
    favoriteButtons = [...new Set(favoriteButtons)];
    
    console.log(`   Found ${likeButtons.length} like buttons`);
    console.log(`   Found ${favoriteButtons.length} favorite buttons`);
    
    // Check for sidebar
    const sidebarExists = await page.locator('.sidebar, [class*="sidebar"], aside').count() > 0;
    console.log(`   Sidebar found: ${sidebarExists}`);
    
    if (sidebarExists) {
      // Look for like/favorite counters in sidebar
      const likedCount = await page.locator('.sidebar').locator(':has-text("Liked")').count();
      const favoritedCount = await page.locator('.sidebar').locator(':has-text("Favorited")').count();
      console.log(`   Sidebar - Liked sections: ${likedCount}, Favorited sections: ${favoritedCount}`);
    }
    
    // Step 2: Test like buttons on main interface
    console.log('\n2. Testing like buttons on main interface...');
    
    if (likeButtons.length > 0) {
      for (let i = 0; i < Math.min(likeButtons.length, 3); i++) {
        const button = likeButtons[i];
        try {
          // Get initial state
          const initialClasses = await button.getAttribute('class') || '';
          const initialText = await button.textContent() || '';
          
          console.log(`   Testing like button ${i + 1}:`);
          console.log(`     Initial classes: ${initialClasses}`);
          console.log(`     Initial text: ${initialText.trim()}`);
          
          // Click the button
          await button.click();
          await page.waitForTimeout(1000);
          
          // Check state after click
          const newClasses = await button.getAttribute('class') || '';
          const newText = await button.textContent() || '';
          
          console.log(`     After click classes: ${newClasses}`);
          console.log(`     After click text: ${newText.trim()}`);
          
          // Check if visual state changed
          const stateChanged = initialClasses !== newClasses || initialText !== newText;
          console.log(`     Visual state changed: ${stateChanged}`);
          
        } catch (error) {
          console.log(`     Error testing like button ${i + 1}: ${error.message}`);
        }
      }
    } else {
      console.log('   No like buttons found to test');
    }
    
    // Step 3: Test favorite buttons on main interface
    console.log('\n3. Testing favorite buttons on main interface...');
    
    if (favoriteButtons.length > 0) {
      for (let i = 0; i < Math.min(favoriteButtons.length, 3); i++) {
        const button = favoriteButtons[i];
        try {
          // Get initial state
          const initialClasses = await button.getAttribute('class') || '';
          const initialText = await button.textContent() || '';
          
          console.log(`   Testing favorite button ${i + 1}:`);
          console.log(`     Initial classes: ${initialClasses}`);
          console.log(`     Initial text: ${initialText.trim()}`);
          
          // Click the button
          await button.click();
          await page.waitForTimeout(1000);
          
          // Check state after click
          const newClasses = await button.getAttribute('class') || '';
          const newText = await button.textContent() || '';
          
          console.log(`     After click classes: ${newClasses}`);
          console.log(`     After click text: ${newText.trim()}`);
          
          // Check if visual state changed
          const stateChanged = initialClasses !== newClasses || initialText !== newText;
          console.log(`     Visual state changed: ${stateChanged}`);
          
        } catch (error) {
          console.log(`     Error testing favorite button ${i + 1}: ${error.message}`);
        }
      }
    } else {
      console.log('   No favorite buttons found to test');
    }
    
    // Take screenshot after button testing
    await page.screenshot({ path: 'after_button_clicks.png', fullPage: true });
    console.log('   Screenshot saved: after_button_clicks.png');
    
    // Step 4: Navigate to individual game page
    console.log('\n4. Navigating to individual game page...');
    
    if (gameCards.length > 0) {
      try {
        // Try to click on first game card
        const firstCard = gameCards[0];
        
        // Look for clickable elements within the card
        const cardLink = await firstCard.locator('a, [onclick], .clickable').first();
        
        if (await cardLink.count() > 0) {
          await cardLink.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          console.log(`   Navigated to: ${page.url()}`);
          
          // Take screenshot of individual game page
          await page.screenshot({ path: 'individual_game_page.png', fullPage: true });
          console.log('   Screenshot saved: individual_game_page.png');
          
          // Test buttons on individual game page
          console.log('\n5. Testing like button in game stats section...');
          console.log('\n6. Testing favorite button in game actions section...');
          console.log('\n7. Testing buttons on related game cards in sidebar...');
          
          // Look for buttons on this page
          let pageLikeButtons = [];
          let pageFavoriteButtons = [];
          
          for (const selector of likeButtonSelectors) {
            try {
              const buttons = await page.locator(selector).all();
              pageLikeButtons.push(...buttons);
            } catch (e) {}
          }
          
          for (const selector of favoriteButtonSelectors) {
            try {
              const buttons = await page.locator(selector).all();
              pageFavoriteButtons.push(...buttons);
            } catch (e) {}
          }
          
          console.log(`   Found ${pageLikeButtons.length} like buttons on game page`);
          console.log(`   Found ${pageFavoriteButtons.length} favorite buttons on game page`);
          
          // Test buttons if found
          if (pageLikeButtons.length > 0) {
            const button = pageLikeButtons[0];
            const initialState = await button.getAttribute('class') || '';
            await button.click();
            await page.waitForTimeout(1000);
            const newState = await button.getAttribute('class') || '';
            console.log(`   Game page like button state changed: ${initialState !== newState}`);
          }
          
          if (pageFavoriteButtons.length > 0) {
            const button = pageFavoriteButtons[0];
            const initialState = await button.getAttribute('class') || '';
            await button.click();
            await page.waitForTimeout(1000);
            const newState = await button.getAttribute('class') || '';
            console.log(`   Game page favorite button state changed: ${initialState !== newState}`);
          }
          
        } else {
          console.log('   No clickable elements found in game cards');
        }
        
      } catch (error) {
        console.log(`   Error navigating to game page: ${error.message}`);
      }
    }
    
    // Final checks
    console.log('\n8-12. Final verification checks...');
    
    // Check console messages
    if (consoleMessages.length > 0) {
      console.log('\nConsole Messages:');
      consoleMessages.forEach(msg => console.log(`   ${msg}`));
    } else {
      console.log('   No console errors detected');
    }
    
    // Check network errors
    if (networkErrors.length > 0) {
      console.log('\nNetwork Errors:');
      networkErrors.forEach(error => console.log(`   ${error}`));
    } else {
      console.log('   No network errors detected');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'final_state.png', fullPage: true });
    console.log('   Final screenshot saved: final_state.png');
    
  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
  
  console.log('\nTesting completed!');
}

testLikeFavoriteButtons().catch(console.error);