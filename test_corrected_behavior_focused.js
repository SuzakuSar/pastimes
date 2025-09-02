const puppeteer = require('puppeteer');
const fs = require('fs');

async function testCorrectedFavoriteBehaviorFocused() {
    const browser = await puppeteer.launch({ 
        headless: false,
        slowMo: 200,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    const testResults = {
        timestamp: new Date().toISOString(),
        testName: 'Corrected Favorite Icon Behavior - Focused Test',
        results: []
    };

    try {
        console.log('Starting focused favorite behavior test...');
        
        // Step 1: Navigate to test home page - ensure we get the right page
        console.log('Step 1: Navigating to test-home page...');
        await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if we're on the right page by looking for specific test-home elements
        const pageTitle = await page.title();
        const isTestHomePage = await page.evaluate(() => {
            return window.location.pathname.includes('test-home') || 
                   document.querySelector('.test-home-container') !== null ||
                   document.querySelector('.game-grid') !== null;
        });
        
        await page.screenshot({ path: 'focused_step1_test_home_page.png' });
        
        console.log('Page title:', pageTitle);
        console.log('Is test home page:', isTestHomePage);
        
        testResults.results.push({
            step: 1,
            description: 'Navigate to test-home page',
            screenshot: 'focused_step1_test_home_page.png',
            pageTitle: pageTitle,
            isCorrectPage: isTestHomePage,
            status: isTestHomePage ? 'PASS' : 'FAIL'
        });

        // Step 2: Find game cards with overlay behavior
        console.log('Step 2: Looking for game cards with overlay behavior...');
        
        // Look for different possible card selectors
        const cardSelectors = ['.game-card', '.card', '.game-item', '[data-game-id]'];
        let gameCards = [];
        let usedSelector = '';
        
        for (const selector of cardSelectors) {
            gameCards = await page.$$(selector);
            if (gameCards.length > 0) {
                usedSelector = selector;
                console.log(`Found ${gameCards.length} cards using selector: ${selector}`);
                break;
            }
        }
        
        if (gameCards.length === 0) {
            throw new Error('No game cards found on test-home page');
        }
        
        const firstCard = gameCards[0];
        
        // Get card structure information
        const cardStructure = await page.evaluate((card) => {
            const overlay = card.querySelector('.game-overlay, .overlay, .card-overlay');
            const favoriteIcon = card.querySelector('.favorite-icon, .favorite, .heart');
            const likeBtn = card.querySelector('.like-btn, .like, .thumbs-up');
            const playCount = card.querySelector('.play-count, .plays, .count');
            
            return {
                hasOverlay: !!overlay,
                hasFavoriteIcon: !!favoriteIcon,
                hasLikeBtn: !!likeBtn,
                hasPlayCount: !!playCount,
                cardHTML: card.outerHTML.substring(0, 500) // First 500 chars for inspection
            };
        }, firstCard);
        
        testResults.results.push({
            step: 2,
            description: 'Analyze card structure',
            usedSelector: usedSelector,
            cardCount: gameCards.length,
            structure: cardStructure,
            status: 'analyzed'
        });

        // Step 3: Test non-favorited card behavior (no hover state)
        console.log('Step 3: Testing non-favorited card without hover...');
        
        // Make sure mouse is away from all cards
        await page.mouse.move(50, 50);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await page.screenshot({ path: 'focused_step3_no_hover_state.png' });
        
        // Check overlay visibility without hover
        const noHoverState = await page.evaluate((card) => {
            const overlay = card.querySelector('.game-overlay, .overlay, .card-overlay');
            const favoriteIcon = card.querySelector('.favorite-icon, .favorite, .heart');
            
            if (!overlay) return { hasOverlay: false, message: 'No overlay element found' };
            
            const overlayStyles = window.getComputedStyle(overlay);
            const favoriteStyles = favoriteIcon ? window.getComputedStyle(favoriteIcon) : null;
            
            return {
                hasOverlay: true,
                overlayOpacity: overlayStyles.opacity,
                overlayDisplay: overlayStyles.display,
                overlayVisibility: overlayStyles.visibility,
                favoriteOpacity: favoriteStyles ? favoriteStyles.opacity : 'N/A',
                favoriteDisplay: favoriteStyles ? favoriteStyles.display : 'N/A'
            };
        }, firstCard);
        
        testResults.results.push({
            step: 3,
            description: 'Non-favorited card without hover (should be clean)',
            screenshot: 'focused_step3_no_hover_state.png',
            state: noHoverState,
            status: 'captured'
        });

        // Step 4: Test hover behavior
        console.log('Step 4: Testing card with hover...');
        
        await firstCard.hover();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for hover animation
        
        await page.screenshot({ path: 'focused_step4_hover_state.png' });
        
        // Check overlay visibility with hover
        const hoverState = await page.evaluate((card) => {
            const overlay = card.querySelector('.game-overlay, .overlay, .card-overlay');
            const favoriteIcon = card.querySelector('.favorite-icon, .favorite, .heart');
            const likeBtn = card.querySelector('.like-btn, .like, .thumbs-up');
            const playCount = card.querySelector('.play-count, .plays, .count');
            
            if (!overlay) return { hasOverlay: false, message: 'No overlay element found' };
            
            const overlayStyles = window.getComputedStyle(overlay);
            
            return {
                hasOverlay: true,
                overlayOpacity: overlayStyles.opacity,
                overlayDisplay: overlayStyles.display,
                overlayVisibility: overlayStyles.visibility,
                hasAllElements: !!(favoriteIcon && likeBtn && playCount),
                elementsVisible: {
                    favorite: favoriteIcon ? window.getComputedStyle(favoriteIcon).opacity : 'N/A',
                    like: likeBtn ? window.getComputedStyle(likeBtn).opacity : 'N/A',
                    plays: playCount ? window.getComputedStyle(playCount).opacity : 'N/A'
                }
            };
        }, firstCard);
        
        testResults.results.push({
            step: 4,
            description: 'Card with hover (should show all elements)',
            screenshot: 'focused_step4_hover_state.png',
            state: hoverState,
            status: 'captured'
        });

        // Step 5: Test favoriting a card
        console.log('Step 5: Testing favorite functionality...');
        
        // Try to click the favorite icon
        try {
            const favoriteIcon = await firstCard.$('.favorite-icon, .favorite, .heart');
            if (favoriteIcon) {
                await favoriteIcon.click();
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for favorite action
                
                await page.screenshot({ path: 'focused_step5_after_favorite_click.png' });
                
                testResults.results.push({
                    step: 5,
                    description: 'Clicked favorite icon',
                    screenshot: 'focused_step5_after_favorite_click.png',
                    status: 'clicked'
                });
            } else {
                testResults.results.push({
                    step: 5,
                    description: 'Could not find favorite icon to click',
                    status: 'skipped'
                });
            }
        } catch (error) {
            testResults.results.push({
                step: 5,
                description: 'Error clicking favorite icon',
                error: error.message,
                status: 'error'
            });
        }

        // Step 6: Test favorited card behavior without hover
        console.log('Step 6: Testing favorited card without hover...');
        
        // Move mouse away
        await page.mouse.move(50, 50);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await page.screenshot({ path: 'focused_step6_favorited_no_hover.png' });
        
        const favoritedNoHoverState = await page.evaluate((card) => {
            const overlay = card.querySelector('.game-overlay, .overlay, .card-overlay');
            const favoriteIcon = card.querySelector('.favorite-icon, .favorite, .heart');
            
            if (!overlay || !favoriteIcon) {
                return { hasElements: false, message: 'Missing overlay or favorite icon' };
            }
            
            const overlayStyles = window.getComputedStyle(overlay);
            const favoriteStyles = window.getComputedStyle(favoriteIcon);
            
            // Check if favorite is marked as favorited
            const isFavorited = favoriteIcon.classList.contains('favorited') ||
                              favoriteIcon.classList.contains('active') ||
                              favoriteIcon.style.color === 'red' ||
                              favoriteIcon.style.fill === 'red';
            
            return {
                hasElements: true,
                overlayOpacity: overlayStyles.opacity,
                favoriteOpacity: favoriteStyles.opacity,
                isFavorited: isFavorited,
                favoriteClasses: favoriteIcon.className,
                favoriteStyle: favoriteIcon.style.cssText
            };
        }, firstCard);
        
        testResults.results.push({
            step: 6,
            description: 'Favorited card without hover (should show only red heart)',
            screenshot: 'focused_step6_favorited_no_hover.png',
            state: favoritedNoHoverState,
            status: 'captured'
        });

        // Step 7: Test favorited card with hover
        console.log('Step 7: Testing favorited card with hover...');
        
        await firstCard.hover();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await page.screenshot({ path: 'focused_step7_favorited_with_hover.png' });
        
        const favoritedHoverState = await page.evaluate((card) => {
            const overlay = card.querySelector('.game-overlay, .overlay, .card-overlay');
            const favoriteIcon = card.querySelector('.favorite-icon, .favorite, .heart');
            const likeBtn = card.querySelector('.like-btn, .like, .thumbs-up');
            const playCount = card.querySelector('.play-count, .plays, .count');
            
            if (!overlay) return { hasOverlay: false };
            
            const overlayStyles = window.getComputedStyle(overlay);
            
            return {
                hasOverlay: true,
                overlayOpacity: overlayStyles.opacity,
                hasAllElements: !!(favoriteIcon && likeBtn && playCount),
                favoriteStillMarked: favoriteIcon && (
                    favoriteIcon.classList.contains('favorited') ||
                    favoriteIcon.classList.contains('active') ||
                    favoriteIcon.style.color === 'red'
                )
            };
        }, firstCard);
        
        testResults.results.push({
            step: 7,
            description: 'Favorited card with hover (should show all elements)',
            screenshot: 'focused_step7_favorited_with_hover.png',
            state: favoritedHoverState,
            status: 'captured'
        });

        // Summary
        testResults.summary = {
            totalSteps: testResults.results.length,
            completedSteps: testResults.results.filter(r => r.status !== 'error').length,
            overallStatus: 'completed'
        };

        console.log('Focused test completed successfully!');

    } catch (error) {
        console.error('Test failed:', error);
        testResults.error = error.message;
        testResults.summary = { overallStatus: 'ERROR' };
        
        // Take error screenshot
        try {
            await page.screenshot({ path: 'focused_test_error_state.png' });
        } catch (screenshotError) {
            console.error('Could not take error screenshot:', screenshotError);
        }
    } finally {
        await browser.close();
    }

    // Save test results
    fs.writeFileSync('focused_favorite_behavior_test_results.json', JSON.stringify(testResults, null, 2));
    return testResults;
}

// Run the test
testCorrectedFavoriteBehaviorFocused().then(results => {
    console.log('Test results saved to focused_favorite_behavior_test_results.json');
    process.exit(0);
}).catch(error => {
    console.error('Failed to run test:', error);
    process.exit(1);
});