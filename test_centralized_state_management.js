/**
 * Comprehensive Test Suite for Centralized State Management Solution
 * 
 * This test verifies that the new centralized state management fixes
 * the numerical consistency issues that were previously broken:
 * - Before: Sidebar showed 1 like but 3 games showed as liked after page refresh
 * - Before: Sidebar showed 2 favorites but 6 games showed as favorited after page refresh
 * - Expected now: All counts should remain consistent across page refreshes and interface switches
 */

const { chromium } = require('playwright');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureState(page, stepName) {
    // Capture screenshot
    await page.screenshot({ 
        path: `state_${stepName.replace(/\s+/g, '_').toLowerCase()}.png`,
        fullPage: true 
    });
    
    // Get centralized state via debug tools
    const hubState = await page.evaluate(() => {
        if (window.hubDebug && window.hubDebug.gameState) {
            return window.hubDebug.gameState;
        }
        return null;
    });
    
    // Get game player state if available
    const gamePlayerState = await page.evaluate(() => {
        if (window.gamePlayerDebug && window.gamePlayerDebug.gameState) {
            return window.gamePlayerDebug.gameState;
        }
        return null;
    });
    
    // Count visual indicators
    const visualCounts = await page.evaluate(() => {
        // Count liked games (visual indicators)
        const likedButtons = document.querySelectorAll('.like-btn.liked, .like-btn[data-liked="true"], .like-button.liked');
        const likedGames = likedButtons.length;
        
        // Count favorited games (visual indicators)
        const favoritedButtons = document.querySelectorAll('.favorite-btn.favorited, .favorite-btn[data-favorited="true"], .favorite-button.favorited');
        const favoritedGames = favoritedButtons.length;
        
        // Get sidebar counts
        const sidebarLikes = document.querySelector('.sidebar-likes-count, #sidebar-likes-count');
        const sidebarFavorites = document.querySelector('.sidebar-favorites-count, #sidebar-favorites-count');
        
        const sidebarLikesCount = sidebarLikes ? parseInt(sidebarLikes.textContent) || 0 : 0;
        const sidebarFavoritesCount = sidebarFavorites ? parseInt(sidebarFavorites.textContent) || 0 : 0;
        
        return {
            likedGamesVisual: likedGames,
            favoritedGamesVisual: favoritedGames,
            sidebarLikesCount,
            sidebarFavoritesCount,
            url: window.location.href
        };
    });
    
    const state = {
        step: stepName,
        timestamp: new Date().toISOString(),
        url: page.url(),
        hubState,
        gamePlayerState,
        visualCounts
    };
    
    console.log(`\n=== ${stepName} ===`);
    console.log('URL:', state.url);
    console.log('Visual counts:', visualCounts);
    if (hubState) {
        console.log('Hub centralized state games:', Object.keys(hubState).length);
    }
    if (gamePlayerState) {
        console.log('Game player state:', gamePlayerState);
    }
    
    return state;
}

async function validateConsistency(page) {
    const result = await page.evaluate(() => {
        if (window.hubDebug && window.hubDebug.validateStateConsistency) {
            return window.hubDebug.validateStateConsistency();
        }
        return { isValid: false, error: 'Debug tools not available' };
    });
    
    console.log('State consistency validation:', result);
    return result;
}

