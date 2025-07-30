# Playwright MCP Setup Guide

This guide helps you set up the Playwright MCP (Model Context Protocol) to work with your SummerLockIn Flask application.

## Prerequisites

1. **Node.js installed** (for npx commands)
2. **Python Flask app running** on `http://localhost:5000`
3. **Playwright browsers installed**: `playwright install`

## Quick Setup

### Step 1: Start Your Flask App
```bash
python app.py
```
Your Flask app should be running on `http://localhost:5000`

### Step 2: Start Playwright MCP Server
In a new terminal window:

**Windows PowerShell:**
```powershell
.\start-playwright-mcp.ps1
```

**Windows Command Prompt:**
```cmd
.\start-playwright-mcp.bat
```

**Manual command:**
```bash
npx @playwright/mcp@latest --config playwright-mcp-config.json
```

### Step 3: Connect to MCP in Claude
The MCP server will be available on `http://localhost:3000`

## Configuration Details

The `playwright-mcp-config.json` file contains:

- **Browser**: Chrome (headed mode for visual testing)
- **Host**: localhost
- **Port**: 3000 (MCP server)
- **Allowed Origins**: http://localhost:5000 (your Flask app)
- **Output Directory**: ./playwright-output
- **Session/Trace Saving**: Enabled for debugging

## Testing Your Setup

1. **Start Flask app**: `python app.py`
2. **Start MCP server**: `.\start-playwright-mcp.ps1`
3. **Test with Claude**: Ask Claude to navigate to your Flask app

## Example Claude Commands

Once connected, you can ask Claude to:

- "Navigate to http://localhost:5000"
- "Click on the Dino Runner game link"
- "Take a screenshot of the leaderboard page"
- "Test the Time Predict game functionality"
- "Check if all navigation links are working"

## Troubleshooting

### MCP Server Won't Start
- Check if port 3000 is available
- Ensure Node.js is installed
- Try: `npx @playwright/mcp@latest --port 3001`

### Can't Connect to Flask App
- Ensure Flask app is running on port 5000
- Check firewall settings
- Verify `allowed-origins` in config

### Browser Issues
- Run: `playwright install`
- Try different browser: `--browser firefox`
- Check browser executable path

## Files Created

- `playwright-mcp-config.json` - MCP configuration
- `start-playwright-mcp.ps1` - PowerShell startup script
- `start-playwright-mcp.bat` - Batch startup script
- `playwright-output/` - Output directory for sessions/traces

## Integration with Your Flask App

The MCP is configured to work specifically with your SummerLockIn Flask application:

- **Homepage**: http://localhost:5000
- **Games**: http://localhost:5000/dino_runner, http://localhost:5000/time_predict
- **Leaderboard**: http://localhost:5000/leaderboard
- **Test Home**: http://localhost:5000/home

This allows Claude to interact with your games and test functionality programmatically. 