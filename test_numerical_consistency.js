const puppeteer = require('puppeteer');
const fs = require('fs');

async function testNumericalConsistency() {
    console.log('Starting numerical consistency test...');
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 500,
        defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Enable request/response monitoring
    await page.setRequestInterception(true);
    let requestCount = 0;
    
    page.on('request', (request) => {
        console.log(`Request ${++requestCount}: ${request.method()} ${request.url()}`);
        request.continue();
    });
    
    page.on('response', (response) => {
        if (response.url().includes('/api/') || response.url().includes('like') || response.url().includes('favorite')) {
            console.log(`API Response: ${response.status()} ${response.url()}`);
        }
    });
    
    const screenshotDir = 'C:\\Users\\wpr3859\\Desktop\\PersonalProjects\\pastimes\\numerical_consistency_test';
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    let issues = [];
    let stepCount = 0;
    
    async function takeScreenshot(description) {
        stepCount++;
        const filename = `${screenshotDir}\\step${stepCount.toString().padStart(2, '0')}_${description.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`Screenshot taken: ${description}`);
        return filename;
    }
    
    async function getCounts() {
        return await page.evaluate(() => {
            const counts = {};
            
            // Get sidebar counts
            const sidebarElements = document.querySelectorAll('#sidebar .sidebar-item');
            sidebarElements.forEach(el => {
                const nameEl = el.querySelector('.game-name');
                const likeEl = el.querySelector('.like-count');
                const favEl = el.querySelector('.favorite-count');
                
                if (nameEl && likeEl && favEl) {
                    const name = nameEl.textContent.trim();
                    counts[name] = {
                        sidebar_likes: parseInt(likeEl.textContent) || 0,
                        sidebar_favorites: parseInt(favEl.textContent) || 0
                    };
                }
            });
            
            // Get main area counts
            const mainElements = document.querySelectorAll('.game-card, .game-item');
            mainElements.forEach(el => {
                const nameEl = el.querySelector('.game-title, .game-name, h3');
                const likeBtn = el.querySelector('.like-btn, [data-action="like"]');
                const favBtn = el.querySelector('.favorite-btn, [data-action="favorite"]');
                
                if (nameEl) {
                    const name = nameEl.textContent.trim();
                    if (!counts[name]) counts[name] = {};
                    
                    if (likeBtn) {
                        const likeText = likeBtn.textContent || likeBtn.getAttribute('data-count') || '0';
                        counts[name].main_likes = parseInt(likeText.match(/\d+/)?.[0]) || 0;
                    }
                    
                    if (favBtn) {
                        const favText = favBtn.textContent || favBtn.getAttribute('data-count') || '0';
                        counts[name].main_favorites = parseInt(favText.match(/\d+/)?.[0]) || 0;
                    }
                }
            });
            
            return counts;
        });
    }
    
    async function compareAndLogCounts(phase, counts) {
        console.log(`\\n=== ${phase} ===`);
        let hasInconsistency = false;
        
        for (const [gameName, data] of Object.entries(counts)) {
            const sidebarLikes = data.sidebar_likes || 0;
            const mainLikes = data.main_likes || 0;
            const sidebarFavs = data.sidebar_favorites || 0;
            const mainFavs = data.main_favorites || 0;
            
            console.log(`${gameName}:`);
            console.log(`  Likes: Sidebar=${sidebarLikes}, Main=${mainLikes}`);
            console.log(`  Favorites: Sidebar=${sidebarFavs}, Main=${mainFavs}`);
            
            if (sidebarLikes !== mainLikes || sidebarFavs !== mainFavs) {
                hasInconsistency = true;
                const issue = {
                    phase,
                    game: gameName,
                    sidebar_likes: sidebarLikes,
                    main_likes: mainLikes,
                    sidebar_favorites: sidebarFavs,
                    main_favorites: mainFavs,
                    discrepancy: `Likes: ${sidebarLikes}≠${mainLikes}, Favorites: ${sidebarFavs}≠${mainFavs}`
                };
                issues.push(issue);
                console.log(`  ⚠️  INCONSISTENCY DETECTED!`);
            } else {
                console.log(`  ✅ Consistent`);
            }
        }
        
        return hasInconsistency;
    }
    
    try {
        // Step 1: Navigate to test home
        console.log('\\n1. Navigating to test home...');
        await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
        await page.waitForSelector('.game-card, .game-item', { timeout: 10000 });
        await takeScreenshot('initial_test_home');
        
        const initialCounts = await getCounts();
        await compareAndLogCounts('Initial Load', initialCounts);
        
        // Step 2: Like a game from main interface
        console.log('\\n2. Liking a game from main interface...');
        const likeButtons = await page.$$('.like-btn, [data-action="like"]');
        if (likeButtons.length > 0) {
            await likeButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for animation/update
            await takeScreenshot('after_like_main_interface');
            
            const afterLikeCounts = await getCounts();
            await compareAndLogCounts('After Like from Main', afterLikeCounts);
        }
        
        // Step 3: Navigate to game player for that game
        console.log('\\n3. Navigating to game player...');
        const gameLinks = await page.$$('.game-card a, .game-item a, [href*="/game/"]');
        if (gameLinks.length > 0) {
            await gameLinks[0].click();
            await page.waitForSelector('.game-container, .game-player', { timeout: 10000 });
            await takeScreenshot('game_player_loaded');
            
            // Check if counts are visible in game player
            await new Promise(resolve => setTimeout(resolve, 1000));
            const gamePlayerCounts = await getCounts();
            await compareAndLogCounts('Game Player Interface', gamePlayerCounts);
            
            // Try to interact with like/favorite buttons in game player
            const gamePlayerLikeBtn = await page.$('.like-btn, [data-action="like"]');
            if (gamePlayerLikeBtn) {
                console.log('\\n4. Interacting with like button in game player...');
                await gamePlayerLikeBtn.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                await takeScreenshot('game_player_after_like');
                
                const afterGamePlayerLike = await getCounts();
                await compareAndLogCounts('After Like in Game Player', afterGamePlayerLike);
            }
        }
        
        // Step 4: Navigate back to test home via sidebar
        console.log('\\n5. Navigating back to test home...');
        const homeLink = await page.$('a[href*="/test-home"], .sidebar a[href*="/test-home"], nav a[href*="/test-home"]');
        if (homeLink) {
            await homeLink.click();
            await page.waitForSelector('.game-card, .game-item', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 1000));
            await takeScreenshot('back_to_test_home');
            
            const backHomeCounts = await getCounts();
            await compareAndLogCounts('Back to Test Home', backHomeCounts);
        }
        
        // Step 5: Test favoriting and repeat switching
        console.log('\\n6. Testing favorite functionality...');
        const favoriteButtons = await page.$$('.favorite-btn, [data-action="favorite"]');
        if (favoriteButtons.length > 0) {
            await favoriteButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await takeScreenshot('after_favorite_main');
            
            const afterFavoriteCounts = await getCounts();
            await compareAndLogCounts('After Favorite from Main', afterFavoriteCounts);
        }
        
        // Step 6: Navigate to different games and back
        console.log('\\n7. Testing navigation between different games...');
        const allGameLinks = await page.$$('.game-card a, .game-item a, [href*="/game/"]');
        
        for (let i = 0; i < Math.min(3, allGameLinks.length); i++) {
            console.log(`\\n  Testing game ${i + 1}...`);
            
            // Go to game
            await allGameLinks[i].click();
            await page.waitForSelector('.game-container, .game-player', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 1000));
            await takeScreenshot(`game_${i + 1}_loaded`);
            
            const gameSpecificCounts = await getCounts();
            await compareAndLogCounts(`Game ${i + 1} Interface`, gameSpecificCounts);
            
            // Go back to test home
            const backHomeLink = await page.$('a[href*="/test-home"], .sidebar a[href*="/test-home"], nav a[href*="/test-home"]');
            if (backHomeLink) {
                await backHomeLink.click();
                await page.waitForSelector('.game-card, .game-item', { timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 1000));
                await takeScreenshot(`back_from_game_${i + 1}`);
                
                const backFromGameCounts = await getCounts();
                await compareAndLogCounts(`Back from Game ${i + 1}`, backFromGameCounts);
            }
        }
        
        // Step 7: Test suggested games sidebar if present
        console.log('\\n8. Testing suggested games in sidebar...');
        const sidebarGameLinks = await page.$$('#sidebar a, .sidebar a, .suggested-games a');
        
        for (let i = 0; i < Math.min(2, sidebarGameLinks.length); i++) {
            console.log(`\\n  Testing sidebar game ${i + 1}...`);
            
            await sidebarGameLinks[i].click();
            await new Promise(resolve => setTimeout(resolve, 1500));
            await takeScreenshot(`sidebar_game_${i + 1}`);
            
            const sidebarGameCounts = await getCounts();
            await compareAndLogCounts(`Sidebar Game ${i + 1}`, sidebarGameCounts);
        }
        
        // Final check
        console.log('\\n9. Final consistency check...');
        await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await takeScreenshot('final_state');
        
        const finalCounts = await getCounts();
        await compareAndLogCounts('Final State', finalCounts);
        
    } catch (error) {
        console.error('Test error:', error);
        await takeScreenshot('error_state');
        issues.push({
            phase: 'ERROR',
            error: error.message,
            stack: error.stack
        });
    }
    
    // Generate report
    console.log('\\n\\n=== NUMERICAL CONSISTENCY TEST REPORT ===');
    console.log(`Total issues found: ${issues.length}`);
    
    if (issues.length > 0) {
        console.log('\\nISSUES DETECTED:');
        issues.forEach((issue, index) => {
            console.log(`\\n${index + 1}. ${issue.phase}:`);
            if (issue.error) {
                console.log(`   Error: ${issue.error}`);
            } else {
                console.log(`   Game: ${issue.game}`);
                console.log(`   Discrepancy: ${issue.discrepancy}`);
                console.log(`   Sidebar - Likes: ${issue.sidebar_likes}, Favorites: ${issue.sidebar_favorites}`);
                console.log(`   Main - Likes: ${issue.main_likes}, Favorites: ${issue.main_favorites}`);
            }
        });
    } else {
        console.log('\\n✅ No numerical inconsistencies detected!');
    }
    
    // Save detailed report
    const reportPath = `${screenshotDir}\\numerical_consistency_report.json`;
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        totalIssues: issues.length,
        issues: issues,
        testSteps: stepCount
    }, null, 2));
    
    console.log(`\\nDetailed report saved to: ${reportPath}`);
    console.log(`Screenshots saved to: ${screenshotDir}`);
    
    await browser.close();
    return issues;
}

// Run the test
testNumericalConsistency()
    .then(issues => {
        console.log(`\\nTest completed. Found ${issues.length} numerical consistency issues.`);
        process.exit(issues.length > 0 ? 1 : 0);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });