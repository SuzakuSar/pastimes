const puppeteer = require('puppeteer');

async function testWhiteHeartDetailed() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('=== DETAILED WHITE HEART INDICATOR TEST ===\n');
    
    // Step 1: Navigate and capture initial state
    console.log('Step 1: Navigating to test-home page and analyzing initial state...');
    await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ path: 'detailed_step1_initial_state.png', fullPage: false });
    
    // Check DOM structure before any interactions
    const initialAnalysis = await page.evaluate(() => {
      const cards = document.querySelectorAll('.game-card');
      const results = [];
      
      cards.forEach((card, index) => {
        const gameName = card.dataset.gameName || `Card ${index + 1}`;
        const cardFavorited = card.getAttribute('data-favorited');
        const favoriteButton = card.querySelector('.btn-favorite');
        const buttonFavorited = favoriteButton ? favoriteButton.getAttribute('data-favorited') : 'not found';
        const whiteHeart = card.querySelector('.favorite-heart');
        const hasWhiteHeartCSS = window.getComputedStyle(card, '::after').content !== 'none';
        
        results.push({
          gameName,
          cardDataFavorited: cardFavorited,
          buttonDataFavorited: buttonFavorited,
          whiteHeartElement: whiteHeart !== null,
          hasWhiteHeartCSS
        });
      });
      
      return results;
    });
    
    console.log('Initial DOM Analysis:');
    initialAnalysis.forEach(result => {
      console.log(`  ${result.gameName}:`);
      console.log(`    Card data-favorited: ${result.cardDataFavorited}`);
      console.log(`    Button data-favorited: ${result.buttonDataFavorited}`);
      console.log(`    Has white heart CSS: ${result.hasWhiteHeartCSS}`);
    });
    
    // Step 2: Click favorite on first card and analyze changes
    console.log('\nStep 2: Clicking favorite on first card...');
    const firstCard = await page.$('.game-card');
    const firstFavoriteButton = await page.$('.game-card .btn-favorite');
    
    if (firstFavoriteButton) {
      await firstFavoriteButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for state to update
      
      await page.screenshot({ path: 'detailed_step2_after_favorite_click.png', fullPage: false });
      
      // Analyze DOM after favoriting
      const afterFavoriteAnalysis = await page.evaluate(() => {
        const firstCard = document.querySelector('.game-card');
        const gameName = firstCard.dataset.gameName || 'First Card';
        const cardFavorited = firstCard.getAttribute('data-favorited');
        const favoriteButton = firstCard.querySelector('.btn-favorite');
        const buttonFavorited = favoriteButton ? favoriteButton.getAttribute('data-favorited') : 'not found';
        const whiteHeart = firstCard.querySelector('.favorite-heart');
        
        // Check if CSS pseudo-element is applied
        const cardStyles = window.getComputedStyle(firstCard, '::after');
        const pseudoContent = cardStyles.content;
        const pseudoDisplay = cardStyles.display;
        const pseudoColor = cardStyles.color;
        const pseudoPosition = cardStyles.position;
        
        return {
          gameName,
          cardDataFavorited: cardFavorited,
          buttonDataFavorited: buttonFavorited,
          whiteHeartElement: whiteHeart !== null,
          pseudoElement: {
            content: pseudoContent,
            display: pseudoDisplay,
            color: pseudoColor,
            position: pseudoPosition
          }
        };
      });
      
      console.log('After Favorite Click Analysis:');
      console.log(`  ${afterFavoriteAnalysis.gameName}:`);
      console.log(`    Card data-favorited: ${afterFavoriteAnalysis.cardDataFavorited}`);
      console.log(`    Button data-favorited: ${afterFavoriteAnalysis.buttonDataFavorited}`);
      console.log(`    Pseudo-element CSS:`);
      console.log(`      Content: ${afterFavoriteAnalysis.pseudoElement.content}`);
      console.log(`      Display: ${afterFavoriteAnalysis.pseudoElement.display}`);
      console.log(`      Color: ${afterFavoriteAnalysis.pseudoElement.color}`);
      console.log(`      Position: ${afterFavoriteAnalysis.pseudoElement.position}`);
      
      // Step 3: Check CSS rule application
      console.log('\nStep 3: Checking CSS rule application...');
      const cssRuleCheck = await page.evaluate(() => {
        // Find all stylesheets and check for the white heart rule
        const stylesheets = Array.from(document.styleSheets);
        let foundRule = false;
        let ruleText = '';
        
        stylesheets.forEach(stylesheet => {
          try {
            const rules = Array.from(stylesheet.cssRules || stylesheet.rules || []);
            rules.forEach(rule => {
              if (rule.selectorText && rule.selectorText.includes('data-favorited="true"') && rule.selectorText.includes('::after')) {
                foundRule = true;
                ruleText = rule.cssText;
              }
            });
          } catch (e) {
            // Some stylesheets might be cross-origin
          }
        });
        
        return {
          foundRule,
          ruleText
        };
      });
      
      console.log('CSS Rule Check:');
      console.log(`  Found white heart rule: ${cssRuleCheck.foundRule}`);
      if (cssRuleCheck.foundRule) {
        console.log(`  Rule text: ${cssRuleCheck.ruleText}`);
      }
      
      // Step 4: Manual DOM manipulation test
      console.log('\nStep 4: Manual DOM manipulation test...');
      await page.evaluate(() => {
        const firstCard = document.querySelector('.game-card');
        console.log('Setting data-favorited="true" directly on card...');
        firstCard.setAttribute('data-favorited', 'true');
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.screenshot({ path: 'detailed_step4_manual_attribute_set.png', fullPage: false });
      
      const manualTestResult = await page.evaluate(() => {
        const firstCard = document.querySelector('.game-card');
        const cardStyles = window.getComputedStyle(firstCard, '::after');
        const pseudoContent = cardStyles.content;
        
        return {
          cardAttribute: firstCard.getAttribute('data-favorited'),
          pseudoContent: pseudoContent,
          isHeartVisible: pseudoContent === '"♥"' || pseudoContent === "'♥'" || pseudoContent.includes('♥')
        };
      });
      
      console.log('Manual DOM Test Result:');
      console.log(`  Card data-favorited: ${manualTestResult.cardAttribute}`);
      console.log(`  Pseudo content: ${manualTestResult.pseudoContent}`);
      console.log(`  Heart visible: ${manualTestResult.isHeartVisible}`);
      
      // Step 5: Check JavaScript state management
      console.log('\nStep 5: Checking JavaScript state management...');
      const jsStateCheck = await page.evaluate(() => {
        const gameStateManager = window.hubDebug ? window.hubDebug.gameState : null;
        if (gameStateManager) {
          const firstCard = document.querySelector('.game-card');
          const gameName = firstCard.dataset.gameName;
          return {
            stateManagerExists: true,
            isFavorited: gameStateManager.isFavorited(gameName),
            favoritedGames: Array.from(gameStateManager.favoritedGames),
            initialized: gameStateManager.initialized
          };
        }
        return { stateManagerExists: false };
      });
      
      console.log('JavaScript State Check:');
      if (jsStateCheck.stateManagerExists) {
        console.log(`  State manager initialized: ${jsStateCheck.initialized}`);
        console.log(`  Is favorited: ${jsStateCheck.isFavorited}`);
        console.log(`  Favorited games: ${JSON.stringify(jsStateCheck.favoritedGames)}`);
      } else {
        console.log(`  State manager not accessible`);
      }
    }
    
    console.log('\n=== DETAILED TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'detailed_test_error.png', fullPage: false });
  } finally {
    await browser.close();
  }
}

testWhiteHeartDetailed();