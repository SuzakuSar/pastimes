/**
 * YouTube-inspired Gaming Hub Layout JavaScript
 * Implementation of Phase 1: Layout & Visual Foundation
 * Handles sidebar toggle, search functionality, and responsive behavior
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const sidebar = document.getElementById('hubSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const searchInput = document.getElementById('searchInput');
    const gamesGrid = document.getElementById('gamesGrid');
    const main = document.getElementById('hubMain');
    
    // State management
    let sidebarOpen = window.innerWidth >= 640; // Open by default on desktop
    let searchTimeout = null;
    
    // ===== SIDEBAR FUNCTIONALITY =====
    
    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
        updateSidebarState();
    }
    
    function updateSidebarState() {
        if (sidebarOpen) {
            sidebar.classList.add('open');
            sidebarToggle.setAttribute('aria-expanded', 'true');
        } else {
            sidebar.classList.remove('open');
            sidebarToggle.setAttribute('aria-expanded', 'false');
        }
        
        // Store preference for session
        sessionStorage.setItem('sidebarOpen', sidebarOpen.toString());
    }
    
    function initializeSidebar() {
        // Restore sidebar state from session storage
        const savedState = sessionStorage.getItem('sidebarOpen');
        if (savedState !== null) {
            sidebarOpen = savedState === 'true';
        }
        
        updateSidebarState();
        
        // Add event listener for toggle button
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', toggleSidebar);
        }
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(event) {
            if (window.innerWidth < 640 && 
                sidebarOpen && 
                !sidebar.contains(event.target) && 
                !sidebarToggle.contains(event.target)) {
                sidebarOpen = false;
                updateSidebarState();
            }
        });
    }
    
    // ===== SEARCH FUNCTIONALITY =====
    
    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        const gameCards = gamesGrid.querySelectorAll('.game-card');
        const emptyState = document.querySelector('.empty-state');
        let visibleCount = 0;
        
        // Filter game cards
        gameCards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const description = card.querySelector('.card-description').textContent.toLowerCase();
            const category = card.dataset.category.toLowerCase();
            
            const isMatch = !query || 
                           title.includes(query) || 
                           description.includes(query) || 
                           category.includes(query);
            
            if (isMatch) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Update game count
        const gameCount = document.querySelector('.game-count');
        if (gameCount) {
            gameCount.textContent = `${visibleCount} games`;
        }
        
        // Show/hide empty state
        if (emptyState) {
            if (visibleCount === 0 && query) {
                emptyState.style.display = 'block';
                emptyState.querySelector('.empty-title').textContent = 'No games found';
                emptyState.querySelector('.empty-message').textContent = 
                    `Try a different search term or browse categories.`;
            } else {
                emptyState.style.display = 'none';
            }
        }
        
        // Update URL without reloading page
        const url = new URL(window.location);
        if (query) {
            url.searchParams.set('search', query);
        } else {
            url.searchParams.delete('search');
        }
        window.history.replaceState({}, '', url);
    }
    
    function initializeSearch() {
        if (searchInput) {
            // Handle input with debouncing
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(handleSearch, 300);
            });
            
            // Handle search button click
            const searchButton = document.querySelector('.search-button');
            if (searchButton) {
                searchButton.addEventListener('click', handleSearch);
            }
            
            // Handle Enter key
            searchInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSearch();
                }
            });
        }
    }
    
    // ===== RESPONSIVE BEHAVIOR =====
    
    function handleResize() {
        const width = window.innerWidth;
        
        // Auto-close sidebar on mobile, auto-open on desktop
        if (width < 640 && sidebarOpen) {
            sidebarOpen = false;
            updateSidebarState();
        } else if (width >= 1024 && !sidebarOpen) {
            sidebarOpen = true;
            updateSidebarState();
        }
    }
    
    function initializeResponsive() {
        // Add resize listener with debouncing
        let resizeTimeout = null;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 150);
        });
    }
    
    // ===== CARD INTERACTIONS =====
    
    function initializeCardInteractions() {
        const gameCards = document.querySelectorAll('.game-card');
        
        gameCards.forEach(card => {
            // Add hover effect for better feedback
            card.addEventListener('mouseenter', function() {
                if (window.innerWidth >= 1024) { // Only on desktop
                    this.style.transform = 'translateY(-4px)';
                }
            });
            
            card.addEventListener('mouseleave', function() {
                if (window.innerWidth >= 1024) { // Only on desktop
                    this.style.transform = 'translateY(0)';
                }
            });
            
            // Handle card click (placeholder for future game navigation)
            card.addEventListener('click', function(event) {
                // Don't trigger if clicking on buttons
                if (event.target.closest('button')) {
                    return;
                }
                
                const title = this.querySelector('.card-title').textContent;
                console.log(`Clicked on game: ${title}`);
                // Future: Navigate to game page
            });
        });
        
        // Handle save button clicks
        const saveButtons = document.querySelectorAll('.btn-save');
        saveButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.stopPropagation();
                const card = this.closest('.game-card');
                const title = card.querySelector('.card-title').textContent;
                
                // Toggle saved state (placeholder)
                if (this.textContent === '💾') {
                    this.textContent = '❤️';
                    this.style.background = 'var(--accent-secondary)';
                    this.style.color = 'var(--primary-bg)';
                    console.log(`Saved game: ${title}`);
                } else {
                    this.textContent = '💾';
                    this.style.background = '';
                    this.style.color = '';
                    console.log(`Unsaved game: ${title}`);
                }
            });
        });
        
        // Handle play button clicks
        const playButtons = document.querySelectorAll('.btn-play');
        playButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.stopPropagation();
                const card = this.closest('.game-card');
                const title = card.querySelector('.card-title').textContent;
                console.log(`Play game: ${title}`);
                // Future: Navigate to game page
            });
        });
    }
    
    // ===== NAVIGATION HIGHLIGHTING =====
    
    function initializeNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const currentCategory = new URLSearchParams(window.location.search).get('category') || 'Home';
        
        navLinks.forEach(link => {
            const category = link.dataset.category;
            if (category === currentCategory) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // ===== ACCESSIBILITY ENHANCEMENTS =====
    
    function initializeAccessibility() {
        // Keyboard navigation for sidebar toggle
        if (sidebarToggle) {
            sidebarToggle.addEventListener('keydown', function(event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleSidebar();
                }
            });
        }
        
        // Focus management for modal-like behavior on mobile
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && window.innerWidth < 640 && sidebarOpen) {
                sidebarOpen = false;
                updateSidebarState();
                if (sidebarToggle) {
                    sidebarToggle.focus();
                }
            }
        });
        
        // Skip link for keyboard users
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'sr-only';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--accent-primary);
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 10000;
        `;
        
        skipLink.addEventListener('focus', function() {
            this.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', function() {
            this.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add main content ID for skip link
        if (main) {
            main.id = 'main-content';
        }
    }
    
    // ===== PERFORMANCE OPTIMIZATIONS =====
    
    function initializePerformance() {
        // Lazy load images when they come into view
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver(function(entries) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const placeholder = entry.target;
                        // Future: Replace with actual image loading
                        placeholder.style.background = 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';
                        imageObserver.unobserve(placeholder);
                    }
                });
            });
            
            document.querySelectorAll('.thumbnail-placeholder').forEach(placeholder => {
                imageObserver.observe(placeholder);
            });
        }
    }
    
    // ===== INITIALIZATION =====
    
    function initialize() {
        initializeSidebar();
        initializeSearch();
        initializeResponsive();
        initializeCardInteractions();
        initializeNavigation();
        initializeAccessibility();
        initializePerformance();
        
        // Mark as ready
        document.body.classList.add('hub-ready');
        console.log('Gaming Hub Layout initialized successfully');
    }
    
    // Start initialization
    initialize();
    
    // ===== DEBUGGING HELPERS =====
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.hubDebug = {
            toggleSidebar,
            handleSearch,
            sidebarOpen: () => sidebarOpen,
            version: '1.0.0'
        };
        console.log('Debug helpers available: window.hubDebug');
    }
});