const { chromium } = require('playwright');

async function testFocusedHeartIndicators() {
    console.log('Starting Focused Heart Indicators Test');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    try {
        // Step 1: Navigate to test-home layout
        console.log('Step 1: Navigating to test-home layout...');
        await page.goto('http://localhost:5000/test-home');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
            path: 'focused_test_step1_test_home.png',
            fullPage: true
        });
        
        // Step 2: Identify and click heart buttons
        console.log('Step 2: Testing heart button interactions...');
        
        // Look for heart icons in game cards - they appear to be in the bottom right
        const heartIcons = page.locator('.game-card .heart-icon, .game-card i[class*="heart"], .game-card .fa-heart, .game-card [title*="favorite"], .game-card button[onclick*="favorite"]');
        let heartCount = await heartIcons.count();
        
        if (heartCount === 0) {
            // Try alternative selectors based on the screenshot
            const altHearts = page.locator('.game-card button, .game-card .favorite-button');
            heartCount = await altHearts.count();
            console.log(`Alternative heart elements found: ${heartCount}`);
        }
        
        console.log(`Heart elements found: ${heartCount}`);
        
        // Get game cards and inspect their structure
        const gameCardDetails = await page.evaluate(() => {
            const cards = document.querySelectorAll('.game-card');
            const cardData = [];
            
            cards.forEach((card, index) => {
                const title = card.querySelector('h3, .game-title, .card-title')?.textContent || `Game ${index + 1}`;
                const heartElement = card.querySelector('i[class*="heart"], .fa-heart, button[onclick*="favorite"], .favorite-button, .heart-icon');
                const allButtons = card.querySelectorAll('button');
                const allClickable = card.querySelectorAll('[onclick], [data-action]');
                
                cardData.push({
                    index: index,
                    title: title.trim(),
                    hasHeartElement: !!heartElement,
                    heartElementTag: heartElement?.tagName || null,
                    heartElementClass: heartElement?.className || null,
                    heartElementOnclick: heartElement?.onclick?.toString() || null,
                    buttonCount: allButtons.length,
                    clickableCount: allClickable.length,
                    cardHTML: card.outerHTML.substring(0, 500)
                });
            });
            
            return cardData;
        });
        
        console.log('Game Card Analysis:', JSON.stringify(gameCardDetails.slice(0, 3), null, 2));
        
        // Step 3: Try clicking on game cards to trigger favorites
        console.log('Step 3: Testing game card interactions...');
        
        const favoriteResults = [];
        
        for (let i = 0; i < Math.min(3, gameCardDetails.length); i++) {
            const card = gameCardDetails[i];
            console.log(`Testing card ${i + 1}: ${card.title}`);
            
            // Try multiple interaction methods
            const gameCard = page.locator('.game-card').nth(i);
            
            // Take before screenshot
            await page.screenshot({ 
                path: `focused_test_card_${i + 1}_before.png`,
                fullPage: true
            });
            
            // Method 1: Look for heart icon and click it
            const heartInCard = gameCard.locator('i[class*="heart"], .fa-heart, .heart-icon');
            if (await heartInCard.count() > 0) {
                console.log(`Clicking heart icon in card ${i + 1}`);
                await heartInCard.click();
                await page.waitForTimeout(1000);
            } else {
                // Method 2: Look for favorite button
                const favoriteBtn = gameCard.locator('button[onclick*="favorite"], .favorite-button, [data-action="favorite"]');
                if (await favoriteBtn.count() > 0) {
                    console.log(`Clicking favorite button in card ${i + 1}`);
                    await favoriteBtn.click();
                    await page.waitForTimeout(1000);
                } else {
                    // Method 3: Try right-clicking for context menu or double-click
                    console.log(`Trying alternative interaction for card ${i + 1}`);
                    await gameCard.click({ button: 'right' });
                    await page.waitForTimeout(500);
                    
                    // Check for context menu or try double-click
                    await gameCard.dblclick();
                    await page.waitForTimeout(1000);
                }
            }
            
            // Take after screenshot
            await page.screenshot({ 
                path: `focused_test_card_${i + 1}_after.png`,
                fullPage: true
            });
            
            // Check for changes in heart appearance
            const heartAfter = await gameCard.evaluate(card => {
                const heartElement = card.querySelector('i[class*="heart"], .fa-heart, .heart-icon');
                if (heartElement) {
                    const style = window.getComputedStyle(heartElement);
                    return {
                        color: style.color,
                        className: heartElement.className,
                        innerHTML: heartElement.innerHTML,
                        style: heartElement.style.cssText
                    };
                }
                return null;
            });
            
            favoriteResults.push({
                cardIndex: i,
                cardTitle: card.title,
                heartAfterClick: heartAfter,
                hasWhiteHeart: heartAfter && (
                    heartAfter.color.includes('255, 255, 255') || 
                    heartAfter.color.includes('white') ||
                    heartAfter.style.includes('white')
                )
            });
        }
        
        console.log('Favorite Results:', JSON.stringify(favoriteResults, null, 2));
        
        // Step 4: Test sidebar navigation
        console.log('Step 4: Testing sidebar navigation...');
        
        const sidebarTests = [];
        const sidebarCategories = [
            { selector: 'a[href*="#"]:has-text("Featured")', name: 'Featured' },
            { selector: 'a[href*="#"]:has-text("Favorited")', name: 'Favorited' },
            { selector: 'a[href*="#"]:has-text("Liked")', name: 'Liked' },
            { selector: 'a[href*="#"]:has-text("Skill")', name: 'Skill' },
            { selector: 'a[href*="#"]:has-text("Arcade")', name: 'Arcade' }
        ];
        
        for (const category of sidebarCategories) {
            console.log(`Testing ${category.name} category...`);
            
            const categoryLink = page.locator(category.selector);
            if (await categoryLink.count() > 0) {
                await categoryLink.click();
                await page.waitForTimeout(1500);
                
                // Check how many games are visible in this category
                const visibleGames = await page.locator('.game-card:visible').count();
                
                // Check for white hearts in this category
                const whiteHearts = await page.evaluate(() => {
                    const hearts = document.querySelectorAll('.game-card i[class*="heart"], .game-card .fa-heart');
                    let whiteCount = 0;
                    
                    hearts.forEach(heart => {
                        const style = window.getComputedStyle(heart);
                        if (style.color.includes('255, 255, 255') || 
                            style.color.includes('white') ||
                            heart.style.color.includes('white')) {
                            whiteCount++;
                        }
                    });
                    
                    return whiteCount;
                });
                
                sidebarTests.push({
                    category: category.name,
                    visibleGames: visibleGames,
                    whiteHeartsVisible: whiteHearts
                });
                
                await page.screenshot({ 
                    path: `focused_test_sidebar_${category.name.toLowerCase()}.png`,
                    fullPage: true
                });
            }
        }
        
        // Step 5: Return to home and check persistence
        console.log('Step 5: Testing persistence by returning to Home...');
        const homeLink = page.locator('a[href*="#"]:has-text("Home")');
        await homeLink.click();
        await page.waitForTimeout(1500);
        
        const finalWhiteHearts = await page.evaluate(() => {
            const hearts = document.querySelectorAll('.game-card i[class*="heart"], .game-card .fa-heart');
            let whiteCount = 0;
            const heartDetails = [];
            
            hearts.forEach((heart, index) => {
                const style = window.getComputedStyle(heart);
                const isWhite = style.color.includes('255, 255, 255') || 
                               style.color.includes('white') ||
                               heart.style.color.includes('white');
                
                if (isWhite) whiteCount++;
                
                heartDetails.push({
                    index: index,
                    color: style.color,
                    isWhite: isWhite,
                    className: heart.className
                });
            });
            
            return { count: whiteCount, details: heartDetails };
        });
        
        await page.screenshot({ 
            path: 'focused_test_final_persistence_check.png',
            fullPage: true
        });
        
        // Step 6: Test cosmic hub layout for comparison
        console.log('Step 6: Testing cosmic hub layout...');
        await page.goto('http://localhost:5000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
            path: 'focused_test_cosmic_hub_comparison.png',
            fullPage: true
        });
        
        // Check cosmic hub structure
        const cosmicHubAnalysis = await page.evaluate(() => {
            const cards = document.querySelectorAll('.discovery-card, .game-card, [onclick*="game"]');
            const heartElements = document.querySelectorAll('i[class*="heart"], .fa-heart, [class*="heart"]');
            
            return {
                gameCards: cards.length,
                heartElements: heartElements.length,
                hasCategories: !!document.querySelector('button:has-text("ALL GAMES"), button:has-text("ARCADE")')
            };
        });
        
        // Generate comprehensive results
        const testResults = {
            timestamp: new Date().toISOString(),
            testHomeLayout: {
                gameCardsFound: gameCardDetails.length,
                heartInteractions: favoriteResults,
                sidebarNavigation: sidebarTests,
                persistenceCheck: finalWhiteHearts
            },
            cosmicHubLayout: cosmicHubAnalysis,
            summary: {
                heartButtonsDetected: favoriteResults.length > 0,
                whiteHeartsAppeared: favoriteResults.some(r => r.hasWhiteHeart),
                sidebarNavigationWorks: sidebarTests.length > 0,
                statePersistsAcrossCategories: sidebarTests.some(s => s.whiteHeartsVisible > 0),
                bothLayoutsAccessible: cosmicHubAnalysis.gameCards > 0,
                needsRefreshForIndicators: false // We'll determine this from our tests
            },
            recommendations: []
        };
        
        // Add recommendations based on findings
        if (!testResults.summary.whiteHeartsAppeared) {
            testResults.recommendations.push('Heart buttons may not be properly changing color to white when favorited');
        }
        
        if (!testResults.summary.statePersistsAcrossCategories) {
            testResults.recommendations.push('White heart indicators may not be persisting across category navigation');
        }
        
        console.log('Comprehensive Test Results:', JSON.stringify(testResults, null, 2));
        return testResults;
        
    } catch (error) {
        console.error('Focused test failed:', error);
        await page.screenshot({ path: 'focused_test_error.png', fullPage: true });
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the focused test
testFocusedHeartIndicators()
    .then(results => {
        console.log('Focused Heart Indicators Test Completed Successfully');
    })
    .catch(error => {
        console.error('Focused Test Failed:', error);
        process.exit(1);
    });