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
import urllib.parse
from website.leaderboard.leaderboard import (
    get_user_identifier, toggle_like, toggle_favorite, 
    get_user_likes, get_user_favorites, get_game_stats
)

class GameCard:
    """Reusable game card component class"""
    def __init__(self, game_data, card_options=None):
        self.game_data = game_data
        self.card_options = card_options or {
            'show_likes': True,
            'show_plays': True,
            'show_rating': False,
            'show_featured_badge': True,
            'show_category': False,
            'card_size': 'standard',  # 'standard', 'large', 'compact'
            'clickable': True,
            'show_overlay': True,
            'css_classes': []  # Additional CSS classes
        }
    
    def render_html(self):
        """Generate HTML string for the card"""
        css_classes = ['game-card'] + self.card_options.get('css_classes', [])
        
        # Build card meta content
        meta_items = []
        if self.card_options.get('show_likes', True):
            meta_items.append(f'''
                <span class="card-likes-container">
                    <button class="btn-like" aria-label="Like this game" data-liked="false" data-game-name="{self.game_data['name']}">
                        <span class="thumb-outline">👍</span>
                        <span class="thumb-filled">👍</span>
                    </button>
                    <span class="likes-count">{self.game_data['likes']}</span>
                </span>
            ''')
        
        if self.card_options.get('show_plays', True):
            meta_items.append(f'<span class="card-plays">{self.game_data["plays"]} plays</span>')
        
        if self.card_options.get('show_rating', False):
            meta_items.append(f'<span class="card-rating">⭐ {self.game_data.get("rating", "N/A")}</span>')
        
        if self.card_options.get('show_category', False):
            meta_items.append(f'<span class="card-category">{self.game_data["category"].title()}</span>')
        
        meta_html = ''.join(meta_items)
        
        # Build featured badge
        featured_badge = ''
        if self.card_options.get('show_featured_badge', True) and self.game_data.get('featured', False):
            featured_badge = '<div class="featured-badge">Featured</div>'
        
        # Build overlay
        overlay_html = ''
        if self.card_options.get('show_overlay', True):
            overlay_html = f'''
                <div class="card-overlay">
                    <div class="card-content">
                        <div class="card-meta">
                            {meta_html}
                        </div>
                    </div>
                    <button class="btn-favorite" aria-label="Add to favorites" data-favorited="false" data-game-name="{self.game_data['name']}">
                        <span class="heart-outline">♡</span>
                        <span class="heart-filled">♥</span>
                    </button>
                </div>
            '''
        
        return f'''
            <article class="{' '.join(css_classes)}" 
                     data-category="{self.game_data['category']}" 
                     data-featured="{str(self.game_data.get('featured', False)).lower()}" 
                     data-game-name="{self.game_data['name']}" 
                     data-game-description="{self.game_data.get('description', '')}" 
                     data-game-endpoint="{self.game_data.get('endpoint', '')}">
                <div class="card-thumbnail">
                    <div class="thumbnail-placeholder" data-game-title="{self.game_data['name']}">
                        <span class="thumbnail-title">{self.game_data['name']}</span>
                    </div>
                    {featured_badge}
                </div>
                {overlay_html}
            </article>
        '''

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
            'likes': get_game_likes(game['name']),
            'plays': get_game_play_count(game['name']),
            'featured': is_game_featured(game['name']),
            'difficulty': game.get('difficulty', 3),
            'tags': game.get('tags', []),
            'rating': get_game_rating(game['name'])
        })
    return games

def get_game_likes(game_name):
    """Get game like count from database"""
    try:
        stats = get_game_stats(game_name)
        likes = stats.get('likes', 0)
        
        # If no likes in database, return default counts for existing games
        if likes == 0:
            default_likes = {
                'Time Predict Challenge': 142,
                'React Time Challenge': 298,
                'Cosmic Dino Runner': 387,
                'Space Invaders': 521
            }
            return default_likes.get(game_name, 45)
        return likes
    except Exception as e:
        print(f"Error getting game likes from database: {e}")
        # Fallback to default counts
        default_likes = {
            'Time Predict Challenge': 142,
            'React Time Challenge': 298,
            'Cosmic Dino Runner': 387,
            'Space Invaders': 521
        }
        return default_likes.get(game_name, 45)

