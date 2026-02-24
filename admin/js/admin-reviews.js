// ==================== ADMIN REVIEWS ====================
// Review moderation, report flags, soft-delete with reason, audit log

const AdminReviews = (() => {

    let allReviews = [];
    let reportedReviews = [];
    let currentTab = 'all'; // all | reported | moderated
    let currentSearch = '';
    let currentSort = 'date-desc';

    // ==================== SVG ICONS ====================

    const ICONS = {
        flag: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>',
        trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
        eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
        check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        alertTriangle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        star: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
        starEmpty: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
        undo: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>'
    };

    // ==================== MAIN LOAD ====================

    async function load() {
        const body = document.getElementById('reviewsBody');
        body.innerHTML = '<p class="loading-msg">Loading reviews...</p>';

        try {
            // Try admin endpoint first (returns all reviews including moderated)
            let adminData;
            try {
                adminData = await AdminCore.apiGet('/admin/reviews');
                allReviews = adminData.reviews || [];
            } catch (e) {
                // Fallback: aggregate from all agents
                allReviews = await aggregateReviews();
            }

            // Try to load reported reviews
            try {
                const reported = await AdminCore.apiGet('/admin/reviews/reported');
                reportedReviews = reported.reviews || reported.reports || [];
            } catch (e) {
                reportedReviews = [];
            }

            // Update badge
            updateReportBadge();

            renderControls(body);
            renderReviews();

        } catch (err) {
            body.innerHTML = `<p class="loading-msg" style="color:var(--red)">Error loading reviews: ${AdminCore.esc(err.message)}</p>`;
        }
    }

    // Fallback: pull reviews from all agents if admin endpoint doesn't exist yet
    async function aggregateReviews() {
        const agentsData = await AdminCore.publicGet('/agents');
        const agents = agentsData.agents || [];
        const reviews = [];

        for (const agent of agents) {
            try {
                const detail = await AdminCore.publicGet(`/agents/${agent.id}`);
                const agentReviews = detail.reviews || [];
                agentReviews.forEach(r => {
                    r.agent_name = agent.agent_name;
                    r.agent_id = agent.id;
                    reviews.push(r);
                });
            } catch (e) {}
        }

        return reviews;
    }

    function updateReportBadge() {
        const count = reportedReviews.filter(r => !r.acknowledged && !r.resolved).length;
        const badge = document.getElementById('reportCountBadge');
        const navBadge = document.getElementById('navBadgeReviews');

        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
        if (navBadge) {
            navBadge.textContent = count;
            navBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    // ==================== CONTROLS ====================

    function renderControls(body) {
        const moderatedCount = allReviews.filter(r => r.is_active === false || r.is_active === 0).length;
        const activeCount = allReviews.filter(r => r.is_active !== false && r.is_active !== 0).length;

        body.innerHTML = `
            <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
                <input type="text" class="form-input" id="reviewSearchInput" placeholder="Search reviews..."
                    style="max-width:260px;padding:7px 12px;font-size:0.82rem;" value="${AdminCore.esc(currentSearch)}">

                <div class="btn-group">
                    <button class="btn btn-sm${currentTab === 'all' ? ' btn-primary' : ''}" id="tabAll">All (${allReviews.length})</button>
                    <button class="btn btn-sm${currentTab === 'reported' ? ' btn-primary' : ''}" id="tabReported" style="${reportedReviews.length > 0 ? 'color:var(--orange);' : ''}">
                        ${ICONS.flag} Reported (${reportedReviews.length})
                    </button>
                    ${moderatedCount > 0 ? `<button class="btn btn-sm${currentTab === 'moderated' ? ' btn-primary' : ''}" id="tabModerated">Moderated (${moderatedCount})</button>` : ''}
                </div>

                <select class="form-input" id="reviewSortSelect" style="max-width:160px;padding:7px 12px;font-size:0.82rem;">
                    <option value="date-desc"${currentSort === 'date-desc' ? ' selected' : ''}>Newest</option>
                    <option value="date-asc"${currentSort === 'date-asc' ? ' selected' : ''}>Oldest</option>
                    <option value="rating-asc"${currentSort === 'rating-asc' ? ' selected' : ''}>Lowest Rating</option>
                    <option value="rating-desc"${currentSort === 'rating-desc' ? ' selected' : ''}>Highest Rating</option>
                </select>
            </div>

            <div id="reviewsTableContainer"></div>
        `;

        // Bind events
        document.getElementById('reviewSearchInput').addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase().trim();
            renderReviews();
        });
        document.getElementById('reviewSortSelect').addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderReviews();
        });
        document.getElementById('tabAll').addEventListener('click', () => { currentTab = 'all'; renderControls(body); renderReviews(); });
        document.getElementById('tabReported').addEventListener('click', () => { currentTab = 'reported'; renderControls(body); renderReviews(); });
        document.getElementById('tabModerated')?.addEventListener('click', () => { currentTab = 'moderated'; renderControls(body); renderReviews(); });
    }

    // ==================== REVIEW LIST ====================

    function renderReviews() {
        const container = document.getElementById('reviewsTableContainer');
        if (!container) return;

        let list;
        if (currentTab === 'reported') {
            list = reportedReviews;
        } else if (currentTab === 'moderated') {
            list = allReviews.filter(r => r.is_active === false || r.is_active === 0);
        } else {
            list = allReviews;
        }

        // Search
        if (currentSearch) {
            list = list.filter(r =>
                (r.reviewer_name || '').toLowerCase().includes(currentSearch) ||
                (r.comment || '').toLowerCase().includes(currentSearch) ||
                (r.skill_name || '').toLowerCase().includes(currentSearch) ||
                (r.agent_name || '').toLowerCase().includes(currentSearch)
            );
        }

        // Sort
        list = [...list].sort((a, b) => {
            switch (currentSort) {
                case 'date-desc': return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'date-asc': return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                case 'rating-asc': return (a.rating || 0) - (b.rating || 0);
                case 'rating-desc': return (b.rating || 0) - (a.rating || 0);
                default: return 0;
            }
        });

        if (list.length === 0) {
            const msg = currentTab === 'reported' ? 'No reported reviews.' :
                        currentTab === 'moderated' ? 'No moderated reviews.' :
                        'No reviews found.';
            container.innerHTML = `<p class="loading-msg" style="color:var(--text-dim)">${msg}</p>`;
            return;
        }

        container.innerHTML = list.map(r => renderReviewCard(r)).join('');

        // Bind actions
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', handleAction);
        });
    }

    function renderReviewCard(r) {
        const isModerated = r.is_active === false || r.is_active === 0;
        const stars = renderStars(r.rating || 0);
        const hasComment = r.comment && r.comment.trim();
        const isReported = currentTab === 'reported';

        return `<div class="cmd-card" style="${isModerated ? 'opacity:0.5;border-color:var(--red);' : ''}${isReported ? 'border-color:var(--orange);' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
                <div style="flex:1;min-width:200px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="color:var(--orange);">${stars}</span>
                        <span style="font-size:0.82rem;font-weight:600;">${AdminCore.esc(r.reviewer_name || 'Anonymous')}</span>
                        ${r.tier ? `<span class="badge badge-${r.tier === 'execution' ? 'exec' : r.tier === 'skill_file' ? 'file' : 'pkg'}" style="font-size:0.6rem;">${AdminCore.esc(r.tier)}</span>` : ''}
                        ${isModerated ? '<span class="badge badge-failed" style="font-size:0.6rem;">Moderated</span>' : ''}
                    </div>
                    <div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:6px;">
                        Skill: <strong style="color:var(--text);">${AdminCore.esc(r.skill_name || '--')}</strong>
                        ${r.agent_name ? ` &middot; Agent: ${AdminCore.esc(r.agent_name)}` : ''}
                        &middot; ${AdminCore.formatDate(r.created_at)}
                    </div>
                    ${hasComment ? `<p style="font-size:0.85rem;color:var(--text);line-height:1.5;margin-top:4px;">${AdminCore.esc(r.comment)}</p>` : '<p style="font-size:0.8rem;color:var(--text-muted);font-style:italic;">No comment</p>'}
                    ${r.reply ? `<div style="margin-top:8px;padding:8px 12px;background:var(--bg-elevated);border-radius:var(--radius);font-size:0.8rem;color:var(--text-dim);border-left:2px solid var(--accent);">
                        <span style="font-size:0.68rem;color:var(--accent);text-transform:uppercase;letter-spacing:0.5px;">Agent Reply</span><br>
                        ${AdminCore.esc(r.reply)}
                    </div>` : ''}
                    ${isModerated && r.moderation_reason ? `<div style="margin-top:6px;font-size:0.72rem;color:var(--red);">Moderation reason: ${AdminCore.esc(r.moderation_reason)}</div>` : ''}
                    ${isReported && r.report_reason ? `<div style="margin-top:6px;font-size:0.72rem;color:var(--orange);">${ICONS.alertTriangle} Report: ${AdminCore.esc(r.report_reason)}${r.report_text ? ' — ' + AdminCore.esc(r.report_text) : ''}</div>` : ''}
                </div>
                <div class="btn-group" style="flex-shrink:0;">
                    ${isReported ? `<button class="btn btn-sm" data-action="ack-report" data-id="${r.id || r.review_id}" title="Acknowledge report" style="color:var(--green);">${ICONS.check}</button>` : ''}
                    ${!isModerated
                        ? `<button class="btn btn-sm btn-danger" data-action="moderate" data-id="${r.id}" data-reviewer="${AdminCore.esc(r.reviewer_name || '')}" data-skill="${AdminCore.esc(r.skill_name || '')}" title="Moderate (soft-delete)">${ICONS.trash}</button>`
                        : `<button class="btn btn-sm" data-action="restore" data-id="${r.id}" title="Restore review" style="color:var(--green);">${ICONS.undo}</button>`
                    }
                </div>
            </div>
        </div>`;
    }

    function renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += i <= rating ? ICONS.star : ICONS.starEmpty;
        }
        return html;
    }

    // ==================== ACTIONS ====================

    function handleAction(e) {
        const btn = e.currentTarget;
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        switch (action) {
            case 'moderate': confirmModerate(id, btn.dataset.reviewer, btn.dataset.skill); break;
            case 'restore': confirmRestore(id); break;
            case 'ack-report': acknowledgeReport(id, btn); break;
        }
    }

    // ==================== MODERATE (SOFT DELETE) ====================

    function confirmModerate(id, reviewer, skill) {
        showModal(`
            <h3>Moderate Review</h3>
            <p style="margin-bottom:12px;color:var(--text-dim);font-size:0.85rem;">
                This will hide the review by <strong style="color:var(--text);">${AdminCore.esc(reviewer || 'Anonymous')}</strong>
                on <strong style="color:var(--text);">${AdminCore.esc(skill || 'unknown skill')}</strong> from public view.
                The review will NOT be deleted — it stays in the database for audit/legal purposes.
            </p>
            <div class="form-group">
                <label class="form-label">Reason (required)</label>
                <select class="form-input" id="moderateReasonSelect" style="margin-bottom:8px;">
                    <option value="">Select a reason...</option>
                    <option value="harassment">Harassment / Abuse</option>
                    <option value="spam">Spam</option>
                    <option value="threats">Threats / Violence</option>
                    <option value="defamatory">Defamatory / False</option>
                    <option value="illegal">Illegal Content</option>
                    <option value="other">Other</option>
                </select>
                <input type="text" class="form-input" id="moderateReasonText" placeholder="Additional details (optional)">
            </div>
            <div class="modal-actions">
                <button class="btn" id="cancelModerateBtn">Cancel</button>
                <button class="btn btn-danger" id="confirmModerateBtn">Moderate Review</button>
            </div>
        `);

        document.getElementById('cancelModerateBtn').addEventListener('click', () => {
            document.querySelector('.modal-overlay')?.remove();
        });

        document.getElementById('confirmModerateBtn').addEventListener('click', async () => {
            const reason = document.getElementById('moderateReasonSelect').value;
            const detail = document.getElementById('moderateReasonText').value.trim();

            if (!reason) {
                document.getElementById('moderateReasonSelect').style.borderColor = 'var(--red)';
                return;
            }

            const fullReason = detail ? `${reason}: ${detail}` : reason;

            const btn = document.getElementById('confirmModerateBtn');
            btn.textContent = 'Moderating...';
            btn.disabled = true;

            try {
                await AdminCore.apiPut(`/admin/reviews/${id}/moderate`, { reason: fullReason });
                AdminCore.logAudit('moderate_review', `Moderated review ${id}. Reason: ${fullReason}`);

                // Update local state
                const review = allReviews.find(r => r.id === id);
                if (review) {
                    review.is_active = 0;
                    review.moderation_reason = fullReason;
                }

                document.querySelector('.modal-overlay')?.remove();
                renderReviews();
            } catch (err) {
                btn.textContent = 'Error — try again';
                btn.disabled = false;
            }
        });
    }

    // ==================== RESTORE ====================

    function confirmRestore(id) {
        showModal(`
            <h3>Restore Review</h3>
            <p style="margin-bottom:16px;color:var(--text-dim);font-size:0.85rem;">
                This will make the review visible to the public again.
            </p>
            <div class="modal-actions">
                <button class="btn" id="cancelRestoreBtn">Cancel</button>
                <button class="btn btn-primary" id="confirmRestoreBtn">Restore</button>
            </div>
        `);

        document.getElementById('cancelRestoreBtn').addEventListener('click', () => {
            document.querySelector('.modal-overlay')?.remove();
        });

        document.getElementById('confirmRestoreBtn').addEventListener('click', async () => {
            const btn = document.getElementById('confirmRestoreBtn');
            btn.textContent = 'Restoring...';
            btn.disabled = true;

            try {
                await AdminCore.apiPut(`/admin/reviews/${id}/moderate`, { restore: true });
                AdminCore.logAudit('restore_review', `Restored review ${id}`);

                const review = allReviews.find(r => r.id === id);
                if (review) {
                    review.is_active = 1;
                    review.moderation_reason = null;
                }

                document.querySelector('.modal-overlay')?.remove();
                renderReviews();
            } catch (err) {
                btn.textContent = 'Error — try again';
                btn.disabled = false;
            }
        });
    }

    // ==================== ACKNOWLEDGE REPORT ====================

    async function acknowledgeReport(id, btn) {
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line></svg>';
        btn.disabled = true;

        try {
            await AdminCore.apiPut(`/admin/reviews/reports/${id}/ack`);
            AdminCore.logAudit('ack_report', `Acknowledged report on review ${id}`);

            // Remove from reported list
            reportedReviews = reportedReviews.filter(r => (r.id || r.review_id) !== id);
            updateReportBadge();
            renderReviews();
        } catch (err) {
            btn.innerHTML = origHTML;
            btn.disabled = false;
        }
    }

    // ==================== MODAL HELPER ====================

    function showModal(html) {
        document.querySelector('.modal-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `<div class="modal-box">${html}</div>`;

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        document.body.appendChild(overlay);
    }

    // ==================== PUBLIC API ====================
    return { load };

})();
