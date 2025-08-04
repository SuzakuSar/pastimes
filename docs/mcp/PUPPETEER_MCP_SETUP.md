# Puppeteer MCP Setup Guide

This guide helps you set up the Puppeteer MCP (Model Context Protocol) to work with your SummerLockIn Flask application. Puppeteer provides an alternative to Playwright for browser automation and testing.

## Prerequisites

1. **Node.js installed** (for npx commands)
2. **Python Flask app running** on `http://localhost:5000`
3. **Chrome browser installed** (Puppeteer uses Chrome by default)

## Quick Setup

### Step 1: Start Your Flask App
```bash
python app.py
```
Your Flask app should be running on `http://localhost:5000`

### Step 2: Start Puppeteer MCP Server
In a new terminal window:

**Windows PowerShell:**
```powershell
.\start-puppeteer-mcp.ps1
```

**Windows Command Prompt:**
```cmd
.\start-puppeteer-mcp.bat
```

**Manual command:**
```bash
npx @puppeteer/mcp@latest --config puppeteer-mcp-config.json
```

### Step 3: Connect to MCP in Claude
The MCP server will be available on `http://localhost:3001`

## Configuration Details

The `puppeteer-mcp-config.json` file contains:

- **Browser**: Chrome (headed mode for visual testing)
- **Host**: localhost
- **Port**: 3001 (MCP server - different from Playwright's 3000)
- **Allowed Origins**: http://localhost:5000 (your Flask app)
- **Output Directory**: ./puppeteer-output
- **Session/Trace Saving**: Enabled for debugging
- **Browser Args**: Optimized for stability and performance

## Key Differences from Playwright

### Port Configuration
- **Playwright MCP**: Runs on port 3000
- **Puppeteer MCP**: Runs on port 3001

This allows you to run both simultaneously for comparison testing.

### Browser Arguments
Puppeteer includes additional Chrome arguments for better stability:
- `--no-sandbox`: Disables Chrome sandbox
- `--disable-setuid-sandbox`: Disables setuid sandbox
- `--disable-dev-shm-usage`: Disables /dev/shm usage
- `--disable-accelerated-2d-canvas`: Disables hardware acceleration
- `--no-first-run`: Skips first run setup
- `--no-zygote`: Disables zygote process
- `--disable-gpu`: Disables GPU hardware acceleration

## Testing Your Setup

1. **Start Flask app**: `python app.py`
2. **Start MCP server**: `.\start-puppeteer-mcp.ps1`
3. **Test with Claude**: Ask Claude to navigate to your Flask app

## Example Claude Commands

Once connected, you can ask Claude to:

- "Navigate to http://localhost:5000"
- "Click on the Dino Runner game link"
- "Take a screenshot of the leaderboard page"
- "Test the Time Predict game functionality"
- "Check if all navigation links are working"
- "Compare performance between Playwright and Puppeteer"

## Running Both MCP Servers

You can run both Playwright and Puppeteer MCP servers simultaneously:

1. **Terminal 1**: Start Flask app
   ```bash
   python app.py
   ```

2. **Terminal 2**: Start Playwright MCP
   ```bash
   .\start-playwright-mcp.ps1
   ```

3. **Terminal 3**: Start Puppeteer MCP
   ```bash
   .\start-puppeteer-mcp.ps1
   ```

This allows you to compare browser automation capabilities and performance.

## Troubleshooting

### MCP Server Won't Start
- Check if port 3001 is available
- Ensure Node.js is installed
- Try: `npx @puppeteer/mcp@latest --port 3002`

### Can't Connect to Flask App
- Ensure Flask app is running on port 5000
- Check firewall settings
- Verify `allowed-origins` in config

### Browser Issues
- Ensure Chrome is installed
- Try different browser: `--browser firefox`
- Check browser executable path
- Try headless mode: `"headless": true`

### Performance Issues
- Enable headless mode for faster execution
- Reduce viewport size
- Disable unnecessary browser features

## Files Created

- `puppeteer-mcp-config.json` - MCP configuration
- `start-puppeteer-mcp.ps1` - PowerShell startup script
- `start-puppeteer-mcp.bat` - Batch startup script
- `puppeteer-output/` - Output directory for sessions/traces

## Integration with Your Flask App

The MCP is configured to work specifically with your SummerLockIn Flask application:

- **Homepage**: http://localhost:5000
- **Games**: http://localhost:5000/dino_runner, http://localhost:5000/time_predict
- **Leaderboard**: http://localhost:5000/leaderboard
- **Test Home**: http://localhost:5000/home

## Comparison with Playwright

| Feature | Playwright | Puppeteer |
|---------|------------|-----------|
| Port | 3000 | 3001 |
| Browser Support | Chrome, Firefox, Safari | Chrome (default) |
| Performance | Excellent | Good |
| Stability | High | High |
| Configuration | Simple | Simple |
| Output Directory | ./playwright-output | ./puppeteer-output |

This allows you to choose the best tool for your specific testing needs or use both for comprehensive browser automation testing. 