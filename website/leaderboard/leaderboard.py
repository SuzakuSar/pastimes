# ===== ENHANCED FILE: website/leaderboard/leaderboard.py =====
from flask import Blueprint, request, session, jsonify, render_template, redirect, url_for, flash
import sqlite3
import os
from datetime import datetime
from contextlib import contextmanager

# Create the leaderboard blueprint
leaderboard = Blueprint('leaderboard', __name__, template_folder='templates')

# ===== RANKING METHODS (NEW) =====

class RankingMethod:
    """Define different ways to rank scores"""
    
    # Basic ranking (backward compatible)
    HIGHER_IS_BETTER = "higher_is_better"
    LOWER_IS_BETTER = "lower_is_better"
    
    # Absolute value ranking  
    CLOSEST_TO_ZERO = "closest_to_zero"
    FARTHEST_FROM_ZERO = "farthest_from_zero"
    
    # Target-based ranking
    CLOSEST_TO_TARGET = "closest_to_target"
    FARTHEST_FROM_TARGET = "farthest_from_target"
    
    # Percentage-based
    HIGHEST_PERCENTAGE = "highest_percentage"
    LOWEST_PERCENTAGE = "lowest_percentage"
    
    # Constraint-based
    POSITIVE_ONLY_LOWER = "positive_only_lower"
    POSITIVE_ONLY_HIGHER = "positive_only_higher"

# ===== DATABASE SETUP (ENHANCED) =====

def get_db_path():
    """Get database path based on environment"""
    if os.environ.get('RENDER'):
        data_dir = '/opt/render/project/data'
        os.makedirs(data_dir, exist_ok=True)
        return os.path.join(data_dir, 'leaderboards.db')
    else:
        return 'leaderboards.db'

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = None
    try:
        conn = sqlite3.connect(get_db_path(), timeout=30.0)
        conn.row_factory = sqlite3.Row
        yield conn
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Database error: {e}")
        raise
    finally:
        if conn:
            conn.close()

