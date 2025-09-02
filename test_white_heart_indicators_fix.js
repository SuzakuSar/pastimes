const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  console.log('=== WHITE HEART INDICATORS FIX TEST ===\n');
  
  // Step 1: Navigate to home page
  console.log('Step 1: Navigating to home page...');
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.game-card', { timeout: 5000 });
  
  await page.screenshot({ path: 'step1_initial_home_state.png', fullPage: true });
  
  // Check initial state
  const gameCards = await page.$$('.game-card');
  console.log(`Found ${gameCards.length} game cards`);
  
  const initialFavorited = await page.$$eval('.heart-button[data-favorited="true"]', hearts => hearts.length);
  console.log(`Initially favorited hearts: ${initialFavorited}`);
  
  // Step 2: Favorite multiple games
  console.log('\nStep 2: Favoriting multiple games...');
  const heartButtons = await page.$$('.heart-button');
  console.log(`Found ${heartButtons.length} heart buttons`);
  
  // Click on first 3 heart buttons to favorite them
  for (let i = 0; i < Math.min(3, heartButtons.length); i++) {
    await heartButtons[i].click();
    await page.waitForSelector('.heart-button', { timeout: 1000 }); // Wait for state update
    console.log(`Favorited game ${i + 1}`);
  }
  
  await page.screenshot({ path: 'step2_after_favoriting_games.png', fullPage: true });
  
  // Verify hearts are now favorited
  const favoritedAfterClicks = await page.$$eval('.heart-button[data-favorited="true"]', hearts => hearts.length);
  console.log(`Hearts favorited after clicks: ${favoritedAfterClicks}`);
  
  // Check for white heart indicators (♥)
  const whiteHearts = await page.evaluate(() => {
    const hearts = document.querySelectorAll('.heart-button');
    let whiteCount = 0;
    hearts.forEach(heart => {
      if (heart.textContent.includes('♥')) {
        whiteCount++;
      }
    });
    return whiteCount;
  });
  console.log(`White heart indicators visible: ${whiteHearts}`);
  
  // Step 3: Test category switching
  console.log('\nStep 3: Testing category switching...');
  
  // Click on "Favorited" category
  const favoritedTab = await page.$('[data-category="favorited"]');
  if (favoritedTab) {
    await favoritedTab.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'step3_favorited_category.png', fullPage: true });
    
    // Check white hearts in favorited category
    const whiteHeartsInFavorited = await page.evaluate(() => {
      const hearts = document.querySelectorAll('.heart-button');
      let whiteCount = 0;
      hearts.forEach(heart => {
        if (heart.textContent.includes('♥')) {
          whiteCount++;
        }
      });
      return whiteCount;
    });
    console.log(`White hearts in Favorited category: ${whiteHeartsInFavorited}`);
  }
  
  // Click on "Featured" category
  const featuredTab = await page.$('[data-category="featured"]');
  if (featuredTab) {
    await featuredTab.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'step4_featured_category.png', fullPage: true });
    
    // Check white hearts in featured category
    const whiteHeartsInFeatured = await page.evaluate(() => {
      const hearts = document.querySelectorAll('.heart-button');
      let whiteCount = 0;
      hearts.forEach(heart => {
        if (heart.textContent.includes('♥')) {
          whiteCount++;
        }
      });
      return whiteCount;
    });
    console.log(`White hearts in Featured category: ${whiteHeartsInFeatured}`);
  }
  
  // Test other categories
  const categories = ['arcade', 'skill', 'liked'];
  for (let category of categories) {
    const categoryTab = await page.$(`[data-category="${category}"]`);
    if (categoryTab) {
      console.log(`\nTesting ${category} category...`);
      await categoryTab.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.screenshot({ path: `step5_${category}_category.png`, fullPage: true });
      
      const whiteHeartsInCategory = await page.evaluate(() => {
        const hearts = document.querySelectorAll('.heart-button');
        let whiteCount = 0;
        hearts.forEach(heart => {
          if (heart.textContent.includes('♥')) {
            whiteCount++;
          }
        });
        return whiteCount;
      });
      console.log(`White hearts in ${category} category: ${whiteHeartsInCategory}`);
    }
  }
  
  // Step 4: Final verification - go back to Featured
  console.log('\nStep 4: Final verification in Featured category...');
  const finalFeaturedTab = await page.$('[data-category="featured"]');
  if (finalFeaturedTab) {
    await finalFeaturedTab.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'step6_final_featured_state.png', fullPage: true });
    
    // Final count of white hearts
    const finalWhiteHearts = await page.evaluate(() => {
      const hearts = document.querySelectorAll('.heart-button');
      let whiteCount = 0;
      let details = [];
      hearts.forEach((heart, index) => {
        const hasWhiteHeart = heart.textContent.includes('♥');
        const isFavorited = heart.getAttribute('data-favorited') === 'true';
        if (hasWhiteHeart) {
          whiteCount++;
        }
        details.push({
          index: index,
          hasWhiteHeart: hasWhiteHeart,
          isFavorited: isFavorited,
          textContent: heart.textContent.trim()
        });
      });
      return { count: whiteCount, details: details };
    });
    
    console.log(`Final white hearts count: ${finalWhiteHearts.count}`);
    console.log('Heart button details:', JSON.stringify(finalWhiteHearts.details, null, 2));
  }
  
  console.log('\n=== TEST COMPLETED ===');
  
  await browser.close();
})();