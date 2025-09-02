const { chromium } = require('playwright');

async function testHeartSimple() {
    console.log('Starting Simple Heart Test');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    try {
        // Test 1: Check test-home layout
        console.log('Test 1: Checking test-home layout...');
        await page.goto('http://localhost:5000/test-home');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ 
            path: 'simple_heart_test_test_home.png',
            fullPage: true
        });
        
        // Look for any heart-related elements
        const heartAnalysis = await page.evaluate(() => {
            const allElements = document.querySelectorAll('*');
            const heartRelated = [];
            const gameCards = [];
            const buttons = [];
            
            allElements.forEach((element, index) => {
                // Check for heart-related content
                if (element.innerHTML && 
                    (element.innerHTML.includes('♥') || 
                     element.innerHTML.includes('heart') ||
                     element.className.includes('heart') ||
                     element.innerHTML.includes('fa-heart'))) {
                    heartRelated.push({
                        index: index,
                        tag: element.tagName,
                        className: element.className,
                        innerHTML: element.innerHTML.substring(0, 200),
                        style: element.style.cssText
                    });
                }
                
                // Check for game cards
                if (element.classList.contains('game-card')) {
                    gameCards.push({
                        index: index,
                        gameName: element.dataset.gameName || 'Unknown',
                        favorited: element.dataset.favorited || 'Unknown',
                        innerHTML: element.innerHTML.substring(0, 300)
                    });
                }
                
                // Check for buttons
                if (element.tagName === 'BUTTON') {
                    buttons.push({
                        index: index,
                        className: element.className,
                        innerHTML: element.innerHTML,
                        onclick: element.onclick ? element.onclick.toString().substring(0, 100) : null
                    });
                }
            });
            
            return {
                heartElements: heartRelated,
                gameCards: gameCards,
                buttons: buttons.slice(0, 10) // Limit buttons
            };
        });
        
        console.log('Heart Analysis Test-Home:', JSON.stringify({
            heartElementsCount: heartAnalysis.heartElements.length,
            gameCardsCount: heartAnalysis.gameCards.length,
            buttonsCount: heartAnalysis.buttons.length,
            heartElements: heartAnalysis.heartElements.slice(0, 3),
            gameCards: heartAnalysis.gameCards.slice(0, 3),
            buttons: heartAnalysis.buttons.slice(0, 3)
        }, null, 2));
        
        // Test 2: Try to find and click heart buttons
        console.log('Test 2: Looking for heart buttons to click...');
        
        // Look for any clickable heart elements
        const possibleHeartSelectors = [
            '.heart-icon',
            '.fa-heart',
            'i[class*="heart"]',
            'button[onclick*="favorite"]',
            '.favorite-btn',
            '.heart-button',
            '[data-action="favorite"]',
            '.game-card button',
            '.game-card .heart'
        ];
        
        let foundHeartButton = false;
        let testResults = [];
        
        for (const selector of possibleHeartSelectors) {
            const elements = page.locator(selector);
            const count = await elements.count();
            
            if (count > 0) {
                console.log(`Found ${count} elements with selector: ${selector}`);
                
                // Try clicking the first one
                try {
                    await elements.first().click({ timeout: 5000 });
                    await page.waitForTimeout(1000);
                    foundHeartButton = true;
                    
                    testResults.push({
                        selector: selector,
                        clicked: true,
                        count: count
                    });
                    
                    await page.screenshot({ 
                        path: `simple_heart_after_click_${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
                        fullPage: true
                    });
                    
                } catch (clickError) {
                    testResults.push({
                        selector: selector,
                        clicked: false,
                        error: clickError.message,
                        count: count
                    });
                }
            }
        }
        
        // Test 3: Check sidebar navigation
        console.log('Test 3: Testing sidebar navigation...');
        
        const categories = ['Featured', 'Favorited', 'Liked', 'Skill', 'Arcade'];
        const categoryResults = [];
        
        for (const category of categories) {
            const categoryLink = page.locator(`.nav-link:has-text("${category}")`);
            const count = await categoryLink.count();
            
            if (count > 0) {
                console.log(`Clicking ${category} category...`);
                await categoryLink.click();
                await page.waitForTimeout(2000);
                
                // Count visible game cards in this category
                const visibleCards = await page.locator('.game-card:visible').count();
                
                // Check for any heart indicators
                const heartsInCategory = await page.evaluate(() => {
                    const hearts = document.querySelectorAll('*');
                    let heartCount = 0;
                    
                    hearts.forEach(element => {
                        if (element.innerHTML && element.innerHTML.includes('♥')) {
                            heartCount++;
                        }
                    });
                    
                    return heartCount;
                });
                
                categoryResults.push({
                    category: category,
                    visibleCards: visibleCards,
                    heartIndicators: heartsInCategory
                });
                
                await page.screenshot({ 
                    path: `simple_heart_category_${category.toLowerCase()}.png`,
                    fullPage: true
                });
            }
        }
        
        // Test 4: Check cosmic hub
        console.log('Test 4: Checking cosmic hub layout...');
        await page.goto('http://localhost:5000');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
            path: 'simple_heart_cosmic_hub.png',
            fullPage: true
        });
        
        const cosmicHubAnalysis = await page.evaluate(() => {
            const games = document.querySelectorAll('.discovery-card, [onclick*="game"], [onclick*="play"]');
            const hearts = document.querySelectorAll('*');
            let heartCount = 0;
            
            hearts.forEach(element => {
                if (element.innerHTML && element.innerHTML.includes('♥')) {
                    heartCount++;
                }
            });
            
            return {
                gameElements: games.length,
                heartIndicators: heartCount
            };
        });
        
        // Final Results
        const finalResults = {
            timestamp: new Date().toISOString(),
            testHomeLayout: {
                heartElementsFound: heartAnalysis.heartElements.length,
                gameCardsFound: heartAnalysis.gameCards.length,
                heartButtonTests: testResults,
                categoryNavigation: categoryResults
            },
            cosmicHubLayout: cosmicHubAnalysis,
            summary: {
                foundHeartButtons: foundHeartButton,
                foundHeartIndicators: heartAnalysis.heartElements.length > 0,
                sidebarNavigationWorks: categoryResults.length > 0,
                bothLayoutsAccessible: cosmicHubAnalysis.gameElements > 0
            },
            issues: []
        };
        
        // Identify issues
        if (!finalResults.summary.foundHeartButtons) {
            finalResults.issues.push('Heart buttons not found or not clickable');
        }
        
        if (!finalResults.summary.foundHeartIndicators) {
            finalResults.issues.push('No heart indicators (♥) visible on any game cards');
        }
        
        if (categoryResults.every(c => c.heartIndicators === 0)) {
            finalResults.issues.push('No heart indicators persist across categories');
        }
        
        console.log('Simple Heart Test Results:', JSON.stringify(finalResults, null, 2));
        return finalResults;
        
    } catch (error) {
        console.error('Simple heart test failed:', error);
        await page.screenshot({ path: 'simple_heart_test_error.png', fullPage: true });
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the simple test
testHeartSimple()
    .then(results => {
        console.log('Simple Heart Test Completed');
    })
    .catch(error => {
        console.error('Simple Heart Test Failed:', error);
        process.exit(1);
    });