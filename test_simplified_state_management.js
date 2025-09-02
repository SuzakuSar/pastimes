/**
 * Simplified Test for Centralized State Management Solution
 * Focus on core functionality and the specific numerical consistency issues
 */

const { chromium } = require('playwright');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureDetailedState(page, stepName) {
    console.log(`\n=== ${stepName} ===`);
    
    // Take screenshot
    await page.screenshot({ 
        path: `simplified_${stepName.replace(/\s+/g, '_').toLowerCase()}.png`,
        fullPage: true 
    });
    
    // Get detailed state information
    const state = await page.evaluate(() => {
        const results = {
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        // Check for centralized state
        if (window.hubDebug && window.hubDebug.gameState) {
            results.centralizedState = {
                totalGames: Object.keys(window.hubDebug.gameState).length,
                games: {}
            };
            
            // Get state for each game
            for (const [gameName, gameData] of Object.entries(window.hubDebug.gameState)) {
                results.centralizedState.games[gameName] = {
                    liked: gameData.liked || false,
                    favorited: gameData.favorited || false
                };
            }
        }
        
        // Count visual indicators
        const likeButtons = document.querySelectorAll('.like-btn, .like-button');
        const favoriteButtons = document.querySelectorAll('.favorite-btn, .favorite-button');
        
        let visuallyLiked = 0;
        let visuallyFavorited = 0;
        
        likeButtons.forEach(btn => {
            if (btn.classList.contains('liked') || btn.getAttribute('data-liked') === 'true') {
                visuallyLiked++;
            }
        });
        
        favoriteButtons.forEach(btn => {
            if (btn.classList.contains('favorited') || btn.getAttribute('data-favorited') === 'true') {
                visuallyFavorited++;
            }
        });
        
        // Get sidebar counts
        const sidebarLikes = document.querySelector('.sidebar-likes-count, #sidebar-likes-count, [data-count="likes"]');
        const sidebarFavorites = document.querySelector('.sidebar-favorites-count, #sidebar-favorites-count, [data-count="favorites"]');
        
        results.visualCounts = {
            likedButtons: visuallyLiked,
            favoritedButtons: visuallyFavorited,
            sidebarLikes: sidebarLikes ? parseInt(sidebarLikes.textContent) || 0 : 0,
            sidebarFavorites: sidebarFavorites ? parseInt(sidebarFavorites.textContent) || 0 : 0,
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
        console.log('Centralized state games:', state.centralizedState.totalGames);
        
        // Count likes and favorites in centralized state
        let centralLikes = 0;
        let centralFavorites = 0;
        for (const game of Object.values(state.centralizedState.games)) {
            if (game.liked) centralLikes++;
            if (game.favorited) centralFavorites++;
        }
        console.log(`Centralized state: ${centralLikes} likes, ${centralFavorites} favorites`);
    }
    
    return state;
}

async function testLikeButton(page, gameIndex) {
    console.log(`Testing like button for game ${gameIndex}...`);
    
    const gameCards = await page.locator('.game-card');
    const gameCard = gameCards.nth(gameIndex);
    
    if (await gameCard.count() === 0) {
        console.log(`Game card ${gameIndex} not found`);
        return false;
    }
    
    const likeButton = gameCard.locator('.like-btn, .like-button').first();
    if (await likeButton.count() === 0) {
        console.log(`Like button not found for game ${gameIndex}`);
        return false;
    }
    
    // Check if button is visible and clickable
    if (await likeButton.isVisible()) {
        await likeButton.click();
        await sleep(1500); // Wait for state update
        console.log(`Successfully clicked like button for game ${gameIndex}`);
        return true;
    } else {
        console.log(`Like button for game ${gameIndex} is not visible`);
        return false;
    }
}

async function testFavoriteButton(page, gameIndex) {
    console.log(`Testing favorite button for game ${gameIndex}...`);
    
    const gameCards = await page.locator('.game-card');
    const gameCard = gameCards.nth(gameIndex);
    
    if (await gameCard.count() === 0) {
        console.log(`Game card ${gameIndex} not found`);
        return false;
    }
    
    const favoriteButton = gameCard.locator('.favorite-btn, .favorite-button').first();
    if (await favoriteButton.count() === 0) {
        console.log(`Favorite button not found for game ${gameIndex}`);
        return false;
    }
    
    if (await favoriteButton.isVisible()) {
        await favoriteButton.click();
        await sleep(1500); // Wait for state update
        console.log(`Successfully clicked favorite button for game ${gameIndex}`);
        return true;
    } else {
        console.log(`Favorite button for game ${gameIndex} is not visible`);
        return false;
    }
}

async function runSimplifiedTest() {
    console.log('Starting Simplified Centralized State Management Test...\n');
    
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
        await sleep(3000); // Wait for everything to load
        
        const initialState = await captureDetailedState(page, 'Initial State');
        testResults.push(initialState);
        
        // Step 2: Like a few games
        console.log('\nStep 2: Testing like functionality...');
        
        let successfulLikes = 0;
        for (let i = 0; i < 3; i++) {
            if (await testLikeButton(page, i)) {
                successfulLikes++;
            }
        }
        
        console.log(`Successfully liked ${successfulLikes} games`);
        
        const afterLikesState = await captureDetailedState(page, 'After Likes');
        testResults.push(afterLikesState);
        
        // Step 3: Test favorite functionality
        console.log('\nStep 3: Testing favorite functionality...');
        
        let successfulFavorites = 0;
        for (let i = 3; i < 5; i++) { // Use different games
            if (await testFavoriteButton(page, i)) {
                successfulFavorites++;
            }
        }
        
        console.log(`Successfully favorited ${successfulFavorites} games`);
        
        const afterFavoritesState = await captureDetailedState(page, 'After Favorites');
        testResults.push(afterFavoritesState);
        
        // Step 4: CRITICAL TEST - Page refresh
        console.log('\nStep 4: CRITICAL TEST - Page refresh...');
        
        const beforeRefreshState = await captureDetailedState(page, 'Before Refresh');
        testResults.push(beforeRefreshState);
        
        console.log('Refreshing page...');
        await page.reload({ waitUntil: 'networkidle' });
        await sleep(4000); // Wait for full reload and state restoration
        
        const afterRefreshState = await captureDetailedState(page, 'After Refresh CRITICAL');
        testResults.push(afterRefreshState);
        
        // Step 5: Test rapid clicking (race condition protection)
        console.log('\nStep 5: Testing rapid clicking protection...');
        
        // Find first like button and rapidly click it
        const firstGameCard = page.locator('.game-card').first();
        const rapidTestButton = firstGameCard.locator('.like-btn, .like-button').first();
        
        if (await rapidTestButton.count() > 0 && await rapidTestButton.isVisible()) {
            console.log('Performing rapid clicks test...');
            for (let i = 0; i < 8; i++) {
                await rapidTestButton.click();
                await sleep(50); // Very rapid clicking
            }
            await sleep(3000); // Wait for state to settle
        }
        
        const afterRapidClicksState = await captureDetailedState(page, 'After Rapid Clicks');
        testResults.push(afterRapidClicksState);
        
        // Step 6: Final refresh to test persistence
        console.log('\nStep 6: Final refresh test...');
        
        await page.reload({ waitUntil: 'networkidle' });
        await sleep(4000);
        
        const finalState = await captureDetailedState(page, 'Final State');
        testResults.push(finalState);
        
        // Analysis
        console.log('\n\n=== TEST ANALYSIS ===');
        
        const beforeRefresh = beforeRefreshState.visualCounts;
        const afterRefresh = afterRefreshState.visualCounts;
        const finalCounts = finalState.visualCounts;
        
        console.log('\nCRITICAL COMPARISON:');
        console.log('Before refresh:', beforeRefresh);
        console.log('After refresh:', afterRefresh);
        console.log('Final state:', finalCounts);
        
        // Check for consistency issues
        const issues = [];
        
        // Check refresh consistency
        if (beforeRefresh.sidebarLikes !== afterRefresh.sidebarLikes) {
            issues.push(`Sidebar likes changed during refresh: ${beforeRefresh.sidebarLikes} → ${afterRefresh.sidebarLikes}`);
        }
        
        if (beforeRefresh.sidebarFavorites !== afterRefresh.sidebarFavorites) {
            issues.push(`Sidebar favorites changed during refresh: ${beforeRefresh.sidebarFavorites} → ${afterRefresh.sidebarFavorites}`);
        }
        
        if (beforeRefresh.likedButtons !== afterRefresh.likedButtons) {
            issues.push(`Visual liked buttons changed during refresh: ${beforeRefresh.likedButtons} → ${afterRefresh.likedButtons}`);
        }
        
        if (beforeRefresh.favoritedButtons !== afterRefresh.favoritedButtons) {
            issues.push(`Visual favorited buttons changed during refresh: ${beforeRefresh.favoritedButtons} → ${afterRefresh.favoritedButtons}`);
        }
        
        // Check sidebar vs visual consistency
        if (afterRefresh.sidebarLikes !== afterRefresh.likedButtons) {
            issues.push(`After refresh: Sidebar likes (${afterRefresh.sidebarLikes}) != visual liked buttons (${afterRefresh.likedButtons})`);
        }
        
        if (afterRefresh.sidebarFavorites !== afterRefresh.favoritedButtons) {
            issues.push(`After refresh: Sidebar favorites (${afterRefresh.sidebarFavorites}) != visual favorited buttons (${afterRefresh.favoritedButtons})`);
        }
        
        // Check final state consistency
        if (!finalState.consistency.likesMatch) {
            issues.push(`Final state: Likes not consistent (sidebar: ${finalCounts.sidebarLikes}, visual: ${finalCounts.likedButtons})`);
        }
        
        if (!finalState.consistency.favoritesMatch) {
            issues.push(`Final state: Favorites not consistent (sidebar: ${finalCounts.sidebarFavorites}, visual: ${finalCounts.favoritedButtons})`);
        }
        
        console.log('\\nISSUES FOUND:', issues.length);
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
            solved: issues.length === 0,
            summary: {
                beforeRefresh,
                afterRefresh,
                finalCounts,
                consistencyAchieved: issues.length === 0
            }
        };
        
        console.log('\n=== FINAL VERDICT ===');
        if (issues.length === 0) {
            console.log('🎉 SUCCESS: The centralized state management solution WORKS!');
            console.log('✅ All numerical consistency issues appear to be resolved');
        } else {
            console.log('❌ ISSUES REMAIN: Some consistency problems persist');
            console.log('   - Review the specific issues listed above');
        }
        
        return testReport;
        
    } catch (error) {
        console.error('Test failed:', error);
        await page.screenshot({ path: 'simplified_test_error.png', fullPage: true });
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the test
runSimplifiedTest().then(report => {
    console.log('\nTest completed - writing report...');
    require('fs').writeFileSync('simplified_state_test_report.json', JSON.stringify(report, null, 2));
    console.log('Report saved to simplified_state_test_report.json');
}).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});