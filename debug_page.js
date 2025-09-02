const puppeteer = require('puppeteer');

async function debugPage() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:5000/test-home/', { waitUntil: 'networkidle0' });
        
        // Take screenshot
        await page.screenshot({ path: 'debug_initial.png', fullPage: true });
        
        // Find all button-like elements
        const buttons = await page.evaluate(() => {
            const allButtons = Array.from(document.querySelectorAll('button, .btn, [class*="like"], [class*="favorite"]'));
            return allButtons.map(btn => ({
                tagName: btn.tagName,
                className: btn.className,
                id: btn.id,
                textContent: btn.textContent.trim(),
                innerHTML: btn.innerHTML
            }));
        });
        
        console.log('Found buttons/button-like elements:', buttons);
        
        // Check for any elements with 'like' or 'favorite' in class or text
        const likeElements = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            return elements.filter(el => 
                el.className.includes('like') || 
                el.className.includes('favorite') ||
                el.textContent.toLowerCase().includes('like') ||
                el.textContent.toLowerCase().includes('favorite')
            ).map(el => ({
                tagName: el.tagName,
                className: el.className,
                id: el.id,
                textContent: el.textContent.trim().substring(0, 100)
            }));
        });
        
        console.log('Elements with "like" or "favorite":', likeElements);
        
        // Get page HTML structure (first 2000 chars)
        const html = await page.content();
        console.log('Page HTML structure (first 2000 chars):', html.substring(0, 2000));
        
    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        await browser.close();
    }
}

debugPage();