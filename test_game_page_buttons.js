const { chromium } = require('playwright');

async function testGamePageButtons() {
  console.log('Starting game page button testing...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Track console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  try {
    // Navigate to test page first
    console.log('1. Navigating to test page...');
    await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Click on a game card to navigate to game page
    console.log('2. Navigating to individual game page...');
    const gameCard = page.locator('.game-card').first();
    const cardTitle = await gameCard.locator('.thumbnail-title').textContent();
    console.log(`   Clicking on game card: ${cardTitle}`);
    
    await gameCard.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log(`   Successfully navigated to: ${page.url()}`);
    
    // Take screenshot of game page
    await page.screenshot({ path: 'game_page_initial.png', fullPage: false });
    
    // Test game stats like button
    console.log('\n3. Testing game stats like button...');
    const statLikeButton = page.locator('.btn-like-stat');
    
    if (await statLikeButton.count() > 0) {
      console.log('   Found game stats like button');
      
      // Get initial state
      const initialLikedState = await statLikeButton.getAttribute('data-liked');
      const initialLikesText = await page.locator('#currentGameLikes').textContent();
      
      console.log(`   Initial state - data-liked: ${initialLikedState}`);
      console.log(`   Initial likes display: ${initialLikesText}`);
      
      // Click the button
      await statLikeButton.click();
      await page.waitForTimeout(2000);
      
      // Check state after click
      const afterLikedState = await statLikeButton.getAttribute('data-liked');
      const afterLikesText = await page.locator('#currentGameLikes').textContent();
      
      console.log(`   After click - data-liked: ${afterLikedState}`);
      console.log(`   After click likes display: ${afterLikesText}`);
      
      // Verify visual state change
      const thumbOutlineVisible = await statLikeButton.locator('.thumb-outline').isVisible();
      const thumbFilledVisible = await statLikeButton.locator('.thumb-filled').isVisible();
      
      console.log(`   Thumb outline visible: ${thumbOutlineVisible}`);
      console.log(`   Thumb filled visible: ${thumbFilledVisible}`);
      
    } else {
      console.log('   No game stats like button found');
    }
    
    // Test favorite button in game actions
    console.log('\n4. Testing game actions favorite button...');
    const favoriteButton = page.locator('#favoriteBtn');
    
    if (await favoriteButton.count() > 0) {
      console.log('   Found game actions favorite button');
      
      // Get initial state
      const initialIcon = await favoriteButton.locator('.btn-icon').textContent();
      const initialText = await favoriteButton.locator('span:last-child').textContent();
      const initialClass = await favoriteButton.getAttribute('class');
      
      console.log(`   Initial icon: ${initialIcon}`);
      console.log(`   Initial text: ${initialText}`);
      console.log(`   Initial class: ${initialClass}`);
      
      // Click the button
      await favoriteButton.click();
      await page.waitForTimeout(2000);
      
      // Check state after click
      const afterIcon = await favoriteButton.locator('.btn-icon').textContent();
      const afterText = await favoriteButton.locator('span:last-child').textContent();
      const afterClass = await favoriteButton.getAttribute('class');
      
      console.log(`   After click icon: ${afterIcon}`);
      console.log(`   After click text: ${afterText}`);
      console.log(`   After click class: ${afterClass}`);
      
    } else {
      console.log('   No game actions favorite button found');
    }
    
    // Test related games buttons
    console.log('\n5. Testing related games like/favorite buttons...');
    
    const relatedLikeButtons = await page.locator('.related-game-like').count();
    const relatedFavoriteButtons = await page.locator('.related-game-favorite').count();
    
    console.log(`   Found ${relatedLikeButtons} related game like buttons`);
    console.log(`   Found ${relatedFavoriteButtons} related game favorite buttons`);
    
    if (relatedLikeButtons > 0) {
      console.log('   Testing first related game like button...');
      const relatedLikeButton = page.locator('.related-game-like').first();
      
      // Get initial state
      const initialState = await relatedLikeButton.getAttribute('data-liked');
      console.log(`   Initial state: ${initialState}`);
      
      // Click the button
      await relatedLikeButton.click();
      await page.waitForTimeout(2000);
      
      // Check state after click
      const afterState = await relatedLikeButton.getAttribute('data-liked');
      console.log(`   After click state: ${afterState}`);
      
      // Check visual state
      const thumbOutlineVisible = await relatedLikeButton.locator('.thumb-outline').isVisible();
      const thumbFilledVisible = await relatedLikeButton.locator('.thumb-filled').isVisible();
      
      console.log(`   Thumb outline visible: ${thumbOutlineVisible}`);
      console.log(`   Thumb filled visible: ${thumbFilledVisible}`);
    }
    
    if (relatedFavoriteButtons > 0) {
      console.log('   Testing first related game favorite button...');
      const relatedFavoriteButton = page.locator('.related-game-favorite').first();
      
      // Get initial state
      const initialState = await relatedFavoriteButton.getAttribute('data-favorited');
      console.log(`   Initial state: ${initialState}`);
      
      // Click the button
      await relatedFavoriteButton.click();
      await page.waitForTimeout(2000);
      
      // Check state after click
      const afterState = await relatedFavoriteButton.getAttribute('data-favorited');
      console.log(`   After click state: ${afterState}`);
      
      // Check visual state
      const heartOutlineVisible = await relatedFavoriteButton.locator('.heart-outline').isVisible();
      const heartFilledVisible = await relatedFavoriteButton.locator('.heart-filled').isVisible();
      
      console.log(`   Heart outline visible: ${heartOutlineVisible}`);
      console.log(`   Heart filled visible: ${heartFilledVisible}`);
    }
    
    // Check sidebar counts
    console.log('\n6. Checking sidebar counts after game page interactions...');
    
    const likedCount = await page.locator('[data-category="Liked"] .nav-count').textContent();
    const favoritedCount = await page.locator('[data-category="Favorited"] .nav-count').textContent();
    
    console.log(`   Liked count in sidebar: ${likedCount}`);
    console.log(`   Favorited count in sidebar: ${favoritedCount}`);
    
    // Take final screenshot
    await page.screenshot({ path: 'game_page_after_tests.png', fullPage: false });
    
    // Navigate back to home to check persistence
    console.log('\n7. Testing persistence by navigating back to home...');
    
    await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check sidebar counts on home page
    const homeLikedCount = await page.locator('[data-category="Liked"] .nav-count').textContent();
    const homeFavoritedCount = await page.locator('[data-category="Favorited"] .nav-count').textContent();
    
    console.log(`   Home page - Liked count: ${homeLikedCount}`);
    console.log(`   Home page - Favorited count: ${homeFavoritedCount}`);
    
    // Check if the same game card buttons show the correct state
    const homeGameCard = page.locator('.game-card').first();
    const homeLikeButton = homeGameCard.locator('.btn-like').first();
    const homeFavoriteButton = homeGameCard.locator('.btn-favorite').first();
    
    const homeLikedState = await homeLikeButton.getAttribute('data-liked');
    const homeFavoritedState = await homeFavoriteButton.getAttribute('data-favorited');
    
    console.log(`   Home page - Same game like state: ${homeLikedState}`);
    console.log(`   Home page - Same game favorite state: ${homeFavoritedState}`);
    
    // Console messages analysis
    console.log('\n8. Console Messages Analysis...');
    if (consoleMessages.length > 0) {
      console.log('   Console messages:');
      consoleMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg}`);
      });
    } else {
      console.log('   No console messages');
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({ path: 'game_page_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
  
  console.log('\nGame page button testing completed!');
}

testGamePageButtons().catch(console.error);