def init_database():
    """Initialize database tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Enhanced leaderboard entries table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS leaderboard_entries (
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
            )
        ''')
        
        # Enhanced game configurations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS game_configs (
                game_name TEXT PRIMARY KEY,
                score_type TEXT NOT NULL DEFAULT 'points',
                ranking_method TEXT NOT NULL DEFAULT 'higher_is_better',
                target_value REAL,
                higher_is_better BOOLEAN NOT NULL DEFAULT 1,
                max_entries_per_user INTEGER DEFAULT 10,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Add new columns to existing tables if they don't exist
        try:
            cursor.execute('ALTER TABLE leaderboard_entries ADD COLUMN ranking_score REAL DEFAULT 0')
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            cursor.execute('ALTER TABLE leaderboard_entries ADD COLUMN original_score REAL DEFAULT 0')
        except sqlite3.OperationalError:
            pass
        
        try:
            cursor.execute('ALTER TABLE leaderboard_entries ADD COLUMN ranking_method TEXT DEFAULT "higher_is_better"')
        except sqlite3.OperationalError:
            pass
        
        try:
            cursor.execute('ALTER TABLE leaderboard_entries ADD COLUMN target_value REAL')
        except sqlite3.OperationalError:
            pass
        
        try:
            cursor.execute('ALTER TABLE game_configs ADD COLUMN ranking_method TEXT DEFAULT "higher_is_better"')
        except sqlite3.OperationalError:
            pass
        
        try:
            cursor.execute('ALTER TABLE game_configs ADD COLUMN target_value REAL')
        except sqlite3.OperationalError:
            pass
        
        # Update existing entries with missing data
        cursor.execute('''
            UPDATE leaderboard_entries 
            SET ranking_score = score, original_score = score 
            WHERE ranking_score IS NULL OR ranking_score = 0
        ''')
        
        # Indexes for performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_leaderboard_game_ranking_score 
            ON leaderboard_entries(game_name, ranking_score)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_leaderboard_game_timestamp 
            ON leaderboard_entries(game_name, timestamp DESC)
        ''')
        
        # User interactions tables for likes and favorites
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_likes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_identifier TEXT NOT NULL,
                game_name TEXT NOT NULL,
                liked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                UNIQUE(user_identifier, game_name)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_identifier TEXT NOT NULL,
                game_name TEXT NOT NULL,
                favorited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                UNIQUE(user_identifier, game_name)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS game_stats (
                game_name TEXT PRIMARY KEY,
                total_likes INTEGER DEFAULT 0,
                total_favorites INTEGER DEFAULT 0,
                total_plays INTEGER DEFAULT 0,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Indexes for user interactions
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_user_likes_identifier 
            ON user_likes(user_identifier)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_user_likes_game 
            ON user_likes(game_name)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_user_favorites_identifier 
            ON user_favorites(user_identifier)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_user_favorites_game 
            ON user_favorites(game_name)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_leaderboard_username 
            ON leaderboard_entries(username)
        ''')
        
        conn.commit()
        print("Database initialized successfully")

# Initialize database on import
try:
    init_database()
except Exception as e:
    print(f"WARNING: Database initialization failed: {e}")

# ===== RANKING CALCULATION FUNCTIONS (NEW) =====

def calculate_ranking_score(original_score, ranking_method, target_value=None):
    """Calculate the score used for ranking"""
    
    if ranking_method == RankingMethod.HIGHER_IS_BETTER:
        return original_score
    
    elif ranking_method == RankingMethod.LOWER_IS_BETTER:
        return original_score
    
    elif ranking_method == RankingMethod.CLOSEST_TO_ZERO:
        return abs(original_score)
    
    elif ranking_method == RankingMethod.FARTHEST_FROM_ZERO:
        return abs(original_score)
    
    elif ranking_method == RankingMethod.CLOSEST_TO_TARGET:
        if target_value is None:
            raise ValueError("Target value required for closest_to_target ranking")
        return abs(original_score - target_value)
    
    elif ranking_method == RankingMethod.FARTHEST_FROM_TARGET:
        if target_value is None:
            raise ValueError("Target value required for farthest_from_target ranking")
        return abs(original_score - target_value)
    
    elif ranking_method in [RankingMethod.HIGHEST_PERCENTAGE, RankingMethod.LOWEST_PERCENTAGE]:
        return original_score
    
    elif ranking_method in [RankingMethod.POSITIVE_ONLY_LOWER, RankingMethod.POSITIVE_ONLY_HIGHER]:
        return original_score
    
    else:
        return original_score  # Default fallback

def is_higher_better_for_ranking(ranking_method):
    """Determine if higher ranking scores are better for this method"""
    
    higher_is_better_methods = [
        RankingMethod.HIGHER_IS_BETTER,
        RankingMethod.FARTHEST_FROM_ZERO,
        RankingMethod.FARTHEST_FROM_TARGET,
        RankingMethod.HIGHEST_PERCENTAGE,
        RankingMethod.POSITIVE_ONLY_HIGHER
    ]
    
    return ranking_method in higher_is_better_methods

# ===== ENHANCED CORE FUNCTIONS =====

def add_score(game_name, username, score, score_type="points", ranking_method=RankingMethod.HIGHER_IS_BETTER, target_value=None, ip_address=None):
    """
    Enhanced add_score function with advanced ranking methods
    
    Args:
        game_name: Name of the game
        username: Player username  
        score: Original score from the game
        score_type: Display name for score type
        ranking_method: How to rank scores (see RankingMethod class)
        target_value: Target value for target-based ranking
        ip_address: Player IP address
        
    Returns:
        dict: Result with success status and rank info
    """
    try:
        # Calculate ranking score
        ranking_score = calculate_ranking_score(score, ranking_method, target_value)
        higher_is_better = is_higher_better_for_ranking(ranking_method)
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Insert or update game configuration
            cursor.execute('''
                INSERT OR REPLACE INTO game_configs 
                (game_name, score_type, ranking_method, target_value, higher_is_better, updated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (game_name, score_type, ranking_method, target_value, higher_is_better))
            
            # Insert the new score
            cursor.execute('''
                INSERT INTO leaderboard_entries 
                (game_name, username, score, ranking_score, original_score, score_type, 
                 ranking_method, target_value, higher_is_better, ip_address, session_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (game_name, username.strip()[:20], score, ranking_score, score, score_type, 
                  ranking_method, target_value, higher_is_better, ip_address, session.get('session_id', 'unknown')))
            
            entry_id = cursor.lastrowid
            
            # Calculate rank based on ranking_score
            if higher_is_better:
                cursor.execute('''
                    SELECT COUNT(*) + 1 as rank
                    FROM leaderboard_entries 
                    WHERE game_name = ? AND ranking_score > ?
                ''', (game_name, ranking_score))
            else:
                cursor.execute('''
                    SELECT COUNT(*) + 1 as rank
                    FROM leaderboard_entries 
                    WHERE game_name = ? AND ranking_score < ?
                ''', (game_name, ranking_score))
            
            rank = cursor.fetchone()['rank']
            
            # Get total entries
            cursor.execute('''
                SELECT COUNT(*) as total
                FROM leaderboard_entries 
                WHERE game_name = ?
            ''', (game_name,))
            
            total_entries = cursor.fetchone()['total']
            
            # Check if it's a new record
            if higher_is_better:
                cursor.execute('''
                    SELECT MAX(ranking_score) as best_score
                    FROM leaderboard_entries 
                    WHERE game_name = ? AND id != ?
                ''', (game_name, entry_id))
            else:
                cursor.execute('''
                    SELECT MIN(ranking_score) as best_score
                    FROM leaderboard_entries 
                    WHERE game_name = ? AND id != ?
                ''', (game_name, entry_id))
            
            result = cursor.fetchone()
            previous_best = result[0] if result[0] is not None else (0 if higher_is_better else float('inf'))
            
            is_new_record = False
            if higher_is_better:
                is_new_record = ranking_score > previous_best
            else:
                is_new_record = ranking_score < previous_best
            
            conn.commit()
            
            return {
                'success': True,
                'rank': rank,
                'total_entries': total_entries,
                'is_top_10': rank <= 10,
                'is_new_record': is_new_record,
                'entry_id': entry_id,
                'original_score': score,
                'ranking_score': ranking_score
            }
            
    except Exception as e:
        print(f"Error adding score: {e}")
        return {
            'success': False,
            'error': str(e),
            'rank': None,
            'total_entries': 0,
            'is_top_10': False,
            'is_new_record': False
        }

def save_score_to_session(game_name, score, score_type="points", ranking_method=RankingMethod.HIGHER_IS_BETTER, target_value=None):
    """Enhanced save score to session with ranking method"""
    session['pending_score'] = {
        'game_name': game_name,
        'score': score,
        'score_type': score_type,
        'ranking_method': ranking_method,
        'target_value': target_value,
        'higher_is_better': is_higher_better_for_ranking(ranking_method),
        'timestamp': datetime.now().isoformat()
    }
    return True

# ===== USER INTERACTION FUNCTIONS (LIKES AND FAVORITES) =====

def get_user_identifier(request):
    """Get a unique identifier for the user (session-based with IP fallback)"""
    if 'user_id' not in session:
        import uuid
        session['user_id'] = str(uuid.uuid4())
        session.permanent = True
    return session['user_id']

def toggle_like(game_name, user_identifier=None, ip_address=None):
    """Toggle like status for a game by a user"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if already liked
            cursor.execute('''
                SELECT id FROM user_likes 
                WHERE user_identifier = ? AND game_name = ?
            ''', (user_identifier, game_name))
            
            existing_like = cursor.fetchone()
            
            if existing_like:
                # Remove like
                cursor.execute('''
                    DELETE FROM user_likes 
                    WHERE user_identifier = ? AND game_name = ?
                ''', (user_identifier, game_name))
                action = 'unliked'
                is_liked = False
            else:
                # Add like
                cursor.execute('''
                    INSERT INTO user_likes (user_identifier, game_name, ip_address)
                    VALUES (?, ?, ?)
                ''', (user_identifier, game_name, ip_address))
                action = 'liked'
                is_liked = True
            
            # Update game stats
            update_game_stats(game_name, cursor)
            
            # Get updated like count
            cursor.execute('''
                SELECT COUNT(*) FROM user_likes WHERE game_name = ?
            ''', (game_name,))
            like_count = cursor.fetchone()[0]
            
            # Get user's like count
            cursor.execute('''
                SELECT COUNT(*) FROM user_likes WHERE user_identifier = ?
            ''', (user_identifier,))
            user_like_count = cursor.fetchone()[0]
            
            conn.commit()
            
            return {
                'success': True,
                'action': action,
                'is_liked': is_liked,
                'like_count': like_count,
                'user_like_count': user_like_count
            }
            
    except Exception as e:
        print(f"Error toggling like: {e}")
        return {'success': False, 'error': str(e)}

