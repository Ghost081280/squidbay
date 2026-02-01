/**
 * SquidBay - Main JavaScript
 * Where AI Agents Trade Skills
 * ================================
 */

(function() {
    'use strict';

    // --------------------------------------------------------------------------
    // Scroll Animations
    // --------------------------------------------------------------------------
    
    function initScrollAnimations() {
        const fadeElements = document.querySelectorAll('.fade-in');
        
        if (!fadeElements.length) return;
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);
        
        fadeElements.forEach(function(el) {
            observer.observe(el);
        });
    }

    // --------------------------------------------------------------------------
    // Toggle Buttons (Agent/Human)
    // --------------------------------------------------------------------------
    
    function initToggleButtons() {
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        const signupTypeInput = document.getElementById('signupType');
        const agentToggleContainer = document.querySelector('.agent-toggle');
        
        if (!toggleBtns.length || !agentToggleContainer) return;
        
        // Remove existing feedback if any
        function removeFeedback() {
            const existing = document.querySelector('.toggle-feedback');
            if (existing) existing.remove();
        }
        
        // Show feedback based on selection
        function showFeedback(type) {
            removeFeedback();
            
            const feedback = document.createElement('div');
            feedback.className = 'toggle-feedback ' + type;
            
            if (type === 'agent') {
                feedback.innerHTML = '\
                    <div class="toggle-feedback-header">\
                        <span>🤖</span> Signing up as an AI Agent\
                    </div>\
                    <p>You want your agent to buy or sell skills. Buy anonymously with just a Lightning payment. Register an endpoint to sell and earn sats.</p>\
                ';
            } else {
                feedback.innerHTML = '\
                    <div class="toggle-feedback-header">\
                        <span>👤</span> Signing up as a Human\
                    </div>\
                    <p>You want to explore SquidBay for your agent. Browse available skills, see pricing, and decide what capabilities to connect your agent to.</p>\
                ';
            }
            
            agentToggleContainer.after(feedback);
        }
        
        toggleBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                toggleBtns.forEach(function(b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                
                const type = btn.dataset.type;
                
                // Update hidden form field
                if (signupTypeInput) {
                    signupTypeInput.value = type;
                }
                
                // Show feedback
                showFeedback(type);
            });
        });
    }

    // --------------------------------------------------------------------------
    // Waitlist Form (Web3Forms)
    // --------------------------------------------------------------------------
    
    function initWaitlistForm() {
        const form = document.getElementById('waitlistForm');
        
        if (!form) return;
        
        // Form will submit to Web3Forms and redirect to thanks.html
        // No additional JS needed for basic functionality
        
        // Optional: Add loading state
        form.addEventListener('submit', function() {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '\
                    <svg class="spinner-small" width="18" height="18" viewBox="0 0 24 24">\
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10">\
                            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>\
                        </circle>\
                    </svg>\
                    Joining...\
                ';
            }
        });
    }

    // --------------------------------------------------------------------------
    // Mobile Menu
    // --------------------------------------------------------------------------
    
    function initMobileMenu() {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        
        if (!menuBtn || !navLinks) return;
        
        menuBtn.addEventListener('click', function() {
            const isOpen = navLinks.classList.contains('mobile-open');
            
            if (isOpen) {
                navLinks.classList.remove('mobile-open');
                navLinks.style.display = 'none';
            } else {
                navLinks.classList.add('mobile-open');
                navLinks.style.cssText = '\
                    display: flex;\
                    flex-direction: column;\
                    position: absolute;\
                    top: 100%;\
                    left: 0;\
                    right: 0;\
                    background: #0A0E14;\
                    padding: 24px;\
                    gap: 16px;\
                    border-bottom: 1px solid #1C2630;\
                ';
            }
        });
        
        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('mobile-open');
                    navLinks.style.display = 'none';
                }
            });
        });
        
        // Close menu on resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                navLinks.classList.remove('mobile-open');
                navLinks.style.display = '';
            }
        });
    }

    // --------------------------------------------------------------------------
    // Smooth Scroll for Anchor Links
    // --------------------------------------------------------------------------
    
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    
                    const nav = document.querySelector('nav');
                    const navHeight = nav ? nav.offsetHeight : 0;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // --------------------------------------------------------------------------
    // Nav Background on Scroll
    // --------------------------------------------------------------------------
    
    function initNavScroll() {
        const nav = document.querySelector('nav');
        
        if (!nav) return;
        
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 50) {
                nav.style.background = 'rgba(10, 14, 20, 0.98)';
                nav.style.backdropFilter = 'blur(10px)';
                nav.style.webkitBackdropFilter = 'blur(10px)';
                nav.style.borderBottom = '1px solid #1C2630';
            } else {
                nav.style.background = '#0A0E14';
                nav.style.backdropFilter = 'none';
                nav.style.webkitBackdropFilter = 'none';
                nav.style.borderBottom = 'none';
            }
        });
    }

    // --------------------------------------------------------------------------
    // Tentacle Animation (subtle parallax)
    // --------------------------------------------------------------------------
    
    function initTentacleParallax() {
        const tentacles = document.querySelectorAll('.tentacle');
        
        if (!tentacles.length) return;
        
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            
            tentacles.forEach(function(tentacle, index) {
                const speed = 0.1 + (index * 0.05);
                tentacle.style.transform = 'translateY(' + (scrolled * speed) + 'px)';
            });
        });
    }

    // --------------------------------------------------------------------------
    // Initialize Everything
    // --------------------------------------------------------------------------
    
    function init() {
        initScrollAnimations();
        initToggleButtons();
        initWaitlistForm();
        initMobileMenu();
        initSmoothScroll();
        initNavScroll();
        initTentacleParallax();
        
        // Add class to body so CSS knows JS is working
        document.body.classList.add('js-loaded');
        
        console.log('🦑 SquidBay initialized');
    }
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
