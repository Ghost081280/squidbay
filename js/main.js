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
        
        if (!menuBtn || !navLinks) {
            console.log('Mobile menu elements not found');
            return;
        }
        
        console.log('Mobile menu initialized');
        
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Menu clicked');
            navLinks.classList.toggle('mobile-open');
        });
        
        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('mobile-open');
                }
            });
        });
        
        // Close menu on resize to desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                navLinks.classList.remove('mobile-open');
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
    // Chat Demo Animation
    // --------------------------------------------------------------------------
    
    function initChatDemo() {
        const chatMessages = document.getElementById('chatMessages');
        const replayBtn = document.getElementById('replayDemo');
        
        if (!chatMessages) return;
        
        // Chat conversation script
        const conversation = [
            {
                type: 'user',
                avatar: '👤',
                message: 'Can you translate "Hello, how are you?" to Japanese for me?',
                delay: 500
            },
            {
                type: 'agent',
                avatar: '🤖',
                message: 'Sure! Let me find a translation skill for you...',
                delay: 1200
            },
            {
                type: 'system',
                message: '🔍 Searching SquidBay marketplace...',
                delay: 800
            },
            {
                type: 'agent',
                avatar: '🤖',
                message: 'Found a great option:',
                card: {
                    skill: 'Translation',
                    provider: 'PolyglotAgent-7',
                    price: '420 sats',
                    rating: '4.9 ★'
                },
                delay: 1500
            },
            {
                type: 'agent',
                avatar: '🤖',
                message: '',
                action: 'pending',
                actionText: 'Paying invoice...',
                delay: 1000
            },
            {
                type: 'agent',
                avatar: '🤖',
                message: '',
                action: 'success',
                actionText: '✓ Paid 420 sats • Skill executing...',
                delay: 1500
            },
            {
                type: 'agent',
                avatar: '🤖',
                message: 'Here\'s your translation:',
                result: {
                    label: 'Japanese',
                    value: 'こんにちは、お元気ですか？'
                },
                delay: 1200
            },
            {
                type: 'user',
                avatar: '👤',
                message: 'Perfect, thanks! That was fast.',
                delay: 1000
            },
            {
                type: 'agent',
                avatar: '🤖',
                message: 'Happy to help! The whole transaction took 1.8 seconds and cost about $0.17. Need anything else?',
                delay: 800
            }
        ];
        
        let currentIndex = 0;
        let isPlaying = false;
        
        function createMessage(item) {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message ' + item.type;
            
            let html = '';
            
            if (item.type !== 'system') {
                html += '<div class="chat-message-avatar">' + item.avatar + '</div>';
            }
            
            html += '<div class="chat-message-bubble">';
            
            if (item.message) {
                html += '<span>' + item.message + '</span>';
            }
            
            // SquidBay card
            if (item.card) {
                html += '\
                    <div class="squidbay-card">\
                        <div class="squidbay-card-header">\
                            <span>🦑</span>\
                            <strong>SquidBay</strong>\
                        </div>\
                        <div class="squidbay-skill">\
                            <div class="squidbay-skill-info">\
                                <span class="squidbay-skill-name">' + item.card.skill + '</span>\
                                <span class="squidbay-skill-provider">' + item.card.provider + ' • ' + item.card.rating + '</span>\
                            </div>\
                            <span class="squidbay-skill-price">⚡ ' + item.card.price + '</span>\
                        </div>\
                    </div>';
            }
            
            // Action status
            if (item.action) {
                html += '\
                    <div class="squidbay-action ' + item.action + '">';
                if (item.action === 'pending') {
                    html += '<div class="spinner-small"></div>';
                }
                html += '<span>' + item.actionText + '</span>\
                    </div>';
            }
            
            // Result
            if (item.result) {
                html += '\
                    <div class="chat-result">\
                        <div class="chat-result-label">' + item.result.label + '</div>\
                        <div class="chat-result-value">' + item.result.value + '</div>\
                    </div>';
            }
            
            html += '</div>';
            
            msgDiv.innerHTML = html;
            return msgDiv;
        }
        
        function showTyping() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'chat-message agent';
            typingDiv.id = 'typingIndicator';
            typingDiv.innerHTML = '\
                <div class="chat-message-avatar">🤖</div>\
                <div class="chat-message-bubble">\
                    <div class="typing-indicator">\
                        <span></span><span></span><span></span>\
                    </div>\
                </div>';
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        function removeTyping() {
            const typing = document.getElementById('typingIndicator');
            if (typing) typing.remove();
        }
        
        function playNext() {
            if (currentIndex >= conversation.length) {
                isPlaying = false;
                if (replayBtn) replayBtn.disabled = false;
                return;
            }
            
            const item = conversation[currentIndex];
            
            // Show typing for agent messages
            if (item.type === 'agent' && currentIndex > 0) {
                showTyping();
                setTimeout(function() {
                    removeTyping();
                    const msg = createMessage(item);
                    chatMessages.appendChild(msg);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    currentIndex++;
                    setTimeout(playNext, item.delay);
                }, 600);
            } else {
                const msg = createMessage(item);
                chatMessages.appendChild(msg);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                currentIndex++;
                setTimeout(playNext, item.delay);
            }
        }
        
        function startDemo() {
            if (isPlaying) return;
            
            isPlaying = true;
            currentIndex = 0;
            chatMessages.innerHTML = '';
            if (replayBtn) replayBtn.disabled = true;
            
            setTimeout(playNext, 500);
        }
        
        // Auto-start when section is visible
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting && !isPlaying && currentIndex === 0) {
                    startDemo();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        
        observer.observe(chatMessages);
        
        // Replay button
        if (replayBtn) {
            replayBtn.addEventListener('click', startDemo);
        }
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
        initChatDemo();
        
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
