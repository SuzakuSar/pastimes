const puppeteer = require('puppeteer');
const fs = require('fs');

async function testHeartVisibility() {
    console.log('Starting heart visibility test...');
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    const report = {
        timestamp: new Date().toISOString(),
        testResults: [],
        screenshots: [],
        issues: [],
        summary: ''
    };

    try {
        // Step 1: Navigate to test home page
        console.log('Step 1: Navigating to test home page...');
        await page.goto('http://localhost:5000/test-home', { waitUntil: 'networkidle2' });
        await page.waitForSelector('.game-card', { timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.screenshot({ path: 'step1_initial_test_home.png', fullPage: true });
        report.screenshots.push('step1_initial_test_home.png');
        report.testResults.push({ step: 1, action: 'Navigate to test home', status: 'PASS' });

        // Step 2: Select a game card and favorite it
        console.log('Step 2: Finding and favoriting a game card...');
        await page.waitForSelector('.game-card', { timeout: 5000 });
        
        // Find the first game card
        const firstCard = await page.$('.game-card');
        if (!firstCard) {
            throw new Error('No game cards found on page');
        }

        // Get the card's position for screenshots
        const cardBox = await firstCard.boundingBox();
        
        // Hover over the card to reveal the buttons
        await firstCard.hover();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Click the favorite button
        const favoriteButton = await page.$('.game-card .btn-favorite');
        if (!favoriteButton) {
            throw new Error('Favorite button not found');
        }
        
        await favoriteButton.click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        report.testResults.push({ step: 2, action: 'Favorite game card', status: 'PASS' });

        // Step 3: Move mouse away and verify white heart is visible
        console.log('Step 3: Testing white heart visibility when not hovering...');
        
        // Move mouse to corner to ensure no hover
        await page.mouse.move(100, 100);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if white heart is visible (CSS ::after pseudo-element)
        const whiteHeartVisible = await page.evaluate(() => {
            const cards = document.querySelectorAll('.game-card[data-favorited="true"]');
            if (cards.length > 0) {
                const card = cards[0];
                const pseudoStyle = window.getComputedStyle(card, '::after');
                return {
                    exists: true,
                    visible: pseudoStyle.content !== 'none' && pseudoStyle.content !== '""',
                    content: pseudoStyle.content,
                    opacity: pseudoStyle.opacity || '1',
                    cardDataFavorited: card.getAttribute('data-favorited'),
                    isHovering: card.matches(':hover')
                };
            }
            return { exists: false };
        });
        
        await page.screenshot({ path: 'step3_heart_visible_no_hover.png', fullPage: true });
        report.screenshots.push('step3_heart_visible_no_hover.png');
        
        if (whiteHeartVisible.exists && whiteHeartVisible.visible) {
            report.testResults.push({ step: 3, action: 'White heart visible when not hovering', status: 'PASS', details: whiteHeartVisible });
        } else {
            report.testResults.push({ step: 3, action: 'White heart visible when not hovering', status: 'FAIL', details: whiteHeartVisible });
            report.issues.push('White heart not visible on favorited card when not hovering');
        }

        // Step 4: Hover over favorited card and verify heart disappears
        console.log('Step 4: Testing white heart disappears on hover...');
        
        // Hover over the favorited card again
        await firstCard.hover();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if white heart is hidden during hover
        const whiteHeartOnHover = await page.evaluate(() => {
            const cards = document.querySelectorAll('.game-card[data-favorited="true"]');
            if (cards.length > 0) {
                const card = cards[0];
                const pseudoStyle = window.getComputedStyle(card, '::after');
                const overlay = card.querySelector('.card-overlay, .game-overlay, .overlay');
                const overlayStyle = overlay ? window.getComputedStyle(overlay) : null;
                
                return {
                    heart: {
                        exists: true,
                        visible: pseudoStyle.content !== 'none' && pseudoStyle.content !== '""',
                        content: pseudoStyle.content,
                        opacity: pseudoStyle.opacity || '1',
                        isHovering: card.matches(':hover'),
                        cardDataFavorited: card.getAttribute('data-favorited')
                    },
                    overlay: overlay ? {
                        exists: true,
                        visible: overlayStyle.display !== 'none' && overlayStyle.opacity !== '0',
                        display: overlayStyle.display,
                        opacity: overlayStyle.opacity
                    } : { exists: false }
                };
            }
            return { heart: { exists: false }, overlay: { exists: false } };
        });
        
        await page.screenshot({ path: 'step4_heart_hidden_on_hover.png', fullPage: true });
        report.screenshots.push('step4_heart_hidden_on_hover.png');
        
        const heartHidden = !whiteHeartOnHover.heart.visible;
        const overlayVisible = whiteHeartOnHover.overlay.exists && whiteHeartOnHover.overlay.visible;
        
        if (heartHidden && overlayVisible) {
            report.testResults.push({ step: 4, action: 'White heart hidden on hover, overlay visible', status: 'PASS', details: whiteHeartOnHover });
        } else {
            report.testResults.push({ step: 4, action: 'White heart hidden on hover, overlay visible', status: 'FAIL', details: whiteHeartOnHover });
            if (!heartHidden) {
                report.issues.push('White heart still visible during hover (should be hidden)');
            }
            if (!overlayVisible) {
                report.issues.push('Overlay not visible during hover');
            }
        }

        // Step 5: Move mouse away again and verify heart reappears
        console.log('Step 5: Testing white heart reappears when hover ends...');
        
        // Move mouse away
        await page.mouse.move(100, 100);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if white heart reappears
        const whiteHeartReappears = await page.evaluate(() => {
            const cards = document.querySelectorAll('.game-card[data-favorited="true"]');
            if (cards.length > 0) {
                const card = cards[0];
                const pseudoStyle = window.getComputedStyle(card, '::after');
                return {
                    exists: true,
                    visible: pseudoStyle.content !== 'none' && pseudoStyle.content !== '""',
                    content: pseudoStyle.content,
                    opacity: pseudoStyle.opacity || '1',
                    cardDataFavorited: card.getAttribute('data-favorited'),
                    isHovering: card.matches(':hover')
                };
            }
            return { exists: false };
        });
        
        await page.screenshot({ path: 'step5_heart_reappears.png', fullPage: true });
        report.screenshots.push('step5_heart_reappears.png');
        
        if (whiteHeartReappears.exists && whiteHeartReappears.visible) {
            report.testResults.push({ step: 5, action: 'White heart reappears after hover ends', status: 'PASS', details: whiteHeartReappears });
        } else {
            report.testResults.push({ step: 5, action: 'White heart reappears after hover ends', status: 'FAIL', details: whiteHeartReappears });
            report.issues.push('White heart does not reappear after hover ends');
        }

        // Step 6: Navigate to game player interface
        console.log('Step 6: Testing game player interface...');
        
        // Click on a game to go to game player
        await firstCard.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.waitForSelector('.related-games-sidebar, .related-games-list', { timeout: 10000 });
        
        await page.screenshot({ path: 'step6_game_player_interface.png', fullPage: true });
        report.screenshots.push('step6_game_player_interface.png');
        report.testResults.push({ step: 6, action: 'Navigate to game player interface', status: 'PASS' });

        // Step 7: Test heart behavior on related games
        console.log('Step 7: Testing heart behavior on related games...');
        
        // Find a related game card
        const relatedCard = await page.$('.related-game-item');
        if (relatedCard) {
            // Hover to reveal buttons and favorite it
            await relatedCard.hover();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const relatedFavoriteBtn = await page.$('.related-game-favorite');
            if (relatedFavoriteBtn) {
                await relatedFavoriteBtn.click();
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Move mouse away and check heart visibility
                await page.mouse.move(100, 100);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const relatedHeartVisible = await page.evaluate(() => {
                    const relatedCards = document.querySelectorAll('.related-game-item[data-favorited="true"]');
                    if (relatedCards.length > 0) {
                        const card = relatedCards[0];
                        const pseudoStyle = window.getComputedStyle(card, '::after');
                        return {
                            exists: true,
                            visible: pseudoStyle.content !== 'none' && pseudoStyle.content !== '""',
                            content: pseudoStyle.content,
                            opacity: pseudoStyle.opacity || '1',
                            cardDataFavorited: card.getAttribute('data-favorited'),
                            isHovering: card.matches(':hover')
                        };
                    }
                    return { exists: false };
                });
                
                await page.screenshot({ path: 'step7_related_heart_visible.png', fullPage: true });
                report.screenshots.push('step7_related_heart_visible.png');
                
                // Test hover behavior on related card
                await relatedCard.hover();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const relatedHeartOnHover = await page.evaluate(() => {
                    const relatedCards = document.querySelectorAll('.related-game-item[data-favorited="true"]');
                    if (relatedCards.length > 0) {
                        const card = relatedCards[0];
                        const pseudoStyle = window.getComputedStyle(card, '::after');
                        return {
                            exists: true,
                            visible: pseudoStyle.content !== 'none' && pseudoStyle.content !== '""',
                            content: pseudoStyle.content,
                            opacity: pseudoStyle.opacity || '1',
                            cardDataFavorited: card.getAttribute('data-favorited'),
                            isHovering: card.matches(':hover')
                        };
                    }
                    return { exists: false };
                });
                
                await page.screenshot({ path: 'step7_related_heart_on_hover.png', fullPage: true });
                report.screenshots.push('step7_related_heart_on_hover.png');
                
                if (relatedHeartVisible.exists && relatedHeartVisible.visible) {
                    report.testResults.push({ step: 7, action: 'Related game heart visible when not hovering', status: 'PASS' });
                } else {
                    report.testResults.push({ step: 7, action: 'Related game heart visible when not hovering', status: 'FAIL' });
                    report.issues.push('Related game heart not visible when not hovering');
                }
                
                if (!relatedHeartOnHover.visible) {
                    report.testResults.push({ step: 7, action: 'Related game heart hidden on hover', status: 'PASS' });
                } else {
                    report.testResults.push({ step: 7, action: 'Related game heart hidden on hover', status: 'FAIL' });
                    report.issues.push('Related game heart still visible on hover');
                }
            } else {
                report.testResults.push({ step: 7, action: 'Find related game favorite button', status: 'FAIL' });
                report.issues.push('Could not find favorite button on related games');
            }
        } else {
            report.testResults.push({ step: 7, action: 'Find related game cards', status: 'FAIL' });
            report.issues.push('No related game cards found');
        }

        // Final screenshot
        await page.screenshot({ path: 'step8_final_state.png', fullPage: true });
        report.screenshots.push('step8_final_state.png');

    } catch (error) {
        console.error('Test error:', error);
        report.issues.push(`Test execution error: ${error.message}`);
        await page.screenshot({ path: 'error_state.png', fullPage: true });
        report.screenshots.push('error_state.png');
    }

    // Generate summary
    const passCount = report.testResults.filter(r => r.status === 'PASS').length;
    const failCount = report.testResults.filter(r => r.status === 'FAIL').length;
    const totalTests = report.testResults.length;
    
    report.summary = `Heart Visibility Test Results: ${passCount}/${totalTests} tests passed`;
    if (report.issues.length === 0) {
        report.summary += '. All critical heart visibility behaviors working correctly!';
    } else {
        report.summary += `. ${report.issues.length} issues found.`;
    }

    // Save report
    fs.writeFileSync('heart_visibility_test_report.json', JSON.stringify(report, null, 2));
    console.log('\n=== HEART VISIBILITY TEST REPORT ===');
    console.log(report.summary);
    console.log('\nDetailed Results:');
    report.testResults.forEach(result => {
        console.log(`${result.step}. ${result.action}: ${result.status}`);
    });
    
    if (report.issues.length > 0) {
        console.log('\nIssues Found:');
        report.issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`);
        });
    }
    
    console.log(`\nScreenshots saved: ${report.screenshots.join(', ')}`);
    console.log('Full report saved as: heart_visibility_test_report.json');

    await browser.close();
    return report;
}

// Run the test
testHeartVisibility().catch(console.error);