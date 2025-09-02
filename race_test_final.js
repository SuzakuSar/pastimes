const puppeteer = require('puppeteer');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRaceConditions() {
    console.log('Starting race condition tests...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        slowMo: 50 
    });
    const page = await browser.newPage();
    
    // Monitor console messages
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push(`${msg.type()}: ${msg.text()}`);
        console.log(`Console ${msg.type()}: ${msg.text()}`);
    });
    
    try {
        console.log('Navigating to test page...');
        await page.goto('http://localhost:5000/test-home/', { waitUntil: 'networkidle0' });
        
        // Take initial screenshot
        await page.screenshot({ path: 'race_test_initial.png', fullPage: true });
        console.log('Initial screenshot taken');
        
        // Test 1: Rapid like button clicks
        console.log('\n=== TEST 1: Rapid Like Button Clicks ===');
        const likeButtons = await page.$$('.btn-like');
        console.log(`Found ${likeButtons.length} like buttons`);
        
        if (likeButtons.length === 0) {
            throw new Error('No like buttons found');
        }
        
        const firstLikeButton = likeButtons[0];
        
        // Get initial count by finding the likes-count span in the same container
        const likeContainer = await page.$eval('.card-likes-container', container => {
            const button = container.querySelector('.btn-like');
            const countSpan = container.querySelector('.likes-count');
            return {
                gameName: button.getAttribute('data-game-name'),
                initialCount: parseInt(countSpan.textContent || '0')
            };
        });
        
        console.log(`Game: ${likeContainer.gameName}, Initial like count: ${likeContainer.initialCount}`);
        
        // Perform 10 rapid clicks
        console.log('Performing 10 rapid clicks on like button...');
        for (let i = 0; i < 10; i++) {
            await firstLikeButton.click();
            await sleep(25); // Very small delay between clicks
        }
        
        // Wait for requests to settle
        await sleep(3000);
        await page.waitForSelector('.btn-like', { visible: true });
        
        // Check final count
        const finalLikeCount = await page.$eval('.card-likes-container .likes-count', span => 
            parseInt(span.textContent || '0')
        );
        
        console.log(`Final like count: ${finalLikeCount}`);
        console.log(`Count change: ${finalLikeCount - likeContainer.initialCount}`);
        console.log(`Expected change: ±1, Actual change: ${finalLikeCount - likeContainer.initialCount}`);
        
        const likeCountChange = Math.abs(finalLikeCount - likeContainer.initialCount);
        const likeTestPassed = likeCountChange === 1;
        console.log(`Like test PASSED: ${likeTestPassed}`);
        
        await page.screenshot({ path: 'race_test_like_after.png', fullPage: true });
        
        // Test 2: Rapid favorite button clicks
        console.log('\n=== TEST 2: Rapid Favorite Button Clicks ===');
        const favoriteButtons = await page.$$('.btn-favorite');
        console.log(`Found ${favoriteButtons.length} favorite buttons`);
        
        if (favoriteButtons.length === 0) {
            throw new Error('No favorite buttons found');
        }
        
        const firstFavoriteButton = favoriteButtons[0];
        
        // Get game info for the first favorite button - need to find its card
        const favoriteInitialData = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.game-card'));
            for (let card of cards) {
                const favoriteBtn = card.querySelector('.btn-favorite');
                if (favoriteBtn) {
                    const gameName = card.querySelector('.card-title')?.textContent?.trim();
                    return {
                        gameName: gameName || 'Unknown Game',
                        initialFavorited: favoriteBtn.getAttribute('data-favorited') === 'true'
                    };
                }
            }
            return { gameName: 'Unknown', initialFavorited: false };
        });
        
        console.log(`Game: ${favoriteInitialData.gameName}, Initially favorited: ${favoriteInitialData.initialFavorited}`);
        
        // Perform 10 rapid clicks
        console.log('Performing 10 rapid clicks on favorite button...');
        for (let i = 0; i < 10; i++) {
            await firstFavoriteButton.click();
            await sleep(25);
        }
        
        // Wait for requests to settle
        await sleep(3000);
        
        // Check final favorite state
        const finalFavoriteData = await page.evaluate(() => {
            const favoriteBtn = document.querySelector('.btn-favorite');
            return favoriteBtn ? favoriteBtn.getAttribute('data-favorited') === 'true' : false;
        });
        
        console.log(`Final favorited state: ${finalFavoriteData}`);
        console.log(`State changed: ${finalFavoriteData !== favoriteInitialData.initialFavorited}`);
        
        const favoriteTestPassed = finalFavoriteData !== favoriteInitialData.initialFavorited;
        console.log(`Favorite test PASSED: ${favoriteTestPassed}`);
        
        await page.screenshot({ path: 'race_test_favorite_after.png', fullPage: true });
        
        // Test 3: Visual feedback during requests
        console.log('\n=== TEST 3: Visual Feedback Test ===');
        
        // Test button state during request
        const testButton = likeButtons[1] || likeButtons[0]; // Use second button if available
        
        console.log('Testing visual feedback during button request...');
        
        // Get button style before click
        const beforeStyle = await page.evaluate(button => {
            const computed = window.getComputedStyle(button);
            return {
                pointerEvents: computed.pointerEvents,
                opacity: computed.opacity
            };
        }, testButton);
        console.log('Button style before click:', beforeStyle);
        
        // Click and immediately check style during request
        const clickPromise = testButton.click();
        await sleep(50); // Brief pause to catch disabled state
        
        const duringStyle = await page.evaluate(button => {
            const computed = window.getComputedStyle(button);
            return {
                pointerEvents: computed.pointerEvents,
                opacity: computed.opacity
            };
        }, testButton);
        console.log('Button style during request (50ms after click):', duringStyle);
        
        await clickPromise;
        
        // Wait for request to complete
        await sleep(2000);
        
        const afterStyle = await page.evaluate(button => {
            const computed = window.getComputedStyle(button);
            return {
                pointerEvents: computed.pointerEvents,
                opacity: computed.opacity
            };
        }, testButton);
        console.log('Button style after request:', afterStyle);
        
        // Check if visual feedback was shown (button was disabled)
        const visualFeedbackWorking = duringStyle.pointerEvents === 'none' || 
                                     parseFloat(duringStyle.opacity) < parseFloat(beforeStyle.opacity);
        console.log(`Visual feedback WORKING: ${visualFeedbackWorking}`);
        
        await page.screenshot({ path: 'race_test_visual_feedback.png', fullPage: true });
        
        // Test 4: Multiple games
        console.log('\n=== TEST 4: Multiple Games Test ===');
        
        const allLikeButtons = await page.$$('.btn-like');
        console.log(`Testing ${Math.min(3, allLikeButtons.length)} like buttons...`);
        
        const multiGameResults = [];
        
        for (let i = 0; i < Math.min(3, allLikeButtons.length); i++) {
            const button = allLikeButtons[i];
            
            // Get the game name and initial count for this specific button
            const gameData = await page.evaluate(btn => {
                const container = btn.closest('.card-likes-container');
                const countSpan = container?.querySelector('.likes-count');
                const gameName = btn.getAttribute('data-game-name');
                return {
                    gameName: gameName || `Game ${i + 1}`,
                    initialCount: parseInt(countSpan?.textContent || '0')
                };
            }, button);
            
            console.log(`Button ${i + 1} (${gameData.gameName}) initial count: ${gameData.initialCount}`);
            
            // Rapid clicks
            for (let j = 0; j < 5; j++) {
                await button.click();
                await sleep(30);
            }
            
            await sleep(1500);
            
            const finalCount = await page.evaluate(btn => {
                const container = btn.closest('.card-likes-container');
                const countSpan = container?.querySelector('.likes-count');
                return parseInt(countSpan?.textContent || '0');
            }, button);
            
            const countChange = Math.abs(finalCount - gameData.initialCount);
            const testPassed = countChange === 1;
            
            multiGameResults.push({
                game: gameData.gameName,
                initialCount: gameData.initialCount,
                finalCount: finalCount,
                change: finalCount - gameData.initialCount,
                passed: testPassed
            });
            
            console.log(`Button ${i + 1} (${gameData.gameName}): ${gameData.initialCount} -> ${finalCount} (change: ${finalCount - gameData.initialCount}) PASSED: ${testPassed}`);
        }
        
        await page.screenshot({ path: 'race_test_multiple_games.png', fullPage: true });
        
        // Test 5: Mixed clicks on different buttons
        console.log('\n=== TEST 5: Mixed Button Clicks ===');
        
        if (likeButtons.length > 0 && favoriteButtons.length > 0) {
            const likeBtn = likeButtons[0];
            const favBtn = favoriteButtons[0];
            
            // Get initial states
            const initialStates = await page.evaluate(() => {
                const likeBtnEl = document.querySelector('.btn-like');
                const favBtnEl = document.querySelector('.btn-favorite');
                const likeContainer = document.querySelector('.card-likes-container');
                const countSpan = likeContainer?.querySelector('.likes-count');
                
                return {
                    likeCount: parseInt(countSpan?.textContent || '0'),
                    favorited: favBtnEl?.getAttribute('data-favorited') === 'true'
                };
            });
            
            console.log(`Initial - Like count: ${initialStates.likeCount}, Favorited: ${initialStates.favorited}`);
            
            // Interleaved clicks
            for (let i = 0; i < 5; i++) {
                await likeBtn.click();
                await sleep(20);
                await favBtn.click();
                await sleep(20);
            }
            
            await sleep(3000);
            
            const finalStates = await page.evaluate(() => {
                const likeBtnEl = document.querySelector('.btn-like');
                const favBtnEl = document.querySelector('.btn-favorite');
                const likeContainer = document.querySelector('.card-likes-container');
                const countSpan = likeContainer?.querySelector('.likes-count');
                
                return {
                    likeCount: parseInt(countSpan?.textContent || '0'),
                    favorited: favBtnEl?.getAttribute('data-favorited') === 'true'
                };
            });
            
            const likeChanged = Math.abs(finalStates.likeCount - initialStates.likeCount) === 1;
            const favoriteChanged = finalStates.favorited !== initialStates.favorited;
            
            console.log(`Final - Like count: ${finalStates.likeCount}, Favorited: ${finalStates.favorited}`);
            console.log(`Like changed correctly: ${likeChanged}, Favorite changed correctly: ${favoriteChanged}`);
        }
        
        await page.screenshot({ path: 'race_test_mixed_clicks.png', fullPage: true });
        
        // Final Summary
        console.log('\n=== RACE CONDITION TEST SUMMARY ===');
        console.log(`✅ Like button race condition test: ${likeTestPassed ? 'PASSED' : 'FAILED'}`);
        console.log(`✅ Favorite button race condition test: ${favoriteTestPassed ? 'PASSED' : 'FAILED'}`);
        console.log(`✅ Visual feedback test: ${visualFeedbackWorking ? 'WORKING' : 'NOT WORKING'}`);
        
        console.log('\n📊 Multi-game test results:');
        multiGameResults.forEach((result, index) => {
            console.log(`   Game ${index + 1} (${result.game}): ${result.passed ? 'PASSED' : 'FAILED'} - Change: ${result.change}`);
        });
        
        const allMultiGamePassed = multiGameResults.every(r => r.passed);
        console.log(`✅ Multi-game consistency: ${allMultiGamePassed ? 'PASSED' : 'FAILED'}`);
        
        // Check console for race condition indicators
        const errorMessages = consoleMessages.filter(msg => 
            msg.toLowerCase().includes('error') || 
            msg.toLowerCase().includes('failed') || 
            msg.toLowerCase().includes('timeout') ||
            msg.toLowerCase().includes('duplicate') ||
            msg.toLowerCase().includes('race')
        );
        
        console.log('\n🔍 Console Analysis:');
        console.log(`Total console messages: ${consoleMessages.length}`);
        console.log(`Error/warning messages: ${errorMessages.length}`);
        
        if (errorMessages.length > 0) {
            console.log('⚠️  Issues detected:');
            errorMessages.forEach(msg => console.log(`   ${msg}`));
        } else {
            console.log('✅ No error indicators found in console');
        }
        
        // Final assessment
        const raceConditionFixed = likeTestPassed && favoriteTestPassed && allMultiGamePassed && errorMessages.length === 0;
        console.log(`\n🎯 RACE CONDITION FIX STATUS: ${raceConditionFixed ? '✅ SUCCESSFUL' : '❌ NEEDS ATTENTION'}`);
        
        return {
            passed: raceConditionFixed,
            likeTest: likeTestPassed,
            favoriteTest: favoriteTestPassed,
            visualFeedback: visualFeedbackWorking,
            multiGameTest: allMultiGamePassed,
            consoleErrors: errorMessages.length,
            consoleMessages: consoleMessages
        };
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        await page.screenshot({ path: 'race_test_error.png', fullPage: true });
        return {
            passed: false,
            error: error.message,
            consoleMessages: consoleMessages
        };
    } finally {
        await browser.close();
    }
}

// Run the tests
testRaceConditions().then(results => {
    console.log('\n🏁 Test execution completed');
    if (results.passed) {
        console.log('🎉 All race condition tests PASSED!');
    } else {
        console.log('⚠️  Some tests failed or encountered issues');
    }
});