# Puppeteer MCP Startup Script for PowerShell
Write-Host "Starting Puppeteer MCP Server..." -ForegroundColor Green
Write-Host "Make sure your Flask app is running on http://localhost:5000" -ForegroundColor Yellow

# Get the project root directory (two levels up from scripts/mcp/)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$configFile = Join-Path $projectRoot "docs\mcp\puppeteer-mcp-config.json"

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Start Puppeteer MCP server
Write-Host "Starting Puppeteer MCP on http://localhost:3001..." -ForegroundColor Green
Write-Host "Configuration: $configFile" -ForegroundColor Cyan

# Change to project root for proper relative path resolution
Set-Location $projectRoot
npx -y @modelcontextprotocol/server-puppeteer 