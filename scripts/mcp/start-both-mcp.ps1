# Combined MCP Startup Script for PowerShell
# Starts both Playwright and Puppeteer MCP servers

Write-Host "Starting Both MCP Servers..." -ForegroundColor Green
Write-Host "Make sure your Flask app is running on http://localhost:5000" -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Function to start MCP server
function Start-MCPServer {
    param(
        [string]$Name,
        [string]$ConfigFile,
        [int]$Port
    )
    
    Write-Host "Starting $Name MCP on http://localhost:$Port..." -ForegroundColor Green
    
    # Start the MCP server in a new job
    $job = Start-Job -ScriptBlock {
        param($configFile, $serverType)
        if ($serverType -eq "Playwright") {
            npx @playwright/mcp@latest --config $configFile
        } else {
            npx -y @modelcontextprotocol/server-puppeteer
        }
    } -ArgumentList $ConfigFile, $Name
    
    Write-Host "$Name MCP server started in background (Job ID: $($job.Id))" -ForegroundColor Cyan
    return $job
}

# Get the project root directory (two levels up from scripts/mcp/)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)

# Change to project root for proper relative path resolution
Set-Location $projectRoot

# Start both MCP servers
$playwrightJob = Start-MCPServer -Name "Playwright" -ConfigFile "docs/mcp/playwright-mcp-config.json" -Port 3000
$puppeteerJob = Start-MCPServer -Name "Puppeteer" -ConfigFile "" -Port 3001

Write-Host "`nBoth MCP servers are starting..." -ForegroundColor Green
Write-Host "Playwright MCP: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Puppeteer MCP: http://localhost:3001" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop both servers" -ForegroundColor Yellow

# Wait for user to stop
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Check if jobs are still running
        if ($playwrightJob.State -eq "Failed" -or $puppeteerJob.State -eq "Failed") {
            Write-Host "One or more MCP servers failed to start" -ForegroundColor Red
            break
        }
    }
} catch {
    Write-Host "`nStopping MCP servers..." -ForegroundColor Yellow
} finally {
    # Stop both jobs
    if ($playwrightJob) {
        Stop-Job $playwrightJob
        Remove-Job $playwrightJob
    }
    if ($puppeteerJob) {
        Stop-Job $puppeteerJob
        Remove-Job $puppeteerJob
    }
    Write-Host "MCP servers stopped" -ForegroundColor Green
} 