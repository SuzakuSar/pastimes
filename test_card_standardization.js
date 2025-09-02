const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Step 1: Navigating to test home page...');
    await page.goto('http://localhost:5000/test-home', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take detailed screenshot of home page
    await page.screenshot({ 
      path: 'test_home_full_page.png',
      fullPage: true
    });
    
    console.log('Step 2: Full page screenshot saved');
    
    // Look for game links or clickable elements
    console.log('Step 3: Looking for clickable game elements...');
    
    const gameLinks = await page.$$('a');
    console.log('Found', gameLinks.length, 'total links');
    
    let gameClicked = false;
    
    // Try to find game-related links
    for (let i = 0; i < gameLinks.length; i++) {
      const link = gameLinks[i];
      const href = await page.evaluate(el => el.href, link);
      const text = await page.evaluate(el => el.textContent.trim(), link);
      
      console.log(`Link ${i}: href="${href}", text="${text}"`);
      
      if (href && (href.includes('game') || href.includes('cosmic') || href.includes('space') || href.includes('dino'))) {
        console.log('Found game link! Clicking:', href);
        await link.click();
        
        // Wait for navigation
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
          gameClicked = true;
          break;
        } catch (navError) {
          console.log('Navigation timeout, continuing...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          break;
        }
      }
    }
    
    if (!gameClicked) {
      console.log('No direct game links found, trying card elements...');
      // Try clicking on cards or divs that might be clickable
      const cardElements = await page.$$('[class*="card"], [class*="game"], .featured-game, .game-item');
      
      if (cardElements.length > 0) {
        console.log('Found', cardElements.length, 'card-like elements, clicking first one...');
        await cardElements[0].click();
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('Step 4: Current URL after click attempts:', page.url());
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'after_click_attempt.png',
      fullPage: false
    });
    
    // If we're on a game page, take a screenshot focusing on sidebar
    if (page.url().includes('game') || page.url() !== 'http://localhost:5000/test-home') {
      console.log('Step 5: On game page, taking sidebar screenshot...');
      
      // Wait for game page to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await page.screenshot({ 
        path: 'game_player_page_full.png',
        fullPage: true
      });
      
      console.log('Game player page screenshot saved');
    } else {
      console.log('Still on test home page, navigation may not have worked');
    }
    
    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
})();