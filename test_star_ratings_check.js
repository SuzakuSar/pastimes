const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Checking for star ratings on both pages...');
    
    // Check test home page for star ratings
    await page.goto('http://localhost:5000/test-home', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const testHomeStarCheck = await page.evaluate(() => {
      const starElements = document.querySelectorAll('*[class*="star"], *[class*="rating"], .fa-star, .star, .rating');
      const starResults = [];
      
      starElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);
        
        starResults.push({
          index: index,
          tagName: element.tagName,
          className: element.className,
          textContent: element.textContent.trim(),
          visible: styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0',
          width: rect.width,
          height: rect.height
        });
      });
      
      return starResults;
    });
    
    console.log('\\n=== TEST HOME PAGE STAR RATING CHECK ===');
    console.log('Total star-related elements found:', testHomeStarCheck.length);
    testHomeStarCheck.forEach((star, index) => {
      console.log(`Star Element ${index + 1}:`);
      console.log(`  Tag: ${star.tagName}, Class: ${star.className}`);
      console.log(`  Text: "${star.textContent}"`);
      console.log(`  Visible: ${star.visible}, Size: ${star.width}x${star.height}`);
    });
    
    // Check game page for star ratings
    await page.goto('http://localhost:5000/test-home/game/space-invaders', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const gamePageStarCheck = await page.evaluate(() => {
      const starElements = document.querySelectorAll('*[class*="star"], *[class*="rating"], .fa-star, .star, .rating');
      const starResults = [];
      
      starElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);
        
        starResults.push({
          index: index,
          tagName: element.tagName,
          className: element.className,
          textContent: element.textContent.trim(),
          visible: styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0',
          width: rect.width,
          height: rect.height
        });
      });
      
      return starResults;
    });
    
    console.log('\\n=== GAME PAGE STAR RATING CHECK ===');
    console.log('Total star-related elements found:', gamePageStarCheck.length);
    gamePageStarCheck.forEach((star, index) => {
      console.log(`Star Element ${index + 1}:`);
      console.log(`  Tag: ${star.tagName}, Class: ${star.className}`);
      console.log(`  Text: "${star.textContent}"`);
      console.log(`  Visible: ${star.visible}, Size: ${star.width}x${star.height}`);
    });
    
    // Check button positioning details
    console.log('\\n=== BUTTON POSITIONING ANALYSIS ===');
    
    const buttonPositioning = await page.evaluate(() => {
      const cards = document.querySelectorAll('.game-card');
      const results = [];
      
      cards.forEach((card, index) => {
        if (index < 3) {
          const overlay = card.querySelector('.card-overlay');
          const likeBtn = card.querySelector('.like-btn, [class*="like"]');
          const favoriteBtn = card.querySelector('.favorite-btn, [class*="favorite"], .heart');
          const playsCount = card.querySelector('[class*="plays"], .plays-count');
          
          if (overlay && likeBtn && favoriteBtn) {
            const overlayRect = overlay.getBoundingClientRect();
            const likeRect = likeBtn.getBoundingClientRect();
            const favoriteRect = favoriteBtn.getBoundingClientRect();
            const playsRect = playsCount ? playsCount.getBoundingClientRect() : null;
            
            results.push({
              cardIndex: index,
              overlayPosition: {
                bottom: overlayRect.bottom,
                left: overlayRect.left,
                width: overlayRect.width,
                height: overlayRect.height
              },
              likePosition: {
                bottom: likeRect.bottom,
                left: likeRect.left,
                width: likeRect.width,
                height: likeRect.height
              },
              favoritePosition: {
                bottom: favoriteRect.bottom,
                left: favoriteRect.left,
                width: favoriteRect.width,
                height: favoriteRect.height
              },
              playsPosition: playsRect ? {
                bottom: playsRect.bottom,
                left: playsRect.left,
                width: playsRect.width,
                height: playsRect.height
              } : null,
              likeAtBottomLeft: likeRect.left <= overlayRect.left + 50 && likeRect.bottom >= overlayRect.bottom - 50,
              favoriteAtBottomRight: favoriteRect.left >= overlayRect.left + overlayRect.width - 50 && favoriteRect.bottom >= overlayRect.bottom - 50
            });
          }
        }
      });
      
      return results;
    });
    
    buttonPositioning.forEach((result, index) => {
      console.log(`\\nCard ${index + 1} Button Positioning:`);
      console.log(`  Like at bottom-left: ${result.likeAtBottomLeft}`);
      console.log(`  Favorite at bottom-right: ${result.favoriteAtBottomRight}`);
      console.log(`  Like position: left=${result.likePosition.left}, bottom=${result.likePosition.bottom}`);
      console.log(`  Favorite position: left=${result.favoritePosition.left}, bottom=${result.favoritePosition.bottom}`);
      console.log(`  Overlay bounds: left=${result.overlayPosition.left}, bottom=${result.overlayPosition.bottom}, width=${result.overlayPosition.width}`);
    });
    
    console.log('\\nStar rating and button positioning check completed');
    
  } catch (error) {
    console.error('Error during star rating check:', error);
  } finally {
    await browser.close();
  }
})();