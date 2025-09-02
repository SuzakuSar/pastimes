const puppeteer = require('puppeteer');

async function debugFavoriteButton() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    
    try {
        console.log('Navigating to test home page...');
        await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Debug: Check page structure
        const gameCards = await page.$$('.game-card');
        console.log(`Found ${gameCards.length} game cards`);
        
        if (gameCards.length > 0) {
            // Hover over first card
            await gameCards[0].hover();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check for different possible favorite button selectors
            const possibleSelectors = [
                '.favorite-btn',
                '.favorite-button',
                '.btn-favorite',
                'button[onclick*="favorite"]',
                '[onclick*="favorite"]',
                '.heart',
                '.fa-heart',
                'i.fa-heart'
            ];
            
            for (const selector of possibleSelectors) {
                const elements = await page.$$(selector);
                console.log(`Selector "${selector}": found ${elements.length} elements`);
            }
            
            // Get HTML content of first game card
            const cardHTML = await page.evaluate((card) => {
                return card.innerHTML;
            }, gameCards[0]);
            
            console.log('First game card HTML:');
            console.log(cardHTML);
            
            // Take screenshot for visual inspection
            await page.screenshot({ path: 'debug_favorite_button.png', fullPage: true });
            console.log('Debug screenshot taken');
        }
        
    } catch (error) {
        console.error('Debug failed:', error.message);
    } finally {
        await browser.close();
    }
}

debugFavoriteButton().catch(console.error);