def toggle_favorite(game_name, user_identifier=None, ip_address=None):
    """Toggle favorite status for a game by a user"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if already favorited
            cursor.execute('''
                SELECT id FROM user_favorites 
                WHERE user_identifier = ? AND game_name = ?
            ''', (user_identifier, game_name))
            
            existing_favorite = cursor.fetchone()
            
            if existing_favorite:
                # Remove favorite
                cursor.execute('''
                    DELETE FROM user_favorites 
                    WHERE user_identifier = ? AND game_name = ?
                ''', (user_identifier, game_name))
                action = 'unfavorited'
                is_favorited = False
            else:
                # Add favorite
                cursor.execute('''
                    INSERT INTO user_favorites (user_identifier, game_name, ip_address)
                    VALUES (?, ?, ?)
                ''', (user_identifier, game_name, ip_address))
                action = 'favorited'
                is_favorited = True
            
            # Update game stats
            update_game_stats(game_name, cursor)
            
            # Get updated favorite count
            cursor.execute('''
                SELECT COUNT(*) FROM user_favorites WHERE game_name = ?
            ''', (game_name,))
            favorite_count = cursor.fetchone()[0]
            
            # Get user's favorite count
            cursor.execute('''
                SELECT COUNT(*) FROM user_favorites WHERE user_identifier = ?
            ''', (user_identifier,))
            user_favorite_count = cursor.fetchone()[0]
            
            conn.commit()
            
            return {
                'success': True,
                'action': action,
                'is_favorited': is_favorited,
                'favorite_count': favorite_count,
                'user_favorite_count': user_favorite_count
            }
            
    except Exception as e:
        print(f"Error toggling favorite: {e}")
        return {'success': False, 'error': str(e)}

def get_user_likes(user_identifier):
    """Get list of games liked by a user"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT game_name, liked_at FROM user_likes 
                WHERE user_identifier = ?
                ORDER BY liked_at DESC
            ''', (user_identifier,))
            return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        print(f"Error getting user likes: {e}")
        return []

def get_user_favorites(user_identifier):
    """Get list of games favorited by a user"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT game_name, favorited_at FROM user_favorites 
                WHERE user_identifier = ?
                ORDER BY favorited_at DESC
            ''', (user_identifier,))
            return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        print(f"Error getting user favorites: {e}")
        return []

