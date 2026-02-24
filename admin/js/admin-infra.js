// ==================== ADMIN INFRASTRUCTURE ====================
// Railway deploy, Cloudflare DNS, API health, uptime monitoring

const AdminInfra = (() => {

    const ICONS = {
        server: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>',
        globe: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
        activity: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
        check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        database: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
        link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>'
    };

    async function load() {
        const body = document.getElementById('infraBody');
        body.innerHTML = '<p class="loading-msg">Loading infrastructure status...</p>';

        try {
            // Run health checks in parallel
            const [deployInfo, metrics, apiHealth] = await Promise.all([
                AdminCore.apiGet('/admin/deploy-info').catch(() => null),
                AdminCore.apiGet('/admin/metrics').catch(() => null),
                checkApiHealth()
            ]);

            renderPage(body, deployInfo, metrics, apiHealth);
        } catch (err) {
            body.innerHTML = `<p class="loading-msg" style="color:var(--red)">Error: ${AdminCore.esc(err.message)}</p>`;
        }
    }

    async function checkApiHealth() {
        const endpoints = [
            { name: 'API Root', url: '/health', public: true },
            { name: 'Skills List', url: '/skills?limit=1', public: true },
            { name: 'Agents List', url: '/agents', public: true },
            { name: 'Scheduler', url: '/scheduler/status', public: true },
            { name: 'X Status', url: '/x/status', public: true },
            { name: 'Admin Verify', url: '/admin/verify', public: false }
        ];

        const results = [];
        for (const ep of endpoints) {
            const start = performance.now();
            try {
                if (ep.public) {
                    await AdminCore.publicGet(ep.url);
                } else {
                    await AdminCore.apiGet(ep.url);
                }
                results.push({ ...ep, status: 'up', latency: Math.round(performance.now() - start) });
            } catch (e) {
                results.push({ ...ep, status: 'down', latency: Math.round(performance.now() - start), error: e.message });
            }
        }
        return results;
    }

    function renderPage(body, deployInfo, metrics, apiHealth) {
        const allUp = apiHealth.every(h => h.status === 'up');
        const avgLatency = apiHealth.length > 0 ? Math.round(apiHealth.reduce((s, h) => s + h.latency, 0) / apiHealth.length) : '--';

        body.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">API Status</div>
                    <div class="stat-value ${allUp ? 'green' : 'red'}">${allUp ? 'ALL UP' : 'DEGRADED'}</div>
                    <div class="stat-sub">${apiHealth.filter(h => h.status === 'up').length}/${apiHealth.length} endpoints healthy</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Avg Latency</div>
                    <div class="stat-value ${avgLatency < 500 ? 'green' : avgLatency < 1000 ? 'orange' : 'red'}">${avgLatency}ms</div>
                    <div class="stat-sub">From this browser</div>
                </div>
                ${deployInfo ? `
                <div class="stat-card">
                    <div class="stat-label">Deploy</div>
                    <div class="stat-value cyan">${AdminCore.esc(deployInfo.version || deployInfo.commit?.substring(0, 7) || 'Live')}</div>
                    <div class="stat-sub">${deployInfo.deployed_at ? AdminCore.formatDate(deployInfo.deployed_at) : 'Railway'}</div>
                </div>` : ''}
                ${metrics ? `
                <div class="stat-card">
                    <div class="stat-label">Memory</div>
                    <div class="stat-value purple">${metrics.memory_mb ? metrics.memory_mb + 'MB' : metrics.memory || '--'}</div>
                    <div class="stat-sub">Server memory usage</div>
                </div>` : ''}
            </div>

            <h3 style="font-family:var(--font-mono);font-size:0.85rem;margin:20px 0 12px;color:var(--text-dim);">${ICONS.activity} Endpoint Health</h3>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Endpoint</th>
                            <th>Path</th>
                            <th>Status</th>
                            <th>Latency</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${apiHealth.map(h => `<tr>
                            <td><strong>${AdminCore.esc(h.name)}</strong></td>
                            <td class="mono" style="font-size:0.72rem;color:var(--text-muted);">${AdminCore.esc(h.url)}</td>
                            <td style="color:${h.status === 'up' ? 'var(--green)' : 'var(--red)'};">
                                ${h.status === 'up' ? ICONS.check : ICONS.x} ${h.status.toUpperCase()}
                            </td>
                            <td class="mono" style="color:${h.latency < 500 ? 'var(--green)' : h.latency < 1000 ? 'var(--orange)' : 'var(--red)'};">${h.latency}ms</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>

            ${renderServiceLinks()}

            ${metrics ? renderMetrics(metrics) : ''}
        `;
    }

    function renderServiceLinks() {
        return `
            <h3 style="font-family:var(--font-mono);font-size:0.85rem;margin:24px 0 12px;color:var(--text-dim);">${ICONS.link} Service Links</h3>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <a href="https://railway.app" target="_blank" class="btn btn-sm">${ICONS.server} Railway Dashboard</a>
                <a href="https://dash.cloudflare.com" target="_blank" class="btn btn-sm">${ICONS.globe} Cloudflare Dashboard</a>
                <a href="https://github.com/SquidBay" target="_blank" class="btn btn-sm">${ICONS.database} GitHub Org</a>
            </div>
        `;
    }

    function renderMetrics(metrics) {
        const entries = Object.entries(metrics).filter(([k]) => !['memory_mb', 'memory'].includes(k));
        if (entries.length === 0) return '';

        return `
            <h3 style="font-family:var(--font-mono);font-size:0.85rem;margin:24px 0 12px;color:var(--text-dim);">${ICONS.server} Server Metrics</h3>
            <div class="cmd-card">
                <pre style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-dim);white-space:pre-wrap;">${entries.map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n')}</pre>
            </div>
        `;
    }

    return { load };
})();
