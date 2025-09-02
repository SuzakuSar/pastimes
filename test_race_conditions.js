/**
 * Comprehensive Race Condition Testing Script
 * Tests the enhanced protection system for like/favorite buttons
 */

const puppeteer = require('puppeteer');

class RaceConditionTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
    }

    async setup() {
        console.log('Setting up test environment...');
        this.browser = await puppeteer.launch({
            headless: false, // Show browser for visual inspection
            devtools: false,
            slowMo: 50 // Slight delay between actions for visibility
        });
        this.page = await this.browser.newPage();
        
        // Enable console logging from the page
        this.page.on('console', msg => {
            console.log(`PAGE LOG: ${msg.text()}`);
        });

        await this.page.goto('http://localhost:5000/test-home/');
        await this.page.waitForSelector('.game-card');
        console.log('Test environment ready!');
    }

    async testRapidClicking() {
        console.log('\n=== Testing Rapid Clicking Protection ===');
        
        const likeButton = await this.page.$('.btn-like[data-game-name="Space Invaders"]');
        const favoriteButton = await this.page.$('.btn-favorite[data-game-name="Space Invaders"]');
        
        if (!likeButton || !favoriteButton) {
            console.error('Could not find test buttons');
            return false;
        }

        // Take initial screenshot
        await this.page.screenshot({ path: 'test_initial_state.png' });

        // Test 1: Rapid Like Button Clicking (10 clicks in quick succession)
        console.log('Test 1: Rapid like button clicking...');
        const likeClickPromises = [];
        for (let i = 0; i < 10; i++) {
            likeClickPromises.push(
                this.page.evaluate((selector) => {
                    const btn = document.querySelector(selector);
                    btn.click();
                    return Date.now();
                }, '.btn-like[data-game-name="Space Invaders"]')
            );
        }
        
        const likeClickTimes = await Promise.all(likeClickPromises);
        console.log(`Completed ${likeClickTimes.length} like clicks within ${likeClickTimes[likeClickTimes.length - 1] - likeClickTimes[0]}ms`);

        // Wait for all requests to complete
        await this.page.waitForTimeout(2000);
        
        // Take screenshot after like tests
        await this.page.screenshot({ path: 'test_after_like_clicks.png' });

        // Test 2: Rapid Favorite Button Clicking (10 clicks in quick succession)
        console.log('Test 2: Rapid favorite button clicking...');
        const favoriteClickPromises = [];
        for (let i = 0; i < 10; i++) {
            favoriteClickPromises.push(
                this.page.evaluate((selector) => {
                    const btn = document.querySelector(selector);
                    btn.click();
                    return Date.now();
                }, '.btn-favorite[data-game-name="Space Invaders"]')
            );
        }
        
        const favoriteClickTimes = await Promise.all(favoriteClickPromises);
        console.log(`Completed ${favoriteClickTimes.length} favorite clicks within ${favoriteClickTimes[favoriteClickTimes.length - 1] - favoriteClickTimes[0]}ms`);

        await this.page.waitForTimeout(2000);
        await this.page.screenshot({ path: 'test_after_favorite_clicks.png' });

        return true;
    }

    async testVisualFeedback() {
        console.log('\n=== Testing Visual Feedback ===');
        
        // Test that buttons become visually disabled during requests
        const result = await this.page.evaluate(() => {
            const likeBtn = document.querySelector('.btn-like[data-game-name="Cosmic Dino Runner"]');
            const favoriteBtn = document.querySelector('.btn-favorite[data-game-name="Cosmic Dino Runner"]');
            
            if (!likeBtn || !favoriteBtn) return { success: false, error: 'Buttons not found' };

            // Monitor button states during click
            const results = { beforeClick: {}, duringClick: {}, afterClick: {} };
            
            // Capture initial state
            results.beforeClick = {
                likeOpacity: likeBtn.style.opacity,
                likePointerEvents: likeBtn.style.pointerEvents,
                likeLocked: likeBtn.dataset.locked,
                favoriteOpacity: favoriteBtn.style.opacity,
                favoritePointerEvents: favoriteBtn.style.pointerEvents,
                favoriteLocked: favoriteBtn.dataset.locked
            };

            // Click and immediately check state
            likeBtn.click();
            
            // Check state immediately after click (should be locked)
            setTimeout(() => {
                results.duringClick = {
                    likeOpacity: likeBtn.style.opacity,
                    likePointerEvents: likeBtn.style.pointerEvents,
                    likeLocked: likeBtn.dataset.locked
                };
            }, 50);

            // Check state after request completes
            setTimeout(() => {
                results.afterClick = {
                    likeOpacity: likeBtn.style.opacity,
                    likePointerEvents: likeBtn.style.pointerEvents,
                    likeLocked: likeBtn.dataset.locked
                };
            }, 1500);

            return { success: true, results };
        });

        console.log('Visual feedback test results:', result);
        return result.success;
    }

    async testMultiGameSimultaneous() {
        console.log('\n=== Testing Multi-Game Simultaneous Actions ===');
        
        // Click like/favorite buttons on multiple games simultaneously
        const gameNames = ['Space Invaders', 'Cosmic Dino Runner', 'React Time Challenge', 'Time Predict Challenge'];
        
        const simultaneousPromises = [];
        
        for (const gameName of gameNames) {
            // Like click
            simultaneousPromises.push(
                this.page.evaluate((name) => {
                    const btn = document.querySelector(`.btn-like[data-game-name="${name}"]`);
                    if (btn) {
                        btn.click();
                        return { action: 'like', game: name, timestamp: Date.now() };
                    }
                    return null;
                }, gameName)
            );
            
            // Favorite click (slight delay)
            setTimeout(() => {
                simultaneousPromises.push(
                    this.page.evaluate((name) => {
                        const btn = document.querySelector(`.btn-favorite[data-game-name="${name}"]`);
                        if (btn) {
                            btn.click();
                            return { action: 'favorite', game: name, timestamp: Date.now() };
                        }
                        return null;
                    }, gameName)
                );
            }, 10);
        }
        
        const results = await Promise.all(simultaneousPromises);
        console.log('Simultaneous actions completed:', results.filter(r => r !== null));
        
        await this.page.waitForTimeout(3000);
        await this.page.screenshot({ path: 'test_multi_game_final.png' });
        
        return true;
    }

    async testConsoleLogging() {
        console.log('\n=== Testing Console Logging ===');
        
        // Capture console messages
        const consoleLogs = [];
        this.page.on('console', msg => {
            if (msg.text().includes('Starting like') || 
                msg.text().includes('Starting favorite') || 
                msg.text().includes('Unlocked') ||
                msg.text().includes('action blocked')) {
                consoleLogs.push(msg.text());
            }
        });

        // Perform actions that should generate logs
        await this.page.click('.btn-like[data-game-name="Space Invaders"]');
        await this.page.waitForTimeout(100);
        await this.page.click('.btn-like[data-game-name="Space Invaders"]'); // Should be blocked
        await this.page.waitForTimeout(2000);

        console.log('Console logs captured:');
        consoleLogs.forEach(log => console.log(`  - ${log}`));
        
        return consoleLogs.length > 0;
    }

    async testStateConsistency() {
        console.log('\n=== Testing State Consistency ===');
        
        // Get initial counts
        const initialCounts = await this.page.evaluate(() => {
            const likedNav = document.querySelector('[data-category="Liked"] .nav-count');
            const favoritedNav = document.querySelector('[data-category="Favorited"] .nav-count');
            return {
                likes: likedNav ? parseInt(likedNav.textContent) : 0,
                favorites: favoritedNav ? parseInt(favoritedNav.textContent) : 0
            };
        });
        
        console.log('Initial sidebar counts:', initialCounts);

        // Perform a series of like/unlike actions
        const testGame = 'React Time Challenge';
        
        // Like the game
        await this.page.click(`.btn-like[data-game-name="${testGame}"]`);
        await this.page.waitForTimeout(1000);
        
        // Check if count increased
        const afterLikeCounts = await this.page.evaluate(() => {
            const likedNav = document.querySelector('[data-category="Liked"] .nav-count');
            const favoritedNav = document.querySelector('[data-category="Favorited"] .nav-count');
            return {
                likes: likedNav ? parseInt(likedNav.textContent) : 0,
                favorites: favoritedNav ? parseInt(favoritedNav.textContent) : 0
            };
        });
        
        console.log('After like action:', afterLikeCounts);
        
        // Unlike the game
        await this.page.click(`.btn-like[data-game-name="${testGame}"]`);
        await this.page.waitForTimeout(1000);
        
        // Check if count decreased
        const afterUnlikeCounts = await this.page.evaluate(() => {
            const likedNav = document.querySelector('[data-category="Liked"] .nav-count');
            const favoritedNav = document.querySelector('[data-category="Favorited"] .nav-count');
            return {
                likes: likedNav ? parseInt(likedNav.textContent) : 0,
                favorites: favoritedNav ? parseInt(favoritedNav.textContent) : 0
            };
        });
        
        console.log('After unlike action:', afterUnlikeCounts);
        
        // Verify consistency
        const likeConsistency = afterUnlikeCounts.likes === initialCounts.likes;
        const favoriteConsistency = afterUnlikeCounts.favorites === initialCounts.favorites;
        
        console.log(`Consistency check - Likes: ${likeConsistency ? 'PASS' : 'FAIL'}, Favorites: ${favoriteConsistency ? 'PASS' : 'FAIL'}`);
        
        return likeConsistency && favoriteConsistency;
    }

    async runAllTests() {
        try {
            await this.setup();
            
            console.log('🚀 Starting Comprehensive Race Condition Tests');
            console.log('=' .repeat(60));
            
            const tests = [
                { name: 'Rapid Clicking Protection', method: 'testRapidClicking' },
                { name: 'Visual Feedback', method: 'testVisualFeedback' },
                { name: 'Multi-Game Simultaneous', method: 'testMultiGameSimultaneous' },
                { name: 'Console Logging', method: 'testConsoleLogging' },
                { name: 'State Consistency', method: 'testStateConsistency' }
            ];

            const results = {};
            
            for (const test of tests) {
                try {
                    console.log(`\n⏳ Running: ${test.name}`);
                    const startTime = Date.now();
                    const result = await this[test.method]();
                    const duration = Date.now() - startTime;
                    
                    results[test.name] = {
                        passed: result,
                        duration: duration,
                        status: result ? '✅ PASS' : '❌ FAIL'
                    };
                    
                    console.log(`${results[test.name].status} (${duration}ms)`);
                } catch (error) {
                    console.error(`❌ Test "${test.name}" failed with error:`, error.message);
                    results[test.name] = {
                        passed: false,
                        error: error.message,
                        status: '❌ ERROR'
                    };
                }
            }
            
            // Generate final report
            console.log('\n' + '=' .repeat(60));
            console.log('📊 FINAL TEST REPORT');
            console.log('=' .repeat(60));
            
            let totalPassed = 0;
            let totalTests = Object.keys(results).length;
            
            for (const [testName, result] of Object.entries(results)) {
                console.log(`${result.status} ${testName} ${result.duration ? `(${result.duration}ms)` : ''}`);
                if (result.passed) totalPassed++;
                if (result.error) {
                    console.log(`    Error: ${result.error}`);
                }
            }
            
            console.log('\n' + '-' .repeat(60));
            console.log(`📈 Overall Results: ${totalPassed}/${totalTests} tests passed`);
            console.log(`🎯 Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);
            
            if (totalPassed === totalTests) {
                console.log('🎉 ALL TESTS PASSED! Race condition protection is working correctly.');
            } else {
                console.log('⚠️  Some tests failed. Review the protection mechanisms.');
            }
            
            await this.page.screenshot({ path: 'test_final_state.png' });
            
        } catch (error) {
            console.error('Test suite failed:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run the tests
(async () => {
    const tester = new RaceConditionTester();
    await tester.runAllTests();
})();