/**
 * Simplified Race Condition Protection Test
 * Focus on the core protection mechanisms
 */

const puppeteer = require('puppeteer');

async function testRaceProtection() {
    console.log('🚀 Testing Enhanced Race Condition Protection');
    console.log('=' .repeat(50));

    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true,
        slowMo: 100
    });
    
    const page = await browser.newPage();
    
    // Capture all console logs
    const consoleLogs = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(text);
        if (text.includes('Starting like') || 
            text.includes('Starting favorite') || 
            text.includes('action blocked') ||
            text.includes('Unlocked')) {
            console.log(`📋 ${text}`);
        }
    });

    await page.goto('http://localhost:5000/test-home/');
    await page.waitForSelector('.game-card', { timeout: 5000 });
    
    console.log('\n✨ Page loaded successfully');
    await page.screenshot({ path: 'initial_page_state.png' });

    // Test 1: Rapid clicking protection
    console.log('\n🔥 Test 1: Rapid Clicking Protection');
    console.log('Clicking like button 15 times rapidly...');
    
    const rapidClickResults = [];
    for (let i = 0; i < 15; i++) {
        try {
            await page.evaluate(() => {
                const btn = document.querySelector('.btn-like[data-game-name="Space Invaders"]');
                if (btn) {
                    btn.click();
                }
            });
            rapidClickResults.push(`Click ${i + 1}: Attempted`);
        } catch (error) {
            rapidClickResults.push(`Click ${i + 1}: Failed - ${error.message}`);
        }
    }

    // Give time for requests to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'after_rapid_clicks.png' });

    // Test 2: Visual feedback verification
    console.log('\n🎨 Test 2: Visual Feedback During Request');
    
    const visualTest = await page.evaluate(() => {
        const likeBtn = document.querySelector('.btn-like[data-game-name="Cosmic Dino Runner"]');
        if (!likeBtn) return { error: 'Button not found' };

        // Check initial state
        const beforeClick = {
            opacity: likeBtn.style.opacity || 'default',
            pointerEvents: likeBtn.style.pointerEvents || 'default',
            locked: likeBtn.dataset.locked || 'false'
        };

        // Click and immediately check state
        likeBtn.click();
        
        // Check state 100ms after click (should be locked)
        const afterClick = {
            opacity: likeBtn.style.opacity || 'default',
            pointerEvents: likeBtn.style.pointerEvents || 'default', 
            locked: likeBtn.dataset.locked || 'false'
        };

        return { beforeClick, afterClick };
    });

    console.log('Visual feedback test results:', JSON.stringify(visualTest, null, 2));

    // Test 3: State consistency check
    console.log('\n📊 Test 3: State Consistency');
    
    const stateTest = await page.evaluate(() => {
        // Get current sidebar counts
        const likedNav = document.querySelector('[data-category="Liked"] .nav-count');
        const favoritedNav = document.querySelector('[data-category="Favorited"] .nav-count');
        
        return {
            currentLikes: likedNav ? likedNav.textContent : 'N/A',
            currentFavorites: favoritedNav ? favoritedNav.textContent : 'N/A'
        };
    });

    console.log('Current sidebar counts:', stateTest);

    // Wait for all requests to settle
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'final_test_state.png' });

    // Analyze console logs
    const blockedActions = consoleLogs.filter(log => log.includes('action blocked')).length;
    const startedActions = consoleLogs.filter(log => log.includes('Starting')).length;
    const unlockedActions = consoleLogs.filter(log => log.includes('Unlocked')).length;

    console.log('\n📈 TEST RESULTS ANALYSIS');
    console.log('=' .repeat(50));
    console.log(`🚫 Blocked actions: ${blockedActions}`);
    console.log(`▶️  Started actions: ${startedActions}`);
    console.log(`🔓 Unlocked buttons: ${unlockedActions}`);
    console.log(`📝 Total console logs: ${consoleLogs.length}`);

    // Success criteria
    const protectionWorking = blockedActions > 0 && startedActions < 15;
    const unlockingWorking = unlockedActions > 0;
    
    console.log('\n🎯 PROTECTION ASSESSMENT');
    console.log('=' .repeat(50));
    console.log(`Race condition protection: ${protectionWorking ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Button unlocking: ${unlockingWorking ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Overall protection: ${protectionWorking && unlockingWorking ? '✅ EXCELLENT' : '⚠️  NEEDS REVIEW'}`);

    if (protectionWorking && unlockingWorking) {
        console.log('\n🎉 SUCCESS: Enhanced race condition protection is working correctly!');
        console.log('   - Multiple rapid clicks are being blocked');
        console.log('   - Only legitimate requests are being processed');
        console.log('   - Buttons are being properly unlocked after requests');
    } else {
        console.log('\n⚠️  Issues detected in the protection system');
    }

    await browser.close();
}

// Run the test
testRaceProtection().catch(console.error);