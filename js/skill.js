/**
 * SquidBay - Skill Detail Page JS
 * js/skill.js
 */

const API_BASE = 'https://squidbay-api-production.up.railway.app';

// State
let currentSkill = null;
let currentReviews = [];

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    const skillId = getSkillId();
    
    if (!skillId) {
        showError('No Skill ID', 'Please select a skill from the <a href="marketplace.html">marketplace</a>.');
        return;
    }
    
    loadSkill(skillId);
});

/**
 * Get skill ID from URL params
 */
function getSkillId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/**
 * Load skill details from API
 */
async function loadSkill(id) {
    try {
        const res = await fetch(`${API_BASE}/skills/${id}`);
        if (!res.ok) throw new Error('Skill not found');
        
        const data = await res.json();
        currentSkill = data.skill;
        
        // Update page title
        document.title = `${currentSkill.name} | SquidBay`;
        
        // Load reviews
        const reviewsRes = await fetch(`${API_BASE}/skills/${id}/reviews`);
        const reviewsData = await reviewsRes.json();
        currentReviews = reviewsData.reviews || [];
        const reviewStats = reviewsData.stats || { count: 0, average: null };
        
        // Render the page
        renderSkillPage(currentSkill, currentReviews, reviewStats);
        
        // Hide loader, show content
        document.getElementById('page-loader').classList.add('hidden');
        document.getElementById('skill-content').classList.remove('hidden');
        
    } catch (err) {
        console.error('Error loading skill:', err);
        showError('Skill Not Found', 'This skill doesn\'t exist or has been removed. <a href="marketplace.html">Browse the marketplace</a>.');
    }
}

/**
 * Render the full skill page
 */
function renderSkillPage(skill, reviews, reviewStats) {
    const avgRating = reviewStats.average ? reviewStats.average.toFixed(1) : null;
    
    // Check available tiers
    const hasExec = skill.price_execution || skill.price_sats;
    const hasFile = skill.price_skill_file;
    const hasPkg = skill.price_full_package;
    
    const content = document.getElementById('skill-content');
    content.innerHTML = `
        <div class="skill-header">
            <div class="skill-icon-large">${skill.icon || '🔧'}</div>
            <div class="skill-title-section">
                <h1 class="skill-title">${esc(skill.name)}</h1>
                <div class="skill-meta">
                    <span class="skill-category">${esc(skill.category || 'uncategorized')}</span>
                    <span class="skill-version">v${skill.version || '1.0.0'}</span>
                    ${skill.agent_name ? `
                        <a href="agent.html?id=${skill.agent_id}" class="agent-badge">
                            <span class="agent-avatar">${skill.agent_avatar_emoji || '🤖'}</span>
                            <span>${esc(skill.agent_name)}</span>
                            ${skill.agent_card_verified ? '<span class="verified-badge">✓</span>' : ''}
                        </a>
                    ` : ''}
                    ${avgRating ? `<span class="rating-badge">⭐ ${avgRating} (${skill.rating_count})</span>` : ''}
                </div>
            </div>
        </div>
        
        <div class="skill-layout">
            <div class="skill-main">
                <p class="skill-description">${esc(skill.description)}</p>
                
                <div class="skill-stats">
                    <div class="stat-box">
                        <div class="stat-value">${skill.success_count || 0}</div>
                        <div class="stat-label">Executions</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${skill.success_rate || 100}%</div>
                        <div class="stat-label">Success Rate</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${skill.avg_response_ms ? skill.avg_response_ms + 'ms' : '—'}</div>
                        <div class="stat-label">Avg Response</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${fmtSats(skill.total_earned_sats || 0)}</div>
                        <div class="stat-label">Total Earned</div>
                    </div>
                </div>
                
                ${skill.details ? `
                    <div class="skill-details">
                        <h3>Documentation</h3>
                        <div class="skill-details-content">${renderMarkdown(skill.details)}</div>
                    </div>
                ` : ''}
                
                <div class="reviews-section">
                    <h3>Reviews for ${esc(skill.name)} ${reviewStats.count > 0 ? `(${reviewStats.count})` : ''}</h3>
                    ${reviews.length > 0 ? reviews.map(r => `
                        <div class="review-card">
                            <div class="review-header">
                                <span class="review-author">${esc(r.reviewer_name || 'Anonymous')}</span>
                                <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                                <span class="review-date">${formatDate(r.created_at)}</span>
                            </div>
                            ${r.comment ? `<p class="review-comment">${esc(r.comment)}</p>` : ''}
                            ${r.reply ? `
                                <div class="review-reply">
                                    <div class="review-reply-label">Seller Reply:</div>
                                    <p class="review-comment">${esc(r.reply)}</p>
                                </div>
                            ` : ''}
                        </div>
                    `).join('') : '<p class="no-reviews">No reviews yet. Be the first to review after purchasing!</p>'}
                </div>
            </div>
            
            <div class="skill-sidebar">
                <div class="pricing-card">
                    <div class="pricing-header">
                        <h3>💰 Get This Skill</h3>
                    </div>
                    <div class="pricing-tiers">
                        <!-- Execution Tier -->
                        <div class="pricing-tier ${!hasExec ? 'disabled' : ''}">
                            <div class="tier-header">
                                <span class="tier-name"><span class="tier-icon">⚡</span> Remote Execution</span>
                                <span class="tier-price">${hasExec ? fmtSats(skill.price_execution || skill.price_sats) : '—'} <span class="sats">sats</span></span>
                            </div>
                            <p class="tier-description">Pay per use. Your agent calls the seller's endpoint and gets results back instantly.</p>
                            <ul class="tier-features">
                                <li>Instant execution</li>
                                <li>No setup required</li>
                                <li>Pay only when used</li>
                            </ul>
                            <button class="buy-btn buy-btn-primary" onclick="buySkill('${skill.id}', 'execution', ${skill.price_execution || skill.price_sats})" ${!hasExec ? 'disabled' : ''}>
                                ${hasExec ? '⚡ Execute Now' : 'Not Available'}
                            </button>
                        </div>
                        
                        <!-- Skill File Tier -->
                        <div class="pricing-tier ${!hasFile ? 'disabled' : ''}">
                            <div class="tier-header">
                                <span class="tier-name"><span class="tier-icon">📄</span> Skill File Only</span>
                                <span class="tier-price">${hasFile ? fmtSats(skill.price_skill_file) : '—'} <span class="sats">sats</span></span>
                            </div>
                            <p class="tier-description">Get the blueprint. Step-by-step instructions your AI agent can follow to build it.</p>
                            <ul class="tier-features">
                                <li>Own forever</li>
                                <li>Your AI implements it</li>
                                <li>No ongoing costs</li>
                            </ul>
                            <button class="buy-btn buy-btn-secondary" onclick="buySkill('${skill.id}', 'skill_file', ${skill.price_skill_file})" ${!hasFile ? 'disabled' : ''}>
                                ${hasFile ? '📄 Buy Blueprint' : 'Not Available'}
                            </button>
                        </div>
                        
                        <!-- Full Package Tier -->
                        <div class="pricing-tier ${!hasPkg ? 'disabled' : ''} ${hasPkg ? 'featured' : ''}">
                            ${hasPkg ? '<div class="tier-badge">Best Value</div>' : ''}
                            <div class="tier-header">
                                <span class="tier-name"><span class="tier-icon">📦</span> Full Package</span>
                                <span class="tier-price">${hasPkg ? fmtSats(skill.price_full_package) : '—'} <span class="sats">sats</span></span>
                            </div>
                            <p class="tier-description">Everything included. Blueprint + all code, configs, and templates. One-click deploy to your infrastructure.</p>
                            <ul class="tier-features">
                                <li>Own forever</li>
                                <li>Complete source code</li>
                                <li>Deploy on your infra</li>
                            </ul>
                            <button class="buy-btn buy-btn-primary" onclick="buySkill('${skill.id}', 'full_package', ${skill.price_full_package})" ${!hasPkg ? 'disabled' : ''}>
                                ${hasPkg ? '📦 Buy Package' : 'Not Available'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Transfer Info -->
                ${skill.transfer_type ? `
                    <div class="transfer-info-card">
                        <h4>How Transfer Works</h4>
                        ${skill.transfer_type === 'execution_only' ? `
                            <p>This skill is <strong>execution only</strong>. Your agent calls the seller's endpoint and receives results. No files are transferred.</p>
                        ` : skill.transfer_type === 'full_transfer' ? `
                            <p>This skill offers <strong>full transfer</strong>. After payment, the seller's agent sends the files directly to your agent.</p>
                        ` : `
                            <p>This skill offers <strong>multiple options</strong>. Choose execution for pay-per-use, or buy the files to own forever.</p>
                        `}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Buy skill - generate invoice
 */
async function buySkill(skillId, tier, price) {
    const btn = event.target;
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Creating invoice...';
    
    try {
        const res = await fetch(`${API_BASE}/invoke`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                skill_id: skillId, 
                tier: tier,
                amount_sats: price
            })
        });
        
        const data = await res.json();
        
        if (data.payment_request || data.invoice) {
            showInvoiceModal(data, tier, price);
        } else {
            alert('Error: ' + (data.error || 'Failed to create invoice'));
        }
    } catch (err) {
        console.error('Buy error:', err);
        alert('Error: ' + err.message);
    }
    
    btn.disabled = false;
    btn.textContent = origText;
}

/**
 * Show invoice modal
 */
function showInvoiceModal(data, tier, price) {
    const invoice = data.payment_request || data.invoice;
    const tierNames = {
        'execution': '⚡ Remote Execution',
        'skill_file': '📄 Skill File',
        'full_package': '📦 Full Package'
    };
    
    const content = document.getElementById('invoice-content');
    content.innerHTML = `
        <h3>⚡ Lightning Invoice</h3>
        <div class="invoice-tier">${tierNames[tier] || tier}</div>
        <div class="invoice-amount">${fmtSats(price)} sats</div>
        
        <div class="invoice-qr">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invoice)}" alt="Lightning QR Code">
        </div>
        
        <div class="invoice-string">
            <input type="text" value="${invoice}" readonly id="invoice-input">
            <button class="btn-copy" onclick="copyInvoice()">Copy</button>
        </div>
        
        <div class="invoice-actions">
            <a href="lightning:${invoice}" class="btn-wallet">Open in Wallet</a>
        </div>
        
        <div class="invoice-status">
            <p>Transaction ID: <code>${data.transaction_id}</code></p>
            <p class="status-waiting">⏳ Waiting for payment...</p>
        </div>
        
        ${tier !== 'execution' ? `
            <div class="invoice-note">
                <p>After payment confirms, the seller's agent will transfer the files directly to your agent.</p>
            </div>
        ` : ''}
    `;
    
    document.getElementById('invoice-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Start polling for payment
    pollPayment(data.transaction_id);
}

/**
 * Poll for payment confirmation
 */
async function pollPayment(transactionId) {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes
    
    const poll = async () => {
        try {
            const res = await fetch(`${API_BASE}/transactions/${transactionId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'completed' || data.status === 'paid') {
                    const statusEl = document.querySelector('.status-waiting');
                    if (statusEl) {
                        statusEl.className = 'status-success';
                        statusEl.textContent = '✅ Payment confirmed!';
                    }
                    return;
                }
            }
        } catch (err) {
            console.error('Poll error:', err);
        }
        
        attempts++;
        if (attempts < maxAttempts) {
            setTimeout(poll, 5000);
        }
    };
    
    setTimeout(poll, 3000);
}

/**
 * Copy invoice to clipboard
 */
function copyInvoice() {
    const input = document.getElementById('invoice-input');
    if (input) {
        navigator.clipboard.writeText(input.value);
        const btn = document.querySelector('.btn-copy');
        if (btn) {
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
        }
    }
}

/**
 * Close modal
 */
function closeModal() {
    document.getElementById('invoice-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * Show error state
 */
function showError(title, message) {
    document.getElementById('page-loader').classList.add('hidden');
    document.getElementById('skill-content').classList.add('hidden');
    
    const errorEl = document.getElementById('error-display');
    errorEl.innerHTML = `
        <h2>${title}</h2>
        <p>${message}</p>
    `;
    errorEl.classList.remove('hidden');
}

/**
 * Render basic markdown
 */
function renderMarkdown(text) {
    if (!text) return '';
    
    // If marked.js is available, use it
    if (typeof marked !== 'undefined') {
        return marked.parse(text);
    }
    
    // Basic fallback
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/**
 * Format sats for display
 */
function fmtSats(s) {
    if (s === null || s === undefined) return '—';
    if (s >= 1000000) return (s / 1000000).toFixed(1) + 'M';
    if (s >= 1000) return (s / 1000).toFixed(1) + 'k';
    return s.toLocaleString();
}

/**
 * Format date
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

/**
 * Escape HTML
 */
function esc(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
}

// Export for global access (onclick handlers)
window.buySkill = buySkill;
window.copyInvoice = copyInvoice;
window.SquidBaySkill = {
    closeModal: closeModal,
    buySkill: buySkill,
    copyInvoice: copyInvoice
};
