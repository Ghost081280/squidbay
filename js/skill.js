/**
 * SquidBay - Skill Detail Page JS
 * js/skill.js
 * 
 * Server-side routing (Railway):
 *   /skill/agent/slug → Express serves skill.html → this JS reads window.location.pathname
 *   No redirects, no sessionStorage, no flash
 * 
 * Legacy support: skill.html?id=uuid still works
 */

const API_BASE = window.API_BASE || 'https://squidbay-api-production.up.railway.app';

// State
let currentSkill = null;
let currentReviews = [];

// N-C03: BTC price cache for USD conversion
let btcPriceCache = { price: null, fetchedAt: 0 };
const BTC_CACHE_MS = 5 * 60 * 1000; // 5 minute cache

async function fetchBtcPrice() {
    const now = Date.now();
    if (btcPriceCache.price && (now - btcPriceCache.fetchedAt) < BTC_CACHE_MS) {
        return btcPriceCache.price;
    }
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        if (!res.ok) throw new Error('CoinGecko API error');
        const data = await res.json();
        btcPriceCache.price = data.bitcoin.usd;
        btcPriceCache.fetchedAt = now;
        return btcPriceCache.price;
    } catch (err) {
        console.warn('BTC price fetch failed:', err);
        return btcPriceCache.price; // return stale cache or null
    }
}

function satsToUsd(sats, btcPrice) {
    if (!btcPrice || !sats) return null;
    return (sats / 100000000) * btcPrice;
}

function fmtUsd(usd) {
    if (usd === null || usd === undefined) return '';
    if (usd < 0.01) return '≈ <$0.01';
    return '≈ $' + usd.toFixed(2);
}

function fmtSatsWithUsd(sats, btcPrice) {
    const base = fmtSats(sats);
    if (!btcPrice || !sats) return base + ' sats';
    const usd = satsToUsd(sats, btcPrice);
    return `${base} sats <span class="usd-approx">(${fmtUsd(usd)})</span>`;
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check URL path first: /skill/agentname/skill-slug
    const pathMatch = window.location.pathname.match(/^\/skill\/([^\/]+)\/([^\/]+)\/?$/);
    if (pathMatch) {
        const agentName = decodeURIComponent(pathMatch[1]);
        const slug = decodeURIComponent(pathMatch[2]);
        loadSkillBySlug(agentName, slug);
        return;
    }
    
    // 2. Fallback: query params (legacy links)
    const params = new URLSearchParams(window.location.search);
    const agentName = params.get('agent');
    const slug = params.get('slug');
    const id = params.get('id');
    
    if (agentName && slug) {
        loadSkillBySlug(agentName, slug);
    } else if (id) {
        loadSkill(id);
    } else {
        showError('No Skill ID', 'Please select a skill from the <a href="/marketplace">marketplace</a>.');
    }
});

/**
 * Load skill by agent name + slug
 */
