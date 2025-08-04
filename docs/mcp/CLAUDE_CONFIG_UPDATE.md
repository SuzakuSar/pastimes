# Claude Configuration Update Required

## 🔧 Update Your Claude Configuration

The MCP configuration files have been moved to `docs/mcp/`. You need to update your Claude configuration to use the new paths.

### Update Required

Your Claude configuration file (`~/.claude.json` or project-specific configuration) needs to be updated from:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "cmd",
      "args": ["/c", "npx", "@playwright/mcp@latest", "--config", "playwright-mcp-config.json"]
    }
  }
}
```

**To:**

```json
{
  "mcpServers": {
    "playwright": {
      "command": "cmd", 
      "args": ["/c", "npx", "@playwright/mcp@latest", "--config", "docs/mcp/playwright-mcp-config.json"]
    },
    "puppeteer": {
      "command": "cmd",
      "args": ["/c", "npx", "@puppeteer/mcp@latest", "--config", "docs/mcp/puppeteer-mcp-config.json"]
    }
  }
}
```

### Alternative: Use npm Scripts

You can also use the npm scripts instead:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npm",
      "args": ["run", "mcp:playwright"]
    },
    "puppeteer": {
      "command": "npm", 
      "args": ["run", "mcp:puppeteer"]
    }
  }
}
```

### Location of Claude Configuration

- **Global**: `~/.claude.json` or `%USERPROFILE%\.claude.json` (Windows)
- **Project**: `.claude/config.json` (in your project root)

## 🚀 Benefits of New Organization

- **Centralized configuration**: All MCP configs in `docs/mcp/`
- **Relative paths**: No more hard-coded absolute paths
- **Environment agnostic**: Works on any machine
- **Organized scripts**: All MCP scripts in `scripts/mcp/`