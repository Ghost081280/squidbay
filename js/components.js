/**
 * SquidBay Components System
 * Loads reusable nav, footer, chatbot, and UI components
 */

(function() {
    'use strict';

    // Component paths
    const COMPONENTS = {
        nav: 'components/nav.html',
        footer: 'components/footer.html',
        chatbot: 'components/chatbot.html'
    };
    
    // Chatbot assets
    const CHATBOT_CSS = 'components/chatbot.css';
    const CHATBOT_JS = 'components/chatbot.js';

    // Current page detection
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

    /**
     * Load HTML component into placeholder
     */
    async function loadComponent(name, targetId) {
        const target = document.getElementById(targetId);
        if (!target) return;

        try {
            const response = await fetch(COMPONENTS[name]);
            if (!response.ok) throw new Error(`Failed to load ${name}`);
            const html = await response.text();
            target.innerHTML = html;
            
            // Post-load processing
            if (name === 'nav') {
                initNavigation();
            }
            if (name === 'footer') {
                initFooter();
            }
        } catch (error) {
            console.warn(`Component ${name} not loaded:`, error.message);
            // Fallback - keep existing content
        }
    }

    /**
     * Initialize navigation
     */
    function initNavigation() {
        // Highlight active nav link
        const navLinks = document.querySelectorAll('[data-nav]');
        navLinks.forEach(link => {
            if (link.dataset.nav === currentPage) {
                link.classList.add('active');
            }
        });

        // Initialize scroll progress
        initScrollProgress();
    }

    /**
     * Initialize footer
     */
    function initFooter() {
        // Initialize back to top button
        initBackToTop();
    }

    /**
     * Mobile menu toggle (slides from right)
     */
    window.toggleMobileMenu = function() {
        const menu = document.getElementById('mobile-menu');
        const body = document.body;
        
        if (menu) {
            menu.classList.toggle('open');
            body.classList.toggle('menu-open');
        }
    };

    /**
     * Close mobile menu on escape key
     */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const menu = document.getElementById('mobile-menu');
            if (menu && menu.classList.contains('open')) {
                toggleMobileMenu();
            }
        }
    });

    /**
     * Initialize horizontal scroll progress bar
     */
    function initScrollProgress() {
        const progressBar = document.getElementById('scroll-progress');
        if (!progressBar) return;

        function updateProgress() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBar.style.width = progress + '%';
        }

        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    /**
     * Initialize back to top button
     */
    function initBackToTop() {
        const btn = document.getElementById('back-to-top');
        if (!btn) return;

        function toggleVisibility() {
            if (window.scrollY > 300) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }

        window.addEventListener('scroll', toggleVisibility, { passive: true });
        toggleVisibility();
    }

    /**
     * Smooth scroll to top
     */
    window.scrollToTop = function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    /**
     * Initialize all components on DOM ready
     */
    function init() {
        // Check if we should use component system
        const navPlaceholder = document.getElementById('nav-placeholder');
        const footerPlaceholder = document.getElementById('footer-placeholder');

        if (navPlaceholder) {
            loadComponent('nav', 'nav-placeholder');
        } else {
            // Initialize existing nav
            initNavigation();
            initScrollProgress();
        }

        if (footerPlaceholder) {
            loadComponent('footer', 'footer-placeholder');
        } else {
            // Initialize existing footer elements
            initBackToTop();
        }

        // Add scroll progress bar if not present
        if (!document.getElementById('scroll-progress')) {
            const progressBar = document.createElement('div');
            progressBar.className = 'scroll-progress';
            progressBar.id = 'scroll-progress';
            document.body.prepend(progressBar);
            initScrollProgress();
        }
        
        // Load chatbot component
        loadChatbot();
    }
    
    /**
     * Load chatbot component (HTML, CSS, JS)
     */
    async function loadChatbot() {
        console.log('SquidBot: Starting load...');
        
        try {
            // Load chatbot CSS
            const linkEl = document.createElement('link');
            linkEl.rel = 'stylesheet';
            linkEl.href = CHATBOT_CSS;
            linkEl.onload = () => console.log('SquidBot: CSS loaded');
            linkEl.onerror = () => console.error('SquidBot: CSS failed to load');
            document.head.appendChild(linkEl);
            
            // Load chatbot HTML
            console.log('SquidBot: Fetching HTML from', COMPONENTS.chatbot);
            const response = await fetch(COMPONENTS.chatbot);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const html = await response.text();
            console.log('SquidBot: HTML fetched, length:', html.length);
            
            // Insert chatbot before closing body tag
            const chatbotContainer = document.createElement('div');
            chatbotContainer.id = 'chatbot-component';
            chatbotContainer.innerHTML = html;
            document.body.appendChild(chatbotContainer);
            console.log('SquidBot: HTML inserted into DOM');
            
            // Verify elements exist
            const btn = document.getElementById('squidbotBtn');
            const win = document.getElementById('squidbotWindow');
            console.log('SquidBot: Elements found - btn:', !!btn, 'window:', !!win);
            
            // Load chatbot JS
            const scriptEl = document.createElement('script');
            scriptEl.src = CHATBOT_JS;
            scriptEl.onload = function() {
                console.log('SquidBot: JS loaded');
                // Dispatch event for chatbot init
                document.dispatchEvent(new CustomEvent('squidbay:components-loaded'));
                
                // Show chatbot button after a short delay
                setTimeout(function() {
                    if (typeof showChatbotButton === 'function') {
                        showChatbotButton();
                        console.log('SquidBot: Button shown');
                    } else {
                        console.warn('SquidBot: showChatbotButton function not found');
                    }
                }, 500);
            };
            scriptEl.onerror = function() {
                console.error('SquidBot: JS failed to load from', CHATBOT_JS);
            };
            document.body.appendChild(scriptEl);
            
            console.log('SquidBot: Component loading initiated');
        } catch (error) {
            console.error('SquidBot: Load error -', error.message);
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
