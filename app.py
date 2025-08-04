from website import create_app
import os
import time
import sqlite3
import secrets
from functools import wraps
from flask import Flask, render_template, url_for, request, jsonify, session, redirect, g, abort, render_template_string, current_app

app = create_app()

# Production-ready configuration
app.secret_key = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')

# Enable debug mode
DEBUG_MODE = True

# ========== DYNAMIC GAME DETECTION SYSTEM ==========

def get_registered_games():
    """Get all games from multiple sources - blueprints, home.py, and database"""
    games_list = []
    
    try:
        # Method 1: Get from home.py GAMES_DATA
        from website.home.home import GAMES_DATA
        for game_data in GAMES_DATA:
            games_list.append({
                'name': game_data['name'],
                'icon': game_data.get('icon', '🎮'),
                'endpoint': game_data.get('endpoint', ''),
                'source': 'home_config'
            })
    except ImportError:
        pass
    
    try:
        # Method 2: Get from database (existing games with entries)
        import sqlite3
        conn = sqlite3.connect('leaderboards.db')
        cursor = conn.cursor()
        cursor.execute('SELECT DISTINCT game_name FROM leaderboard_entries ORDER BY game_name')
        db_games = cursor.fetchall()
        conn.close()
        
        for (game_name,) in db_games:
            # Only add if not already in list from home.py
            if not any(g['name'] == game_name for g in games_list):
                # Try to match with known game configs for icons
                icon = '🎮'  # default
                if 'dino' in game_name.lower() or 'runner' in game_name.lower():
                    icon = '🦕'
                elif 'time' in game_name.lower():
                    icon = '🕒' if 'predict' in game_name.lower() else '⚡'
                elif 'react' in game_name.lower():
                    icon = '⚡'
                    
                games_list.append({
                    'name': game_name,
                    'icon': icon,
                    'endpoint': '',
                    'source': 'database'
                })
    except Exception:
        pass
    
    # Method 3: Add any hardcoded essential games that might be missing
    essential_games = [
        {'name': 'Custom Game', 'icon': '🎯', 'endpoint': '', 'source': 'system'}
    ]
    
    for essential in essential_games:
        if not any(g['name'] == essential['name'] for g in games_list):
            games_list.append(essential)
    
    return sorted(games_list, key=lambda x: x['name'])

def get_navigation_games():
    """Get games for navigation dropdown - only from home.py with endpoints"""
    nav_games = []
    
    try:
        from website.home.home import GAMES_DATA
        for game_data in GAMES_DATA:
            if game_data.get('endpoint'):  # Only include games with valid endpoints
                nav_games.append({
                    'name': game_data['name'],
                    'icon': game_data.get('icon', '🎮'),
                    'endpoint': game_data['endpoint'],
                    'search_terms': ' '.join(game_data.get('tags', [])) + ' ' + game_data['name'].lower()
                })
    except ImportError:
        pass
    
    return sorted(nav_games, key=lambda x: x['name'])

# ========== SIMPLE PROFESSIONAL ADMIN SYSTEM ==========

