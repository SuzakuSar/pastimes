#!/usr/bin/env python3
"""
SummerLockIn Development Environment Setup Script

This script sets up the enhanced development environment with optional tools
for improved game development, code quality, and testing.

Usage:
    python setup-dev.py [--minimal] [--full] [--frontend-only]
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(command, description="", check=True):
    """Run a command and handle errors gracefully."""
    print(f"🔄 {description or command}")
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True)
        if result.stdout:
            print(f"✅ {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e.stderr.strip() if e.stderr else str(e)}")
        return False


def check_requirements():
    """Check if basic requirements are met."""
    print("🔍 Checking requirements...")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {sys.version.split()[0]} detected")
    
    # Check if in virtual environment
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Warning: Not in a virtual environment. Consider activating venv first.")
    else:
        print("✅ Virtual environment detected")
    
    return True


def setup_python_dev_tools():
    """Install Python development tools."""
    print("\n📦 Installing Python development tools...")
    
    commands = [
        ("pip install -r requirements.txt", "Installing core dependencies"),
        ("pip install -r requirements-dev.txt", "Installing development dependencies"),
        ("pre-commit install", "Setting up git hooks"),
    ]
    
    for command, description in commands:
        if not run_command(command, description):
            return False
    
    return True


def setup_frontend_tools():
    """Install frontend development tools."""
    print("\n🎨 Setting up frontend development tools...")
    
    # Check if npm is available
    if not run_command("npm --version", "Checking npm", check=False):
        print("⚠️  npm not found. Skipping frontend tools.")
        print("   Install Node.js from https://nodejs.org/ to use frontend tools")
        return True
    
    commands = [
        ("npm install", "Installing frontend dependencies"),
    ]
    
    for command, description in commands:
        if not run_command(command, description):
            return False
    
    return True


def setup_database():
    """Initialize the database."""
    print("\n🗄️  Setting up database...")
    return run_command(
        'python -c "from website.leaderboard.leaderboard import init_database; init_database()"',
        "Initializing database"
    )


def create_dev_scripts():
    """Create convenient development scripts."""
    print("\n📝 Creating development scripts...")
    
    # Create a development runner script
    dev_script_content = """#!/usr/bin/env python3
\"\"\"
Development server with auto-reload and enhanced features
\"\"\"
import subprocess
import sys
from pathlib import Path

def main():
    print("🚀 Starting SummerLockIn development server...")
    print("   Server: http://localhost:5000")
    print("   Press Ctrl+C to stop")
    
    try:
        subprocess.run([
            sys.executable, "-m", "flask", 
            "--app", "app", "run", 
            "--debug", "--reload", "--host", "0.0.0.0"
        ], check=True)
    except KeyboardInterrupt:
        print("\\n🛑 Development server stopped")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
"""
    
    with open("dev-server.py", "w") as f:
        f.write(dev_script_content)
    
    print("✅ Created dev-server.py")
    return True


def print_next_steps():
    """Print helpful next steps for developers."""
    print("\n🎉 Development environment setup complete!")
    print("\n📋 Next steps:")
    print("   1. Start development server:")
    print("      python dev-server.py")
    print("      OR")
    print("      python -m flask --app app run --debug --reload")
    print("\n   2. Run code quality checks:")
    print("      pre-commit run --all-files")
    print("      black .")
    print("      flake8 .")
    print("\n   3. Frontend development (if npm installed):")
    print("      npm run sass        # Watch Sass files")
    print("      npm run dev          # Live browser reload")
    print("\n   4. Testing:")
    print("      pytest")
    print("      pytest --cov=website")
    print("\n   5. Game development with Phaser.js:")
    print("      Check CLAUDE.md for Phaser.js integration examples")
    print("\n🔗 Useful commands:")
    print("   Format code:     black . && isort .")
    print("   Type checking:   mypy .")
    print("   Security scan:   bandit -r .")
    print("   All quality:     pre-commit run --all-files")


def main():
    """Main setup function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Setup SummerLockIn development environment")
    parser.add_argument("--minimal", action="store_true", help="Install only core tools")
    parser.add_argument("--full", action="store_true", help="Install all tools including frontend")
    parser.add_argument("--frontend-only", action="store_true", help="Install only frontend tools")
    
    args = parser.parse_args()
    
    print("🎮 SummerLockIn Development Environment Setup")
    print("=" * 50)
    
    if not check_requirements():
        sys.exit(1)
    
    success = True
    
    if not args.frontend_only:
        if not setup_python_dev_tools():
            success = False
        
        if not setup_database():
            success = False
        
        if not create_dev_scripts():
            success = False
    
    if args.full or args.frontend_only:
        if not setup_frontend_tools():
            success = False
    
    if success:
        print_next_steps()
    else:
        print("\n❌ Setup completed with some errors. Check the output above.")
        sys.exit(1)


if __name__ == "__main__":
    main()