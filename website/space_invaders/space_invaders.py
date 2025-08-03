from flask import Blueprint, render_template, request, session, redirect, url_for, flash, jsonify
from website.leaderboard.leaderboard import submit_score_higher_better

space_invaders = Blueprint('space_invaders', __name__, template_folder='templates')

@space_invaders.route('/')
def index():
    return render_template('space_invaders.html')

@space_invaders.route('/test')
def test():
    return render_template('test_simple.html')

@space_invaders.route('/submit_score', methods=['POST'])
def submit_score():
    try:
        data = request.get_json()
        score = int(data.get('score', 0))
        
        if score <= 0:
            return jsonify({'success': False, 'error': 'Invalid score'})
        
        session['game_score'] = score
        session['game_name'] = 'Space Invaders'
        
        result = submit_score_higher_better("Space Invaders", score, "points")
        
        return jsonify({
            'success': True,
            'redirect_url': result['redirect_url']
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})