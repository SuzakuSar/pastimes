# ===== IMPROVED TIME PREDICT BACKEND WITH COMPREHENSIVE ERROR HANDLING =====

from flask import Blueprint, render_template, request, session, jsonify, redirect, url_for, flash
import time
import json
import logging
import traceback
from datetime import datetime

# Set up detailed logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# STEP 1: Enhanced leaderboard import with detailed error tracking
LEADERBOARD_AVAILABLE = False
LEADERBOARD_ERROR = None

try:
    from website.leaderboard.leaderboard import submit_score_closest_to_target
    LEADERBOARD_AVAILABLE = True
    logger.info("Leaderboard system loaded successfully")
except ImportError as e:
    LEADERBOARD_ERROR = f"Import error: {str(e)}"
    logger.warning(f"WARNING: Leaderboard system not available: {LEADERBOARD_ERROR}")
except Exception as e:
    LEADERBOARD_ERROR = f"Unexpected error: {str(e)}"
    logger.error(f"ERROR: Leaderboard system error: {LEADERBOARD_ERROR}")

# Create blueprint with template folder
time_predict = Blueprint('time_predict', __name__, template_folder='templates')

def log_request_info(endpoint, additional_info=None):
    """Log detailed request information for debugging"""
    try:
        info = {
            'endpoint': endpoint,
            'method': request.method,
            'user_agent': request.headers.get('User-Agent', 'Unknown'),
            'remote_addr': request.remote_addr,
            'timestamp': datetime.now().isoformat(),
            'session_id': session.get('session_id', 'unknown'),
            'additional': additional_info or {}
        }
        logger.info(f"Request to {endpoint}: {json.dumps(info, indent=2)}")
    except Exception as e:
        logger.error(f"Failed to log request info: {str(e)}")

def safe_session_get(key, default=None):
    """Safely get session value with error handling"""
    try:
        return session.get(key, default)
    except Exception as e:
        logger.error(f"Session access error for key '{key}': {str(e)}")
        return default

def safe_session_set(key, value):
    """Safely set session value with error handling"""
    try:
        session[key] = value
        return True
    except Exception as e:
        logger.error(f"Session set error for key '{key}': {str(e)}")
        return False

def get_session_keys(mode):
    """
    Generate session keys for a specific mode to keep statistics separate.
    
    Args:
        mode (str): Either 'predict' or 'react'
    
    Returns:
        dict: Dictionary containing session key names for the mode
    """
    if not isinstance(mode, str) or mode not in ['predict', 'react']:
        logger.warning(f"Invalid mode for session keys: {mode}")
        mode = 'predict'  # Default fallback
    
    prefix = f'time_predict_{mode}'
    return {
        'start_time': f'{prefix}_start_time',
        'game_active': f'{prefix}_game_active',
        'best_score': f'{prefix}_best_score',
        'games_played': f'{prefix}_games_played',
        'wins': f'{prefix}_wins'
    }

def get_win_threshold(mode):
    """
    Get the win threshold for a specific mode.
    
    Args:
        mode (str): Either 'predict' or 'react'
    
    Returns:
        float: Win threshold in seconds
    """
    thresholds = {
        'predict': 0.1,  # 0.1 seconds tolerance for predict mode
        'react': 0.05    # 0.05 seconds tolerance for react mode
    }
    return thresholds.get(mode, 0.05)

def get_game_name(mode):
    """
    Get the leaderboard game name for a specific mode.
    
    Args:
        mode (str): Either 'predict' or 'react'
    
    Returns:
        str: Game name for leaderboard
    """
    names = {
        'predict': 'Time Predict - Predict Mode',
        'react': 'Time Predict - React Mode'
    }
    return names.get(mode, 'Time Predict')