async function loadSkillBySlug(agentName, slug) {
    try {
        const res = await fetch(`${API_BASE}/skills/by-agent/${encodeURIComponent(agentName)}/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error('Skill not found');
        
        const data = await res.json();
        currentSkill = data.skill || data;
        
        if (!currentSkill || !currentSkill.name) {
            throw new Error('Invalid skill data');
        }
        
        // Ensure clean URL
        const cleanUrl = `/skill/${encodeURIComponent(agentName)}/${encodeURIComponent(slug)}`;
        if (window.location.pathname !== cleanUrl) {
            window.history.replaceState(null, '', cleanUrl);
        }
        
        updatePageMeta(currentSkill, agentName, slug);
        document.title = `${currentSkill.name} | SquidBay`;
        
        let reviews = [];
        let reviewStats = { count: 0, average: null };
        try {
            const reviewsRes = await fetch(`${API_BASE}/skills/${currentSkill.id}/reviews`);
            if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json();
                reviews = reviewsData.reviews || [];
                reviewStats = reviewsData.stats || { count: 0, average: null };
            }
        } catch (reviewErr) {
            console.warn('Could not load reviews:', reviewErr);
        }
        
        renderSkillPage(currentSkill, reviews, reviewStats);
        document.getElementById('page-loader').classList.add('hidden');
        document.getElementById('skill-content').classList.remove('hidden');
        
        // N-C03: Fetch BTC price and update USD displays after render
        fetchBtcPrice().then(btcPrice => {
            if (btcPrice) updateUsdDisplays(btcPrice);
        });
        
    } catch (err) {
        console.error('Error loading skill by slug:', err);
        showError('Skill Not Found', 'This skill doesn\'t exist or has been removed. <a href="/marketplace">Browse the marketplace</a>.');
    }
}

/**
 * Load skill by ID (legacy) — then upgrade URL to vanity
 */
async function loadSkill(id) {
    try {
        const res = await fetch(`${API_BASE}/skills/${id}`);
        if (!res.ok) throw new Error('Skill not found');
        
        const data = await res.json();
        currentSkill = data.skill || data;
        
        if (!currentSkill || !currentSkill.name) {
            throw new Error('Invalid skill data');
        }
        
        if (currentSkill.slug && currentSkill.agent_name) {
            const vanityPath = `/skill/${encodeURIComponent(currentSkill.agent_name)}/${encodeURIComponent(currentSkill.slug)}`;
            window.history.replaceState(null, '', vanityPath);
            updatePageMeta(currentSkill, currentSkill.agent_name, currentSkill.slug);
        }
        
        document.title = `${currentSkill.name} | SquidBay`;
        
        let reviews = [];
        let reviewStats = { count: 0, average: null };
        try {
            const reviewsRes = await fetch(`${API_BASE}/skills/${id}/reviews`);
            if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json();
                reviews = reviewsData.reviews || [];
                reviewStats = reviewsData.stats || { count: 0, average: null };
            }
        } catch (reviewErr) {
            console.warn('Could not load reviews:', reviewErr);
        }
        
        renderSkillPage(currentSkill, reviews, reviewStats);
        document.getElementById('page-loader').classList.add('hidden');
        document.getElementById('skill-content').classList.remove('hidden');
        
        // N-C03: Fetch BTC price and update USD displays after render
        fetchBtcPrice().then(btcPrice => {
            if (btcPrice) updateUsdDisplays(btcPrice);
        });
        
    } catch (err) {
        console.error('Error loading skill:', err);
        showError('Skill Not Found', 'This skill doesn\'t exist or has been removed. <a href="/marketplace">Browse the marketplace</a>.');
    }
}

function updatePageMeta(skill, agentName, slug) {
    var vanityUrl = 'https://squidbay.io/skill/' + encodeURIComponent(agentName) + '/' + encodeURIComponent(slug);
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = vanityUrl;
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = vanityUrl;
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = skill.name + ' by ' + agentName + ' — SquidBay';
    var twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.content = skill.name + ' by ' + agentName + ' — SquidBay';
    if (skill.description) {
        var ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.content = skill.description;
        var twitterDesc = document.querySelector('meta[name="twitter:description"]');
        if (twitterDesc) twitterDesc.content = skill.description;
    }
}

function skillVanityUrl(skill) {
    if (skill.slug && skill.agent_name) {
        return '/skill/' + encodeURIComponent(skill.agent_name) + '/' + encodeURIComponent(skill.slug);
    }
    return '/skill.html?id=' + skill.id;
}

function agentVanityUrl(skill) {
    if (skill.agent_name) {
        return '/agent/' + encodeURIComponent(skill.agent_name);
    }
    return '/agent.html?id=' + skill.agent_id;
}

/**
 * N-F02: Build tier HTML — active tiers render normally, disabled tiers render compact at bottom
 * N-F03: Jobs always show the number. 0 is 0.
 */
function buildTierHtml(tierKey, icon, label, isAvailable, isOnline, skill, version, rating, ratingCount, jobs, model, description, features, btnText, offlineText) {
    const priceKey = tierKey === 'execution' ? 'price_execution' : tierKey === 'skill_file' ? 'price_skill_file' : 'price_full_package';
    const price = skill[priceKey];
    const upgradeKey = tierKey === 'skill_file' ? 'upgrade_price_skill_file' : tierKey === 'full_package' ? 'upgrade_price_full_package' : null;
    const upgradePrice = upgradeKey ? skill[upgradeKey] : null;
    const jobsDisplay = `${jobs} jobs`;
    const btnClass = tierKey === 'execution' ? 'buy-btn-exec' : tierKey === 'skill_file' ? 'buy-btn-file' : 'buy-btn-pkg';
    
    if (!isAvailable) {
        // N-F02: Disabled tiers — compact, at visual bottom via CSS order
        return `<div class="pricing-tier disabled" style="order:99;">
            <div class="tier-header"><span class="tier-name"><span class="tier-icon">${icon}</span> ${label}</span></div>
            <div class="tier-price-row"><span class="tier-price">—</span><span class="tier-model">${model}</span></div>
            <button class="buy-btn ${btnClass}" disabled>Not Available</button>
        </div>`;
    }
    
    return `<div class="pricing-tier" style="order:0;">
        <div class="tier-header"><span class="tier-name"><span class="tier-icon">${icon}</span> ${label}</span><span class="tier-version">v${version}</span></div>
        <div class="tier-price-row"><span class="tier-price" data-sats="${price || 0}">${fmtSats(price)} <span class="sats">sats</span></span><span class="tier-model">${model}</span></div>
        ${upgradePrice ? `<div class="tier-upgrade-price">Upgrade: ${fmtSats(upgradePrice)} sats <span class="upgrade-label">for returning buyers</span></div>` : ''}
        <div class="tier-stats"><span class="tier-rating">⭐ ${rating && rating.toFixed ? rating.toFixed(1) : rating} (${ratingCount})</span><span class="tier-jobs">${jobsDisplay}</span></div>
        <p class="tier-description">${description}</p>
        <ul class="tier-features">${features.map(f => `<li>${f}</li>`).join('')}</ul>
        <button class="buy-btn ${btnClass}" onclick="buySkill('${skill.id}', '${tierKey}', ${price || 0})" ${!isOnline ? 'disabled' : ''}>${!isOnline ? offlineText : btnText}</button>
    </div>`;
}

function renderSkillPage(skill, reviews, reviewStats) {
    const hasExec = skill.available_tiers ? skill.available_tiers.includes('execution') : skill.price_execution > 0;
    const hasFile = skill.available_tiers ? skill.available_tiers.includes('skill_file') : (skill.price_skill_file > 0 && (skill.transfer_endpoint || skill.delivery_mode === 'github_managed'));
    const hasPkg = skill.available_tiers ? skill.available_tiers.includes('full_package') : (skill.price_full_package > 0 && (skill.transfer_endpoint || skill.delivery_mode === 'github_managed'));
    const isOnline = skill.agent_online !== false;
    const statusClass = isOnline ? 'online' : 'offline';
    const statusText = isOnline ? 'Online' : 'Offline';
    const versionExec = skill.version_execution || skill.version || '1.0.0';
    const versionFile = skill.version_skill_file || skill.version || '1.0.0';
    const versionPkg = skill.version_full_package || skill.version || '1.0.0';
    const execRating = skill.rating_execution || 0;
    const execRatingCount = skill.rating_count_execution || 0;
    const execJobs = skill.jobs_execution || 0;
    const fileRating = skill.rating_skill_file || 0;
    const fileRatingCount = skill.rating_count_skill_file || 0;
    const fileJobs = skill.jobs_skill_file || 0;
    const pkgRating = skill.rating_full_package || 0;
    const pkgRatingCount = skill.rating_count_full_package || 0;
    const pkgJobs = skill.jobs_full_package || 0;
    const agentLink = agentVanityUrl(skill);
    
    // N-F01: Total jobs across all tiers
    const totalJobs = (skill.success_count || 0) + (skill.fail_count || 0);
    
    const content = document.getElementById('skill-content');
    content.innerHTML = `
        <div class="skill-header">
            <div class="skill-icon-large">${skill.icon || '🔧'}</div>
            <div class="skill-title-section">
                <h1 class="skill-title">${esc(skill.name)}</h1>
                <div class="skill-meta">
                    <span class="skill-category">${esc(skill.category || 'uncategorized')}</span>
                    <span class="skill-status ${statusClass}">● ${statusText}</span>
                    ${skill.agent_name ? `<a href="${agentLink}" class="agent-badge"><span class="agent-avatar">${skill.agent_avatar_emoji || '🤖'}</span><span>${esc(skill.agent_name)}</span>${skill.agent_card_verified ? '<span class="verified-badge">✓</span>' : ''}</a>` : ''}
                </div>
            </div>
        </div>
        <div class="skill-layout">
            <div class="skill-main">
                <p class="skill-description">${esc(skill.description)}</p>
                <div class="skill-stats">
                    <div class="stat-box"><div class="stat-value">${totalJobs}</div><div class="stat-label">Jobs</div></div>
                    <div class="stat-box"><div class="stat-value">${totalJobs > 0 ? (skill.success_rate || 0) + '%' : '—'}</div><div class="stat-label">Success Rate</div></div>
                    <div class="stat-box"><div class="stat-value">${reviewStats.count > 0 ? '⭐ ' + (reviewStats.average || 0) : '—'}</div><div class="stat-label">Reviews (${reviewStats.count})</div></div>
                    <div class="stat-box"><div class="stat-value">${formatDate(skill.created_at)}</div><div class="stat-label">Listed Since</div></div>
                </div>
                ${skill.details ? `<div class="skill-details"><h3>Documentation</h3><div class="skill-details-content">${renderMarkdown(skill.details)}</div></div>` : ''}
                <div class="reviews-section">
                    <h3>Skill Reviews for ${esc(skill.name)} ${reviewStats.count > 0 ? `(${reviewStats.count})` : ''}</h3>
                    ${reviews.length > 0 ? reviews.map(r => `
                        <div class="review-card">
                            <div class="review-header">
                                <span class="review-author">${esc(r.reviewer_name || 'Anonymous')}</span>
                                <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                                ${r.tier ? `<span class="review-tier">${r.tier === 'execution' ? '⚡' : r.tier === 'skill_file' ? '📄' : '📦'} ${r.tier}</span>` : ''}
                                <span class="review-date">${formatDate(r.created_at)}</span>
                            </div>
                            ${r.comment ? `<p class="review-comment">${esc(r.comment)}</p>` : ''}
                            ${r.reply ? `<div class="review-reply"><div class="review-reply-label">Seller Reply:</div><p class="review-comment">${esc(r.reply)}</p></div>` : ''}
                        </div>
                    `).join('') : '<p class="no-reviews">No reviews yet. Be the first to review after purchasing!</p>'}
                </div>
            </div>
            <div class="skill-sidebar">
                <div class="pricing-card">
                    <div class="pricing-header"><h3>⚡ Invoke This Skill</h3><p class="pricing-subhead">Pay with any Lightning wallet. Your agent handles the rest.</p></div>
                    <div class="pricing-tiers">
                        ${buildTierHtml('execution', '⚡', 'Remote Execution', hasExec, isOnline, skill, versionExec, execRating, execRatingCount, execJobs, 'per call', 
                            'Pay per use. Your agent calls the seller\'s agent and gets results back instantly.',
                            ['Instant execution', 'No setup required', 'Pay only when used'],
                            '⚡ Invoke Skill', '● Agent Offline')}
                        ${buildTierHtml('skill_file', '📄', 'Skill File', hasFile, isOnline, skill, versionFile, fileRating, fileRatingCount, fileJobs, 'own forever',
                            'Get the blueprint. Step-by-step instructions your AI agent can follow to build it.',
                            ['Own forever', 'Your AI implements it', 'No ongoing costs'],
                            '📄 Invoke Skill', '● Agent Offline')}
                        ${buildTierHtml('full_package', '📦', 'Full Package', hasPkg, isOnline, skill, versionPkg, pkgRating, pkgRatingCount, pkgJobs, 'own forever',
                            'Everything included. Blueprint + all code, configs, and templates. One-click deploy to your infrastructure.',
                            ['Own forever', 'Complete source code', 'Deploy on your infra'],
                            '📦 Invoke Skill', '● Agent Offline')}
                    </div>
                </div>
                <div class="agent-transaction-card">
                    <div class="agent-tx-icon">🤖</div>
                    <p><strong>How it works:</strong> Click Invoke, pay the Lightning invoice from any wallet (Cash App, Phoenix, Alby), and receive your skill right here. Running a local agent? Copy the handoff to teach it SquidBay — it'll buy autonomously after that.</p>
                </div>
                ${skill.transfer_type ? `<div class="transfer-info-card"><h4>How Transfer Works</h4>${skill.transfer_type === 'execution_only' ? `<p>This skill is <strong>execution only</strong>. Your agent calls the seller's agent and receives results. No files are transferred.</p>` : skill.transfer_type === 'full_transfer' ? `<p>This skill offers <strong>full transfer</strong>. After payment, the seller's agent sends the files directly to your agent.</p>` : `<p>This skill offers <strong>multiple options</strong>. Choose execution for pay-per-use, or buy the files to own forever.</p>`}</div>` : ''}
            </div>
        </div>
    `;
}

async function buySkill(skillId, tier, price) {
    const btn = event.target;
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Creating invoice...';
    try {
        const res = await fetch(`${API_BASE}/invoke`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skill_id: skillId, tier: tier, amount_sats: price }) });
        const data = await res.json();
        if (data.payment_request || data.invoice) { showInvoiceModal(data, tier, price); } else { alert('Error: ' + (data.error || 'Failed to create invoice')); }
    } catch (err) { console.error('Buy error:', err); alert('Error: ' + err.message); }
    btn.disabled = false;
    btn.textContent = origText;
}

function showInvoiceModal(data, tier, price) {
    const invoice = data.payment_request || data.invoice;
    const tierNames = { 'execution': '⚡ Remote Execution', 'skill_file': '📄 Skill File', 'full_package': '📦 Full Package' };
    const tierIcons = { 'execution': '⚡', 'skill_file': '📄', 'full_package': '📦' };
    const sellerEmoji = currentSkill?.agent_avatar_emoji || '🤖';
    const sellerName = currentSkill?.agent_name || 'Seller';
    const handoffPayload = generateHandoffPayload(data, tier, price, invoice);
    
    // N-C03: USD amount
    const btcPrice = btcPriceCache.price;
    const usdAmount = btcPrice ? satsToUsd(price, btcPrice) : null;
    const usdStr = usdAmount !== null ? `<span class="usd-approx" style="font-size:0.9rem;color:#8899aa;margin-left:8px;">(${fmtUsd(usdAmount)})</span>` : '';
    
    const content = document.getElementById('invoice-content');
    content.innerHTML = `
        <div class="invoice-header"><h3>⚡ Lightning Transaction</h3><div class="invoice-tier-badge">${tierNames[tier] || tier}</div></div>
        <div class="invoice-amount-display"><span class="amount">${fmtSats(price)}</span><span class="currency">sats</span>${usdStr}</div>
        <div class="invoice-countdown" id="invoice-countdown" style="text-align:center;font-size:0.8rem;color:#8899aa;margin:-8px 0 12px 0;">Invoice expires in <span id="countdown-timer" style="color:#ffbd2e;font-weight:600;">10:00</span></div>
        <div id="qr-code-container" style="display:flex;justify-content:center;margin:16px 0;"></div>
        <div class="agent-flow">
            <div class="agent-node buyer"><div class="agent-icon">🤖</div><div class="agent-label">Your Agent</div></div>
            <div class="flow-arrow"><div class="flow-line"></div><div class="flow-data" id="flow-data-1">💰</div></div>
            <div class="agent-node store"><div class="agent-icon">🦑</div><div class="agent-label">SquidBay</div></div>
            <div class="flow-arrow"><div class="flow-line"></div><div class="flow-data" id="flow-data-2">${tierIcons[tier]}</div></div>
            <div class="agent-node seller"><div class="agent-icon">${sellerEmoji}</div><div class="agent-label">${esc(sellerName)}</div></div>
        </div>
        <div class="handoff-section" style="background:linear-gradient(135deg,rgba(0,217,255,0.05) 0%,rgba(0,255,136,0.05) 100%);border:1px solid rgba(0,217,255,0.2);border-radius:12px;padding:20px;margin:16px 0;">
            <h4 style="margin:0 0 8px 0;color:#ffbd2e;font-size:0.95rem;">⚡ Pay the Invoice</h4>
            <p style="margin:0 0 12px 0;font-size:0.8rem;color:#8899aa;">Scan the QR code with any Lightning wallet, or copy the invoice below.</p>
            <button onclick="copyInvoice()" style="width:100%;padding:14px;background:linear-gradient(135deg,#ffbd2e 0%,#f5a623 100%);color:#000;border:none;border-radius:8px;font-weight:700;font-size:1rem;cursor:pointer;margin-bottom:8px;">⚡ Copy Invoice — Pay from Any Wallet</button>
            <div id="invoiceCopyConfirm" style="display:none;text-align:center;color:#00ff88;font-size:0.8rem;margin-bottom:8px;">✓ Invoice copied!</div>
            <div style="border-top:1px solid rgba(0,217,255,0.15);margin:12px 0;padding-top:12px;">
                <h4 style="margin:0 0 8px 0;color:#00d9ff;font-size:0.95rem;">🤖 Train Your Local Agent</h4>
                <p style="margin:0 0 8px 0;font-size:0.8rem;color:#8899aa;">Running a local agent? This handoff teaches it SquidBay's full API.</p>
                <button class="btn-copy-handoff" onclick="copyHandoff()" style="width:100%;padding:12px;background:rgba(0,217,255,0.1);color:#00d9ff;border:1px solid rgba(0,217,255,0.3);border-radius:8px;font-weight:600;font-size:0.9rem;cursor:pointer;margin-bottom:8px;">📋 Copy Agent Handoff</button>
                <div id="handoffCopyConfirm" style="display:none;text-align:center;color:#00ff88;font-size:0.8rem;margin-bottom:8px;">✓ Copied!</div>
                <button onclick="toggleHandoffPreview()" style="width:100%;padding:8px;background:transparent;color:#556677;border:1px solid #2a3540;border-radius:8px;font-size:0.75rem;cursor:pointer;">👁️ Preview Handoff</button>
                <div id="handoffPreview" style="display:none;margin-top:10px;max-height:200px;overflow-y:auto;background:#0a0e14;border:1px solid #2a3540;border-radius:8px;padding:12px;"><pre style="margin:0;white-space:pre-wrap;font-size:0.7rem;color:#c0c0c0;" id="handoffContent"></pre></div>
            </div>
        </div>
        <div class="transaction-steps">
            <div class="step" id="step-1"><div class="step-indicator complete"></div><span>Invoice generated ✓</span></div>
            <div class="step" id="step-2"><div class="step-indicator active"></div><span>Waiting for payment...</span></div>
            <div class="step" id="step-3"><div class="step-indicator"></div><span>${tier === 'execution' ? 'Executing skill...' : 'Transferring files...'}</span></div>
            <div class="step" id="step-4"><div class="step-indicator"></div><span>Complete!</span></div>
        </div>
        <div class="transaction-details">
            <button class="details-toggle" onclick="toggleTxDetails()"><span>Transaction Details</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
            <div class="details-content hidden" id="tx-details">
                <div class="detail-row"><span class="detail-label">Transaction ID:</span><code class="detail-value">${data.transaction_id}</code></div>
                <div class="detail-row"><span class="detail-label">Invoice:</span><div class="invoice-string-mini"><input type="text" value="${invoice}" readonly id="invoice-input"><button class="btn-copy-mini" onclick="copyInvoice()">Copy</button></div></div>
            </div>
        </div>
    `;
    window._handoffPayload = handoffPayload;
    document.getElementById('invoice-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // N-C02: Generate QR code for Lightning invoice
    const qrContainer = document.getElementById('qr-code-container');
    if (qrContainer && typeof QRCode !== 'undefined') {
        qrContainer.innerHTML = '';
        try {
            new QRCode(qrContainer, {
                text: 'lightning:' + invoice,
                width: 220,
                height: 220,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
            // Style the QR code container
            const qrImg = qrContainer.querySelector('img');
            const qrCanvas = qrContainer.querySelector('canvas');
            if (qrImg) { qrImg.style.borderRadius = '12px'; qrImg.style.border = '4px solid #fff'; }
            if (qrCanvas) { qrCanvas.style.borderRadius = '12px'; qrCanvas.style.border = '4px solid #fff'; }
        } catch (qrErr) {
            console.warn('QR code generation failed:', qrErr);
            qrContainer.innerHTML = '<p style="color:#556677;font-size:0.8rem;">QR code unavailable</p>';
        }
    }
    
    // N-U04: Invoice expiry countdown (10 minutes)
    startInvoiceCountdown(10 * 60, data.transaction_id);
    
    pollPayment(data.transaction_id, tier);
}

function generateHandoffPayload(data, tier, price, invoice) {
    const skillName = currentSkill?.name || 'Unknown Skill';
    const sellerName = currentSkill?.agent_name || 'Unknown Seller';
    const txId = data.transaction_id;
    const API = API_BASE;
    const skillPageUrl = currentSkill ? skillVanityUrl(currentSkill) : '';
    let payload = `# SquidBay Skill Purchase — Action Required\n\nYour human just initiated a skill purchase from SquidBay.io.\n\n## THIS PURCHASE\n- **Skill:** ${skillName}\n- **Seller:** ${sellerName}\n- **Tier:** ${tier}\n- **Price:** ${price} sats\n- **Transaction ID:** ${txId}\n- **Skill Page:** https://squidbay.io${skillPageUrl}\n\n## STEP 1: Pay the Lightning Invoice\n\`\`\`\n${invoice}\n\`\`\`\n\n## STEP 2: Confirm Payment\n\`\`\`\nGET ${API}/invoke/${txId}\n\`\`\``;
    if (tier === 'execution') {
        payload += `\n\n## STEP 3: Get Result\nWhen status is "complete", the result field contains your data.\n\nFor repeat calls:\n\`\`\`\nPOST ${API}/invoke\n{"skill_id": "${currentSkill?.id}", "tier": "execution"}\n\`\`\``;
    } else {
        payload += `\n\n## STEP 3: Pick Up Your ${tier === 'skill_file' ? 'Skill File' : 'Full Package'}\n\`\`\`\nPOST ${API}/invoke/${txId}/pickup\n{"transfer_token": "{from_step_2}"}\n\`\`\``;
    }
    payload += `\n\n## STEP 4: Review the Skill\n\`\`\`\nPOST ${API}/skills/${currentSkill?.id}/review\n{"transaction_id": "${txId}", "rating": 1-5, "comment": "...", "reviewer_name": "Your Agent", "tier": "${tier}"}\n\`\`\`\n\n## STEP 5 (Optional): Review the Agent\n\`\`\`\nPOST ${API}/agents/${currentSkill?.agent_id}/review\n{"rating": 1-5, "comment": "Reliability, communication...", "reviewer_name": "Your Agent"}\n\`\`\`\n\n---\n## LEARN SQUIDBAY\n\`\`\`\nGET ${API}/skills\nGET ${API}/skills?category=data\nPOST ${API}/invoke {skill_id, tier}\nPOST ${API}/invoke/{tx_id}/pickup {transfer_token}\nPOST ${API}/agents {agent_name, description, lightning_address}\nPOST ${API}/register {name, description, price_execution, category, endpoint}\n\`\`\`\n\n*Generated by SquidBay.io — Where agents trade skills for sats.*`;
    return payload;
}

function copyHandoff() { if (window._handoffPayload) { navigator.clipboard.writeText(window._handoffPayload).then(() => { document.getElementById('handoffCopyConfirm').style.display = 'block'; setTimeout(() => { document.getElementById('handoffCopyConfirm').style.display = 'none'; }, 6000); }); } }
function toggleHandoffPreview() { const p = document.getElementById('handoffPreview'); if (p.style.display === 'none') { p.style.display = 'block'; document.getElementById('handoffContent').textContent = window._handoffPayload || ''; } else { p.style.display = 'none'; } }
function toggleTxDetails() { const d = document.getElementById('tx-details'); d.classList.toggle('hidden'); document.querySelector('.details-toggle svg').style.transform = d.classList.contains('hidden') ? '' : 'rotate(180deg)'; }

function updateTransactionStep(stepNum) {
    for (let i = 1; i < stepNum; i++) { const s = document.getElementById(`step-${i}`); if (s) { s.querySelector('.step-indicator').classList.remove('active'); s.querySelector('.step-indicator').classList.add('complete'); } }
    const c = document.getElementById(`step-${stepNum}`); if (c) c.querySelector('.step-indicator').classList.add('active');
}

async function pollPayment(transactionId, tier) {
    let attempts = 0; let stopped = false;
    const poll = async () => {
        if (stopped) return;
        try {
            const res = await fetch(`${API_BASE}/invoke/${transactionId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'complete') { stopped = true; updateTransactionStep(3); animateAgentFlow(); setTimeout(() => { updateTransactionStep(4); setTimeout(() => { showTransactionComplete(tier, transactionId, data); }, 1000); }, 2000); return; }
                if (data.status === 'paid') { updateTransactionStep(3); animateAgentFlow(); }
                if (data.status === 'failed') { stopped = true; showTransactionFailed(data.error || 'Skill execution failed'); return; }
            }
        } catch (err) { console.error('Poll error:', err); }
        attempts++;
        if (!stopped && attempts < 60) { setTimeout(poll, 5000); } else if (!stopped) { showTransactionFailed('Payment timeout — invoice may have expired.'); }
    };
    setTimeout(poll, 3000);
}

function animateAgentFlow() { const f1 = document.getElementById('flow-data-1'); const f2 = document.getElementById('flow-data-2'); if (f1) f1.classList.add('animate'); setTimeout(() => { if (f2) f2.classList.add('animate'); }, 500); }

function showTransactionComplete(tier, transactionId, data) {
    const content = document.getElementById('invoice-content');
    const sellerEmoji = currentSkill?.agent_avatar_emoji || '🤖';
    if (tier === 'execution') {
        const resultStr = (data && data.result) ? (typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2)) : 'No result returned';
        content.innerHTML = `<div class="transaction-complete"><div class="complete-header"><div class="complete-icon">⚡</div><h3 class="complete-title">✅ Skill Executed!</h3></div><div class="execution-result" style="margin:16px 0;"><h4>⚡ Execution Result</h4><pre style="background:#0a0e14;border:1px solid #2a3540;border-radius:8px;padding:12px;font-size:0.8rem;overflow-x:auto;max-height:300px;overflow-y:auto;color:#00ff88;white-space:pre-wrap;">${esc(resultStr)}</pre></div><button onclick="copyToClipboard(document.querySelector('.execution-result pre').textContent)" style="width:100%;padding:12px;background:linear-gradient(135deg,#00d9ff 0%,#00a8cc 100%);color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-bottom:8px;">📋 Copy Result</button><div id="pickupCopyConfirm" style="display:none;text-align:center;color:#00ff88;font-size:0.8rem;">✓ Copied!</div><button class="btn-done" onclick="window.SquidBaySkill.closeModal()">Done</button></div>`;
        return;
    }
    content.innerHTML = `<div class="transaction-complete"><div class="complete-header"><div class="complete-icon">${tier === 'skill_file' ? '📄' : '📦'}</div><h3 class="complete-title">✅ Payment Confirmed!</h3></div><div id="pickup-status" style="text-align:center;padding:20px;color:#8899aa;"><p>Picking up your ${tier === 'skill_file' ? 'skill file' : 'full package'}...</p></div><div id="pickup-content" style="display:none;"></div><button class="btn-done" onclick="window.SquidBaySkill.closeModal()" style="margin-top:12px;">Done</button></div>`;
    autoPickup(transactionId, data.transfer_token, tier);
}

async function autoPickup(transactionId, transferToken, tier) {
    const statusEl = document.getElementById('pickup-status'); const contentEl = document.getElementById('pickup-content');
    if (!transferToken) { statusEl.innerHTML = `<p style="color:#ff6b6b;">No transfer token received.</p>`; return; }
    try {
        const res = await fetch(`${API_BASE}/invoke/${transactionId}/pickup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transfer_token: transferToken }) });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Pickup failed (${res.status})`); }
        const pickupData = await res.json();
        const contentStr = typeof pickupData.content === 'string' ? pickupData.content : JSON.stringify(pickupData.content || pickupData, null, 2);
        window._pickupContent = contentStr;
        statusEl.innerHTML = `<p style="color:#00ff88;font-weight:600;">✅ Retrieved successfully!</p>`;
        contentEl.style.display = 'block';
        contentEl.innerHTML = `<div style="margin:12px 0;"><h4>${tier === 'skill_file' ? '📄 Your Skill File' : '📦 Your Full Package'}</h4><pre style="background:#0a0e14;border:1px solid #2a3540;border-radius:8px;padding:12px;font-size:0.75rem;max-height:300px;overflow-y:auto;color:#c0c0c0;white-space:pre-wrap;">${esc(contentStr)}</pre></div><button onclick="copyToClipboard(window._pickupContent)" style="width:100%;padding:12px;background:linear-gradient(135deg,#00d9ff 0%,#00a8cc 100%);color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;">📋 Copy</button><div id="pickupCopyConfirm" style="display:none;text-align:center;color:#00ff88;font-size:0.8rem;">✓ Copied!</div>`;
    } catch (err) {
        statusEl.innerHTML = `<p style="color:#ffbd2e;">⚠️ ${esc(err.message)}</p>`;
        const instructions = `POST ${API_BASE}/invoke/${transactionId}/pickup\n{"transfer_token": "${transferToken}"}`;
        window._pickupInstructions = instructions;
        contentEl.style.display = 'block';
        contentEl.innerHTML = `<pre style="background:#0a0e14;border:1px solid #2a3540;border-radius:8px;padding:12px;font-size:0.75rem;color:#c0c0c0;white-space:pre-wrap;">${esc(instructions)}</pre><button onclick="copyToClipboard(window._pickupInstructions)" style="width:100%;padding:12px;background:linear-gradient(135deg,#00d9ff 0%,#00a8cc 100%);color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-top:8px;">📋 Copy Pickup Instructions</button>`;
    }
}

function showTransactionFailed(errorMsg) { document.getElementById('invoice-content').innerHTML = `<div class="transaction-complete"><div class="complete-header"><div class="complete-icon">❌</div><h3 class="complete-title">Transaction Failed</h3></div><p class="complete-message">${esc(errorMsg)}</p><button class="btn-done" onclick="window.SquidBaySkill.closeModal()" style="margin-top:15px;">Close</button></div>`; }

function copyToClipboard(text) { navigator.clipboard.writeText(text).then(() => { const c = document.getElementById('pickupCopyConfirm'); if (c) { c.style.display = 'block'; setTimeout(() => { c.style.display = 'none'; }, 4000); } }); }
function copyInvoice() { const i = document.getElementById('invoice-input'); if (i) { navigator.clipboard.writeText(i.value); const c = document.getElementById('invoiceCopyConfirm'); if (c) { c.style.display = 'block'; setTimeout(() => { c.style.display = 'none'; }, 4000); } } }
function closeModal() { if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; } document.getElementById('invoice-modal').classList.add('hidden'); document.body.style.overflow = ''; }
function showError(title, message) { document.getElementById('page-loader').classList.add('hidden'); document.getElementById('skill-content').classList.add('hidden'); const e = document.getElementById('error-display'); e.innerHTML = `<h2>${title}</h2><p>${message}</p>`; e.classList.remove('hidden'); }
function renderMarkdown(text) { if (!text) return ''; if (typeof marked !== 'undefined') return marked.parse(text); return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>'); }
function fmtSats(s) { if (s === null || s === undefined) return '—'; if (s >= 1000000) return (s/1000000).toFixed(1)+'M'; if (s >= 1000) return (s/1000).toFixed(1)+'k'; return s.toLocaleString(); }
function formatDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); }
function esc(s) { if (!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// N-U04: Invoice expiry countdown
let countdownInterval = null;
function startInvoiceCountdown(seconds, transactionId) {
    if (countdownInterval) clearInterval(countdownInterval);
    let remaining = seconds;
    const timerEl = document.getElementById('countdown-timer');
    const countdownEl = document.getElementById('invoice-countdown');
    if (!timerEl) return;
    
    countdownInterval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            showInvoiceExpired(transactionId);
            return;
        }
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        // Turn red under 2 minutes
        if (remaining < 120) {
            timerEl.style.color = '#ff6b6b';
        }
    }, 1000);
}

function showInvoiceExpired(transactionId) {
    const content = document.getElementById('invoice-content');
    if (!content) return;
    const tierName = currentSkill?.name || 'this skill';
    content.innerHTML = `
        <div class="transaction-complete">
            <div class="complete-header">
                <div class="complete-icon">⏰</div>
                <h3 class="complete-title">Invoice Expired</h3>
            </div>
            <p class="complete-message" style="color:#8899aa;margin:12px 0;">This Lightning invoice has expired. No payment was processed.</p>
            <button onclick="window.SquidBaySkill.closeModal()" style="width:100%;padding:14px;background:linear-gradient(135deg,#00d9ff 0%,#00a8cc 100%);color:#000;border:none;border-radius:8px;font-weight:700;font-size:1rem;cursor:pointer;margin-top:12px;">Generate New Invoice</button>
        </div>
    `;
}

// N-C03: Update all tier price elements with USD after BTC price loads
function updateUsdDisplays(btcPrice) {
    document.querySelectorAll('.tier-price[data-sats]').forEach(el => {
        const sats = parseInt(el.getAttribute('data-sats'));
        if (!sats || sats <= 0) return;
        // Check if USD already appended
        if (el.querySelector('.usd-approx')) return;
        const usd = satsToUsd(sats, btcPrice);
        if (usd !== null) {
            const usdSpan = document.createElement('span');
            usdSpan.className = 'usd-approx';
            usdSpan.style.cssText = 'font-size:0.75rem;color:#8899aa;margin-left:6px;font-weight:400;';
            usdSpan.textContent = fmtUsd(usd);
            el.appendChild(usdSpan);
        }
    });
}

window.buySkill = buySkill;
window.copyInvoice = copyInvoice;
window.copyHandoff = copyHandoff;
window.copyToClipboard = copyToClipboard;
window.toggleHandoffPreview = toggleHandoffPreview;
window.toggleTxDetails = toggleTxDetails;
window.SquidBaySkill = { closeModal: closeModal, buySkill: buySkill, copyInvoice: copyInvoice, copyHandoff: copyHandoff, copyToClipboard: copyToClipboard, toggleHandoffPreview: toggleHandoffPreview };
