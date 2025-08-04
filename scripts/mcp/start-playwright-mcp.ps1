Write-Host "Starting Playwright MCP for SummerLockIn Flask App..." -ForegroundColor Green
Write-Host ""
Write-Host "Make sure your Flask app is running with: python app.py" -ForegroundColor Yellow
Write-Host ""

# Get the project root directory (two levels up from scripts/mcp/)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$configFile = Join-Path $projectRoot "docs\mcp\playwright-mcp-config.json"

Write-Host "Starting Playwright MCP on port 3000..." -ForegroundColor Cyan
Write-Host "Configuration: $configFile" -ForegroundColor Cyan
Write-Host ""

# Change to project root for proper relative path resolution
Set-Location $projectRoot
npx @playwright/mcp@latest --config docs/mcp/playwright-mcp-config.json 