def validate_mode(mode):
    """Validate and sanitize mode parameter"""
    if not mode or not isinstance(mode, str):
        return 'predict', "Mode parameter missing or invalid, defaulting to 'predict'"
    
    mode = mode.lower().strip()
    if mode not in ['predict', 'react']:
        return 'predict', f"Invalid mode '{mode}', defaulting to 'predict'"
    
    return mode, None

def initialize_session_for_mode(mode):
    """Initialize session variables for a specific mode"""
    try:
        keys = get_session_keys(mode)
        
        # Always reset active game state
        safe_session_set(keys['start_time'], None)
        safe_session_set(keys['game_active'], False)
        
        # Initialize stats if they don't exist
        if keys['best_score'] not in session:
            safe_session_set(keys['best_score'], None)
        if keys['games_played'] not in session:
            safe_session_set(keys['games_played'], 0)
        if keys['wins'] not in session:
            safe_session_set(keys['wins'], 0)
        
        logger.info(f"Session initialized for mode: {mode}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize session for mode {mode}: {str(e)}")
        return False

@time_predict.route('/')
def index():
    """
    Main route for the time prediction game.
    Displays the welcome screen with game instructions and mode selection.
    """
    try:
        log_request_info('index')
        
        # Initialize session variables for both modes
        for mode in ['predict', 'react']:
            initialize_session_for_mode(mode)
        
        # Log leaderboard status for debugging
        logger.info(f"Leaderboard available: {LEADERBOARD_AVAILABLE}")
        if LEADERBOARD_ERROR:
            logger.info(f"Leaderboard error: {LEADERBOARD_ERROR}")
        
        return render_template('time_predict.html', 
                             leaderboard_available=LEADERBOARD_AVAILABLE,
                             leaderboard_error=LEADERBOARD_ERROR)
        
    except Exception as e:
        logger.error(f"Error in index route: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Try to render a basic error page
        try:
            return render_template('time_predict.html', 
                                 error="Game initialization failed. Please refresh and try again.")
        except:
            # Last resort fallback
            return "Time Predict game temporarily unavailable. Please try again later.", 500

@time_predict.route('/get_stats')
def get_stats():
    """
    API endpoint to get statistics for a specific mode.
    """
    try:
        log_request_info('get_stats', {'query_params': dict(request.args)})
        
        mode = request.args.get('mode', 'predict')
        mode, validation_warning = validate_mode(mode)
        
        if validation_warning:
            logger.warning(validation_warning)
        
        keys = get_session_keys(mode)
        
        stats = {
            'games_played': safe_session_get(keys['games_played'], 0),
            'best_score': safe_session_get(keys['best_score']),
            'wins': safe_session_get(keys['wins'], 0)
        }
        
        # Validate stats data
        if not isinstance(stats['games_played'], int) or stats['games_played'] < 0:
            stats['games_played'] = 0
            
        if not isinstance(stats['wins'], int) or stats['wins'] < 0:
            stats['wins'] = 0
            
        if stats['best_score'] is not None and not isinstance(stats['best_score'], (int, float)):
            logger.warning(f"Invalid best_score type: {type(stats['best_score'])}")
            stats['best_score'] = None
        
        logger.info(f"Stats retrieved for mode {mode}: {stats}")
        
        return jsonify({
            'success': True,
            'stats': stats,
            'mode': mode,
            'leaderboard_available': LEADERBOARD_AVAILABLE
        })
        
    except Exception as e:
        logger.error(f"Error in get_stats: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return jsonify({
            'success': False,
            'error': f"Failed to retrieve stats: {str(e)}",
            'leaderboard_available': LEADERBOARD_AVAILABLE
        }), 500

