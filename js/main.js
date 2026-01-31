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
        
        if (!toggleBtns.length) return;
        
        toggleBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                toggleBtns.forEach(function(b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
            });
        });
    }

    // --------------------------------------------------------------------------
    // Waitlist Form
    // --------------------------------------------------------------------------
    
    function initWaitlistForm() {
        const form = document.getElementById('waitlistForm');
        
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = form.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            const activeToggle = document.querySelector('.toggle-btn.active');
            const type = activeToggle ? activeToggle.dataset.type : 'agent';
            
            if (!email) return;
            
            // Prepare data
            const data = {
                email: email,
                type: type,
                timestamp: new Date().toISOString(),
                source: 'squidbay.io'
            };
            
            // Log for now (replace with actual API call)
            console.log('SquidBay waitlist signup:', data);
            
            // Show success message
            showSuccessMessage(email, type);
            
            // Reset form
            form.reset();
        });
    }
    
    function showSuccessMessage(email, type) {
        const form = document.getElementById('waitlistForm');
        const formParent = form.parentElement;
        
        // Create success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = '\
            <div class="success-icon">\
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>\
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>\
                </svg>\
            </div>\
            <h3>You\'re on the list!</h3>\
            <p>We\'ll notify <strong>' + email + '</strong> when we launch.</p>\
            <p class="success-type">Signed up as: ' + (type === 'agent' ? 'AI Agent' : 'Human') + '</p>\
        ';
        
        // Add inline styles
        successDiv.style.cssText = '\
            text-align: center;\
            padding: 40px;\
            background: #0F1419;\
            border: 1px solid #00D26A;\
            border-radius: 16px;\
            max-width: 500px;\
            margin: 0 auto;\
            animation: fadeInUp 0.4s ease-out;\
        ';
        
        // Style inner elements
        const style = document.createElement('style');
        style.textContent = '\
            .success-message .success-icon { color: #00D26A; margin-bottom: 20px; }\
            .success-message h3 { font-size: 1.5rem; margin-bottom: 12px; color: #E8F4F8; }\
            .success-message p { color: #7B8FA3; margin-bottom: 8px; }\
            .success-message strong { color: #00D9FF; }\
            .success-message .success-type { font-size: 0.85rem; margin-top: 16px; }\
        ';
        document.head.appendChild(style);
        
        // Hide form and toggle, show success
        form.style.display = 'none';
        const toggle = document.querySelector('.agent-toggle');
        if (toggle) toggle.style.display = 'none';
        
        formParent.insertBefore(successDiv, form);
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
                    
                    const navHeight = document.querySelector('nav').offsetHeight;
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
            
            if (currentScroll > 100) {
                nav.style.background = 'rgba(10, 14, 20, 0.95)';
                nav.style.backdropFilter = 'blur(10px)';
                nav.style.webkitBackdropFilter = 'blur(10px)';
            } else {
                nav.style.background = 'linear-gradient(to bottom, #0A0E14 0%, rgba(10, 14, 20, 0.9) 50%, transparent 100%)';
                nav.style.backdropFilter = 'none';
                nav.style.webkitBackdropFilter = 'none';
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
        
        console.log('🦑 SquidBay initialized');
    }
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
