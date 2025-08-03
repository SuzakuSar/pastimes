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

from flask import Blueprint, render_template, jsonify, request, session
import datetime

# Create blueprint with template folder
test_home = Blueprint('test_home', __name__, 
                     template_folder='templates',
                     static_folder='static',
                     static_url_path='/test_home/static')

# Mock data for the layout demonstration
MOCK_GAMES_DATA = [
    {
        'name': 'Cosmic Dino Runner',
        'description': 'Chrome dinosaur game in space - jump over obstacles!',
        'category': 'arcade',
        'thumbnail': '/static/images/dino-thumb.jpg',
        'rating': 4.8,
        'plays': 12543,
        'featured': True
    },
    {
        'name': 'Time Predict Challenge', 
        'description': 'Test your internal clock - hit exactly 10.000 seconds!',
        'category': 'skill',
        'thumbnail': '/static/images/time-thumb.jpg',
        'rating': 4.6,
        'plays': 8932,
        'featured': False
    },
    {
        'name': 'React Time Challenge',
        'description': 'Test your reflexes - react to visual indicators as fast as possible!',
        'category': 'skill', 
        'thumbnail': '/static/images/react-thumb.jpg',
        'rating': 4.7,
        'plays': 15678,
        'featured': False
    },
    {
        'name': 'Space Invaders',
        'description': 'Defend Earth from alien invasion in this classic arcade shooter!',
        'category': 'arcade',
        'thumbnail': '/static/images/invaders-thumb.jpg', 
        'rating': 4.9,
        'plays': 23451,
        'featured': True
    }
]

MOCK_CATEGORIES = [
    {'name': 'Home', 'icon': '🏠', 'count': 4},
    {'name': 'Featured', 'icon': '⭐', 'count': 2},
    {'name': 'Arcade', 'icon': '🕹️', 'count': 2}, 
    {'name': 'Skill', 'icon': '🎯', 'count': 2},
    {'name': 'Saved', 'icon': '💾', 'count': 3},
    {'name': 'Recently Played', 'icon': '🕒', 'count': 5}
]

@test_home.route('/')
def index():
    """
    Main test layout route - displays YouTube-inspired gaming hub
    """
    # Get optional parameters from URL
    selected_category = request.args.get('category', 'Home')
    search_query = request.args.get('search', '')
    
    # Filter games based on parameters
    games = MOCK_GAMES_DATA
    if search_query:
        games = [g for g in games if search_query.lower() in g['name'].lower() or 
                                   search_query.lower() in g['description'].lower()]
    elif selected_category and selected_category != 'Home':
        if selected_category == 'Featured':
            games = [g for g in games if g.get('featured', False)]
        elif selected_category in ['Arcade', 'Skill']:
            games = [g for g in games if g['category'].lower() == selected_category.lower()]
    
    # Get featured/hero game
    hero_game = next((g for g in MOCK_GAMES_DATA if g.get('featured', False)), MOCK_GAMES_DATA[0])
    
    # Mock user stats
    user_stats = {
        'username': 'TestUser',
        'avatar': '👤',
        'games_played': 12,
        'achievements': 5,
        'play_time': '2h 34m',
        'current_streak': 3
    }
    
    return render_template('test_home.html',
                         games=games,
                         categories=MOCK_CATEGORIES,
                         selected_category=selected_category,
                         search_query=search_query,
                         hero_game=hero_game,
                         user_stats=user_stats,
                         total_games=len(MOCK_GAMES_DATA))

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

@test_home.route('/api/categories')
def api_categories():
    """
    API endpoint to get all categories with counts
    """
    return jsonify({
        'success': True,
        'categories': MOCK_CATEGORIES
    })