def get_game_play_count(game_name):
    """Get game play count (mock for now, could be from database later)"""
    plays = {
        'Time Predict Challenge': 8932,
        'React Time Challenge': 15678,
        'Cosmic Dino Runner': 12543,
        'Space Invaders': 23451
    }
    return plays.get(game_name, 5000)

def get_game_rating(game_name):
    """Get game rating (mock for now, could be from database later)"""
    ratings = {
        'Time Predict Challenge': 4.2,
        'React Time Challenge': 4.5,
        'Cosmic Dino Runner': 4.7,
        'Space Invaders': 4.8
    }
    return ratings.get(game_name, 4.0)

def is_game_featured(game_name):
    """Determine if game is featured"""
    featured_games = ['Cosmic Dino Runner', 'Space Invaders']
    return game_name in featured_games

# User interaction management functions
def get_user_likes_test():
    """Get user's liked games from database"""
    try:
        user_id = get_user_identifier(request)
        return get_user_likes(user_id)
    except Exception as e:
        print(f"Error getting user likes: {e}")
        return []

def get_user_favorites_test():
    """Get user's favorite games from database"""
    try:
        user_id = get_user_identifier(request)
        return get_user_favorites(user_id)
    except Exception as e:
        print(f"Error getting user favorites: {e}")
        return []

def get_recently_played():
    """Get recently played games - placeholder for future database implementation"""
    # TODO: Implement database-backed recently played tracking
    return []

def add_to_recently_played(game_name):
    """Add game to recently played list - placeholder for future database implementation"""
    # TODO: Implement database-backed recently played tracking
    return []

def get_navigation_sections():
    """Get navigation sections with real counts"""
    games_data = get_real_games_data()
    favorites = get_user_favorites_test()
    likes = get_user_likes_test()
    recent_games = get_recently_played()
    featured_count = len([g for g in games_data if g['featured']])
    
    return [
        {'name': 'Home', 'icon': '🏠', 'count': len(games_data)},
        {'name': 'Featured', 'icon': '⭐', 'count': featured_count},
        {'name': 'Favorited', 'icon': '❤️', 'count': len(favorites)},
        {'name': 'Liked', 'icon': '👍', 'count': len(likes)},
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

# Helper functions for GameCard class
def create_game_card(game_data, card_options=None):
    """Factory function to create a GameCard instance"""
    return GameCard(game_data, card_options)

def render_game_cards(games_list, card_options=None):
    """Render multiple game cards as HTML"""
    cards_html = []
    for game in games_list:
        card = GameCard(game, card_options)
        cards_html.append(card.render_html())
    return '\n'.join(cards_html)

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
            favorites = get_user_favorites_test()
            games = [g for g in games if g['name'] in favorites]
        elif selected_category == 'Liked':
            likes = get_user_likes_test()
            games = [g for g in games if g['name'] in likes]
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
                         total_games=len(games_data),
                         # Make GameCard utilities available in templates
                         GameCard=GameCard,
                         create_game_card=create_game_card,
                         render_game_cards=render_game_cards)

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
    API endpoint to add/remove game from favorites using database
    """
    data = request.get_json()
    game_name = data.get('game_name')
    action = data.get('action', 'toggle')  # 'add', 'remove', 'toggle'
    
    if not game_name:
        return jsonify({'success': False, 'error': 'Game name required'}), 400
    
    try:
        user_id = get_user_identifier(request)
        ip_address = request.remote_addr
        
        # Use the database function to toggle favorite
        result = toggle_favorite(game_name, user_id, ip_address)
        
        if result['success']:
            return jsonify({
                'success': True,
                'is_favorited': result['is_favorited'],
                'count': result['user_favorite_count'],
                'action': result['action']
            })
        else:
            return jsonify({'success': False, 'error': result.get('error', 'Unknown error')}), 500
            
    except Exception as e:
        print(f"Error in favorites API: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@test_home.route('/api/likes', methods=['POST'])
def api_handle_likes():
    """
    API endpoint to handle game likes using database
    """
    data = request.get_json()
    game_name = data.get('game_name')
    action = data.get('action', 'toggle')  # 'like', 'unlike', 'toggle'
    
    if not game_name:
        return jsonify({'success': False, 'error': 'Game name required'}), 400
    
    try:
        user_id = get_user_identifier(request)
        ip_address = request.remote_addr
        
        # Use the database function to toggle like
        result = toggle_like(game_name, user_id, ip_address)
        
        if result['success']:
            return jsonify({
                'success': True,
                'is_liked': result['is_liked'],
                'game_likes': result['like_count'],
                'count': result['user_like_count'],
                'action': result['action']
            })
        else:
            return jsonify({'success': False, 'error': result.get('error', 'Unknown error')}), 500
            
    except Exception as e:
        print(f"Error in likes API: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@test_home.route('/api/user/likes', methods=['GET'])
def api_get_user_likes():
    """Get user's liked games"""
    try:
        user_id = get_user_identifier(request)
        likes = get_user_likes(user_id)
        return jsonify({
            'success': True,
            'likes': likes,
            'count': len(likes)
        })
    except Exception as e:
        print(f"Error getting user likes: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@test_home.route('/api/user/favorites', methods=['GET'])
def api_get_user_favorites():
    """Get user's favorite games"""
    try:
        user_id = get_user_identifier(request)
        favorites = get_user_favorites(user_id)
        return jsonify({
            'success': True,
            'favorites': favorites,
            'count': len(favorites)
        })
    except Exception as e:
        print(f"Error getting user favorites: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@test_home.route('/api/recently-played', methods=['POST'])
def api_add_recently_played():
    """
    API endpoint to add game to recently played - placeholder for future database implementation
    """
    data = request.get_json()
    game_name = data.get('game_name')
    
    if not game_name:
        return jsonify({'success': False, 'error': 'Game name required'}), 400
    
    # TODO: Implement database-backed recently played tracking
    recent_games = []
    
    return jsonify({
        'success': True,
        'recently_played': recent_games,
        'count': len(recent_games)
    })

@test_home.route('/game/<game_name>')
def game_player(game_name):
    """
    YouTube-style game player interface
    """
    games_data = get_real_games_data()
    
    # Find the requested game
    current_game = None
    for game in games_data:
        if game['name'].lower().replace(' ', '-') == game_name.lower() or game['name'] == game_name:
            current_game = game
            break
    
    if not current_game:
        # Game not found, redirect to home
        return render_template('test_home.html.jinja2',
                             games=games_data,
                             category_rows=[],
                             navigation_sections=get_navigation_sections(),
                             game_categories=get_game_categories(),
                             selected_category='Home',
                             search_query='',
                             hero_game=games_data[0] if games_data else None,
                             total_games=len(games_data))
    
    # Get related games (same category, excluding current game)
    related_games = [g for g in games_data if g['category'] == current_game['category'] and g['name'] != current_game['name']]
    
    # If not enough related games, add games from other categories
    if len(related_games) < 6:
        other_games = [g for g in games_data if g['name'] != current_game['name'] and g not in related_games]
        related_games.extend(other_games[:6-len(related_games)])
    
    return render_template('game_player.html.jinja2',
                         current_game=current_game,
                         related_games=related_games,
                         navigation_sections=get_navigation_sections(),
                         game_categories=get_game_categories(),
                         # Make GameCard utilities available in templates
                         GameCard=GameCard,
                         create_game_card=create_game_card,
                         render_game_cards=render_game_cards)