def get_game_stats(game_name):
    """Get like/favorite counts for a game"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get likes count
            cursor.execute('SELECT COUNT(*) FROM user_likes WHERE game_name = ?', (game_name,))
            likes = cursor.fetchone()[0]
            
            # Get favorites count  
            cursor.execute('SELECT COUNT(*) FROM user_favorites WHERE game_name = ?', (game_name,))
            favorites = cursor.fetchone()[0]
            
            return {
                'likes': likes,
                'favorites': favorites
            }
    except Exception as e:
        print(f"Error getting game stats: {e}")
        return {'likes': 0, 'favorites': 0}

def update_game_stats(game_name, cursor=None):
    """Update the game_stats table with current counts"""
    if cursor is None:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            _update_game_stats_internal(game_name, cursor)
            conn.commit()
    else:
        _update_game_stats_internal(game_name, cursor)

def _update_game_stats_internal(game_name, cursor):
    """Internal function to update game stats"""
    cursor.execute('SELECT COUNT(*) FROM user_likes WHERE game_name = ?', (game_name,))
    likes = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM user_favorites WHERE game_name = ?', (game_name,))
    favorites = cursor.fetchone()[0]
    
    cursor.execute('''
        INSERT OR REPLACE INTO game_stats 
        (game_name, total_likes, total_favorites, last_updated)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ''', (game_name, likes, favorites))

def get_leaderboard(game_name, limit=50, offset=0):
    """Enhanced get leaderboard function"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get game configuration
            cursor.execute('''
                SELECT score_type, ranking_method, target_value, higher_is_better 
                FROM game_configs 
                WHERE game_name = ?
            ''', (game_name,))
            
            config = cursor.fetchone()
            if not config:
                return {
                    'game_name': game_name,
                    'scores': [],
                    'score_type': 'points',
                    'ranking_method': RankingMethod.HIGHER_IS_BETTER,
                    'target_value': None,
                    'higher_is_better': True,
                    'total_entries': 0
                }
            
            score_type = config['score_type']
            ranking_method = config['ranking_method']
            target_value = config['target_value']
            higher_is_better = bool(config['higher_is_better'])
            
            # Get total entries
            cursor.execute('''
                SELECT COUNT(*) as total
                FROM leaderboard_entries 
                WHERE game_name = ?
            ''', (game_name,))
            
            total_entries = cursor.fetchone()['total']
            
            # Get leaderboard entries ordered by ranking_score
            order_clause = "ORDER BY ranking_score DESC" if higher_is_better else "ORDER BY ranking_score ASC"
            
            cursor.execute(f'''
                SELECT username, original_score, ranking_score, timestamp, date_submitted,
                       ROW_NUMBER() OVER ({order_clause}) as rank
                FROM leaderboard_entries 
                WHERE game_name = ?
                {order_clause}
                LIMIT ? OFFSET ?
            ''', (game_name, limit, offset))
            
            scores = []
            for row in cursor.fetchall():
                scores.append({
                    'rank': row['rank'],
                    'username': row['username'],
                    'score': row['original_score'],  # Display original score
                    'ranking_score': row['ranking_score'],  # For internal use
                    'timestamp': row['timestamp'],
                    'date': row['date_submitted']
                })
            
            return {
                'game_name': game_name,
                'scores': scores,
                'score_type': score_type,
                'ranking_method': ranking_method,
                'target_value': target_value,
                'higher_is_better': higher_is_better,
                'total_entries': total_entries
            }
            
    except Exception as e:
        print(f"Error getting leaderboard: {e}")
        return {
            'game_name': game_name,
            'scores': [],
            'score_type': 'points',
            'ranking_method': RankingMethod.HIGHER_IS_BETTER,
            'target_value': None,
            'higher_is_better': True,
            'total_entries': 0
        }

