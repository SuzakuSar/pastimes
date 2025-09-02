const { chromium } = require('playwright');

async function testDetailedFavoriteSystem() {
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 Detailed Favorite System Analysis');
    console.log('='.repeat(50));
    
    try {
        await page.goto('http://localhost:5000/test-home/');
        await page.waitForLoadState('networkidle');
        
        // Monitor network requests
        const apiCalls = [];
        page.on('response', response => {
            if (response.url().includes('/api/')) {
                apiCalls.push({
                    url: response.url(),
                    status: response.status(),
                    method: 'Unknown' // Would need request event for this
                });
            }
        });
        
        const gameCard = page.locator('.game-card').first();
        const favoriteBtn = gameCard.locator('.btn-favorite');
        const gameName = await gameCard.getAttribute('data-game-name');
        
        console.log(`🎮 Testing favorite functionality for: ${gameName}`);
        
        // Check initial state
        const initialState = await favoriteBtn.getAttribute('data-favorited');
        console.log(`📊 Initial favorite state: ${initialState}`);
        
        // Test favorite toggle
        console.log('\n🧪 Clicking favorite button...');
        await favoriteBtn.click();
        await page.waitForTimeout(2000);
        
        const afterClickState = await favoriteBtn.getAttribute('data-favorited');
        console.log(`📊 After click state: ${afterClickState}`);
        
        // Check sidebar count
        const sidebarFavoriteCount = await page.locator('[data-category="Favorited"] .nav-count').textContent().catch(() => '0');
        console.log(`📊 Sidebar favorite count: ${sidebarFavoriteCount}`);
        
        // Test persistence
        console.log('\n🔄 Testing persistence after refresh...');
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const afterRefreshGameCard = page.locator('.game-card').first();
        const afterRefreshFavoriteBtn = afterRefreshGameCard.locator('.btn-favorite');
        const afterRefreshState = await afterRefreshFavoriteBtn.getAttribute('data-favorited');
        const afterRefreshSidebarCount = await page.locator('[data-category="Favorited"] .nav-count').textContent().catch(() => '0');
        
        console.log(`📊 After refresh state: ${afterRefreshState}`);
        console.log(`📊 After refresh sidebar count: ${afterRefreshSidebarCount}`);
        
        // Check API calls
        console.log('\n🌐 API Calls Made:');
        apiCalls.forEach(call => {
            console.log(`  - ${call.method} ${call.url} (${call.status})`);
        });
        
        // Final analysis
        const stateChanged = initialState !== afterClickState;
        const persistsAfterRefresh = afterClickState === afterRefreshState;
        const sidebarUpdated = parseInt(afterRefreshSidebarCount) > 0;
        
        console.log('\n' + '='.repeat(50));
        console.log('📋 DETAILED ANALYSIS RESULTS');
        console.log('='.repeat(50));
        console.log(`✅ State Changed on Click: ${stateChanged ? 'PASS' : 'FAIL'}`);
        console.log(`✅ State Persists After Refresh: ${persistsAfterRefresh ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Sidebar Count Updated: ${sidebarUpdated ? 'PASS' : 'FAIL'}`);
        
        return {
            stateChanged,
            persistsAfterRefresh,
            sidebarUpdated,
            apiCallCount: apiCalls.length
        };
        
    } catch (error) {
        console.error('❌ Detailed test failed:', error.message);
        await page.screenshot({ path: 'detailed_test_error.png', fullPage: true });
        throw error;
    } finally {
        await browser.close();
    }
}

testDetailedFavoriteSystem()
    .then(results => {
        console.log('\n🎉 Detailed favorite system test completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Detailed test failed:', error);
        process.exit(1);
    });