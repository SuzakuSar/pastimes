const puppeteer = require('puppeteer');

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
        const likeButtons = await page.$$('.like-btn');
        if (likeButtons.length === 0) {
            throw new Error('No like buttons found');
        }
        
        const firstLikeButton = likeButtons[0];
        
        // Get initial count
        const initialLikeText = await page.evaluate(button => button.textContent, firstLikeButton);
        const initialLikeCount = parseInt(initialLikeText.match(/\d+/)?.[0] || '0');
        console.log(`Initial like count: ${initialLikeCount}`);
        
        // Perform 10 rapid clicks
        console.log('Performing 10 rapid clicks on like button...');
        for (let i = 0; i < 10; i++) {
            await firstLikeButton.click();
            await page.waitForTimeout(50); // Very small delay between clicks
        }
        
        // Wait for requests to settle
        await page.waitForTimeout(3000);
        await page.waitForSelector('.like-btn', { visible: true });
        
        // Check final count
        const finalLikeText = await page.evaluate(button => button.textContent, firstLikeButton);
        const finalLikeCount = parseInt(finalLikeText.match(/\d+/)?.[0] || '0');
        console.log(`Final like count: ${finalLikeCount}`);
        console.log(`Count change: ${finalLikeCount - initialLikeCount}`);
        
        await page.screenshot({ path: 'race_test_like_after.png', fullPage: true });
        
        // Test 2: Rapid favorite button clicks
        console.log('\n=== TEST 2: Rapid Favorite Button Clicks ===');
        const favoriteButtons = await page.$$('.favorite-btn');
        if (favoriteButtons.length === 0) {
            throw new Error('No favorite buttons found');
        }
        
        const firstFavoriteButton = favoriteButtons[0];
        
        // Get initial count
        const initialFavoriteText = await page.evaluate(button => button.textContent, firstFavoriteButton);
        const initialFavoriteCount = parseInt(initialFavoriteText.match(/\d+/)?.[0] || '0');
        console.log(`Initial favorite count: ${initialFavoriteCount}`);
        
        // Perform 10 rapid clicks
        console.log('Performing 10 rapid clicks on favorite button...');
        for (let i = 0; i < 10; i++) {
            await firstFavoriteButton.click();
            await page.waitForTimeout(50);
        }
        
        // Wait for requests to settle
        await page.waitForTimeout(3000);
        
        // Check final count
        const finalFavoriteText = await page.evaluate(button => button.textContent, firstFavoriteButton);
        const finalFavoriteCount = parseInt(finalFavoriteText.match(/\d+/)?.[0] || '0');
        console.log(`Final favorite count: ${finalFavoriteCount}`);
        console.log(`Count change: ${finalFavoriteCount - initialFavoriteCount}`);
        
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
        
        // Click and immediately check style
        await testButton.click();
        await page.waitForTimeout(100); // Brief pause to catch disabled state
        
        const duringStyle = await page.evaluate(button => {
            const computed = window.getComputedStyle(button);
            return {
                pointerEvents: computed.pointerEvents,
                opacity: computed.opacity
            };
        }, testButton);
        console.log('Button style during request:', duringStyle);
        
        // Wait for request to complete
        await page.waitForTimeout(2000);
        
        const afterStyle = await page.evaluate(button => {
            const computed = window.getComputedStyle(button);
            return {
                pointerEvents: computed.pointerEvents,
                opacity: computed.opacity
            };
        }, testButton);
        console.log('Button style after request:', afterStyle);
        
        await page.screenshot({ path: 'race_test_visual_feedback.png', fullPage: true });
        
        // Test 4: Multiple games
        console.log('\n=== TEST 4: Multiple Games Test ===');
        
        const allLikeButtons = await page.$$('.like-btn');
        console.log(`Testing ${Math.min(3, allLikeButtons.length)} like buttons...`);
        
        for (let i = 0; i < Math.min(3, allLikeButtons.length); i++) {
            const button = allLikeButtons[i];
            
            const initialText = await page.evaluate(btn => btn.textContent, button);
            const initialCount = parseInt(initialText.match(/\d+/)?.[0] || '0');
            
            console.log(`Button ${i + 1} initial count: ${initialCount}`);
            
            // Rapid clicks
            for (let j = 0; j < 5; j++) {
                await button.click();
                await page.waitForTimeout(30);
            }
            
            await page.waitForTimeout(1500);
            
            const finalText = await page.evaluate(btn => btn.textContent, button);
            const finalCount = parseInt(finalText.match(/\d+/)?.[0] || '0');
            
            console.log(`Button ${i + 1} final count: ${finalCount} (change: ${finalCount - initialCount})`);
        }
        
        await page.screenshot({ path: 'race_test_multiple_games.png', fullPage: true });
        
        // Test 5: Mixed clicks on different buttons
        console.log('\n=== TEST 5: Mixed Button Clicks ===');
        
        if (likeButtons.length > 0 && favoriteButtons.length > 0) {
            const likeBtn = likeButtons[0];
            const favBtn = favoriteButtons[0];
            
            const initialLike = parseInt((await page.evaluate(btn => btn.textContent, likeBtn)).match(/\d+/)?.[0] || '0');
            const initialFav = parseInt((await page.evaluate(btn => btn.textContent, favBtn)).match(/\d+/)?.[0] || '0');
            
            console.log(`Initial - Like: ${initialLike}, Favorite: ${initialFav}`);
            
            // Interleaved clicks
            for (let i = 0; i < 5; i++) {
                await likeBtn.click();
                await page.waitForTimeout(20);
                await favBtn.click();
                await page.waitForTimeout(20);
            }
            
            await page.waitForTimeout(3000);
            
            const finalLike = parseInt((await page.evaluate(btn => btn.textContent, likeBtn)).match(/\d+/)?.[0] || '0');
            const finalFav = parseInt((await page.evaluate(btn => btn.textContent, favBtn)).match(/\d+/)?.[0] || '0');
            
            console.log(`Final - Like: ${finalLike}, Favorite: ${finalFav}`);
            console.log(`Changes - Like: ${finalLike - initialLike}, Favorite: ${finalFav - initialFav}`);
        }
        
        await page.screenshot({ path: 'race_test_mixed_clicks.png', fullPage: true });
        
        // Summary
        console.log('\n=== TEST SUMMARY ===');
        console.log('All tests completed successfully!');
        console.log('Console messages captured:', consoleMessages.length);
        
        if (consoleMessages.length > 0) {
            console.log('Console messages:');
            consoleMessages.forEach(msg => console.log(`  ${msg}`));
        }
        
        // Check for specific race condition indicators
        const raceConditionIndicators = consoleMessages.filter(msg => 
            msg.includes('error') || 
            msg.includes('failed') || 
            msg.includes('timeout') ||
            msg.includes('duplicate')
        );
        
        if (raceConditionIndicators.length > 0) {
            console.log('\nPOTENTIAL ISSUES DETECTED:');
            raceConditionIndicators.forEach(msg => console.log(`  ${msg}`));
        } else {
            console.log('\nNo error indicators found in console messages.');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        await page.screenshot({ path: 'race_test_error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

// Run the tests
testRaceConditions();