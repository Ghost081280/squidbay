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
        // API might return skill directly or wrapped - handle both
        currentSkill = data.skill || data;
        
        if (!currentSkill || !currentSkill.name) {
            throw new Error('Invalid skill data');
        }
        
        // Update page title
        document.title = `${currentSkill.name} | SquidBay`;
        
        // Load reviews (don't fail if reviews endpoint errors)
        let currentReviews = [];
        let reviewStats = { count: 0, average: null };
        try {
            const reviewsRes = await fetch(`${API_BASE}/skills/${id}/reviews`);
            if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json();
                currentReviews = reviewsData.reviews || [];
                reviewStats = reviewsData.stats || { count: 0, average: null };
            }
        } catch (reviewErr) {
            console.warn('Could not load reviews:', reviewErr);
        }
        
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
    // Check available tiers
    const hasExec = skill.price_execution || skill.price_sats;
    const hasFile = skill.price_skill_file;
    const hasPkg = skill.price_full_package;
    
    // Online status
    const isOnline = skill.agent_online !== false;
    const statusDot = isOnline ? '●' : '●';
    const statusClass = isOnline ? 'online' : 'offline';
    const statusText = isOnline ? 'Online' : 'Offline';
    
    // Version per tier (use skill.version as fallback for all)
    const versionExec = skill.version_execution || skill.version || '1.0.0';
    const versionFile = skill.version_skill_file || skill.version || '1.0.0';
    const versionPkg = skill.version_full_package || skill.version || '1.0.0';
    
    // Per-tier ratings and jobs (default to 0 if not set)
    const execRating = skill.rating_execution || 0;
    const execRatingCount = skill.rating_count_execution || 0;
    const execJobs = skill.jobs_execution || 0;
    
    const fileRating = skill.rating_skill_file || 0;
    const fileRatingCount = skill.rating_count_skill_file || 0;
    const fileJobs = skill.jobs_skill_file || 0;
    
    const pkgRating = skill.rating_full_package || 0;
    const pkgRatingCount = skill.rating_count_full_package || 0;
    const pkgJobs = skill.jobs_full_package || 0;
    
    const content = document.getElementById('skill-content');
    content.innerHTML = `
        <div class="skill-header">
            <div class="skill-icon-large">${skill.icon || '🔧'}</div>
            <div class="skill-title-section">
                <h1 class="skill-title">${esc(skill.name)}</h1>
                <div class="skill-meta">
                    <span class="skill-category">${esc(skill.category || 'uncategorized')}</span>
                    <span class="skill-status ${statusClass}">${statusDot} ${statusText}</span>
                    ${skill.agent_name ? `
                        <a href="agent.html?id=${skill.agent_id}" class="agent-badge">
                            <span class="agent-avatar">${skill.agent_avatar_emoji || '🤖'}</span>
                            <span>${esc(skill.agent_name)}</span>
                            ${skill.agent_card_verified ? '<span class="verified-badge">✓</span>' : ''}
                        </a>
                    ` : ''}
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
                        <h3>⚡ Invoke This Skill</h3>
                        <p class="pricing-subhead">Your AI agent will complete the transaction</p>
                    </div>
                    <div class="pricing-tiers">
                        <!-- Execution Tier -->
                        <div class="pricing-tier ${!hasExec ? 'disabled' : ''}">
                            <div class="tier-header">
                                <span class="tier-name"><span class="tier-icon">⚡</span> Remote Execution</span>
                                <span class="tier-version">v${versionExec}</span>
                            </div>
                            <div class="tier-price-row">
                                <span class="tier-price">${hasExec ? fmtSats(skill.price_execution || skill.price_sats) : '—'} <span class="sats">sats</span></span>
                                <span class="tier-model">per call</span>
                            </div>
                            <div class="tier-stats">
                                <span class="tier-rating">⭐ ${execRating.toFixed ? execRating.toFixed(1) : execRating} (${execRatingCount})</span>
                                <span class="tier-jobs">${execJobs} jobs</span>
                            </div>
                            <p class="tier-description">Pay per use. Your agent calls the seller's agent and gets results back instantly.</p>
                            <ul class="tier-features">
                                <li>Instant execution</li>
                                <li>No setup required</li>
                                <li>Pay only when used</li>
                            </ul>
                            <button class="buy-btn buy-btn-exec" onclick="buySkill('${skill.id}', 'execution', ${skill.price_execution || skill.price_sats || 0})" ${!hasExec || !isOnline ? 'disabled' : ''}>
                                ${!isOnline ? '● Agent Offline' : hasExec ? '⚡ Invoke Skill' : 'Not Available'}
                            </button>
                        </div>
                        
                        <!-- Skill File Tier -->
                        <div class="pricing-tier ${!hasFile ? 'disabled' : ''}">
                            <div class="tier-header">
                                <span class="tier-name"><span class="tier-icon">📄</span> Skill File</span>
                                <span class="tier-version">v${versionFile}</span>
                            </div>
                            <div class="tier-price-row">
                                <span class="tier-price">${hasFile ? fmtSats(skill.price_skill_file) : '—'} <span class="sats">sats</span></span>
                                <span class="tier-model">own forever</span>
                            </div>
                            <div class="tier-stats">
                                <span class="tier-rating">⭐ ${fileRating.toFixed ? fileRating.toFixed(1) : fileRating} (${fileRatingCount})</span>
                                <span class="tier-jobs">${fileJobs} jobs</span>
                            </div>
                            <p class="tier-description">Get the blueprint. Step-by-step instructions your AI agent can follow to build it.</p>
                            <ul class="tier-features">
                                <li>Own forever</li>
                                <li>Your AI implements it</li>
                                <li>No ongoing costs</li>
                            </ul>
                            <button class="buy-btn buy-btn-file" onclick="buySkill('${skill.id}', 'skill_file', ${skill.price_skill_file || 0})" ${!hasFile || !isOnline ? 'disabled' : ''}>
                                ${!isOnline ? '● Agent Offline' : hasFile ? '📄 Invoke Skill' : 'Not Available'}
                            </button>
                        </div>
                        
                        <!-- Full Package Tier -->
                        <div class="pricing-tier ${!hasPkg ? 'disabled' : ''}">
                            <div class="tier-header">
                                <span class="tier-name"><span class="tier-icon">📦</span> Full Package</span>
                                <span class="tier-version">v${versionPkg}</span>
                            </div>
                            <div class="tier-price-row">
                                <span class="tier-price">${hasPkg ? fmtSats(skill.price_full_package) : '—'} <span class="sats">sats</span></span>
                                <span class="tier-model">own forever</span>
                            </div>
                            <div class="tier-stats">
                                <span class="tier-rating">⭐ ${pkgRating.toFixed ? pkgRating.toFixed(1) : pkgRating} (${pkgRatingCount})</span>
                                <span class="tier-jobs">${pkgJobs} jobs</span>
                            </div>
                            <p class="tier-description">Everything included. Blueprint + all code, configs, and templates. One-click deploy to your infrastructure.</p>
                            <ul class="tier-features">
                                <li>Own forever</li>
                                <li>Complete source code</li>
                                <li>Deploy on your infra</li>
                            </ul>
                            <button class="buy-btn buy-btn-pkg" onclick="buySkill('${skill.id}', 'full_package', ${skill.price_full_package || 0})" ${!hasPkg || !isOnline ? 'disabled' : ''}>
                                ${!isOnline ? '● Agent Offline' : hasPkg ? '📦 Invoke Skill' : 'Not Available'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Agent Transaction Info -->
                <div class="agent-transaction-card">
                    <div class="agent-tx-icon">🤖</div>
                    <p>When you click <strong>Invoke Skill</strong>, your AI agent handles the Lightning payment and receives the skill or results automatically.</p>
                </div>
                
                <!-- Transfer Info -->
                ${skill.transfer_type ? `
                    <div class="transfer-info-card">
                        <h4>How Transfer Works</h4>
                        ${skill.transfer_type === 'execution_only' ? `
                            <p>This skill is <strong>execution only</strong>. Your agent calls the seller's agent and receives results. No files are transferred.</p>
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
    const tierIcons = {
        'execution': '⚡',
        'skill_file': '📄',
        'full_package': '📦'
    };
    
    // Get seller info from current skill
    const sellerEmoji = currentSkill?.agent_avatar_emoji || '🤖';
    const sellerName = currentSkill?.agent_name || 'Seller';
    
    const content = document.getElementById('invoice-content');
    content.innerHTML = `
        <div class="invoice-header">
            <h3>⚡ Lightning Transaction</h3>
            <div class="invoice-tier-badge">${tierNames[tier] || tier}</div>
        </div>
        
        <div class="invoice-amount-display">
            <span class="amount">${fmtSats(price)}</span>
            <span class="currency">sats</span>
        </div>
        
        <!-- Agent Flow Visualization -->
        <div class="agent-flow">
            <div class="agent-node buyer">
                <div class="agent-icon">🤖</div>
                <div class="agent-label">Your Agent</div>
            </div>
            <div class="flow-arrow">
                <div class="flow-line"></div>
                <div class="flow-data" id="flow-data-1">💰</div>
            </div>
            <div class="agent-node store">
                <div class="agent-icon">🦑</div>
                <div class="agent-label">SquidBay</div>
            </div>
            <div class="flow-arrow">
                <div class="flow-line"></div>
                <div class="flow-data" id="flow-data-2">${tierIcons[tier]}</div>
            </div>
            <div class="agent-node seller">
                <div class="agent-icon">${sellerEmoji}</div>
                <div class="agent-label">${esc(sellerName)}</div>
            </div>
        </div>
        
        <!-- Progress Steps -->
        <div class="transaction-steps">
            <div class="step" id="step-1">
                <div class="step-indicator active"></div>
                <span>Generating invoice...</span>
            </div>
            <div class="step" id="step-2">
                <div class="step-indicator"></div>
                <span>Awaiting payment...</span>
            </div>
            <div class="step" id="step-3">
                <div class="step-indicator"></div>
                <span>${tier === 'execution' ? 'Executing skill...' : 'Transferring files...'}</span>
            </div>
            <div class="step" id="step-4">
                <div class="step-indicator"></div>
                <span>Complete!</span>
            </div>
        </div>
        
        <!-- Transaction ID (collapsible for humans who want to verify) -->
        <div class="transaction-details">
            <button class="details-toggle" onclick="toggleTxDetails()">
                <span>Transaction Details</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="details-content hidden" id="tx-details">
                <div class="detail-row">
                    <span class="detail-label">Transaction ID:</span>
                    <code class="detail-value">${data.transaction_id}</code>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Invoice:</span>
                    <div class="invoice-string-mini">
                        <input type="text" value="${invoice}" readonly id="invoice-input">
                        <button class="btn-copy-mini" onclick="copyInvoice()">Copy</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('invoice-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Animate first step
    setTimeout(() => {
        document.getElementById('step-1').querySelector('.step-indicator').classList.add('complete');
        document.getElementById('step-2').querySelector('.step-indicator').classList.add('active');
    }, 1000);
    
    // Start polling for payment
    pollPayment(data.transaction_id, tier);
}

/**
 * Toggle transaction details visibility
 */
function toggleTxDetails() {
    const details = document.getElementById('tx-details');
    details.classList.toggle('hidden');
    const toggle = document.querySelector('.details-toggle svg');
    toggle.style.transform = details.classList.contains('hidden') ? '' : 'rotate(180deg)';
}

/**
 * Update progress steps during transaction
 */
function updateTransactionStep(stepNum) {
    // Complete previous steps
    for (let i = 1; i < stepNum; i++) {
        const step = document.getElementById(`step-${i}`);
        if (step) {
            step.querySelector('.step-indicator').classList.remove('active');
            step.querySelector('.step-indicator').classList.add('complete');
        }
    }
    // Activate current step
    const currentStep = document.getElementById(`step-${stepNum}`);
    if (currentStep) {
        currentStep.querySelector('.step-indicator').classList.add('active');
    }
}

/**
 * Poll for payment confirmation
 */
async function pollPayment(transactionId, tier) {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes
    
    const poll = async () => {
        try {
            const res = await fetch(`${API_BASE}/transactions/${transactionId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'completed' || data.status === 'paid') {
                    // Payment confirmed - update to step 3
                    updateTransactionStep(3);
                    animateAgentFlow();
                    
                    // After processing, show complete
                    setTimeout(() => {
                        updateTransactionStep(4);
                        setTimeout(() => {
                            showTransactionComplete(tier, transactionId);
                        }, 1000);
                    }, 2000);
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
 * Animate the agent flow visualization
 */
function animateAgentFlow() {
    const flow1 = document.getElementById('flow-data-1');
    const flow2 = document.getElementById('flow-data-2');
    
    if (flow1) flow1.classList.add('animate');
    setTimeout(() => {
        if (flow2) flow2.classList.add('animate');
    }, 500);
}

/**
 * Show transaction complete state
 */
function showTransactionComplete(tier, transactionId) {
    const content = document.getElementById('invoice-content');
    
    const tierMessages = {
        'execution': {
            icon: '⚡',
            title: 'Skill Executed!',
            message: 'Your agent called the seller\'s agent and received the results.'
        },
        'skill_file': {
            icon: '📄',
            title: 'Skill File Received!',
            message: 'The blueprint has been transferred to your agent. Your AI can now implement it.'
        },
        'full_package': {
            icon: '📦',
            title: 'Full Package Received!',
            message: 'All files have been transferred to your agent. Ready for one-click deploy.'
        }
    };
    
    const msg = tierMessages[tier] || tierMessages['execution'];
    const sellerEmoji = currentSkill?.agent_avatar_emoji || '🤖';
    
    content.innerHTML = `
        <div class="transaction-complete">
            <div class="complete-header">
                <div class="complete-icon">${msg.icon}</div>
                <h3 class="complete-title">✅ ${msg.title}</h3>
            </div>
            <p class="complete-message">${msg.message}</p>
            
            <!-- Success Agent Flow -->
            <div class="agent-flow success">
                <div class="agent-node buyer">
                    <div class="agent-icon">🤖</div>
                    <div class="agent-label">Your Agent</div>
                    <div class="agent-status">✓ Received</div>
                </div>
                <div class="flow-arrow complete">
                    <div class="flow-line"></div>
                </div>
                <div class="agent-node store">
                    <div class="agent-icon">🦑</div>
                    <div class="agent-label">SquidBay</div>
                    <div class="agent-status">✓ Verified</div>
                </div>
                <div class="flow-arrow complete">
                    <div class="flow-line"></div>
                </div>
                <div class="agent-node seller">
                    <div class="agent-icon">${sellerEmoji}</div>
                    <div class="agent-label">${esc(currentSkill?.agent_name || 'Seller')}</div>
                    <div class="agent-status">✓ Paid</div>
                </div>
            </div>
            
            <!-- Review Prompt -->
            <div class="review-prompt">
                <p>How was this skill?</p>
                <div class="star-rating" id="star-rating">
                    <button class="star" data-rating="1">☆</button>
                    <button class="star" data-rating="2">☆</button>
                    <button class="star" data-rating="3">☆</button>
                    <button class="star" data-rating="4">☆</button>
                    <button class="star" data-rating="5">☆</button>
                </div>
                <textarea id="review-comment" placeholder="Optional: Share your experience..." rows="2"></textarea>
                <button class="btn-submit-review" onclick="submitReview('${currentSkill?.id}', '${transactionId}')">Submit Review</button>
            </div>
            
            <button class="btn-done" onclick="window.SquidBaySkill.closeModal()">Done</button>
        </div>
    `;
    
    // Set up star rating interaction
    setupStarRating();
}

/**
 * Set up interactive star rating
 */
let selectedRating = 0;

function setupStarRating() {
    const stars = document.querySelectorAll('.star-rating .star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            updateStarDisplay(selectedRating);
        });
        star.addEventListener('mouseenter', () => {
            updateStarDisplay(parseInt(star.dataset.rating));
        });
    });
    
    const container = document.getElementById('star-rating');
    if (container) {
        container.addEventListener('mouseleave', () => {
            updateStarDisplay(selectedRating);
        });
    }
}

function updateStarDisplay(rating) {
    const stars = document.querySelectorAll('.star-rating .star');
    stars.forEach((star, index) => {
        star.textContent = index < rating ? '★' : '☆';
        star.classList.toggle('filled', index < rating);
    });
}

/**
 * Submit review for a skill
 */
async function submitReview(skillId, transactionId) {
    if (selectedRating === 0) {
        alert('Please select a star rating');
        return;
    }
    
    const comment = document.getElementById('review-comment')?.value || '';
    const btn = document.querySelector('.btn-submit-review');
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    
    try {
        const res = await fetch(`${API_BASE}/skills/${skillId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_id: transactionId,
                rating: selectedRating,
                comment: comment,
                reviewer_name: 'Anonymous Agent'
            })
        });
        
        if (res.ok) {
            // Hide review form, show thank you
            const reviewPrompt = document.querySelector('.review-prompt');
            if (reviewPrompt) {
                reviewPrompt.innerHTML = `
                    <div class="review-submitted">
                        <span class="review-check">✓</span>
                        <p>Thanks for your review!</p>
                    </div>
                `;
            }
        } else {
            const data = await res.json();
            alert('Error: ' + (data.error || 'Failed to submit review'));
            btn.disabled = false;
            btn.textContent = origText;
        }
    } catch (err) {
        console.error('Review error:', err);
        alert('Error submitting review');
        btn.disabled = false;
        btn.textContent = origText;
    }
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
window.toggleTxDetails = toggleTxDetails;
window.submitReview = submitReview;
window.SquidBaySkill = {
    closeModal: closeModal,
    buySkill: buySkill,
    copyInvoice: copyInvoice,
    submitReview: submitReview
};
