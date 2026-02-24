// ==================== ADMIN SECURITY ====================
// Cybersecurity center: scanner status, threats, scan history, security report

const AdminSecurity = (() => {

    let securityReport = null;
    let scanHistory = [];

    const ICONS = {
        shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        alertTriangle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        scan: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
        activity: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
        download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
        link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>'
    };

    async function load() {
        const body = document.getElementById('securityBody');
        body.innerHTML = '<p class="loading-msg">Loading security status...</p>';

        try {
            const [reportData, historyData] = await Promise.all([
                AdminCore.apiGet('/admin/security/report').catch(() => null),
                AdminCore.apiGet('/admin/security/scan-history').catch(() => ({ scans: [] }))
            ]);

            securityReport = reportData;
            scanHistory = historyData?.scans || [];

            renderPage(body);
        } catch (err) {
            body.innerHTML = `<p class="loading-msg" style="color:var(--red)">Error: ${AdminCore.esc(err.message)}</p>`;
        }
    }

    function renderPage(body) {
        const report = securityReport || {};
        const threatCount = report.active_threats || report.threats?.length || 0;
        const lastScan = report.last_scan_at || (scanHistory.length > 0 ? scanHistory[0].scanned_at : null);
        const overallScore = report.overall_score ?? report.risk_score ?? null;
        const overallTrust = overallScore !== null ? 100 - overallScore : null;

        body.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Security Status</div>
                    <div class="stat-value ${threatCount > 0 ? 'red' : 'green'}">
                        ${threatCount > 0 ? ICONS.alertTriangle + ' THREATS' : ICONS.check + ' CLEAR'}
                    </div>
                    <div class="stat-sub">${threatCount} active ${threatCount === 1 ? 'threat' : 'threats'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Platform Trust</div>
                    <div class="stat-value ${overallTrust === null ? '' : overallTrust >= 85 ? 'green' : overallTrust >= 60 ? 'orange' : 'red'}">
                        ${overallTrust !== null ? overallTrust + '/100' : '--'}
                    </div>
                    <div class="stat-sub">Aggregate skill trust</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Last Scan</div>
                    <div class="stat-value cyan">${lastScan ? AdminCore.formatDate(lastScan) : 'Never'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Scans Recorded</div>
                    <div class="stat-value purple">${scanHistory.length}</div>
                </div>
            </div>

            <div class="cmd-grid">
                <!-- Full Platform Scan -->
                <div class="cmd-card">
                    <h3>${ICONS.scan} Full Platform Scan</h3>
                    <p>Run Scanner v2.0 across all registered skills. This will update all trust scores.</p>
                    <div class="cmd-footer">
                        <button class="btn btn-primary btn-sm" id="btnFullScan">${ICONS.scan} Run Full Scan</button>
                    </div>
                    <div class="cmd-result" id="resultFullScan"></div>
                </div>

                <!-- Security Report -->
                <div class="cmd-card">
                    <h3>${ICONS.shield} Security Report</h3>
                    <p>View or download the latest security report.</p>
                    <div class="cmd-footer">
                        <a href="https://squidbay.io/security" target="_blank" class="btn btn-sm">${ICONS.link} Public Report</a>
                        <button class="btn btn-sm" id="btnDownloadReport">${ICONS.download} Download JSON</button>
                    </div>
                </div>

                <!-- Audit Log -->
                <div class="cmd-card">
                    <h3>${ICONS.activity} Recent Audit Log</h3>
                    <p>Last 20 admin actions.</p>
                    <div class="cmd-footer">
                        <button class="btn btn-sm" id="btnLoadAudit">${ICONS.activity} Load Log</button>
                    </div>
                    <div class="cmd-result" id="resultAudit" style="max-height:300px;overflow-y:auto;"></div>
                </div>
            </div>

            ${renderScanHistory()}

            ${renderThreats(report)}
        `;

        bindEvents();
    }

    function renderThreats(report) {
        const threats = report.threats || [];
        if (threats.length === 0) return '';

        return `
            <h3 style="font-family:var(--font-mono);font-size:0.85rem;margin:24px 0 12px;color:var(--red);">${ICONS.alertTriangle} Active Threats</h3>
            ${threats.map(t => `
                <div class="cmd-card" style="border-color:var(--red);margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <strong style="color:var(--red);">${AdminCore.esc(t.type || t.category || 'Unknown')}</strong>
                            — ${AdminCore.esc(t.skill_name || t.target || '')}
                        </div>
                        <span class="badge badge-failed">${AdminCore.esc(t.severity || 'high')}</span>
                    </div>
                    <p style="font-size:0.8rem;color:var(--text-dim);margin-top:6px;">${AdminCore.esc(t.description || t.message || '')}</p>
                    <div style="font-size:0.68rem;color:var(--text-muted);margin-top:4px;">Detected: ${AdminCore.formatDate(t.detected_at || t.created_at)}</div>
                </div>
            `).join('')}
        `;
    }

    function renderScanHistory() {
        if (scanHistory.length === 0) return '';

        return `
            <h3 style="font-family:var(--font-mono);font-size:0.85rem;margin:24px 0 12px;color:var(--text-dim);">${ICONS.scan} Scan History</h3>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Skill</th>
                            <th>Trust Score</th>
                            <th>Result</th>
                            <th>Detections</th>
                            <th>Scanned</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${scanHistory.slice(0, 50).map(s => {
                            const trust = typeof s.risk_score === 'number' ? 100 - s.risk_score : '--';
                            const color = trust === '--' ? 'var(--text-muted)' :
                                trust >= 85 ? 'var(--green)' :
                                trust >= 60 ? 'var(--orange)' : 'var(--red)';
                            const resultColor = s.result === 'clean' ? 'var(--green)' :
                                s.result === 'warning' ? 'var(--orange)' :
                                s.result === 'danger' ? 'var(--red)' : 'var(--text-muted)';

                            return `<tr>
                                <td><strong>${AdminCore.esc(s.skill_name || s.name || '')}</strong></td>
                                <td style="text-align:center;font-family:var(--font-mono);font-weight:700;color:${color};">${trust}</td>
                                <td><span style="color:${resultColor};">${AdminCore.esc(s.result || '--')}</span></td>
                                <td class="mono" style="font-size:0.72rem;color:var(--text-muted);">${s.detection_count || s.detections?.length || 0}</td>
                                <td style="font-size:0.72rem;color:var(--text-dim);white-space:nowrap;">${AdminCore.formatDate(s.scanned_at)}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function bindEvents() {
        // Full scan
        document.getElementById('btnFullScan')?.addEventListener('click', async () => {
            const btn = document.getElementById('btnFullScan');
            const origHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `${ICONS.scan} Scanning...`;
            AdminCore.showResult('resultFullScan', 'Scanning all skills... this may take a moment.');

            try {
                const result = await AdminCore.apiPost('/admin/security/scan-all');
                AdminCore.logAudit('full_platform_scan', 'Ran full platform security scan');
                const msg = result.message || `Scanned ${result.scanned || '?'} skills. ${result.threats || 0} threats detected.`;
                AdminCore.showResult('resultFullScan', msg);
                // Reload to show new data
                setTimeout(() => load(), 1500);
            } catch (err) {
                AdminCore.showResult('resultFullScan', `Error: ${err.message}`, true);
            } finally {
                btn.innerHTML = origHTML;
                btn.disabled = false;
            }
        });

        // Download report
        document.getElementById('btnDownloadReport')?.addEventListener('click', () => {
            if (!securityReport) {
                alert('No security report available.');
                return;
            }
            const blob = new Blob([JSON.stringify(securityReport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `squidbay-security-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });

        // Audit log
        document.getElementById('btnLoadAudit')?.addEventListener('click', async () => {
            try {
                const data = await AdminCore.apiGet('/admin/audit-log?limit=20');
                const entries = data.entries || data.log || [];
                if (entries.length === 0) {
                    AdminCore.showResult('resultAudit', 'No audit entries found.');
                    return;
                }
                const html = entries.map(e =>
                    `<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:0.75rem;">
                        <span style="color:var(--text-muted);">${AdminCore.formatDate(e.created_at || e.timestamp)}</span>
                        <span class="badge badge-active" style="font-size:0.6rem;margin:0 6px;">${AdminCore.esc(e.action || e.type || '')}</span>
                        ${AdminCore.esc(e.details || e.message || '')}
                    </div>`
                ).join('');
                document.getElementById('resultAudit').innerHTML = html;
            } catch (err) {
                AdminCore.showResult('resultAudit', `Error: ${err.message}`, true);
            }
        });
    }

    return { load };
})();
