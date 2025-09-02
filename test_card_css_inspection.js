const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Inspecting card CSS and element positioning...');
    await page.goto('http://localhost:5000/test-home', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get detailed information about card structure and styling
    const cardAnalysis = await page.evaluate(() => {
      const cards = document.querySelectorAll('.card, [class*="card"], .game-card, [class*="game"]');
      const results = [];
      
      for (let i = 0; i < Math.min(5, cards.length); i++) {
        const card = cards[i];
        const rect = card.getBoundingClientRect();
        const styles = window.getComputedStyle(card);
        
        // Find like/favorite/plays elements within this card
        const likeBtn = card.querySelector('.like-btn, [class*="like"], .btn-like, button[data-action="like"]');
        const favoriteBtn = card.querySelector('.favorite-btn, [class*="favorite"], .btn-favorite, button[data-action="favorite"], .heart');
        const playsCount = card.querySelector('[class*="plays"], .plays-count, .play-count');
        
        results.push({
          index: i,
          tagName: card.tagName,
          className: card.className,
          width: rect.width,
          height: rect.height,
          display: styles.display,
          position: styles.position,
          innerHTML: card.innerHTML.substring(0, 300) + '...',
          hasLikeBtn: !!likeBtn,
          hasFavoriteBtn: !!favoriteBtn,
          hasPlaysCount: !!playsCount,
          likeBtnVisible: likeBtn ? window.getComputedStyle(likeBtn).display !== 'none' : false,
          favoriteBtnVisible: favoriteBtn ? window.getComputedStyle(favoriteBtn).display !== 'none' : false,
          playsCountVisible: playsCount ? window.getComputedStyle(playsCount).display !== 'none' : false
        });
      }
      
      return results;
    });
    
    console.log('\\n=== TEST HOME PAGE CARD ANALYSIS ===');
    cardAnalysis.forEach((card, index) => {
      console.log(`\\nCard ${index + 1}:`);
      console.log(`  Tag: ${card.tagName}, Class: ${card.className}`);
      console.log(`  Size: ${card.width}x${card.height}`);
      console.log(`  Display: ${card.display}, Position: ${card.position}`);
      console.log(`  Has Like Button: ${card.hasLikeBtn} (Visible: ${card.likeBtnVisible})`);
      console.log(`  Has Favorite Button: ${card.hasFavoriteBtn} (Visible: ${card.favoriteBtnVisible})`);
      console.log(`  Has Plays Count: ${card.hasPlaysCount} (Visible: ${card.playsCountVisible})`);
      console.log(`  Inner HTML: ${card.innerHTML.substring(0, 150)}...`);
    });
    
    // Now check game page
    console.log('\\n\\nNavigating to game page for sidebar analysis...');
    await page.goto('http://localhost:5000/test-home/game/space-invaders', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const sidebarAnalysis = await page.evaluate(() => {
      const sidebarCards = document.querySelectorAll('.related-games .card, .sidebar .card, [class*="related"] .card, [class*="sidebar"] .card');
      const results = [];
      
      for (let i = 0; i < Math.min(3, sidebarCards.length); i++) {
        const card = sidebarCards[i];
        const rect = card.getBoundingClientRect();
        const styles = window.getComputedStyle(card);
        
        const likeBtn = card.querySelector('.like-btn, [class*="like"], .btn-like, button[data-action="like"]');
        const favoriteBtn = card.querySelector('.favorite-btn, [class*="favorite"], .btn-favorite, button[data-action="favorite"], .heart');
        const playsCount = card.querySelector('[class*="plays"], .plays-count, .play-count');
        
        results.push({
          index: i,
          tagName: card.tagName,
          className: card.className,
          width: rect.width,
          height: rect.height,
          display: styles.display,
          position: styles.position,
          innerHTML: card.innerHTML.substring(0, 300) + '...',
          hasLikeBtn: !!likeBtn,
          hasFavoriteBtn: !!favoriteBtn,
          hasPlaysCount: !!playsCount,
          likeBtnVisible: likeBtn ? window.getComputedStyle(likeBtn).display !== 'none' : false,
          favoriteBtnVisible: favoriteBtn ? window.getComputedStyle(favoriteBtn).display !== 'none' : false,
          playsCountVisible: playsCount ? window.getComputedStyle(playsCount).display !== 'none' : false
        });
      }
      
      return results;
    });
    
    console.log('\\n=== GAME PAGE SIDEBAR CARD ANALYSIS ===');
    sidebarAnalysis.forEach((card, index) => {
      console.log(`\\nSidebar Card ${index + 1}:`);
      console.log(`  Tag: ${card.tagName}, Class: ${card.className}`);
      console.log(`  Size: ${card.width}x${card.height}`);
      console.log(`  Display: ${card.display}, Position: ${card.position}`);
      console.log(`  Has Like Button: ${card.hasLikeBtn} (Visible: ${card.likeBtnVisible})`);
      console.log(`  Has Favorite Button: ${card.hasFavoriteBtn} (Visible: ${card.favoriteBtnVisible})`);
      console.log(`  Has Plays Count: ${card.hasPlaysCount} (Visible: ${card.playsCountVisible})`);
      console.log(`  Inner HTML: ${card.innerHTML.substring(0, 150)}...`);
    });
    
    console.log('\\nCSS and positioning inspection completed');
    
  } catch (error) {
    console.error('Error during CSS inspection:', error);
  } finally {
    await browser.close();
  }
})();