const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  console.log('=== FAVORITED CATEGORY FILTERING TEST ===\n');
  
  // Navigate to test-home page
  console.log('Step 1: Navigating to test-home page...');
  await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.game-card', { timeout: 5000 });
  
  // Favorite some games first
  console.log('Step 2: Favoriting 3 games...');
  const favoriteButtons = await page.$$('.btn-favorite');
  
  for (let i = 0; i < Math.min(3, favoriteButtons.length); i++) {
    await favoriteButtons[i].click();
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Favorited game ${i + 1}`);
  }
  
  await page.screenshot({ path: 'favorited_test_after_favoriting.png', fullPage: true });
  
  // Now click on "Favorited" category
  console.log('\\nStep 3: Switching to Favorited category...');
  
  const favoritedClicked = await page.evaluate(() => {
    const navLinks = document.querySelectorAll('.nav-link');
    for (let link of navLinks) {
      if (link.textContent.includes('Favorited')) {
        link.click();
        return true;
      }
    }
    return false;
  });
  
  if (favoritedClicked) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for filtering
    await page.screenshot({ path: 'favorited_test_favorited_category.png', fullPage: true });
    
    // Check what games are shown in Favorited category
    const favoritedCategoryState = await page.evaluate(() => {
      const gameCards = document.querySelectorAll('.game-card');
      const favoriteButtons = document.querySelectorAll('.btn-favorite');
      
      const results = {
        totalCards: gameCards.length,
        totalFavoriteButtons: favoriteButtons.length,
        cards: [],
        onlyFavoritedGamesShown: true
      };
      
      gameCards.forEach((card, index) => {
        const gameName = card.getAttribute('data-game-name') || 'Unknown';
        const cardFavorited = card.getAttribute('data-favorited') === 'true';
        const favoriteBtn = card.querySelector('.btn-favorite');
        const btnFavorited = favoriteBtn ? favoriteBtn.getAttribute('data-favorited') === 'true' : false;
        
        // Check if this card should be shown in Favorited category
        if (!btnFavorited) {
          results.onlyFavoritedGamesShown = false;
        }
        
        results.cards.push({
          index: index,
          gameName: gameName,
          cardFavorited: cardFavorited,
          btnFavorited: btnFavorited,
          visible: card.style.display !== 'none' && getComputedStyle(card).display !== 'none'
        });
      });
      
      return results;
    });
    
    console.log('Favorited category state:', JSON.stringify(favoritedCategoryState, null, 2));
    
    // Test switching back to Featured category
    console.log('\\nStep 4: Switching back to Featured category...');
    
    const featuredClicked = await page.evaluate(() => {
      const navLinks = document.querySelectorAll('.nav-link');
      for (let link of navLinks) {
        if (link.textContent.includes('Featured')) {
          link.click();
          return true;
        }
      }
      return false;
    });
    
    if (featuredClicked) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.screenshot({ path: 'favorited_test_back_to_featured.png', fullPage: true });
      
      // Check that white hearts are still visible in Featured category
      const featuredCategoryState = await page.evaluate(() => {
        const favoriteButtons = document.querySelectorAll('.btn-favorite');
        
        let whiteHearts = 0;
        const details = [];
        
        favoriteButtons.forEach((btn, index) => {
          const heartFilled = btn.querySelector('.heart-filled');
          const gameName = btn.getAttribute('data-game-name') || btn.closest('[data-game-name]')?.getAttribute('data-game-name') || 'Unknown';
          const favorited = btn.getAttribute('data-favorited') === 'true';
          
          const whiteHeartVisible = heartFilled && (
            heartFilled.style.display !== 'none' && 
            getComputedStyle(heartFilled).display !== 'none' &&
            getComputedStyle(heartFilled).visibility !== 'hidden' &&
            getComputedStyle(heartFilled).opacity !== '0'
          );
          
          if (whiteHeartVisible) whiteHearts++;
          
          details.push({
            index: index,
            gameName: gameName,
            favorited: favorited,
            whiteHeartVisible: whiteHeartVisible,
            buttonDataFavorited: btn.getAttribute('data-favorited')
          });
        });
        
        return {
          whiteHearts: whiteHearts,
          totalButtons: favoriteButtons.length,
          details: details
        };
      });
      
      console.log('Featured category (after returning) state:', JSON.stringify(featuredCategoryState, null, 2));
    }
  }
  
  console.log('\\n=== FAVORITED CATEGORY TEST COMPLETED ===');
  
  await browser.close();
})();