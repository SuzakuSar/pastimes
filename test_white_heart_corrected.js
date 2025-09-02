const { chromium } = require('playwright');

async function testWhiteHeartIndicatorsCorrected() {
    console.log('Starting Corrected White Heart Indicators Test');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 800 // Slow down for better observation
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    try {
        // Step 1: Navigate to home page and inspect structure
        console.log('Step 1: Navigating to home page and inspecting structure...');
        await page.goto('http://localhost:5000');
        await page.waitForLoadState('networkidle');
        
        // Take initial screenshot
        await page.screenshot({ 
            path: 'corrected_white_heart_step1_initial.png',
            fullPage: true
        });
        
        // Inspect the actual page structure
        const pageStructure = await page.evaluate(() => {
            const gameCards = document.querySelectorAll('*');
            const cardElements = [];
            const heartElements = [];
            const categoryElements = [];
            
            // Find game card containers
            for (let element of gameCards) {
                const classList = element.classList ? Array.from(element.classList) : [];
                const tagName = element.tagName.toLowerCase();
                
                // Look for game card patterns
                if (classList.some(cls => cls.includes('card') || cls.includes('game')) || 
                    element.querySelector('h3, .game-title') ||
                    element.querySelector('button[onclick*="game"], a[href*="game"]')) {
                    cardElements.push({
                        tag: tagName,
                        classes: classList,
                        hasTitle: !!element.querySelector('h3, .game-title, .card-title'),
                        hasButton: !!element.querySelector('button'),
                        hasLink: !!element.querySelector('a'),
                        innerHTML: element.innerHTML.substring(0, 200)
                    });
                }
                
                // Look for heart elements
                if (classList.some(cls => cls.includes('heart')) || 
                    element.innerHTML.includes('♥') || 
                    element.innerHTML.includes('fa-heart') ||
                    element.onclick && element.onclick.toString().includes('favorite')) {
                    heartElements.push({
                        tag: tagName,
                        classes: classList,
                        onclick: element.onclick ? element.onclick.toString() : null,
                        innerHTML: element.innerHTML.substring(0, 100)
                    });
                }
                
                // Look for category/navigation elements
                if (classList.some(cls => cls.includes('category') || cls.includes('nav') || cls.includes('tab')) ||
                    (tagName === 'button' && (element.textContent.includes('ALL') || element.textContent.includes('ARCADE')))) {
                    categoryElements.push({
                        tag: tagName,
                        classes: classList,
                        text: element.textContent,
                        onclick: element.onclick ? element.onclick.toString() : null
                    });
                }
            }
            
            return {
                gameCards: cardElements.slice(0, 10), // Limit output
                heartElements: heartElements.slice(0, 10),
                categoryElements: categoryElements.slice(0, 10)
            };
        });
        
        console.log('Page Structure Analysis:', JSON.stringify(pageStructure, null, 2));
        
        // Step 2: Test category navigation buttons
        console.log('Step 2: Testing category navigation...');
        
        // Look for category buttons based on the cosmic hub layout
        const categoryButtons = page.locator('button:has-text("ALL GAMES"), button:has-text("ARCADE"), button:has-text("DEVELOPMENT"), button:has-text("SKILL")');
        const categoryCount = await categoryButtons.count();
        console.log(`Category buttons found: ${categoryCount}`);
        
        const categoryResults = [];
        
        for (let i = 0; i < categoryCount; i++) {
            const categoryBtn = categoryButtons.nth(i);
            const categoryText = await categoryBtn.textContent();
            
            console.log(`Testing category: ${categoryText}`);
            await categoryBtn.click();
            await page.waitForTimeout(1000);
            
            // Take screenshot of category
            await page.screenshot({ 
                path: `corrected_white_heart_category_${i + 1}_${categoryText.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
                fullPage: true
            });
            
            // Look for game elements in this category
            const gameElements = await page.evaluate(() => {
                const games = [];
                const allElements = document.querySelectorAll('*');
                
                for (let element of allElements) {
                    // Look for clickable game elements
                    if (element.onclick || 
                        (element.tagName === 'BUTTON' && element.textContent.includes('PLAY')) ||
                        (element.tagName === 'A' && element.href && element.href.includes('game'))) {
                        games.push({
                            tag: element.tagName,
                            text: element.textContent.substring(0, 50),
                            onclick: element.onclick ? element.onclick.toString().substring(0, 100) : null,
                            href: element.href || null,
                            classes: element.classList ? Array.from(element.classList) : []
                        });
                    }
                }
                return games.slice(0, 5);
            });
            
            categoryResults.push({
                category: categoryText,
                gameElements: gameElements
            });
        }
        
        // Step 3: Test the test-home layout
        console.log('Step 3: Testing test-home layout...');
        await page.goto('http://localhost:5000/test-home');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Take screenshot of test-home
        await page.screenshot({ 
            path: 'corrected_white_heart_test_home.png',
            fullPage: true
        });
        
        // Analyze test-home structure
        const testHomeStructure = await page.evaluate(() => {
            const structure = {
                gameCards: [],
                heartButtons: [],
                sidebarItems: []
            };
            
            // Look for game cards
            const cards = document.querySelectorAll('.game-card, .card, [class*="game"]');
            for (let card of cards) {
                structure.gameCards.push({
                    classes: Array.from(card.classList),
                    hasHeartButton: !!card.querySelector('button[onclick*="favorite"], .heart-button, .favorite-btn'),
                    hasHeartIcon: !!card.querySelector('i[class*="heart"], .fa-heart, [class*="heart"]'),
                    title: card.querySelector('h3, .game-title, .card-title')?.textContent || 'No title found'
                });
            }
            
            // Look for heart buttons specifically
            const hearts = document.querySelectorAll('button[onclick*="favorite"], .heart-button, .favorite-btn, i[class*="heart"], .fa-heart');
            for (let heart of hearts) {
                structure.heartButtons.push({
                    tag: heart.tagName,
                    classes: Array.from(heart.classList),
                    onclick: heart.onclick ? heart.onclick.toString().substring(0, 100) : null,
                    parent: heart.parentElement?.tagName || 'unknown'
                });
            }
            
            // Look for sidebar navigation
            const sidebar = document.querySelectorAll('.sidebar a, .nav-link, nav a, [class*="category"] a');
            for (let item of sidebar) {
                structure.sidebarItems.push({
                    text: item.textContent,
                    href: item.href,
                    classes: Array.from(item.classList)
                });
            }
            
            return structure;
        });
        
        console.log('Test-Home Structure:', JSON.stringify(testHomeStructure, null, 2));
        
        // Step 4: Test heart functionality if buttons are found
        if (testHomeStructure.heartButtons.length > 0) {
            console.log('Step 4: Testing heart button functionality...');
            
            // Test clicking heart buttons
            const heartButtons = page.locator('button[onclick*="favorite"], .heart-button, .favorite-btn');
            const heartCount = await heartButtons.count();
            
            for (let i = 0; i < Math.min(3, heartCount); i++) {
                console.log(`Clicking heart button ${i + 1}...`);
                const heartBtn = heartButtons.nth(i);
                
                // Check state before click
                await page.screenshot({ 
                    path: `corrected_white_heart_before_click_${i + 1}.png`,
                    fullPage: true
                });
                
                await heartBtn.click();
                await page.waitForTimeout(1000);
                
                // Check state after click
                await page.screenshot({ 
                    path: `corrected_white_heart_after_click_${i + 1}.png`,
                    fullPage: true
                });
                
                // Look for white hearts or favorited indicators
                const whiteHearts = await page.locator('[style*="color: white"], [style*="color:#fff"], [style*="color:#ffffff"], .favorited, .fa-heart[style*="white"]').count();
                console.log(`White hearts visible after click ${i + 1}: ${whiteHearts}`);
            }
        }
        
        // Step 5: Test sidebar navigation if available
        if (testHomeStructure.sidebarItems.length > 0) {
            console.log('Step 5: Testing sidebar navigation...');
            
            const sidebarLinks = page.locator('.sidebar a, .nav-link, nav a');
            const sidebarCount = await sidebarLinks.count();
            
            for (let i = 0; i < Math.min(3, sidebarCount); i++) {
                const link = sidebarLinks.nth(i);
                const linkText = await link.textContent();
                
                console.log(`Navigating to: ${linkText}`);
                await link.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);
                
                // Check for white hearts in this category
                const categoryWhiteHearts = await page.locator('[style*="color: white"], [style*="color:#fff"], .favorited').count();
                console.log(`White hearts in ${linkText}: ${categoryWhiteHearts}`);
                
                await page.screenshot({ 
                    path: `corrected_white_heart_sidebar_${i + 1}_${linkText.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
                    fullPage: true
                });
            }
        }
        
        // Step 6: Final verification
        console.log('Step 6: Final verification...');
        await page.goto('http://localhost:5000');
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ 
            path: 'corrected_white_heart_final_verification.png',
            fullPage: true
        });
        
        const finalResults = {
            timestamp: new Date().toISOString(),
            cosmicHubAnalysis: {
                categoryButtons: categoryCount,
                categoryResults: categoryResults
            },
            testHomeAnalysis: testHomeStructure,
            summary: {
                cosmicHubHasCategories: categoryCount > 0,
                testHomeHasHeartButtons: testHomeStructure.heartButtons.length > 0,
                testHomeHasSidebar: testHomeStructure.sidebarItems.length > 0,
                bothLayoutsAccessible: true
            }
        };
        
        console.log('Final Test Results:', JSON.stringify(finalResults, null, 2));
        return finalResults;
        
    } catch (error) {
        console.error('Test failed:', error);
        await page.screenshot({ path: 'corrected_white_heart_error.png', fullPage: true });
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the corrected test
testWhiteHeartIndicatorsCorrected()
    .then(results => {
        console.log('Corrected White Heart Indicators Test Completed');
    })
    .catch(error => {
        console.error('Corrected Test Failed:', error);
        process.exit(1);
    });