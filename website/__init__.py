"""
Main Flask application initialization for SUMMERLOCKIN project
Registers all blueprints and configures the application
"""

from flask import Flask

def create_app():
    """
    Create and configure the Flask application
    """
    app = Flask(__name__)
    
    # Secret key for session management
    app.secret_key = 'shh_its_a_secret'
    
    # Configuration settings
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching during development
    
    # Import blueprints
    from .home import home
    from .leaderboard.leaderboard import leaderboard
    from .time_predict import time_predict
    from .react_time.react_time import react_time
    from .dino_runner.dino_runner import dino_runner
    from .space_invaders.space_invaders import space_invaders
    from .test_home import test_home

    # Register blueprints with URL prefixes
    app.register_blueprint(home, url_prefix='/')
    app.register_blueprint(leaderboard, url_prefix='/leaderboard')
    app.register_blueprint(time_predict, url_prefix='/timepredict')
    app.register_blueprint(react_time, url_prefix='/reacttime')
    app.register_blueprint(dino_runner, url_prefix='/dino-runner')
    app.register_blueprint(space_invaders, url_prefix='/spaceinvaders')
    app.register_blueprint(test_home, url_prefix='/test-home')


    # Add any new blueprints here following the same pattern:
    # from .new_feature import new_feature
    # app.register_blueprint(new_feature, url_prefix='/newfeature')
    
    # Global context processor to make request available in all templates + dynamic games
    @app.context_processor
    def inject_request():
        """Make request object available in all templates for navigation highlighting"""
        from flask import request
        
        # Get dynamic navigation games
        try:
            from .home.home import GAMES_DATA
            navigation_games = []
            for game_data in GAMES_DATA:
                if game_data.get('endpoint'):  # Only include games with valid endpoints
                    navigation_games.append({
                        'name': game_data['name'],
                        'icon': game_data.get('icon', '🎮'),
                        'endpoint': game_data['endpoint'],
                        'search_terms': ' '.join(game_data.get('tags', [])) + ' ' + game_data['name'].lower()
                    })
        except ImportError:
            navigation_games = []
        
        return dict(request=request, navigation_games=navigation_games)
    
    # Optional: Add custom error pages
    @app.errorhandler(404)
    def page_not_found(e):
        """Custom 404 page with space theme"""
        from flask import render_template
        return render_template('404.html'), 404
    
    # # Optional: Add custom template filters
    # @app.template_filter('star_emoji')
    # def star_emoji_filter(number):
    #     """Convert number to star emojis"""
    #     return '⭐' * min(int(number), 5)
    
    return app

# For development server
# if __name__ == '__main__':
#     app = create_app()
#     app.run(debug=True)