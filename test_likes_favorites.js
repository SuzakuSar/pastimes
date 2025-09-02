/**
 * Comprehensive Like & Favorite Cross-Page Testing Script
 * Purpose: Identify when numbers jump to 18 and find root cause
 */

const puppeteer = require('puppeteer');

class LikesFavoritesTestSuite {
    constructor() {
        this.testResults = [];
        this.consoleLogs = [];
        this.screenshots = [];
        this.issueDetected = false;
        this.eighteenJumpTriggers = [];
        this.browser = null;
        this.page = null;
    }

    async log(step, status, details) {
        const result = {
            step,
            status,
            timestamp: Date.now(),
            details
        };
        this.testResults.push(result);
        console.log(`[${status}] ${step}:`, JSON.stringify(details, null, 2));
    }

    async setupPuppeteer() {
        this.browser = await puppeteer.launch({
            headless: false, // Show browser for debugging
            devtools: true,
            defaultViewport: { width: 1280, height: 720 },
            args: ['--start-maximized']
        });
        
        this.page = await this.browser.newPage();
        
        // Listen for console messages
        this.page.on('console', msg => {
            const logEntry = `[${msg.type()}] ${msg.text()}`;
            this.consoleLogs.push(logEntry);
            console.log(`[CONSOLE] ${logEntry}`);
        });

        // Listen for network requests
        this.page.on('response', response => {
            if (response.url().includes('/api/')) {
                console.log(`[API] ${response.status()} ${response.url()}`);
            }
        });

        // Enable request interception for debugging
        await this.page.setRequestInterception(true);
        this.page.on('request', request => {
            request.continue();
        });
    }

    async takeScreenshot(filename) {
        const path = `./screenshots/${filename}`;
        await this.page.screenshot({ path, fullPage: true });
        console.log(`📸 Screenshot saved: ${filename}`);
        return path;
    }

    async getSidebarCounts() {
        return await this.page.evaluate(() => {
            const favoritedCount = document.querySelector('[data-category="Favorited"] .nav-count');
            const likedCount = document.querySelector('[data-category="Liked"] .nav-count');
            
            return {
                favorited: favoritedCount ? parseInt(favoritedCount.textContent) : null,
                liked: likedCount ? parseInt(likedCount.textContent) : null
            };
        });
    }

    async getCookieData() {
        const cookies = await this.page.cookies();
        const userLikes = cookies.find(c => c.name === 'user_likes');
        const userFavorites = cookies.find(c => c.name === 'user_favorites');
        const gameLikes = cookies.find(c => c.name === 'game_likes');
        
        let parsedUserLikes = [];
        let parsedUserFavorites = [];
        let parsedGameLikes = {};
        
        try {
            parsedUserLikes = userLikes ? JSON.parse(decodeURIComponent(userLikes.value)) : [];
        } catch (e) {
            console.log('Error parsing user likes cookie:', e.message);
            parsedUserLikes = [];
        }
        
        try {
            parsedUserFavorites = userFavorites ? JSON.parse(decodeURIComponent(userFavorites.value)) : [];
        } catch (e) {
            console.log('Error parsing user favorites cookie:', e.message);
            parsedUserFavorites = [];
        }
        
        try {
            parsedGameLikes = gameLikes ? JSON.parse(decodeURIComponent(gameLikes.value)) : {};
        } catch (e) {
            console.log('Error parsing game likes cookie:', e.message);
            parsedGameLikes = {};
        }
        
        return {
            userLikes: parsedUserLikes,
            userFavorites: parsedUserFavorites,
            gameLikes: parsedGameLikes
        };
    }

