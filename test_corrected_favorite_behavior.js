const puppeteer = require('puppeteer');
const fs = require('fs');

async function testCorrectedFavoriteBehavior() {
    const browser = await puppeteer.launch({ 
        headless: false,
        slowMo: 100,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    const testResults = {
        timestamp: new Date().toISOString(),
        testName: 'Corrected Favorite Icon Behavior Test',
        results: []
    };

    try {
        console.log('Starting corrected favorite behavior test...');
        
        // Step 1: Navigate to test home page
        console.log('Step 1: Navigating to test home page...');
        await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.screenshot({ path: 'corrected_step1_initial_page.png' });
        testResults.results.push({
            step: 1,
            description: 'Initial page load',
            screenshot: 'corrected_step1_initial_page.png',
            status: 'captured'
        });

        // Step 2: Test non-favorited card behavior
        console.log('Step 2: Testing non-favorited card behavior...');
        
        // Find first game card
        const gameCards = await page.$$('.game-card');
        if (gameCards.length === 0) {
            throw new Error('No game cards found on page');
        }
        
        const firstCard = gameCards[0];
        
        // Test 2a: Non-favorited card without hover (should be clean)
        console.log('Step 2a: Non-favorited card without hover...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({ path: 'corrected_step2a_non_favorited_no_hover.png' });
        
        // Check if overlay elements are hidden
        const overlayHidden = await page.evaluate((card) => {
            const overlay = card.querySelector('.game-overlay');
            if (!overlay) return true; // No overlay means clean
            const computedStyle = window.getComputedStyle(overlay);
            return computedStyle.opacity === '0' || computedStyle.display === 'none';
        }, firstCard);
        
        testResults.results.push({
            step: '2a',
            description: 'Non-favorited card without hover (should be clean)',
            screenshot: 'corrected_step2a_non_favorited_no_hover.png',
            overlayHidden: overlayHidden,
            status: overlayHidden ? 'PASS' : 'FAIL'
        });
        
        // Test 2b: Non-favorited card with hover (should show all elements)
        console.log('Step 2b: Non-favorited card with hover...');
        await firstCard.hover();
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for hover animation
        await page.screenshot({ path: 'corrected_step2b_non_favorited_with_hover.png' });
        
        // Check if all overlay elements are visible
        const hoverElements = await page.evaluate((card) => {
            const overlay = card.querySelector('.game-overlay');
            if (!overlay) return { hasOverlay: false };
            
            const computedStyle = window.getComputedStyle(overlay);
            const isVisible = computedStyle.opacity !== '0' && computedStyle.display !== 'none';
            
            const likeBtn = overlay.querySelector('.like-btn');
            const playCount = overlay.querySelector('.play-count');
            const favoriteIcon = overlay.querySelector('.favorite-icon');
            
            return {
                hasOverlay: true,
                overlayVisible: isVisible,
                hasLikeBtn: !!likeBtn,
                hasPlayCount: !!playCount,
                hasFavoriteIcon: !!favoriteIcon
            };
        }, firstCard);
        
        testResults.results.push({
            step: '2b',
            description: 'Non-favorited card with hover (should show all elements)',
            screenshot: 'corrected_step2b_non_favorited_with_hover.png',
            elements: hoverElements,
            status: (hoverElements.overlayVisible && hoverElements.hasLikeBtn && hoverElements.hasPlayCount && hoverElements.hasFavoriteIcon) ? 'PASS' : 'FAIL'
        });
        
        // Move mouse away to remove hover
        await page.mouse.move(100, 100);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 3: Favorite a game card and test favorited behavior
        console.log('Step 3: Favoriting a game card...');
        
        // Hover over the card again and click favorite
        await firstCard.hover();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const favoriteIcon = await firstCard.$('.favorite-icon');
        if (favoriteIcon) {
            await favoriteIcon.click();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for favorite action to complete
        }
        
        await page.screenshot({ path: 'corrected_step3_after_favoriting.png' });
        
        // Move mouse away to test favorited card without hover
        await page.mouse.move(100, 100);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Test 3a: Favorited card without hover (should show only red heart)
        console.log('Step 3a: Favorited card without hover...');
        await page.screenshot({ path: 'corrected_step3a_favorited_no_hover.png' });
        
        const favoritedNoHoverState = await page.evaluate((card) => {
            const overlay = card.querySelector('.game-overlay');
            const favoriteIcon = card.querySelector('.favorite-icon');
            
            if (!overlay || !favoriteIcon) {
                return { hasElements: false };
            }
            
            const overlayStyle = window.getComputedStyle(overlay);
            const favoriteStyle = window.getComputedStyle(favoriteIcon);
            
            // Check if favorite icon is visible but overlay is not
            const favoriteVisible = favoriteStyle.opacity !== '0' && favoriteStyle.display !== 'none';
            const overlayVisible = overlayStyle.opacity !== '0' && overlayStyle.display !== 'none';
            
            // Check if favorite is filled (red)
            const isFilled = favoriteIcon.classList.contains('favorited') || 
                           favoriteIcon.style.color === 'red' ||
                           favoriteIcon.style.color === 'rgb(255, 0, 0)';
            
            return {
                hasElements: true,
                favoriteVisible: favoriteVisible,
                overlayVisible: overlayVisible,
                isFilled: isFilled
            };
        }, firstCard);
        
        testResults.results.push({
            step: '3a',
            description: 'Favorited card without hover (should show only red heart)',
            screenshot: 'corrected_step3a_favorited_no_hover.png',
            state: favoritedNoHoverState,
            status: (favoritedNoHoverState.favoriteVisible && !favoritedNoHoverState.overlayVisible && favoritedNoHoverState.isFilled) ? 'PASS' : 'NEEDS_REVIEW'
        });
        
        // Test 3b: Favorited card with hover (should show all elements)
        console.log('Step 3b: Favorited card with hover...');
        await firstCard.hover();
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.screenshot({ path: 'corrected_step3b_favorited_with_hover.png' });
        
        const favoritedHoverState = await page.evaluate((card) => {
            const overlay = card.querySelector('.game-overlay');
            if (!overlay) return { hasOverlay: false };
            
            const computedStyle = window.getComputedStyle(overlay);
            const isVisible = computedStyle.opacity !== '0' && computedStyle.display !== 'none';
            
            const likeBtn = overlay.querySelector('.like-btn');
            const playCount = overlay.querySelector('.play-count');
            const favoriteIcon = overlay.querySelector('.favorite-icon');
            
            return {
                hasOverlay: true,
                overlayVisible: isVisible,
                hasLikeBtn: !!likeBtn,
                hasPlayCount: !!playCount,
                hasFavoriteIcon: !!favoriteIcon,
                favoriteStillFilled: favoriteIcon && (favoriteIcon.classList.contains('favorited') || 
                                   favoriteIcon.style.color === 'red' ||
                                   favoriteIcon.style.color === 'rgb(255, 0, 0)')
            };
        }, firstCard);
        
        testResults.results.push({
            step: '3b',
            description: 'Favorited card with hover (should show all elements)',
            screenshot: 'corrected_step3b_favorited_with_hover.png',
            state: favoritedHoverState,
            status: (favoritedHoverState.overlayVisible && favoritedHoverState.hasLikeBtn && 
                    favoritedHoverState.hasPlayCount && favoritedHoverState.hasFavoriteIcon && 
                    favoritedHoverState.favoriteStillFilled) ? 'PASS' : 'FAIL'
        });

        // Step 4: Test game player interface
        console.log('Step 4: Testing game player interface...');
        
        // Click on a game to go to game player interface
        await page.mouse.move(100, 100); // Move away first
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const gameLink = await firstCard.$('a');
        if (gameLink) {
            await gameLink.click();
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        await page.screenshot({ path: 'corrected_step4_game_player_page.png' });
        
        // Test related games cards
        const relatedCards = await page.$$('.related-game-card, .game-card');
        if (relatedCards.length > 0) {
            const relatedCard = relatedCards[0];
            
            // Test without hover
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.screenshot({ path: 'corrected_step4a_related_no_hover.png' });
            
            // Test with hover
            await relatedCard.hover();
            await new Promise(resolve => setTimeout(resolve, 500));
            await page.screenshot({ path: 'corrected_step4b_related_with_hover.png' });
            
            testResults.results.push({
                step: '4',
                description: 'Game player interface related games behavior',
                screenshots: ['corrected_step4_game_player_page.png', 'corrected_step4a_related_no_hover.png', 'corrected_step4b_related_with_hover.png'],
                status: 'captured'
            });
        }

        // Step 5: Final verification
        console.log('Step 5: Final verification...');
        await page.screenshot({ path: 'corrected_step5_final_verification.png' });
        
        testResults.results.push({
            step: '5',
            description: 'Final verification complete',
            screenshot: 'corrected_step5_final_verification.png',
            status: 'completed'
        });

        // Generate summary
        const passCount = testResults.results.filter(r => r.status === 'PASS').length;
        const failCount = testResults.results.filter(r => r.status === 'FAIL').length;
        const reviewCount = testResults.results.filter(r => r.status === 'NEEDS_REVIEW').length;
        
        testResults.summary = {
            totalTests: testResults.results.length,
            passed: passCount,
            failed: failCount,
            needsReview: reviewCount,
            overallStatus: failCount === 0 ? (reviewCount === 0 ? 'PASS' : 'NEEDS_REVIEW') : 'FAIL'
        };

        console.log('Test completed successfully!');
        console.log(`Summary: ${passCount} passed, ${failCount} failed, ${reviewCount} need review`);

    } catch (error) {
        console.error('Test failed:', error);
        testResults.error = error.message;
        testResults.summary = { overallStatus: 'ERROR' };
    } finally {
        await browser.close();
    }

    // Save test results
    fs.writeFileSync('corrected_favorite_behavior_test_results.json', JSON.stringify(testResults, null, 2));
    return testResults;
}

// Run the test
testCorrectedFavoriteBehavior().then(results => {
    console.log('Test results saved to corrected_favorite_behavior_test_results.json');
    process.exit(0);
}).catch(error => {
    console.error('Failed to run test:', error);
    process.exit(1);
});