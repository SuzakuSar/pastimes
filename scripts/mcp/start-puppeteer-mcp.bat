@echo off
echo Starting Puppeteer MCP Server...
echo Make sure your Flask app is running on http://localhost:5000

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Starting Puppeteer MCP on http://localhost:3001...
npx @puppeteer/mcp@latest --config ../../docs/mcp/puppeteer-mcp-config.json
pause 