@echo off
echo Starting Playwright MCP for SummerLockIn Flask App...
echo.
echo Make sure your Flask app is running with: python app.py
echo.
echo Starting Playwright MCP on port 3000...
echo Configuration: docs/mcp/playwright-mcp-config.json
echo.
npx @playwright/mcp@latest --config ../../docs/mcp/playwright-mcp-config.json 