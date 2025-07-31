# Database Cleanup Instructions

## Local Database (Already Done ✅)
The old "React Mode" and "Predict Mode" entries have been removed from your local database.

**Removed:**
- 3 leaderboard entries
- 2 game configurations

**Remaining games:**
- Cosmic Dino Runner
- React Time  
- Time Predict

## Render Deployment Database Cleanup

Since Render uses persistent disk storage, you have several options to clear the old data:

### Option 1: Add a Database Cleanup Route (Recommended)
Add a temporary admin route to clean up data on Render:

```python
# Add to app.py temporarily
@app.route('/admin/cleanup-database', methods=['POST'])
def cleanup_database():
    """TEMPORARY: Clean up old React/Predict Mode entries"""
    if request.method == 'POST' and request.form.get('confirm') == 'DELETE_OLD_DATA':
        try:
            from website.leaderboard.leaderboard import get_db_connection
            
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Delete old entries
                cursor.execute('DELETE FROM leaderboard_entries WHERE game_name LIKE "%React Mode%" OR game_name LIKE "%Predict Mode%"')
                entries_deleted = cursor.rowcount
                
                cursor.execute('DELETE FROM game_configs WHERE game_name LIKE "%React Mode%" OR game_name LIKE "%Predict Mode%"')
                configs_deleted = cursor.rowcount
                
                conn.commit()
                
                return f"Cleanup complete! Deleted {entries_deleted} entries and {configs_deleted} configs."
                
        except Exception as e:
            return f"Error: {e}"
    
    return '''
    <form method="POST">
        <h2>⚠️ Database Cleanup</h2>
        <p>This will permanently delete old "React Mode" and "Predict Mode" entries.</p>
        <input type="text" name="confirm" placeholder="Type: DELETE_OLD_DATA" required>
        <button type="submit" style="background: red; color: white; padding: 10px;">Delete Old Data</button>
    </form>
    '''
```

**Steps:**
1. Add the above route to `app.py`
2. Deploy to Render
3. Visit `https://your-app.onrender.com/admin/cleanup-database`
4. Type "DELETE_OLD_DATA" and click the button
5. Remove the route from `app.py` and redeploy

### Option 2: Use Render Shell Access
1. Go to your Render dashboard
2. Select your web service
3. Go to "Shell" tab
4. Run Python commands directly:

```bash
python3 -c "
import sqlite3
conn = sqlite3.connect('/opt/render/project/data/leaderboards.db')
cursor = conn.cursor()
cursor.execute('DELETE FROM leaderboard_entries WHERE game_name LIKE \"%React Mode%\" OR game_name LIKE \"%Predict Mode%\"')
cursor.execute('DELETE FROM game_configs WHERE game_name LIKE \"%React Mode%\" OR game_name LIKE \"%Predict Mode%\"')
conn.commit()
conn.close()
print('Cleanup complete!')
"
```

### Option 3: Fresh Database (Nuclear Option)
If you want to start completely fresh:

1. In Render shell, delete the database file:
```bash
rm /opt/render/project/data/leaderboards.db
```

2. Restart your service - the database will be recreated empty

### Option 4: Environment Variable Flag
Add a cleanup flag that runs once on startup:

```python
# In website/__init__.py
import os

def create_app():
    # ... existing code ...
    
    # One-time cleanup on Render
    if os.environ.get('CLEANUP_OLD_DATA') == 'true':
        cleanup_old_leaderboard_data()
        # Remove the environment variable after cleanup
    
    return app

def cleanup_old_leaderboard_data():
    """One-time cleanup of old data"""
    try:
        from website.leaderboard.leaderboard import get_db_connection
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM leaderboard_entries WHERE game_name LIKE "%React Mode%" OR game_name LIKE "%Predict Mode%"')
            cursor.execute('DELETE FROM game_configs WHERE game_name LIKE "%React Mode%" OR game_name LIKE "%Predict Mode%"')
            conn.commit()
            print("✅ Old leaderboard data cleaned up")
    except Exception as e:
        print(f"❌ Cleanup error: {e}")
```

Then set `CLEANUP_OLD_DATA=true` in Render environment variables, deploy, then remove the variable.

## Recommended Approach
**Option 1** (cleanup route) is the safest and easiest to verify. You can see exactly what gets deleted and remove the route afterward.