const puppeteer = require('puppeteer');
const fs = require('fs');

async function testSpecificNumericalIssue() {
    console.log('Testing specific numerical consistency issue between interfaces...');
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 300,
        defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    
    // Monitor API calls
    await page.setRequestInterception(true);
    let apiCalls = [];
    
    page.on('request', (request) => {
        if (request.url().includes('/api/')) {
            apiCalls.push({
                url: request.url(),
                method: request.method(),
                timestamp: new Date().toISOString()
            });
        }
        request.continue();
    });
    
    const screenshotDir = 'C:\\Users\\wpr3859\\Desktop\\PersonalProjects\\pastimes\\numerical_issue_test';
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    let stepCount = 0;
    let issues = [];
    
    async function takeScreenshot(description) {
        stepCount++;
        const filename = `${screenshotDir}\\step${stepCount.toString().padStart(2, '0')}_${description.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`Screenshot: ${description}`);
        return filename;
    }
    
    async function getCounts() {
        return await page.evaluate(() => {
            const counts = {};
            
            // Get sidebar counts
            const sidebarLikes = document.querySelector('[data-category="Liked"] .nav-count');
            const sidebarFavorites = document.querySelector('[data-category="Favorited"] .nav-count');
            
            counts.sidebar = {
                likes: sidebarLikes ? parseInt(sidebarLikes.textContent) || 0 : 0,
                favorites: sidebarFavorites ? parseInt(sidebarFavorites.textContent) || 0 : 0
            };
            
            // Get main area counts (test home interface)
            const gameCards = document.querySelectorAll('.game-card');
            counts.games = {};
            
            gameCards.forEach(card => {
                const gameName = card.getAttribute('data-game-name');
                if (gameName) {
                    const likeCount = card.querySelector('.likes-count');
                    const likeBtn = card.querySelector('.btn-like');
                    const favBtn = card.querySelector('.btn-favorite');
                    
                    counts.games[gameName] = {
                        likes: likeCount ? parseInt(likeCount.textContent) || 0 : 0,
                        liked: likeBtn ? likeBtn.getAttribute('data-liked') === 'true' : false,
                        favorited: favBtn ? favBtn.getAttribute('data-favorited') === 'true' : false
                    };
                }
            });
            
            // Get game player specific counts if present
            const currentGameLikes = document.getElementById('currentGameLikes');
            const statLikeBtn = document.querySelector('.btn-like-stat');
            const favoriteBtn = document.getElementById('favoriteBtn');
            
            if (currentGameLikes) {
                const match = currentGameLikes.textContent.match(/(\\d+)/);
                counts.gamePlayer = {
                    currentGameLikes: match ? parseInt(match[1]) : 0,
                    currentGameLiked: statLikeBtn ? statLikeBtn.getAttribute('data-liked') === 'true' : false,
                    currentGameFavorited: favoriteBtn ? favoriteBtn.classList.contains('favorited') : false
                };
            }
            
            // Get related games counts if present
            const relatedGames = document.querySelectorAll('.related-game-item');
            counts.relatedGames = {};
            
            relatedGames.forEach(item => {
                const gameName = item.getAttribute('data-game-name');
                const likesSpan = item.querySelector('.card-likes');
                const likeBtn = item.querySelector('.related-game-like');
                const favBtn = item.querySelector('.related-game-favorite');
                
                if (gameName) {
                    const likesMatch = likesSpan ? likesSpan.textContent.match(/(\\d+)/) : null;
                    counts.relatedGames[gameName] = {
                        likes: likesMatch ? parseInt(likesMatch[1]) : 0,
                        liked: likeBtn ? likeBtn.getAttribute('data-liked') === 'true' : false,
                        favorited: favBtn ? favBtn.getAttribute('data-favorited') === 'true' : false
                    };
                }
            });
            
            return counts;
        });
    }
    
    function logCounts(phase, counts) {
        console.log(`\\n=== ${phase} ===`);
        console.log(`Sidebar - Likes: ${counts.sidebar.likes}, Favorites: ${counts.sidebar.favorites}`);
        
        if (Object.keys(counts.games).length > 0) {
            console.log('Game Cards:');
            Object.entries(counts.games).forEach(([name, data]) => {
                console.log(`  ${name}: Likes=${data.likes}, Liked=${data.liked}, Favorited=${data.favorited}`);
            });
        }
        
        if (counts.gamePlayer) {
            console.log(`Game Player: Likes=${counts.gamePlayer.currentGameLikes}, Liked=${counts.gamePlayer.currentGameLiked}, Favorited=${counts.gamePlayer.currentGameFavorited}`);
        }
        
        if (Object.keys(counts.relatedGames).length > 0) {
            console.log('Related Games:');
            Object.entries(counts.relatedGames).forEach(([name, data]) => {
                console.log(`  ${name}: Likes=${data.likes}, Liked=${data.liked}, Favorited=${data.favorited}`);
            });
        }
    }
    
    function detectInconsistencies(phase, counts) {
        const foundIssues = [];
        
        // Check if sidebar counts match the actual user interactions
        const userLikedGames = Object.values(counts.games).filter(g => g.liked).length;
        const userFavoritedGames = Object.values(counts.games).filter(g => g.favorited).length;
        
        if (counts.sidebar.likes !== userLikedGames) {
            foundIssues.push({
                phase,
                type: 'sidebar_likes_mismatch',
                expected: userLikedGames,
                actual: counts.sidebar.likes,
                description: `Sidebar shows ${counts.sidebar.likes} likes but user has liked ${userLikedGames} games`
            });
        }
        
        if (counts.sidebar.favorites !== userFavoritedGames) {
            foundIssues.push({
                phase,
                type: 'sidebar_favorites_mismatch',
                expected: userFavoritedGames,
                actual: counts.sidebar.favorites,
                description: `Sidebar shows ${counts.sidebar.favorites} favorites but user has favorited ${userFavoritedGames} games`
            });
        }
        
        // Check game player consistency with main games
        if (counts.gamePlayer) {
            const currentGameName = Object.keys(counts.games)[0]; // Assume first game
            if (currentGameName && counts.games[currentGameName]) {
                const mainGame = counts.games[currentGameName];
                const playerGame = counts.gamePlayer;
                
                if (mainGame.likes !== playerGame.currentGameLikes) {
                    foundIssues.push({
                        phase,
                        type: 'game_player_likes_mismatch',
                        game: currentGameName,
                        expected: mainGame.likes,
                        actual: playerGame.currentGameLikes,
                        description: `Game ${currentGameName}: Main shows ${mainGame.likes} likes, player shows ${playerGame.currentGameLikes}`
                    });
                }
                
                if (mainGame.liked !== playerGame.currentGameLiked) {
                    foundIssues.push({
                        phase,
                        type: 'game_player_liked_state_mismatch',
                        game: currentGameName,
                        expected: mainGame.liked,
                        actual: playerGame.currentGameLiked,
                        description: `Game ${currentGameName}: Main liked=${mainGame.liked}, player liked=${playerGame.currentGameLiked}`
                    });
                }
            }
        }
        
        // Check related games consistency with main games
        Object.entries(counts.relatedGames).forEach(([gameName, relatedData]) => {
            if (counts.games[gameName]) {
                const mainData = counts.games[gameName];
                
                if (mainData.likes !== relatedData.likes) {
                    foundIssues.push({
                        phase,
                        type: 'related_game_likes_mismatch',
                        game: gameName,
                        expected: mainData.likes,
                        actual: relatedData.likes,
                        description: `Game ${gameName}: Main shows ${mainData.likes} likes, related shows ${relatedData.likes}`
                    });
                }
            }
        });
        
        if (foundIssues.length > 0) {
            console.log(`\\n⚠️  Found ${foundIssues.length} inconsistencies in ${phase}:`);
            foundIssues.forEach(issue => {
                console.log(`  - ${issue.description}`);
            });
        } else {
            console.log(`\\n✅ No inconsistencies found in ${phase}`);
        }
        
        return foundIssues;
    }
    
    try {
        // Step 1: Navigate to test home
        console.log('\\n1. Loading test home...');
        await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
        await page.waitForSelector('.game-card', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await takeScreenshot('01_initial_test_home');
        
        const initialCounts = await getCounts();
        logCounts('Initial Load', initialCounts);
        const initialIssues = detectInconsistencies('Initial Load', initialCounts);
        issues.push(...initialIssues);
        
        // Step 2: Like a game from main interface
        console.log('\\n2. Liking a game from main interface...');
        const likeButtons = await page.$$('.btn-like');
        let targetGameName = null;
        
        if (likeButtons.length > 0) {
            // Get the game name before clicking
            targetGameName = await page.evaluate(btn => {
                return btn.getAttribute('data-game-name');
            }, likeButtons[0]);
            
            console.log(`Targeting game: ${targetGameName}`);
            await likeButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await takeScreenshot('02_after_like_main');
            
            const afterLikeCounts = await getCounts();
            logCounts('After Like Main', afterLikeCounts);
            const afterLikeIssues = detectInconsistencies('After Like Main', afterLikeCounts);
            issues.push(...afterLikeIssues);
        }
        
        // Step 3: Navigate to game player for that game
        console.log('\\n3. Navigating to game player...');
        if (targetGameName) {
            const gameUrl = targetGameName.toLowerCase()
                .replace(/[^a-z0-9\\s]/g, '')
                .replace(/\\s+/g, '-')
                .trim();
            
            await page.goto(`http://localhost:5000/test-home/game/${gameUrl}`, { waitUntil: 'networkidle2' });
            await page.waitForSelector('.game-player-container', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 2000));
            await takeScreenshot('03_game_player_loaded');
            
            const gamePlayerCounts = await getCounts();
            logCounts('Game Player Loaded', gamePlayerCounts);
            const gamePlayerIssues = detectInconsistencies('Game Player Loaded', gamePlayerCounts);
            issues.push(...gamePlayerIssues);
            
            // Step 4: Interact with like button in game player
            console.log('\\n4. Interacting with like button in game player...');
            const statLikeBtn = await page.$('.btn-like-stat');
            if (statLikeBtn) {
                await statLikeBtn.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                await takeScreenshot('04_game_player_like_clicked');
                
                const afterGamePlayerLikeCounts = await getCounts();
                logCounts('After Game Player Like', afterGamePlayerLikeCounts);
                const afterGamePlayerLikeIssues = detectInconsistencies('After Game Player Like', afterGamePlayerLikeCounts);
                issues.push(...afterGamePlayerLikeIssues);
            }
            
            // Step 5: Try interacting with related games
            console.log('\\n5. Interacting with related game likes...');
            const relatedLikeButtons = await page.$$('.related-game-like');
            if (relatedLikeButtons.length > 0) {
                await relatedLikeButtons[0].click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                await takeScreenshot('05_related_game_liked');
                
                const afterRelatedLikeCounts = await getCounts();
                logCounts('After Related Game Like', afterRelatedLikeCounts);
                const afterRelatedLikeIssues = detectInconsistencies('After Related Game Like', afterRelatedLikeCounts);
                issues.push(...afterRelatedLikeIssues);
            }
        }
        
        // Step 6: Navigate back to test home via sidebar
        console.log('\\n6. Navigating back to test home via sidebar...');
        const homeLink = await page.$('a[href*="/test-home"]');
        if (homeLink) {
            await homeLink.click();
            await page.waitForSelector('.game-card', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 2000));
            await takeScreenshot('06_back_to_test_home');
            
            const backHomeCounts = await getCounts();
            logCounts('Back to Test Home', backHomeCounts);
            const backHomeIssues = detectInconsistencies('Back to Test Home', backHomeCounts);
            issues.push(...backHomeIssues);
        }
        
        // Step 7: Test favorite functionality and repeat switching
        console.log('\\n7. Testing favorite functionality...');
        const favoriteButtons = await page.$$('.btn-favorite');
        if (favoriteButtons.length > 0) {
            await favoriteButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await takeScreenshot('07_after_favorite_main');
            
            const afterFavoriteCounts = await getCounts();
            logCounts('After Favorite Main', afterFavoriteCounts);
            const afterFavoriteIssues = detectInconsistencies('After Favorite Main', afterFavoriteCounts);
            issues.push(...afterFavoriteIssues);
        }
        
        // Step 8: Navigate to different game and back multiple times
        console.log('\\n8. Testing multiple navigation switches...');
        const gameCards = await page.$$('.game-card');
        
        for (let i = 0; i < Math.min(3, gameCards.length); i++) {
            console.log(`\\n  Testing navigation ${i + 1}...`);
            
            // Click on game card to navigate
            await gameCards[i].click();
            await page.waitForSelector('.game-player-container', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 1500));
            await takeScreenshot(`08_${i + 1}_game_loaded`);
            
            const gameLoadedCounts = await getCounts();
            logCounts(`Game ${i + 1} Loaded`, gameLoadedCounts);
            const gameLoadedIssues = detectInconsistencies(`Game ${i + 1} Loaded`, gameLoadedCounts);
            issues.push(...gameLoadedIssues);
            
            // Navigate back to home
            const backHomeLink = await page.$('a[href*="/test-home"]');
            if (backHomeLink) {
                await backHomeLink.click();
                await page.waitForSelector('.game-card', { timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 1500));
                await takeScreenshot(`08_${i + 1}_back_home`);
                
                const backHomeCounts = await getCounts();
                logCounts(`Back from Game ${i + 1}`, backHomeCounts);
                const backHomeIssues = detectInconsistencies(`Back from Game ${i + 1}`, backHomeCounts);
                issues.push(...backHomeIssues);
            }
        }
        
        // Step 9: Final state check
        console.log('\\n9. Final consistency check...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await takeScreenshot('09_final_state');
        
        const finalCounts = await getCounts();
        logCounts('Final State', finalCounts);
        const finalIssues = detectInconsistencies('Final State', finalCounts);
        issues.push(...finalIssues);
        
    } catch (error) {
        console.error('Test error:', error);
        await takeScreenshot('error_state');
        issues.push({
            phase: 'ERROR',
            type: 'test_error',
            error: error.message,
            description: `Test failed with error: ${error.message}`
        });
    }
    
    // Generate comprehensive report
    console.log('\\n\\n=== NUMERICAL CONSISTENCY ISSUE REPORT ===');
    console.log(`Test completed with ${issues.length} total issues detected`);
    
    if (issues.length > 0) {
        console.log('\\n🚨 ISSUES FOUND:');
        
        // Group issues by type
        const issuesByType = {};
        issues.forEach(issue => {
            if (!issuesByType[issue.type]) {
                issuesByType[issue.type] = [];
            }
            issuesByType[issue.type].push(issue);
        });
        
        Object.entries(issuesByType).forEach(([type, typeIssues]) => {
            console.log(`\\n${type.toUpperCase()} (${typeIssues.length} occurrences):`);
            typeIssues.forEach((issue, index) => {
                console.log(`  ${index + 1}. [${issue.phase}] ${issue.description}`);
            });
        });
        
        console.log('\\n📊 API CALLS MADE DURING TEST:');
        apiCalls.forEach((call, index) => {
            console.log(`  ${index + 1}. ${call.method} ${call.url.split('/').pop()} at ${call.timestamp}`);
        });
    } else {
        console.log('\\n✅ No numerical consistency issues detected!');
    }
    
    // Save detailed report
    const reportData = {
        timestamp: new Date().toISOString(),
        totalIssues: issues.length,
        issuesByType: {},
        detailedIssues: issues,
        apiCalls: apiCalls,
        testSteps: stepCount
    };
    
    // Group issues by type for the report
    issues.forEach(issue => {
        if (!reportData.issuesByType[issue.type]) {
            reportData.issuesByType[issue.type] = 0;
        }
        reportData.issuesByType[issue.type]++;
    });
    
    const reportPath = `${screenshotDir}\\detailed_numerical_issue_report.json`;
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\\nDetailed report saved to: ${reportPath}`);
    console.log(`Screenshots saved to: ${screenshotDir}`);
    
    await browser.close();
    return issues;
}

// Run the test
testSpecificNumericalIssue()
    .then(issues => {
        console.log(`\\n🎯 Test Summary: ${issues.length} numerical consistency issues found`);
        if (issues.length > 0) {
            console.log('\\nRecommendations:');
            console.log('1. Review state synchronization between interfaces');
            console.log('2. Check API response consistency');
            console.log('3. Verify sidebar count updates match actual user actions');
            console.log('4. Ensure game player and main interface share same data source');
        }
        process.exit(issues.length > 0 ? 1 : 0);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });