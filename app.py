from website import create_app
import os
from flask import Flask, render_template, url_for, request, jsonify, session, redirect, g

app = create_app()

# Production-ready configuration
app.secret_key = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')

# Only enable debug mode in development
DEBUG_MODE = os.environ.get('FLASK_ENV') == 'development'

if __name__ == "__main__":
    app.run(debug=DEBUG_MODE, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
