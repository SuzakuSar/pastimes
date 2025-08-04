# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
- **Development server**: `python app.py` (runs Flask with debug mode enabled)
- **Install dependencies**: `pip install -r requirements.txt`
- **Install dev dependencies**: `pip install -r requirements-dev.txt` (optional enhanced tools)
- **Virtual environment**: `python -m venv venv` then activate with `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (macOS/Linux)
- **Database initialization**: `python -c "from website.leaderboard.leaderboard import init_database; init_database()"`
- **Live reload server**: `python -m flask --app app run --debug --reload` (auto-refresh on changes)

### Development Workflow Enhancement
- **Format code**: `black .` (auto-format Python code)
- **Lint code**: `flake8 .` (catch errors and style issues)
- **Type checking**: `mypy .` (static type analysis)
- **Sort imports**: `isort .` (organize import statements)
- **Run all checks**: `pre-commit run --all-files` (comprehensive code quality)

### Playwright Testing Setup
- **Install Playwright**: `pip install playwright` (already in requirements.txt)
- **Install browsers**: `playwright install`
- **Run tests**: `python test_app.py` (after starting Flask app with `python app.py`)
- **Manual testing**: `python playwright.config.py`

### Playwright MCP Setup
- **Install MCP**: `npx @playwright/mcp@latest`
- **Start Flask app**: `python app.py` (in one terminal)
- **Start MCP server**: `.\start-playwright-mcp.ps1` or `.\start-playwright-mcp.bat` (in another terminal)
- **MCP Configuration**: Uses `playwright-mcp-config.json` for Flask app integration
- **MCP Port**: 3000 (Flask app runs on 5000)
- **Browser**: Chrome with headless=false for visual testing

## Architecture Overview

This is a Flask web application called "SummerLockIn" that hosts a collection of mini-games and interactive experiences. The app uses a modular blueprint-based architecture with comprehensive leaderboard integration.

**Navigation Design**: The top scrollable navigation bar is intentionally kept empty. All games are accessible via the dropdown menu only, creating a cleaner interface focused on the home page game discovery experience.

### Core Structure
- **`app.py`**: Main entry point that creates the Flask app and handles request logging
- **`website/__init__.py`**: App factory with `create_app()` function that registers all game blueprints
- **`website/[game_name]/`**: Each game is a separate blueprint module with its own routes and templates
- **`leaderboards.db`**: SQLite database for storing game scores and rankings

### Blueprint Pattern
Each game follows this structure:
```
website/game_name/
├── __init__.py
├── game_name.py          # Blueprint with routes
└── templates/
    └── game_name.html    # Game-specific template
```

**IMPORTANT - Template Block Structure:**
The base template (`website/templates/base.html`) uses these specific Jinja2 blocks:
- `{% block title %}` - Page title in HTML head
- `{% block head %}` - Additional head content (CSS, meta tags, etc.)
- `{% block header %}` - Page header content (appears in h1 tag)
- `{% block body %}` - Main page content (NOT `{% block content %}`)

**Common Error**: Using `{% block content %}` instead of `{% block body %}` will result in empty pages that only show the base template navigation.

Games are registered in `website/__init__.py` following the pattern:
```python
from .game_name.game_name import game_name
app.register_blueprint(game_name, url_prefix='/gameurl')
```

### Timing Games Architecture

The timing challenge has been split into two separate applications:

1. **Time Predict Challenge** (`/timepredict`)
   - Pure timing intuition without visual feedback
   - Target: Hit exactly 10.000 seconds
   - Win tolerance: ±0.1 seconds
   - Uses `submit_score_closest_to_target()` for leaderboard

2. **React Time Challenge** (`/reacttime`) 
   - Visual reaction speed test
   - Random indicators appear after 3-8 seconds
   - Three indicator types: flash, word, and shape (all sudden, no animations)
   - Win tolerance: ±0.15 seconds from indicator appearance
   - Uses `submit_score_lower_better()` for leaderboard (faster is better)

### Key Components

**Enhanced Leaderboard System** (`website/leaderboard/leaderboard.py`):
- Advanced ranking methods: higher/lower is better, closest to target, percentage-based
- Production database layer with connection pooling and context managers
- Flexible score submission API with validation and error handling
- Widget system for embedding leaderboards in games
- Environment-aware database paths (local vs deployment)

**Request Tracking & Analytics**:
- All requests logged via `auto_track_from_request()` in `app.py`
- Analytics blueprint tracks user interactions
- Comprehensive request debugging information

**Template System**:
- Base template in `website/templates/base.html` with dynamic navigation
- Context processor injects `request` object and `navigation_games` for auto-updating menus
- Custom 404 error page with space theme
- Template inheritance using block system
- Dynamic game detection across all templates and interfaces

### Database Schema
SQLite database with comprehensive design:
- **Multiple ranking methods per game** (higher/lower is better, closest to target, etc.)
- **Dual scoring system** (original + ranking scores)
- **Session-based user tracking** with IP tracking for abuse prevention
- **Flexible score types** (numeric, percentage, time-based)
- **Audit trails** with created/updated timestamps
- **Indexed queries** for optimal performance

### Game Integration Pattern
Games integrate with the leaderboard system using standardized submission functions:
```python
# Import leaderboard functions
from website.leaderboard.leaderboard import submit_score_higher_better, submit_score_closest_to_target

