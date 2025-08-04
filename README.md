# SummerLockIn - Game Platform

A modern web-based gaming platform built with Flask, featuring multiple games, leaderboards, and browser automation testing capabilities.

## 🏗️ Project Structure

```
pastimes/
├── app.py                          # Main Flask application
├── website/                        # Core web application
│   ├── home/                      # Homepage and game listings
│   ├── dino_runner/              # Dino Runner game
│   ├── time_predict/             # Time Predict game
│   ├── space_invaders/           # Space Invaders game
│   ├── react_time/               # React Time game
│   ├── leaderboard/              # Leaderboard system
│   ├── test_home/                # Test layout components
│   └── static/                   # CSS, JS, and assets
├── docs/                          # Documentation
│   ├── mcp/                      # MCP (Model Context Protocol) docs
│   ├── admin/                    # Admin system documentation
│   └── development/              # Development guides
├── scripts/                       # Utility scripts
│   └── mcp/                      # MCP server scripts
├── tests/                        # Test files
├── requirements.txt               # Python dependencies
├── requirements-dev.txt           # Development dependencies
├── package.json                  # Node.js dependencies
└── setup-dev.py                  # Development setup script
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Installation
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd pastimes
   ```

2. **Set up Python environment:**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

3. **Set up Node.js dependencies:**
   ```bash
   npm install
   ```

4. **Initialize the database:**
   ```bash
   python setup-dev.py
   ```

5. **Start the application:**
   ```bash
   python app.py
   ```

The application will be available at `http://localhost:5000`

## 🎮 Games

### Available Games
- **Dino Runner**: Classic endless runner game
- **Time Predict**: Test your timing skills
- **Space Invaders**: Classic arcade game
- **React Time**: Reaction time testing game

### Game Features
- Real-time leaderboards
- Score tracking
- Session management
- Responsive design

## 🧪 Testing & Automation

### MCP (Model Context Protocol) Setup
The project includes browser automation testing using both Playwright and Puppeteer MCP servers.

**Start MCP servers:**
```bash
# Start both servers
.\scripts\mcp\start-both-mcp.ps1

# Or start individually
.\scripts\mcp\start-playwright-mcp.ps1
.\scripts\mcp\start-puppeteer-mcp.ps1
```

**Test MCP setup:**
```bash
python tests/test-puppeteer-mcp.py
```

**Using npm scripts:**
```bash
npm run mcp:playwright  # Start Playwright MCP
npm run mcp:puppeteer   # Start Puppeteer MCP
npm run mcp:test        # Test both servers
```

### Manual Testing
```bash
python tests/test_app.py
```

## 🛠️ Development

### Development Setup
```bash
python setup-dev.py
```

This script will:
- Install development dependencies
- Set up pre-commit hooks
- Initialize the database
- Create development scripts

### Code Quality
```bash
npm run quality          # Run all quality checks
npm run lint            # Run linting
npm run format          # Format code
npm run type-check      # Type checking
```

### Database Management
```bash
# Access admin panel
http://localhost:5000/admin/summerlockin

# Database cleanup
http://localhost:5000/admin/summerlockin/cleanup
```

## 📚 Documentation

### MCP Documentation
- `docs/mcp/MCP_SETUP_COMPLETE.md` - Complete MCP setup guide
- `docs/mcp/PUPPETEER_MCP_SETUP.md` - Puppeteer MCP guide
- `docs/mcp/PLAYWRIGHT_MCP_SETUP.md` - Playwright MCP guide

### Admin Documentation
- `docs/admin/SESSION_ADMIN_GUIDE.md` - Session admin guide
- `docs/admin/SIMPLE_ADMIN_GUIDE.md` - Simple admin guide
- `docs/admin/TEST_ADMIN_SYSTEM.md` - Admin system testing
- `docs/admin/DATABASE_CLEANUP.md` - Database cleanup guide

### Development Documentation
- `docs/development/01-layout-visuals.md` - Layout and visual design
- `docs/development/02-animations-interactions.md` - Animations and interactions
- `docs/development/03-complex-features.md` - Complex features
- `docs/development/CLAUDE.md` - Claude integration guide

## 🔧 Configuration

### MCP Configuration
- `docs/mcp/mcp.json` - Main MCP configuration
- `docs/mcp/mcp-servers.json` - Server connection config
- `docs/mcp/playwright-mcp-config.json` - Playwright settings
- `docs/mcp/puppeteer-mcp-config.json` - Puppeteer settings

### Environment Variables
Create a `.env` file for local development:
```env
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your-secret-key-here
```

## 🚀 Deployment

### Production Setup
1. Set environment variables
2. Install production dependencies
3. Set up database
4. Configure web server (nginx/apache)
5. Use gunicorn or uwsgi for WSGI

### Docker (Future)
Docker configuration will be added for containerized deployment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and quality checks
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
1. Check the documentation in the `docs/` directory
2. Review existing issues
3. Create a new issue with detailed information

---

**SummerLockIn Development Team** - Building the future of web gaming! 🎮