"""
Test Home Blueprint - YouTube-inspired Gaming Hub Layout
Implementation of Phase 1: Layout & Visual Foundation from 01-layout-visuals.md

Features:
- Persistent sidebar navigation with hierarchical structure
- Header with centered search and user controls  
- Main content area with hero section and responsive grid
- Dark space theme with modern CSS architecture
- Mobile-first responsive design
"""

from flask import Blueprint, render_template, jsonify, request, session, make_response
import datetime
import json
from collections import defaultdict

class CategoryRow:
    """Blueprint class for category rows in the gaming hub"""
    def __init__(self, category_name, category_filter, display_options=None):
        self.category_name = category_name
        self.category_filter = category_filter  # Function or string to filter games
        self.display_options = display_options or {
            'show_count': True,
            'layout': 'horizontal',  # 'horizontal' or 'grid'
            'max_items': None,
            'card_size': 'standard'  # 'standard', 'large', 'compact'
        }
    
    def filter_games(self, games_list):
        """Apply the category filter to get relevant games"""
        if callable(self.category_filter):
            return self.category_filter(games_list)
        elif isinstance(self.category_filter, str):
            return [g for g in games_list if g.get('category', '').lower() == self.category_filter.lower()]
        return games_list
    
    def get_template_context(self, games_list):
        """Get template context for rendering this category row"""
        filtered_games = self.filter_games(games_list)
        if self.display_options.get('max_items'):
            filtered_games = filtered_games[:self.display_options['max_items']]
        
        return {
            'category_name': self.category_name,
            'games': filtered_games,
            'count': len(filtered_games),
            'options': self.display_options
        }

# Create blueprint with template folder
test_home = Blueprint('test_home', __name__, 
                     template_folder='templates',
                     static_folder='static',
                     static_url_path='/test_home/static')

# Import real games data from home blueprint
from website.home.home import GAMES_DATA as REAL_GAMES_DATA

def get_real_games_data():
    """Convert real games data to test_home format with cookie-based play counts"""
    games = []
    for game in REAL_GAMES_DATA:
        # Skip the test layout game from the gaming hub
        if game['name'] == 'Test Layout':
            continue
            
        games.append({
            'name': game['name'],
            'description': game['description'],
            'category': game['category'],
            'endpoint': game['endpoint'],
            'icon': game['icon'],
            'thumbnail': None,  # Will be added when you have actual images
            'rating': get_game_rating(game['name']),
            'plays': get_game_play_count(game['name']),
            'featured': is_game_featured(game['name']),
            'difficulty': game.get('difficulty', 3),
            'tags': game.get('tags', [])
        })
    return games

def get_game_rating(game_name):
    """Get game rating (mock for now, could be from database later)"""
    ratings = {
        'Time Predict Challenge': 4.6,
        'React Time Challenge': 4.7,
        'Cosmic Dino Runner': 4.8,
        'Space Invaders': 4.9
    }
    return ratings.get(game_name, 4.5)

def get_game_play_count(game_name):
    """Get game play count (mock for now, could be from database later)"""
    plays = {
        'Time Predict Challenge': 8932,
        'React Time Challenge': 15678,
        'Cosmic Dino Runner': 12543,
        'Space Invaders': 23451
    }
    return plays.get(game_name, 5000)

def is_game_featured(game_name):
    """Determine if game is featured"""
    featured_games = ['Cosmic Dino Runner', 'Space Invaders']
    return game_name in featured_games

# Cookie management functions
def get_user_favorites():
    """Get user's favorite games from cookies"""
    favorites_cookie = request.cookies.get('user_favorites')
    if favorites_cookie:
        try:
            return json.loads(favorites_cookie)
        except json.JSONDecodeError:
            return []
    return []

def get_recently_played():
    """Get recently played games from cookies"""
    recent_cookie = request.cookies.get('recently_played')
    if recent_cookie:
        try:
            return json.loads(recent_cookie)
        except json.JSONDecodeError:
            return []
    return []

def add_to_recently_played(game_name):
    """Add game to recently played list"""
    recent_games = get_recently_played()
    
    # Remove if already exists to avoid duplicates
    if game_name in recent_games:
        recent_games.remove(game_name)
    
    # Add to front of list
    recent_games.insert(0, game_name)
    
    # Keep only last 10 games
    recent_games = recent_games[:10]
    
    return recent_games

def get_navigation_sections():
    """Get navigation sections with real counts"""
    games_data = get_real_games_data()
    favorites = get_user_favorites()
    recent_games = get_recently_played()
    featured_count = len([g for g in games_data if g['featured']])
    
    return [
        {'name': 'Home', 'icon': '🏠', 'count': len(games_data)},
        {'name': 'Featured', 'icon': '⭐', 'count': featured_count},
        {'name': 'Favorited', 'icon': '❤️', 'count': len(favorites)},
        {'name': 'Recently Played', 'icon': '🕒', 'count': len(recent_games)}
    ]

def get_game_categories():
    """Get game categories with real counts"""
    games_data = get_real_games_data()
    category_counts = defaultdict(int)
    category_icons = {
        'arcade': '🕹️',
        'skill': '🎯',
        'retro': '👾',
        'fantasy': '🐉',
        'horror': '👻',
        'development': '🧪'
    }
    
    for game in games_data:
        category_counts[game['category']] += 1
    
    categories = []
    for category, count in category_counts.items():
        categories.append({
            'name': category.title(),
            'icon': category_icons.get(category, '🎮'),
            'count': count
        })
    
    return sorted(categories, key=lambda x: x['count'], reverse=True)

