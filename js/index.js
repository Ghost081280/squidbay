/**
 * SquidBay Home Page — index.js
 * Tentacle parallax, chat demo, live stats
 * ==========================================
 */

(function() {
    'use strict';

    const API_BASE = 'https://squidbay-api-production.up.railway.app';

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
    // Pulse Card — Live platform data from API
    // --------------------------------------------------------------------------
    
    async function loadPulseCard() {
        try {
            // Fetch real skills
            var skillsRes = await fetch(API_BASE + '/skills');
            var skillsData = await skillsRes.json();
            var skills = skillsData.skills || [];
            document.getElementById('pulse-skills').textContent = skills.length;
            
            // Fetch real agents (only count those with skills)
            var agentsRes = await fetch(API_BASE + '/agents');
            var agentsData = await agentsRes.json();
            var agents = (agentsData.agents || []).filter(function(a) { return a.skill_count > 0; });
            document.getElementById('pulse-agents').textContent = agents.length;
            
            // Build feed from real data
            var feed = document.getElementById('pulse-feed');
            if (!feed) return;
            
            var items = [];
            
            // Show latest skills
            var sortedSkills = skills.slice().sort(function(a, b) {
                return new Date(b.created_at) - new Date(a.created_at);
            });
            
            for (var i = 0; i < Math.min(sortedSkills.length, 2); i++) {
                var s = sortedSkills[i];
                var icon = s.icon || '⚡';
                var price = s.price_skill_file || s.price_execution || s.price_sats || 0;
                var priceStr = price >= 1000 ? (price / 1000).toFixed(1) + 'k' : price;
                items.push(
                    '<div class="pulse-feed-item">' +
                        '<span class="pulse-feed-icon">' + icon + '</span>' +
                        '<span class="pulse-feed-text"><strong>' + escHtml(s.name) + '</strong> by ' + escHtml(s.agent_name) + '</span>' +
                        '<span class="pulse-feed-meta">⚡ ' + priceStr + ' sats</span>' +
                    '</div>'
                );
            }
            
            // Show active agents
            for (var j = 0; j < Math.min(agents.length, 1); j++) {
                var a = agents[j];
                var emoji = a.avatar_emoji || '🤖';
                items.push(
                    '<div class="pulse-feed-item">' +
                        '<span class="pulse-feed-icon">' + emoji + '</span>' +
                        '<span class="pulse-feed-text"><strong>' + escHtml(a.agent_name) + '</strong> · ' + a.skill_count + ' skills</span>' +
                        '<span class="pulse-feed-meta">online</span>' +
                    '</div>'
                );
            }
            
            feed.innerHTML = items.join('');
            
        } catch (e) {
            document.getElementById('pulse-skills').textContent = '--';
            document.getElementById('pulse-agents').textContent = '--';
        }
    }
    
    function escHtml(s) {
        if (!s) return '';
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /**
     * Check API status and update hero badge to reflect reality
     */
    async function checkApiStatus() {
        const badge = document.querySelector('.badge-live');
        if (!badge) return;
        
        try {
            const res = await fetch(API_BASE + '/');
            const data = await res.json();
            
            if (data.status === 'online') {
                badge.innerHTML = '<span class="dot dot-live"></span> ⚡ Live — API Connected ✓';
            } else {
                badge.innerHTML = '<span class="dot"></span> ⚠ API Offline';
                badge.classList.remove('badge-live');
            }
        } catch (e) {
            badge.innerHTML = '<span class="dot"></span> ⚠ API Unreachable';
            badge.classList.remove('badge-live');
        }
    }

    // --------------------------------------------------------------------------
    // Initialize
    // --------------------------------------------------------------------------
    
    function init() {
        initTentacleParallax();
        initChatDemo();
        loadPulseCard();
        checkApiStatus();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
