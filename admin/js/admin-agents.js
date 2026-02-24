// ==================== ADMIN AGENTS ====================
// Agent profiles, trust signals, avatar management, compliance file download

const AdminAgents = (() => {

    let allAgents = [];
    let currentSearch = '';
    let currentSort = 'name-asc';
    let currentFilter = 'all'; // all | verified | unverified | with-skills | no-skills

    // ==================== SVG ICONS ====================

    const ICONS = {
        edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
        download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
        link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>',
        check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        zap: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
        github: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>',
        globe: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
        cpu: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>',
        spinner: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line></svg>'
    };

    // ==================== MAIN LOAD ====================

    async function load() {
        const body = document.getElementById('agentsBody');
        body.innerHTML = '<p class="loading-msg">Loading agents...</p>';

        try {
            const data = await AdminCore.publicGet('/agents');
            allAgents = data.agents || [];

            // Update header count
            const countEl = document.getElementById('agentCount');
            if (countEl) countEl.textContent = `(${allAgents.length})`;

            renderControls(body);
            renderTable();

        } catch (err) {
            body.innerHTML = `<p class="loading-msg" style="color:var(--red)">Error loading agents: ${AdminCore.esc(err.message)}</p>`;
        }
    }

    // ==================== CONTROLS ====================

    function renderControls(body) {
        const verifiedCount = allAgents.filter(a => a.agent_card_verified === 1).length;
        const withSkills = allAgents.filter(a => (a.skill_count || 0) > 0).length;

        body.innerHTML = `
            <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
                <input type="text" class="form-input" id="agentSearchInput" placeholder="Search agents..."
                    style="max-width:260px;padding:7px 12px;font-size:0.82rem;" value="${AdminCore.esc(currentSearch)}">

                <select class="form-input" id="agentFilterSelect" style="max-width:180px;padding:7px 12px;font-size:0.82rem;">
                    <option value="all"${currentFilter === 'all' ? ' selected' : ''}>All (${allAgents.length})</option>
                    <option value="with-skills"${currentFilter === 'with-skills' ? ' selected' : ''}>With Skills (${withSkills})</option>
                    <option value="no-skills"${currentFilter === 'no-skills' ? ' selected' : ''}>No Skills (${allAgents.length - withSkills})</option>
                    ${verifiedCount > 0 ? `<option value="verified"${currentFilter === 'verified' ? ' selected' : ''}>A2A Verified (${verifiedCount})</option>` : ''}
                </select>

                <select class="form-input" id="agentSortSelect" style="max-width:160px;padding:7px 12px;font-size:0.82rem;">
                    <option value="name-asc"${currentSort === 'name-asc' ? ' selected' : ''}>Name A-Z</option>
                    <option value="name-desc"${currentSort === 'name-desc' ? ' selected' : ''}>Name Z-A</option>
                    <option value="skills-desc"${currentSort === 'skills-desc' ? ' selected' : ''}>Most Skills</option>
                    <option value="created-desc"${currentSort === 'created-desc' ? ' selected' : ''}>Newest</option>
                    <option value="created-asc"${currentSort === 'created-asc' ? ' selected' : ''}>Oldest</option>
                </select>
            </div>

            <div id="agentsTableContainer"></div>
        `;

        document.getElementById('agentSearchInput').addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase().trim();
            renderTable();
        });
        document.getElementById('agentFilterSelect').addEventListener('change', (e) => {
            currentFilter = e.target.value;
            renderTable();
        });
        document.getElementById('agentSortSelect').addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderTable();
        });
    }

    // ==================== TABLE ====================

    function renderTable() {
        const container = document.getElementById('agentsTableContainer');
        if (!container) return;

        let filtered = [...allAgents];

        // Filter
        if (currentFilter === 'verified') {
            filtered = filtered.filter(a => a.agent_card_verified === 1);
        } else if (currentFilter === 'with-skills') {
            filtered = filtered.filter(a => (a.skill_count || 0) > 0);
        } else if (currentFilter === 'no-skills') {
            filtered = filtered.filter(a => (a.skill_count || 0) === 0);
        }

        // Search
        if (currentSearch) {
            filtered = filtered.filter(a =>
                (a.agent_name || '').toLowerCase().includes(currentSearch) ||
                (a.lightning_address || '').toLowerCase().includes(currentSearch) ||
                (a.x_handle || '').toLowerCase().includes(currentSearch)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (currentSort) {
                case 'name-asc': return (a.agent_name || '').localeCompare(b.agent_name || '');
                case 'name-desc': return (b.agent_name || '').localeCompare(a.agent_name || '');
                case 'skills-desc': return (b.skill_count || 0) - (a.skill_count || 0);
                case 'created-desc': return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'created-asc': return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                default: return 0;
            }
        });

        if (filtered.length === 0) {
            container.innerHTML = '<p class="loading-msg" style="color:var(--text-dim)">No agents match your filters.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:40px;">Avatar</th>
                            <th>Agent</th>
                            <th>Skills</th>
                            <th>Trust Signals</th>
                            <th>Lightning</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(a => renderRow(a)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', handleAction);
        });
    }

    function renderRow(a) {
        // Avatar: custom URL > emoji > default CPU icon
        const avatar = a.avatar_url
            ? `<img src="${AdminCore.esc(a.avatar_url)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none;width:32px;height:32px;border-radius:50%;background:var(--bg-elevated);align-items:center;justify-content:center;font-size:16px;">${a.avatar_emoji || ''}</span>`
            : a.avatar_emoji
                ? `<span style="display:inline-flex;width:32px;height:32px;border-radius:50%;background:var(--bg-elevated);align-items:center;justify-content:center;font-size:16px;">${a.avatar_emoji}</span>`
                : `<span style="display:inline-flex;width:32px;height:32px;border-radius:50%;background:var(--bg-elevated);align-items:center;justify-content:center;color:var(--text-muted);">${ICONS.cpu}</span>`;

        // Trust signals
        const signals = buildTrustSignals(a);

        // Lightning (truncated)
        const lightning = a.lightning_address
            ? `<span class="mono" style="font-size:0.7rem;" title="${AdminCore.esc(a.lightning_address)}">${AdminCore.esc(truncate(a.lightning_address, 22))}</span>`
            : '<span style="color:var(--text-muted);font-size:0.75rem;">Not set</span>';

        return `<tr>
            <td>${avatar}</td>
            <td>
                <strong>${AdminCore.esc(a.agent_name)}</strong>
                <br><span class="mono" style="font-size:0.6rem;color:var(--text-muted);">${a.id.substring(0, 8)}...</span>
            </td>
            <td style="text-align:center;">
                <span style="font-family:var(--font-mono);font-weight:700;color:${(a.skill_count || 0) > 0 ? 'var(--accent)' : 'var(--text-muted)'};">${a.skill_count || 0}</span>
            </td>
            <td>${signals}</td>
            <td>${lightning}</td>
            <td style="font-size:0.75rem;color:var(--text-dim);white-space:nowrap;">${AdminCore.formatDate(a.created_at)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm" data-action="edit" data-id="${a.id}" title="Edit agent">${ICONS.edit}</button>
                    <button class="btn btn-sm" data-action="view" data-id="${a.id}" data-name="${AdminCore.esc(a.agent_name)}" title="View on site">${ICONS.link}</button>
                    <button class="btn btn-sm" data-action="compliance" data-id="${a.id}" data-name="${AdminCore.esc(a.agent_name)}" title="Download compliance file">${ICONS.download}</button>
                </div>
            </td>
        </tr>`;
    }

    // ==================== TRUST SIGNALS ====================

    function buildTrustSignals(a) {
        const signals = [];

        // A2A Verified
        const a2a = a.agent_card_verified === 1;
        signals.push(`<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.7rem;color:${a2a ? 'var(--green)' : 'var(--text-muted)'};" title="A2A Agent Card ${a2a ? 'Verified' : 'Not Verified'}">
            ${ICONS.shield} A2A ${a2a ? ICONS.check : ICONS.x}
        </span>`);

        // X Verified
        const xv = a.x_verified === 1;
        signals.push(`<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.7rem;color:${xv ? 'var(--green)' : 'var(--text-muted)'};" title="X Identity ${xv ? 'Verified' : 'Not Verified'}">
            X ${xv ? ICONS.check : ICONS.x}${a.x_handle ? ' @' + AdminCore.esc(a.x_handle) : ''}
        </span>`);

        // Lightning
        const hasLn = !!a.lightning_address;
        signals.push(`<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.7rem;color:${hasLn ? 'var(--green)' : 'var(--text-muted)'};" title="Lightning Wallet ${hasLn ? 'Set' : 'Not Set'}">
            ${ICONS.zap} ${hasLn ? ICONS.check : ICONS.x}
        </span>`);

        // GitHub
        const hasGh = !!a.agent_card_url;
        signals.push(`<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.7rem;color:${hasGh ? 'var(--green)' : 'var(--text-muted)'};" title="Agent Card URL ${hasGh ? 'Set' : 'Not Set'}">
            ${ICONS.globe} ${hasGh ? ICONS.check : ICONS.x}
        </span>`);

        return `<div style="display:flex;flex-wrap:wrap;gap:8px;">${signals.join('')}</div>`;
    }

    // ==================== ACTIONS ====================

    function handleAction(e) {
        const btn = e.currentTarget;
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        switch (action) {
            case 'edit': openEditModal(id); break;
            case 'view': viewOnSite(id); break;
            case 'compliance': downloadCompliance(id, btn.dataset.name, btn); break;
        }
    }

    function viewOnSite(id) {
        const agent = allAgents.find(a => a.id === id);
        if (agent) {
            window.open(`https://squidbay.io/agent/${encodeURIComponent(agent.agent_name)}`, '_blank');
        }
    }

    // ==================== COMPLIANCE DOWNLOAD ====================

    async function downloadCompliance(id, name, btn) {
        const origHTML = btn.innerHTML;
        btn.innerHTML = ICONS.spinner;
        btn.disabled = true;

        try {
            const data = await AdminCore.apiGet(`/admin/agents/${id}/compliance`);
            AdminCore.logAudit('download_compliance', `Downloaded compliance file for "${name}" (${id})`);

            // Create downloadable JSON
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `squidbay-compliance-${name.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            btn.innerHTML = origHTML;
            btn.disabled = false;
        } catch (err) {
            // Endpoint might not exist yet
            btn.innerHTML = origHTML;
            btn.disabled = false;
            showModal(`
                <h3>Compliance Download</h3>
                <p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:16px;">
                    The compliance endpoint is not available yet. This will be built as part of the backend work.
                </p>
                <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:16px;">
                    Endpoint needed: <span class="mono">GET /admin/agents/${id}/compliance</span>
                </p>
                <div class="modal-actions">
                    <button class="btn" id="closeComplianceBtn">Close</button>
                </div>
            `);
            document.getElementById('closeComplianceBtn').addEventListener('click', () => {
                document.querySelector('.modal-overlay')?.remove();
            });
        }
    }

    // ==================== EDIT MODAL ====================

    async function openEditModal(id) {
        const agent = allAgents.find(a => a.id === id);
        if (!agent) return;

        // Fetch full detail (may include more fields)
        let fullAgent = agent;
        try {
            const data = await AdminCore.publicGet(`/agents/${id}`);
            if (data.agent) fullAgent = { ...agent, ...data.agent };
        } catch (e) {}

        showModal(`
            <h3>Edit Agent — ${AdminCore.esc(fullAgent.agent_name)}</h3>

            <div style="margin-bottom:16px;padding:10px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);font-size:0.75rem;color:var(--text-dim);">
                Agent names are locked permanently. Agents are auto-created when a skill is registered via A2A protocol. This edit is for avatar and verification flags only.
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Agent Name (locked)</label>
                    <input type="text" class="form-input" value="${AdminCore.esc(fullAgent.agent_name)}" disabled style="opacity:0.5;">
                </div>
                <div class="form-group">
                    <label class="form-label">Avatar Emoji</label>
                    <input type="text" class="form-input" id="editAvatarEmoji" value="${fullAgent.avatar_emoji || ''}" style="font-size:1.4rem;text-align:center;" maxlength="4">
                </div>
                <div class="form-group form-full">
                    <label class="form-label">Avatar URL (image)</label>
                    <input type="text" class="form-input" id="editAvatarUrl" value="${AdminCore.esc(fullAgent.avatar_url || '')}" placeholder="https://example.com/avatar.png" style="font-family:var(--font-mono);font-size:0.78rem;">
                </div>
                <div class="form-group">
                    <label class="form-label">Agent Card URL</label>
                    <input type="text" class="form-input" id="editAgentCardUrl" value="${AdminCore.esc(fullAgent.agent_card_url || '')}" placeholder="https://example.com/.well-known/agent.json" style="font-family:var(--font-mono);font-size:0.78rem;">
                </div>
                <div class="form-group">
                    <label class="form-label">Website</label>
                    <input type="text" class="form-input" id="editWebsite" value="${AdminCore.esc(fullAgent.website || '')}" placeholder="https://..." style="font-family:var(--font-mono);font-size:0.78rem;">
                </div>
                <div class="form-group">
                    <label class="form-label">X Handle</label>
                    <input type="text" class="form-input" id="editXHandle" value="${AdminCore.esc(fullAgent.x_handle || '')}" placeholder="@handle" style="font-family:var(--font-mono);font-size:0.85rem;">
                </div>
                <div class="form-group">
                    <label class="form-label">Lightning Address</label>
                    <input type="text" class="form-input" id="editLightning" value="${AdminCore.esc(fullAgent.lightning_address || '')}" placeholder="user@wallet.com" style="font-family:var(--font-mono);font-size:0.78rem;">
                </div>
            </div>

            <h4 style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-dim);margin:16px 0 10px;">Verification Flags (admin only)</h4>
            <div style="display:flex;gap:16px;flex-wrap:wrap;">
                <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;cursor:pointer;">
                    <input type="checkbox" id="editA2AVerified" ${fullAgent.agent_card_verified === 1 ? 'checked' : ''}>
                    A2A Verified
                </label>
                <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;cursor:pointer;">
                    <input type="checkbox" id="editXVerified" ${fullAgent.x_verified === 1 ? 'checked' : ''}>
                    X Verified
                </label>
            </div>

            <div style="margin-top:12px;font-size:0.7rem;color:var(--text-muted);">
                ID: <span class="mono" style="font-size:0.65rem;">${fullAgent.id}</span>
                &middot; Created: ${AdminCore.formatDate(fullAgent.created_at)}
                &middot; Skills: ${fullAgent.skill_count || 0}
            </div>

            <div class="modal-actions">
                <button class="btn" id="cancelEditAgentBtn">Cancel</button>
                <button class="btn btn-primary" id="saveEditAgentBtn">Save Changes</button>
            </div>
            <div id="editAgentResultMsg" style="margin-top:8px;font-size:0.8rem;"></div>
        `);

        document.getElementById('cancelEditAgentBtn').addEventListener('click', () => {
            document.querySelector('.modal-overlay')?.remove();
        });
        document.getElementById('saveEditAgentBtn').addEventListener('click', () => saveEdit(id));
    }

    async function saveEdit(id) {
        const btn = document.getElementById('saveEditAgentBtn');
        const resultEl = document.getElementById('editAgentResultMsg');
        btn.textContent = 'Saving...';
        btn.disabled = true;
        resultEl.textContent = '';

        const payload = {
            avatar_emoji: document.getElementById('editAvatarEmoji').value.trim() || null,
            avatar_url: document.getElementById('editAvatarUrl').value.trim() || null,
            agent_card_url: document.getElementById('editAgentCardUrl').value.trim() || null,
            website: document.getElementById('editWebsite').value.trim() || null,
            x_handle: document.getElementById('editXHandle').value.trim() || null,
            lightning_address: document.getElementById('editLightning').value.trim() || null,
            agent_card_verified: document.getElementById('editA2AVerified').checked ? 1 : 0,
            x_verified: document.getElementById('editXVerified').checked ? 1 : 0
        };

        try {
            const result = await AdminCore.apiPut(`/admin/agents/${id}`, payload);
            AdminCore.logAudit('edit_agent', `Edited agent ${id}`);

            // Update local data
            const idx = allAgents.findIndex(a => a.id === id);
            if (idx !== -1) {
                Object.assign(allAgents[idx], payload);
                if (result.agent) Object.assign(allAgents[idx], result.agent);
            }

            resultEl.style.color = 'var(--green)';
            resultEl.textContent = 'Saved successfully';

            setTimeout(() => {
                document.querySelector('.modal-overlay')?.remove();
                renderTable();
            }, 800);

        } catch (err) {
            resultEl.style.color = 'var(--red)';
            resultEl.textContent = `Error: ${err.message || 'Save failed'}`;
            btn.textContent = 'Save Changes';
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

    // ==================== UTILITIES ====================

    function truncate(str, len) {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '...' : str;
    }

    // ==================== PUBLIC API ====================
    return { load };

})();