# ===== SIMPLE SUBMISSION FUNCTIONS (NEW) =====

def submit_game_score(game_name, score, score_type="points", ranking_method=RankingMethod.HIGHER_IS_BETTER, target_value=None):
    """
    Simple function for games to submit scores with advanced ranking
    
    Args:
        game_name (str): Name of the game
        score (float): The score calculated by the game
        score_type (str): What to call this score type
        ranking_method (str): How to rank scores (see RankingMethod class)
        target_value (float): Target value for target-based ranking
    
    Returns:
        dict: Success status and redirect URL
    """
    
    try:
        # Validate inputs
        if ranking_method in [RankingMethod.CLOSEST_TO_TARGET, RankingMethod.FARTHEST_FROM_TARGET]:
            if target_value is None:
                return {
                    'success': False,
                    'error': 'Target value required for target-based ranking',
                    'redirect_url': url_for('home.index')
                }
        
        if ranking_method in [RankingMethod.POSITIVE_ONLY_LOWER, RankingMethod.POSITIVE_ONLY_HIGHER]:
            if score <= 0:
                return {
                    'success': False,
                    'error': 'Score must be positive',
                    'redirect_url': url_for('home.index')
                }
        
        if ranking_method in [RankingMethod.HIGHEST_PERCENTAGE, RankingMethod.LOWEST_PERCENTAGE]:
            if not (0 <= score <= 100):
                return {
                    'success': False,
                    'error': 'Percentage must be between 0 and 100',
                    'redirect_url': url_for('home.index')
                }
        
        # Save score to session for username input
        save_score_to_session(game_name, score, score_type, ranking_method, target_value)
        
        return {
            'success': True,
            'redirect_url': url_for('leaderboard.submit_score_form')
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'redirect_url': url_for('home.index')
        }

# ===== CONVENIENCE FUNCTIONS (NEW) =====

def submit_score_higher_better(game_name, score, score_type="points"):
    """Higher scores are better (traditional scoring)"""
    return submit_game_score(game_name, score, score_type, RankingMethod.HIGHER_IS_BETTER)

