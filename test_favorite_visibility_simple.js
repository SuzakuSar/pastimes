const puppeteer = require('puppeteer');

async function testFavoriteVisibilitySimple() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    
    console.log('=== FAVORITE ICON VISIBILITY TEST ===');
    
    try {
        // Step 1: Navigate to test home page
        console.log('Step 1: Navigating to test home page...');
        await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Take initial screenshot
        await page.screenshot({ path: 'favorite_visibility_step1_initial.png', fullPage: true });
        console.log('✓ Initial screenshot taken');
        
        // Step 2: Test favorite functionality on main page
        console.log('Step 2: Testing favorite functionality...');
        const gameCard = await page.$('.game-card');
        if (!gameCard) {
            throw new Error('No game cards found');
        }
        
        // Hover to reveal buttons
        await gameCard.hover();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Take screenshot before favoriting
        await page.screenshot({ path: 'favorite_visibility_step2_before_favorite.png', fullPage: true });
        
        // Click favorite button
        const favoriteBtn = await page.$('.game-card .btn-favorite');
        if (!favoriteBtn) {
            throw new Error('Favorite button not found');
        }
        
        await favoriteBtn.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // CRITICAL TEST: Move mouse completely away
        console.log('CRITICAL TEST: Moving mouse away from card...');
        await page.mouse.move(50, 50); // Top-left corner
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Take screenshot showing favorited state WITHOUT hover
        await page.screenshot({ path: 'favorite_visibility_step3_favorited_no_hover.png', fullPage: true });
        console.log('✓ CRITICAL: Screenshot of favorited card without hover taken');
        
        // Verify the favorite icon visibility
        const favoriteIconVisible = await page.evaluate(() => {
            const favCard = document.querySelector('.game-card[data-favorited="true"]');
            if (!favCard) return { found: false, reason: 'No favorited card found' };
            
            const favoriteBtn = favCard.querySelector('.btn-favorite');
            if (!favoriteBtn) return { found: false, reason: 'No favorite button found in favorited card' };
            
            const styles = window.getComputedStyle(favoriteBtn);
            const isVisible = styles.opacity !== '0' && styles.display !== 'none' && styles.visibility !== 'hidden';
            
            return { 
                found: true, 
                visible: isVisible,
                opacity: styles.opacity,
                display: styles.display,
                visibility: styles.visibility
            };
        });
        
        console.log('Favorite icon visibility check:', favoriteIconVisible);
        
        if (favoriteIconVisible.found && favoriteIconVisible.visible) {
            console.log('✅ CRITICAL SUCCESS: Favorite icon is visible without hover!');
        } else {
            console.log('❌ CRITICAL ISSUE: Favorite icon is NOT visible without hover');
            console.log('Details:', favoriteIconVisible);
        }
        
        // Step 3: Navigate to game player using card click
        console.log('Step 3: Testing navigation to game player...');
        
        // Click on the thumbnail area (not on buttons)
        const thumbnailArea = await page.$('.game-card .card-thumbnail');
        if (thumbnailArea) {
            await thumbnailArea.click();
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check if we're on game player page
            const currentUrl = page.url();
            console.log('Current URL after navigation:', currentUrl);
            
            if (currentUrl.includes('game-player')) {
                console.log('✓ Successfully navigated to game player');
                
                // Take screenshot of game player
                await page.screenshot({ path: 'favorite_visibility_step4_game_player.png', fullPage: true });
                
                // Test related games favorite functionality
                console.log('Step 4: Testing related games favorite functionality...');
                
                // Wait for related games to load
                await page.waitForSelector('.related-games .game-card', { timeout: 5000 });
                
                const relatedGameCard = await page.$('.related-games .game-card');
                if (relatedGameCard) {
                    // Hover to reveal favorite button
                    await relatedGameCard.hover();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Click favorite button on related game
                    const relatedFavoriteBtn = await page.$('.related-games .game-card .btn-favorite');
                    if (relatedFavoriteBtn) {
                        await relatedFavoriteBtn.click();
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // CRITICAL TEST: Move mouse away from related game
                        console.log('CRITICAL TEST: Moving mouse away from related game...');
                        await page.mouse.move(50, 50);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // Take screenshot showing favorited related game
                        await page.screenshot({ path: 'favorite_visibility_step5_related_favorited.png', fullPage: true });
                        
                        // Check related game favorite visibility
                        const relatedFavoriteVisible = await page.evaluate(() => {
                            const favCard = document.querySelector('.related-games .game-card[data-favorited="true"]');
                            if (!favCard) return false;
                            
                            const favoriteBtn = favCard.querySelector('.btn-favorite');
                            if (!favoriteBtn) return false;
                            
                            const styles = window.getComputedStyle(favoriteBtn);
                            return styles.opacity !== '0' && styles.display !== 'none' && styles.visibility !== 'hidden';
                        });
                        
                        if (relatedFavoriteVisible) {
                            console.log('✅ CRITICAL SUCCESS: Related game favorite icon is visible without hover!');
                        } else {
                            console.log('❌ CRITICAL ISSUE: Related game favorite icon is NOT visible without hover');
                        }
                    } else {
                        console.log('❌ Related game favorite button not found');
                    }
                } else {
                    console.log('❌ No related games found');
                }
            } else {
                console.log('❌ Failed to navigate to game player, current URL:', currentUrl);
            }
        } else {
            console.log('❌ Game card thumbnail not found for navigation');
        }
        
        // Step 5: Test state persistence
        console.log('Step 5: Testing favorite state persistence...');
        await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Move mouse away immediately
        await page.mouse.move(50, 50);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Take final screenshot
        await page.screenshot({ path: 'favorite_visibility_step6_persistence.png', fullPage: true });
        
        // Check if favorite state persisted
        const persistedFavorite = await page.$('.game-card[data-favorited="true"]');
        if (persistedFavorite) {
            console.log('✅ SUCCESS: Favorite state persisted across navigation');
        } else {
            console.log('❌ ISSUE: Favorite state did not persist across navigation');
        }
        
        console.log('\n=== TEST RESULTS SUMMARY ===');
        console.log('📸 Screenshots taken for visual verification');
        console.log('🔍 Check the generated PNG files for visual confirmation');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: 'favorite_visibility_error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testFavoriteVisibilitySimple().catch(console.error);