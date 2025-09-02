const puppeteer = require('puppeteer');
const fs = require('fs');

async function testFavoriteVisibilityFix() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    
    console.log('=== TESTING FAVORITE ICON VISIBILITY FIX ===');
    
    try {
        // Step 1: Navigate to test home page
        console.log('Step 1: Navigating to test home page...');
        await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Take initial screenshot
        await page.screenshot({ path: 'favorite_test_step1_initial.png', fullPage: true });
        console.log('✓ Initial screenshot taken');
        
        // Step 2: Find a game card and hover to see the favorite button
        console.log('Step 2: Finding game card and locating favorite button...');
        await page.waitForSelector('.game-card');
        
        // Get first game card
        const firstGameCard = await page.$('.game-card');
        if (!firstGameCard) {
            throw new Error('No game cards found on the page');
        }
        
        // Hover over the card to reveal favorite button
        await firstGameCard.hover();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Take screenshot showing hover state
        await page.screenshot({ path: 'favorite_test_step2_before_click.png', fullPage: true });
        console.log('✓ Screenshot before clicking favorite taken');
        
        // Step 3: Click the favorite button
        console.log('Step 3: Clicking favorite button...');
        const favoriteButton = await page.$('.game-card .btn-favorite');
        if (!favoriteButton) {
            throw new Error('Favorite button not found');
        }
        
        await favoriteButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 4: CRITICAL TEST - Move mouse away and verify filled heart is visible
        console.log('Step 4: CRITICAL TEST - Moving mouse away from card...');
        await page.mouse.move(50, 50); // Move to top-left corner
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Take screenshot showing favorited card WITHOUT hovering
        await page.screenshot({ path: 'favorite_test_step4_favorited_no_hover.png', fullPage: true });
        console.log('✓ CRITICAL: Screenshot of favorited card without hover taken');
        
        // Verify the favorite icon is visible and styled correctly
        const favoritedCard = await page.$('.game-card[data-favorited="true"]');
        if (!favoritedCard) {
            console.log('❌ CRITICAL ISSUE: data-favorited attribute not set correctly');
        } else {
            console.log('✓ data-favorited attribute is set correctly');
        }
        
        // Check if favorite icon is visible when not hovering
        const favoriteIconVisible = await page.evaluate(() => {
            const favCard = document.querySelector('.game-card[data-favorited="true"]');
            if (!favCard) return false;
            
            const favoriteBtn = favCard.querySelector('.btn-favorite');
            if (!favoriteBtn) return false;
            
            const styles = window.getComputedStyle(favoriteBtn);
            return styles.opacity !== '0' && styles.display !== 'none';
        });
        
        if (favoriteIconVisible) {
            console.log('✓ CRITICAL SUCCESS: Favorite icon is visible without hover');
        } else {
            console.log('❌ CRITICAL ISSUE: Favorite icon is NOT visible without hover');
        }
        
        // Step 5: Navigate to game player
        console.log('Step 5: Navigating to game player interface...');
        const gameLink = await page.$('.game-card a') || await page.$('.game-card');
        if (!gameLink) {
            throw new Error('Game link not found');
        }
        await gameLink.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take screenshot of game player page
        await page.screenshot({ path: 'favorite_test_step5_game_player.png', fullPage: true });
        console.log('✓ Game player page screenshot taken');
        
        // Step 6: Find related games and favorite one
        console.log('Step 6: Testing related games favorite functionality...');
        await page.waitForSelector('.related-games .game-card', { timeout: 5000 });
        
        // Hover over first related game to reveal favorite button
        const relatedGameCard = await page.$('.related-games .game-card');
        if (relatedGameCard) {
            await relatedGameCard.hover();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Click favorite button on related game
            const relatedFavoriteBtn = await page.$('.related-games .game-card .btn-favorite');
            if (relatedFavoriteBtn) {
                await relatedFavoriteBtn.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Step 7: CRITICAL TEST - Move mouse away from related game
                console.log('Step 7: CRITICAL TEST - Moving mouse away from related game card...');
                await page.mouse.move(50, 50);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Take screenshot showing favorited related game WITHOUT hovering
                await page.screenshot({ path: 'favorite_test_step7_related_game_favorited.png', fullPage: true });
                console.log('✓ CRITICAL: Screenshot of favorited related game without hover taken');
                
                // Verify related game favorite visibility
                const relatedFavoriteVisible = await page.evaluate(() => {
                    const favCard = document.querySelector('.related-games .game-card[data-favorited="true"]');
                    if (!favCard) return false;
                    
                    const favoriteBtn = favCard.querySelector('.btn-favorite');
                    if (!favoriteBtn) return false;
                    
                    const styles = window.getComputedStyle(favoriteBtn);
                    return styles.opacity !== '0' && styles.display !== 'none';
                });
                
                if (relatedFavoriteVisible) {
                    console.log('✓ CRITICAL SUCCESS: Related game favorite icon is visible without hover');
                } else {
                    console.log('❌ CRITICAL ISSUE: Related game favorite icon is NOT visible without hover');
                }
            } else {
                console.log('❌ Related game favorite button not found');
            }
        } else {
            console.log('❌ No related games found');
        }
        
        // Step 8: Navigate back to test home to verify persistence
        console.log('Step 8: Testing favorite state persistence...');
        await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Move mouse away and check if favorited state persists
        await page.mouse.move(50, 50);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Take final screenshot
        await page.screenshot({ path: 'favorite_test_step8_persistence_check.png', fullPage: true });
        console.log('✓ Favorite state persistence screenshot taken');
        
        // Check if favorite state persisted
        const persistedFavorite = await page.$('.game-card[data-favorited="true"]');
        if (persistedFavorite) {
            console.log('✓ SUCCESS: Favorite state persisted across navigation');
        } else {
            console.log('❌ ISSUE: Favorite state did not persist across navigation');
        }
        
        console.log('\n=== TEST COMPLETION ===');
        console.log('All test steps completed. Check screenshots for visual verification.');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        await page.screenshot({ path: 'favorite_test_error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

// Run the test
testFavoriteVisibilityFix().catch(console.error);