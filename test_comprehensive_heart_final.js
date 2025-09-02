const { chromium } = require('playwright');

async function testComprehensiveHeartFinal() {
    console.log('Starting Comprehensive Heart Final Test');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    try {
        // Test 4: Heart functionality in each category
        console.log('Test 4: Testing heart functionality in each category...');
        await page.goto('http://localhost:5000/test-home');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const categoryFunctionality = [];
        const categories = ['Featured', 'Favorited', 'Liked', 'Skill', 'Arcade'];
        
        for (const category of categories) {
            console.log(`Testing heart functionality in ${category} category...`);
            
            // Navigate to category
            const categoryLink = page.locator(`.nav-link:has-text("${category}")`);
            if (await categoryLink.count() > 0) {
                await categoryLink.click();
                await page.waitForTimeout(1500);
                
                // Count games and try to favorite one
                const visibleCards = await page.locator('.game-card:visible').count();
                let heartClicked = false;
                let whiteHeartAppeared = false;
                
                if (visibleCards > 0) {
                    // Try to click a heart button in this category
                    const heartButton = page.locator('.game-card button').first();
                    if (await heartButton.count() > 0) {
                        try {
                            await heartButton.click();
                            await page.waitForTimeout(1000);
                            heartClicked = true;
                            
                            // Check if white heart appeared
                            const whiteHeart = await page.evaluate(() => {
                                const hearts = document.querySelectorAll('.game-card *');
                                for (let heart of hearts) {
                                    if (heart.innerHTML && heart.innerHTML.includes('♥')) {
                                        const style = window.getComputedStyle(heart);
                                        if (style.color.includes('255, 255, 255') || 
                                            style.color.includes('white')) {
                                            return true;
                                        }
                                    }
                                }
                                return false;
                            });
                            
                            whiteHeartAppeared = whiteHeart;
                        } catch (error) {
                            console.log(`Could not click heart in ${category}: ${error.message}`);
                        }
                    }
                }
                
                categoryFunctionality.push({
                    category: category,
                    visibleCards: visibleCards,
                    heartClicked: heartClicked,
                    whiteHeartAppeared: whiteHeartAppeared
                });
                
                await page.screenshot({ 
                    path: `comprehensive_heart_functionality_${category.toLowerCase()}.png`,
                    fullPage: true
                });
            }
        }
        
        // Test 5: Consistency between layouts
        console.log('Test 5: Testing consistency between layouts...');
        
        // Test cosmic hub layout heart functionality
        await page.goto('http://localhost:5000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
            path: 'comprehensive_heart_cosmic_hub_initial.png',
            fullPage: true
        });
        
        // Test category switching in cosmic hub
        const cosmicCategories = ['ALL GAMES', 'ARCADE', 'DEVELOPMENT', 'SKILL'];
        const cosmicCategoryResults = [];
        
        for (const category of cosmicCategories) {
            const categoryBtn = page.locator(`button:has-text("${category}")`);
            if (await categoryBtn.count() > 0) {
                console.log(`Testing cosmic hub category: ${category}`);
                await categoryBtn.click();
                await page.waitForTimeout(1000);
                
                // Count visible games
                const gameElements = await page.locator('.discovery-card, [onclick*="game"]').count();
                
                // Check for heart indicators
                const heartCount = await page.evaluate(() => {
                    const elements = document.querySelectorAll('*');
                    let count = 0;
                    elements.forEach(el => {
                        if (el.innerHTML && el.innerHTML.includes('♥')) {
                            count++;
                        }
                    });
                    return count;
                });
                
                cosmicCategoryResults.push({
                    category: category,
                    gameElements: gameElements,
                    heartIndicators: heartCount
                });
                
                await page.screenshot({ 
                    path: `comprehensive_heart_cosmic_${category.replace(/\s+/g, '_').toLowerCase()}.png`,
                    fullPage: true
                });
            }
        }
        
        // Test 6: Edge cases and rapid switching
        console.log('Test 6: Testing edge cases and rapid switching...');
        
        // Return to test-home for rapid switching test
        await page.goto('http://localhost:5000/test-home');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Rapid category switching
        console.log('Performing rapid category switching...');
        const rapidCategories = ['Featured', 'Liked', 'Skill', 'Arcade', 'Featured'];
        
        for (const category of rapidCategories) {
            const categoryLink = page.locator(`.nav-link:has-text("${category}")`);
            if (await categoryLink.count() > 0) {
                await categoryLink.click();
                await page.waitForTimeout(300); // Very fast switching
            }
        }
        
        // Check state after rapid switching
        const finalState = await page.evaluate(() => {
            const visibleCards = document.querySelectorAll('.game-card:visible').length;
            const hearts = document.querySelectorAll('*');
            let heartCount = 0;
            
            hearts.forEach(el => {
                if (el.innerHTML && el.innerHTML.includes('♥')) {
                    const style = window.getComputedStyle(el);
                    if (style.color.includes('255, 255, 255') || 
                        style.color.includes('white')) {
                        heartCount++;
                    }
                }
            });
            
            return {
                visibleCards: visibleCards,
                whiteHearts: heartCount
            };
        });
        
        await page.screenshot({ 
            path: 'comprehensive_heart_after_rapid_switching.png',
            fullPage: true
        });
        
        // Multiple rapid heart clicks test
        console.log('Testing multiple rapid heart clicks...');
        const gameCards = page.locator('.game-card');
        const cardCount = await gameCards.count();
        
        let rapidClickResults = [];
        for (let i = 0; i < Math.min(3, cardCount); i++) {
            const card = gameCards.nth(i);
            const heartBtn = card.locator('button').first();
            
            if (await heartBtn.count() > 0) {
                // Rapid clicks
                for (let click = 0; click < 3; click++) {
                    await heartBtn.click();
                    await page.waitForTimeout(100);
                }
                
                // Check final state
                const cardState = await card.evaluate(cardEl => {
                    const hearts = cardEl.querySelectorAll('*');
                    for (let heart of hearts) {
                        if (heart.innerHTML && heart.innerHTML.includes('♥')) {
                            const style = window.getComputedStyle(heart);
                            return {
                                hasWhiteHeart: style.color.includes('255, 255, 255') || 
                                              style.color.includes('white'),
                                color: style.color
                            };
                        }
                    }
                    return { hasWhiteHeart: false, color: null };
                });
                
                rapidClickResults.push({
                    cardIndex: i,
                    finalState: cardState
                });
            }
        }
        
        await page.screenshot({ 
            path: 'comprehensive_heart_after_rapid_clicks.png',
            fullPage: true
        });
        
        // Generate final comprehensive results
        const comprehensiveResults = {
            timestamp: new Date().toISOString(),
            testResults: {
                categoryFunctionality: categoryFunctionality,
                cosmicHubConsistency: cosmicCategoryResults,
                rapidSwitchingTest: finalState,
                rapidClicksTest: rapidClickResults
            },
            summary: {
                heartButtonsWorkInAllCategories: categoryFunctionality.every(c => c.heartClicked || c.visibleCards === 0),
                whiteHeartsAppearInCategories: categoryFunctionality.some(c => c.whiteHeartAppeared),
                cosmicHubHasHeartIndicators: cosmicCategoryResults.some(c => c.heartIndicators > 0),
                statePersistsAfterRapidSwitching: finalState.whiteHearts > 0,
                rapidClicksHandledCorrectly: rapidClickResults.length > 0
            },
            issues: [],
            criticalFindings: [],
            recommendations: []
        };
        
        // Analyze results and add findings
        if (!comprehensiveResults.summary.whiteHeartsAppearInCategories) {
            comprehensiveResults.criticalFindings.push(
                'CRITICAL: White heart indicators do not appear consistently when navigating between categories'
            );
        }
        
        if (!comprehensiveResults.summary.statePersistsAfterRapidSwitching) {
            comprehensiveResults.issues.push(
                'Heart indicators may not persist after rapid category switching'
            );
        }
        
        // Check if hearts appear in some categories but not others
        const categoriesWithHearts = categoryFunctionality.filter(c => c.whiteHeartAppeared);
        const categoriesWithoutHearts = categoryFunctionality.filter(c => !c.whiteHeartAppeared && c.visibleCards > 0);
        
        if (categoriesWithHearts.length > 0 && categoriesWithoutHearts.length > 0) {
            comprehensiveResults.criticalFindings.push(
                `INCONSISTENCY: Hearts appear in ${categoriesWithHearts.map(c => c.category).join(', ')} but not in ${categoriesWithoutHearts.map(c => c.category).join(', ')}`
            );
        }
        
        // Add recommendations
        if (comprehensiveResults.criticalFindings.length > 0) {
            comprehensiveResults.recommendations.push(
                'Review heart indicator rendering logic across all category views'
            );
            comprehensiveResults.recommendations.push(
                'Ensure consistent CSS styling for heart indicators in all layouts'
            );
            comprehensiveResults.recommendations.push(
                'Test state management persistence across navigation events'
            );
        }
        
        console.log('Comprehensive Heart Test Results:', JSON.stringify(comprehensiveResults, null, 2));
        return comprehensiveResults;
        
    } catch (error) {
        console.error('Comprehensive heart test failed:', error);
        await page.screenshot({ path: 'comprehensive_heart_test_error.png', fullPage: true });
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the comprehensive test
testComprehensiveHeartFinal()
    .then(results => {
        console.log('Comprehensive Heart Test Completed Successfully');
    })
    .catch(error => {
        console.error('Comprehensive Heart Test Failed:', error);
        process.exit(1);
    });