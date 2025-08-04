# Ultra Secret Admin System - CLAUDE_CODE_KING Edition
import os
import hashlib
import time
from functools import wraps
from flask import request, abort, session, render_template_string, redirect, url_for

def ultra_secure_admin_required(f):
    """Ultra secure admin decorator with multiple security layers"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Layer 1: Check if route should even exist
        if not os.environ.get('ENABLE_ADMIN_ROUTES'):
            abort(404)
        
        # Layer 2: Time-based access (only certain hours)
        current_hour = time.gmtime().tm_hour
        allowed_hours = [20, 21, 22, 23, 0, 1, 2]  # 8PM-2AM UTC
        if current_hour not in allowed_hours and os.environ.get('RESTRICT_ADMIN_HOURS') == 'true':
            abort(404)
        
        # Layer 3: Secret key check
        provided_key = request.headers.get('X-Ultra-Secret') or request.args.get('ultra_key')
        expected_key = os.environ.get('ULTRA_SECRET_KEY')
        if not provided_key or provided_key != expected_key:
            abort(404)
        
        # Layer 4: Developer session check
        if not session.get('developer_authenticated'):
            return redirect_to_dev_auth()
        
        # Layer 5: Rate limiting (max 10 requests per hour)
        admin_requests = session.get('admin_requests', [])
        current_time = time.time()
        admin_requests = [req for req in admin_requests if current_time - req < 3600]
        if len(admin_requests) >= 10:
            abort(429)  # Too many requests
        
        admin_requests.append(current_time)
        session['admin_requests'] = admin_requests
        
        return f(*args, **kwargs)
    return decorated_function

def redirect_to_dev_auth():
    """Redirect to developer authentication"""
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>System Access</title>
        <style>
            body { 
                background: #000; 
                color: #0f0; 
                font-family: 'Courier New', monospace; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0;
            }
            .terminal {
                border: 1px solid #0f0;
                padding: 20px;
                background: rgba(0,255,0,0.1);
                max-width: 400px;
            }
            input, button {
                background: #000;
                color: #0f0;
                border: 1px solid #0f0;
                padding: 10px;
                font-family: inherit;
                width: 100%;
                margin: 5px 0;
            }
            button:hover { background: rgba(0,255,0,0.2); }
            .blink { animation: blink 1s infinite; }
            @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        </style>
    </head>
    <body>
        <div class="terminal">
            <div>SYSTEM ACCESS REQUIRED</div>
            <div class="blink">></div>
            <form method="post" action="/dev/authenticate">
                <input type="password" name="dev_password" placeholder="ENTER DEVELOPER CODE" required autofocus>
                <input type="hidden" name="return_url" value="{{ request.url }}">
                <button type="submit">AUTHENTICATE</button>
            </form>
        </div>
    </body>
    </html>
    ''')

# Developer authentication route
def setup_dev_auth_route(app):
    @app.route('/dev/authenticate', methods=['POST'])
    def dev_authenticate():
        password = request.form.get('dev_password')
        return_url = request.form.get('return_url', '/admin')
        
        # Multiple password options
        valid_passwords = [
            os.environ.get('DEV_PASSWORD_1'),
            os.environ.get('DEV_PASSWORD_2'),
            hashlib.sha256((os.environ.get('MASTER_KEY', '') + str(time.gmtime().tm_yday)).encode()).hexdigest()[:16]  # Daily changing password
        ]
        
        if password in valid_passwords and password:
            session['developer_authenticated'] = True
            session['dev_auth_time'] = time.time()
            session.permanent = True
            return redirect(return_url)
        
        time.sleep(2)  # Slow down brute force
        abort(404)

# Example usage in app.py:
"""
from ultra_secret_admin import ultra_secure_admin_required, setup_dev_auth_route

# Set up the auth route
setup_dev_auth_route(app)

@app.route('/sys/internal/db/maintenance/<path:operation>')
@ultra_secure_admin_required
def ultra_secret_admin(operation):
    if operation == 'cleanup-old-data':
        return handle_database_cleanup()
    elif operation == 'view-stats':
        return show_admin_stats()
    else:
        abort(404)

# Environment variables to set on Render:
# ENABLE_ADMIN_ROUTES=true
# ULTRA_SECRET_KEY=your-ultra-secret-key-here
# DEV_PASSWORD_1=your-dev-password
# DEV_PASSWORD_2=backup-password
# MASTER_KEY=master-key-for-daily-passwords
# RESTRICT_ADMIN_HOURS=true (optional)
"""