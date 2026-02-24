// ==================== ADMIN GITHUB ====================
// GitHub connections, listings, issue notifications

const AdminGitHub = (() => {

    let issues = [];
    let connections = [];

    const ICONS = {
        github: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>',
        link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>',
        check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        alertCircle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
        eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
    };

    async function load() {
        const body = document.getElementById('githubBody');
        body.innerHTML = '<p class="loading-msg">Loading GitHub data...</p>';

        try {
            // Load issues and connections in parallel
            const [issueData, connData] = await Promise.all([
                AdminCore.apiGet('/admin/github/issues').catch(() => ({ issues: [] })),
                AdminCore.apiGet('/admin/github/connections').catch(() => ({ connections: [] }))
            ]);

            issues = issueData.issues || [];
            connections = connData.connections || [];

            // Update sidebar badge
            const unread = issues.filter(i => !i.acknowledged).length;
            const badge = document.getElementById('navBadgeGithub');
            if (badge) {
                badge.textContent = unread;
                badge.style.display = unread > 0 ? 'inline-block' : 'none';
            }

            renderPage(body);
        } catch (err) {
            body.innerHTML = `<p class="loading-msg" style="color:var(--red)">Error: ${AdminCore.esc(err.message)}</p>`;
        }
    }

    function renderPage(body) {
        body.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Open Issues</div>
                    <div class="stat-value ${issues.length > 0 ? 'orange' : 'green'}">${issues.length}</div>
                    <div class="stat-sub">${issues.filter(i => !i.acknowledged).length} unread</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Agent Connections</div>
                    <div class="stat-value cyan">${connections.length}</div>
                </div>
            </div>

            ${issues.length > 0 ? renderIssues() : '<div class="cmd-card"><p style="color:var(--text-dim);text-align:center;padding:20px 0;">No open issues across monitored repos.</p></div>'}

            ${connections.length > 0 ? renderConnections() : ''}
        `;

        // Bind acknowledge buttons
        body.querySelectorAll('[data-action="ack-issue"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                btn.disabled = true;
                try {
                    await AdminCore.apiPost(`/admin/github/issues/${id}/ack`);
                    const issue = issues.find(i => (i.id || i.number) == id);
                    if (issue) issue.acknowledged = true;
                    const unread = issues.filter(i => !i.acknowledged).length;
                    const badge = document.getElementById('navBadgeGithub');
                    if (badge) {
                        badge.textContent = unread;
                        badge.style.display = unread > 0 ? 'inline-block' : 'none';
                    }
                    btn.innerHTML = ICONS.check;
                    btn.style.color = 'var(--green)';
                } catch (e) {
                    btn.disabled = false;
                }
            });
        });
    }

    function renderIssues() {
        return `
            <h3 style="font-family:var(--font-mono);font-size:0.85rem;margin-bottom:12px;color:var(--text-dim);">${ICONS.alertCircle} Open Issues</h3>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Issue</th>
                            <th>Repo</th>
                            <th>Author</th>
                            <th>Labels</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${issues.map(i => `<tr style="${i.acknowledged ? 'opacity:0.5;' : ''}">
                            <td>
                                <strong>${AdminCore.esc(i.title || '')}</strong>
                                <br><span class="mono" style="font-size:0.65rem;color:var(--text-muted);">#${i.number || ''}</span>
                            </td>
                            <td class="mono" style="font-size:0.72rem;">${AdminCore.esc(i.repo || '')}</td>
                            <td>${AdminCore.esc(i.author || i.user?.login || '')}</td>
                            <td>${(i.labels || []).map(l => `<span class="badge badge-pending" style="font-size:0.6rem;">${AdminCore.esc(typeof l === 'string' ? l : l.name || '')}</span>`).join(' ')}</td>
                            <td style="font-size:0.72rem;color:var(--text-dim);white-space:nowrap;">${AdminCore.formatDate(i.created_at)}</td>
                            <td>
                                <div class="btn-group">
                                    ${i.html_url ? `<a href="${AdminCore.esc(i.html_url)}" target="_blank" class="btn btn-sm" title="Open on GitHub">${ICONS.link}</a>` : ''}
                                    ${!i.acknowledged ? `<button class="btn btn-sm" data-action="ack-issue" data-id="${i.id || i.number}" title="Mark read">${ICONS.eye}</button>` : ''}
                                </div>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderConnections() {
        return `
            <h3 style="font-family:var(--font-mono);font-size:0.85rem;margin:24px 0 12px;color:var(--text-dim);">${ICONS.github} Agent GitHub Connections</h3>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Repo</th>
                            <th>Status</th>
                            <th>Connected</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${connections.map(c => `<tr>
                            <td><strong>${AdminCore.esc(c.agent_name || '')}</strong></td>
                            <td class="mono" style="font-size:0.75rem;">${AdminCore.esc(c.repo || c.github_repo || '')}</td>
                            <td><span class="badge ${c.verified ? 'badge-verified' : 'badge-pending'}">${c.verified ? 'Verified' : 'Pending'}</span></td>
                            <td style="font-size:0.72rem;color:var(--text-dim);">${AdminCore.formatDate(c.connected_at || c.created_at)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    return { load };
})();