def simple_admin_required(f):
    """Session-based admin check with random key"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for session-specific admin key
        provided_key = request.args.get('admin_key')
        session_key = session.get('admin_session_key')
        
        if provided_key and session_key and provided_key == session_key:
            session['admin_authenticated'] = True
            session.permanent = True
            
        if not session.get('admin_authenticated'):
            abort(404)
            
        return f(*args, **kwargs)
    return decorated_function

@app.route('/dev/generate-admin-key')
def generate_admin_key():
    """Generate a random session-specific admin key"""
    # Generate a secure random key for this session
    admin_key = secrets.token_urlsafe(32)
    session['admin_session_key'] = admin_key
    session.permanent = True
    
    return jsonify({
        'admin_key': admin_key,
        'admin_url': f'/admin/summerlockin?admin_key={admin_key}',
        'message': 'Session-specific admin key generated! Valid only for your current session.'
    })

@app.route('/api/claude-agent')
def claude_agent_endpoint():
    """Dedicated endpoint for Claude agent creation - always returns valid JSON"""
    try:
        # Generate a secure random key for this session
        admin_key = secrets.token_urlsafe(32)
        session['admin_session_key'] = admin_key
        session.permanent = True
        
        # Return a clean JSON response for Claude agent creation
        return jsonify({
            'success': True,
            'agent_config': {
                'name': 'SummerLockIn Gaming Hub Agent',
                'description': 'A gaming hub agent for managing games and user interactions',
                'capabilities': [
                    'Game management',
                    'User statistics tracking',
                    'Leaderboard management',
                    'Admin panel access'
                ],
                'endpoints': {
                    'admin_panel': f'/admin/summerlockin?admin_key={admin_key}',
                    'games': '/test_home/',
                    'leaderboard': '/leaderboard/',
                    'time_predict': '/time_predict/',
                    'react_time': '/react_time/',
                    'space_invaders': '/space_invaders/',
                    'dino_runner': '/dino_runner/'
                }
            },
            'session_key': admin_key,
            'message': 'Claude agent configuration generated successfully'
        })
    except Exception as e:
        # Always return valid JSON, even on error
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to generate Claude agent configuration'
        }), 500

@app.route('/admin/summerlockin')
@simple_admin_required
def simple_admin():
    """Simple admin dashboard"""
    # Get dynamic games list for admin panel
    registered_games = get_registered_games()
    
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>System Diagnostics - Advanced</title>
        <style>
            body { 
                background: #001122; 
                color: #00ffff; 
                font-family: 'Courier New', monospace; 
                margin: 0; 
                padding: 20px;
                min-height: 100vh;
            }
            .admin-container {
                max-width: 1000px;
                margin: 0 auto;
                background: rgba(0,255,255,0.05);
                border: 1px solid #00ffff;
                border-radius: 10px;
                padding: 30px;
            }
            .admin-header {
                text-align: center;
                font-size: 2rem;
                margin-bottom: 30px;
                color: #00ffff;
                text-shadow: 0 0 20px #00ffff;
            }
            .admin-section {
                margin: 30px 0;
                padding: 20px;
                border: 1px solid rgba(0,255,255,0.3);
                border-radius: 8px;
                background: rgba(0,0,0,0.3);
            }
            .admin-btn {
                background: linear-gradient(135deg, #ff6b6b, #ff8e53);
                color: white;
                border: none;
                padding: 15px 25px;
                margin: 10px;
                border-radius: 8px;
                font-family: inherit;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-block;
            }
            .admin-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(0,255,255,0.3);
            }
            .danger-btn {
                background: linear-gradient(135deg, #ff4444, #cc0000);
            }
            .success-btn {
                background: linear-gradient(135deg, #44ff44, #00cc00);
            }
            .info-text {
                color: #888;
                font-size: 0.9rem;
                margin: 10px 0;
            }
            .auth-info {
                background: rgba(0,255,0,0.1);
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
                border-left: 4px solid #00ff00;
            }
        </style>
    </head>
    <body>
        <div class="admin-container">
            <div class="admin-header">
                👑 CLAUDE_CODE_KING ADMIN PANEL 👑
            </div>
            
            <div class="auth-info">
                <strong>🔐 Authentication Status:</strong> GRANTED<br>
                <strong>🌐 Access IP:</strong> {{ request.remote_addr }}<br>
                <strong>⏰ Session Active:</strong> ✅
            </div>
            
            <div class="admin-section">
                <h3>🗄️ Database Operations</h3>
                <p class="info-text">Manage leaderboard database entries and configurations.</p>
                <a href="/admin/summerlockin/database" class="admin-btn">
                    🗄️ Database Manager
                </a>
                <a href="/admin/summerlockin/cleanup" class="admin-btn danger-btn">
                    🧹 Clean Old Data
                </a>
            </div>
            
            <div class="admin-section">
                <h3>⚙️ System Information</h3>
                <p class="info-text">Current system status and environment details.</p>
                <p><strong>Environment:</strong> {{ 'Production' if is_production else 'Development' }}</p>
                <p><strong>Debug Mode:</strong> {{ debug_mode }}</p>
                <p><strong>Database Path:</strong> {{ db_path }}</p>
                <p><strong>Registered Games:</strong> {{ games_count }} games detected</p>
                <div style="font-size: 0.8rem; color: #666; margin-top: 10px;">
                    {% for game in registered_games %}
                    <span style="margin-right: 15px;">{{ game.icon }} {{ game.name }}</span>
                    {% endfor %}
                </div>
            </div>
            
            <div class="admin-section">
                <h3>🚪 Session Management</h3>
                <p class="info-text">Manage your admin session.</p>
                <a href="/admin/logout" class="admin-btn danger-btn">
                    🚪 Logout
                </a>
            </div>
        </div>
    </body>
    </html>
    ''', 
    is_production=bool(os.environ.get('RENDER')),
    debug_mode=DEBUG_MODE,
    db_path=os.path.join(os.getcwd(), 'leaderboards.db'),
    registered_games=registered_games,
    games_count=len(registered_games)
    )

@app.route('/admin/summerlockin/database')
@simple_admin_required
def database_manager():
    """Full database management interface"""
    try:
        conn = sqlite3.connect('leaderboards.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all leaderboard entries with game info
        cursor.execute('''
            SELECT 
                le.id,
                le.game_name,
                le.username,
                le.score,
                le.original_score,
                le.score_type,
                le.ranking_method,
                le.date_submitted,
                le.timestamp,
                le.ip_address
            FROM leaderboard_entries le
            ORDER BY le.game_name, le.ranking_score DESC
        ''')
        
        entries = cursor.fetchall()
        
        # Get game statistics
        cursor.execute('''
            SELECT 
                game_name,
                COUNT(*) as entry_count,
                score_type,
                ranking_method
            FROM leaderboard_entries
            GROUP BY game_name
            ORDER BY game_name
        ''')
        
        games = cursor.fetchall()
        conn.close()
        
        available_games = get_registered_games()
        return render_template_string(DATABASE_MANAGER_TEMPLATE, 
                                    entries=entries, 
                                    games=games,
                                    available_games=available_games)
        
    except Exception as e:
        return render_template_string('''
        <html><body style="background:#000;color:#ff4444;font-family:monospace;padding:50px;text-align:center;">
        <h1>💥 DATABASE ERROR</h1>
        <p>{{ error }}</p>
        <a href="/admin/summerlockin" style="color:#00ffff;">← Back to Admin Panel</a>
        </body></html>
        ''', error=str(e))

@app.route('/admin/summerlockin/database/edit/<int:entry_id>')
@simple_admin_required
def edit_entry(entry_id):
    """Edit a specific leaderboard entry"""
    try:
        conn = sqlite3.connect('leaderboards.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM leaderboard_entries WHERE id = ?', (entry_id,))
        entry = cursor.fetchone()
        conn.close()
        
        if not entry:
            return "Entry not found", 404
            
        return render_template_string(EDIT_ENTRY_TEMPLATE, entry=entry)
        
    except Exception as e:
        return f"Error: {e}", 500

@app.route('/admin/summerlockin/database/update/<int:entry_id>', methods=['POST'])
@simple_admin_required
def update_entry(entry_id):
    """Update a leaderboard entry"""
    try:
        conn = sqlite3.connect('leaderboards.db')
        cursor = conn.cursor()
        
        username = request.form.get('username')
        score = float(request.form.get('score'))
        date_submitted = request.form.get('date_submitted')
        
        cursor.execute('''
            UPDATE leaderboard_entries 
            SET username = ?, score = ?, original_score = ?, date_submitted = ?
            WHERE id = ?
        ''', (username, score, score, date_submitted, entry_id))
        
        conn.commit()
        conn.close()
        
        return redirect('/admin/summerlockin/database?updated=1')
        
    except Exception as e:
        return f"Error updating entry: {e}", 500

@app.route('/admin/summerlockin/database/delete/<int:entry_id>', methods=['POST'])
@simple_admin_required
def delete_entry(entry_id):
    """Delete a leaderboard entry"""
    try:
        conn = sqlite3.connect('leaderboards.db')
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM leaderboard_entries WHERE id = ?', (entry_id,))
        conn.commit()
        conn.close()
        
        return redirect('/admin/summerlockin/database?deleted=1')
        
    except Exception as e:
        return f"Error deleting entry: {e}", 500

@app.route('/admin/summerlockin/database/add')
@simple_admin_required
def add_entry_form():
    """Form to add a new leaderboard entry"""
    available_games = get_registered_games()
    return render_template_string(ADD_ENTRY_TEMPLATE, available_games=available_games)

@app.route('/admin/summerlockin/database/create', methods=['POST'])
@simple_admin_required
def create_entry():
    """Create a new leaderboard entry"""
    try:
        conn = sqlite3.connect('leaderboards.db')
        cursor = conn.cursor()
        
        game_name = request.form.get('game_name')
        username = request.form.get('username')
        score = float(request.form.get('score'))
        score_type = request.form.get('score_type', 'points')
        ranking_method = request.form.get('ranking_method', 'higher_is_better')
        date_submitted = request.form.get('date_submitted')
        
        # Insert the new entry
        cursor.execute('''
            INSERT INTO leaderboard_entries 
            (game_name, username, score, ranking_score, original_score, score_type, ranking_method, 
             target_value, higher_is_better, date_submitted, ip_address, session_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 'admin_created', 'admin_session')
        ''', (game_name, username, score, score, score, score_type, ranking_method, 
              1 if ranking_method == 'higher_is_better' else 0, date_submitted, request.remote_addr))
        
        # Create game config if it doesn't exist
        cursor.execute('''
            INSERT OR IGNORE INTO game_configs 
            (game_name, score_type, ranking_method, higher_is_better, max_entries_per_user)
            VALUES (?, ?, ?, ?, 10)
        ''', (game_name, score_type, ranking_method, 1 if ranking_method == 'higher_is_better' else 0))
        
        conn.commit()
        conn.close()
        
        return redirect('/admin/summerlockin/database?created=1')
        
    except Exception as e:
        return f"Error creating entry: {e}", 500

@app.route('/admin/summerlockin/cleanup')
@simple_admin_required  
def admin_database_cleanup():
    """Database cleanup interface"""
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Database Cleanup - CLAUDE_CODE_KING</title>
        <style>
            body { 
                background: #001122; 
                color: #00ffff; 
                font-family: 'Courier New', monospace; 
                margin: 0; 
                padding: 20px;
                min-height: 100vh;
            }
            .cleanup-container {
                max-width: 800px;
                margin: 0 auto;
                background: rgba(0,255,255,0.05);
                border: 1px solid #00ffff;
                border-radius: 10px;
                padding: 30px;
            }
            .cleanup-header {
                text-align: center;
                font-size: 1.8rem;
                margin-bottom: 30px;
                color: #ff6b6b;
                text-shadow: 0 0 20px #ff6b6b;
            }
            .data-preview {
                background: rgba(0,0,0,0.5);
                border: 1px solid #666;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                font-size: 0.9rem;
            }
            .confirm-form {
                background: rgba(255,0,0,0.1);
                border: 2px solid #ff4444;
                border-radius: 8px;
                padding: 25px;
                margin: 30px 0;
            }
            .admin-btn {
                background: linear-gradient(135deg, #ff6b6b, #ff8e53);
                color: white;
                border: none;
                padding: 15px 25px;
                margin: 10px;
                border-radius: 8px;
                font-family: inherit;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-block;
            }
            .danger-btn {
                background: linear-gradient(135deg, #ff4444, #cc0000);
            }
            input[type="text"] {
                background: #000;
                color: #00ffff;
                border: 2px solid #00ffff;
                padding: 10px;
                font-family: inherit;
                font-size: 1rem;
                width: 300px;
                margin: 10px;
                border-radius: 5px;
            }
            .warning {
                color: #ffaa00;
                font-weight: bold;
                margin: 15px 0;
            }
        </style>
    </head>
    <body>
        <div class="cleanup-container">
            <div class="cleanup-header">
                🧹 DATABASE CLEANUP OPERATION
            </div>
            
            <div class="data-preview">
                <h3>📋 Data to be Removed:</h3>
                {% for entry in old_entries %}
                <div>• {{ entry[0] }}: {{ entry[1] }} (Score: {{ entry[2] }})</div>
                {% endfor %}
                <br>
                <strong>Total entries to delete: {{ old_entries|length }}</strong>
            </div>
            
            <div class="confirm-form">
                <h3>⚠️ CONFIRMATION REQUIRED</h3>
                <p class="warning">This action cannot be undone!</p>
                
                <form method="POST" action="/admin/summerlockin/cleanup">
                    <p>Type <strong>DELETE_OLD_LEADERBOARD_DATA</strong> to confirm:</p>
                    <input type="text" name="confirm" placeholder="Confirmation phrase..." required>
                    <br>
                    <button type="submit" class="admin-btn danger-btn">
                        🗑️ PERMANENTLY DELETE DATA
                    </button>
                </form>
            </div>
            
            <a href="/admin/summerlockin" class="admin-btn">
                ← Back to Admin Panel
            </a>
        </div>
    </body>
    </html>
    ''', old_entries=get_old_data_preview())

@app.route('/admin/summerlockin/cleanup', methods=['POST'])
@simple_admin_required
def admin_database_cleanup_execute():
    """Execute database cleanup"""
    confirm = request.form.get('confirm', '').strip()
    
    if confirm != 'DELETE_OLD_LEADERBOARD_DATA':
        return render_template_string('''
        <html><body style="background:#000;color:#ff4444;font-family:monospace;padding:50px;text-align:center;">
        <h1>❌ CONFIRMATION FAILED</h1>
        <p>Incorrect confirmation phrase. Operation cancelled.</p>
        <a href="/admin/summerlockin/cleanup" style="color:#00ffff;">← Try Again</a>
        </body></html>
        ''')
    
    # Execute cleanup
    try:
        from website.leaderboard.leaderboard import get_db_connection
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Delete old entries
            cursor.execute('DELETE FROM leaderboard_entries WHERE game_name LIKE "%React Mode%" OR game_name LIKE "%Predict Mode%"')
            entries_deleted = cursor.rowcount
            
            cursor.execute('DELETE FROM game_configs WHERE game_name LIKE "%React Mode%" OR game_name LIKE "%Predict Mode%"')
            configs_deleted = cursor.rowcount
            
            conn.commit()
            
            return render_template_string('''
            <html><body style="background:#000;color:#00ff00;font-family:monospace;padding:50px;text-align:center;">
            <h1>✅ CLEANUP SUCCESSFUL</h1>
            <p>Deleted {{ entries_deleted }} leaderboard entries</p>
            <p>Deleted {{ configs_deleted }} game configurations</p>
            <p>Old "React Mode" and "Predict Mode" data has been removed.</p>
            <a href="/admin/summerlockin" style="color:#00ffff;">← Back to Admin Panel</a>
            </body></html>
            ''', entries_deleted=entries_deleted, configs_deleted=configs_deleted)
            
    except Exception as e:
        return render_template_string('''
        <html><body style="background:#000;color:#ff4444;font-family:monospace;padding:50px;text-align:center;">
        <h1>💥 ERROR OCCURRED</h1>
        <p>{{ error }}</p>
        <a href="/admin/summerlockin" style="color:#00ffff;">← Back to Admin Panel</a>
        </body></html>
        ''', error=str(e))

@app.route('/admin/logout')
def admin_logout():
    """Logout from admin session and invalidate session key"""
    session.pop('admin_authenticated', None)
    session.pop('admin_session_key', None)  # Invalidate the session key
    return render_template_string('''
    <html><body style="background:#000;color:#00ff00;font-family:monospace;padding:50px;text-align:center;">
    <h1>🚪 LOGGED OUT</h1>
    <p>Admin session terminated and key invalidated.</p>
    <a href="/" style="color:#00ffff;">← Return to Home</a>
    </body></html>
    ''')

def get_old_data_preview():
    """Get preview of old data to be deleted"""
    try:
        conn = sqlite3.connect('leaderboards.db')
        cursor = conn.cursor()
        cursor.execute('SELECT game_name, username, score FROM leaderboard_entries WHERE game_name LIKE "%React Mode%" OR game_name LIKE "%Predict Mode%"')
        data = cursor.fetchall()
        conn.close()
        return data
    except:
        return []

# Database Management Templates
DATABASE_MANAGER_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Database Manager - CLAUDE_CODE_KING</title>
    <style>
        body { 
            background: #001122; 
            color: #00ffff; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px;
            min-height: 100vh;
        }
        .db-container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(0,255,255,0.05);
            border: 1px solid #00ffff;
            border-radius: 10px;
            padding: 30px;
        }
        .db-header {
            text-align: center;
            font-size: 1.8rem;
            margin-bottom: 30px;
            color: #00ffff;
            text-shadow: 0 0 20px #00ffff;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(0,0,0,0.3);
            border: 1px solid #666;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .stat-number {
            font-size: 2rem;
            color: #ff6b6b;
            font-weight: bold;
        }
        .stat-label {
            color: #888;
            margin-top: 5px;
        }
        .entries-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            overflow: hidden;
        }
        .entries-table th {
            background: rgba(138, 43, 226, 0.3);
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid rgba(138, 43, 226, 0.5);
        }
        .entries-table td {
            padding: 10px 8px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            font-size: 0.9rem;
        }
        .entries-table tr:hover {
            background: rgba(138, 43, 226, 0.1);
        }
        .action-btn {
            background: linear-gradient(135deg, #ff6b6b, #ff8e53);
            color: white;
            border: none;
            padding: 6px 12px;
            margin: 2px;
            border-radius: 4px;
            font-family: inherit;
            font-size: 0.8rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
        }
        .action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(0,255,255,0.3);
        }
        .edit-btn {
            background: linear-gradient(135deg, #4ecdc4, #44a08d);
        }
        .delete-btn {
            background: linear-gradient(135deg, #ff4444, #cc0000);
        }
        .add-btn {
            background: linear-gradient(135deg, #44ff44, #00cc00);
            padding: 12px 24px;
            font-size: 1rem;
            margin: 20px 0;
        }
        .back-btn {
            background: linear-gradient(135deg, #666, #444);
        }
        .game-section {
            margin: 30px 0;
            border: 1px solid rgba(0,255,255,0.3);
            border-radius: 8px;
            overflow: hidden;
        }
        .game-header {
            background: rgba(138, 43, 226, 0.2);
            padding: 15px 20px;
            font-weight: bold;
            font-size: 1.1rem;
        }
        .game-content {
            padding: 20px;
        }
        .success-msg {
            background: rgba(0,255,0,0.2);
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            text-align: center;
        }
        .search-box {
            background: #000;
            color: #00ffff;
            border: 2px solid #00ffff;
            padding: 10px;
            font-family: inherit;
            font-size: 1rem;
            width: 300px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .filter-section {
            margin: 20px 0;
            padding: 15px;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="db-container">
        <div class="db-header">
            🗄️ DATABASE MANAGEMENT SYSTEM
        </div>
        
        {% if request.args.get('updated') %}
        <div class="success-msg">✅ Entry updated successfully!</div>
        {% endif %}
        {% if request.args.get('deleted') %}
        <div class="success-msg">🗑️ Entry deleted successfully!</div>
        {% endif %}
        {% if request.args.get('created') %}
        <div class="success-msg">➕ Entry created successfully!</div>
        {% endif %}
        
        <div class="stats-grid">
            {% for game in games %}
            <div class="stat-card">
                <div class="stat-number">{{ game.entry_count }}</div>
                <div class="stat-label">{{ game.game_name }} Entries</div>
                <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">
                    {{ game.score_type }} | {{ game.ranking_method }}
                </div>
            </div>
            {% endfor %}
        </div>
        
        <div class="filter-section">
            <input type="text" class="search-box" id="searchEntries" placeholder="Search entries..." onkeyup="filterEntries()">
            <a href="/admin/summerlockin/database/add" class="action-btn add-btn">➕ Add Custom Entry</a>
        </div>
        
        <div class="game-section">
            <div class="game-header">📊 All Leaderboard Entries</div>
            <div class="game-content">
                <table class="entries-table" id="entriesTable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Game</th>
                            <th>Username</th>
                            <th>Score</th>
                            <th>Type</th>
                            <th>Method</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for entry in entries %}
                        <tr>
                            <td>{{ entry.id }}</td>
                            <td>{{ entry.game_name }}</td>
                            <td>{{ entry.username }}</td>
                            <td>{{ "%.3f"|format(entry.score) if entry.score % 1 != 0 else entry.score|int }}</td>
                            <td>{{ entry.score_type }}</td>
                            <td>{{ entry.ranking_method }}</td>
                            <td>{{ entry.date_submitted }}</td>
                            <td>
                                <a href="/admin/summerlockin/database/edit/{{ entry.id }}" class="action-btn edit-btn">✏️ Edit</a>
                                <form method="POST" action="/admin/summerlockin/database/delete/{{ entry.id }}" style="display: inline;" 
                                      onsubmit="return confirm('Are you sure you want to delete this entry?')">
                                    <button type="submit" class="action-btn delete-btn">🗑️ Delete</button>
                                </form>
                            </td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
        </div>
        
        <a href="/admin/summerlockin" class="action-btn back-btn">← Back to Admin Panel</a>
    </div>
    
    <script>
        function filterEntries() {
            const input = document.getElementById('searchEntries');
            const filter = input.value.toLowerCase();
            const table = document.getElementById('entriesTable');
            const rows = table.getElementsByTagName('tr');
            
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.getElementsByTagName('td');
                let shouldShow = false;
                
                for (let j = 0; j < cells.length - 1; j++) {
                    if (cells[j].textContent.toLowerCase().includes(filter)) {
                        shouldShow = true;
                        break;
                    }
                }
                
                row.style.display = shouldShow ? '' : 'none';
            }
        }
    </script>
</body>
</html>
'''

EDIT_ENTRY_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Edit Entry - CLAUDE_CODE_KING</title>
    <style>
        body { 
            background: #001122; 
            color: #00ffff; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px;
            min-height: 100vh;
        }
        .edit-container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(0,255,255,0.05);
            border: 1px solid #00ffff;
            border-radius: 10px;
            padding: 30px;
        }
        .edit-header {
            text-align: center;
            font-size: 1.8rem;
            margin-bottom: 30px;
            color: #4ecdc4;
            text-shadow: 0 0 20px #4ecdc4;
        }
        .form-group {
            margin: 20px 0;
        }
        .form-label {
            display: block;
            margin-bottom: 8px;
            color: #00ffff;
            font-weight: bold;
        }
        .form-input {
            width: 100%;
            padding: 12px;
            background: rgba(0,0,0,0.5);
            border: 2px solid #00ffff;
            border-radius: 6px;
            color: #00ffff;
            font-family: inherit;
            font-size: 1rem;
            box-sizing: border-box;
        }
        .form-input:focus {
            outline: none;
            border-color: #4ecdc4;
            box-shadow: 0 0 10px rgba(78,205,196,0.3);
        }
        .form-input:read-only {
            background: rgba(0,0,0,0.7);
            border-color: #666;
            color: #888;
        }
        .btn-group {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 30px;
        }
        .form-btn {
            background: linear-gradient(135deg, #4ecdc4, #44a08d);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-family: inherit;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .form-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(78,205,196,0.3);
        }
        .cancel-btn {
            background: linear-gradient(135deg, #666, #444);
        }
        .info-section {
            background: rgba(0,0,0,0.3);
            border: 1px solid #666;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            padding: 5px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            color: #888;
            font-weight: bold;
        }
        .info-value {
            color: #00ffff;
        }
    </style>
</head>
<body>
    <div class="edit-container">
        <div class="edit-header">
            ✏️ EDIT LEADERBOARD ENTRY
        </div>
        
        <div class="info-section">
            <h3>📋 Entry Information</h3>
            <div class="info-row">
                <span class="info-label">Entry ID:</span>
                <span class="info-value">{{ entry.id }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Game:</span>
                <span class="info-value">{{ entry.game_name }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Score Type:</span>
                <span class="info-value">{{ entry.score_type }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Ranking Method:</span>
                <span class="info-value">{{ entry.ranking_method }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">IP Address:</span>
                <span class="info-value">{{ entry.ip_address or 'N/A' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Original Timestamp:</span>
                <span class="info-value">{{ entry.timestamp or 'N/A' }}</span>
            </div>
        </div>
        
        <form method="POST" action="/admin/summerlockin/database/update/{{ entry.id }}">
            <div class="form-group">
                <label class="form-label" for="username">👤 Username:</label>
                <input type="text" class="form-input" id="username" name="username" value="{{ entry.username }}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="score">🎯 Score:</label>
                <input type="number" class="form-input" id="score" name="score" value="{{ entry.score }}" step="0.001" required>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="date_submitted">📅 Date Submitted:</label>
                <input type="text" class="form-input" id="date_submitted" name="date_submitted" value="{{ entry.date_submitted }}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">🔒 Game Configuration (Read-Only):</label>
                <input type="text" class="form-input" value="{{ entry.game_name }}" readonly>
            </div>
            
            <div class="btn-group">
                <button type="submit" class="form-btn">💾 Save Changes</button>
                <a href="/admin/summerlockin/database" class="form-btn cancel-btn">❌ Cancel</a>
            </div>
        </form>
    </div>
</body>
</html>
'''

ADD_ENTRY_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Add Custom Entry - CLAUDE_CODE_KING</title>
    <style>
        body { 
            background: #001122; 
            color: #00ffff; 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px;
            min-height: 100vh;
        }
        .add-container {
            max-width: 700px;
            margin: 0 auto;
            background: rgba(0,255,255,0.05);
            border: 1px solid #00ffff;
            border-radius: 10px;
            padding: 30px;
        }
        .add-header {
            text-align: center;
            font-size: 1.8rem;
            margin-bottom: 30px;
            color: #44ff44;
            text-shadow: 0 0 20px #44ff44;
        }
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .form-group {
            margin: 20px 0;
        }
        .form-label {
            display: block;
            margin-bottom: 8px;
            color: #00ffff;
            font-weight: bold;
        }
        .form-input, .form-select {
            width: 100%;
            padding: 12px;
            background: rgba(0,0,0,0.5);
            border: 2px solid #00ffff;
            border-radius: 6px;
            color: #00ffff;
            font-family: inherit;
            font-size: 1rem;
            box-sizing: border-box;
        }
        .form-input:focus, .form-select:focus {
            outline: none;
            border-color: #44ff44;
            box-shadow: 0 0 10px rgba(68,255,68,0.3);
        }
        .form-select option {
            background: #001122;
            color: #00ffff;
        }
        .btn-group {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 30px;
        }
        .form-btn {
            background: linear-gradient(135deg, #44ff44, #00cc00);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-family: inherit;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .form-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(68,255,68,0.3);
        }
        .cancel-btn {
            background: linear-gradient(135deg, #666, #444);
        }
        .help-section {
            background: rgba(68,255,68,0.1);
            border: 1px solid #44ff44;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .help-title {
            color: #44ff44;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .help-text {
            color: #888;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        .examples {
            background: rgba(0,0,0,0.3);
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        .example-item {
            margin: 8px 0;
            color: #00ffff;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="add-container">
        <div class="add-header">
            ➕ ADD CUSTOM LEADERBOARD ENTRY
        </div>
        
        <div class="help-section">
            <div class="help-title">💡 Custom Entry Help</div>
            <div class="help-text">
                Add custom scores for testing, fun, or administrative purposes. 
                Choose the appropriate game and ranking method for accurate leaderboard placement.
            </div>
            <div class="examples">
                <div class="help-title">📝 Examples:</div>
                <div class="example-item">• Time games: lower scores are better (0.150 seconds)</div>
                <div class="example-item">• Point games: higher scores are better (1500 points)</div>
                <div class="example-item">• Target games: closest to target wins (9.950 for 10.000 target)</div>
                <div class="example-item">• System will auto-suggest settings based on game name</div>
            </div>
        </div>
        
        <form method="POST" action="/admin/summerlockin/database/create">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="game_name">🎮 Game Name:</label>
                    <select class="form-select" id="game_name" name="game_name" required>
                        <option value="">Select a game...</option>
                        {% for game in available_games %}
                        <option value="{{ game.name }}">{{ game.icon }} {{ game.name }}</option>
                        {% endfor %}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="username">👤 Username:</label>
                    <input type="text" class="form-input" id="username" name="username" required 
                           placeholder="Enter username...">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="score">🎯 Score:</label>
                    <input type="number" class="form-input" id="score" name="score" step="0.001" required 
                           placeholder="Enter score value...">
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="score_type">📊 Score Type:</label>
                    <select class="form-select" id="score_type" name="score_type" required>
                        <option value="">Select type...</option>
                        <option value="points">Points</option>
                        <option value="seconds">Seconds</option>
                        <option value="milliseconds">Milliseconds</option>
                        <option value="percentage">Percentage</option>
                        <option value="distance">Distance</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="ranking_method">🏆 Ranking Method:</label>
                    <select class="form-select" id="ranking_method" name="ranking_method" required>
                        <option value="">Select method...</option>
                        <option value="higher_is_better">Higher is Better</option>
                        <option value="lower_is_better">Lower is Better</option>
                        <option value="closest_to_target">Closest to Target</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="date_submitted">📅 Date:</label>
                    <input type="text" class="form-input" id="date_submitted" name="date_submitted" required 
                           placeholder="YYYY-MM-DD HH:MM:SS">
                </div>
            </div>
            
            <div class="btn-group">
                <button type="submit" class="form-btn">🚀 Create Entry</button>
                <a href="/admin/summerlockin/database" class="form-btn cancel-btn">❌ Cancel</a>
            </div>
        </form>
    </div>
    
    <script>
        // Auto-fill current date/time
        document.addEventListener('DOMContentLoaded', function() {
            const now = new Date();
            const dateString = now.getFullYear() + '-' + 
                             String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                             String(now.getDate()).padStart(2, '0') + ' ' + 
                             String(now.getHours()).padStart(2, '0') + ':' + 
                             String(now.getMinutes()).padStart(2, '0') + ':' + 
                             String(now.getSeconds()).padStart(2, '0');
            
            document.getElementById('date_submitted').value = dateString;
        });
        
        // Auto-select appropriate ranking method based on game
        document.getElementById('game_name').addEventListener('change', function() {
            const game = this.value;
            const rankingSelect = document.getElementById('ranking_method');
            const scoreTypeSelect = document.getElementById('score_type');
            
            // Smart defaults based on game names
            if (game.toLowerCase().includes('dino') || game.toLowerCase().includes('runner')) {
                rankingSelect.value = 'higher_is_better';
                scoreTypeSelect.value = 'points';
            } else if (game.toLowerCase().includes('predict') && game.toLowerCase().includes('time')) {
                rankingSelect.value = 'closest_to_target';
                scoreTypeSelect.value = 'seconds';
            } else if (game.toLowerCase().includes('react') && game.toLowerCase().includes('time')) {
                rankingSelect.value = 'lower_is_better';
                scoreTypeSelect.value = 'milliseconds';
            } else if (game.toLowerCase().includes('time')) {
                // Generic time-based game
                rankingSelect.value = 'lower_is_better';
                scoreTypeSelect.value = 'seconds';
            } else {
                // Default for unknown games
                rankingSelect.value = 'higher_is_better';
                scoreTypeSelect.value = 'points';
            }
        });
    </script>
</body>
</html>
'''

# ========== END ULTRA SECRET ADMIN SYSTEM ==========

if __name__ == "__main__":
    app.run(debug=DEBUG_MODE, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