def get_home_category_rows():
    """Get category rows based on real game data"""
    games_data = get_real_games_data()
    category_counts = defaultdict(int)
    
    for game in games_data:
        category_counts[game['category']] += 1
    
    rows = []
    
    # Only create rows for categories that have games
    if category_counts['arcade'] > 0:
        rows.append(CategoryRow(
            category_name="Arcade Games",
            category_filter="arcade",
            display_options={'layout': 'horizontal', 'max_items': 8, 'card_size': 'standard'}
        ))
    
    if category_counts['skill'] > 0:
        rows.append(CategoryRow(
            category_name="Skill Challenges", 
            category_filter="skill",
            display_options={'layout': 'horizontal', 'max_items': 6, 'card_size': 'standard'}
        ))
    
    # Add featured games row
    rows.insert(0, CategoryRow(
        category_name="Featured Games",
        category_filter=lambda games: [g for g in games if g.get('featured', False)],
        display_options={'layout': 'horizontal', 'max_items': 10, 'card_size': 'standard'}
    ))
    
    return rows

@test_home.route('/')
def index():
    """
    Main test layout route - displays YouTube-inspired gaming hub with category row system
    """
    # Get optional parameters from URL
    selected_category = request.args.get('category', 'Home')
    search_query = request.args.get('search', '')
    
    # Get real games data
    games_data = get_real_games_data()
    
    # Initialize category rows for Home page
    category_rows = []
    
    # Always prepare category rows for home page
    for category_row in get_home_category_rows():
        row_context = category_row.get_template_context(games_data)
        if row_context['count'] > 0:  # Only add rows with games
            category_rows.append(row_context)
    
    # Always provide all games for client-side filtering
    games = games_data
    
    # Handle initial server-side filtering only for first load
    if search_query:
        games = [g for g in games if search_query.lower() in g['name'].lower() or 
                                   search_query.lower() in g['description'].lower()]
    elif selected_category and selected_category != 'Home':
        if selected_category == 'Featured':
            games = [g for g in games if g.get('featured', False)]
        elif selected_category == 'Favorited':
            favorites = get_user_favorites()
            games = [g for g in games if g['name'] in favorites]
        elif selected_category == 'Recently Played':
            recent = get_recently_played()
            games = [g for g in games if g['name'] in recent]
        elif selected_category in ['Arcade', 'Skill']:
            games = [g for g in games if g['category'].lower() == selected_category.lower()]
    
    # Get featured/hero game
    featured_games = [g for g in games_data if g.get('featured', False)]
    hero_game = featured_games[0] if featured_games else games_data[0] if games_data else None
    
    return render_template('test_home.html.jinja2',
                         games=games,
                         category_rows=category_rows,
                         navigation_sections=get_navigation_sections(),
                         game_categories=get_game_categories(),
                         selected_category=selected_category,
                         search_query=search_query,
                         hero_game=hero_game,
                         total_games=len(games_data))

@test_home.route('/api/search')
def api_search():
    """
    API endpoint for live search functionality
    """
    query = request.args.get('q', '')
    category = request.args.get('category', '')
    
    games = MOCK_GAMES_DATA
    if query:
        games = [g for g in games if query.lower() in g['name'].lower() or 
                                   query.lower() in g['description'].lower()]
    
    return jsonify({
        'success': True,
        'games': games,
        'count': len(games),
        'query': query,
        'category': category
    })

@test_home.route('/api/games')
def api_games():
    """
    API endpoint to get all games for client-side filtering
    """
    games_data = get_real_games_data()
    return jsonify({
        'success': True,
        'games': games_data,
        'count': len(games_data)
    })

@test_home.route('/api/categories')
def api_categories():
    """
    API endpoint to get all categories with counts
    """
    return jsonify({
        'success': True,
        'categories': get_game_categories()
    })

@test_home.route('/api/favorites', methods=['POST'])
def api_add_favorite():
    """
    API endpoint to add/remove game from favorites
    """
    data = request.get_json()
    game_name = data.get('game_name')
    action = data.get('action', 'toggle')  # 'add', 'remove', 'toggle'
    
    if not game_name:
        return jsonify({'success': False, 'error': 'Game name required'}), 400
    
    favorites = get_user_favorites()
    
    if action == 'add' and game_name not in favorites:
        favorites.append(game_name)
    elif action == 'remove' and game_name in favorites:
        favorites.remove(game_name)
    elif action == 'toggle':
        if game_name in favorites:
            favorites.remove(game_name)
        else:
            favorites.append(game_name)
    
    response = make_response(jsonify({
        'success': True,
        'favorites': favorites,
        'count': len(favorites)
    }))
    
    # Set cookie for 1 year
    response.set_cookie('user_favorites', json.dumps(favorites), max_age=365*24*60*60)
    return response

@test_home.route('/api/recently-played', methods=['POST'])
def api_add_recently_played():
    """
    API endpoint to add game to recently played
    """
    data = request.get_json()
    game_name = data.get('game_name')
    
    if not game_name:
        return jsonify({'success': False, 'error': 'Game name required'}), 400
    
    recent_games = add_to_recently_played(game_name)
    
    response = make_response(jsonify({
        'success': True,
        'recently_played': recent_games,
        'count': len(recent_games)
    }))
    
    # Set cookie for 30 days
    response.set_cookie('recently_played', json.dumps(recent_games), max_age=30*24*60*60)
    return response