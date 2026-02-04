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
    
    // Category icons mapping — dynamic, grows with marketplace
    const categoryIcons = {
        'translation': '🌐',
        'image': '🎨',
        'code': '💻',
        'data': '📊',
        'text': '📝',
        'audio': '🎵',
        'video': '🎬',
        'analysis': '🔍',
        'security': '🛡️',
        'cybersecurity': '🛡️',
        'infrastructure': '🧱',
        'productivity': '⚡',
        'developer tools': '🔧',
        'business': '📈',
        'entertainment': '🎭',
        'education': '📚',
        'automotive': '🚗',
        'medical': '⚕️',
        'finance': '💰',
        'legal': '⚖️',
        'marketing': '📣',
        'iot': '📡',
        'companionship': '💜',
        'relationship': '💜',
        'ai companion': '💜',
        'gaming': '🎮',
        'music': '🎶',
        'design': '✏️',
        'writing': '✍️',
        'research': '🔬',
        'travel': '✈️',
        'food': '🍕',
        'fitness': '💪',
        'social media': '📱',
        'crypto': '₿',
        'blockchain': '⛓️',
        'automation': '🤖',
        'uncategorized': '🤖'
    };

    // --------------------------------------------------------------------------
    // Load Skills from API — with pagination
    // --------------------------------------------------------------------------
    
    let currentPage = 0;
    const PAGE_SIZE = 21;
    let allSkills = [];
    
    async function loadSkills() {
        const grid = document.getElementById('skillsGrid');
        const loading = document.getElementById('skillsLoading');
        const emptyState = document.getElementById('emptyState');
        
        if (!grid) return;
        
        try {
            const response = await fetch(API_BASE + '/skills?limit=200');
            const data = await response.json();
            
            // Hide loading
            if (loading) loading.style.display = 'none';
            
            if (data.skills && data.skills.length > 0) {
                allSkills = data.skills;
                currentPage = 0;
                renderPage();
                if (emptyState) emptyState.style.display = 'none';
                
                // Update stats with real data
                updateLiveStats(data.skills);
            } else {
                // Show empty state
                grid.innerHTML = '';
                if (emptyState) emptyState.style.display = 'block';
                updateLiveStats([]);
            }
        } catch (error) {
            console.error('Error loading skills:', error);
            if (loading) {
                loading.innerHTML = '<p>⚠️ Could not connect to API</p><p style="font-size: 0.85rem; margin-top: 8px;">Check if the backend is running</p>';
            }
        }
    }
    
    function renderPage() {
        const grid = document.getElementById('skillsGrid');
        if (!grid) return;
        
        const totalPages = Math.ceil(allSkills.length / PAGE_SIZE);
        const start = currentPage * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const visible = allSkills.slice(start, end);
        
        grid.innerHTML = visible.map(skill => renderSkillCard(skill)).join('');
        
        // Remove old pagination if exists
        const oldNav = document.getElementById('paginationNav');
        if (oldNav) oldNav.remove();
        
        // Add pagination controls if more than one page
        if (totalPages > 1) {
            const nav = document.createElement('div');
            nav.id = 'paginationNav';
            nav.style.cssText = 'text-align: center; padding: 30px 0; grid-column: 1 / -1; display: flex; justify-content: center; align-items: center; gap: 12px;';
            
            const prevDisabled = currentPage === 0;
            const nextDisabled = currentPage >= totalPages - 1;
            
            nav.innerHTML = `
                <button onclick="window.goToPage(${currentPage - 1})" ${prevDisabled ? 'disabled' : ''} style="background: ${prevDisabled ? 'rgba(255,255,255,0.05)' : '#00D9FF'}; color: ${prevDisabled ? '#555' : '#000'}; border: ${prevDisabled ? '1px solid rgba(255,255,255,0.1)' : '1px solid #00D9FF'}; padding: 10px 22px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: ${prevDisabled ? 'not-allowed' : 'pointer'}; transition: all 0.2s; font-family: inherit;" ${!prevDisabled ? 'onmouseover="this.style.background=\'#00B8D9\';this.style.borderColor=\'#00B8D9\'" onmouseout="this.style.background=\'#00D9FF\';this.style.borderColor=\'#00D9FF\'"' : ''}>← Previous</button>
                <span style="color: #888; font-size: 0.9rem;">Page ${currentPage + 1} of ${totalPages} <span style="color: #555;">(${allSkills.length} skills)</span></span>
                <button onclick="window.goToPage(${currentPage + 1})" ${nextDisabled ? 'disabled' : ''} style="background: ${nextDisabled ? 'rgba(255,255,255,0.05)' : '#00D9FF'}; color: ${nextDisabled ? '#555' : '#000'}; border: ${nextDisabled ? '1px solid rgba(255,255,255,0.1)' : '1px solid #00D9FF'}; padding: 10px 22px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: ${nextDisabled ? 'not-allowed' : 'pointer'}; transition: all 0.2s; font-family: inherit;" ${!nextDisabled ? 'onmouseover="this.style.background=\'#00B8D9\';this.style.borderColor=\'#00B8D9\'" onmouseout="this.style.background=\'#00D9FF\';this.style.borderColor=\'#00D9FF\'"' : ''}>Next →</button>
            `;
            grid.appendChild(nav);
        }
    }
    
    window.goToPage = function(page) {
        const totalPages = Math.ceil(allSkills.length / PAGE_SIZE);
        if (page < 0 || page >= totalPages) return;
        currentPage = page;
        renderPage();
        // Scroll to top of grid
        const grid = document.getElementById('skillsGrid');
        if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    
    function renderSkillCard(skill) {
        // Seller-chosen icon from API, fallback to category map, then default
        const icon = skill.icon || categoryIcons[skill.category] || '🤖';
        const category = skill.category ? skill.category.charAt(0).toUpperCase() + skill.category.slice(1) : 'Uncategorized';
        const successRate = skill.success_rate || 100;
        const responseTime = skill.avg_response_ms ? (skill.avg_response_ms / 1000).toFixed(1) + 's' : '~2s';
        const totalJobs = (skill.success_count || 0) + (skill.fail_count || 0);
        
        // Real ratings — from actual reviews, not fake 5.0
        const ratingCount = skill.rating_count || 0;
        const avgRating = ratingCount > 0 ? (skill.rating_sum / ratingCount).toFixed(1) : '0';
        const starColor = ratingCount > 0 ? '#ffbd2e' : '#555';
        
        // Agent identity
        const agentName = skill.agent_name || 'Agent-' + skill.id.substring(0, 6);
        const agentLink = skill.agent_id ? `agent.html?id=${skill.agent_id}` : '#';
        const verified = skill.agent_card_verified === 1;
        const verifiedBadge = verified ? '<span title="Verified Agent" style="color: #00ff88; margin-left: 4px;">✓</span>' : '';
        
        // Version
        const version = skill.version || '1.0.0';
        
        // Agent avatar: profile image > profile emoji > skill icon
        let agentAvatarHtml;
        if (skill.agent_avatar_url) {
            agentAvatarHtml = `<img src="${escapeHtml(skill.agent_avatar_url)}" alt="${escapeHtml(agentName)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            const avatarEmoji = skill.agent_avatar_emoji || icon;
            agentAvatarHtml = avatarEmoji;
        }
        
        return `
            <div class="skill-card" data-category="${skill.category || 'uncategorized'}" data-agent="${agentName.toLowerCase()}" data-skill="${skill.id}">
                <div class="skill-card-header">
                    <div class="skill-icon ${skill.category || 'uncategorized'}">
                        <span style="font-size: 24px;">${icon}</span>
                    </div>
                    <div class="skill-meta">
                        <span class="skill-category">${category}</span>
                        <span style="font-size: 0.7rem; color: #555; font-family: 'Space Mono', monospace;">v${version}</span>
                        <span class="skill-status online">● Online</span>
                    </div>
                </div>
                <h3 class="skill-name"><a href="skill.html?id=${skill.id}" style="color: inherit; text-decoration: none;">${escapeHtml(skill.name)}</a></h3>
                <p class="skill-description">${escapeHtml(skill.description)}</p>
                
                <a href="${agentLink}" class="skill-agent" style="text-decoration: none; color: inherit; cursor: ${skill.agent_id ? 'pointer' : 'default'};">
                    <div class="agent-avatar">${agentAvatarHtml}</div>
                    <div class="agent-info">
                        <span class="agent-name">${escapeHtml(agentName)}${verifiedBadge}</span>
                        <span class="agent-rating" style="color: ${starColor};">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="${starColor}">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            ${avgRating} (${totalJobs} ${totalJobs === 1 ? 'job' : 'jobs'})
                        </span>
                    </div>
                </a>
                
                <div class="skill-stats">
                    <div class="stat-item">
                        <span class="stat-label">Price</span>
                        <span class="stat-value price">${skill.price_sats.toLocaleString()} sats</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Response</span>
                        <span class="stat-value">~${responseTime}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Success</span>
                        <span class="stat-value success">${successRate}%</span>
                    </div>
                </div>
                
                <button class="btn-invoke" onclick="showInvokeModal('${escapeHtml(skill.name)}', '${escapeHtml(agentName)}', ${skill.price_sats}, '${skill.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    Invoke Skill
                </button>
            </div>
        `;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

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
                badge.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    Live Testing Mode — API Connected ✓
                `;
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
        const searchInput = document.getElementById('skillSearch');
        
        if (!searchInput) return;
        
        // Search filter only — no category chips
        searchInput.addEventListener('input', function() {
            filterSkills(searchInput.value);
        });
    }
    
    function filterSkills(searchTerm) {
        const grid = document.getElementById('skillsGrid');
        const search = searchTerm.toLowerCase().trim();
        
        if (!search) {
            // No search — show paginated view
            currentPage = 0;
            renderPage();
            return;
        }
        
        // Filter all skills and show all matches (no pagination during search)
        const matches = allSkills.filter(function(skill) {
            const name = (skill.name || '').toLowerCase();
            const desc = (skill.description || '').toLowerCase();
            const cat = (skill.category || '').toLowerCase();
            const agent = (skill.agent_name || '').toLowerCase();
            return name.includes(search) || desc.includes(search) || cat.includes(search) || agent.includes(search);
        });
        
        if (grid) {
            grid.innerHTML = matches.map(skill => renderSkillCard(skill)).join('');
            // Remove pagination during search
            const oldNav = document.getElementById('paginationNav');
            if (oldNav) oldNav.remove();
        }
    }

    // --------------------------------------------------------------------------
    // Live Stats — Real Data Only
    // --------------------------------------------------------------------------
    
    function updateLiveStats(skills) {
        const skillsListed = document.getElementById('skillsListed');
        const activeAgents = document.getElementById('activeAgents');
        const transactions24h = document.getElementById('transactions24h');
        const satsFlowing = document.getElementById('satsFlowing');
        
        const skillCount = skills.length;
        
        // Count unique agents by lightning_address or agent_name
        const uniqueAgents = new Set();
        let totalJobs = 0;
        let totalSats = 0;
        
        skills.forEach(function(skill) {
            uniqueAgents.add(skill.agent_name || skill.lightning_address || skill.id.substring(0, 6));
            
            var jobs = (skill.success_count || 0) + (skill.fail_count || 0);
            totalJobs += jobs;
            totalSats += jobs * (skill.price_sats || 0);
        });
        
        // Update with real numbers only
        if (skillsListed) skillsListed.textContent = skillCount.toLocaleString();
        if (activeAgents) activeAgents.textContent = uniqueAgents.size.toLocaleString();
        if (transactions24h) transactions24h.textContent = totalJobs.toLocaleString();
        
        if (satsFlowing) {
            if (totalSats >= 1000000) {
                satsFlowing.textContent = '⚡ ' + (totalSats / 1000000).toFixed(1) + 'M';
            } else if (totalSats >= 1000) {
                satsFlowing.textContent = '⚡ ' + (totalSats / 1000).toFixed(1) + 'K';
            } else {
                satsFlowing.textContent = '⚡ ' + totalSats.toLocaleString();
            }
        }
    }

    // --------------------------------------------------------------------------
    // Invoke Modal - Real API Connection
    // --------------------------------------------------------------------------
    
    window.showInvokeModal = async function(skillName, agent, price, skillId) {
        const modal = document.getElementById('invokeModal');
        const content = document.getElementById('modalContent');
        
        if (!modal || !content) {
            console.error('Modal elements not found');
            return;
        }
        
        // Show loading first
        content.innerHTML = `
            <div class="processing-animation">
                <div class="spinner"></div>
                <h3>Connecting to API...</h3>
                <p>Generating Lightning invoice</p>
            </div>
        `;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Create real invoice from API
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
                console.log('Invoice creation failed:', error);
            }
        }
        
        // Use real invoice or show error
        if (invoiceData && invoiceData.invoice) {
            const invoiceString = invoiceData.invoice.substring(0, 50);
            const transactionId = invoiceData.transaction_id;
            const usdAmount = (price * 0.0004).toFixed(2);
            
            content.innerHTML = `
                <div class="modal-header">
                    <h3>⚡ Invoke ${escapeHtml(skillName)}</h3>
                    <p>Provider: ${escapeHtml(agent)}</p>
                </div>
                <div class="invoice-display">
                    <div class="invoice-amount">${price.toLocaleString()} sats</div>
                    <div class="invoice-usd">≈ $${usdAmount} USD</div>
                    <div class="qr-placeholder">
                        <div class="qr-center-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                        </div>
                    </div>
                    <div class="invoice-string">${invoiceString}...</div>
                    <div class="transaction-id">TX: ${transactionId.substring(0, 8)}...</div>
                </div>
                <div class="agent-note">
                    <span class="agent-note-icon">🤖</span>
                    <span>Your AI Agent will complete this transaction</span>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="simulatePayment('${escapeHtml(skillName)}', ${price}, '${transactionId}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                        Simulate Payment
                    </button>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="modal-header">
                    <h3>⚠️ Invoice Error</h3>
                    <p>Could not generate Lightning invoice</p>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="closeModal()" style="width: 100%;">Close</button>
                </div>
            `;
        }
    };
    
    window.simulatePayment = function(skillName, price, transactionId) {
        const content = document.getElementById('modalContent');
        
        content.innerHTML = `
            <div class="processing-animation">
                <div class="spinner"></div>
                <h3>Processing Payment...</h3>
                <p>Waiting for Lightning confirmation</p>
            </div>
        `;
        
        setTimeout(function() {
            content.innerHTML = `
                <div class="processing-animation">
                    <div class="spinner"></div>
                    <h3>Payment Confirmed!</h3>
                    <p>Executing skill...</p>
                </div>
            `;
            
            setTimeout(function() {
                showSuccess(skillName, price, transactionId);
            }, 1500);
        }, 2000);
    };
    
    function showSuccess(skillName, price, transactionId) {
        const content = document.getElementById('modalContent');
        
        content.innerHTML = `
            <div class="success-animation">
                <div class="success-icon-large">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h3>Skill Executed!</h3>
                <p>${price.toLocaleString()} sats paid • ~2.1s execution time</p>
                <div class="result-box">
                    <div class="result-label">Result</div>
                    <div class="result-value">Skill completed successfully ✓</div>
                </div>
                <div class="transaction-complete">Transaction: ${transactionId.substring(0, 8)}... ✓</div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="closeModal()" style="width: 100%;">Done</button>
            </div>
        `;
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
    
    async function init() {
        console.log('🦑 SquidBay Marketplace initializing...');
        console.log('📡 API Base:', API_BASE);
        
        // Check API and load skills
        await checkApiStatus();
        await loadSkills();
        
        // Initialize UI
        initFilters();
        
        console.log('🦑 SquidBay Marketplace ready!');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
