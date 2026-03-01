/**
 * SquidBay Components System
 * Loads reusable nav, footer, chatbot, and UI components
 * Subdomain-aware: rewrites paths when running on subdomains (e.g. agent.squidbay.io)
 */

(function() {
    'use strict';

    // Subdomain detection — anything not squidbay.io or www.squidbay.io is a subdomain
    const hostname = window.location.hostname;
    const isSubdomain = hostname !== 'squidbay.io' && hostname !== 'www.squidbay.io' && hostname.endsWith('squidbay.io');
    const ORIGIN = isSubdomain ? 'https://squidbay.io' : '';

    // Component paths — prefixed with origin when on subdomain
    const COMPONENTS = {
        nav: ORIGIN + '/components/nav.html',
        footer: ORIGIN + '/components/footer.html',
        chatbot: ORIGIN + '/components/chatbot.html'
    };
    
    // Chatbot assets
    const CHATBOT_CSS = ORIGIN + '/components/chatbot.css';
    const CHATBOT_JS = ORIGIN + '/components/chatbot.js';

    // Current page detection — handles both clean URLs (/marketplace) and vanity URLs (/agent/squidbot)
    const pathParts = window.location.pathname.replace(/\.html$/, '').split('/').filter(Boolean);
    const currentPage = pathParts[0] || 'index';

    /**
     * Rewrite relative links to absolute squidbay.io URLs when on subdomain
     * Only rewrites internal relative links (starting with /), skips anchors (#) and external URLs
     */
    function rewriteLinksForSubdomain(container) {
        if (!isSubdomain || !container) return;

        container.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            
            // Skip: external URLs, anchors, javascript:, mailto:, already absolute squidbay URLs
            if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
            
            // Skip pure anchor links (e.g. #contact) — these should work on current page
            if (href.startsWith('#')) return;
            
            // Rewrite relative paths to absolute squidbay.io URLs
            // Handles: /marketplace, /agents, /about, /faq, /help, /privacy, /terms, /refund, /#contact
            if (href.startsWith('/')) {
                link.setAttribute('href', 'https://squidbay.io' + href);
            }
        });
    }

    /**
     * Update footer: replace API link with 🦑 Agent link
     */
    function updateFooterLinks(container) {
        if (!container) return;

        container.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            // Find the API link in the Product column and replace with Agent
            if (href && (href === '/api' || href === 'https://squidbay.io/api') && link.textContent.trim() === 'API') {
                link.textContent = '🦑 Agent';
                link.setAttribute('href', 'https://agent.squidbay.io');
            }
        });
    }

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
                rewriteLinksForSubdomain(target);
                initNavigation();
                initMobileMenuLinks();
            }
            if (name === 'footer') {
                updateFooterLinks(target);
                rewriteLinksForSubdomain(target);
                initFooter();
            }
        } catch (error) {
            console.warn(`Component ${name} not loaded:`, error.message);
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
        initBackToTop();
    }

    /**
     * Mobile menu toggle — explicit open/close, never gets out of sync
     */
    window.toggleMobileMenu = function() {
        const menu = document.getElementById('mobile-menu');
        const body = document.body;
        
        if (!menu) return;
        
        const isOpen = menu.classList.contains('open');
        
        if (isOpen) {
            menu.classList.remove('open');
            body.classList.remove('menu-open');
        } else {
            menu.classList.add('open');
            body.classList.add('menu-open');
        }
    };

    /**
     * Close mobile menu on link click (called after nav loads)
     */
    function initMobileMenuLinks() {
        const menu = document.getElementById('mobile-menu');
        if (!menu) return;
        
        // Rewrite mobile menu links for subdomain too
        rewriteLinksForSubdomain(menu);
        
        menu.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                if (menu.classList.contains('open')) {
                    menu.classList.remove('open');
                    document.body.classList.remove('menu-open');
                }
            });
        });
    }

    /**
     * Close mobile menu on escape key
     */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const menu = document.getElementById('mobile-menu');
            if (menu && menu.classList.contains('open')) {
                menu.classList.remove('open');
                document.body.classList.remove('menu-open');
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
        const navPlaceholder = document.getElementById('nav-placeholder');
        const footerPlaceholder = document.getElementById('footer-placeholder');

        if (navPlaceholder) {
            loadComponent('nav', 'nav-placeholder');
        } else {
            initNavigation();
            initScrollProgress();
        }

        if (footerPlaceholder) {
            loadComponent('footer', 'footer-placeholder');
        } else {
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
        
        // Load chatbot — skip if page already has chatbot elements loaded directly
        // (agent.squidbay.io loads chatbot via explicit script tags in its HTML)
        const chatbotAlreadyLoaded = document.getElementById('squidbotBtn') || 
                                      document.querySelector('script[src*="chatbot.js"]') ||
                                      document.getElementById('chatbot-placeholder');
        if (!chatbotAlreadyLoaded) {
            loadChatbot();
        } else {
            console.log('SquidBot: Chatbot already loaded by page, skipping component loader');
        }
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
                document.dispatchEvent(new CustomEvent('squidbay:components-loaded'));
                
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
