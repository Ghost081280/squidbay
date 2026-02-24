// ==================== ADMIN KEYS ====================
// Agent key management, recovery challenges, admin key reset

const AdminKeys = (() => {

    let agentKeys = [];

    const ICONS = {
        key: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>',
        refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
        shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        alertTriangle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>'
    };

    async function load() {
        const body = document.getElementById('keysBody');
        body.innerHTML = '<p class="loading-msg">Loading key management...</p>';

        try {
            const data = await AdminCore.apiGet('/admin/keys');
            agentKeys = data.keys || data.agents || [];
            renderPage(body);
        } catch (err) {
            body.innerHTML = `<p class="loading-msg" style="color:var(--red)">Error: ${AdminCore.esc(err.message)}</p>`;
        }
    }

    function renderPage(body) {
        body.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Agent Keys</div>
                    <div class="stat-value cyan">${agentKeys.length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Active Keys</div>
                    <div class="stat-value green">${agentKeys.filter(k => k.is_active !== false && k.is_active !== 0).length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Recovery Challenges</div>
                    <div class="stat-value orange">${agentKeys.filter(k => k.pending_recovery).length}</div>
                </div>
            </div>

            ${agentKeys.length > 0 ? renderKeyTable() : '<div class="cmd-card"><p style="color:var(--text-dim);text-align:center;padding:20px 0;">No agent keys found.</p></div>'}

            <div class="cmd-card" style="margin-top:24px;">
                <h3>${ICONS.shield} Admin Key</h3>
                <p>Reset or rotate the admin key. This will invalidate the current session.</p>
                <div style="margin-top:12px;">
                    <button class="btn btn-sm btn-danger" id="btnResetAdminKey">${ICONS.alertTriangle} Reset Admin Key</button>
                </div>
                <div class="cmd-result" id="resultAdminKey"></div>
            </div>
        `;

        // Bind admin key reset
        document.getElementById('btnResetAdminKey')?.addEventListener('click', () => {
            if (!confirm('This will generate a new admin key and log you out. Continue?')) return;
            resetAdminKey();
        });

        // Bind copy and rotate buttons
        body.querySelectorAll('[data-action="rotate"]').forEach(btn => {
            btn.addEventListener('click', () => rotateAgentKey(btn.dataset.id, btn.dataset.name));
        });
    }

    function renderKeyTable() {
        return `
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Key Prefix</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Last Rotated</th>
                            <th>Recovery</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${agentKeys.map(k => `<tr>
                            <td><strong>${AdminCore.esc(k.agent_name || '')}</strong></td>
                            <td class="mono" style="font-size:0.72rem;color:var(--text-muted);">${AdminCore.esc(k.key_prefix || k.key_hash?.substring(0, 12) || '--')}...</td>
                            <td><span class="badge ${k.is_active !== false && k.is_active !== 0 ? 'badge-active' : 'badge-inactive'}">${k.is_active !== false && k.is_active !== 0 ? 'Active' : 'Revoked'}</span></td>
                            <td style="font-size:0.72rem;color:var(--text-dim);">${AdminCore.formatDate(k.created_at)}</td>
                            <td style="font-size:0.72rem;color:var(--text-dim);">${k.rotated_at ? AdminCore.formatDate(k.rotated_at) : 'Never'}</td>
                            <td>${k.pending_recovery
                                ? '<span class="badge badge-pending">Pending</span>'
                                : k.agent_card_url
                                    ? '<span class="badge badge-verified">A2A Ready</span>'
                                    : '<span style="color:var(--text-muted);font-size:0.72rem;">No card URL</span>'
                            }</td>
                            <td>
                                <button class="btn btn-sm" data-action="rotate" data-id="${k.agent_id || k.id}" data-name="${AdminCore.esc(k.agent_name || '')}" title="Rotate key">${ICONS.refresh}</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async function rotateAgentKey(agentId, agentName) {
        if (!confirm(`Rotate API key for ${agentName}? Their current key will stop working immediately.`)) return;

        try {
            const result = await AdminCore.apiPost(`/admin/keys/${agentId}/rotate`);
            AdminCore.logAudit('rotate_key', `Rotated key for agent "${agentName}" (${agentId})`);
            AdminCore.showResult('resultAdminKey', `Key rotated for ${agentName}. New key prefix: ${result.key_prefix || '(see response)'}`, false);
            load(); // Refresh table
        } catch (err) {
            AdminCore.showResult('resultAdminKey', `Error rotating key: ${err.message}`, true);
        }
    }

    async function resetAdminKey() {
        try {
            const result = await AdminCore.apiPost('/admin/keys/reset-admin');
            AdminCore.logAudit('reset_admin_key', 'Admin key reset');
            alert(`New admin key: ${result.key || result.admin_key || '(check server logs)'}\n\nSave this NOW. You will be logged out.`);
            AdminCore.logout();
        } catch (err) {
            AdminCore.showResult('resultAdminKey', `Error: ${err.message}`, true);
        }
    }

    return { load };
})();
