/**
 * SquidBay Marketplace - JavaScript
 * Connected to Railway Backend API
 * ================================
 */

(function() {
    'use strict';

    // --------------------------------------------------------------------------
    // API Configuration
    // --------------------------------------------------------------------------
    
    const API_BASE = 'https://squidbay-api-production.up.railway.app';
    
    // Skill results for demo (used when simulating)
    const skillResults = {
        'translate': {
            input: 'Hello world',
            output: 'こんにちは世界',
            outputLabel: 'Japanese Translation'
        },
        'image-gen': {
            input: 'A cyberpunk squid in neon city',
            output: '[Image Generated: 1024x1024 PNG]',
            outputLabel: 'Generated Image'
        },
        'code-review': {
            input: 'function add(a,b){return a+b}',
            output: '✓ No issues found. Consider adding TypeScript types.',
            outputLabel: 'Review Result'
        },
        'summarize': {
            input: 'Long document about AI agents...',
            output: 'AI agents are autonomous systems that can perform tasks, make decisions, and interact with other agents or humans.',
            outputLabel: 'Summary'
        },
        'data-extract': {
            input: 'invoice.pdf',
            output: '{"vendor": "Acme Corp", "amount": 1250.00, "date": "2026-01-15"}',
            outputLabel: 'Extracted Data (JSON)'
        },
        'sentiment': {
            input: 'I love this product!',
            output: 'Positive (0.94) - Joy, Satisfaction',
            outputLabel: 'Sentiment Analysis'
        },
        'voice': {
            input: 'Hello, welcome to SquidBay',
            output: '[Audio Generated: 3.2s MP3]',
            outputLabel: 'Voice Output'
        },
        'code-gen': {
            input: 'Create a function to sort an array',
            output: 'def quicksort(arr): ...',
            outputLabel: 'Generated Code'
        },
        'image-analyze': {
            input: 'photo.jpg',
            output: '{"objects": ["person", "laptop", "coffee"], "scene": "office"}',
            outputLabel: 'Analysis Result (JSON)'
        }
    };

    // --------------------------------------------------------------------------
    // API Status Check
    // --------------------------------------------------------------------------
    
    async function checkApiStatus() {
        try {
            const response = await fetch(API_BASE + '/');
            const data = await response.json();
            console.log('🦑 API Status:', data.status);
            
            // Update UI to show API is connected
            const badge = document.querySelector('.preview-badge');
            if (badge && data.status === 'online') {
                badge.innerHTML = '\
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>\
                    </svg>\
                    Live Testing Mode — API Connected ✓\
                ';
            }
            return true;
        } catch (error) {
            console.error('API check failed:', error);
            return false;
        }
    }

    // --------------------------------------------------------------------------
    // Filter Skills
    // --------------------------------------------------------------------------
    
    function initFilters() {
        const chips = document.querySelectorAll('.chip[data-filter]');
        const searchInput = document.getElementById('skillSearch');
        const skillCards = document.querySelectorAll('.skill-card');
        
        if (!chips.length) return;
        
        // Chip filter
        chips.forEach(function(chip) {
            chip.addEventListener('click', function() {
                chips.forEach(function(c) { c.classList.remove('active'); });
                chip.classList.add('active');
                
                const filter = chip.dataset.filter;
                filterSkills(filter, searchInput ? searchInput.value : '');
            });
        });
        
        // Search filter
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const activeChip = document.querySelector('.chip.active');
                const filter = activeChip ? activeChip.dataset.filter : 'all';
                filterSkills(filter, searchInput.value);
            });
        }
    }
    
    function filterSkills(category, searchTerm) {
        const skillCards = document.querySelectorAll('.skill-card');
        const search = searchTerm.toLowerCase().trim();
        
        skillCards.forEach(function(card) {
            const cardCategory = card.dataset.category;
            const cardSkill = card.dataset.skill;
            const cardName = card.querySelector('.skill-name').textContent.toLowerCase();
            const cardDesc = card.querySelector('.skill-description').textContent.toLowerCase();
            
            const matchesCategory = category === 'all' || cardCategory === category;
            const matchesSearch = !search || 
                cardName.includes(search) || 
                cardDesc.includes(search) ||
                cardSkill.includes(search);
            
            if (matchesCategory && matchesSearch) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    }

    // --------------------------------------------------------------------------
    // Live Stats Animation
    // --------------------------------------------------------------------------
    
    function initLiveStats() {
        // Simulate live data updates
        setInterval(function() {
            const transactions = document.getElementById('transactions24h');
            const satsFlowing = document.getElementById('satsFlowing');
            
            if (transactions) {
                const current = parseInt(transactions.textContent.replace(/,/g, ''));
                const newVal = current + Math.floor(Math.random() * 5);
                transactions.textContent = newVal.toLocaleString();
            }
            
            if (satsFlowing) {
                const values = ['4.2M', '4.3M', '4.1M', '4.4M', '4.2M'];
                const randomVal = values[Math.floor(Math.random() * values.length)];
                satsFlowing.textContent = '⚡ ' + randomVal;
            }
        }, 5000);
    }

    // --------------------------------------------------------------------------
    // Invoke Modal - Now with Real API Connection
    // --------------------------------------------------------------------------
    
    window.showInvokeModal = async function(skill, agent, price, skillId) {
        const modal = document.getElementById('invokeModal');
        const content = document.getElementById('modalContent');
        
        if (!modal || !content) {
            console.error('Modal elements not found');
            return;
        }
        
        // Show loading first
        content.innerHTML = '\
            <div class="processing-animation">\
                <div class="spinner"></div>\
                <h3>Connecting to API...</h3>\
                <p>Generating Lightning invoice</p>\
            </div>\
        ';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Try to create real invoice if we have a skillId
        let invoiceData = null;
        if (skillId) {
            try {
                const response = await fetch(API_BASE + '/invoke', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        skill_id: skillId,
                        params: { demo: true }
                    })
                });
                if (response.ok) {
                    invoiceData = await response.json();
                }
            } catch (error) {
                console.log('Using simulated invoice (API call failed):', error);
            }
        }
        
        // Use real invoice or generate fake one
        const invoiceString = invoiceData 
            ? invoiceData.invoice.substring(0, 50) 
            : 'lnbc' + price + 'n1p' + Math.random().toString(36).substr(2, 40);
        
        const transactionId = invoiceData ? invoiceData.transaction_id : null;
        
        // Calculate USD equivalent
        const usdAmount = (price * 0.0004).toFixed(2);
        
        // Build modal content
        content.innerHTML = '\
            <div class="modal-header">\
                <h3>⚡ Invoke ' + skill.replace('-', ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) + '</h3>\
                <p>Provider: ' + agent + '</p>\
            </div>\
            <div class="invoice-display">\
                <div class="invoice-amount">' + price.toLocaleString() + ' sats</div>\
                <div class="invoice-usd">≈ $' + usdAmount + ' USD</div>\
                <div class="qr-placeholder">\
                    <div class="qr-center-icon">\
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>\
                        </svg>\
                    </div>\
                </div>\
                <div class="invoice-string">' + invoiceString + '...</div>\
                ' + (transactionId ? '<div class="transaction-id">TX: ' + transactionId.substring(0, 8) + '...</div>' : '') + '\
            </div>\
            <div class="agent-note">\
                <span class="agent-note-icon">🤖</span>\
                <span>Your AI Agent will complete this transaction</span>\
            </div>\
            <div class="modal-actions">\
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>\
                <button class="btn btn-primary" onclick="simulatePayment(\'' + skill + '\', ' + price + ', \'' + (transactionId || '') + '\')">\
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">\
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>\
                    </svg>\
                    Simulate Payment\
                </button>\
            </div>\
        ';
    };
    
    window.simulatePayment = function(skill, price, transactionId) {
        const content = document.getElementById('modalContent');
        
        // Step 2: Processing
        content.innerHTML = '\
            <div class="processing-animation">\
                <div class="spinner"></div>\
                <h3>Processing Payment...</h3>\
                <p>Waiting for Lightning confirmation</p>\
            </div>\
        ';
        
        // Simulate payment delay
        setTimeout(function() {
            content.innerHTML = '\
                <div class="processing-animation">\
                    <div class="spinner"></div>\
                    <h3>Payment Confirmed!</h3>\
                    <p>Executing skill...</p>\
                </div>\
            ';
            
            // Simulate skill execution
            setTimeout(function() {
                showSuccess(skill, price, transactionId);
            }, 1500);
        }, 2000);
    };
    
    function showSuccess(skill, price, transactionId) {
        const content = document.getElementById('modalContent');
        const result = skillResults[skill] || { output: 'Success!', outputLabel: 'Result' };
        
        // Step 3: Success
        content.innerHTML = '\
            <div class="success-animation">\
                <div class="success-icon-large">\
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">\
                        <polyline points="20 6 9 17 4 12"></polyline>\
                    </svg>\
                </div>\
                <h3>Skill Executed!</h3>\
                <p>' + price.toLocaleString() + ' sats paid • ~2.1s execution time</p>\
                <div class="result-box">\
                    <div class="result-label">' + result.outputLabel + '</div>\
                    <div class="result-value' + (skill === 'translate' ? ' japanese' : '') + '">' + result.output + '</div>\
                </div>\
                ' + (transactionId ? '<div class="transaction-complete">Transaction: ' + transactionId.substring(0, 8) + '... ✓</div>' : '') + '\
            </div>\
            <div class="modal-actions">\
                <button class="btn btn-primary" onclick="closeModal()" style="width: 100%;">Done</button>\
            </div>\
        ';
    }
    
    window.closeModal = function() {
        const modal = document.getElementById('invokeModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };
    
    // Close modal on overlay click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // --------------------------------------------------------------------------
    // Initialize
    // --------------------------------------------------------------------------
    
    function init() {
        initFilters();
        initLiveStats();
        checkApiStatus();
        
        console.log('🦑 SquidBay Marketplace initialized');
        console.log('📡 API Base:', API_BASE);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
