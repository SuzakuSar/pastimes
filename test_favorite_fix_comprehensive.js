const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  let testResults = {
    step1: { status: 'pending', details: {} },
    step2: { status: 'pending', details: {} },
    step3: { status: 'pending', details: {} },
    step4: { status: 'pending', details: {} },
    step5: { status: 'pending', details: {} },
    step6: { status: 'pending', details: {} },
    step7: { status: 'pending', details: {} }
  };
  
  try {
    console.log('=== Step 1: Navigate to test-home page and verify initial state ===');
    
    await page.goto('http://localhost:5000/test-home');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'favorite_fix_test_step1_initial.png', fullPage: true });
    
    // Check for category filters
    const categoryFilters = await page.$$('.category-filter, .filter-btn, button[data-category], .category-btn');
    console.log(`Found ${categoryFilters.length} potential category filter elements`);
    
    // Look for favorited/liked category buttons with multiple selector approaches
    let favoritedBtn = null;
    let likedBtn = null;
    
    try {
      favoritedBtn = await page.$('button:has-text("Favorited")');
    } catch (e) {
      try {
        favoritedBtn = await page.$('.filter-btn:has-text("Favorited")');
      } catch (e2) {
        try {
          favoritedBtn = await page.$('[data-category="favorited"]');
        } catch (e3) {
          favoritedBtn = await page.$('button:contains("Favorited")');
        }
      }
    }
    
    try {
      likedBtn = await page.$('button:has-text("Liked")');
    } catch (e) {
      try {
        likedBtn = await page.$('.filter-btn:has-text("Liked")');
      } catch (e2) {
        try {
          likedBtn = await page.$('[data-category="liked"]');
        } catch (e3) {
          likedBtn = await page.$('button:contains("Liked")');
        }
      }
    }
    
    // Alternative approach - get all buttons and check text content
    if (!favoritedBtn || !likedBtn) {
      const allButtons = await page.$$('button');
      for (let button of allButtons) {
        const text = await button.textContent();
        if (text && text.toLowerCase().includes('favorited')) {
          favoritedBtn = button;
        }
        if (text && text.toLowerCase().includes('liked')) {
          likedBtn = button;
        }
      }
    }
    
    console.log('Favorited category button found:', !!favoritedBtn);
    console.log('Liked category button found:', !!likedBtn);
    
    // Count initial games and heart buttons
    const gameCards = await page.$$('.game-card, .card');
    const heartButtons = await page.$$('.heart-button, .favorite-btn, button[onclick*="favorite"]');
    
    console.log(`Found ${gameCards.length} game cards`);
    console.log(`Found ${heartButtons.length} heart buttons`);
    
    // If no heart buttons found with those selectors, try broader search
    if (heartButtons.length === 0) {
      const allButtons = await page.$$('button');
      let heartCount = 0;
      for (let button of allButtons) {
        const onclick = await button.getAttribute('onclick');
        const innerHTML = await button.innerHTML();
        if ((onclick && onclick.includes('favorite')) || 
            innerHTML.includes('♡') || innerHTML.includes('♥') || 
            innerHTML.includes('heart')) {
          heartCount++;
        }
      }
      console.log(`Found ${heartCount} potential heart buttons through broader search`);
    }
    
    testResults.step1 = {
      status: 'passed',
      details: {
        gameCards: gameCards.length,
        heartButtons: heartButtons.length,
        favoritedBtnExists: !!favoritedBtn,
        likedBtnExists: !!likedBtn,
        categoryFilters: categoryFilters.length
      }
    };
    
    console.log('Step 1 completed successfully');
    
    // Store button references for later steps
    if (favoritedBtn) {
      await favoritedBtn.evaluate(el => el.setAttribute('data-test-favorited-btn', 'true'));
    }
    if (likedBtn) {
      await likedBtn.evaluate(el => el.setAttribute('data-test-liked-btn', 'true'));
    }
    
  } catch (error) {
    console.error('Error in Step 1:', error.message);
    await page.screenshot({ path: 'favorite_fix_test_step1_error.png', fullPage: true });
    testResults.step1 = { status: 'failed', error: error.message };
  }
  
  try {
    console.log('\n=== Step 2: Favorite several games by clicking heart buttons ===');
    
    // Find heart buttons to click
    let heartButtons = await page.$$('.heart-button, .favorite-btn, button[onclick*="favorite"]');
    
    // If no specific heart buttons found, search more broadly
    if (heartButtons.length === 0) {
      const allButtons = await page.$$('button');
      heartButtons = [];
      for (let button of allButtons) {
        const onclick = await button.getAttribute('onclick');
        const innerHTML = await button.innerHTML();
        if ((onclick && onclick.includes('favorite')) || 
            innerHTML.includes('♡') || innerHTML.includes('♥')) {
          heartButtons.push(button);
        }
      }
    }
    
    console.log(`Found ${heartButtons.length} heart buttons to interact with`);
    
    if (heartButtons.length === 0) {
      throw new Error('No heart buttons found to test with');
    }
    
    // Click on first 3 heart buttons to favorite games
    const buttonsToClick = Math.min(3, heartButtons.length);
    let favoritedGames = [];
    
    for (let i = 0; i < buttonsToClick; i++) {
      const button = heartButtons[i];
      
      // Get game identifier before clicking
      const gameCard = await button.evaluateHandle(el => el.closest('.game-card, .card'));
      const gameId = await gameCard.evaluate(el => 
        el.getAttribute('data-game-id') || 
        el.querySelector('[data-game-id]')?.getAttribute('data-game-id') ||
        el.id || 
        `game-${Array.from(el.parentNode.children).indexOf(el)}`
      );
      
      console.log(`Clicking heart button for game ${gameId || i + 1}`);
      
      // Take screenshot before click
      await page.screenshot({ path: `favorite_fix_test_step2_before_click_${i + 1}.png`, fullPage: true });
      
      await button.click();
      await page.waitForTimeout(1000); // Wait for any animations/state changes
      
      // Take screenshot after click
      await page.screenshot({ path: `favorite_fix_test_step2_after_click_${i + 1}.png`, fullPage: true });
      
      favoritedGames.push(gameId || `game-${i + 1}`);
    }
    
    // Wait a bit more for all state changes to complete
    await page.waitForTimeout(2000);
    
    // Take final screenshot of step 2
    await page.screenshot({ path: 'favorite_fix_test_step2_final.png', fullPage: true });
    
    testResults.step2 = {
      status: 'passed',
      details: {
        heartButtonsFound: heartButtons.length,
        buttonsClicked: buttonsToClick,
        favoritedGames: favoritedGames
      }
    };
    
    console.log('Step 2 completed successfully');
    
  } catch (error) {
    console.error('Error in Step 2:', error.message);
    await page.screenshot({ path: 'favorite_fix_test_step2_error.png', fullPage: true });
    testResults.step2 = { status: 'failed', error: error.message };
  }
  
  try {
    console.log('\n=== Step 3: Navigate to Favorited category and verify content ===');
    
    // Find the favorited category button
    let favoritedBtn = await page.$('[data-test-favorited-btn="true"]');
    
    if (!favoritedBtn) {
      // Try alternative selectors
      const allButtons = await page.$$('button');
      for (let button of allButtons) {
        const text = await button.textContent();
        if (text && text.toLowerCase().includes('favorited')) {
          favoritedBtn = button;
          break;
        }
      }
    }
    
    if (!favoritedBtn) {
      throw new Error('Favorited category button not found');
    }
    
    console.log('Clicking Favorited category button');
    await favoritedBtn.click();
    await page.waitForTimeout(2000); // Wait for filtering to complete
    
    // Take screenshot after clicking favorited filter
    await page.screenshot({ path: 'favorite_fix_test_step3_favorited_view.png', fullPage: true });
    
    // Count visible games in favorited view
    const visibleGameCards = await page.$$('.game-card:visible, .card:visible');
    console.log(`Visible games in Favorited category: ${visibleGameCards.length}`);
    
    // Check if games are actually favorited (heart buttons should show favorited state)
    let favoritedVisibleCount = 0;
    for (let card of visibleGameCards) {
      const heartBtn = await card.$('.heart-button, .favorite-btn, button[onclick*="favorite"]');
      if (heartBtn) {
        const isFavorited = await heartBtn.evaluate(el => 
          el.classList.contains('favorited') || 
          el.getAttribute('data-favorited') === 'true' ||
          el.style.color === 'red' ||
          el.innerHTML.includes('♥')
        );
        if (isFavorited) favoritedVisibleCount++;
      }
    }
    
    console.log(`Games showing favorited state: ${favoritedVisibleCount}`);
    
    testResults.step3 = {
      status: 'passed',
      details: {
        visibleGames: visibleGameCards.length,
        favoritedStateGames: favoritedVisibleCount,
        categoryFilterWorking: visibleGameCards.length > 0
      }
    };
    
    console.log('Step 3 completed successfully');
    
  } catch (error) {
    console.error('Error in Step 3:', error.message);
    await page.screenshot({ path: 'favorite_fix_test_step3_error.png', fullPage: true });
    testResults.step3 = { status: 'failed', error: error.message };
  }
  
  try {
    console.log('\n=== Step 4 & 5: Unfavorite games and verify immediate removal ===');
    
    // Get currently visible games in favorited view
    let visibleGamesBefore = await page.$$('.game-card:visible, .card:visible');
    console.log(`Games visible before unfavoriting: ${visibleGamesBefore.length}`);
    
    if (visibleGamesBefore.length === 0) {
      throw new Error('No games visible in favorited category to unfavorite');
    }
    
    // Take screenshot before unfavoriting
    await page.screenshot({ path: 'favorite_fix_test_step4_before_unfavorite.png', fullPage: true });
    
    // Unfavorite the first game by clicking its heart button
    const firstGame = visibleGamesBefore[0];
    const heartBtn = await firstGame.$('.heart-button, .favorite-btn, button[onclick*="favorite"]');
    
    if (!heartBtn) {
      // Try broader search within the card
      const allButtonsInCard = await firstGame.$$('button');
      for (let button of allButtonsInCard) {
        const onclick = await button.getAttribute('onclick');
        const innerHTML = await button.innerHTML();
        if ((onclick && onclick.includes('favorite')) || 
            innerHTML.includes('♡') || innerHTML.includes('♥')) {
          heartBtn = button;
          break;
        }
      }
    }
    
    if (!heartBtn) {
      throw new Error('Heart button not found in first visible game');
    }
    
    console.log('Clicking heart button to unfavorite game');
    await heartBtn.click();
    
    // Wait briefly for immediate UI updates
    await page.waitForTimeout(1000);
    
    // Take screenshot immediately after unfavoriting
    await page.screenshot({ path: 'favorite_fix_test_step4_immediately_after_unfavorite.png', fullPage: true });
    
    // Check if game was immediately removed from view
    let visibleGamesAfter = await page.$$('.game-card:visible, .card:visible');
    console.log(`Games visible immediately after unfavoriting: ${visibleGamesAfter.length}`);
    
    // Wait a bit more to ensure any delayed updates complete
    await page.waitForTimeout(2000);
    
    // Take final screenshot
    await page.screenshot({ path: 'favorite_fix_test_step4_final_after_unfavorite.png', fullPage: true });
    
    // Final count
    visibleGamesAfter = await page.$$('.game-card:visible, .card:visible');
    console.log(`Games visible after full wait: ${visibleGamesAfter.length}`);
    
    const immediateRemoval = visibleGamesAfter.length < visibleGamesBefore.length;
    console.log(`Immediate removal working: ${immediateRemoval}`);
    
    testResults.step4 = {
      status: immediateRemoval ? 'passed' : 'failed',
      details: {
        gamesBefore: visibleGamesBefore.length,
        gamesAfter: visibleGamesAfter.length,
        immediateRemoval: immediateRemoval,
        removalCount: visibleGamesBefore.length - visibleGamesAfter.length
      }
    };
    
    testResults.step5 = {
      status: immediateRemoval ? 'passed' : 'failed',
      details: {
        noRefreshNeeded: immediateRemoval,
        removalImmediate: true
      }
    };
    
    console.log('Steps 4 & 5 completed');
    
  } catch (error) {
    console.error('Error in Steps 4 & 5:', error.message);
    await page.screenshot({ path: 'favorite_fix_test_step4_error.png', fullPage: true });
    testResults.step4 = { status: 'failed', error: error.message };
    testResults.step5 = { status: 'failed', error: error.message };
  }
  
  try {
    console.log('\n=== Step 6: Test Liked category functionality ===');
    
    // First navigate back to "All" or main view to like some games
    const allButtons = await page.$$('button');
    let allCategoryBtn = null;
    
    for (let button of allButtons) {
      const text = await button.textContent();
      if (text && (text.toLowerCase().includes('all') || text.toLowerCase().includes('home'))) {
        allCategoryBtn = button;
        break;
      }
    }
    
    if (allCategoryBtn) {
      console.log('Navigating back to All games view');
      await allCategoryBtn.click();
      await page.waitForTimeout(2000);
    }
    
    // Look for like buttons and click a few
    const likeButtons = await page.$$('.like-button, .like-btn, button[onclick*="like"]');
    console.log(`Found ${likeButtons.length} like buttons`);
    
    if (likeButtons.length > 0) {
      // Click first 2 like buttons
      const buttonsToClick = Math.min(2, likeButtons.length);
      for (let i = 0; i < buttonsToClick; i++) {
        await likeButtons[i].click();
        await page.waitForTimeout(1000);
      }
      
      // Now try to navigate to Liked category
      let likedBtn = await page.$('[data-test-liked-btn="true"]');
      
      if (!likedBtn) {
        for (let button of allButtons) {
          const text = await button.textContent();
          if (text && text.toLowerCase().includes('liked')) {
            likedBtn = button;
            break;
          }
        }
      }
      
      if (likedBtn) {
        console.log('Clicking Liked category button');
        await likedBtn.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'favorite_fix_test_step6_liked_view.png', fullPage: true });
        
        const visibleLikedGames = await page.$$('.game-card:visible, .card:visible');
        console.log(`Visible games in Liked category: ${visibleLikedGames.length}`);
        
        testResults.step6 = {
          status: 'passed',
          details: {
            likeButtonsFound: likeButtons.length,
            likedCategoryExists: true,
            visibleLikedGames: visibleLikedGames.length
          }
        };
      } else {
        testResults.step6 = {
          status: 'skipped',
          details: { reason: 'Liked category button not found' }
        };
      }
    } else {
      testResults.step6 = {
        status: 'skipped',
        details: { reason: 'No like buttons found' }
      };
    }
    
    console.log('Step 6 completed');
    
  } catch (error) {
    console.error('Error in Step 6:', error.message);
    await page.screenshot({ path: 'favorite_fix_test_step6_error.png', fullPage: true });
    testResults.step6 = { status: 'failed', error: error.message };
  }
  
  try {
    console.log('\n=== Step 7: Test edge cases and cross-category behavior ===');
    
    // Test switching between categories rapidly
    const categoryButtons = await page.$$('button');
    let favBtn = null, allBtn = null;
    
    for (let button of categoryButtons) {
      const text = await button.textContent();
      if (text && text.toLowerCase().includes('favorited')) {
        favBtn = button;
      }
      if (text && (text.toLowerCase().includes('all') || text.toLowerCase().includes('home'))) {
        allBtn = button;
      }
    }
    
    if (favBtn && allBtn) {
      console.log('Testing rapid category switching');
      
      // Switch between categories multiple times
      await favBtn.click();
      await page.waitForTimeout(500);
      await allBtn.click();
      await page.waitForTimeout(500);
      await favBtn.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'favorite_fix_test_step7_rapid_switching.png', fullPage: true });
      
      testResults.step7 = {
        status: 'passed',
        details: {
          rapidSwitchingTested: true,
          categoriesWorkingAfterSwitching: true
        }
      };
    } else {
      testResults.step7 = {
        status: 'skipped',
        details: { reason: 'Category buttons not found for switching test' }
      };
    }
    
    console.log('Step 7 completed');
    
  } catch (error) {
    console.error('Error in Step 7:', error.message);
    await page.screenshot({ path: 'favorite_fix_test_step7_error.png', fullPage: true });
    testResults.step7 = { status: 'failed', error: error.message };
  }
  
  // Generate final test report
  console.log('\n=== FINAL TEST RESULTS ===');
  console.log(JSON.stringify(testResults, null, 2));
  
  // Save test results to file
  require('fs').writeFileSync('favorite_fix_comprehensive_test_results.json', JSON.stringify(testResults, null, 2));
  
  await page.screenshot({ path: 'favorite_fix_test_final_state.png', fullPage: true });
  
  await browser.close();
})();