def submit_score_lower_better(game_name, score, score_type="time"):
    """Lower scores are better (time-based, attempts, etc.)"""
    return submit_game_score(game_name, score, score_type, RankingMethod.LOWER_IS_BETTER)

def submit_score_closest_to_zero(game_name, score, score_type="deviation"):
    """Closest to zero wins (accuracy games)"""
    return submit_game_score(game_name, score, score_type, RankingMethod.CLOSEST_TO_ZERO)

def submit_score_closest_to_target(game_name, score, target, score_type="guess"):
    """Closest to target value wins (prediction games)"""
    return submit_game_score(game_name, score, score_type, RankingMethod.CLOSEST_TO_TARGET, target)

def submit_percentage_higher(game_name, score, score_type="accuracy"):
    """Percentage score, higher is better"""
    return submit_game_score(game_name, score, score_type, RankingMethod.HIGHEST_PERCENTAGE)

def submit_percentage_lower(game_name, score, score_type="error_rate"):
    """Percentage score, lower is better"""
    return submit_game_score(game_name, score, score_type, RankingMethod.LOWEST_PERCENTAGE)

def submit_positive_only_lower(game_name, score, score_type="attempts"):
    """Positive numbers only, lower is better"""
    return submit_game_score(game_name, score, score_type, RankingMethod.POSITIVE_ONLY_LOWER)

# ===== EXISTING ROUTES (ENHANCED) =====

@leaderboard.route('/')
def index():
    """Show all games with leaderboards"""
    games = get_all_games_with_leaderboards()
    return render_template('leaderboard_index.html', games=games)

@leaderboard.route('/game/<game_name>')
def view_game_leaderboard(game_name):
    """View leaderboard for specific game"""
    page = request.args.get('page', 1, type=int)
    per_page = 50
    offset = (page - 1) * per_page
    
    leaderboard_data = get_leaderboard(game_name, limit=per_page, offset=offset)
    
    # Calculate pagination
    total_pages = (leaderboard_data['total_entries'] + per_page - 1) // per_page
    
    return render_template('leaderboard_game.html', 
                         leaderboard=leaderboard_data,
                         current_page=page,
                         total_pages=total_pages)

@leaderboard.route('/submit')
def submit_score_form():
    """Show form to submit username for pending score"""
    pending_score = get_score_from_session()
    
    if not pending_score:
        flash('No pending score found. Play a game first!', 'error')
        return redirect(url_for('home.index'))
    
    return render_template('submit_score.html', pending_score=pending_score)

@leaderboard.route('/submit', methods=['POST'])
def submit_score():
    """Process score submission"""
    pending_score = get_score_from_session()
    
    if not pending_score:
        return jsonify({'error': 'No pending score found'}), 400
    
    username = request.form.get('username', '').strip()
    
    if not username:
        flash('Username is required!', 'error')
        return redirect(url_for('leaderboard.submit_score_form'))
    
    if len(username) > 20:
        flash('Username must be 20 characters or less!', 'error')
        return redirect(url_for('leaderboard.submit_score_form'))
    
    # Add the score to leaderboard using enhanced function
    result = add_score(
        game_name=pending_score['game_name'],
        username=username,
        score=pending_score['score'],
        score_type=pending_score['score_type'],
        ranking_method=pending_score.get('ranking_method', RankingMethod.HIGHER_IS_BETTER),
        target_value=pending_score.get('target_value'),
        ip_address=request.remote_addr
    )
    
    # Clear the pending score
    clear_score_from_session()
    
    if result['success']:
        # Show success message with rank
        if result['is_new_record']:
            flash(f'🏆 NEW RECORD! You\'re #1 with {pending_score["score"]} {pending_score["score_type"]}!', 'success')
        elif result['is_top_10']:
            flash(f'🎉 Top 10! You ranked #{result["rank"]} with {pending_score["score"]} {pending_score["score_type"]}!', 'success')
        else:
            flash(f'Score submitted! You ranked #{result["rank"]} with {pending_score["score"]} {pending_score["score_type"]}.', 'info')
        
        return redirect(url_for('leaderboard.view_game_leaderboard', game_name=pending_score['game_name']))
    else:
        flash(f'Error saving score: {result.get("error", "Unknown error")}', 'error')
        return redirect(url_for('leaderboard.submit_score_form'))

