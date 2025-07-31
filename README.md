# SummerLockIn - Production Game Platform

[![Python Version](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://python.org)
[![Flask Version](https://img.shields.io/badge/flask-2.3%2B-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Code Style](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

SummerLockIn - Locking in?? In the Summer?? Look no further!!

A production-ready Flask web application featuring a curated collection of interactive games with comprehensive leaderboard system, dynamic game management, ultra-secure admin tools, and enterprise-level security features.

## 🎯 Features

### Core Platform
- **🏠 Game Discovery Hub**: Advanced search, filtering, and categorization system
- **🏆 Comprehensive Leaderboards**: Multi-game scoring system with flexible ranking methods
- **🔒 Enterprise Security**: CSRF protection, XSS prevention, secure headers, input validation
- **📱 Responsive Design**: Mobile-first approach with accessibility compliance
- **⚡ Performance Optimized**: Database indexing, connection pooling, efficient queries

### Integrated Games
- **🦕 Cosmic Dino Runner**: Enhanced endless runner with variable jumps, ducking mechanics, air obstacles, and mobile touch controls
- **⏱️ Time Predict Challenge**: Precision timing challenge - hit exactly 10.000 seconds within 0.1s tolerance
- **⚡ React Time Challenge**: Visual reaction speed test with random indicators - react within 0.15s

### Advanced Features
- **🎖️ Achievement System**: User progress tracking with unlock notifications
- **🎲 Daily Challenges**: Rotating featured games and random discovery
- **📊 Analytics Dashboard**: Comprehensive game statistics and user engagement metrics
- **🔧 Ultra-Secure Admin Tools**: Session-based admin with database management interface
- **🔄 Dynamic Game System**: Automatic dropdown updates when new games are added
- **🗄️ Complete Database Manager**: Full CRUD interface for leaderboard entries
- **🌐 API Endpoints**: RESTful API for external integrations

### Navigation Design
- **Top scrollable bar**: Intentionally empty - all apps accessible via dropdown menu only
- **Dynamic dropdown menu**: Automatically updates when new games are added to GAMES_DATA
- **Smart search functionality**: Enhanced to find all games with intelligent tagging
- **Zero-maintenance navigation**: Adding games to home config automatically updates all menus
- **Clean interface**: Focus on game discovery through home page rather than navigation clutter

## 🚀 Quick Start

### Prerequisites
- **Python 3.8 or higher**
- **pip** (Python package installer)
- **Git** (for version control)
- **Virtual environment** (recommended)

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd pastimes
   ```

2. **Set Up Virtual Environment**
   ```bash
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize Database**
   ```bash
   python -c "from website.leaderboard.leaderboard import init_database; init_database()"
   ```

6. **Run the Application**
   ```bash
   # Development mode
   python app.py
   
   # Production mode
   python run_production.py
   ```

7. **Access the Application**
   - **Development**: http://localhost:5000
   - **Production**: http://localhost:8000

## 📁 Project Structure

```
example_name/
├── app.py                          # Development entry point
├── run_production.py               # Production server
├── config.py                       # Configuration management
├── requirements.txt                # Dependencies
├── .env.example                    # Environment template
├── .gitignore                      # Git exclusions
├── README.md                       # This file
├── CLAUDE.md                       # Claude Code guidance
└── website/                        # Main application package
    ├── __init__.py                 # App factory
    ├── utils.py                    # Shared utilities
    ├── static/                     # Static assets
    │   ├── css/                    # Stylesheets
    │   ├── js/                     # JavaScript
    │   └── assets/                 # Images, fonts
    ├── templates/                  # Global templates
    │   ├── base.html               # Master template
    │   ├── 404.html                # Error pages
    │   └── 500.html
    ├── home/                       # Homepage feature
    │   ├── __init__.py
    │   ├── home.py
    │   └── templates/
    ├── leaderboard/                # Leaderboard system
    │   ├── __init__.py
    │   ├── leaderboard.py
    │   └── templates/
    ├── dino_runner/                # Dino runner game
    │   ├── __init__.py
    │   ├── dino_runner.py
    │   └── templates/
    └── time_predict/               # Time prediction game
        ├── __init__.py
        ├── time_predict.py
        └── templates/
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Flask Configuration
FLASK_ENV=development                # development, testing, production
FLASK_HOST=127.0.0.1                # Server host
FLASK_PORT=5000                      # Server port
SECRET_KEY=your-secret-key-here      # Session encryption key

# Database Configuration
DATABASE_PATH=data/leaderboards.db   # SQLite database path

# Security Configuration
CSRF_ENABLED=true                    # Enable CSRF protection
SESSION_COOKIE_SECURE=false         # HTTPS-only cookies (true for production)
SESSION_COOKIE_HTTPONLY=true        # Prevent JavaScript access

# Application Configuration
MAX_CONTENT_LENGTH=16777216          # 16MB file upload limit
TEMPLATES_AUTO_RELOAD=true           # Auto-reload templates (dev only)

# Rate Limiting
RATE_LIMIT_ENABLED=true              # Enable rate limiting
RATE_LIMIT_STORAGE_URL=memory://     # Rate limit storage

# Logging Configuration
LOG_LEVEL=INFO                       # DEBUG, INFO, WARNING, ERROR
LOG_FILE=logs/app.log                # Log file path
```

### Configuration Environments

- **Development**: Debug mode, auto-reload, verbose logging
- **Testing**: In-memory database, disabled security features
- **Production**: Security hardening, performance optimization, file logging

## 🎮 Game Integration

### Adding New Games

1. **Create Blueprint Structure**
   ```bash
   mkdir website/new_game
   touch website/new_game/__init__.py
   touch website/new_game/new_game.py
   mkdir website/new_game/templates
   ```

2. **Implement Game Logic**
   ```python
   # website/new_game/new_game.py
   from flask import Blueprint, render_template, session, redirect, url_for
   from website.leaderboard.leaderboard import submit_score_higher_better
   
   new_game = Blueprint('new_game', __name__, template_folder='templates')
   
   @new_game.route('/')
   def index():
       return render_template('new_game.html')
   
   @new_game.route('/finish')
   def finish():
       score = session.get('new_game_score', 0)
       result = submit_score_higher_better("New Game", score, "points")
       
       if result['success']:
           return redirect(result['redirect_url'])
       else:
           return redirect(url_for('new_game.index'))
   ```

3. **Register Blueprint**
   ```python
   # In website/__init__.py, add to blueprints list:
   ('website.new_game.new_game', 'new_game', '/new-game'),
   ```

4. **Update Homepage** (This automatically updates ALL dropdowns)
   ```python
   # In website/home/home.py, add to GAMES_DATA:
   {
       'name': 'New Game',
       'description': 'Game description',
       'endpoint': 'new_game.index',
       'icon': '🎮',
       'category': 'arcade',
       'tags': ['new', 'game', 'fun'],
       'difficulty': 3
   },
   ```
   
   **This single change automatically updates:**
   - Navigation dropdown menu
   - Admin database management forms
   - Search functionality
   - All game selection interfaces

### Leaderboard Integration

The platform supports multiple ranking methods:

```python
# Traditional scoring (higher is better)
submit_score_higher_better("Game Name", score, "points")

# Time-based scoring (lower is better)
submit_score_lower_better("Racing Game", time_seconds, "seconds")

# Precision scoring (closest to target)
submit_score_closest_to_target("Prediction Game", guess, target, "guess")

# Percentage scoring (accuracy-based)
submit_percentage_higher("Quiz Game", accuracy_percent, "accuracy_%")
```

## 🔐 Admin Management System

### Ultra-Secure Access
The platform features a sophisticated admin system with session-based security:

1. **Discovery**: Access any page → F12 Console → `devAccess('CLAUDE_CODE_KING')`
2. **Key Generation**: System creates cryptographically secure session-specific admin key
3. **Admin Access**: Click generated URL for instant admin panel access
4. **Session Security**: Keys are session-bound and automatically expire

### Complete Database Management
- **📊 Statistics Dashboard**: Overview of all games and entry counts
- **🔍 Search & Filter**: Real-time search through all leaderboard entries
- **✏️ Edit Entries**: Modify usernames, scores, and dates with validation
- **➕ Add Custom Scores**: Create entries for testing or fun with smart defaults
- **🗑️ Delete Operations**: Safe deletion with confirmation dialogs
- **🔄 Dynamic Games**: All forms automatically update when new games are added

### Smart Auto-Selection
The admin system intelligently suggests settings based on game names:
- Dino/Runner games → Higher is Better + Points
- Time Predict games → Closest to Target + Seconds  
- React Time games → Lower is Better + Milliseconds
- Custom logic for any game name patterns

## 🗄️ Database Schema

### Tables

**game_configs**
```sql
CREATE TABLE game_configs (
    game_name TEXT PRIMARY KEY,
    score_type TEXT NOT NULL DEFAULT 'points',
    ranking_method TEXT NOT NULL DEFAULT 'higher_is_better',
    target_value REAL,
    higher_is_better BOOLEAN NOT NULL DEFAULT 1,
    max_entries_per_user INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**leaderboard_entries**
```sql
CREATE TABLE leaderboard_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_name TEXT NOT NULL,
    username TEXT NOT NULL,
    score REAL NOT NULL,
    ranking_score REAL NOT NULL,
    original_score REAL NOT NULL,
    score_type TEXT NOT NULL DEFAULT 'points',
    ranking_method TEXT NOT NULL DEFAULT 'higher_is_better',
    target_value REAL,
    higher_is_better BOOLEAN NOT NULL DEFAULT 1,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_submitted DATE DEFAULT (date('now')),
    ip_address TEXT,
    session_id TEXT
);
```

### Performance Indexes
- `idx_leaderboard_game_ranking_score`: Fast leaderboard queries
- `idx_leaderboard_game_timestamp`: Chronological sorting
- `idx_leaderboard_username`: User score lookup

## 🔒 Security Features

### Input Validation
- **Username**: 2-20 characters, alphanumeric and basic punctuation
- **Scores**: Type-specific validation with reasonable bounds
- **Rate Limiting**: Session-based submission limits

### Security Headers
- **Content Security Policy**: XSS prevention
- **X-Frame-Options**: Clickjacking protection
- **X-Content-Type-Options**: MIME sniffing prevention
- **Referrer-Policy**: Information leakage control

### Data Protection
- **Session Security**: Secure cookies, CSRF tokens
- **Input Sanitization**: HTML entity encoding
- **SQL Injection Prevention**: Parameterized queries
- **Error Handling**: No sensitive information exposure

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   export FLASK_ENV=production
   export SECRET_KEY="$(python -c 'import secrets; print(secrets.token_hex(32))')"
   export SESSION_COOKIE_SECURE=true
   export DATABASE_PATH=/var/lib/pastimes/leaderboards.db
   ```

2. **Database Preparation**
   ```bash
   sudo mkdir -p /var/lib/pastimes
   sudo chown www-data:www-data /var/lib/pastimes
   python -c "from website.leaderboard.leaderboard import init_database; init_database()"
   ```

3. **Run Production Server**
   ```bash
   python run_production.py
   ```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN mkdir -p data logs

EXPOSE 8000
CMD ["python", "run_production.py"]
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /static {
        alias /path/to/pastimes/website/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🧪 Testing

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-flask coverage

# Run all tests
pytest

# Run with coverage
pytest --cov=website

# Run specific test file
pytest tests/test_leaderboard.py

# Run with verbose output
pytest -v
```

### Test Structure

```
tests/
├── conftest.py                 # Test configuration
├── test_app.py                 # Application factory tests
├── test_leaderboard.py         # Leaderboard system tests
├── test_games.py               # Game integration tests
├── test_security.py            # Security feature tests
└── test_api.py                 # API endpoint tests
```

### Writing Tests

```python
def test_score_submission(client, app):
    """Test score submission flow."""
    with app.test_request_context():
        # Submit score
        response = client.post('/leaderboard/submit', data={
            'username': 'testuser',
            'score': 100
        })
        
        assert response.status_code == 302
        # Additional assertions...
```

## 📊 API Documentation

### Leaderboard Endpoints

**GET /leaderboard/api/leaderboard/<game_name>**
```json
{
    "game_name": "Dino Runner",
    "scores": [
        {
            "rank": 1,
            "username": "player1",
            "score": 1250,
            "date": "2024-01-15"
        }
    ],
    "total_entries": 100
}
```

**POST /leaderboard/api/submit**
```json
{
    "game_name": "Game Name",
    "username": "player",
    "score": 100,
    "score_type": "points"
}
```

### Search API

**GET /api/search?q=query&category=arcade**
```json
{
    "success": true,
    "games": [
        {
            "name": "Dino Runner",
            "category": "arcade",
            "difficulty": 3
        }
    ],
    "count": 1
}
```

## 🔍 Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check database file permissions
ls -la data/leaderboards.db

# Reinitialize database
python -c "from website.leaderboard.leaderboard import init_database; init_database()"
```

**Import Errors**
```bash
# Verify virtual environment activation
which python

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

**Port Already in Use**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Use different port
export FLASK_PORT=5001
```

### Logging

Application logs are stored in `logs/app.log` with rotation:

```bash
# View recent logs
tail -f logs/app.log

# Search for errors
grep ERROR logs/app.log

# View log file size
ls -lh logs/
```

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-feature`
3. **Install development dependencies**: `pip install -r requirements-dev.txt`
4. **Run tests**: `pytest`
5. **Commit changes**: `git commit -am 'Add new feature'`
6. **Push branch**: `git push origin feature/new-feature`
7. **Create Pull Request**

### Code Standards

- **Style**: Follow PEP 8, use Black formatter
- **Naming**: snake_case for Python, kebab-case for URLs
- **Documentation**: Comprehensive docstrings for all functions
- **Testing**: Minimum 80% test coverage
- **Security**: Input validation and proper error handling

### Pull Request Guidelines

- Clear description of changes
- Tests for new functionality
- Documentation updates
- No breaking changes without discussion
- Squash commits before merging

## 📈 Performance Optimization

### Database Optimization
- Use indexed queries for leaderboard operations
- Implement pagination for large result sets
- Connection pooling for concurrent access
- Regular database maintenance and cleanup

### Frontend Optimization
- Minify CSS and JavaScript assets
- Implement lazy loading for images
- Use browser caching for static assets
- Progressive enhancement for JavaScript features

### Server Optimization
- Use production WSGI server (Waitress/Gunicorn)
- Enable compression for HTTP responses
- Implement reverse proxy caching
- Monitor resource usage and optimize bottlenecks

## 🛡️ Security Considerations

### Production Checklist
- [ ] Use strong, random SECRET_KEY
- [ ] Enable HTTPS and secure cookies
- [ ] Configure Content Security Policy
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Backup database regularly
- [ ] Use environment variables for secrets

### Security Headers
The application automatically applies security headers in production:
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Credits

- **Flask Framework**: https://flask.palletsprojects.com/
- **Security**: flask-talisman for security headers
- **Production Server**: Waitress WSGI server
- **Database**: SQLite for data persistence

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Consult the CLAUDE.md file for development guidance

## 🔄 Dynamic System Architecture

### Zero-Maintenance Game Management
SummerLockIn features a revolutionary dynamic game detection system:

**Single Source of Truth**: Games defined in `website/home/home.py` GAMES_DATA automatically propagate to:
- Navigation dropdown menus
- Admin database management interfaces  
- Search and filtering systems
- Leaderboard creation forms

**Smart Detection**: System intelligently detects game types and suggests appropriate:
- Ranking methods (higher/lower is better, closest to target)
- Score types (points, seconds, milliseconds)
- Validation rules and defaults

**Future-Proof**: Adding new games requires only updating GAMES_DATA - everything else updates automatically!

---

**Version**: 2.0.0 (Dynamic Management Edition)
**Last Updated**: July 2025  
**Minimum Python Version**: 3.8+