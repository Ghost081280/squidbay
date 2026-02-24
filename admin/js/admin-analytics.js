// ==================== ADMIN ANALYTICS ====================
// Cloudflare analytics: traffic, pageviews, threats, bandwidth

const AdminAnalytics = (() => {

    const ICONS = {
        trendingUp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
        eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
        shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        globe: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
        settings: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09"></path></svg>'
    };

    let currentPeriod = '24h';

    async function load() {
        const body = document.getElementById('analyticsBody');
        body.innerHTML = '<p class="loading-msg">Loading analytics...</p>';

        try {
            const data = await AdminCore.apiGet(`/admin/cloudflare/analytics?period=${currentPeriod}`);
            renderPage(body, data);
        } catch (err) {
            // Check if it's a config issue
            if (err.message?.includes('token') || err.message?.includes('403') || err.message?.includes('401')) {
                body.innerHTML = `
                    <div class="cmd-card" style="text-align:center;padding:40px 20px;">
                        <div style="color:var(--text-muted);margin-bottom:12px;">${ICONS.settings}</div>
                        <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:8px;">Cloudflare Analytics Not Configured</p>
                        <p style="color:var(--text-muted);font-size:0.78rem;margin-bottom:16px;">Add your Cloudflare API token and Zone ID in Settings to enable traffic analytics.</p>
                        <button class="btn btn-sm btn-primary" onclick="AdminCore.switchTab('settings')">${ICONS.settings} Go to Settings</button>
                    </div>
                `;
            } else {
                body.innerHTML = `<p class="loading-msg" style="color:var(--red)">Error: ${AdminCore.esc(err.message)}</p>`;
            }
        }
    }

    function renderPage(body, data) {
        const analytics = data.analytics || data;
        const totals = analytics.totals || analytics;

        const requests = totals.requests || totals.total_requests || 0;
        const pageViews = totals.pageviews || totals.page_views || 0;
        const uniqueVisitors = totals.unique_visitors || totals.uniques || 0;
        const threats = totals.threats || totals.threat_count || 0;
        const bandwidth = totals.bandwidth || 0;
        const bandwidthMB = bandwidth > 0 ? (bandwidth / (1024 * 1024)).toFixed(1) : 0;

        body.innerHTML = `
            <div style="display:flex;gap:10px;margin-bottom:16px;align-items:center;">
                <div class="btn-group">
                    <button class="btn btn-sm${currentPeriod === '24h' ? ' btn-primary' : ''}" id="period24h">24h</button>
                    <button class="btn btn-sm${currentPeriod === '7d' ? ' btn-primary' : ''}" id="period7d">7 Days</button>
                    <button class="btn btn-sm${currentPeriod === '30d' ? ' btn-primary' : ''}" id="period30d">30 Days</button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Requests</div>
                    <div class="stat-value cyan">${Number(requests).toLocaleString()}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Page Views</div>
                    <div class="stat-value green">${Number(pageViews).toLocaleString()}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Unique Visitors</div>
                    <div class="stat-value purple">${Number(uniqueVisitors).toLocaleString()}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Threats Blocked</div>
                    <div class="stat-value ${threats > 0 ? 'orange' : 'green'}">${threats}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Bandwidth</div>
                    <div class="stat-value cyan">${bandwidthMB} MB</div>
                </div>
            </div>

            ${renderCountryTable(analytics)}
            ${renderTopPages(analytics)}
            ${renderStatusCodes(analytics)}
        `;

        // Period toggles
        ['24h', '7d', '30d'].forEach(p => {
            document.getElementById(`period${p}`)?.addEventListener('click', () => {
                currentPeriod = p;
                load();
            });
        });
    }

    function renderCountryTable(analytics) {
        const countries = analytics.countries || analytics.country_map || [];
        if (!countries.length && !Object.keys(countries).length) return '';

        const entries = Array.isArray(countries) ? countries :
            Object.entries(countries).map(([code, count]) => ({ country: code, requests: count }));

        if (entries.length === 0) return '';

        const sorted = entries.sort((a, b) => (b.requests || b.count || 0) - (a.requests || a.count || 0)).slice(0, 15);

        return `
            <h3 style="font-family:var(--font-mono);font-size:0.85rem;margin:24px 0 12px;color:var(--text-dim);">${ICONS.globe} Top Countries</h3>
            <div class="table-wrap">
                <table class="data-table">
                    <thead><tr><th>Country</th><th>Requests</th></tr></thead>
                    <tbody>
                        ${sorted.map(c => `<tr>
                            <td>${AdminCore.esc(c.country || c.code || '--')}</td>
                            <td class="mono" style="text-align:right;">${Number(c.requests || c.count || 0).toLocaleString()}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderTopPages(analytics) {
        const pages = analytics.top_pages || analytics.pages || [];
        if (pages.length === 0) return '';

        return `
            <h3 style="font-family:var(--font-mono);font-size:0.85rem;margin:24px 0 12px;color:var(--text-dim);">${ICONS.eye} Top Pages</h3>
            <div class="table-wrap">
                <table class="data-table">
                    <thead><tr><th>Page</th><th>Views</th></tr></thead>
                    <tbody>
                        ${pages.slice(0, 15).map(p => `<tr>
                            <td class="mono" style="font-size:0.75rem;">${AdminCore.esc(p.url || p.path || '--')}</td>
                            <td class="mono" style="text-align:right;">${Number(p.views || p.count || 0).toLocaleString()}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderStatusCodes(analytics) {
        const codes = analytics.status_codes || analytics.http_status || {};
        const entries = Object.entries(codes);
        if (entries.length === 0) return '';

        return `
            <h3 style="font-family:var(--font-mono);font-size:0.85rem;margin:24px 0 12px;color:var(--text-dim);">${ICONS.trendingUp} HTTP Status Codes</h3>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
                ${entries.sort((a, b) => b[1] - a[1]).map(([code, count]) => {
                    const color = code.startsWith('2') ? 'var(--green)' :
                                  code.startsWith('3') ? 'var(--accent)' :
                                  code.startsWith('4') ? 'var(--orange)' :
                                  code.startsWith('5') ? 'var(--red)' : 'var(--text-muted)';
                    return `<div style="padding:8px 14px;background:var(--bg-elevated);border-radius:var(--radius);border:1px solid var(--border);">
                        <span class="mono" style="font-weight:700;color:${color};font-size:0.9rem;">${code}</span>
                        <span class="mono" style="font-size:0.75rem;color:var(--text-muted);margin-left:6px;">${Number(count).toLocaleString()}</span>
                    </div>`;
                }).join('')}
            </div>
        `;
    }

    return { load };
})();