# ===== HELPER FUNCTIONS (EXISTING) =====

def get_score_from_session():
    """Get pending score from session"""
    return session.get('pending_score')

def clear_score_from_session():
    """Clear pending score from session"""
    if 'pending_score' in session:
        del session['pending_score']

def get_all_games_with_leaderboards():
    """Get all games that have leaderboard entries"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # First get games with submission counts
            cursor.execute('''
                SELECT 
                    gc.game_name,
                    gc.score_type,
                    gc.ranking_method,
                    gc.higher_is_better,
                    COUNT(le.id) as total_submissions
                FROM game_configs gc
                LEFT JOIN leaderboard_entries le ON gc.game_name = le.game_name
                GROUP BY gc.game_name, gc.score_type, gc.ranking_method, gc.higher_is_better
                HAVING total_submissions > 0
                ORDER BY total_submissions DESC
            ''')
            
            games = []
            for row in cursor.fetchall():
                game_name = row['game_name']
                
                # Get the top score for this game
                if row['higher_is_better']:
                    cursor.execute('''
                        SELECT username, original_score 
                        FROM leaderboard_entries 
                        WHERE game_name = ? 
                        ORDER BY ranking_score DESC 
                        LIMIT 1
                    ''', (game_name,))
                else:
                    cursor.execute('''
                        SELECT username, original_score 
                        FROM leaderboard_entries 
                        WHERE game_name = ? 
                        ORDER BY ranking_score ASC 
                        LIMIT 1
                    ''', (game_name,))
                
                top_score_row = cursor.fetchone()
                
                games.append({
                    'name': game_name,
                    'score_type': row['score_type'],
                    'ranking_method': row['ranking_method'],
                    'total_submissions': row['total_submissions'],
                    'top_score': {
                        'username': top_score_row['username'],
                        'score': top_score_row['original_score']
                    } if top_score_row else None
                })
            
            return games
            
    except Exception as e:
        print(f"Error getting games list: {e}")
        return []

# ===== TEMPLATE FILTERS (ENHANCED) =====

def format_score_display(score, score_type, ranking_method=None, target_value=None):
    """Enhanced format score for display"""
    if score_type == "time":
        if score < 60:
            return f"{score:.1f}s"
        else:
            minutes = int(score // 60)
            seconds = score % 60
            return f"{minutes:02d}:{seconds:04.1f}"
    elif score_type == "attempts":
        return f"{score} attempts"
    elif score_type == "level":
        return f"Level {score}"
    elif score_type == "clicks":
        return f"{score:,} clicks"
    elif "%" in score_type:
        return f"{score:.1f}%"
    elif ranking_method == RankingMethod.CLOSEST_TO_TARGET and target_value is not None:
        return f"{score} (target: {target_value})"
    else:
        return f"{score:,}"

@leaderboard.app_template_filter('format_score')
def format_score_filter(score, score_type, ranking_method=None, target_value=None):
    return format_score_display(score, score_type, ranking_method, target_value)

# ===== API ENDPOINTS (EXISTING) =====

@leaderboard.route('/api/leaderboard/<game_name>')
def api_leaderboard(game_name):
    """API endpoint for leaderboard data"""
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    leaderboard_data = get_leaderboard(game_name, limit, offset)
    return jsonify(leaderboard_data)

@leaderboard.route('/api/submit', methods=['POST'])
def api_submit_score():
    """API endpoint for submitting scores"""
    data = request.get_json()
    
    required_fields = ['game_name', 'username', 'score']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    result = add_score(
        game_name=data['game_name'],
        username=data['username'],
        score=data['score'],
        score_type=data.get('score_type', 'points'),
        ranking_method=data.get('ranking_method', RankingMethod.HIGHER_IS_BETTER),
        target_value=data.get('target_value'),
        ip_address=request.remote_addr
    )
    
    return jsonify(result)

@leaderboard.route('/widget/<game_name>')
def leaderboard_widget(game_name):
    """Small leaderboard widget for embedding in games"""
    limit = request.args.get('limit', 5, type=int)
    leaderboard_data = get_leaderboard(game_name, limit)
    return render_template('leaderboard_widget.html', leaderboard=leaderboard_data)