# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
- **Development server**: `python app.py` (runs Flask with debug mode enabled)
- **Install dependencies**: `pip install -r requirements.txt`
- **Virtual environment**: `python -m venv venv` then activate with `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (macOS/Linux)
- **Database initialization**: `python -c "from website.leaderboard.leaderboard import init_database; init_database()"`

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

Games are registered in `website/__init__.py` following the pattern:
```python
from .game_name.game_name import game_name
app.register_blueprint(game_name, url_prefix='/gameurl')
```

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
- Base template in `website/templates/base.html`
- Context processor injects `request` object for navigation
- Custom 404 error page with space theme
- Template inheritance using block system

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
The app currently has 4 active games:
- **Test Home** - Game collection homepage with discovery interface
- **Leaderboard** - Comprehensive scoring system with multiple ranking methods
- **Time Predict** - Precision timing challenge with accuracy-based scoring
- **Dino Runner** - Endless runner game with obstacle mechanics and score tracking

### Adding New Games
To add a new game to the platform:
1. Create blueprint structure in `website/new_game/`
2. Implement game logic with proper error handling
3. Create templates extending base template system
4. Add leaderboard integration using appropriate submission method
5. Register blueprint in `website/__init__.py`
6. Update homepage game listing if needed

The modular architecture ensures new games integrate seamlessly with existing infrastructure while maintaining consistent patterns and leaderboard integration.

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