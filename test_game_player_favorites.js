const puppeteer = require('puppeteer');

async function testGamePlayerFavorites() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    
    console.log('=== GAME PLAYER FAVORITES TEST ===');
    
    try {
        // Navigate directly to a game player page
        console.log('Navigating to game player page...');
        await page.goto('http://localhost:5000/test-home/game/cosmic-dino-runner', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take initial screenshot
        await page.screenshot({ path: 'game_player_favorites_step1_initial.png', fullPage: true });
        console.log('✓ Game player page loaded');
        
        // Check if related games section exists
        const relatedGamesSection = await page.$('.related-games-sidebar');
        if (!relatedGamesSection) {
            console.log('❌ Related games section not found');
            return;
        }
        
        console.log('✓ Related games section found');
        
        // Wait for related games to load
        await page.waitForSelector('.related-game-item', { timeout: 10000 });
        
        const relatedGameCards = await page.$$('.related-game-item');
        console.log(`Found ${relatedGameCards.length} related game cards`);
        
        if (relatedGameCards.length > 0) {
            // Test first related game
            console.log('Testing favorite functionality on related games...');
            
            const firstRelatedCard = relatedGameCards[0];
            
            // Hover to reveal favorite button
            await firstRelatedCard.hover();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Take screenshot before favoriting
            await page.screenshot({ path: 'game_player_favorites_step2_before_favorite.png', fullPage: true });
            
            // Find and click favorite button
            const favoriteBtn = await page.$('.related-game-item .related-game-favorite');
            if (favoriteBtn) {
                await favoriteBtn.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // CRITICAL TEST: Move mouse away
                console.log('CRITICAL TEST: Moving mouse away from related game card...');
                await page.mouse.move(50, 50);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Take screenshot showing favorited related game WITHOUT hover
                await page.screenshot({ path: 'game_player_favorites_step3_favorited_no_hover.png', fullPage: true });
                console.log('✓ Screenshot of favorited related game without hover taken');
                
                // Check favorite icon visibility in related games
                const relatedFavoriteVisible = await page.evaluate(() => {
                    const favCard = document.querySelector('.related-game-item[data-favorited="true"]');
                    if (!favCard) return { found: false, reason: 'No favorited related game card found' };
                    
                    const favoriteBtn = favCard.querySelector('.related-game-favorite');
                    if (!favoriteBtn) return { found: false, reason: 'No favorite button in favorited related card' };
                    
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
                
                console.log('Related game favorite icon visibility:', relatedFavoriteVisible);
                
                if (relatedFavoriteVisible.found && relatedFavoriteVisible.visible) {
                    console.log('✅ CRITICAL SUCCESS: Related game favorite icon is visible without hover!');
                } else {
                    console.log('❌ CRITICAL ISSUE: Related game favorite icon is NOT visible without hover');
                    console.log('Details:', relatedFavoriteVisible);
                }
            } else {
                console.log('❌ Favorite button not found in related games');
                
                // Debug: Check what buttons exist
                const buttons = await page.$$eval('.related-game-item button', buttons => 
                    buttons.map(btn => ({
                        className: btn.className,
                        text: btn.textContent,
                        innerHTML: btn.innerHTML
                    }))
                );
                console.log('Found buttons in related games:', buttons);
            }
        } else {
            console.log('❌ No related game cards found');
        }
        
    } catch (error) {
        console.error('❌ Game player test failed:', error.message);
        await page.screenshot({ path: 'game_player_favorites_error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testGamePlayerFavorites().catch(console.error);