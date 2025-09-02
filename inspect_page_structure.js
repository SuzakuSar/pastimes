const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== Inspecting page structure ===');
    
    await page.goto('http://localhost:5000/test-home');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take screenshot of current page
    await page.screenshot({ path: 'page_structure_inspection.png', fullPage: true });
    
    // Get all buttons and their text content
    console.log('\n=== All buttons on page ===');
    const allButtons = await page.$$('button');
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const onclick = await button.getAttribute('onclick');
      const className = await button.getAttribute('class');
      const id = await button.getAttribute('id');
      
      console.log(`Button ${i + 1}:`);
      console.log(`  Text: "${text}"`);
      console.log(`  Classes: "${className}"`);
      console.log(`  ID: "${id}"`);
      console.log(`  Onclick: "${onclick}"`);
      console.log('---');
    }
    
    // Look for any elements with category-related classes or data attributes
    console.log('\n=== Category-related elements ===');
    const categoryElements = await page.$$('[class*="category"], [class*="filter"], [data-category], [class*="nav"]');
    console.log(`Found ${categoryElements.length} category-related elements`);
    
    for (let i = 0; i < categoryElements.length; i++) {
      const element = categoryElements[i];
      const tagName = await element.evaluate(el => el.tagName);
      const text = await element.textContent();
      const className = await element.getAttribute('class');
      const dataCategory = await element.getAttribute('data-category');
      
      console.log(`Element ${i + 1}: <${tagName}>`);
      console.log(`  Text: "${text}"`);
      console.log(`  Classes: "${className}"`);
      console.log(`  Data-category: "${dataCategory}"`);
      console.log('---');
    }
    
    // Look for navigation or tab elements
    console.log('\n=== Navigation elements ===');
    const navElements = await page.$$('nav, .nav, .tabs, .tab, .menu, [role="tablist"], [role="tab"]');
    console.log(`Found ${navElements.length} navigation elements`);
    
    for (let element of navElements) {
      const tagName = await element.evaluate(el => el.tagName);
      const text = await element.textContent();
      const className = await element.getAttribute('class');
      
      console.log(`Nav element: <${tagName}>`);
      console.log(`  Text: "${text}"`);
      console.log(`  Classes: "${className}"`);
      console.log('---');
    }
    
    // Check for any JavaScript that might handle category filtering
    console.log('\n=== Page scripts and functions ===');
    const scripts = await page.$$('script');
    console.log(`Found ${scripts.length} script elements`);
    
    // Look for any global functions or variables related to filtering
    const windowFunctions = await page.evaluate(() => {
      const functions = [];
      for (let prop in window) {
        if (typeof window[prop] === 'function' && prop.toLowerCase().includes('filter')) {
          functions.push(prop);
        }
      }
      return functions;
    });
    
    console.log('Filter-related functions:', windowFunctions);
    
    // Check if there are any filter functions or variables
    const filterVars = await page.evaluate(() => {
      const vars = [];
      for (let prop in window) {
        if (prop.toLowerCase().includes('category') || prop.toLowerCase().includes('filter')) {
          vars.push({ name: prop, type: typeof window[prop] });
        }
      }
      return vars;
    });
    
    console.log('Filter/category-related variables:', filterVars);
    
  } catch (error) {
    console.error('Error inspecting page:', error.message);
    await page.screenshot({ path: 'page_structure_inspection_error.png', fullPage: true });
  }
  
  await browser.close();
})();