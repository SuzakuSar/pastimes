const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  console.log('=== WHITE HEART INDICATORS FIX TEST (CORRECTED SELECTORS) ===\n');
  
  // Step 1: Navigate to test-home page
  console.log('Step 1: Navigating to test-home page...');
  await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.game-card', { timeout: 5000 });
  
  await page.screenshot({ path: 'step1_test_home_initial_state.png', fullPage: true });
  
  // Find heart buttons more accurately
  const heartButtonInfo = await page.evaluate(() => {
    // Look for elements containing heart symbols
    const allElements = document.querySelectorAll('*');
    const heartElements = [];
    
    allElements.forEach((element, index) => {
      const text = element.textContent || '';
      if ((text.includes('♡') || text.includes('♥')) && element.children.length === 0) {
        // This is likely a heart button
        heartElements.push({
          index: index,
          text: text.trim(),
          tagName: element.tagName,
          className: element.className,
          parentClassName: element.parentElement ? element.parentElement.className : '',
          parentTagName: element.parentElement ? element.parentElement.tagName : '',
          isClickable: element.onclick !== null || element.style.cursor === 'pointer' || element.getAttribute('onclick') !== null
        });
      }
    });
    
    return {
      heartElements: heartElements,
      totalElements: allElements.length
    };
  });
  
  console.log('Heart button analysis:', JSON.stringify(heartButtonInfo, null, 2));
  
  // Now try to find clickable heart containers
  const clickableHearts = await page.evaluate(() => {
    const gameCards = document.querySelectorAll('.game-card');
    const clickableHeartInfo = [];
    
    gameCards.forEach((card, cardIndex) => {
      // Look for heart symbols in this card
      const cardText = card.textContent;
      if (cardText.includes('♡') || cardText.includes('♥')) {
        // Find the clickable parent element
        const allElements = card.querySelectorAll('*');
        allElements.forEach(element => {
          const elementText = element.textContent;
          if ((elementText.includes('♡') || elementText.includes('♥')) && 
              (element.onclick || element.getAttribute('onclick') || element.style.cursor === 'pointer')) {
            clickableHeartInfo.push({
              cardIndex: cardIndex,
              element: {
                tagName: element.tagName,
                className: element.className,
                text: elementText.trim(),
                hasOnClick: !!element.onclick,
                onClickAttr: element.getAttribute('onclick'),
                cursor: element.style.cursor
              }
            });
          }
        });
      }
    });
    
    return clickableHeartInfo;
  });
  
  console.log('Clickable hearts found:', JSON.stringify(clickableHearts, null, 2));
  
  // Step 2: Try to click hearts using a different approach
  console.log('\nStep 2: Attempting to favorite games...');
  
  // Try clicking on heart areas within game cards
  const gameCards = await page.$$('.game-card');
  console.log(`Found ${gameCards.length} game cards`);
  
  let successfulClicks = 0;
  
  for (let i = 0; i < Math.min(3, gameCards.length); i++) {
    try {
      // Try to find and click heart button within this card
      const heartClicked = await page.evaluate((cardIndex) => {
        const card = document.querySelectorAll('.game-card')[cardIndex];
        if (!card) return false;
        
        // Look for elements containing heart symbols that might be clickable
        const allElements = card.querySelectorAll('*');
        for (let element of allElements) {
          const text = element.textContent;
          if (text.includes('♡') || text.includes('♥')) {
            // Try clicking on this element or its parent
            const clickableElement = element.onclick ? element : element.parentElement;
            if (clickableElement && (clickableElement.onclick || clickableElement.getAttribute('onclick'))) {
              clickableElement.click();
              return true;
            }
          }
        }
        return false;
      }, i);
      
      if (heartClicked) {
        successfulClicks++;
        console.log(`Successfully clicked heart ${i + 1}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`Could not find clickable heart in card ${i + 1}`);
      }
    } catch (error) {
      console.log(`Error clicking heart ${i + 1}:`, error.message);
    }
  }
  
  await page.screenshot({ path: 'step2_after_heart_clicks.png', fullPage: true });
  
  console.log(`Successfully clicked ${successfulClicks} hearts`);
  
  // Step 3: Check for white heart indicators
  const whiteHeartCheck = await page.evaluate(() => {
    const results = {
      whiteHearts: 0,
      details: []
    };
    
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach((card, index) => {
      const cardText = card.textContent;
      const hasWhiteHeart = cardText.includes('♥');
      const hasEmptyHeart = cardText.includes('♡');
      
      if (hasWhiteHeart) {
        results.whiteHearts++;
      }
      
      results.details.push({
        cardIndex: index,
        hasWhiteHeart: hasWhiteHeart,
        hasEmptyHeart: hasEmptyHeart,
        gameName: card.getAttribute('data-game-name') || 'Unknown',
        favorited: card.getAttribute('data-favorited') === 'true'
      });
    });
    
    return results;
  });
  
  console.log('\\nWhite heart check results:', JSON.stringify(whiteHeartCheck, null, 2));
  
  // Step 4: Test category switching
  console.log('\\nStep 3: Testing category switching...');
  
  const categories = ['Featured', 'Favorited', 'Skill', 'Arcade'];
  
  for (let category of categories) {
    try {
      console.log(`\\nSwitching to ${category} category...`);
      
      // Find and click the category button
      const categoryButton = await page.evaluate((cat) => {
        const navLinks = document.querySelectorAll('.nav-link');
        for (let link of navLinks) {
          if (link.textContent.includes(cat)) {
            link.click();
            return true;
          }
        }
        return false;
      }, category);
      
      if (categoryButton) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({ path: `step3_${category.toLowerCase()}_category.png`, fullPage: true });
        
        // Check white hearts in this category
        const categoryHeartCheck = await page.evaluate(() => {
          const results = {
            whiteHearts: 0,
            totalCards: 0,
            details: []
          };
          
          const gameCards = document.querySelectorAll('.game-card');
          results.totalCards = gameCards.length;
          
          gameCards.forEach((card, index) => {
            const cardText = card.textContent;
            const hasWhiteHeart = cardText.includes('♥');
            const hasEmptyHeart = cardText.includes('♡');
            
            if (hasWhiteHeart) {
              results.whiteHearts++;
            }
            
            results.details.push({
              cardIndex: index,
              hasWhiteHeart: hasWhiteHeart,
              hasEmptyHeart: hasEmptyHeart,
              gameName: card.getAttribute('data-game-name') || 'Unknown',
              favorited: card.getAttribute('data-favorited') === 'true'
            });
          });
          
          return results;
        });
        
        console.log(`${category} category heart check:`, JSON.stringify(categoryHeartCheck, null, 2));
      } else {
        console.log(`Could not find ${category} category button`);
      }
    } catch (error) {
      console.log(`Error testing ${category} category:`, error.message);
    }
  }
  
  // Final screenshot
  await page.screenshot({ path: 'step4_final_test_state.png', fullPage: true });
  
  console.log('\\n=== TEST COMPLETED ===');
  
  await browser.close();
})();