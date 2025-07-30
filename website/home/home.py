"""
Official Homepage Blueprint for SUMMERLOCKIN Project
Features a scrollable game collection with viral engagement features
Designed for easy maintenance and game additions with user progress tracking
Updated for direct navigation (no popups)
"""

from flask import Blueprint, render_template, jsonify, request, session
import json
from collections import defaultdict
import datetime

# Create blueprint with template folder
home = Blueprint('home', __name__, template_folder='templates')

# ===== GAMES CONFIGURATION =====
# Only active games that exist in the current deployment
GAMES_DATA = [
    # Active Games
    {
        'name': 'Time Predict Challenge',
        'description': 'Test your internal clock - hit exactly 10.000 seconds!',
        'endpoint': 'time_predict.index',
        'icon': '🕒',
        'category': 'skill',
        'tags': ['time', 'timing', 'predict', 'precision', '10 seconds', 'challenge'],
        'difficulty': 4
    },
    {
        'name': 'Cosmic Dino Runner',
        'description': 'Chrome dinosaur game in space - jump over obstacles!',
        'endpoint': 'dino_runner.index',
        'icon': '🦕',
        'category': 'arcade',
        'tags': ['dino', 'runner', 'jumping', 'endless', 'chrome', 'obstacles', 'classic'],
        'difficulty': 3
    },
]

# ===== HELPER FUNCTIONS =====

def get_categories():
    """Get all unique categories from games data"""
    categories = set()
    for game in GAMES_DATA:
        categories.add(game['category'])
    return sorted(list(categories))

def get_category_counts():
    """Get count of games per category"""
    counts = defaultdict(int)
    for game in GAMES_DATA:
        counts[game['category']] += 1
    return dict(counts)

def get_games_by_category(category=None):
    """Get games filtered by category"""
    if not category:
        # Return clean copy of games data for direct navigation
        return [dict(game) for game in GAMES_DATA]
    return [dict(game) for game in GAMES_DATA if game['category'] == category]

def search_games(query):
    """Search games by name, description, or tags"""
    if not query:
        return [dict(game) for game in GAMES_DATA]
    
    query = query.lower()
    results = []
    
    for game in GAMES_DATA:
        # Search in name
        if query in game['name'].lower():
            results.append(dict(game))
            continue
            
        # Search in description
        if query in game['description'].lower():
            results.append(dict(game))
            continue
            
        # Search in tags
        if any(query in tag.lower() for tag in game['tags']):
            results.append(dict(game))
            continue
    
    return results

def get_mock_user_stats():
    """Generate mock user statistics for demonstration"""
    # In production, this would come from a database or session
    return {
        'games_played': 12,
        'achievements': 5,
        'play_time': '2h 34m',
        'streak': 3,
        'last_login': None,
        'favorite_category': 'arcade'
    }

def get_random_game():
    """Get a random game from the collection"""
    import random
    return dict(random.choice(GAMES_DATA))

def get_daily_game():
    """Get the daily featured game based on current date"""
    import datetime
    
    # Use date to consistently pick the same game for the day
    today = datetime.date.today()
    day_of_year = today.timetuple().tm_yday
    
    # Cycle through games based on day of year
    game_index = day_of_year % len(GAMES_DATA)
    return dict(GAMES_DATA[game_index])

# ===== ROUTES =====

@home.route('/')
def index():
    """
    Main test homepage route - displays enhanced viral game collection
    with direct navigation to games
    """
    categories = get_categories()
    category_counts = get_category_counts()
    
    # Get optional parameters from URL
    selected_category = request.args.get('category', '')
    search_query = request.args.get('search', '')
    
    # Filter games based on parameters
    if search_query:
        games = search_games(search_query)
    else:
        games = get_games_by_category(selected_category if selected_category else None)
    
    # Get user statistics (mock data for now)
    user_stats = get_mock_user_stats()
    
    # Add current daily game info
    daily_game = get_daily_game()
    
    return render_template('home.html',
                         games=games,
                         categories=categories,
                         category_counts=category_counts,
                         selected_category=selected_category,
                         search_query=search_query,
                         total_games=len(GAMES_DATA),
                         user_stats=user_stats,
                         daily_game=daily_game)

@home.route('/api/search')
def api_search():
    """
    API endpoint for live search functionality
    """
    query = request.args.get('q', '')
    category = request.args.get('category', '')
    
    # Apply filters
    if query:
        games = search_games(query)
    else:
        games = get_games_by_category(category if category else None)
    
    return jsonify({
        'success': True,
        'games': games,
        'count': len(games),
        'query': query,
        'category': category
    })

@home.route('/api/categories')
def api_categories():
    """
    API endpoint to get all categories with counts
    """
    return jsonify({
        'success': True,
        'categories': get_categories(),
        'category_counts': get_category_counts()
    })

@home.route('/api/user/stats')
def api_user_stats():
    """
    API endpoint to get user statistics
    """
    return jsonify({
        'success': True,
        'stats': get_mock_user_stats()
    })

@home.route('/api/random-game')
def api_random_game():
    """
    API endpoint to get a random game
    """
    random_game = get_random_game()
    return jsonify({
        'success': True,
        'game': random_game
    })

@home.route('/api/daily-game')
def api_daily_game():
    """
    API endpoint to get the daily featured game
    """
    daily_game = get_daily_game()
    return jsonify({
        'success': True,
        'game': daily_game,
        'date': str(datetime.date.today())
    })

@home.route('/stats')
def stats():
    """
    Show statistics about the game collection
    """
    categories = get_categories()
    category_counts = get_category_counts()
    
    stats_data = {
        'total_games': len(GAMES_DATA),
        'total_categories': len(categories),
        'category_breakdown': category_counts,
        'difficulty_breakdown': {},
        'average_difficulty': 0
    }
    
    # Calculate difficulty breakdown
    difficulty_counts = defaultdict(int)
    total_difficulty = 0
    
    for game in GAMES_DATA:
        difficulty = game.get('difficulty', 3)
        difficulty_counts[difficulty] += 1
        total_difficulty += difficulty
    
    stats_data['difficulty_breakdown'] = dict(difficulty_counts)
    stats_data['average_difficulty'] = round(total_difficulty / len(GAMES_DATA), 1)
    
    return jsonify({
        'success': True,
        'stats': stats_data
    })

# ===== UTILITY FUNCTIONS FOR EASY MAINTENANCE =====

def add_game(name, description, endpoint, icon, category, tags, difficulty=3):
    """
    Helper function to easily add new games
    (For future use - games should be added to GAMES_DATA list above)
    """
    new_game = {
        'name': name,
        'description': description,
        'endpoint': endpoint,
        'icon': icon,
        'category': category,
        'tags': tags if isinstance(tags, list) else [tags],
        'difficulty': difficulty
    }
    return new_game

def validate_game_data():
    """
    Validate that all games have required fields
    """
    required_fields = ['name', 'description', 'endpoint', 'icon', 'category', 'tags']
    
    for i, game in enumerate(GAMES_DATA):
        for field in required_fields:
            if field not in game:
                print(f"Warning: Game {i} missing field '{field}': {game.get('name', 'Unknown')}")
        
        # Validate tags is a list
        if not isinstance(game.get('tags', []), list):
            print(f"Warning: Game '{game.get('name', 'Unknown')}' tags should be a list")
        
        # Set default difficulty if missing
        if 'difficulty' not in game:
            game['difficulty'] = 3

# Run validation when module loads
validate_game_data()
