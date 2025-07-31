# File: website/dino_runner/dino_runner.py
from flask import Blueprint, render_template, session, jsonify, request, redirect, url_for
from website.leaderboard.leaderboard import submit_score_higher_better
import random

dino_runner = Blueprint('dino_runner', __name__, template_folder='templates')

@dino_runner.route('/')
def index():
    """Main dinosaur runner game page"""
    # Initialize session data if not exists
    if 'dino_high_score' not in session:
        session['dino_high_score'] = 0
    
    return render_template('dino_runner.html', high_score=session['dino_high_score'])

@dino_runner.route('/save-score', methods=['POST'])
def save_score():
    """Save high score and submit to leaderboard"""
    try:
        data = request.get_json()
        score = int(data.get('score', 0))
        
        # Update session high score
        is_new_record = score > session.get('dino_high_score', 0)
        if is_new_record:
            session['dino_high_score'] = score
            session.permanent = True
        
        # Submit to leaderboard system
        result = submit_score_higher_better("Cosmic Dino Runner", score, "points")
        
        return jsonify({
            'new_record': is_new_record,
            'high_score': session.get('dino_high_score', 0),
            'leaderboard_result': result
        })
        
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid score'}), 400

@dino_runner.route('/reset-score', methods=['POST'])
def reset_score():
    """Reset high score"""
    session['dino_high_score'] = 0
    return jsonify({'high_score': 0})

@dino_runner.route('/get-obstacles')
def get_obstacles():
    """Generate random obstacle pattern for variety"""
    obstacles = []
    for i in range(5):
        obstacle_type = random.choice(['cactus_small', 'cactus_large', 'bird'])
        obstacles.append({
            'type': obstacle_type,
            'spacing': random.randint(150, 300)
        })
    return jsonify({'obstacles': obstacles})

@dino_runner.route('/leaderboard')
def leaderboard():
    """Get leaderboard widget HTML"""
    try:
        from website.leaderboard.leaderboard import get_leaderboard
        leaderboard_data = get_leaderboard("Cosmic Dino Runner", limit=5)
        
        # Create simple HTML widget
        html = '<div style="background: rgba(0,0,0,0.1); border-radius: 10px; padding: 1rem; margin-top: 1rem;">'
        html += '<h4 style="color: rgba(255,255,255,0.9); margin: 0 0 0.5rem 0;">🏆 Top Scores</h4>'
        
        if leaderboard_data and leaderboard_data.get('scores'):
            html += '<div style="font-size: 0.9rem;">'
            for i, entry in enumerate(leaderboard_data['scores']):
                if i >= 5:  # Limit to top 5
                    break
                medal = ['🥇', '🥈', '🥉'][i] if i < 3 else '🏅'
                html += f'<div style="color: rgba(255,255,255,0.8); margin: 0.2rem 0;">{medal} {entry["username"]}: {entry["score"]:,}</div>'
            html += '</div>'
        else:
            html += '<div style="color: rgba(255,255,255,0.6); font-style: italic;">No scores yet. Be the first!</div>'
        
        html += '</div>'
        return jsonify({'html': html})
    except Exception as e:
        return jsonify({'error': str(e)}), 500