    async clearCookies() {
        await this.page.evaluate(() => {
            document.cookie = 'user_likes=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'user_favorites=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'game_likes=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        });
        console.log('🧹 Cookies cleared');
    }

    async runTestSequence() {
        try {
            console.log('🎮 Starting Like & Favorite Cross-Page Testing');
            console.log('=' * 60);
            
            // Step 1: Navigate to test-home and check initial state
            await this.log('navigation', 'START', { url: 'http://localhost:5000/test-home/' });
            await this.page.goto('http://localhost:5000/test-home/', { waitUntil: 'networkidle0' });
            await this.takeScreenshot('01-initial-home-page.png');

            const initialCounts = await this.getSidebarCounts();
            const initialCookies = await this.getCookieData();
            await this.log('initial_state', 'INFO', { 
                sidebarCounts: initialCounts, 
                cookieData: initialCookies 
            });

            // Step 2: Click LIKE on 2-3 different game cards on home page
            console.log('\n🎯 Testing LIKE interactions on home page...');
            const homeGameCards = await this.page.$$('.game-card');
            
            for (let i = 0; i < Math.min(3, homeGameCards.length); i++) {
                const likeButton = await homeGameCards[i].$('.btn-like');
                if (likeButton) {
                    const gameName = await homeGameCards[i].evaluate(el => el.dataset.gameName);
                    
                    await this.log('like_click', 'ACTION', { 
                        gameIndex: i, 
                        gameName,
                        beforeCounts: await this.getSidebarCounts()
                    });
                    
                    await likeButton.click();
                    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for API response
                    
                    const afterCounts = await this.getSidebarCounts();
                    await this.log('like_result', 'RESULT', { 
                        gameName,
                        afterCounts,
                        cookieData: await this.getCookieData()
                    });
                    
                    // Check if numbers jumped to 18
                    if (afterCounts.liked === 18 || afterCounts.favorited === 18) {
                        this.eighteenJumpTriggers.push({
                            action: 'home_like',
                            gameName,
                            step: i + 1,
                            counts: afterCounts
                        });
                        await this.log('ISSUE_DETECTED', 'ERROR', {
                            message: 'Numbers jumped to 18!',
                            trigger: 'home_like',
                            gameName,
                            counts: afterCounts
                        });
                    }
                    
                    await this.takeScreenshot(`02-home-like-${i+1}-${gameName.replace(/\s+/g, '-')}.png`);
                }
            }

            // Step 3: Click FAVORITE on 1-2 game cards on home page
            console.log('\n❤️ Testing FAVORITE interactions on home page...');
            for (let i = 0; i < Math.min(2, homeGameCards.length); i++) {
                const favoriteButton = await homeGameCards[i].$('.btn-favorite');
                if (favoriteButton) {
                    const gameName = await homeGameCards[i].evaluate(el => el.dataset.gameName);
                    
                    await this.log('favorite_click', 'ACTION', { 
                        gameIndex: i, 
                        gameName,
                        beforeCounts: await this.getSidebarCounts()
                    });
                    
                    await favoriteButton.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const afterCounts = await this.getSidebarCounts();
                    await this.log('favorite_result', 'RESULT', { 
                        gameName,
                        afterCounts,
                        cookieData: await this.getCookieData()
                    });
                    
                    // Check if numbers jumped to 18
                    if (afterCounts.liked === 18 || afterCounts.favorited === 18) {
                        this.eighteenJumpTriggers.push({
                            action: 'home_favorite',
                            gameName,
                            step: i + 1,
                            counts: afterCounts
                        });
                        await this.log('ISSUE_DETECTED', 'ERROR', {
                            message: 'Numbers jumped to 18!',
                            trigger: 'home_favorite',
                            gameName,
                            counts: afterCounts
                        });
                    }
                    
                    await this.takeScreenshot(`03-home-favorite-${i+1}-${gameName.replace(/\s+/g, '-')}.png`);
                }
            }

            // Step 4: Navigate to a game page
            console.log('\n🎮 Navigating to game page...');
            const firstGameCard = await this.page.$('.game-card');
            if (firstGameCard) {
                const beforeNavCounts = await this.getSidebarCounts();
                const gameName = await firstGameCard.evaluate(el => el.dataset.gameName);
                
                await this.log('game_navigation', 'ACTION', { 
                    gameName,
                    beforeCounts: beforeNavCounts 
                });
                
                await firstGameCard.click();
                await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
                
                const afterNavCounts = await this.getSidebarCounts();
                await this.log('game_page_loaded', 'RESULT', { 
                    gameName,
                    afterCounts: afterNavCounts,
                    url: this.page.url()
                });
                
                // Check if navigation caused count jump
                if (afterNavCounts.liked === 18 || afterNavCounts.favorited === 18) {
                    this.eighteenJumpTriggers.push({
                        action: 'navigation_to_game',
                        gameName,
                        counts: afterNavCounts
                    });
                }
                
                await this.takeScreenshot('04-game-page-loaded.png');
            }

            // Step 5: Click LIKE button in game stats section
            console.log('\n👍 Testing LIKE on game page...');
            const gameLikeButton = await this.page.$('.btn-like-stat');
            if (gameLikeButton) {
                const beforeCounts = await this.getSidebarCounts();
                const currentGame = await this.page.evaluate(() => {
                    return document.querySelector('.btn-like-stat')?.dataset.gameName;
                });
                
                await this.log('game_like_click', 'ACTION', { 
                    currentGame,
                    beforeCounts 
                });
                
                await gameLikeButton.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const afterCounts = await this.getSidebarCounts();
                await this.log('game_like_result', 'RESULT', { 
                    currentGame,
                    afterCounts,
                    cookieData: await this.getCookieData()
                });
                
                // Check for 18 jump
                if (afterCounts.liked === 18 || afterCounts.favorited === 18) {
                    this.eighteenJumpTriggers.push({
                        action: 'game_page_like',
                        gameName: currentGame,
                        counts: afterCounts
                    });
                }
                
                await this.takeScreenshot('05-game-page-like.png');
            }

            // Step 6: Click FAVORITE button in game actions section
            console.log('\n❤️ Testing FAVORITE on game page...');
            const gameFavoriteButton = await this.page.$('#favoriteBtn');
            if (gameFavoriteButton) {
                const beforeCounts = await this.getSidebarCounts();
                const currentGame = await this.page.evaluate(() => {
                    return document.querySelector('#favoriteBtn')?.dataset.gameName;
                });
                
                await this.log('game_favorite_click', 'ACTION', { 
                    currentGame,
                    beforeCounts 
                });
                
                await gameFavoriteButton.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const afterCounts = await this.getSidebarCounts();
                await this.log('game_favorite_result', 'RESULT', { 
                    currentGame,
                    afterCounts,
                    cookieData: await this.getCookieData()
                });
                
                // Check for 18 jump
                if (afterCounts.liked === 18 || afterCounts.favorited === 18) {
                    this.eighteenJumpTriggers.push({
                        action: 'game_page_favorite',
                        gameName: currentGame,
                        counts: afterCounts
                    });
                }
                
                await this.takeScreenshot('06-game-page-favorite.png');
            }

            // Step 7: Click like/favorite on related games in sidebar
            console.log('\n🎯 Testing interactions with related games...');
            const relatedGameLikes = await this.page.$$('.related-game-like');
            const relatedGameFavorites = await this.page.$$('.related-game-favorite');
            
            for (let i = 0; i < Math.min(2, relatedGameLikes.length); i++) {
                const beforeCounts = await this.getSidebarCounts();
                const gameName = await relatedGameLikes[i].evaluate(el => el.dataset.gameName);
                
                await this.log('related_like_click', 'ACTION', { 
                    gameIndex: i,
                    gameName,
                    beforeCounts 
                });
                
                await relatedGameLikes[i].click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const afterCounts = await this.getSidebarCounts();
                await this.log('related_like_result', 'RESULT', { 
                    gameName,
                    afterCounts 
                });
                
                // Check for 18 jump
                if (afterCounts.liked === 18 || afterCounts.favorited === 18) {
                    this.eighteenJumpTriggers.push({
                        action: 'related_game_like',
                        gameName,
                        step: i + 1,
                        counts: afterCounts
                    });
                }
                
                await this.takeScreenshot(`07-related-like-${i+1}.png`);
            }

            // Step 8: Navigate back to home page and validate consistency
            console.log('\n🏠 Navigating back to home page...');
            await this.page.click('[data-category="Home"]');
            await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
            
            const finalCounts = await this.getSidebarCounts();
            const finalCookies = await this.getCookieData();
            
            await this.log('final_validation', 'RESULT', { 
                finalCounts,
                finalCookies,
                url: this.page.url()
            });
            
            await this.takeScreenshot('08-final-home-validation.png');

            // Step 9: Generate comprehensive report
            await this.generateReport();

        } catch (error) {
            await this.log('test_error', 'ERROR', { 
                message: error.message,
                stack: error.stack 
            });
            console.error('Test failed:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE TEST REPORT');
        console.log('='.repeat(80));
        
        console.log('\n🎯 18-Jump Issue Triggers:');
        if (this.eighteenJumpTriggers.length > 0) {
            this.eighteenJumpTriggers.forEach((trigger, index) => {
                console.log(`${index + 1}. ${trigger.action} on "${trigger.gameName}"`);
                console.log(`   Counts after: Liked=${trigger.counts.liked}, Favorited=${trigger.counts.favorited}`);
            });
        } else {
            console.log('✅ No 18-jump issues detected during testing');
        }

        console.log('\n📝 Full Test Results:');
        this.testResults.forEach(result => {
            console.log(`[${result.status}] ${result.step}`);
        });

        console.log('\n🔍 Console Logs:');
        this.consoleLogs.forEach(log => {
            console.log(log);
        });

        // Save detailed report
        const reportData = {
            eighteenJumpTriggers: this.eighteenJumpTriggers,
            testResults: this.testResults,
            consoleLogs: this.consoleLogs,
            timestamp: new Date().toISOString()
        };

        const fs = require('fs');
        const reportPath = './test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`\n💾 Detailed report saved: ${reportPath}`);
    }
}

// Run the test suite
async function runTests() {
    const testSuite = new LikesFavoritesTestSuite();
    await testSuite.setupPuppeteer();
    await testSuite.runTestSequence();
}

runTests().catch(console.error);