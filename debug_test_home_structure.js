const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  console.log('Debugging test-home page structure...');
  await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.game-card', { timeout: 5000 });
  
  // Debug page structure
  const pageStructure = await page.evaluate(() => {
    const gameCards = document.querySelectorAll('.game-card');
    const structure = {
      gameCardsCount: gameCards.length,
      cards: []
    };
    
    gameCards.forEach((card, index) => {
      const cardStructure = {
        index: index,
        html: card.outerHTML.substring(0, 1000) + '...',
        heartButtons: [],
        likeButtons: []
      };
      
      // Look for heart buttons with various selectors
      const heartSelectors = ['.heart-button', '.heart', '.favorite-btn', 'button[data-action="favorite"]', '.fav-btn'];
      heartSelectors.forEach(selector => {
        const hearts = card.querySelectorAll(selector);
        if (hearts.length > 0) {
          cardStructure.heartButtons.push({
            selector: selector,
            count: hearts.length,
            elements: Array.from(hearts).map(heart => ({
              textContent: heart.textContent.trim(),
              className: heart.className,
              dataAttrs: Array.from(heart.attributes).reduce((obj, attr) => {
                if (attr.name.startsWith('data-')) {
                  obj[attr.name] = attr.value;
                }
                return obj;
              }, {})
            }))
          });
        }
      });
      
      // Look for like buttons
      const likeSelectors = ['.like-button', '.like', '.thumbs-up', 'button[data-action="like"]'];
      likeSelectors.forEach(selector => {
        const likes = card.querySelectorAll(selector);
        if (likes.length > 0) {
          cardStructure.likeButtons.push({
            selector: selector,
            count: likes.length,
            elements: Array.from(likes).map(like => ({
              textContent: like.textContent.trim(),
              className: like.className,
              dataAttrs: Array.from(like.attributes).reduce((obj, attr) => {
                if (attr.name.startsWith('data-')) {
                  obj[attr.name] = attr.value;
                }
                return obj;
              }, {})
            }))
          });
        }
      });
      
      structure.cards.push(cardStructure);
    });
    
    // Also check for category buttons
    const categoryButtons = document.querySelectorAll('[data-category]');
    structure.categoryButtons = Array.from(categoryButtons).map(btn => ({
      textContent: btn.textContent.trim(),
      dataCategory: btn.getAttribute('data-category'),
      className: btn.className
    }));
    
    return structure;
  });
  
  console.log('Test-Home Page Structure:', JSON.stringify(pageStructure, null, 2));
  
  await page.screenshot({ path: 'debug_test_home_structure.png', fullPage: true });
  
  await browser.close();
})();