@time_predict.route('/start_game', methods=['POST'])
def start_game():
    """
    API endpoint to start a new game.
    Records the start time and activates the game for the specified mode.
    """
    try:
        log_request_info('start_game')
        
        # Get and validate request data
        data = request.get_json() or {}
        mode = data.get('mode', 'predict')
        mode, validation_warning = validate_mode(mode)
        
        if validation_warning:
            logger.warning(validation_warning)
        
        keys = get_session_keys(mode)
        
        # Check if game is already active
        if safe_session_get(keys['game_active'], False):
            logger.warning(f"Attempted to start game while already active for mode: {mode}")
            return jsonify({
                'success': False,
                'error': f'Game already active for {mode} mode'
            }), 400
        
        # Record the precise start time using high-resolution timer
        start_time = time.time()
        
        # Set session variables with error checking
        if not safe_session_set(keys['start_time'], start_time):
            raise Exception("Failed to set start_time in session")
            
        if not safe_session_set(keys['game_active'], True):
            raise Exception("Failed to set game_active in session")
        
        logger.info(f"Game started for mode {mode} at {start_time}")
        
        return jsonify({
            'success': True,
            'start_time': start_time,
            'mode': mode,
            'message': f'Game started in {mode} mode! Press SPACE when you think 10 seconds have passed.',
            'leaderboard_available': LEADERBOARD_AVAILABLE
        })
        
    except Exception as e:
        logger.error(f"Error in start_game: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Try to clean up session state on error
        try:
            data = request.get_json() or {}
            mode = data.get('mode', 'predict')
            mode, _ = validate_mode(mode)
            keys = get_session_keys(mode)
            safe_session_set(keys['game_active'], False)
            safe_session_set(keys['start_time'], None)
        except:
            pass  # Ignore cleanup errors
        
        return jsonify({
            'success': False,
            'error': f"Failed to start game: {str(e)}",
            'leaderboard_available': LEADERBOARD_AVAILABLE
        }), 500

@time_predict.route('/stop_game', methods=['POST'])
def stop_game():
    """
    API endpoint to stop the game and calculate results.
    Called when user presses spacebar.
    """
    try:
        log_request_info('stop_game')
        
        # Get and validate request data
        data = request.get_json() or {}
        mode = data.get('mode', 'predict')
        mode, validation_warning = validate_mode(mode)
        
        if validation_warning:
            logger.warning(validation_warning)
        
        keys = get_session_keys(mode)
        
        # Validate game state
        if not safe_session_get(keys['game_active'], False):
            logger.warning(f"Attempted to stop inactive game for mode: {mode}")
            return jsonify({
                'success': False,
                'error': f'No active {mode} game found'
            }), 400
        
        # Get the score calculated by game logic (server-side)
        end_time = time.time()
        start_time = safe_session_get(keys['start_time'])
        
        if start_time is None:
            logger.error(f"Start time not found for mode: {mode}")
            return jsonify({
                'success': False,
                'error': 'Start time not found - game state corrupted'
            }), 400
        
        # Validate start_time
        if not isinstance(start_time, (int, float)):
            logger.error(f"Invalid start_time type: {type(start_time)}")
            return jsonify({
                'success': False,
                'error': 'Invalid start time - game state corrupted'
            }), 400
        
        # SERVER calculates the elapsed time (can't be faked!)
        elapsed_time = end_time - start_time
        target_time = 10.0  # Target is exactly 10 seconds
        difference = elapsed_time - target_time
        
        # Validate calculated values
        if elapsed_time < 0 or elapsed_time > 300:  # Sanity check: 0-300 seconds
            logger.warning(f"Suspicious elapsed time: {elapsed_time} seconds")
            
        logger.info(f"Game finished - Mode: {mode}, Elapsed: {elapsed_time:.3f}s, Difference: {difference:.3f}s")
        
        # Get win threshold for this mode
        win_threshold = get_win_threshold(mode)
        is_winner = abs(difference) <= win_threshold
        
        # Update local session statistics for this mode
        current_games = safe_session_get(keys['games_played'], 0)
        current_wins = safe_session_get(keys['wins'], 0)
        
        safe_session_set(keys['games_played'], current_games + 1)
        
        if is_winner:
            safe_session_set(keys['wins'], current_wins + 1)
        
        current_best = safe_session_get(keys['best_score'])
        
        # Best score is the smallest absolute difference
        if current_best is None or abs(difference) < abs(current_best):
            safe_session_set(keys['best_score'], difference)
        
        # Clear game session data
        safe_session_set(keys['game_active'], False)
        safe_session_set(keys['start_time'], None)
        
        # ENHANCED: Submit to leaderboard with comprehensive error handling
        leaderboard_success = False
        redirect_url = None
        leaderboard_error = None
        
        if LEADERBOARD_AVAILABLE:
            try:
                game_name = get_game_name(mode)
                logger.info(f"Submitting to leaderboard: {game_name}, score: {elapsed_time}, target: {target_time}")
                
                result = submit_score_closest_to_target(
                    game_name=game_name,
                    score=elapsed_time,           # Player's actual timing
                    target=target_time,           # Target (10.0 seconds)
                    score_type="guess_seconds"    # Custom score type name
                )
                
                leaderboard_success = result.get('success', False)
                redirect_url = result.get('redirect_url')
                leaderboard_error = result.get('error')
                
                if leaderboard_success:
                    logger.info(f"Leaderboard submission successful, redirect: {redirect_url}")
                else:
                    logger.warning(f"Leaderboard submission failed: {leaderboard_error}")
                
            except Exception as e:
                leaderboard_error = f"Leaderboard submission failed: {str(e)}"
                logger.error(f"Leaderboard error: {str(e)}")
                logger.error(f"Leaderboard traceback: {traceback.format_exc()}")
        else:
            leaderboard_error = f"Leaderboard system not available: {LEADERBOARD_ERROR}"
        
        # Create result message
        if difference > 0:
            timing_message = f"You were {difference:.3f} seconds LATE"
        elif difference < 0:
            timing_message = f"You were {abs(difference):.3f} seconds EARLY"
        else:
            timing_message = "PERFECT TIMING!"
        
        # Prepare updated statistics
        stats = {
            'games_played': safe_session_get(keys['games_played'], 0),
            'best_score': safe_session_get(keys['best_score']),
            'wins': safe_session_get(keys['wins'], 0)
        }
        
        response_data = {
            'success': True,
            'elapsed_time': round(elapsed_time, 3),
            'target_time': target_time,
            'difference': round(difference, 3),
            'is_winner': is_winner,
            'timing_message': timing_message,
            'win_threshold': win_threshold,
            'mode': mode,
            'stats': stats,
            'leaderboard_success': leaderboard_success,
            'redirect_url': redirect_url,
            'leaderboard_error': leaderboard_error,
            'leaderboard_available': LEADERBOARD_AVAILABLE
        }
        
        logger.info(f"Returning game results: {json.dumps({k: v for k, v in response_data.items() if k != 'stats'}, indent=2)}")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in stop_game: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Try to clean up session state on error
        try:
            data = request.get_json() or {}
            mode = data.get('mode', 'predict')
            mode, _ = validate_mode(mode)
            keys = get_session_keys(mode)
            safe_session_set(keys['game_active'], False)
            safe_session_set(keys['start_time'], None)
        except:
            pass  # Ignore cleanup errors
        
        return jsonify({
            'success': False,
            'error': f"Failed to stop game: {str(e)}",
            'leaderboard_available': LEADERBOARD_AVAILABLE
        }), 500

@time_predict.route('/reset_stats', methods=['POST'])
def reset_stats():
    """
    API endpoint to reset player statistics for a specific mode.
    """
    try:
        log_request_info('reset_stats')
        
        # Get and validate request data
        data = request.get_json() or {}
        mode = data.get('mode', 'predict')
        mode, validation_warning = validate_mode(mode)
        
        if validation_warning:
            logger.warning(validation_warning)
        
        keys = get_session_keys(mode)
        
        # Reset all statistics for this mode
        safe_session_set(keys['best_score'], None)
        safe_session_set(keys['games_played'], 0)
        safe_session_set(keys['wins'], 0)
        safe_session_set(keys['game_active'], False)
        safe_session_set(keys['start_time'], None)
        
        logger.info(f"Statistics reset for mode: {mode}")
        
        return jsonify({
            'success': True,
            'message': f'{mode.capitalize()} mode statistics reset successfully',
            'mode': mode,
            'leaderboard_available': LEADERBOARD_AVAILABLE
        })
        
    except Exception as e:
        logger.error(f"Error in reset_stats: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return jsonify({
            'success': False,
            'error': f"Failed to reset stats: {str(e)}",
            'leaderboard_available': LEADERBOARD_AVAILABLE
        }), 500

