# Read the JavaScript file
with open('website/test_home/static/js/test_layout.js', 'r') as f:
    content = f.read()

# Add the dynamic spacing function
dynamic_spacing_function = '''
    
    function updateDynamicSpacing() {
        const root = document.documentElement;
        
        // Determine spacing based on sidebar state and screen size
        let leftMargin, rightMargin;
        
        if (window.innerWidth < 640) {
            // Mobile: minimal margins
            leftMargin = 'var(--space-sm)';
            rightMargin = 'var(--space-sm)';
        } else if (sidebarCollapsed) {
            // Desktop with collapsed sidebar: minimal edge margins
            leftMargin = 'var(--space-sm)';
            rightMargin = 'var(--space-sm)';
        } else {
            // Desktop with expanded sidebar: normal margins
            leftMargin = 'var(--space-md)';
            rightMargin = 'var(--space-md)';
        }
        
        // Update CSS custom properties
        root.style.setProperty('--content-margin-left', leftMargin);
        root.style.setProperty('--content-margin-right', rightMargin);
    }'''

# Insert the new function after updateSidebarState
content = content.replace(
    '    function initializeSidebar() {',
    dynamic_spacing_function + '\n    \n    function initializeSidebar() {'
)

# Add updateDynamicSpacing call to updateSidebarState function
content = content.replace(
    '    function updateSidebarState() {\n        const topSearchHeader = document.querySelector(\'.top-search-header\');',
    '    function updateSidebarState() {\n        const topSearchHeader = document.querySelector(\'.top-search-header\');\n        \n        // Update dynamic spacing based on sidebar state\n        updateDynamicSpacing();'
)

# Write the updated content
with open('website/test_home/static/js/test_layout.js', 'w') as f:
    f.write(content)

print('JavaScript updated successfully\!')
EOF < /dev/null
