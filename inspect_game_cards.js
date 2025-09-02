const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== Inspecting game card structure ===');
    
    await page.goto('http://localhost:5000/test-home');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Get the first game card
    const gameCards = await page.$$('.game-card');
    console.log(`Found ${gameCards.length} game cards`);
    
    if (gameCards.length > 0) {
      const firstCard = gameCards[0];
      
      // Get the full HTML of the first card
      const cardHTML = await firstCard.innerHTML();
      console.log('\n=== First Game Card HTML ===');
      console.log(cardHTML);
      
      // Try to find text content in various ways
      console.log('\n=== Trying different selectors for game title ===');
      
      // Try different selectors
      const selectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        '.title', '.game-title', '.card-title', '.name',
        'a', 'span', 'div', '.game-name'
      ];
      
      for (let selector of selectors) {
        try {
          const elements = await firstCard.$$(selector);
          if (elements.length > 0) {
            console.log(`Found ${elements.length} elements with selector "${selector}"`);
            for (let i = 0; i < Math.min(3, elements.length); i++) {
              const text = await elements[i].textContent();
              console.log(`  Element ${i + 1}: "${text?.trim()}"`);
            }
          }
        } catch (e) {
          // Skip if selector fails
        }
      }
      
      // Try to get all text content directly
      console.log('\n=== All text content in first card ===');
      const allText = await firstCard.textContent();
      console.log(`"${allText}"`);
      
      // Look for any elements with meaningful text
      console.log('\n=== Elements with meaningful text ===');
      const allElements = await firstCard.$$('*');
      for (let i = 0; i < Math.min(10, allElements.length); i++) {
        const element = allElements[i];
        const tagName = await element.evaluate(el => el.tagName);
        const text = await element.textContent();
        const className = await element.getAttribute('class');
        
        if (text && text.trim().length > 0 && text.trim().length < 50) {
          console.log(`<${tagName}> class="${className}": "${text.trim()}"`);
        }
      }
    }
    
    await page.screenshot({ path: 'game_card_inspection.png', fullPage: true });
    
  } catch (error) {
    console.error('Error inspecting game cards:', error.message);
    await page.screenshot({ path: 'game_card_inspection_error.png', fullPage: true });
  }
  
  await browser.close();
})();