const puppeteer = require('puppeteer');

async function testGamePlayerHearts() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('=== GAME PLAYER WHITE HEART INDICATOR TEST ===\n');
    
    // Step 1: Navigate to test-home and favorite a game
    console.log('Step 1: Navigate to test-home and favorite a game...');
    await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click favorite on first featured game
    const firstFavoriteButton = await page.$('.featured-games-row .game-card .btn-favorite');
    if (firstFavoriteButton) {
      await firstFavoriteButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Step 2: Navigate to game player
    console.log('Step 2: Navigating to game player interface...');
    const firstCard = await page.$('.game-card');
    await firstCard.click();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ path: 'game_player_initial_state.png', fullPage: false });
    
    // Step 3: Test related games white heart indicators
    console.log('Step 3: Testing related games section...');
    const relatedGamesAnalysis = await page.evaluate(() => {
      const relatedCards = document.querySelectorAll('.related-games .game-card');
      const results = [];
      
      relatedCards.forEach((card, index) => {
        const gameName = card.dataset.gameName || `Related Card ${index + 1}`;
        const cardFavorited = card.getAttribute('data-favorited');
        const favoriteButton = card.querySelector('.btn-favorite');
        const buttonFavorited = favoriteButton ? favoriteButton.getAttribute('data-favorited') : 'not found';
        const cardStyles = window.getComputedStyle(card, '::after');
        const pseudoContent = cardStyles.content;
        const isHeartVisible = pseudoContent === '"♥"' || pseudoContent === "'♥'" || pseudoContent.includes('♥');
        
        results.push({
          gameName,
          cardDataFavorited: cardFavorited,
          buttonDataFavorited: buttonFavorited,
          isHeartVisible,
          pseudoContent
        });
      });
      
      return results;
    });
    
    console.log('Related Games Initial State:');
    if (relatedGamesAnalysis.length > 0) {
      relatedGamesAnalysis.forEach(result => {
        console.log(`  ${result.gameName}:`);
        console.log(`    Card data-favorited: ${result.cardDataFavorited}`);
        console.log(`    Button data-favorited: ${result.buttonDataFavorited}`);
        console.log(`    White heart visible: ${result.isHeartVisible}`);
      });
    } else {
      console.log('  No related games found');
    }
    
    // Step 4: Favorite a related game
    if (relatedGamesAnalysis.length > 0) {
      console.log('\nStep 4: Favoriting a related game...');
      const relatedFavoriteButton = await page.$('.related-games .game-card .btn-favorite');
      if (relatedFavoriteButton) {
        await relatedFavoriteButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.screenshot({ path: 'game_player_after_related_favorite.png', fullPage: false });
        
        // Check if white heart appears
        const afterFavoriteAnalysis = await page.evaluate(() => {
          const firstRelatedCard = document.querySelector('.related-games .game-card');
          if (firstRelatedCard) {
            const cardStyles = window.getComputedStyle(firstRelatedCard, '::after');
            const pseudoContent = cardStyles.content;
            return {
              cardFavorited: firstRelatedCard.getAttribute('data-favorited'),
              pseudoContent: pseudoContent,
              isHeartVisible: pseudoContent === '"♥"' || pseudoContent === "'♥'" || pseudoContent.includes('♥')
            };
          }
          return null;
        });
        
        if (afterFavoriteAnalysis) {
          console.log('After Favoriting Related Game:');
          console.log(`  Card data-favorited: ${afterFavoriteAnalysis.cardFavorited}`);
          console.log(`  Pseudo content: ${afterFavoriteAnalysis.pseudoContent}`);
          console.log(`  White heart visible: ${afterFavoriteAnalysis.isHeartVisible}`);
        }
      }
    }
    
    // Step 5: Test unfavoriting
    console.log('\nStep 5: Testing unfavorite functionality...');
    const favoriteButtonToUnfavorite = await page.$('.related-games .game-card .btn-favorite[data-favorited="true"]');
    if (favoriteButtonToUnfavorite) {
      await favoriteButtonToUnfavorite.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.screenshot({ path: 'game_player_after_unfavorite.png', fullPage: false });
      
      const afterUnfavoriteAnalysis = await page.evaluate(() => {
        const unfavoritedCard = document.querySelector('.related-games .game-card');
        if (unfavoritedCard) {
          const cardStyles = window.getComputedStyle(unfavoritedCard, '::after');
          const pseudoContent = cardStyles.content;
          return {
            cardFavorited: unfavoritedCard.getAttribute('data-favorited'),
            pseudoContent: pseudoContent,
            isHeartVisible: pseudoContent === '"♥"' || pseudoContent === "'♥'" || pseudoContent.includes('♥')
          };
        }
        return null;
      });
      
      if (afterUnfavoriteAnalysis) {
        console.log('After Unfavoriting:');
        console.log(`  Card data-favorited: ${afterUnfavoriteAnalysis.cardFavorited}`);
        console.log(`  Pseudo content: ${afterUnfavoriteAnalysis.pseudoContent}`);
        console.log(`  White heart visible: ${afterUnfavoriteAnalysis.isHeartVisible}`);
      }
    }
    
    console.log('\n=== GAME PLAYER TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'game_player_test_error.png', fullPage: false });
  } finally {
    await browser.close();
  }
}

testGamePlayerHearts();