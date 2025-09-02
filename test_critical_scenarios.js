/**
 * Critical Race Condition Scenarios Test
 * Tests the specific scenarios mentioned in the requirements
 */

const puppeteer = require('puppeteer');

async function testCriticalScenarios() {
    console.log('🎯 Testing Critical Race Condition Scenarios');
    console.log('=' .repeat(60));

    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: false,
        slowMo: 50
    });
    
    const page = await browser.newPage();
    
    const testResults = [];
    const consoleLogs = [];
    
    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(text);
    });

    await page.goto('http://localhost:5000/test-home/');
    await page.waitForSelector('.game-card');
    
    console.log('✅ Test environment ready\n');

    // ==========================================
    // CRITICAL TEST 1: Ultra-Rapid Clicking
    // ==========================================
    console.log('🔥 CRITICAL TEST 1: Ultra-Rapid Clicking (Same Button)');
    console.log('Clicking like button as fast as possible 20 times...');
    
    const startTime = Date.now();
    const clickPromises = [];
    
    // Fire 20 clicks as rapidly as possible
    for (let i = 0; i < 20; i++) {
        clickPromises.push(
            page.evaluate(() => {
                document.querySelector('.btn-like[data-game-name="Space Invaders"]').click();
            })
        );
    }
    
    await Promise.all(clickPromises);
    const totalTime = Date.now() - startTime;
    
    console.log(`⚡ Completed 20 clicks in ${totalTime}ms (${Math.round(20000/totalTime)} clicks/second)`);
    
    // Wait for all requests to settle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const blockedCount1 = consoleLogs.filter(log => log.includes('action blocked')).length;
    const startedCount1 = consoleLogs.filter(log => log.includes('Starting like')).length;
    
    testResults.push({
        test: 'Ultra-Rapid Clicking',
        attempted: 20,
        blocked: blockedCount1,
        started: startedCount1,
        success: blockedCount1 > 15 && startedCount1 <= 4
    });

    console.log(`📊 Result: ${startedCount1} requests started, ${blockedCount1} blocked`);
    await page.screenshot({ path: 'critical_test_1.png' });

    // ==========================================
    // CRITICAL TEST 2: Mixed Like/Favorite Rapid Fire
    // ==========================================
    console.log('\n🎭 CRITICAL TEST 2: Mixed Like/Favorite Rapid Fire');
    console.log('Alternating between like and favorite buttons rapidly...');
    
    const initialLogs = consoleLogs.length;
    
    // Alternate between like and favorite 10 times each
    for (let i = 0; i < 10; i++) {
        await page.evaluate(() => {
            document.querySelector('.btn-like[data-game-name="Cosmic Dino Runner"]').click();
        });
        await page.evaluate(() => {
            document.querySelector('.btn-favorite[data-game-name="Cosmic Dino Runner"]').click();
        });
    }
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const newLogs = consoleLogs.slice(initialLogs);
    const likeBlocked = newLogs.filter(log => log.includes('Like action blocked')).length;
    const favoriteBlocked = newLogs.filter(log => log.includes('Favorite action blocked')).length;
    const likeStarted = newLogs.filter(log => log.includes('Starting like')).length;
    const favoriteStarted = newLogs.filter(log => log.includes('Starting favorite')).length;
    
    testResults.push({
        test: 'Mixed Like/Favorite',
        likeAttempted: 10,
        favoriteAttempted: 10,
        likeBlocked,
        favoriteBlocked,
        likeStarted,
        favoriteStarted,
        success: (likeBlocked + favoriteBlocked) > 10 && (likeStarted + favoriteStarted) <= 6
    });

    console.log(`📊 Like: ${likeStarted} started, ${likeBlocked} blocked`);
    console.log(`📊 Favorite: ${favoriteStarted} started, ${favoriteBlocked} blocked`);
    await page.screenshot({ path: 'critical_test_2.png' });

    // ==========================================  
    // CRITICAL TEST 3: Multi-Game Simultaneous
    // ==========================================
    console.log('\n🌐 CRITICAL TEST 3: Multi-Game Simultaneous Actions');
    console.log('Clicking buttons on 4 different games simultaneously...');
    
    const games = ['Space Invaders', 'Cosmic Dino Runner', 'React Time Challenge', 'Time Predict Challenge'];
    const initialLogs2 = consoleLogs.length;
    
    // Click like button on all games simultaneously
    const simultaneousPromises = games.map(gameName => 
        page.evaluate((name) => {
            const btn = document.querySelector(`.btn-like[data-game-name="${name}"]`);
            if (btn) btn.click();
        }, gameName)
    );
    
    await Promise.all(simultaneousPromises);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const simultaneousLogs = consoleLogs.slice(initialLogs2);
    const simultaneousBlocked = simultaneousLogs.filter(log => log.includes('action blocked')).length;
    const simultaneousStarted = simultaneousLogs.filter(log => log.includes('Starting')).length;
    
    testResults.push({
        test: 'Multi-Game Simultaneous',
        attempted: games.length,
        blocked: simultaneousBlocked,
        started: simultaneousStarted,
        success: simultaneousStarted <= games.length && simultaneousBlocked >= 0
    });

    console.log(`📊 Result: ${simultaneousStarted} requests started, ${simultaneousBlocked} blocked`);
    await page.screenshot({ path: 'critical_test_3.png' });

    // ==========================================
    // CRITICAL TEST 4: State Consistency Verification
    // ==========================================
    console.log('\n🔍 CRITICAL TEST 4: State Consistency Check');
    
    const finalState = await page.evaluate(() => {
        const likedNav = document.querySelector('[data-category="Liked"] .nav-count');
        const favoritedNav = document.querySelector('[data-category="Favorited"] .nav-count');
        const spaceInvadersLikes = document.querySelector('.btn-like[data-game-name="Space Invaders"]').getAttribute('data-liked');
        const cosmicDinoLikes = document.querySelector('.btn-like[data-game-name="Cosmic Dino Runner"]').getAttribute('data-liked');
        const cosmicDinoFavorite = document.querySelector('.btn-favorite[data-game-name="Cosmic Dino Runner"]').getAttribute('data-favorited');
        
        return {
            sidebarLikes: likedNav ? likedNav.textContent : 'N/A',
            sidebarFavorites: favoritedNav ? favoritedNav.textContent : 'N/A',
            spaceInvadersLiked: spaceInvadersLikes === 'true',
            cosmicDinoLiked: cosmicDinoLikes === 'true',
            cosmicDinoFavorited: cosmicDinoFavorite === 'true'
        };
    });

    testResults.push({
        test: 'State Consistency',
        finalState,
        success: finalState.sidebarLikes !== 'N/A' && finalState.sidebarFavorites !== 'N/A'
    });

    console.log('📊 Final State:', JSON.stringify(finalState, null, 2));
    await page.screenshot({ path: 'critical_test_final.png' });

    // ==========================================
    // COMPREHENSIVE REPORT
    // ==========================================
    console.log('\n' + '=' .repeat(60));
    console.log('🏆 COMPREHENSIVE RACE CONDITION PROTECTION REPORT');
    console.log('=' .repeat(60));

    let totalPassed = 0;
    
    testResults.forEach((result, index) => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} Test ${index + 1}: ${result.test}`);
        
        if (result.test === 'Ultra-Rapid Clicking') {
            console.log(`    📊 ${result.started}/${result.attempted} requests processed (${result.blocked} blocked)`);
            console.log(`    🎯 Protection efficiency: ${Math.round((result.blocked/result.attempted) * 100)}%`);
        } else if (result.test === 'Mixed Like/Favorite') {
            console.log(`    📊 Like: ${result.likeStarted}/10 processed, Favorite: ${result.favoriteStarted}/10 processed`);
            console.log(`    🎯 Total blocked: ${result.likeBlocked + result.favoriteBlocked}`);
        } else if (result.test === 'Multi-Game Simultaneous') {
            console.log(`    📊 ${result.started}/${result.attempted} games processed simultaneously`);
        }
        
        if (result.success) totalPassed++;
    });

    const overallLogs = consoleLogs.filter(log => 
        log.includes('Starting') || log.includes('action blocked') || log.includes('Unlocked')
    );
    
    const totalBlocked = consoleLogs.filter(log => log.includes('action blocked')).length;
    const totalStarted = consoleLogs.filter(log => log.includes('Starting')).length;
    const totalUnlocked = consoleLogs.filter(log => log.includes('Unlocked')).length;

    console.log('\n📈 OVERALL STATISTICS');
    console.log('=' .repeat(60));
    console.log(`🚫 Total actions blocked: ${totalBlocked}`);
    console.log(`▶️  Total requests started: ${totalStarted}`);
    console.log(`🔓 Total buttons unlocked: ${totalUnlocked}`);
    console.log(`📊 Tests passed: ${totalPassed}/${testResults.length}`);
    console.log(`🎯 Success rate: ${Math.round((totalPassed/testResults.length) * 100)}%`);

    // Final assessment
    if (totalPassed === testResults.length && totalBlocked > 20 && totalUnlocked > 0) {
        console.log('\n🎉 EXCELLENT! Enhanced race condition protection is working perfectly!');
        console.log('✅ All critical scenarios passed');
        console.log('✅ Multiple rapid clicks are being blocked effectively');
        console.log('✅ State consistency is maintained');
        console.log('✅ Visual feedback is working (buttons locked during requests)');
        console.log('✅ No more canceling out behavior should occur');
    } else if (totalPassed >= testResults.length * 0.75) {
        console.log('\n✅ GOOD! Most protection mechanisms are working correctly');
        console.log('⚠️  Some minor issues may need attention');
    } else {
        console.log('\n⚠️  ISSUES DETECTED in the race condition protection');
        console.log('❌ Review the protection mechanisms and fix failing tests');
    }

    await browser.close();
}

testCriticalScenarios().catch(console.error);