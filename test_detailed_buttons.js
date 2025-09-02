const { chromium } = require('playwright');

async function testButtonStates() {
  console.log('Starting detailed button state testing...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slower for better observation
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
    // Navigate to test page
    console.log('1. Navigating to test page...');
    await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'button_test_initial.png', fullPage: false });
    
    // Find first like button and inspect its initial state
    console.log('\n2. Testing Like Button States...');
    
    const likeButton = page.locator('.btn-like').first();
    await likeButton.waitFor({ state: 'visible' });
    
    // Get initial attributes
    const initialLikedState = await likeButton.getAttribute('data-liked');
    const initialThumbOutlineVisible = await likeButton.locator('.thumb-outline').isVisible();
    const initialThumbFilledVisible = await likeButton.locator('.thumb-filled').isVisible();
    
    console.log(`   Initial state - data-liked: ${initialLikedState}`);
    console.log(`   Initial state - thumb outline visible: ${initialThumbOutlineVisible}`);
    console.log(`   Initial state - thumb filled visible: ${initialThumbFilledVisible}`);
    
    // Click the like button
    console.log('   Clicking like button...');
    await likeButton.click();
    await page.waitForTimeout(2000);
    
    // Check state after click
    const afterLikedState = await likeButton.getAttribute('data-liked');
    const afterThumbOutlineVisible = await likeButton.locator('.thumb-outline').isVisible();
    const afterThumbFilledVisible = await likeButton.locator('.thumb-filled').isVisible();
    
    console.log(`   After click - data-liked: ${afterLikedState}`);
    console.log(`   After click - thumb outline visible: ${afterThumbOutlineVisible}`);
    console.log(`   After click - thumb filled visible: ${afterThumbFilledVisible}`);
    
    // Check if likes count changed
    const likesCount = await page.locator('.likes-count').first().textContent();
    console.log(`   Current likes count: ${likesCount}`);
    
    // Take screenshot after like
    await page.screenshot({ path: 'button_test_after_like.png', fullPage: false });
    
    // Test favorite button
    console.log('\n3. Testing Favorite Button States...');
    
    const favoriteButton = page.locator('.btn-favorite').first();
    await favoriteButton.waitFor({ state: 'visible' });
    
    // Get initial attributes
    const initialFavoritedState = await favoriteButton.getAttribute('data-favorited');
    const initialHeartOutlineVisible = await favoriteButton.locator('.heart-outline').isVisible();
    const initialHeartFilledVisible = await favoriteButton.locator('.heart-filled').isVisible();
    
    console.log(`   Initial state - data-favorited: ${initialFavoritedState}`);
    console.log(`   Initial state - heart outline visible: ${initialHeartOutlineVisible}`);
    console.log(`   Initial state - heart filled visible: ${initialHeartFilledVisible}`);
    
    // Click the favorite button
    console.log('   Clicking favorite button...');
    await favoriteButton.click();
    await page.waitForTimeout(2000);
    
    // Check state after click
    const afterFavoritedState = await favoriteButton.getAttribute('data-favorited');
    const afterHeartOutlineVisible = await favoriteButton.locator('.heart-outline').isVisible();
    const afterHeartFilledVisible = await favoriteButton.locator('.heart-filled').isVisible();
    
    console.log(`   After click - data-favorited: ${afterFavoritedState}`);
    console.log(`   After click - heart outline visible: ${afterHeartOutlineVisible}`);
    console.log(`   After click - heart filled visible: ${afterHeartFilledVisible}`);
    
    // Take screenshot after favorite
    await page.screenshot({ path: 'button_test_after_favorite.png', fullPage: false });
    
    // Check sidebar counts
    console.log('\n4. Checking Sidebar Counts...');
    
    const likedCount = await page.locator('[data-category="Liked"] .nav-count').textContent();
    const favoritedCount = await page.locator('[data-category="Favorited"] .nav-count').textContent();
    
    console.log(`   Liked count in sidebar: ${likedCount}`);
    console.log(`   Favorited count in sidebar: ${favoritedCount}`);
    
    // Test clicking same buttons again (toggle off)
    console.log('\n5. Testing Toggle Off...');
    
    // Click like button again
    await likeButton.click();
    await page.waitForTimeout(2000);
    
    const toggleOffLikedState = await likeButton.getAttribute('data-liked');
    console.log(`   After toggle off - data-liked: ${toggleOffLikedState}`);
    
    // Click favorite button again
    await favoriteButton.click();
    await page.waitForTimeout(2000);
    
    const toggleOffFavoritedState = await favoriteButton.getAttribute('data-favorited');
    console.log(`   After toggle off - data-favorited: ${toggleOffFavoritedState}`);
    
    // Final sidebar counts
    const finalLikedCount = await page.locator('[data-category="Liked"] .nav-count').textContent();
    const finalFavoritedCount = await page.locator('[data-category="Favorited"] .nav-count').textContent();
    
    console.log(`   Final liked count: ${finalLikedCount}`);
    console.log(`   Final favorited count: ${finalFavoritedCount}`);
    
    // Test navigation to game page
    console.log('\n6. Testing Navigation to Game Page...');
    
    try {
      // Click on the game card (not the buttons)
      const gameCard = page.locator('.game-card').first();
      const cardTitle = await gameCard.locator('.thumbnail-title').textContent();
      console.log(`   Clicking on game card: ${cardTitle}`);
      
      await gameCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      console.log(`   Navigated to: ${page.url()}`);
      
      // Take screenshot of game page
      await page.screenshot({ path: 'button_test_game_page.png', fullPage: false });
      
      // Check if like/favorite buttons exist on game page
      const gamePageLikeButtons = await page.locator('.btn-like').count();
      const gamePageFavoriteButtons = await page.locator('.btn-favorite').count();
      
      console.log(`   Game page like buttons: ${gamePageLikeButtons}`);
      console.log(`   Game page favorite buttons: ${gamePageFavoriteButtons}`);
      
      if (gamePageLikeButtons > 0) {
        const gamePageLikeButton = page.locator('.btn-like').first();
        await gamePageLikeButton.click();
        await page.waitForTimeout(1000);
        const gamePageLikedState = await gamePageLikeButton.getAttribute('data-liked');
        console.log(`   Game page like button clicked - state: ${gamePageLikedState}`);
      }
      
    } catch (error) {
      console.log(`   Navigation error: ${error.message}`);
    }
    
    // Check all console messages
    console.log('\n7. Console Messages Analysis...');
    if (consoleMessages.length > 0) {
      console.log('   Found console messages:');
      consoleMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg}`);
      });
    } else {
      console.log('   No console messages');
    }
    
    await page.screenshot({ path: 'button_test_final.png', fullPage: true });
    
  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({ path: 'button_test_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
  
  console.log('\nDetailed button testing completed!');
}

testButtonStates().catch(console.error);