# In game completion route
@game_blueprint.route('/finish')
def finish_game():
    final_score = session.get('game_score', 0)
    
    # Submit to leaderboard system
    result = submit_score_higher_better("Game Name", final_score, "points")
    
    # Handle redirect to username submission
    if result['success']:
        return redirect(result['redirect_url'])
    else:
        flash('Error submitting score', 'error')
        return redirect(url_for('game_blueprint.index'))
```

### Current Games
The app currently has 4 active components:
- **Home** - Game collection homepage with discovery interface
- **Time Predict Challenge** - Pure timing intuition game (hit exactly 10.000s within 0.1s tolerance)
- **React Time Challenge** - Visual reaction speed test with random indicators (react within 0.15s)
- **Cosmic Dino Runner** - Enhanced endless runner with variable jumps, ducking, air obstacles, and mobile controls
- **Leaderboard System** - Comprehensive scoring system supporting all games

### Admin Management System
- **Ultra-Secure Access**: Session-based authentication with cryptographically secure random keys
- **Complete Database Manager**: Full CRUD interface for leaderboard entries
- **Smart Entry Creation**: Intelligent defaults and validation for custom scores
- **Dynamic Game Detection**: Admin interfaces automatically update with new games
- **Discovery System**: Hidden access via developer console (`devAccess('CLAUDE_CODE_KING')`)

### Adding New Games
To add a new game to the platform:
1. Create blueprint structure in `website/new_game/`
2. Implement game logic with proper error handling
3. Create templates extending base template system
4. Add leaderboard integration using appropriate submission method
5. Register blueprint in `website/__init__.py`
6. **Add to GAMES_DATA in `website/home/home.py`** - this automatically updates all dropdowns

The modular architecture ensures new games integrate seamlessly with existing infrastructure while maintaining consistent patterns and leaderboard integration.

### Dynamic Game Management System
The platform features a dynamic game detection and management system:

**Automatic Dropdown Updates**: All navigation menus and admin interfaces automatically populate from:
- Games defined in `website/home/home.py` GAMES_DATA
- Existing games in the leaderboard database
- Registered Flask blueprints

**Smart Auto-Selection**: Admin interfaces intelligently suggest ranking methods and score types based on game names:
- Games with "dino" or "runner" → Higher is Better + Points
- Games with "predict" and "time" → Closest to Target + Seconds
- Games with "react" and "time" → Lower is Better + Milliseconds

**Zero Maintenance**: Adding a game to GAMES_DATA automatically updates:
- Navigation dropdown menu
- Admin database management dropdowns
- Custom score creation forms
- All search and filtering systems

### Navigation and User Experience

- **Base Template (`base.html`)**: Top scrollable navigation bar is empty by design
- **Dynamic Dropdown Menu**: Automatically populated from GAMES_DATA - no manual updates needed
- **Game Discovery**: Primarily through the home page interface
- **Search**: Enhanced to differentiate between Time Predict and React Time games
- **Mobile Support**: All games include touch/tap controls alongside keyboard controls
- **Auto-Updating**: Navigation automatically reflects new games added to the platform

## Documentation Management

### README.md Updates
When implementing new features or making significant changes that the user approves or accepts:

1. **Always update README.md** to reflect new functionality
2. **Current README.md content**: "SummerLockIn - Locking in?? In the Summer?? Look no further!!"
3. **When to update**: 
   - User explicitly approves a feature implementation
   - User shows acceptance through positive feedback or requests for additional features
   - Major functionality is added (new games, system enhancements)
   - Architecture changes that affect how the app works

### Update Pattern
```python
# After implementing a feature and receiving user approval:
# 1. Update the README.md with:
#    - Brief description of new feature
#    - How to access/use the feature
#    - Any setup requirements
# 2. Keep the existing fun tone ("Locking in?? In the Summer?? Look no further!!")
# 3. Add sections as needed: ## Features, ## Games, ## Getting Started, etc.
```

### Documentation Workflow
- Implement feature → Get user approval/acceptance → Update README.md → Update CLAUDE.md if needed
- Keep README.md user-focused (what the app does)
- Keep CLAUDE.md developer-focused (how to work with the code)

## Recommended Development Tools

### Game Development Enhancement

**Frontend Game Frameworks:**
- **Phaser.js**: Industry-standard 2D game framework with built-in physics, animations, and asset management
  - Installation: Add `<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>` to templates
  - Benefits: Simplified sprite management, collision detection, particle effects
  - Perfect for: Dino runner enhancements, new arcade games

- **p5.js**: Creative coding library, excellent for artistic/experimental games
  - Installation: `<script src="https://cdn.jsdelivr.net/npm/p5@1.7.0/lib/p5.min.js"></script>`
  - Benefits: Simple drawing API, built-in math functions, easy animations
  - Perfect for: Visual effects, generative art games, simple puzzles

### Development Workflow Tools

**Code Quality & Formatting:**
```bash
# Enhanced requirements-dev.txt should include:
black>=23.0.0              # Code formatter
flake8>=6.0.0              # Linting
mypy>=1.0.0                # Type checking
isort>=5.12.0              # Import sorting
pre-commit>=3.0.0          # Git hooks
bandit>=1.7.0              # Security linting
```

**Live Development:**
- **Flask-SocketIO**: Real-time features (multiplayer games, live leaderboards)
  - Installation: `pip install flask-socketio`
  - Benefits: WebSocket support, real-time updates, multiplayer capability

- **Browser-sync**: Auto-refresh during development
  - Installation: `npm install -g browser-sync`
  - Usage: `browser-sync start --proxy "localhost:5000" --files "website/static/**/*"`

**CSS Enhancement:**
- **Sass/SCSS**: Better CSS with variables, nesting, mixins
  - Installation: `npm install -g sass`
  - Usage: `sass website/static/css/style.scss website/static/css/style.css --watch`
  - Benefits: Cleaner stylesheets, reusable components, easier maintenance

### Frontend Build Tools

**Asset Management:**
- **Webpack**: Bundle and optimize JavaScript/CSS
  - Installation: `npm install webpack webpack-cli --save-dev`
  - Benefits: Code splitting, minification, hot reload
  
- **Vite**: Faster development server and build tool
  - Installation: `npm install vite --save-dev`
  - Benefits: Lightning-fast hot reload, modern ES modules

### Database & Backend Enhancements

**ORM & Database:**
- **SQLAlchemy**: Object-relational mapping instead of raw SQL
  - Installation: `pip install flask-sqlalchemy`
  - Benefits: Type safety, easier migrations, relationship management
  - Migration: `pip install flask-migrate` for database versioning

**Caching & Performance:**
- **Redis**: In-memory caching for session storage and leaderboards
  - Installation: `pip install redis flask-caching`
  - Benefits: Faster response times, real-time features, session sharing

### Testing & Quality Assurance

**Advanced Testing:**
- **pytest**: More powerful than unittest
  - Installation: `pip install pytest pytest-flask pytest-cov`
  - Benefits: Better test discovery, fixtures, parametrized tests

- **Cypress**: Modern end-to-end testing (alternative to Playwright)
  - Installation: `npm install cypress --save-dev`
  - Benefits: Time-travel debugging, real browser testing

### Monitoring & Analytics

**Error Tracking:**
- **Sentry**: Production error monitoring
  - Installation: `pip install sentry-sdk[flask]`
  - Benefits: Real-time error alerts, performance monitoring

**Analytics:**
- **Google Analytics 4**: User behavior tracking
- **Hotjar**: Heatmaps and user session recordings

### Development Environment

**Code Editor Extensions:**
- **Python**: Official Python extension for VS Code
- **Flask Snippets**: Flask-specific code snippets
- **Prettier**: Code formatting for HTML/CSS/JS
- **Live Server**: Local development server with live reload

**Git Workflow:**
- **Conventional Commits**: Standardized commit messages
- **Husky**: Git hooks for code quality checks
- **GitHub Actions**: CI/CD for automated testing and deployment

### Package Management

**Frontend Dependencies:**
Create `package.json` for managing JavaScript dependencies:
```json
{
  "name": "summerlockIn",
  "version": "1.0.0",
  "devDependencies": {
    "sass": "^1.69.0",
    "browser-sync": "^2.29.0",
    "webpack": "^5.88.0",
    "vite": "^4.4.0"
  },
  "dependencies": {
    "phaser": "^3.80.1"
  }
}
```

### Implementation Priority

**Most Impactful for Current Project:**
1. **Phaser.js** - Would dramatically improve Dino runner and enable complex new games
2. **Sass/SCSS** - Cleaner, more maintainable CSS for game styling
3. **Live reload** - Instant feedback during development
4. **pytest** - Better testing workflow
5. **SQLAlchemy** - Type-safe database operations

**Medium Priority:**
- Flask-SocketIO for real-time multiplayer features
- Redis for improved performance
- Code quality tools (black, flake8, mypy)

**Nice to Have:**
- Webpack/Vite for advanced asset management
- Sentry for production monitoring
- Advanced testing with Cypress

### Setup Commands

**Quick Enhanced Setup:**
```bash
# Install enhanced development tools
pip install -r requirements-dev.txt

# Setup frontend build tools (optional)
npm install

# Initialize pre-commit hooks
pre-commit install

# Run development server with enhanced features
python -m flask --app app run --debug --reload
```

The current Flask + vanilla JavaScript setup is solid for learning and rapid prototyping. These tools would enhance productivity and enable more complex features without overcomplicating the core architecture.