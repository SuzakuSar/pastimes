const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  console.log('=== WHITE HEART INDICATORS FIX TEST ===\n');
  
  // Step 1: Navigate to test-home page
  console.log('Step 1: Navigating to test-home page...');
  await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.game-card', { timeout: 5000 });
  
  await page.screenshot({ path: 'white_heart_test_step1_initial.png', fullPage: true });
  
  // Check initial state
  const initialState = await page.evaluate(() => {
    const favoriteButtons = document.querySelectorAll('.btn-favorite');
    const gameCards = document.querySelectorAll('.game-card');
    
    let whiteHearts = 0;
    let emptyHearts = 0;
    
    const details = [];
    
    favoriteButtons.forEach((btn, index) => {
      const heartFilled = btn.querySelector('.heart-filled');
      const heartOutline = btn.querySelector('.heart-outline');
      const gameName = btn.getAttribute('data-game-name') || btn.closest('[data-game-name]')?.getAttribute('data-game-name') || 'Unknown';
      const favorited = btn.getAttribute('data-favorited') === 'true';
      
      // Check visibility of hearts
      const whiteHeartVisible = heartFilled && (heartFilled.style.display !== 'none' && getComputedStyle(heartFilled).display !== 'none');
      const emptyHeartVisible = heartOutline && (heartOutline.style.display !== 'none' && getComputedStyle(heartOutline).display !== 'none');
      
      if (whiteHeartVisible) whiteHearts++;
      if (emptyHeartVisible) emptyHearts++;
      
      details.push({
        index: index,
        gameName: gameName,
        favorited: favorited,
        whiteHeartVisible: whiteHeartVisible,
        emptyHeartVisible: emptyHeartVisible,
        buttonDataFavorited: btn.getAttribute('data-favorited')
      });
    });
    
    return {
      totalFavoriteButtons: favoriteButtons.length,
      totalGameCards: gameCards.length,
      whiteHearts: whiteHearts,
      emptyHearts: emptyHearts,
      details: details
    };
  });
  
  console.log('Initial state:', JSON.stringify(initialState, null, 2));
  
  // Step 2: Click on favorite buttons to favorite games
  console.log('\\nStep 2: Favoriting games by clicking heart buttons...');
  
  const favoriteButtons = await page.$$('.btn-favorite');
  console.log(`Found ${favoriteButtons.length} favorite buttons`);
  
  let successfulClicks = 0;
  
  // Click on first 3 favorite buttons
  for (let i = 0; i < Math.min(3, favoriteButtons.length); i++) {
    try {
      await favoriteButtons[i].click();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for state update
      console.log(`Clicked favorite button ${i + 1}`);
      successfulClicks++;
    } catch (error) {
      console.log(`Error clicking favorite button ${i + 1}:`, error.message);
    }
  }
  
  await page.screenshot({ path: 'white_heart_test_step2_after_favoriting.png', fullPage: true });
  
  // Check state after favoriting
  const afterFavoritingState = await page.evaluate(() => {
    const favoriteButtons = document.querySelectorAll('.btn-favorite');
    
    let whiteHearts = 0;
    let emptyHearts = 0;
    const details = [];
    
    favoriteButtons.forEach((btn, index) => {
      const heartFilled = btn.querySelector('.heart-filled');
      const heartOutline = btn.querySelector('.heart-outline');
      const gameName = btn.getAttribute('data-game-name') || btn.closest('[data-game-name]')?.getAttribute('data-game-name') || 'Unknown';
      const favorited = btn.getAttribute('data-favorited') === 'true';
      
      // Check visibility of hearts
      const whiteHeartVisible = heartFilled && (heartFilled.style.display !== 'none' && getComputedStyle(heartFilled).display !== 'none');
      const emptyHeartVisible = heartOutline && (heartOutline.style.display !== 'none' && getComputedStyle(heartOutline).display !== 'none');
      
      if (whiteHeartVisible) whiteHearts++;
      if (emptyHeartVisible) emptyHearts++;
      
      details.push({
        index: index,
        gameName: gameName,
        favorited: favorited,
        whiteHeartVisible: whiteHeartVisible,
        emptyHeartVisible: emptyHeartVisible,
        buttonDataFavorited: btn.getAttribute('data-favorited')
      });
    });
    
    return {
      whiteHearts: whiteHearts,
      emptyHearts: emptyHearts,
      details: details
    };
  });
  
  console.log(`Successfully clicked ${successfulClicks} favorite buttons`);
  console.log('After favoriting state:', JSON.stringify(afterFavoritingState, null, 2));
  
  // Step 3: Test category switching
  console.log('\\nStep 3: Testing category switching...');
  
  const categories = ['Featured', 'Favorited', 'Skill', 'Arcade'];
  const categoryResults = {};
  
  for (let category of categories) {
    try {
      console.log(`\\nSwitching to ${category} category...`);
      
      // Find and click the category navigation link
      const categoryClicked = await page.evaluate((cat) => {
        const navLinks = document.querySelectorAll('.nav-link');
        for (let link of navLinks) {
          if (link.textContent.includes(cat)) {
            link.click();
            return true;
          }
        }
        return false;
      }, category);
      
      if (categoryClicked) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for category switch
        await page.screenshot({ path: `white_heart_test_step3_${category.toLowerCase()}.png`, fullPage: true });
        
        // Check white heart indicators in this category
        const categoryState = await page.evaluate(() => {
          const favoriteButtons = document.querySelectorAll('.btn-favorite');
          const gameCards = document.querySelectorAll('.game-card');
          
          let whiteHearts = 0;
          let emptyHearts = 0;
          const details = [];
          
          favoriteButtons.forEach((btn, index) => {
            const heartFilled = btn.querySelector('.heart-filled');
            const heartOutline = btn.querySelector('.heart-outline');
            const gameName = btn.getAttribute('data-game-name') || btn.closest('[data-game-name]')?.getAttribute('data-game-name') || 'Unknown';
            const favorited = btn.getAttribute('data-favorited') === 'true';
            
            // Check visibility using multiple methods
            const whiteHeartVisible = heartFilled && (
              heartFilled.style.display !== 'none' && 
              getComputedStyle(heartFilled).display !== 'none' &&
              getComputedStyle(heartFilled).visibility !== 'hidden' &&
              getComputedStyle(heartFilled).opacity !== '0'
            );
            
            const emptyHeartVisible = heartOutline && (
              heartOutline.style.display !== 'none' && 
              getComputedStyle(heartOutline).display !== 'none' &&
              getComputedStyle(heartOutline).visibility !== 'hidden' &&
              getComputedStyle(heartOutline).opacity !== '0'
            );
            
            if (whiteHeartVisible) whiteHearts++;
            if (emptyHeartVisible) emptyHearts++;
            
            details.push({
              index: index,
              gameName: gameName,
              favorited: favorited,
              whiteHeartVisible: whiteHeartVisible,
              emptyHeartVisible: emptyHeartVisible,
              buttonDataFavorited: btn.getAttribute('data-favorited'),
              heartFilledStyles: heartFilled ? {
                display: getComputedStyle(heartFilled).display,
                visibility: getComputedStyle(heartFilled).visibility,
                opacity: getComputedStyle(heartFilled).opacity
              } : null,
              heartOutlineStyles: heartOutline ? {
                display: getComputedStyle(heartOutline).display,
                visibility: getComputedStyle(heartOutline).visibility,
                opacity: getComputedStyle(heartOutline).opacity
              } : null
            });
          });
          
          return {
            category: window.location.pathname,
            totalFavoriteButtons: favoriteButtons.length,
            totalGameCards: gameCards.length,
            whiteHearts: whiteHearts,
            emptyHearts: emptyHearts,
            details: details
          };
        });
        
        categoryResults[category] = categoryState;
        console.log(`${category} category results:`, JSON.stringify(categoryState, null, 2));
      } else {
        console.log(`Could not find ${category} category button`);
        categoryResults[category] = { error: 'Category button not found' };
      }
    } catch (error) {
      console.log(`Error testing ${category} category:`, error.message);
      categoryResults[category] = { error: error.message };
    }
  }
  
  // Step 4: Final verification - return to Featured
  console.log('\\nStep 4: Final verification - returning to Featured category...');
  
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    await page.screenshot({ path: 'white_heart_test_step4_final_featured.png', fullPage: true });
    
    const finalState = await page.evaluate(() => {
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
        details: details
      };
    });
    
    console.log('Final Featured category state:', JSON.stringify(finalState, null, 2));
    categoryResults['Final_Featured'] = finalState;
  }
  
  // Generate summary report
  console.log('\\n=== TEST SUMMARY ===');
  console.log('Initial white hearts:', initialState.whiteHearts);
  console.log('After favoriting white hearts:', afterFavoritingState.whiteHearts);
  console.log('Successful favorite clicks:', successfulClicks);
  
  Object.keys(categoryResults).forEach(category => {
    const result = categoryResults[category];
    if (result.error) {
      console.log(`${category}: ERROR - ${result.error}`);
    } else {
      console.log(`${category}: ${result.whiteHearts} white hearts visible (${result.totalFavoriteButtons} total buttons)`);
    }
  });
  
  console.log('\\n=== TEST COMPLETED ===');
  
  await browser.close();
})();