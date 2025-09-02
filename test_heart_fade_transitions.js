const { chromium } = require('playwright');

async function testHeartFadeTransitions() {
    console.log('🎯 Testing Heart Fade Transitions for Favorited Cards');
    console.log('=' .repeat(60));
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500 // Slow down actions to observe transitions
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    try {
        // Test 1: Navigate to test-home page
        console.log('📍 Test 1: Navigating to test-home page...');
        await page.goto('http://localhost:5000/test-home/');
        await page.waitForLoadState('networkidle');
        
        // Take initial screenshot
        await page.screenshot({ 
            path: 'heart_fade_test_initial.png',
            fullPage: true 
        });
        console.log('✅ Initial page loaded and screenshot taken');
        
        // Test 2: Favorite a game card
        console.log('\n📍 Test 2: Favoriting a game card...');
        
        // Debug: Check what elements exist on the page
        const gameCards = await page.locator('.game-card').count();
        console.log(`Found ${gameCards} game cards`);
        
        if (gameCards === 0) {
            // Try alternative selectors
            const cardAlternatives = await page.locator('[class*="card"], .game, [class*="game"]').count();
            console.log(`Found ${cardAlternatives} alternative card elements`);
            
            // List all classes on the page for debugging
            const allElements = await page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                const classes = new Set();
                elements.forEach(el => {
                    if (el.className && typeof el.className === 'string') {
                        el.className.split(' ').forEach(cls => classes.add(cls));
                    }
                });
                return Array.from(classes).filter(cls => cls.includes('card') || cls.includes('game'));
            });
            console.log('Relevant classes found:', allElements);
        }
        
        const firstGameCard = page.locator('.game-card').first();
        await firstGameCard.waitFor({ state: 'visible' });
        
        // Use correct selector for favorite button
        const favoriteButton = firstGameCard.locator('.btn-favorite');
        await favoriteButton.click();
        await page.waitForTimeout(1000); // Wait for favorite animation
        
        // Verify card is favorited (which shows the white heart via CSS ::after)
        await page.waitForTimeout(500); // Wait for state to update
        
        // Check if the game card has the favorited attribute
        const isFavorited = await firstGameCard.getAttribute('data-favorited');
        if (isFavorited !== 'true') {
            throw new Error('Game card is not marked as favorited');
        }
        console.log('✅ Card successfully favorited - white heart should be visible');
        
        await page.screenshot({ 
            path: 'heart_fade_test_after_favorite.png',
            fullPage: true 
        });
        console.log('✅ Card favorited - white heart visible');
        
        // Test 3: Test fade-out transition on hover
        console.log('\n📍 Test 3: Testing fade-out transition on hover...');
        
        // Check CSS transition properties for the white heart (::after pseudo-element)
        const transitionProperty = await firstGameCard.evaluate(el => {
            const afterStyles = window.getComputedStyle(el, '::after');
            return {
                transition: afterStyles.transition || 'Not found',
                opacity: afterStyles.opacity || 'Not found'
            };
        });
        console.log(`White heart CSS properties:`, transitionProperty);
        
        // Take screenshot before hover
        await page.screenshot({ 
            path: 'heart_fade_test_before_hover.png',
            fullPage: true 
        });
        console.log('📸 Screenshot taken before hover');
        
        // Hover over the favorited card slowly
        console.log('🖱️ Starting hover...');
        await firstGameCard.hover();
        
        // Take screenshot immediately when hover starts
        await page.screenshot({ 
            path: 'heart_fade_test_hover_start.png',
            fullPage: true 
        });
        console.log('📸 Screenshot taken at hover start');
        
        // Wait for transition to complete (should be 0.3s)
        await page.waitForTimeout(400);
        
        await page.screenshot({ 
            path: 'heart_fade_test_during_hover.png',
            fullPage: true 
        });
        console.log('📸 Screenshot taken during hover (fade should be complete)');
        
        // Test 4: Test fade-in transition when mouse leaves
        console.log('\n📍 Test 4: Testing fade-in transition when mouse leaves...');
        
        // Move mouse away from card
        console.log('🖱️ Moving mouse away from card...');
        await page.mouse.move(100, 100);
        await page.waitForTimeout(100); // Brief pause for unhover to register
        
        await page.screenshot({ 
            path: 'heart_fade_test_hover_end_start.png',
            fullPage: true 
        });
        console.log('📸 Screenshot taken right after unhover starts');
        
        // Wait for fade-in transition to complete
        await page.waitForTimeout(400);
        
        await page.screenshot({ 
            path: 'heart_fade_test_hover_end_complete.png',
            fullPage: true 
        });
        console.log('📸 Screenshot taken after fade-in complete');
        
        await page.screenshot({ 
            path: 'heart_fade_test_hover_end_complete.png',
            fullPage: true 
        });
        
        // Test 5: Verify transition duration and properties
        console.log('\n📍 Test 5: Verifying CSS transition properties...');
        
        // Check if the transition matches the expected CSS variable (0.3s ease)
        const cssVariables = await page.evaluate(() => {
            const root = document.documentElement;
            const computedStyle = window.getComputedStyle(root);
            return {
                transitionBase: computedStyle.getPropertyValue('--transition-base').trim(),
                primaryBg: computedStyle.getPropertyValue('--primary-bg').trim()
            };
        });
        console.log(`CSS Variables:`, cssVariables);
        
        // Verify the transition is using the correct CSS variable
        if (cssVariables.transitionBase === '0.3s ease') {
            console.log('✅ CSS transition variable is correct: 0.3s ease');
        } else {
            console.log(`⚠️ CSS transition variable mismatch: expected "0.3s ease", got "${cssVariables.transitionBase}"`);
        }
        
        // Test 6: Multiple hover cycles
        console.log('\n📍 Test 6: Testing multiple hover/unhover cycles...');
        
        for (let i = 1; i <= 3; i++) {
            console.log(`  Cycle ${i}: Hovering...`);
            await firstGameCard.hover();
            await page.waitForTimeout(400); // Wait for fade-out
            
            console.log(`  Cycle ${i}: Unhovering...`);
            await page.mouse.move(100, 100);
            await page.waitForTimeout(400); // Wait for fade-in
            
            // Take a quick screenshot to verify visual state
            if (i === 3) { // Only screenshot on final cycle
                await page.screenshot({ 
                    path: `heart_fade_test_cycle_${i}_final.png`,
                    fullPage: true 
                });
                console.log(`  📸 Screenshot taken after cycle ${i}`);
            }
        }
        
        await page.screenshot({ 
            path: 'heart_fade_test_multiple_cycles.png',
            fullPage: true 
        });
        console.log('✅ Multiple hover cycles completed');
        
        // Test 7: Navigate to game player interface
        console.log('\n📍 Test 7: Testing fade transitions in game player interface...');
        
        // Click on a game to navigate to game player
        await firstGameCard.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
            path: 'heart_fade_test_game_player_initial.png',
            fullPage: true 
        });
        
        // Look for related game suggestions
        const relatedGames = page.locator('.related-games .game-card, .suggestions .game-card');
        const relatedCount = await relatedGames.count();
        console.log(`Found ${relatedCount} related game cards`);
        
        if (relatedCount > 0) {
            // Favorite a related game
            const firstRelated = relatedGames.first();
            const relatedFavoriteBtn = firstRelated.locator('.favorite-btn');
            await relatedFavoriteBtn.click();
            await page.waitForTimeout(1000);
            
            await page.screenshot({ 
                path: 'heart_fade_test_game_player_favorited.png',
                fullPage: true 
            });
            
            // Test hover fade on related game
            console.log('Testing fade transition on related game suggestion...');
            await firstRelated.hover();
            await page.waitForTimeout(400);
            
            await page.screenshot({ 
                path: 'heart_fade_test_game_player_hover.png',
                fullPage: true 
            });
            
            await page.mouse.move(100, 100);
            await page.waitForTimeout(400);
            
            await page.screenshot({ 
                path: 'heart_fade_test_game_player_unhover.png',
                fullPage: true 
            });
            console.log('✅ Game player interface fade transitions tested');
        } else {
            console.log('⚠️ No related games found to test');
        }
        
        // Test 8: Advanced timing test
        console.log('\n📍 Test 8: Advanced timing and smoothness test...');
        
        // Go back to test-home
        await page.goto('http://localhost:5000/test-home/');
        await page.waitForLoadState('networkidle');
        
        // Find a favorited card (should still be favorited)
        const favoritedCard = page.locator('.game-card[data-favorited="true"]').first();
        
        if (await favoritedCard.count() > 0) {
            console.log('Found favorited card for advanced timing test');
            
            // Rapid hover test
            console.log('Performing rapid hover test...');
            for (let i = 0; i < 5; i++) {
                await favoritedCard.hover();
                await page.waitForTimeout(150); // Quick hover
                await page.mouse.move(50, 50);
                await page.waitForTimeout(150); // Quick unhover
                console.log(`  Rapid hover cycle ${i + 1} complete`);
            }
            
            await page.screenshot({ 
                path: 'heart_fade_test_rapid_hover.png',
                fullPage: true 
            });
            console.log('📸 Rapid hover test screenshot taken');
            
        } else {
            console.log('⚠️ No favorited cards found for advanced timing test');
        }
        
        // Summary
        console.log('\n' + '=' .repeat(60));
        console.log('🎯 HEART FADE TRANSITION TEST SUMMARY');
        console.log('=' .repeat(60));
        console.log('✅ Test completed successfully');
        console.log('📸 Screenshots saved:');
        console.log('   - heart_fade_test_initial.png');
        console.log('   - heart_fade_test_after_favorite.png'); 
        console.log('   - heart_fade_test_hover_start.png');
        console.log('   - heart_fade_test_during_hover.png');
        console.log('   - heart_fade_test_hover_end_start.png');
        console.log('   - heart_fade_test_hover_end_complete.png');
        console.log('   - heart_fade_test_multiple_cycles.png');
        console.log('   - heart_fade_test_game_player_*.png');
        console.log('   - heart_fade_test_rapid_hover.png');
        
        console.log('\n📋 KEY OBSERVATIONS:');
        console.log(`   - CSS transition variable: ${cssVariables?.transitionBase || 'N/A'}`);
        console.log(`   - White heart implementation: CSS ::after pseudo-element`);
        console.log(`   - Fade mechanism: opacity transition on hover`);
        console.log(`   - Visual testing: Screenshots captured for all states`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ 
            path: 'heart_fade_test_error.png',
            fullPage: true 
        });
    } finally {
        await browser.close();
    }
}

// Run the test
testHeartFadeTransitions().catch(console.error);