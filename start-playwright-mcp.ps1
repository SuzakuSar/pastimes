Write-Host "Starting Playwright MCP for SummerLockIn Flask App..." -ForegroundColor Green
Write-Host ""
Write-Host "Make sure your Flask app is running with: python app.py" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting Playwright MCP on port 3000..." -ForegroundColor Cyan
Write-Host "Configuration: playwright-mcp-config.json" -ForegroundColor Cyan
Write-Host ""

npx @playwright/mcp@latest --config playwright-mcp-config.json 