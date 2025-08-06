import re

# Read the CSS file
with open(r'C:\Users\wpr3859\Desktop\PersonalProjects\pastimes\website\test_home\static\css\test_layout.css', 'r') as f:
    content = f.read()

# 1. Add dynamic spacing properties after --transition-base
content = re.sub(r'(--transition-base: 0\.3s ease;)', 
                r'\1\n\n  /* Dynamic content spacing - updates based on sidebar state */\n  --content-margin-left: var(--space-md);\n  --content-margin-right: var(--space-md);', 
                content)

# 2. Convert games grid from grid to flex horizontal scrolling
games_grid_old = r'''\.games-grid \{
  display: grid;
  /\* Crazy Games style: smaller cards, minimal gap for density \*/
  grid-template-columns: repeat\(auto-fill, minmax\(220px, 1fr\)\);
  gap: var\(--space-md\);
  max-width: 1400px;
  margin: 0 auto;
\}'''

games_grid_new = r'''.games-grid {
  display: flex;
  /* Horizontal scrolling for games */
  flex-direction: row;
  gap: var(--space-md);
  overflow-x: auto;
  padding-bottom: var(--space-xs);
  scrollbar-width: thin;
  scrollbar-color: var(--accent-primary) transparent;
  max-width: 1400px;
  margin: 0 auto;
  margin-left: var(--content-margin-left);
  margin-right: var(--content-margin-right);
}

.games-grid::-webkit-scrollbar {
  height: 4px;
}

.games-grid::-webkit-scrollbar-track {
  background: transparent;
}

.games-grid::-webkit-scrollbar-thumb {
  background: var(--accent-primary);
  border-radius: 2px;
}'''

content = re.sub(games_grid_old, games_grid_new, content, flags=re.MULTILINE)

# 3. Add fixed width to game cards for horizontal scrolling
game_card_pattern = r'(\.game-card \{[^}]*cursor: pointer;)'
game_card_replacement = r'\1\n  flex-shrink: 0;\n  width: 220px;'
content = re.sub(game_card_pattern, game_card_replacement, content)

# 4. Update section header to use dynamic margins
section_header_pattern = r'(\.section-header \{[^}]*margin-right: auto;)'
section_header_replacement = r'\1\n  margin-left: var(--content-margin-left);\n  margin-right: var(--content-margin-right);'
content = re.sub(section_header_pattern, section_header_replacement, content)

# 5. Fix responsive design - change grid properties to flex in media queries
# Large desktop
content = re.sub(r'grid-template-columns: repeat\(auto-fill, minmax\(240px, 1fr\)\);', 
                'flex-direction: row;', content)

# Desktop
content = re.sub(r'grid-template-columns: repeat\(auto-fill, minmax\(220px, 1fr\)\);', 
                'flex-direction: row;', content)

# Tablets 
content = re.sub(r'grid-template-columns: repeat\(auto-fill, minmax\(200px, 1fr\)\);', 
                'flex-direction: row;', content)

# Small tablets
content = re.sub(r'grid-template-columns: repeat\(auto-fill, minmax\(240px, 1fr\)\);', 
                'flex-direction: row;', content)

# Mobile - keep as single column but still flex
content = re.sub(r'grid-template-columns: 1fr;', 
                'flex-direction: column;', content)

# Write the updated content
with open(r'C:\Users\wpr3859\Desktop\PersonalProjects\pastimes\website\test_home\static\css\test_layout.css', 'w') as f:
    f.write(content)

print("CSS updated successfully\!")
EOF < /dev/null
