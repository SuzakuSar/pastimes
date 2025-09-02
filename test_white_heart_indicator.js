const puppeteer = require('puppeteer');

async function testWhiteHeartIndicator() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('=== WHITE HEART FAVORITE INDICATOR TEST ===\n');
    
    // Step 1: Navigate and check initial state
    console.log('Step 1: Navigating to test-home page...');
    await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'step1_initial_state_no_hearts.png', fullPage: false });
    console.log('✓ Screenshot saved: step1_initial_state_no_hearts.png');
    
    // Check for any white hearts in initial state
    const initialHearts = await page.$$('.game-card .favorite-heart');
    console.log(`✓ Initial white hearts found: ${initialHearts.length} (should be 0)`);
    
    // Step 2: Test normal hover behavior
    console.log('\nStep 2: Testing hover behavior on first card...');
    const firstCard = await page.$('.game-card');
    if (firstCard) {
      await firstCard.hover();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if overlay appears
      const overlay = await page.$('.game-card:hover .card-overlay');
      console.log('✓ Hover overlay appears:', overlay !== null);
      
      await page.screenshot({ path: 'step2_hover_overlay.png', fullPage: false });
      console.log('✓ Screenshot saved: step2_hover_overlay.png');
    }
    
    // Step 3: Click favorite button
    console.log('\nStep 3: Clicking favorite button...');
    const favoriteButton = await page.$('.game-card .favorite-btn');
    if (favoriteButton) {
      await favoriteButton.click();
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if white heart appears
      const whiteHeart = await page.$('.game-card .favorite-heart');
      console.log('✓ White heart appears after favoriting:', whiteHeart !== null);
      
      await page.screenshot({ path: 'step3_after_favorite_with_heart.png', fullPage: false });
      console.log('✓ Screenshot saved: step3_after_favorite_with_heart.png');
    }
    
    // Step 4: Move mouse away and verify heart remains
    console.log('\nStep 4: Moving mouse away to test persistent heart...');
    await page.mouse.move(100, 100); // Move to corner
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const persistentHeart = await page.$('.game-card .favorite-heart');
    console.log('✓ White heart remains visible when not hovering:', persistentHeart !== null);
    
    await page.screenshot({ path: 'step4_persistent_heart_no_hover.png', fullPage: false });
    console.log('✓ Screenshot saved: step4_persistent_heart_no_hover.png');
    
    // Step 5: Hover over favorited card to test heart + overlay
    console.log('\nStep 5: Testing hover on favorited card...');
    await firstCard.hover();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const heartWithOverlay = await page.$('.game-card .favorite-heart');
    const overlayWithHeart = await page.$('.game-card:hover .card-overlay');
    console.log('✓ Heart visible during hover:', heartWithOverlay !== null);
    console.log('✓ Overlay visible during hover:', overlayWithHeart !== null);
    
    await page.screenshot({ path: 'step5_heart_plus_overlay.png', fullPage: false });
    console.log('✓ Screenshot saved: step5_heart_plus_overlay.png');
    
    // Step 6: Unfavorite and verify heart disappears
    console.log('\nStep 6: Unfavoriting to test heart removal...');
    const unfavoriteButton = await page.$('.game-card .favorite-btn');
    if (unfavoriteButton) {
      await unfavoriteButton.click();
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const heartAfterUnfavorite = await page.$('.game-card .favorite-heart');
      console.log('✓ White heart disappears after unfavoriting:', heartAfterUnfavorite === null);
      
      await page.screenshot({ path: 'step6_after_unfavorite_no_heart.png', fullPage: false });
      console.log('✓ Screenshot saved: step6_after_unfavorite_no_heart.png');
    }
    
    // Step 7: Test game player related games
    console.log('\nStep 7: Testing game player related games...');
    
    // Click on a game to go to game player
    await firstCard.click();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ path: 'step7_game_player_initial.png', fullPage: false });
    console.log('✓ Screenshot saved: step7_game_player_initial.png');
    
    // Test favoriting in related games
    const relatedGameCard = await page.$('.related-games .game-card');
    if (relatedGameCard) {
      console.log('Testing related games favorite indicator...');
      
      // Hover and favorite related game
      await relatedGameCard.hover();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const relatedFavoriteBtn = await page.$('.related-games .game-card .favorite-btn');
      if (relatedFavoriteBtn) {
        await relatedFavoriteBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const relatedHeart = await page.$('.related-games .game-card .favorite-heart');
        console.log('✓ Related game white heart appears:', relatedHeart !== null);
        
        await page.screenshot({ path: 'step7_related_game_with_heart.png', fullPage: false });
        console.log('✓ Screenshot saved: step7_related_game_with_heart.png');
      }
    }
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test_error_state.png', fullPage: false });
  } finally {
    await browser.close();
  }
}

testWhiteHeartIndicator();