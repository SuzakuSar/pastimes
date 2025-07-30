# File: website/dino_runner/dino_runner.py
from flask import Blueprint, render_template, session, jsonify, request
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
    """Save high score to session"""
    try:
        data = request.get_json()
        score = int(data.get('score', 0))
        
        if score > session.get('dino_high_score', 0):
            session['dino_high_score'] = score
            session.permanent = True
            return jsonify({'new_record': True, 'high_score': score})
        
        return jsonify({'new_record': False, 'high_score': session['dino_high_score']})
    
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