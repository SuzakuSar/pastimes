const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Testing card interactions and overlay visibility...');
    await page.goto('http://localhost:5000/test-home', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Hover over the first game card to reveal overlay
    console.log('Hovering over first game card...');
    const firstCard = await page.$('.game-card');
    if (firstCard) {
      await firstCard.hover();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Take screenshot with overlay visible
      await page.screenshot({ 
        path: 'test_home_card_hovered.png',
        clip: { x: 200, y: 150, width: 800, height: 300 }
      });
      
      console.log('Hovered screenshot saved');
    }
    
    // Take a screenshot of the featured games section specifically
    await page.evaluate(() => {
      const featuredSection = document.querySelector('.category-games-container');
      if (featuredSection) {
        featuredSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ 
      path: 'test_home_featured_section.png',
      clip: { x: 200, y: 100, width: 1000, height: 400 }
    });
    
    // Check if cards show overlay on hover by inspecting computed styles
    const overlayAnalysis = await page.evaluate(() => {
      const cards = document.querySelectorAll('.game-card');
      const results = [];
      
      cards.forEach((card, index) => {
        if (index < 3) {
          const overlay = card.querySelector('.card-overlay');
          const likeBtn = card.querySelector('.like-btn, [class*="like"]');
          const favoriteBtn = card.querySelector('.favorite-btn, [class*="favorite"], .heart');
          const playsCount = card.querySelector('[class*="plays"], .plays-count');
          
          if (overlay) {
            const overlayStyles = window.getComputedStyle(overlay);
            results.push({
              cardIndex: index,
              overlayDisplay: overlayStyles.display,
              overlayOpacity: overlayStyles.opacity,
              overlayPosition: overlayStyles.position,
              overlayBottom: overlayStyles.bottom,
              overlayLeft: overlayStyles.left,
              hasLike: !!likeBtn,
              hasFavorite: !!favoriteBtn,
              hasPlays: !!playsCount,
              likeText: likeBtn ? likeBtn.textContent.trim() : null,
              favoriteText: favoriteBtn ? favoriteBtn.textContent.trim() : null,
              playsText: playsCount ? playsCount.textContent.trim() : null
            });
          }
        }
      });
      
      return results;
    });
    
    console.log('\\nOVERLAY ANALYSIS:');
    overlayAnalysis.forEach((result, index) => {
      console.log(`\\nCard ${index + 1} Overlay:`);
      console.log(`  Display: ${result.overlayDisplay}, Opacity: ${result.overlayOpacity}`);
      console.log(`  Position: ${result.overlayPosition}, Bottom: ${result.overlayBottom}, Left: ${result.overlayLeft}`);
      console.log(`  Has Like: ${result.hasLike}, Has Favorite: ${result.hasFavorite}, Has Plays: ${result.hasPlays}`);
      console.log(`  Like Text: "${result.likeText}"`);
      console.log(`  Favorite Text: "${result.favoriteText}"`);
      console.log(`  Plays Text: "${result.playsText}"`);
    });
    
    // Navigate to game page and check sidebar
    console.log('\\n\\nNavigating to game page...');
    await page.goto('http://localhost:5000/test-home/game/space-invaders', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Hover over sidebar cards
    const sidebarCards = await page.$$('.related-games .game-card, [class*="related"] .game-card');
    if (sidebarCards.length > 0) {
      console.log('Hovering over first sidebar card...');
      await sidebarCards[0].hover();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ 
        path: 'game_sidebar_card_hovered.png',
        clip: { x: 800, y: 100, width: 400, height: 600 }
      });
    }
    
    // Get sidebar overlay analysis
    const sidebarOverlayAnalysis = await page.evaluate(() => {
      const sidebarCards = document.querySelectorAll('.related-games .game-card, [class*="related"] .game-card');
      const results = [];
      
      sidebarCards.forEach((card, index) => {
        if (index < 3) {
          const overlay = card.querySelector('.card-overlay');
          const likeBtn = card.querySelector('.like-btn, [class*="like"]');
          const favoriteBtn = card.querySelector('.favorite-btn, [class*="favorite"], .heart');
          const playsCount = card.querySelector('[class*="plays"], .plays-count');
          
          if (overlay) {
            const overlayStyles = window.getComputedStyle(overlay);
            results.push({
              cardIndex: index,
              overlayDisplay: overlayStyles.display,
              overlayOpacity: overlayStyles.opacity,
              overlayPosition: overlayStyles.position,
              hasLike: !!likeBtn,
              hasFavorite: !!favoriteBtn,
              hasPlays: !!playsCount,
              likeText: likeBtn ? likeBtn.textContent.trim() : null,
              favoriteText: favoriteBtn ? favoriteBtn.textContent.trim() : null,
              playsText: playsCount ? playsCount.textContent.trim() : null
            });
          }
        }
      });
      
      return results;
    });
    
    console.log('\\nSIDEBAR OVERLAY ANALYSIS:');
    sidebarOverlayAnalysis.forEach((result, index) => {
      console.log(`\\nSidebar Card ${index + 1} Overlay:`);
      console.log(`  Display: ${result.overlayDisplay}, Opacity: ${result.overlayOpacity}`);
      console.log(`  Position: ${result.overlayPosition}`);
      console.log(`  Has Like: ${result.hasLike}, Has Favorite: ${result.hasFavorite}, Has Plays: ${result.hasPlays}`);
      console.log(`  Like Text: "${result.likeText}"`);
      console.log(`  Favorite Text: "${result.favoriteText}"`);
      console.log(`  Plays Text: "${result.playsText}"`);
    });
    
    console.log('\\nCard interaction testing completed');
    
  } catch (error) {
    console.error('Error during interaction testing:', error);
  } finally {
    await browser.close();
  }
})();