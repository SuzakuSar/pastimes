# Complete MCP Setup Guide

This guide covers the setup of both **Playwright MCP** and **Puppeteer MCP** for your SummerLockIn Flask application. You can use either or both for browser automation and testing.

## 🚀 Quick Start

### Option 1: Start Both MCP Servers
```powershell
.\start-both-mcp.ps1
```

### Option 2: Start Individual Servers

**Playwright MCP:**
```powershell
.\start-playwright-mcp.ps1
```

**Puppeteer MCP:**
```powershell
.\start-puppeteer-mcp.ps1
```

### Option 3: Use npm scripts
```bash
npm run mcp:playwright  # Start Playwright MCP
npm run mcp:puppeteer   # Start Puppeteer MCP
npm run mcp:test        # Test both servers
```

## 📋 Prerequisites

1. **Node.js installed** (for npx commands)
2. **Python Flask app running** on `http://localhost:5000`
3. **Chrome browser installed** (for Puppeteer)
4. **Playwright browsers installed**: `playwright install` (for Playwright)

## 🔧 Configuration

### Playwright MCP
- **Port**: 3000
- **Config**: `playwright-mcp-config.json`
- **Output**: `./playwright-output/`

### Puppeteer MCP
- **Port**: 3001
- **Config**: `puppeteer-mcp-config.json`
- **Output**: `./puppeteer-output/`

## 🧪 Testing Your Setup

Run the test script to verify both MCP servers:
```bash
python test-puppeteer-mcp.py
```

Or use the npm script:
```bash
npm run mcp:test
```

## 🎯 Usage with Claude

### Connect to Playwright MCP
- **URL**: `http://localhost:3000`
- **Best for**: Multi-browser testing, advanced automation

### Connect to Puppeteer MCP
- **URL**: `http://localhost:3001`
- **Best for**: Chrome-specific testing, performance testing

## 📊 Comparison

| Feature | Playwright MCP | Puppeteer MCP |
|---------|----------------|---------------|
| **Port** | 3000 | 3001 |
| **Browser Support** | Chrome, Firefox, Safari | Chrome (default) |
| **Performance** | Excellent | Good |
| **Stability** | High | High |
| **Setup** | Simple | Simple |
| **Use Case** | Multi-browser testing | Chrome-focused testing |

## 🔍 Example Commands

Once connected to either MCP, you can ask Claude to:

### Navigation
- "Navigate to http://localhost:5000"
- "Go to the Dino Runner game"
- "Visit the leaderboard page"

### Testing
- "Take a screenshot of the homepage"
- "Click on the Time Predict game link"
- "Test the leaderboard submission form"

### Automation
- "Fill out the leaderboard form with test data"
- "Play the Dino Runner game for 30 seconds"
- "Check if all navigation links are working"

### Comparison Testing
- "Compare the performance between Playwright and Puppeteer"
- "Test the same functionality with both browsers"

## 🛠️ Troubleshooting

### Common Issues

**MCP Server Won't Start**
```bash
# Check if ports are available
netstat -an | findstr :3000
netstat -an | findstr :3001

# Try different ports
npx @playwright/mcp@latest --port 3002
npx @puppeteer/mcp@latest --port 3003
```

**Can't Connect to Flask App**
- Ensure Flask app is running: `python app.py`
- Check firewall settings
- Verify `allowed-origins` in config files

**Browser Issues**
```bash
# Install Playwright browsers
playwright install

# Try headless mode
# Edit config files and set "headless": true
```

### Performance Optimization

**For Faster Execution:**
1. Enable headless mode in config files
2. Reduce viewport size
3. Disable unnecessary browser features

**For Stability:**
1. Use the provided browser arguments
2. Ensure sufficient system resources
3. Close other browser instances

## 📁 File Structure

```
pastimes/
├── playwright-mcp-config.json      # Playwright MCP config
├── puppeteer-mcp-config.json       # Puppeteer MCP config
├── start-playwright-mcp.ps1        # Playwright startup script
├── start-puppeteer-mcp.ps1         # Puppeteer startup script
├── start-both-mcp.ps1              # Combined startup script
├── test-puppeteer-mcp.py           # Test script
├── playwright-output/               # Playwright output directory
├── puppeteer-output/               # Puppeteer output directory
└── PLAYWRIGHT_MCP_SETUP.md         # Detailed Playwright guide
└── PUPPETEER_MCP_SETUP.md          # Detailed Puppeteer guide
```

## 🎮 Integration with Your Games

The MCP servers are configured to work with your SummerLockIn games:

- **Homepage**: http://localhost:5000
- **Dino Runner**: http://localhost:5000/dino_runner
- **Time Predict**: http://localhost:5000/time_predict
- **Space Invaders**: http://localhost:5000/space_invaders
- **React Time**: http://localhost:5000/react_time
- **Leaderboard**: http://localhost:5000/leaderboard

## 🔄 Workflow Examples

### Testing Game Functionality
1. Start Flask app: `python app.py`
2. Start MCP server: `.\start-puppeteer-mcp.ps1`
3. Connect Claude to MCP
4. Ask Claude to test specific game features

### Automated Testing
1. Start both MCP servers: `.\start-both-mcp.ps1`
2. Connect Claude to both
3. Run comparative tests
4. Generate test reports

### Development Workflow
1. Start Flask app in development mode
2. Start MCP server for testing
3. Use Claude to automate repetitive testing tasks
4. Generate screenshots and reports

## 🎯 Best Practices

1. **Use Playwright MCP** for:
   - Multi-browser testing
   - Advanced automation scenarios
   - Cross-browser compatibility testing

2. **Use Puppeteer MCP** for:
   - Chrome-specific testing
   - Performance testing
   - Simple automation tasks

3. **Use Both** for:
   - Comparative testing
   - Comprehensive browser automation
   - Redundancy and reliability

## 🚀 Next Steps

1. **Test the setup** with the provided test script
2. **Connect Claude** to one or both MCP servers
3. **Start automating** your game testing workflows
4. **Explore advanced features** like screenshot comparison and performance testing

Your MCP setup is now complete and ready for browser automation testing! 🎉 