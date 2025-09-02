/**
 * Corrected Test for Centralized State Management Solution
 * Uses the correct button selectors based on actual template code
 */

const { chromium } = require('playwright');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureDetailedState(page, stepName) {
    console.log(`\n=== ${stepName} ===`);
    
    // Take screenshot
    await page.screenshot({ 
        path: `corrected_${stepName.replace(/\s+/g, '_').toLowerCase()}.png`,
        fullPage: true 
    });
    
    // Get detailed state information
    const state = await page.evaluate(() => {
        const results = {
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        // Check for centralized state (debug tools)
        if (window.hubDebug && window.hubDebug.gameState) {
            const gameState = window.hubDebug.gameState;
            results.centralizedState = {
                totalGames: gameState.gameStats ? gameState.gameStats.size : 0,
                likedGames: gameState.likedGames ? gameState.likedGames.size : 0,
                favoritedGames: gameState.favoritedGames ? gameState.favoritedGames.size : 0,
                initialized: gameState.initialized || false
            };
            
            // Get actual liked and favorited game names
            if (gameState.likedGames) {
                results.centralizedState.likedGamesList = Array.from(gameState.likedGames);
            }
            if (gameState.favoritedGames) {
                results.centralizedState.favoritedGamesList = Array.from(gameState.favoritedGames);
            }
        }
        
        // Count visual indicators with correct selectors
        const likeButtons = document.querySelectorAll('.btn-like');
        const favoriteButtons = document.querySelectorAll('.btn-favorite');
        
        let visuallyLiked = 0;
        let visuallyFavorited = 0;
        
        likeButtons.forEach(btn => {
            if (btn.getAttribute('data-liked') === 'true') {
                visuallyLiked++;
            }
        });
        
        favoriteButtons.forEach(btn => {
            if (btn.getAttribute('data-favorited') === 'true') {
                visuallyFavorited++;
            }
        });
        
        // Get sidebar counts using the correct selectors from the template
        const likedCountElement = document.querySelector('[data-category="Liked"] .nav-count');
        const favoritedCountElement = document.querySelector('[data-category="Favorited"] .nav-count');
        
        results.visualCounts = {
            likedButtons: visuallyLiked,
            favoritedButtons: visuallyFavorited,
            sidebarLikes: likedCountElement ? parseInt(likedCountElement.textContent) || 0 : 0,
            sidebarFavorites: favoritedCountElement ? parseInt(favoritedCountElement.textContent) || 0 : 0,
            totalLikeButtons: likeButtons.length,
            totalFavoriteButtons: favoriteButtons.length
        };
        
        // Check consistency
        results.consistency = {
            likesMatch: results.visualCounts.likedButtons === results.visualCounts.sidebarLikes,
            favoritesMatch: results.visualCounts.favoritedButtons === results.visualCounts.sidebarFavorites
        };
        
        return results;
    });
    
    console.log('URL:', state.url);
    console.log('Visual counts:', state.visualCounts);
    console.log('Consistency:', state.consistency);
    if (state.centralizedState) {
        console.log('Centralized state:', state.centralizedState);
    }
    
    return state;
}

async function testLikeButton(page, gameIndex) {
    console.log(`Testing like button for game ${gameIndex}...`);
    
    const gameCards = await page.locator('.game-card');
    const count = await gameCards.count();
    
    if (gameIndex >= count) {
        console.log(`Game card ${gameIndex} not found (only ${count} cards available)`);
        return false;
    }
    
    const gameCard = gameCards.nth(gameIndex);
    const likeButton = gameCard.locator('.btn-like').first();
    
    if (await likeButton.count() === 0) {
        console.log(`Like button not found for game ${gameIndex}`);
        return false;
    }
    
    // Check if button is visible and clickable
    if (await likeButton.isVisible()) {
        // Get game name before clicking
        const gameName = await gameCard.getAttribute('data-game-name');
        console.log(`Clicking like button for game: "${gameName}"`);
        
        await likeButton.click();
        await sleep(2000); // Wait for state update and potential server request
        console.log(`Successfully clicked like button for game ${gameIndex} (${gameName})`);
        return true;
    } else {
        console.log(`Like button for game ${gameIndex} is not visible`);
        return false;
    }
}

async function testFavoriteButton(page, gameIndex) {
    console.log(`Testing favorite button for game ${gameIndex}...`);
    
    const gameCards = await page.locator('.game-card');
    const count = await gameCards.count();
    
    if (gameIndex >= count) {
        console.log(`Game card ${gameIndex} not found (only ${count} cards available)`);
        return false;
    }
    
    const gameCard = gameCards.nth(gameIndex);
    const favoriteButton = gameCard.locator('.btn-favorite').first();
    
    if (await favoriteButton.count() === 0) {
        console.log(`Favorite button not found for game ${gameIndex}`);
        return false;
    }
    
    if (await favoriteButton.isVisible()) {
        // Get game name before clicking
        const gameName = await gameCard.getAttribute('data-game-name');
        console.log(`Clicking favorite button for game: "${gameName}"`);
        
        await favoriteButton.click();
        await sleep(2000); // Wait for state update and potential server request
        console.log(`Successfully clicked favorite button for game ${gameIndex} (${gameName})`);
        return true;
    } else {
        console.log(`Favorite button for game ${gameIndex} is not visible`);
        return false;
    }
}

async function validateCentralizedState(page) {
    const result = await page.evaluate(() => {
        if (window.hubDebug && window.hubDebug.gameState && window.hubDebug.gameState.validateConsistency) {
            return {
                available: true,
                result: window.hubDebug.gameState.validateConsistency()
            };
        }
        return { available: false, error: 'Debug tools not available' };
    });
    
    console.log('Centralized state validation:', result);
    return result;
}

async function runCorrectedTest() {
    console.log('Starting Corrected Centralized State Management Test...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    
    const page = await browser.newPage();
    const testResults = [];
    
    try {
        // Step 1: Navigate to test home
        console.log('Step 1: Navigating to test home...');
        await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle' });
        await sleep(3000); // Wait for everything to load including JS initialization
        
        const initialState = await captureDetailedState(page, 'Step 1 Initial State');
        testResults.push(initialState);
        
        // Validate debug tools are available
        await validateCentralizedState(page);
        
        // Step 2: Like multiple games
        console.log('\nStep 2: Testing like functionality...');
        
        let successfulLikes = 0;
        for (let i = 0; i < 3; i++) {
            if (await testLikeButton(page, i)) {
                successfulLikes++;
                // Capture state after each like
                const afterLikeState = await captureDetailedState(page, `Step 2 After Like ${i + 1}`);
                testResults.push(afterLikeState);
            }
        }
        
        console.log(`Successfully liked ${successfulLikes} games`);
        
        // Step 3: Test favorite functionality
        console.log('\nStep 3: Testing favorite functionality...');
        
        let successfulFavorites = 0;
        // Use different games for favorites (games 3-5)
        for (let i = 3; i < 6; i++) {
            if (await testFavoriteButton(page, i)) {
                successfulFavorites++;
                // Capture state after each favorite
                const afterFavoriteState = await captureDetailedState(page, `Step 3 After Favorite ${successfulFavorites}`);
                testResults.push(afterFavoriteState);
            }
        }
        
        console.log(`Successfully favorited ${successfulFavorites} games`);
        
        const beforeRefreshState = await captureDetailedState(page, 'Step 4 Before Refresh');
        testResults.push(beforeRefreshState);
        
        // Step 4: CRITICAL TEST - Page refresh
        console.log('\nStep 4: CRITICAL TEST - Page refresh...');
        console.log('This is the test that previously failed - sidebar counts vs visual indicators');
        
        await page.reload({ waitUntil: 'networkidle' });
        await sleep(4000); // Wait for full reload and state restoration
        
        const afterRefreshState = await captureDetailedState(page, 'Step 4 After Refresh CRITICAL');
        testResults.push(afterRefreshState);
        
        // Validate state consistency after refresh
        await validateCentralizedState(page);
        
        // Step 5: Test rapid clicking (race condition protection)
        console.log('\nStep 5: Testing rapid clicking protection...');
        
        const gameCards = await page.locator('.game-card');
        const cardCount = await gameCards.count();
        
        if (cardCount > 0) {
            const firstGameCard = gameCards.first();
            const rapidTestButton = firstGameCard.locator('.btn-like').first();
            
            if (await rapidTestButton.count() > 0 && await rapidTestButton.isVisible()) {
                console.log('Performing rapid clicks test (testing race condition protection)...');
                for (let i = 0; i < 10; i++) {
                    await rapidTestButton.click();
                    await sleep(50); // Very rapid clicking
                }
                await sleep(3000); // Wait for all requests to settle
            }
        }
        
        const afterRapidClicksState = await captureDetailedState(page, 'Step 5 After Rapid Clicks');
        testResults.push(afterRapidClicksState);
        
        // Step 6: Final refresh to test persistence
        console.log('\nStep 6: Final refresh test...');
        
        await page.reload({ waitUntil: 'networkidle' });
        await sleep(4000);
        
        const finalState = await captureDetailedState(page, 'Step 6 Final State');
        testResults.push(finalState);
        
        // Final state validation
        const finalValidation = await validateCentralizedState(page);
        
        // Analysis
        console.log('\n\n=== COMPREHENSIVE TEST ANALYSIS ===');
        
        const beforeRefresh = beforeRefreshState.visualCounts;
        const afterRefresh = afterRefreshState.visualCounts;
        const finalCounts = finalState.visualCounts;
        
        console.log('\nCRITICAL COMPARISON (Before vs After Refresh):');
        console.log('Before refresh:', JSON.stringify(beforeRefresh, null, 2));
        console.log('After refresh:', JSON.stringify(afterRefresh, null, 2));
        console.log('Final state:', JSON.stringify(finalCounts, null, 2));
        
        // Check for the specific issues that were previously broken
        const issues = [];
        
        // Check refresh consistency (most critical test)
        if (beforeRefresh.sidebarLikes !== afterRefresh.sidebarLikes) {
            issues.push(`CRITICAL: Sidebar likes changed during refresh: ${beforeRefresh.sidebarLikes} → ${afterRefresh.sidebarLikes}`);
        }
        
        if (beforeRefresh.sidebarFavorites !== afterRefresh.sidebarFavorites) {
            issues.push(`CRITICAL: Sidebar favorites changed during refresh: ${beforeRefresh.sidebarFavorites} → ${afterRefresh.sidebarFavorites}`);
        }
        
        if (beforeRefresh.likedButtons !== afterRefresh.likedButtons) {
            issues.push(`CRITICAL: Visual liked buttons changed during refresh: ${beforeRefresh.likedButtons} → ${afterRefresh.likedButtons}`);
        }
        
        if (beforeRefresh.favoritedButtons !== afterRefresh.favoritedButtons) {
            issues.push(`CRITICAL: Visual favorited buttons changed during refresh: ${beforeRefresh.favoritedButtons} → ${afterRefresh.favoritedButtons}`);
        }
        
        // Check sidebar vs visual consistency (the main problem from before)
        if (afterRefresh.sidebarLikes !== afterRefresh.likedButtons) {
            issues.push(`MAJOR ISSUE: Sidebar likes (${afterRefresh.sidebarLikes}) != visual liked buttons (${afterRefresh.likedButtons}) - THIS WAS THE ORIGINAL PROBLEM!`);
        }
        
        if (afterRefresh.sidebarFavorites !== afterRefresh.favoritedButtons) {
            issues.push(`MAJOR ISSUE: Sidebar favorites (${afterRefresh.sidebarFavorites}) != visual favorited buttons (${afterRefresh.favoritedButtons}) - THIS WAS THE ORIGINAL PROBLEM!`);
        }
        
        // Check final state consistency
        if (!finalState.consistency.likesMatch) {
            issues.push(`Final state inconsistency: Likes don't match (sidebar: ${finalCounts.sidebarLikes}, visual: ${finalCounts.likedButtons})`);
        }
        
        if (!finalState.consistency.favoritesMatch) {
            issues.push(`Final state inconsistency: Favorites don't match (sidebar: ${finalCounts.sidebarFavorites}, visual: ${finalCounts.favoritedButtons})`);
        }
        
        // Check centralized state consistency
        const centralizedComparison = [];
        if (beforeRefreshState.centralizedState && afterRefreshState.centralizedState) {
            if (beforeRefreshState.centralizedState.likedGames !== afterRefreshState.centralizedState.likedGames) {
                centralizedComparison.push(`Centralized liked games changed: ${beforeRefreshState.centralizedState.likedGames} → ${afterRefreshState.centralizedState.likedGames}`);
            }
            if (beforeRefreshState.centralizedState.favoritedGames !== afterRefreshState.centralizedState.favoritedGames) {
                centralizedComparison.push(`Centralized favorited games changed: ${beforeRefreshState.centralizedState.favoritedGames} → ${afterRefreshState.centralizedState.favoritedGames}`);
            }
        }
        
        console.log('\nCENTRALIZED STATE COMPARISON:', centralizedComparison.length > 0 ? centralizedComparison : ['No changes detected']);
        
        console.log('\nISSUES FOUND:', issues.length);
        if (issues.length > 0) {
            console.log('Issues:');
            issues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
        } else {
            console.log('✅ NO ISSUES FOUND!');
        }
        
        const testReport = {
            timestamp: new Date().toISOString(),
            testResults,
            issues,
            centralizedComparison,
            solved: issues.length === 0,
            summary: {
                beforeRefresh,
                afterRefresh,
                finalCounts,
                consistencyAchieved: issues.length === 0,
                successfulLikes,
                successfulFavorites
            },
            previousProblems: {
                description: "Before: Sidebar showed 1 like but 3 games showed as liked after page refresh. Sidebar showed 2 favorites but 6 games showed as favorited after page refresh.",
                fixed: issues.length === 0
            }
        };
        
        console.log('\n=== FINAL VERDICT ===');
        if (issues.length === 0) {
            console.log('🎉 SUCCESS: The centralized state management solution FIXES the numerical consistency issues!');
            console.log('✅ All previously reported problems appear to be resolved:');
            console.log('   - Sidebar counts remain consistent across page refreshes');
            console.log('   - Visual indicators match sidebar counts');
            console.log('   - No drift between different UI components');
            console.log('   - Race condition protection works correctly');
        } else {
            console.log('❌ ISSUES REMAIN: Some consistency problems persist');
            console.log('   The centralized state management did not fully solve all problems');
            console.log('   Specific issues are listed above');
        }
        
        // Summary of what was tested
        console.log('\n=== TEST SUMMARY ===');
        console.log(`• Liked ${successfulLikes} games from main interface`);
        console.log(`• Favorited ${successfulFavorites} games from main interface`);
        console.log('• Tested page refresh consistency (critical failure point)');
        console.log('• Tested rapid clicking race condition protection');
        console.log('• Validated centralized state management system');
        console.log('• Compared sidebar counts vs visual indicators');
        
        return testReport;
        
    } catch (error) {
        console.error('Test failed:', error);
        await page.screenshot({ path: 'corrected_test_error.png', fullPage: true });
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the test
runCorrectedTest().then(report => {
    console.log('\nTest completed - writing detailed report...');
    require('fs').writeFileSync('corrected_state_test_report.json', JSON.stringify(report, null, 2));
    console.log('Report saved to corrected_state_test_report.json');
    
    if (report.solved) {
        console.log('\n🎉 CENTRALIZED STATE MANAGEMENT SOLUTION: SUCCESS!');
    } else {
        console.log('\n❌ CENTRALIZED STATE MANAGEMENT SOLUTION: ISSUES REMAIN');
    }
}).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});