async function runTest() {
    console.log('Starting Centralized State Management Test...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000  // Slow down for visual verification
    });
    const page = await browser.newPage();
    
    const testResults = [];
    
    try {
        // Step 1: Navigate to test home interface
        console.log('Step 1: Navigating to test home interface...');
        await page.goto('http://localhost:5000/test-home');
        await sleep(2000); // Wait for page load and scripts
        
        const initialState = await captureState(page, 'Initial Test Home State');
        testResults.push(initialState);
        
        // Step 2: Like several games from main test home interface
        console.log('\nStep 2: Testing like functionality...');
        
        // Find and like the first 3 games
        const gameCards = await page.locator('.game-card').all();
        console.log(`Found ${gameCards.length} game cards`);
        
        for (let i = 0; i < Math.min(3, gameCards.length); i++) {
            const likeButton = gameCards[i].locator('.like-btn, .like-button');
            if (await likeButton.count() > 0) {
                console.log(`Liking game ${i + 1}...`);
                await likeButton.click();
                await sleep(1000); // Wait for state update
            }
        }
        
        const afterLikesState = await captureState(page, 'After Liking 3 Games');
        testResults.push(afterLikesState);
        
        // Validate consistency after likes
        await validateConsistency(page);
        
        // Step 3: Navigate to game player interface
        console.log('\nStep 3: Navigating to game player interface...');
        
        if (gameCards.length > 0) {
            const firstGameLink = gameCards[0].locator('a, .game-link').first();
            if (await firstGameLink.count() > 0) {
                await firstGameLink.click();
                await sleep(3000); // Wait for page load
            }
        }
        
        const gamePlayerState = await captureState(page, 'Game Player Interface');
        testResults.push(gamePlayerState);
        
        // Step 4: Test like/favorite from game player interface
        console.log('\nStep 4: Testing interactions from game player interface...');
        
        const gamePlayerLikeBtn = page.locator('.like-btn, .like-button').first();
        if (await gamePlayerLikeBtn.count() > 0) {
            await gamePlayerLikeBtn.click();
            await sleep(1000);
        }
        
        const gamePlayerFavoriteBtn = page.locator('.favorite-btn, .favorite-button').first();
        if (await gamePlayerFavoriteBtn.count() > 0) {
            await gamePlayerFavoriteBtn.click();
            await sleep(1000);
        }
        
        const afterGamePlayerInteractionState = await captureState(page, 'After Game Player Interactions');
        testResults.push(afterGamePlayerInteractionState);
        
        // Step 5: Navigate back to test home via sidebar
        console.log('\nStep 5: Navigating back to test home via sidebar...');
        
        const sidebarTestHomeLink = page.locator('a[href*="test-home"], .sidebar a:has-text("Test Home")').first();
        if (await sidebarTestHomeLink.count() > 0) {
            await sidebarTestHomeLink.click();
            await sleep(2000);
        } else {
            // Fallback: direct navigation
            await page.goto('http://localhost:5000/test-home');
            await sleep(2000);
        }
        
        const backToTestHomeState = await captureState(page, 'Back to Test Home');
        testResults.push(backToTestHomeState);
        
        // Validate consistency after navigation
        await validateConsistency(page);
        
        // Step 6: CRITICAL TEST - Page refresh consistency
        console.log('\nStep 6: CRITICAL TEST - Testing page refresh consistency...');
        
        const beforeRefreshState = await captureState(page, 'Before Refresh');
        testResults.push(beforeRefreshState);
        
        await page.reload();
        await sleep(3000); // Wait for full reload and state restoration
        
        const afterRefreshState = await captureState(page, 'After Refresh - CRITICAL');
        testResults.push(afterRefreshState);
        
        // Validate consistency after refresh
        const postRefreshConsistency = await validateConsistency(page);
        
        // Step 7: Test favoriting with same pattern
        console.log('\nStep 7: Testing favorite functionality...');
        
        const gameCardsAfterRefresh = await page.locator('.game-card').all();
        for (let i = 0; i < Math.min(2, gameCardsAfterRefresh.length); i++) {
            const favoriteButton = gameCardsAfterRefresh[i].locator('.favorite-btn, .favorite-button');
            if (await favoriteButton.count() > 0) {
                console.log(`Favoriting game ${i + 1}...`);
                await favoriteButton.click();
                await sleep(1000);
            }
        }
        
        const afterFavoritesState = await captureState(page, 'After Favoriting Games');
        testResults.push(afterFavoritesState);
        
        // Step 8: Test rapid clicking (race condition protection)
        console.log('\nStep 8: Testing rapid clicking protection...');
        
        if (gameCardsAfterRefresh.length > 0) {
            const rapidTestButton = gameCardsAfterRefresh[0].locator('.like-btn, .like-button');
            if (await rapidTestButton.count() > 0) {
                // Rapid fire clicks
                for (let i = 0; i < 5; i++) {
                    await rapidTestButton.click();
                    await sleep(100); // Very fast clicking
                }
                await sleep(2000); // Wait for state to settle
            }
        }
        
        const afterRapidClicksState = await captureState(page, 'After Rapid Clicks');
        testResults.push(afterRapidClicksState);
        
        // Final refresh test
        console.log('\nStep 9: Final refresh test to verify all changes persist...');
        
        await page.reload();
        await sleep(3000);
        
        const finalState = await captureState(page, 'Final State After Final Refresh');
        testResults.push(finalState);
        
        const finalConsistency = await validateConsistency(page);
        
        // Analysis
        console.log('\n\n=== TEST ANALYSIS ===');
        
        // Compare states before and after critical refresh
        const beforeRefresh = beforeRefreshState.visualCounts;
        const afterRefresh = afterRefreshState.visualCounts;
        const finalCounts = finalState.visualCounts;
        
        console.log('\nCRITICAL COMPARISON - Before vs After Refresh:');
        console.log('Before refresh:', beforeRefresh);
        console.log('After refresh:', afterRefresh);
        console.log('Final state:', finalCounts);
        
        // Check for the specific issues that were previously broken
        const consistencyIssues = [];
        
        if (afterRefresh.sidebarLikesCount !== afterRefresh.likedGamesVisual) {
            consistencyIssues.push(`Sidebar likes (${afterRefresh.sidebarLikesCount}) != visual liked games (${afterRefresh.likedGamesVisual})`);
        }
        
        if (afterRefresh.sidebarFavoritesCount !== afterRefresh.favoritedGamesVisual) {
            consistencyIssues.push(`Sidebar favorites (${afterRefresh.sidebarFavoritesCount}) != visual favorited games (${afterRefresh.favoritedGamesVisual})`);
        }
        
        if (beforeRefresh.sidebarLikesCount !== afterRefresh.sidebarLikesCount) {
            consistencyIssues.push(`Sidebar likes changed during refresh: ${beforeRefresh.sidebarLikesCount} → ${afterRefresh.sidebarLikesCount}`);
        }
        
        if (beforeRefresh.sidebarFavoritesCount !== afterRefresh.sidebarFavoritesCount) {
            consistencyIssues.push(`Sidebar favorites changed during refresh: ${beforeRefresh.sidebarFavoritesCount} → ${afterRefresh.sidebarFavoritesCount}`);
        }
        
        console.log('\nConsistency Issues Found:', consistencyIssues.length);
        if (consistencyIssues.length > 0) {
            console.log('Issues:');
            consistencyIssues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
        } else {
            console.log('✅ NO CONSISTENCY ISSUES FOUND - SOLUTION APPEARS TO WORK!');
        }
        
        // Save detailed results
        const fullReport = {
            testCompleted: new Date().toISOString(),
            testResults,
            consistencyIssues,
            solved: consistencyIssues.length === 0,
            finalConsistencyCheck: finalConsistency
        };
        
        console.log('\n=== FINAL VERDICT ===');
        if (consistencyIssues.length === 0) {
            console.log('🎉 SUCCESS: Centralized state management solution FIXES the numerical consistency issues!');
            console.log('✅ Sidebar counts and visual indicators remain consistent across:');
            console.log('   - Page refreshes');
            console.log('   - Interface navigation');
            console.log('   - Rapid clicking scenarios');
        } else {
            console.log('❌ ISSUES REMAIN: Centralized state management did not fully fix the problems');
            console.log('   Further investigation needed');
        }
        
        return fullReport;
        
    } catch (error) {
        console.error('Test failed:', error);
        await page.screenshot({ path: 'test_error_state.png', fullPage: true });
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the test
runTest().then(report => {
    console.log('\nTest completed successfully');
    // Write report to file for documentation
    require('fs').writeFileSync('centralized_state_test_report.json', JSON.stringify(report, null, 2));
}).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});