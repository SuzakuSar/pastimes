const puppeteer = require('puppeteer');

async function debugGameLink() {
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
        
        // Debug: Check for clickable elements
        const gameCard = await page.$('.game-card');
        if (gameCard) {
            const gameCardHTML = await page.evaluate((card) => {
                return card.outerHTML;
            }, gameCard);
            
            console.log('Game card HTML structure:');
            console.log(gameCardHTML);
            
            // Check different possible selectors for navigation
            const selectors = [
                '.game-card a',
                '.game-card',
                '.card-thumbnail',
                '.thumbnail-placeholder',
                '[onclick]'
            ];
            
            for (const selector of selectors) {
                const element = await page.$(selector);
                if (element) {
                    const onclick = await page.evaluate((el) => {
                        return el.getAttribute('onclick') || el.getAttribute('href') || 'no onclick/href';
                    }, element);
                    console.log(`${selector}: found, onclick/href = ${onclick}`);
                } else {
                    console.log(`${selector}: not found`);
                }
            }
        }
        
    } catch (error) {
        console.error('Debug failed:', error.message);
    } finally {
        await browser.close();
    }
}

debugGameLink().catch(console.error);