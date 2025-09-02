const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Testing card details on test home page...');
    await page.goto('http://localhost:5000/test-home', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for like buttons, favorite buttons, and plays count
    const likeButtons = await page.$$('.like-btn, [class*="like"], .btn-like, button[data-action="like"]');
    const favoriteButtons = await page.$$('.favorite-btn, [class*="favorite"], .btn-favorite, button[data-action="favorite"]');
    const playsCount = await page.$$('[class*="plays"], .plays-count, .play-count');
    
    console.log('Test Home Page Analysis:');
    console.log('Like buttons found:', likeButtons.length);
    console.log('Favorite buttons found:', favoriteButtons.length);
    console.log('Plays count elements found:', playsCount.length);
    
    // Check card structure
    const allCards = await page.$$('.card, [class*="card"], .game-card, [class*="game"]');
    console.log('Total card elements found:', allCards.length);
    
    // Take focused screenshot of first few cards
    await page.evaluate(() => {
      const firstCard = document.querySelector('.card, [class*="card"], .game-card, [class*="game"]');
      if (firstCard) {
        firstCard.scrollIntoView();
      }
    });
    
    await page.screenshot({ 
      path: 'test_home_card_details.png',
      clip: { x: 200, y: 100, width: 1000, height: 400 }
    });
    
    // Navigate to game page
    console.log('\\nNavigating to game page...');
    await page.goto('http://localhost:5000/test-home/game/space-invaders', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check game page sidebar cards
    const gamePageLikeButtons = await page.$$('.like-btn, [class*="like"], .btn-like, button[data-action="like"]');
    const gamePageFavoriteButtons = await page.$$('.favorite-btn, [class*="favorite"], .btn-favorite, button[data-action="favorite"]');
    const gamePagePlaysCount = await page.$$('[class*="plays"], .plays-count, .play-count');
    
    console.log('\\nGame Page Sidebar Analysis:');
    console.log('Like buttons found:', gamePageLikeButtons.length);
    console.log('Favorite buttons found:', gamePageFavoriteButtons.length);
    console.log('Plays count elements found:', gamePagePlaysCount.length);
    
    // Take focused screenshot of sidebar
    await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar, [class*="sidebar"], .related-games, [class*="related"]');
      if (sidebar) {
        sidebar.scrollIntoView();
      }
    });
    
    await page.screenshot({ 
      path: 'game_page_sidebar_details.png',
      clip: { x: 800, y: 100, width: 400, height: 600 }
    });
    
    // Check if there are any hidden elements or CSS issues
    const hiddenElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const hidden = elements.filter(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
      }).map(el => el.className || el.tagName);
      return hidden.slice(0, 20); // Limit output
    });
    
    console.log('\\nHidden elements (first 20):', hiddenElements);
    
    console.log('\\nDetailed card inspection completed');
    
  } catch (error) {
    console.error('Error during detailed inspection:', error);
  } finally {
    await browser.close();
  }
})();