@time_predict.route('/get_all_stats')
def get_all_stats():
    """
    API endpoint to get statistics for both modes.
    Useful for debugging or showing combined statistics.
    """
    try:
        log_request_info('get_all_stats')
        
        all_stats = {}
        
        for mode in ['predict', 'react']:
            keys = get_session_keys(mode)
            all_stats[mode] = {
                'games_played': safe_session_get(keys['games_played'], 0),
                'best_score': safe_session_get(keys['best_score']),
                'wins': safe_session_get(keys['wins'], 0),
                'win_threshold': get_win_threshold(mode),
                'game_active': safe_session_get(keys['game_active'], False)
            }
        
        return jsonify({
            'success': True,
            'stats': all_stats,
            'leaderboard_available': LEADERBOARD_AVAILABLE,
            'leaderboard_error': LEADERBOARD_ERROR
        })
        
    except Exception as e:
        logger.error(f"Error in get_all_stats: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return jsonify({
            'success': False,
            'error': f"Failed to retrieve all stats: {str(e)}",
            'leaderboard_available': LEADERBOARD_AVAILABLE
        }), 500

# Enhanced leaderboard view routes with comprehensive error handling
@time_predict.route('/leaderboard/<mode>')
def view_mode_leaderboard(mode):
    """View leaderboard for specific mode"""
    try:
        log_request_info('view_mode_leaderboard', {'mode': mode})
        
        mode, validation_warning = validate_mode(mode)
        if validation_warning:
            logger.warning(validation_warning)
            flash(validation_warning, 'warning')
        
        if not LEADERBOARD_AVAILABLE:
            error_msg = f'Leaderboard system not available: {LEADERBOARD_ERROR}'
            logger.warning(error_msg)
            flash(error_msg, 'error')
            return redirect(url_for('time_predict.index'))
        
        try:
            game_name = get_game_name(mode)
            logger.info(f"Redirecting to leaderboard for game: {game_name}")
            return redirect(url_for('leaderboard.view_game_leaderboard', game_name=game_name))
        except Exception as e:
            error_msg = f'Error accessing leaderboard: {str(e)}'
            logger.error(error_msg)
            logger.error(f"Traceback: {traceback.format_exc()}")
            flash(error_msg, 'error')
            return redirect(url_for('time_predict.index'))
            
    except Exception as e:
        logger.error(f"Error in view_mode_leaderboard: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        flash(f'Unexpected error accessing leaderboard: {str(e)}', 'error')
        return redirect(url_for('time_predict.index'))

# Debug route for troubleshooting (remove in production)
@time_predict.route('/debug')
def debug_info():
    """Debug endpoint to help troubleshoot issues"""
    try:
        debug_data = {
            'leaderboard_available': LEADERBOARD_AVAILABLE,
            'leaderboard_error': LEADERBOARD_ERROR,
            'session_data': {
                key: value for key, value in session.items() 
                if key.startswith('time_predict_')
            },
            'request_info': {
                'user_agent': request.headers.get('User-Agent', 'Unknown'),
                'remote_addr': request.remote_addr,
                'method': request.method,
                'endpoint': request.endpoint
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(debug_data)
        
    except Exception as e:
        logger.error(f"Error in debug endpoint: {str(e)}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500