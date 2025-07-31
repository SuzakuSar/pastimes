from flask import Blueprint, render_template, request, session, jsonify, redirect, url_for, flash
import time
import json
import logging
import traceback
import random
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

LEADERBOARD_AVAILABLE = False
LEADERBOARD_ERROR = None

try:
    from website.leaderboard.leaderboard import submit_score_lower_better
    LEADERBOARD_AVAILABLE = True
    logger.info("Leaderboard system loaded successfully")
except ImportError as e:
    LEADERBOARD_ERROR = f"Import error: {str(e)}"
    logger.warning(f"WARNING: Leaderboard system not available: {LEADERBOARD_ERROR}")
except Exception as e:
    LEADERBOARD_ERROR = f"Unexpected error: {str(e)}"
    logger.error(f"ERROR: Leaderboard system error: {LEADERBOARD_ERROR}")

react_time = Blueprint('react_time', __name__, template_folder='templates')

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

def initialize_session():
    """Initialize session variables for react time game"""
    try:
        keys = [
            'react_time_start_time',
            'react_time_indicator_time',
            'react_time_game_active',
            'react_time_waiting_for_indicator',
            'react_time_best_score',
            'react_time_games_played',
            'react_time_wins'
        ]
        
        # Always reset active game state
        safe_session_set('react_time_start_time', None)
        safe_session_set('react_time_indicator_time', None)
        safe_session_set('react_time_game_active', False)
        safe_session_set('react_time_waiting_for_indicator', False)
        
        # Initialize stats if they don't exist
        for key in ['react_time_best_score', 'react_time_games_played', 'react_time_wins']:
            if key not in session:
                default_value = None if 'best_score' in key else 0
                safe_session_set(key, default_value)
        
        logger.info("React time session initialized")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize session: {str(e)}")
        return False

