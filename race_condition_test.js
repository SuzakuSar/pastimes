const { test, expect } = require('@playwright/test');

test.describe('Race Condition Fix Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto('http://localhost:5000/test-home/');
    await page.waitForLoadState('networkidle');
  });

  test('should prevent race conditions on rapid like button clicks', async ({ page }) => {
    console.log('Testing rapid like button clicks for race conditions...');
    
    // Take initial screenshot
    await page.screenshot({ path: 'race_test_initial.png', fullPage: true });
    
    // Find the first like button and get initial count
    const firstLikeButton = page.locator('.like-btn').first();
    await expect(firstLikeButton).toBeVisible();
    
    const initialCountText = await firstLikeButton.textContent();
    const initialCount = parseInt(initialCountText.match(/\d+/)?.[0] || '0');
    console.log(`Initial like count: ${initialCount}`);
    
    // Perform rapid clicks (10 clicks in quick succession)
    console.log('Performing 10 rapid clicks on like button...');
    const clickPromises = [];
    for (let i = 0; i < 10; i++) {
      clickPromises.push(firstLikeButton.click());
    }
    
    // Wait for all click attempts to complete
    await Promise.all(clickPromises);
    
    // Wait a moment for all network requests to settle
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    
    // Check final count
    const finalCountText = await firstLikeButton.textContent();
    const finalCount = parseInt(finalCountText.match(/\d+/)?.[0] || '0');
    console.log(`Final like count: ${finalCount}`);
    
    // Take screenshot after rapid clicks
    await page.screenshot({ path: 'race_test_like_after.png', fullPage: true });
    
    // The count should have changed by exactly 1 (either +1 or -1 from initial)
    const countDifference = Math.abs(finalCount - initialCount);
    expect(countDifference).toBe(1);
    
    console.log(`Count changed by: ${finalCount - initialCount}`);
  });

  test('should prevent race conditions on rapid favorite button clicks', async ({ page }) => {
    console.log('Testing rapid favorite button clicks for race conditions...');
    
    // Find the first favorite button and get initial count
    const firstFavoriteButton = page.locator('.favorite-btn').first();
    await expect(firstFavoriteButton).toBeVisible();
    
    const initialCountText = await firstFavoriteButton.textContent();
    const initialCount = parseInt(initialCountText.match(/\d+/)?.[0] || '0');
    console.log(`Initial favorite count: ${initialCount}`);
    
    // Perform rapid clicks (10 clicks in quick succession)
    console.log('Performing 10 rapid clicks on favorite button...');
    const clickPromises = [];
    for (let i = 0; i < 10; i++) {
      clickPromises.push(firstFavoriteButton.click());
    }
    
    // Wait for all click attempts to complete
    await Promise.all(clickPromises);
    
    // Wait a moment for all network requests to settle
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    
    // Check final count
    const finalCountText = await firstFavoriteButton.textContent();
    const finalCount = parseInt(finalCountText.match(/\d+/)?.[0] || '0');
    console.log(`Final favorite count: ${finalCount}`);
    
    // Take screenshot after rapid clicks
    await page.screenshot({ path: 'race_test_favorite_after.png', fullPage: true });
    
    // The count should have changed by exactly 1 (either +1 or -1 from initial)
    const countDifference = Math.abs(finalCount - initialCount);
    expect(countDifference).toBe(1);
    
    console.log(`Count changed by: ${finalCount - initialCount}`);
  });

  test('should show visual feedback during button requests', async ({ page }) => {
    console.log('Testing visual feedback during button requests...');
    
    // Monitor console for any errors
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Find a like button
    const likeButton = page.locator('.like-btn').first();
    await expect(likeButton).toBeVisible();
    
    // Click and immediately check for disabled state
    const clickPromise = likeButton.click();
    
    // Check if button appears disabled (should have pointer-events: none and reduced opacity)
    await page.waitForTimeout(100); // Give a brief moment for the disabled state to apply
    
    const buttonStyle = await likeButton.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        pointerEvents: computed.pointerEvents,
        opacity: computed.opacity
      };
    });
    
    console.log('Button style during request:', buttonStyle);
    
    await clickPromise;
    await page.waitForLoadState('networkidle');
    
    // Check if button is re-enabled after request
    const finalButtonStyle = await likeButton.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        pointerEvents: computed.pointerEvents,
        opacity: computed.opacity
      };
    });
    
    console.log('Button style after request:', finalButtonStyle);
    console.log('Console messages:', consoleMessages);
    
    // Take screenshot showing final state
    await page.screenshot({ path: 'race_test_visual_feedback.png', fullPage: true });
  });

  test('should work correctly across multiple games', async ({ page }) => {
    console.log('Testing race condition fixes across multiple games...');
    
    // Get all like and favorite buttons
    const likeButtons = await page.locator('.like-btn').all();
    const favoriteButtons = await page.locator('.favorite-btn').all();
    
    console.log(`Found ${likeButtons.length} like buttons and ${favoriteButtons.length} favorite buttons`);
    
    // Test first few buttons to ensure the fix works across different games
    const buttonsToTest = Math.min(3, likeButtons.length);
    
    for (let i = 0; i < buttonsToTest; i++) {
      console.log(`Testing like button ${i + 1}...`);
      
      const button = likeButtons[i];
      const initialCountText = await button.textContent();
      const initialCount = parseInt(initialCountText.match(/\d+/)?.[0] || '0');
      
      // Perform rapid clicks
      const clickPromises = [];
      for (let j = 0; j < 5; j++) {
        clickPromises.push(button.click());
      }
      await Promise.all(clickPromises);
      
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
      
      const finalCountText = await button.textContent();
      const finalCount = parseInt(finalCountText.match(/\d+/)?.[0] || '0');
      
      const countDifference = Math.abs(finalCount - initialCount);
      console.log(`Button ${i + 1}: ${initialCount} -> ${finalCount} (diff: ${countDifference})`);
      
      expect(countDifference).toBe(1);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'race_test_multiple_games.png', fullPage: true });
  });

  test('should handle mixed rapid clicks on different buttons', async ({ page }) => {
    console.log('Testing mixed rapid clicks on different button types...');
    
    const likeButton = page.locator('.like-btn').first();
    const favoriteButton = page.locator('.favorite-btn').first();
    
    // Get initial counts
    const initialLikeText = await likeButton.textContent();
    const initialLikeCount = parseInt(initialLikeText.match(/\d+/)?.[0] || '0');
    
    const initialFavoriteText = await favoriteButton.textContent();
    const initialFavoriteCount = parseInt(initialFavoriteText.match(/\d+/)?.[0] || '0');
    
    console.log(`Initial counts - Like: ${initialLikeCount}, Favorite: ${initialFavoriteCount}`);
    
    // Perform interleaved rapid clicks
    const clickPromises = [];
    for (let i = 0; i < 5; i++) {
      clickPromises.push(likeButton.click());
      clickPromises.push(favoriteButton.click());
    }
    
    await Promise.all(clickPromises);
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    
    // Check final counts
    const finalLikeText = await likeButton.textContent();
    const finalLikeCount = parseInt(finalLikeText.match(/\d+/)?.[0] || '0');
    
    const finalFavoriteText = await favoriteButton.textContent();
    const finalFavoriteCount = parseInt(finalFavoriteText.match(/\d+/)?.[0] || '0');
    
    console.log(`Final counts - Like: ${finalLikeCount}, Favorite: ${finalFavoriteCount}`);
    
    // Both should have changed by exactly 1
    expect(Math.abs(finalLikeCount - initialLikeCount)).toBe(1);
    expect(Math.abs(finalFavoriteCount - initialFavoriteCount)).toBe(1);
    
    await page.screenshot({ path: 'race_test_mixed_clicks.png', fullPage: true });
  });
});