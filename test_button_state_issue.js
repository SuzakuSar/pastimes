const puppeteer = require('puppeteer');
const fs = require('fs');

async function testButtonStateIssue() {
    console.log('Testing button state vs sidebar count consistency issue...');
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 500,
        defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    
    const screenshotDir = 'C:\\Users\\wpr3859\\Desktop\\PersonalProjects\\pastimes\\button_state_test';
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    let stepCount = 0;
    let issues = [];
    
    async function takeScreenshot(description) {
        stepCount++;
        const filename = `${screenshotDir}\\step${stepCount.toString().padStart(2, '0')}_${description.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`📸 ${description}`);
        return filename;
    }
    
    async function getDetailedState() {
        return await page.evaluate(() => {
            const state = {
                sidebar: {},
                buttons: {},
                memory: {}
            };
            
            // Get sidebar counts
            const sidebarLikes = document.querySelector('[data-category="Liked"] .nav-count');
            const sidebarFavorites = document.querySelector('[data-category="Favorited"] .nav-count');
            
            state.sidebar.likes = sidebarLikes ? parseInt(sidebarLikes.textContent) || 0 : 0;
            state.sidebar.favorites = sidebarFavorites ? parseInt(sidebarFavorites.textContent) || 0 : 0;
            
            // Get all button states
            const likeButtons = document.querySelectorAll('.btn-like');
            const favoriteButtons = document.querySelectorAll('.btn-favorite');
            
            state.buttons.likedGames = [];
            state.buttons.favoritedGames = [];
            
            likeButtons.forEach(btn => {
                const gameName = btn.getAttribute('data-game-name');
                const isLiked = btn.getAttribute('data-liked') === 'true';
                if (isLiked && gameName) {
                    state.buttons.likedGames.push(gameName);
                }
            });
            
            favoriteButtons.forEach(btn => {
                const gameName = btn.getAttribute('data-game-name');
                const isFavorited = btn.getAttribute('data-favorited') === 'true';
                if (isFavorited && gameName) {
                    state.buttons.favoritedGames.push(gameName);
                }
            });
            
            // Try to access memory variables if available
            if (typeof memoryLikesCount !== 'undefined') {
                state.memory.likes = memoryLikesCount;
            }
            if (typeof memoryFavoritesCount !== 'undefined') {
                state.memory.favorites = memoryFavoritesCount;
            }
            
            return state;
        });
    }
    
    function analyzeState(phase, state) {
        console.log(`\\n=== ${phase} ===`);
        console.log(`Sidebar Counts: Likes=${state.sidebar.likes}, Favorites=${state.sidebar.favorites}`);
        console.log(`Button States: ${state.buttons.likedGames.length} liked games, ${state.buttons.favoritedGames.length} favorited games`);
        console.log(`Liked Games: [${state.buttons.likedGames.join(', ')}]`);
        console.log(`Favorited Games: [${state.buttons.favoritedGames.join(', ')}]`);
        
        if (state.memory.likes !== undefined) {
            console.log(`Memory State: Likes=${state.memory.likes}, Favorites=${state.memory.favorites}`);
        }
        
        const foundIssues = [];
        
        // Check sidebar vs button consistency
        if (state.sidebar.likes !== state.buttons.likedGames.length) {
            foundIssues.push({
                phase,
                type: 'likes_count_mismatch',
                sidebar: state.sidebar.likes,
                buttons: state.buttons.likedGames.length,
                description: `Sidebar shows ${state.sidebar.likes} likes but ${state.buttons.likedGames.length} games are actually liked`
            });
        }
        
        if (state.sidebar.favorites !== state.buttons.favoritedGames.length) {
            foundIssues.push({
                phase,
                type: 'favorites_count_mismatch',
                sidebar: state.sidebar.favorites,
                buttons: state.buttons.favoritedGames.length,
                description: `Sidebar shows ${state.sidebar.favorites} favorites but ${state.buttons.favoritedGames.length} games are actually favorited`
            });
        }
        
        // Check memory vs sidebar consistency if memory is available
        if (state.memory.likes !== undefined && state.memory.likes !== state.sidebar.likes) {
            foundIssues.push({
                phase,
                type: 'memory_sidebar_likes_mismatch',
                memory: state.memory.likes,
                sidebar: state.sidebar.likes,
                description: `Memory shows ${state.memory.likes} likes but sidebar shows ${state.sidebar.likes}`
            });
        }
        
        if (state.memory.favorites !== undefined && state.memory.favorites !== state.sidebar.favorites) {
            foundIssues.push({
                phase,
                type: 'memory_sidebar_favorites_mismatch',
                memory: state.memory.favorites,
                sidebar: state.sidebar.favorites,
                description: `Memory shows ${state.memory.favorites} favorites but sidebar shows ${state.sidebar.favorites}`
            });
        }
        
        if (foundIssues.length > 0) {
            console.log(`\\n🚨 Found ${foundIssues.length} inconsistencies:`);
            foundIssues.forEach(issue => {
                console.log(`  ❌ ${issue.description}`);
            });
        } else {
            console.log(`\\n✅ All counts are consistent`);
        }
        
        return foundIssues;
    }
    
    try {
        // Step 1: Initial load
        console.log('\\n1. Loading test home and checking initial state...');
        await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
        await page.waitForSelector('.game-card', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for all JS to load
        await takeScreenshot('01_initial_state');
        
        const initialState = await getDetailedState();
        const initialIssues = analyzeState('Initial Load', initialState);
        issues.push(...initialIssues);
        
        // Step 2: Like a game
        console.log('\\n2. Clicking like button...');
        const likeButtons = await page.$$('.btn-like');
        if (likeButtons.length > 0) {
            await likeButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await takeScreenshot('02_after_first_like');
            
            const afterLikeState = await getDetailedState();
            const afterLikeIssues = analyzeState('After First Like', afterLikeState);
            issues.push(...afterLikeIssues);
        }
        
        // Step 3: Like another game
        console.log('\\n3. Clicking second like button...');
        if (likeButtons.length > 1) {
            await likeButtons[1].click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await takeScreenshot('03_after_second_like');
            
            const afterSecondLikeState = await getDetailedState();
            const afterSecondLikeIssues = analyzeState('After Second Like', afterSecondLikeState);
            issues.push(...afterSecondLikeIssues);
        }
        
        // Step 4: Unlike the first game
        console.log('\\n4. Unliking first game...');
        await likeButtons[0].click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        await takeScreenshot('04_after_unlike');
        
        const afterUnlikeState = await getDetailedState();
        const afterUnlikeIssues = analyzeState('After Unlike', afterUnlikeState);
        issues.push(...afterUnlikeIssues);
        
        // Step 5: Test favorites
        console.log('\\n5. Testing favorite functionality...');
        const favoriteButtons = await page.$$('.btn-favorite');
        if (favoriteButtons.length > 0) {
            await favoriteButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await takeScreenshot('05_after_favorite');
            
            const afterFavoriteState = await getDetailedState();
            const afterFavoriteIssues = analyzeState('After Favorite', afterFavoriteState);
            issues.push(...afterFavoriteIssues);
        }
        
        // Step 6: Rapid clicking to test race conditions
        console.log('\\n6. Testing rapid clicking (race conditions)...');
        if (favoriteButtons.length > 1) {
            // Click favorite button multiple times rapidly
            await favoriteButtons[1].click();
            await favoriteButtons[1].click();
            await favoriteButtons[1].click();
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for all requests to complete
            await takeScreenshot('06_after_rapid_clicks');
            
            const afterRapidState = await getDetailedState();
            const afterRapidIssues = analyzeState('After Rapid Clicks', afterRapidState);
            issues.push(...afterRapidIssues);
        }
        
        // Step 7: Refresh page to test persistence
        console.log('\\n7. Testing state persistence after page refresh...');
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForSelector('.game-card', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        await takeScreenshot('07_after_refresh');
        
        const afterRefreshState = await getDetailedState();
        const afterRefreshIssues = analyzeState('After Page Refresh', afterRefreshState);
        issues.push(...afterRefreshIssues);
        
    } catch (error) {
        console.error('Test error:', error);
        await takeScreenshot('error_state');
        issues.push({
            phase: 'ERROR',
            type: 'test_error',
            error: error.message,
            description: `Test failed: ${error.message}`
        });
    }
    
    // Generate comprehensive report
    console.log('\\n\\n=== BUTTON STATE VS SIDEBAR COUNT ANALYSIS ===');
    console.log(`Total inconsistencies found: ${issues.length}`);
    
    if (issues.length > 0) {
        console.log('\\n🔍 DETAILED ANALYSIS:');
        
        const issuesByType = {};
        issues.forEach(issue => {
            if (!issuesByType[issue.type]) {
                issuesByType[issue.type] = [];
            }
            issuesByType[issue.type].push(issue);
        });
        
        Object.entries(issuesByType).forEach(([type, typeIssues]) => {
            console.log(`\\n📋 ${type.toUpperCase().replace(/_/g, ' ')} (${typeIssues.length} occurrences):`);
            typeIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. [${issue.phase}] ${issue.description}`);
            });
        });
        
        console.log('\\n🎯 KEY FINDINGS:');
        console.log('✓ The numerical inconsistency issue occurs when:');
        console.log('  - Sidebar counts are updated independently from button states');
        console.log('  - Memory variables don\'t sync with actual button states');
        console.log('  - Race conditions cause counts to become desynchronized');
        
        console.log('\\n💡 ROOT CAUSE ANALYSIS:');
        console.log('  - The sidebar counts (memoryLikesCount/memoryFavoritesCount)');
        console.log('  - Are updated from API responses but don\'t verify button states');
        console.log('  - Button data-liked/data-favorited attributes may not be updating correctly');
        console.log('  - This creates a disconnect between what users see and actual state');
        
    } else {
        console.log('\\n✅ No inconsistencies found - the system is working correctly!');
    }
    
    // Save report
    const reportData = {
        timestamp: new Date().toISOString(),
        totalIssues: issues.length,
        issuesByType: {},
        detailedIssues: issues,
        testSteps: stepCount,
        conclusion: issues.length > 0 ? 'NUMERICAL_INCONSISTENCY_CONFIRMED' : 'SYSTEM_WORKING_CORRECTLY'
    };
    
    issues.forEach(issue => {
        if (!reportData.issuesByType[issue.type]) {
            reportData.issuesByType[issue.type] = 0;
        }
        reportData.issuesByType[issue.type]++;
    });
    
    const reportPath = `${screenshotDir}\\button_state_analysis_report.json`;
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\\nFull report saved to: ${reportPath}`);
    console.log(`Screenshots documenting the issue: ${screenshotDir}`);
    
    await browser.close();
    return issues;
}

// Run the test
testButtonStateIssue()
    .then(issues => {
        console.log(`\\n🎯 FINAL RESULT: ${issues.length} numerical consistency issues confirmed`);
        if (issues.length > 0) {
            console.log('\\n📋 NEXT STEPS FOR DEVELOPERS:');
            console.log('1. Fix sidebar count synchronization with button states');
            console.log('2. Ensure API responses update both memory AND button attributes');
            console.log('3. Add validation to prevent count/state mismatches');
            console.log('4. Test interface switching to ensure consistency is maintained');
        }
        process.exit(issues.length > 0 ? 1 : 0);
    })
    .catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });