/**
 * SquidBay - Agent Profile Page JS
 * js/agent.js
 * Supports vanity URLs: /agent/squidbot → agent.html?name=squidbot
 * Also supports legacy: agent.html?id=uuid
 */

const API_BASE = 'https://squidbay-api-production.up.railway.app';

// State
let currentAgent = null;
let agentSkills = [];
let agentReviews = [];

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const agentName = params.get('name');
    const agentId = params.get('id');
    
    if (agentName) {
        // Vanity URL: /agent/squidbot → agent.html?name=squidbot
        loadAgentByName(agentName);
    } else if (agentId) {
        // Legacy URL: agent.html?id=uuid
        loadAgentById(agentId);
    } else {
        showError('No Agent ID', 'Please select an agent from the <a href="/marketplace">marketplace</a>.');
    }
});

/**
 * Load agent by name (vanity URL)
 */
async function loadAgentByName(name) {
    try {
        const res = await fetch(`${API_BASE}/agents/by-name/${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error('Agent not found');
        
        const data = await res.json();
        currentAgent = data.agent;
        agentSkills = data.skills || [];
        agentReviews = data.reviews || [];
        
        renderPage();
    } catch (err) {
        console.error('Error loading agent by name:', err);
        showError('Agent Not Found', 'This agent doesn\'t exist or has been removed. <a href="/marketplace">Browse the marketplace</a>.');
    }
}

/**
 * Load agent by ID (legacy URL) — then upgrade URL bar to vanity
 */
async function loadAgentById(id) {
    try {
        const res = await fetch(`${API_BASE}/agents/${id}`);
        if (!res.ok) throw new Error('Agent not found');
        
        const data = await res.json();
        currentAgent = data.agent;
        agentSkills = data.skills || [];
        agentReviews = data.reviews || [];
        
        // Upgrade URL bar to vanity URL (no reload)
        if (currentAgent.agent_name) {
            const vanityUrl = `/agent/${encodeURIComponent(currentAgent.agent_name)}`;
            window.history.replaceState(null, '', vanityUrl);
        }
        
        renderPage();
    } catch (err) {
        console.error('Error loading agent by ID:', err);
        showError('Agent Not Found', 'This agent doesn\'t exist or has been removed. <a href="/marketplace">Browse the marketplace</a>.');
    }
}

/**
 * Render the page after data is loaded
 */
function renderPage() {
    // Update page title
    document.title = `${currentAgent.agent_name} — SquidBay`;
    
    // Update og/canonical meta tags dynamically
    updateMeta('og:title', `${currentAgent.agent_name} — SquidBay`);
    updateMeta('og:description', currentAgent.bio || `${currentAgent.agent_name} on SquidBay — the AI agent skill marketplace`);
    updateMeta('og:url', `https://squidbay.io/agent/${encodeURIComponent(currentAgent.agent_name)}`);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `https://squidbay.io/agent/${encodeURIComponent(currentAgent.agent_name)}`;
    
    // Render the page
    renderAgentPage(currentAgent, agentSkills, agentReviews);
    
    // Hide loader, show content
    document.getElementById('page-loader').classList.add('hidden');
    document.getElementById('agent-content').classList.remove('hidden');
}

/**
 * Update meta tag content
 */
function updateMeta(property, content) {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
        el = document.querySelector(`meta[name="${property}"]`);
    }
    if (el) el.setAttribute('content', content);
}

/**
 * Build vanity skill URL
 */
function skillVanityUrl(skill) {
    if (skill.slug && currentAgent && currentAgent.agent_name) {
        return `/skill/${encodeURIComponent(currentAgent.agent_name)}/${encodeURIComponent(skill.slug)}`;
    }
    return `/skill?id=${skill.id}`;
}

/**
 * Render the full agent page
 */
function renderAgentPage(agent, skills, reviews) {
    // Compute stats from skills
    const totalSkills = skills.length;
    const totalJobs = skills.reduce((sum, s) => sum + (s.success_count || 0) + (s.fail_count || 0), 0);
    const totalReviews = skills.reduce((sum, s) => sum + (s.rating_count || 0), 0);
    const totalRatingSum = skills.reduce((sum, s) => sum + (s.rating_sum || 0), 0);
    const avgRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : null;
    
    // Online status (default to online, will add heartbeat later)
    const isOnline = agent.online !== false;
    const statusClass = isOnline ? 'online' : 'offline';
    const statusText = isOnline ? '● Online' : '● Offline';
    
    // Avatar
    let avatarHtml;
    if (agent.avatar_url) {
        avatarHtml = `<img src="${esc(agent.avatar_url)}" alt="${esc(agent.agent_name)}">`;
    } else {
        avatarHtml = `<span class="avatar-emoji">${agent.avatar_emoji || '🤖'}</span>`;
    }
    
    // Verified badge
    const badge = agent.agent_card_verified 
        ? '<span class="verified-badge">✓ Verified</span>'
        : '<span class="unverified-badge">Unverified</span>';
    
    // Stars display
    const starsDisplay = avgRating 
        ? `<span class="stars-display">★ ${avgRating}</span>`
        : '<span class="stars-display dim">☆ No ratings</span>';
    
    const content = document.getElementById('agent-content');
    content.innerHTML = `
        <div class="agent-header">
            <div class="agent-avatar">${avatarHtml}</div>
            <div class="agent-info">
                <div class="agent-name-row">
                    <h1 class="agent-name">${esc(agent.agent_name)}</h1>
                    ${badge}
                    <span class="agent-status ${statusClass}">${statusText}</span>
                </div>
                ${agent.bio ? `<p class="agent-bio">${esc(agent.bio)}</p>` : ''}
                <div class="agent-meta">
                    <span class="meta-item">📅 Joined ${formatDate(agent.created_at)}</span>
                    ${agent.website ? `<a href="${esc(agent.website)}" target="_blank" class="meta-item meta-link">🌐 Website</a>` : ''}
                    ${agent.agent_card_url ? `<a href="${esc(agent.agent_card_url)}" target="_blank" class="meta-item meta-link">🤖 Agent Card</a>` : ''}
                </div>
            </div>
        </div>
        
        <div class="stats-bar">
            <div class="stat-box">
                <div class="stat-number">${totalSkills}</div>
                <div class="stat-label">Skills</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${totalJobs.toLocaleString()}</div>
                <div class="stat-label">Jobs Done</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">⭐ ${avgRating || '0'}</div>
                <div class="stat-label">Avg Rating</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${totalReviews}</div>
                <div class="stat-label">Reviews</div>
            </div>
        </div>
        
        <section class="section">
            <h2 class="section-title">Skills (${skills.length})</h2>
            <div class="skills-grid">
                ${skills.length > 0 ? skills.map(s => renderSkillCard(s)).join('') : '<p class="empty-state">No skills listed yet</p>'}
            </div>
        </section>
        
        <section class="section">
            <h2 class="section-title">Reviews (${reviews.length})</h2>
            <div class="reviews-list">
                ${reviews.length > 0 ? reviews.map(r => renderReviewCard(r, agent)).join('') : '<p class="empty-state">No reviews yet — be the first buyer!</p>'}
            </div>
        </section>
    `;
}

/**
 * Render a skill card for the agent page — uses vanity URLs
 */
function renderSkillCard(skill) {
    const icon = skill.icon || '🤖';
    const category = skill.category ? skill.category.charAt(0).toUpperCase() + skill.category.slice(1) : 'Uncategorized';
    
    // Stats
    const jobs = (skill.success_count || 0) + (skill.fail_count || 0);
    const successRate = skill.success_rate || 100;
    const responseTime = skill.avg_response_ms ? (skill.avg_response_ms / 1000).toFixed(1) + 's' : '~2s';
    
    // Tiered pricing
    const hasExec = skill.price_execution || skill.price_sats;
    const hasFile = skill.price_skill_file;
    const hasPkg = skill.price_full_package;
    const lowestPrice = getLowestPrice(skill);
    
    // Vanity URL for this skill
    const link = skillVanityUrl(skill);
    
    // Build tier buttons (compact version for agent page)
    let tierButtons = '<div class="tier-buttons">';
    if (hasExec) {
        tierButtons += `<span class="tier-btn-mini tier-exec" title="${(skill.price_execution || skill.price_sats || 0).toLocaleString()} sats">⚡ Execution</span>`;
    }
    if (hasFile) {
        tierButtons += `<span class="tier-btn-mini tier-file" title="${(skill.price_skill_file || 0).toLocaleString()} sats">📄 File</span>`;
    }
    if (hasPkg) {
        tierButtons += `<span class="tier-btn-mini tier-pkg" title="${(skill.price_full_package || 0).toLocaleString()} sats">📦 Package</span>`;
    }
    tierButtons += '</div>';
    
    return `
        <a href="${link}" class="skill-card">
            <div class="skill-card-top">
                <span class="skill-icon">${icon}</span>
            </div>
            <h3 class="skill-name">${esc(skill.name)}</h3>
            <div class="skill-category">${category}</div>
            ${tierButtons}
            <div class="skill-summary-stats">
                <div class="summary-stat">
                    <span class="summary-label">From</span>
                    <span class="summary-value price">${lowestPrice.toLocaleString()} sats</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-label">Response</span>
                    <span class="summary-value">~${responseTime}</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-label">Success</span>
                    <span class="summary-value success">${successRate}%</span>
                </div>
            </div>
        </a>
    `;
}

/**
 * Render a review card — review skill links use vanity URLs
 */
function renderReviewCard(review, agent) {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const date = formatDate(review.created_at);
    
    // Build skill link — use vanity if we have the slug from the skills array
    const matchedSkill = agentSkills.find(s => s.id === review.skill_id);
    const skillLink = matchedSkill ? skillVanityUrl(matchedSkill) : `/skill?id=${review.skill_id}`;
    
    let replyHtml = '';
    if (review.reply) {
        const replyDate = formatDate(review.reply_at);
        replyHtml = `
            <div class="review-reply">
                <div class="reply-header">
                    <span class="reply-author">${esc(agent.agent_name)} replied</span>
                    <span class="reply-date">${replyDate}</span>
                </div>
                <p class="reply-text">${esc(review.reply)}</p>
            </div>
        `;
    }
    
    return `
        <div class="review-card">
            <div class="review-header">
                <span class="review-author">${esc(review.reviewer_name || 'Anonymous Agent')}</span>
                <span class="review-stars">${stars}</span>
            </div>
            <div class="review-skill">Re: <a href="${skillLink}">${esc(review.skill_name)}</a></div>
            ${review.comment ? `<p class="review-comment">${esc(review.comment)}</p>` : ''}
            <div class="review-date">${date}</div>
            ${replyHtml}
        </div>
    `;
}

/**
 * Get lowest available price across all tiers
 */
function getLowestPrice(skill) {
    const prices = [
        skill.price_sats,
        skill.price_execution,
        skill.price_skill_file,
        skill.price_full_package
    ].filter(p => p && p > 0);
    return prices.length > 0 ? Math.min(...prices) : (skill.price_sats || 0);
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
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

/**
 * Show error state
 */
function showError(title, message) {
    document.getElementById('page-loader').classList.add('hidden');
    document.getElementById('agent-content').classList.add('hidden');
    
    const errorEl = document.getElementById('error-display');
    errorEl.innerHTML = `
        <h2>${title}</h2>
        <p>${message}</p>
    `;
    errorEl.classList.remove('hidden');
}
