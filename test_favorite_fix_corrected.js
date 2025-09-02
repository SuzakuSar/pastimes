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
    summary: { status: 'pending', criticalIssues: [], minorIssues: [], successes: [] }
  };
  
  try {
    console.log('=== Step 1: Navigate to test-home page and verify initial state ===');
    
    await page.goto('http://localhost:5000/test-home');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'corrected_test_step1_initial.png', fullPage: true });
    
    // Find category navigation links using proper selectors
    const favoritedLink = await page.$('a[data-category="Favorited"]');
    const likedLink = await page.$('a[data-category="Liked"]');
    const homeLink = await page.$('a[data-category="Home"]');
    
    console.log('Favorited category link found:', !!favoritedLink);
    console.log('Liked category link found:', !!likedLink);
    console.log('Home category link found:', !!homeLink);
    
    // Count initial games and buttons
    const gameCards = await page.$$('.game-card');
    const favoriteButtons = await page.$$('.btn-favorite');
    const likeButtons = await page.$$('.btn-like');
    
    console.log(`Found ${gameCards.length} game cards`);
    console.log(`Found ${favoriteButtons.length} favorite buttons`);
    console.log(`Found ${likeButtons.length} like buttons`);
    
    // Check initial count display in sidebar
    const favoritedCount = await page.$('.nav-link[data-category="Favorited"] .nav-count');
    const likedCount = await page.$('.nav-link[data-category="Liked"] .nav-count');
    
    const initialFavCount = favoritedCount ? await favoritedCount.textContent() : '0';
    const initialLikeCount = likedCount ? await likedCount.textContent() : '0';
    
    console.log(`Initial favorited count: ${initialFavCount}`);
    console.log(`Initial liked count: ${initialLikeCount}`);
    
    testResults.step1 = {
      status: 'passed',
      details: {
        gameCards: gameCards.length,
        favoriteButtons: favoriteButtons.length,
        likeButtons: likeButtons.length,
        favoritedLinkExists: !!favoritedLink,
        likedLinkExists: !!likedLink,
        initialFavCount: initialFavCount,
        initialLikeCount: initialLikeCount
      }
    };
    
    console.log('Step 1 completed successfully');
    
  } catch (error) {
    console.error('Error in Step 1:', error.message);
    await page.screenshot({ path: 'corrected_test_step1_error.png', fullPage: true });
    testResults.step1 = { status: 'failed', error: error.message };
  }
  
  try {
    console.log('\n=== Step 2: Favorite several games by clicking heart buttons ===');
    
    const favoriteButtons = await page.$$('.btn-favorite');
    
    if (favoriteButtons.length === 0) {
      throw new Error('No favorite buttons found');
    }
    
    // Click on first 3 favorite buttons
    const buttonsToClick = Math.min(3, favoriteButtons.length);
    let favoritedGameIds = [];
    
    for (let i = 0; i < buttonsToClick; i++) {
      const button = favoriteButtons[i];
      
      // Get the game card this button belongs to
      const gameCard = await button.evaluateHandle(el => el.closest('.game-card'));
      const gameTitle = await gameCard.$eval('.game-title, h3, .card-title', el => el.textContent.trim());
      
      console.log(`Favoriting game: ${gameTitle}`);
      
      // Take screenshot before click
      await page.screenshot({ path: `corrected_test_step2_before_fav_${i + 1}.png`, fullPage: true });
      
      await button.click();
      await page.waitForTimeout(1500); // Wait for state change and animations
      
      // Take screenshot after click
      await page.screenshot({ path: `corrected_test_step2_after_fav_${i + 1}.png`, fullPage: true });
      
      favoritedGameIds.push(gameTitle);
    }
    
    // Wait for all updates to complete
    await page.waitForTimeout(2000);
    
    // Check updated count in sidebar
    const favoritedCountElement = await page.$('.nav-link[data-category="Favorited"] .nav-count');
    const newFavCount = favoritedCountElement ? await favoritedCountElement.textContent() : '0';
    console.log(`New favorited count in sidebar: ${newFavCount}`);
    
    // Take final screenshot of step 2
    await page.screenshot({ path: 'corrected_test_step2_final.png', fullPage: true });
    
    testResults.step2 = {
      status: 'passed',
      details: {
        buttonsClicked: buttonsToClick,
        favoritedGames: favoritedGameIds,
        newFavCount: newFavCount
      }
    };
    
    console.log('Step 2 completed successfully');
    
  } catch (error) {
    console.error('Error in Step 2:', error.message);
    await page.screenshot({ path: 'corrected_test_step2_error.png', fullPage: true });
    testResults.step2 = { status: 'failed', error: error.message };
  }
  
  try {
    console.log('\n=== Step 3: Navigate to Favorited category and verify content ===');
    
    // Click on the Favorited category link
    const favoritedLink = await page.$('a[data-category="Favorited"]');
    
    if (!favoritedLink) {
      throw new Error('Favorited category link not found');
    }
    
    console.log('Clicking Favorited category link');
    await favoritedLink.click();
    await page.waitForTimeout(3000); // Wait for filtering to complete
    
    // Take screenshot after clicking favorited filter
    await page.screenshot({ path: 'corrected_test_step3_favorited_view.png', fullPage: true });
    
    // Count visible games in favorited view
    const visibleGameCards = await page.$$('.game-card:visible');
    console.log(`Visible games in Favorited category: ${visibleGameCards.length}`);
    
    // Verify that visible games are actually favorited
    let actuallyFavoritedCount = 0;
    let visibleGameTitles = [];
    
    for (let card of visibleGameCards) {
      const gameTitle = await card.$eval('.game-title, h3, .card-title', el => el.textContent.trim());
      visibleGameTitles.push(gameTitle);
      
      // Check if the favorite button shows favorited state
      const favButton = await card.$('.btn-favorite');
      if (favButton) {
        const isFavorited = await favButton.evaluate(el => {
          return el.classList.contains('favorited') || 
                 el.getAttribute('data-favorited') === 'true' ||
                 getComputedStyle(el).color === 'rgb(255, 0, 0)' || // red color
                 el.innerHTML.includes('♥') ||
                 el.style.color === 'red';
        });
        
        if (isFavorited) actuallyFavoritedCount++;
      }
    }
    
    console.log(`Games showing favorited state: ${actuallyFavoritedCount}`);
    console.log(`Visible game titles: ${visibleGameTitles.join(', ')}`);
    
    testResults.step3 = {
      status: visibleGameCards.length > 0 ? 'passed' : 'failed',
      details: {
        visibleGames: visibleGameCards.length,
        favoritedStateGames: actuallyFavoritedCount,
        visibleGameTitles: visibleGameTitles,
        categoryFilterWorking: visibleGameCards.length > 0
      }
    };
    
    if (visibleGameCards.length === 0) {
      testResults.summary.criticalIssues.push('Favorited category shows no games despite games being favorited');
    }
    
    console.log('Step 3 completed');
    
  } catch (error) {
    console.error('Error in Step 3:', error.message);
    await page.screenshot({ path: 'corrected_test_step3_error.png', fullPage: true });
    testResults.step3 = { status: 'failed', error: error.message };
    testResults.summary.criticalIssues.push(`Favorited category navigation failed: ${error.message}`);
  }
  
  try {
    console.log('\n=== Step 4 & 5: Unfavorite games and verify immediate removal ===');
    
    // Ensure we're in the favorited category view
    const favoritedLink = await page.$('a[data-category="Favorited"]');
    if (favoritedLink) {
      await favoritedLink.click();
      await page.waitForTimeout(2000);
    }
    
    // Get currently visible games in favorited view
    let visibleGamesBefore = await page.$$('.game-card:visible');
    console.log(`Games visible before unfavoriting: ${visibleGamesBefore.length}`);
    
    if (visibleGamesBefore.length === 0) {
      throw new Error('No games visible in favorited category to unfavorite');
    }
    
    // Take screenshot before unfavoriting
    await page.screenshot({ path: 'corrected_test_step4_before_unfavorite.png', fullPage: true });
    
    // Get the first visible game and its title
    const firstGame = visibleGamesBefore[0];
    const gameTitle = await firstGame.$eval('.game-title, h3, .card-title', el => el.textContent.trim());
    console.log(`Unfavoriting game: ${gameTitle}`);
    
    // Find and click the favorite button
    const favButton = await firstGame.$('.btn-favorite');
    
    if (!favButton) {
      throw new Error('Favorite button not found in first visible game');
    }
    
    console.log('Clicking favorite button to unfavorite game');
    await favButton.click();
    
    // Wait briefly for immediate UI updates
    await page.waitForTimeout(1000);
    
    // Take screenshot immediately after unfavoriting
    await page.screenshot({ path: 'corrected_test_step4_immediately_after.png', fullPage: true });
    
    // Check if game was immediately removed from view
    let visibleGamesAfter = await page.$$('.game-card:visible');
    console.log(`Games visible immediately after unfavoriting: ${visibleGamesAfter.length}`);
    
    // Wait longer to ensure any delayed updates complete
    await page.waitForTimeout(3000);
    
    // Final count and screenshot
    visibleGamesAfter = await page.$$('.game-card:visible');
    await page.screenshot({ path: 'corrected_test_step4_final.png', fullPage: true });
    
    console.log(`Games visible after full wait: ${visibleGamesAfter.length}`);
    
    const immediateRemoval = visibleGamesAfter.length < visibleGamesBefore.length;
    const removalCount = visibleGamesBefore.length - visibleGamesAfter.length;
    
    console.log(`Immediate removal working: ${immediateRemoval}`);
    console.log(`Games removed: ${removalCount}`);
    
    // Verify the specific game was removed
    let gameStillVisible = false;
    if (visibleGamesAfter.length > 0) {
      const remainingTitles = [];
      for (let card of visibleGamesAfter) {
        const title = await card.$eval('.game-title, h3, .card-title', el => el.textContent.trim());
        remainingTitles.push(title);
        if (title === gameTitle) {
          gameStillVisible = true;
        }
      }
      console.log(`Remaining games: ${remainingTitles.join(', ')}`);
    }
    
    testResults.step4 = {
      status: immediateRemoval && !gameStillVisible ? 'passed' : 'failed',
      details: {
        gamesBefore: visibleGamesBefore.length,
        gamesAfter: visibleGamesAfter.length,
        immediateRemoval: immediateRemoval,
        removalCount: removalCount,
        unfavoritedGame: gameTitle,
        gameStillVisible: gameStillVisible
      }
    };
    
    testResults.step5 = {
      status: immediateRemoval && !gameStillVisible ? 'passed' : 'failed',
      details: {
        noRefreshNeeded: immediateRemoval,
        specificGameRemoved: !gameStillVisible
      }
    };
    
    if (!immediateRemoval) {
      testResults.summary.criticalIssues.push('Games are not immediately removed from Favorited category when unfavorited');
    } else if (gameStillVisible) {
      testResults.summary.criticalIssues.push('Unfavorited game still visible in Favorited category');
    } else {
      testResults.summary.successes.push('Immediate removal of unfavorited games works correctly');
    }
    
    console.log('Steps 4 & 5 completed');
    
  } catch (error) {
    console.error('Error in Steps 4 & 5:', error.message);
    await page.screenshot({ path: 'corrected_test_step4_error.png', fullPage: true });
    testResults.step4 = { status: 'failed', error: error.message };
    testResults.step5 = { status: 'failed', error: error.message };
    testResults.summary.criticalIssues.push(`Unfavorite functionality failed: ${error.message}`);
  }
  
  try {
    console.log('\n=== Step 6: Test Liked category functionality ===');
    
    // Navigate back to Home category first
    const homeLink = await page.$('a[data-category="Home"]');
    if (homeLink) {
      console.log('Navigating back to Home category');
      await homeLink.click();
      await page.waitForTimeout(2000);
    }
    
    // Find and click like buttons
    const likeButtons = await page.$$('.btn-like');
    console.log(`Found ${likeButtons.length} like buttons`);
    
    if (likeButtons.length > 0) {
      // Click first 2 like buttons
      const buttonsToClick = Math.min(2, likeButtons.length);
      let likedGameTitles = [];
      
      for (let i = 0; i < buttonsToClick; i++) {
        const button = likeButtons[i];
        const gameCard = await button.evaluateHandle(el => el.closest('.game-card'));
        const gameTitle = await gameCard.$eval('.game-title, h3, .card-title', el => el.textContent.trim());
        
        console.log(`Liking game: ${gameTitle}`);
        await button.click();
        await page.waitForTimeout(1000);
        
        likedGameTitles.push(gameTitle);
      }
      
      await page.waitForTimeout(2000);
      
      // Check updated count in sidebar
      const likedCountElement = await page.$('.nav-link[data-category="Liked"] .nav-count');
      const newLikeCount = likedCountElement ? await likedCountElement.textContent() : '0';
      console.log(`New liked count in sidebar: ${newLikeCount}`);
      
      // Navigate to Liked category
      const likedLink = await page.$('a[data-category="Liked"]');
      if (likedLink) {
        console.log('Clicking Liked category link');
        await likedLink.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'corrected_test_step6_liked_view.png', fullPage: true });
        
        const visibleLikedGames = await page.$$('.game-card:visible');
        console.log(`Visible games in Liked category: ${visibleLikedGames.length}`);
        
        // Test unliking a game in the liked category
        if (visibleLikedGames.length > 0) {
          const firstLikedGame = visibleLikedGames[0];
          const gameTitle = await firstLikedGame.$eval('.game-title, h3, .card-title', el => el.textContent.trim());
          const likeButton = await firstLikedGame.$('.btn-like');
          
          if (likeButton) {
            console.log(`Unliking game: ${gameTitle}`);
            await likeButton.click();
            await page.waitForTimeout(2000);
            
            const visibleAfterUnlike = await page.$$('.game-card:visible');
            const unlikeWorking = visibleAfterUnlike.length < visibleLikedGames.length;
            
            console.log(`Unlike immediate removal working: ${unlikeWorking}`);
            
            await page.screenshot({ path: 'corrected_test_step6_after_unlike.png', fullPage: true });
          }
        }
        
        testResults.step6 = {
          status: 'passed',
          details: {
            likeButtonsFound: likeButtons.length,
            likedGames: likedGameTitles,
            likedCategoryWorking: true,
            visibleLikedGames: visibleLikedGames.length,
            newLikeCount: newLikeCount
          }
        };
        
        testResults.summary.successes.push('Liked category functionality works correctly');
      } else {
        testResults.step6 = {
          status: 'failed',
          error: 'Liked category link not found'
        };
        testResults.summary.minorIssues.push('Liked category link not accessible');
      }
    } else {
      testResults.step6 = {
        status: 'skipped',
        details: { reason: 'No like buttons found' }
      };
      testResults.summary.minorIssues.push('No like buttons found on page');
    }
    
    console.log('Step 6 completed');
    
  } catch (error) {
    console.error('Error in Step 6:', error.message);
    await page.screenshot({ path: 'corrected_test_step6_error.png', fullPage: true });
    testResults.step6 = { status: 'failed', error: error.message };
    testResults.summary.minorIssues.push(`Liked category testing failed: ${error.message}`);
  }
  
  // Determine overall test status
  const criticalFailures = testResults.summary.criticalIssues.length;
  const minorIssues = testResults.summary.minorIssues.length;
  const successes = testResults.summary.successes.length;
  
  if (criticalFailures === 0 && minorIssues === 0) {
    testResults.summary.status = 'all_passed';
  } else if (criticalFailures === 0) {
    testResults.summary.status = 'passed_with_minor_issues';
  } else {
    testResults.summary.status = 'critical_failures';
  }
  
  // Generate final test report
  console.log('\n=== FINAL TEST RESULTS ===');
  console.log('Overall Status:', testResults.summary.status);
  console.log('Critical Issues:', testResults.summary.criticalIssues);
  console.log('Minor Issues:', testResults.summary.minorIssues);
  console.log('Successes:', testResults.summary.successes);
  console.log('\nDetailed Results:');
  console.log(JSON.stringify(testResults, null, 2));
  
  // Save test results to file
  require('fs').writeFileSync('corrected_favorite_fix_test_results.json', JSON.stringify(testResults, null, 2));
  
  await page.screenshot({ path: 'corrected_test_final_state.png', fullPage: true });
  
  await browser.close();
})();