@react_time.route('/')
def index():
    """Main route for the reaction time game"""
    try:
        log_request_info('index')
        initialize_session()
        
        logger.info(f"Leaderboard available: {LEADERBOARD_AVAILABLE}")
        if LEADERBOARD_ERROR:
            logger.info(f"Leaderboard error: {LEADERBOARD_ERROR}")
        
        return render_template('react_time.html', 
                             leaderboard_available=LEADERBOARD_AVAILABLE,
                             leaderboard_error=LEADERBOARD_ERROR)
        
    except Exception as e:
        logger.error(f"Error in index route: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        try:
            return render_template('react_time.html', 
                                 error="Game initialization failed. Please refresh and try again.")
        except:
            return "React Time game temporarily unavailable. Please try again later.", 500

@react_time.route('/get_stats')
def get_stats():
    """API endpoint to get player statistics"""
    try:
        log_request_info('get_stats')
        
        stats = {
            'games_played': safe_session_get('react_time_games_played', 0),
            'best_score': safe_session_get('react_time_best_score'),
            'wins': safe_session_get('react_time_wins', 0)
        }
        
        # Validate stats data
        if not isinstance(stats['games_played'], int) or stats['games_played'] < 0:
            stats['games_played'] = 0
            
        if not isinstance(stats['wins'], int) or stats['wins'] < 0:
            stats['wins'] = 0
            
        if stats['best_score'] is not None and not isinstance(stats['best_score'], (int, float)):
            logger.warning(f"Invalid best_score type: {type(stats['best_score'])}")
            stats['best_score'] = None
        
        logger.info(f"Stats retrieved: {stats}")
        
        return jsonify({
            'success': True,
            'stats': stats,
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

@react_time.route('/start_game', methods=['POST'])
def start_game():
    """API endpoint to start a new reaction time game"""
    try:
        log_request_info('start_game')
        
        # Check if game is already active
        if safe_session_get('react_time_game_active', False):
            logger.warning("Attempted to start game while already active")
            return jsonify({
                'success': False,
                'error': 'Game already active'
            }), 400
        
        # Generate random delay between 3-8 seconds for indicator
        indicator_delay = random.uniform(3.0, 8.0)
        start_time = time.time()
        indicator_time = start_time + indicator_delay
        
        # Set session variables
        if not safe_session_set('react_time_start_time', start_time):
            raise Exception("Failed to set start_time in session")
            
        if not safe_session_set('react_time_indicator_time', indicator_time):
            raise Exception("Failed to set indicator_time in session")
            
        if not safe_session_set('react_time_game_active', True):
            raise Exception("Failed to set game_active in session")
            
        if not safe_session_set('react_time_waiting_for_indicator', True):
            raise Exception("Failed to set waiting_for_indicator in session")
        
        logger.info(f"React time game started at {start_time}, indicator at {indicator_time} (delay: {indicator_delay:.2f}s)")
        
        return jsonify({
            'success': True,
            'start_time': start_time,
            'indicator_delay': indicator_delay,
            'message': 'Game started! Wait for the indicator then react as quickly as possible!',
            'leaderboard_available': LEADERBOARD_AVAILABLE
        })
        
    except Exception as e:
        logger.error(f"Error in start_game: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Clean up session state on error
        try:
            safe_session_set('react_time_game_active', False)
            safe_session_set('react_time_start_time', None)
            safe_session_set('react_time_indicator_time', None)
            safe_session_set('react_time_waiting_for_indicator', False)
        except:
            pass
        
        return jsonify({
            'success': False,
            'error': f"Failed to start game: {str(e)}",
            'leaderboard_available': LEADERBOARD_AVAILABLE
        }), 500

@react_time.route('/check_indicator', methods=['POST'])
def check_indicator():
    """API endpoint to check if indicator should be shown"""
    try:
        if not safe_session_get('react_time_game_active', False):
            return jsonify({
                'success': False,
                'error': 'No active game found'
            }), 400
        
        if not safe_session_get('react_time_waiting_for_indicator', False):
            return jsonify({
                'success': True,
                'show_indicator': False,
                'already_shown': True
            })
        
        current_time = time.time()
        indicator_time = safe_session_get('react_time_indicator_time')
        
        if indicator_time is None:
            return jsonify({
                'success': False,
                'error': 'Indicator time not found'
            }), 400
        
        should_show = current_time >= indicator_time
        
        if should_show:
            # Mark indicator as shown
            safe_session_set('react_time_waiting_for_indicator', False)
            logger.info(f"Indicator triggered at {current_time}")
        
        return jsonify({
            'success': True,
            'show_indicator': should_show,
            'current_time': current_time,
            'indicator_time': indicator_time
        })
        
    except Exception as e:
        logger.error(f"Error in check_indicator: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"Failed to check indicator: {str(e)}"
        }), 500

@react_time.route('/react', methods=['POST'])
def react():
    """API endpoint called when user reacts to indicator"""
    try:
        log_request_info('react')
        
        # Validate game state
        if not safe_session_get('react_time_game_active', False):
            logger.warning("Attempted to react but no active game")
            return jsonify({
                'success': False,
                'error': 'No active game found'
            }), 400
        
        # Check if indicator was shown
        if safe_session_get('react_time_waiting_for_indicator', False):
            logger.warning("User reacted before indicator was shown")
            return jsonify({
                'success': False,
                'error': 'Too early! Wait for the indicator.',
                'early_reaction': True
            }), 400
        
        reaction_time = time.time()
        indicator_time = safe_session_get('react_time_indicator_time')
        
        if indicator_time is None:
            logger.error("Indicator time not found")
            return jsonify({
                'success': False,
                'error': 'Indicator time not found - game state corrupted'
            }), 400
        
        # Calculate reaction time
        response_time = reaction_time - indicator_time
        
        # Validate response time (should be positive and reasonable)
        if response_time < 0:
            logger.warning(f"Negative response time: {response_time}")
            response_time = 0
        elif response_time > 10:  # Cap at 10 seconds
            logger.warning(f"Suspicious response time: {response_time}")
            response_time = 10
        
        # Determine if it's a win (within ±0.15 seconds tolerance)
        win_threshold = 0.15
        is_winner = response_time <= win_threshold
        
        logger.info(f"Reaction completed - Response time: {response_time:.3f}s, Winner: {is_winner}")
        
        # Update session statistics
        current_games = safe_session_get('react_time_games_played', 0)
        current_wins = safe_session_get('react_time_wins', 0)
        
        safe_session_set('react_time_games_played', current_games + 1)
        
        if is_winner:
            safe_session_set('react_time_wins', current_wins + 1)
        
        current_best = safe_session_get('react_time_best_score')
        
        # Best score is the fastest response time
        if current_best is None or response_time < current_best:
            safe_session_set('react_time_best_score', response_time)
        
        # Clear game session data
        safe_session_set('react_time_game_active', False)
        safe_session_set('react_time_start_time', None)
        safe_session_set('react_time_indicator_time', None)
        safe_session_set('react_time_waiting_for_indicator', False)
        
        # Submit to leaderboard
        leaderboard_success = False
        redirect_url = None
        leaderboard_error = None
        
        if LEADERBOARD_AVAILABLE:
            try:
                logger.info(f"Submitting to leaderboard: React Time, score: {response_time}")
                
                result = submit_score_lower_better(
                    game_name="React Time",
                    score=response_time,
                    score_type="reaction_seconds"
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
        else:
            leaderboard_error = f"Leaderboard system not available: {LEADERBOARD_ERROR}"
        
        # Create result message
        if is_winner:
            if response_time < 0.05:
                timing_message = f"LIGHTNING FAST! {response_time:.3f}s - Incredible reflexes!"
            elif response_time < 0.1:
                timing_message = f"EXCELLENT! {response_time:.3f}s - Great reaction time!"
            else:
                timing_message = f"GOOD! {response_time:.3f}s - Nice reflexes!"
        else:
            timing_message = f"Not bad! {response_time:.3f}s - Keep practicing!"
        
        # Prepare updated statistics
        stats = {
            'games_played': safe_session_get('react_time_games_played', 0),
            'best_score': safe_session_get('react_time_best_score'),
            'wins': safe_session_get('react_time_wins', 0)
        }
        
        response_data = {
            'success': True,
            'response_time': round(response_time, 3),
            'is_winner': is_winner,
            'timing_message': timing_message,
            'win_threshold': win_threshold,
            'stats': stats,
            'leaderboard_success': leaderboard_success,
            'redirect_url': redirect_url,
            'leaderboard_error': leaderboard_error,
            'leaderboard_available': LEADERBOARD_AVAILABLE
        }
        
        logger.info(f"Returning reaction results: {json.dumps({k: v for k, v in response_data.items() if k != 'stats'}, indent=2)}")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in react: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Clean up session state on error
        try:
            safe_session_set('react_time_game_active', False)
            safe_session_set('react_time_start_time', None)
            safe_session_set('react_time_indicator_time', None)
            safe_session_set('react_time_waiting_for_indicator', False)
        except:
            pass
        
        return jsonify({
            'success': False,
            'error': f"Failed to process reaction: {str(e)}",
            'leaderboard_available': LEADERBOARD_AVAILABLE
        }), 500

@react_time.route('/reset_stats', methods=['POST'])
def reset_stats():
    """API endpoint to reset player statistics"""
    try:
        log_request_info('reset_stats')
        
        # Reset all statistics
        safe_session_set('react_time_best_score', None)
        safe_session_set('react_time_games_played', 0)
        safe_session_set('react_time_wins', 0)
        safe_session_set('react_time_game_active', False)
        safe_session_set('react_time_start_time', None)
        safe_session_set('react_time_indicator_time', None)
        safe_session_set('react_time_waiting_for_indicator', False)
        
        logger.info("React time statistics reset")
        
        return jsonify({
            'success': True,
            'message': 'React time statistics reset successfully',
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

@react_time.route('/leaderboard')
def view_leaderboard():
    """View leaderboard for react time"""
    try:
        log_request_info('view_leaderboard')
        
        if not LEADERBOARD_AVAILABLE:
            error_msg = f'Leaderboard system not available: {LEADERBOARD_ERROR}'
            logger.warning(error_msg)
            flash(error_msg, 'error')
            return redirect(url_for('react_time.index'))
        
        try:
            logger.info("Redirecting to leaderboard for React Time")
            return redirect(url_for('leaderboard.view_game_leaderboard', game_name='React Time'))
        except Exception as e:
            error_msg = f'Error accessing leaderboard: {str(e)}'
            logger.error(error_msg)
            logger.error(f"Traceback: {traceback.format_exc()}")
            flash(error_msg, 'error')
            return redirect(url_for('react_time.index'))
            
    except Exception as e:
        logger.error(f"Error in view_leaderboard: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        flash(f'Unexpected error accessing leaderboard: {str(e)}', 'error')
        return redirect(url_for('react_time.index'))