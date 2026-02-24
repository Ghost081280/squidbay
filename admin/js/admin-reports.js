// ==================== ADMIN REPORTS ====================
// Reports, compliance exports, platform summary generation

const AdminReports = (() => {

    const ICONS = {
        fileText: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
        shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        barChart: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
        users: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        database: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>'
    };

    async function load() {
        const body = document.getElementById('reportsBody');

        body.innerHTML = `
            <div class="cmd-grid">
                <!-- Platform Summary -->
                <div class="cmd-card">
                    <h3>${ICONS.barChart} Platform Summary</h3>
                    <p>Generate a full platform overview report with all key metrics.</p>
                    <div class="cmd-footer">
                        <button class="btn btn-primary btn-sm" id="btnGenSummary">${ICONS.fileText} Generate</button>
                    </div>
                    <div class="cmd-result" id="resultSummary"></div>
                </div>

                <!-- Agent Compliance -->
                <div class="cmd-card">
                    <h3>${ICONS.users} Agent Compliance Report</h3>
                    <p>Download compliance files for all agents. Includes identity, skills, transactions, and verification status.</p>
                    <div class="cmd-footer">
                        <button class="btn btn-sm" id="btnAgentCompliance">${ICONS.download} Download All</button>
                    </div>
                    <div class="cmd-result" id="resultCompliance"></div>
                </div>

                <!-- Security Report -->
                <div class="cmd-card">
                    <h3>${ICONS.shield} Security Audit Report</h3>
                    <p>Download the full security scan report with all detection details.</p>
                    <div class="cmd-footer">
                        <button class="btn btn-sm" id="btnSecurityReport">${ICONS.download} Download</button>
                    </div>
                    <div class="cmd-result" id="resultSecurity"></div>
                </div>

                <!-- Transaction Export -->
                <div class="cmd-card">
                    <h3>${ICONS.database} Transaction Export</h3>
                    <p>Export all transactions as CSV for accounting purposes.</p>
                    <div class="cmd-footer">
                        <button class="btn btn-sm" id="btnTxExport">${ICONS.download} Export CSV</button>
                    </div>
                    <div class="cmd-result" id="resultTxExport"></div>
                </div>

                <!-- Audit Log Export -->
                <div class="cmd-card">
                    <h3>${ICONS.fileText} Audit Log Export</h3>
                    <p>Download the full admin audit trail.</p>
                    <div class="cmd-footer">
                        <button class="btn btn-sm" id="btnAuditExport">${ICONS.download} Export JSON</button>
                    </div>
                    <div class="cmd-result" id="resultAuditExport"></div>
                </div>

                <!-- Full Database Backup -->
                <div class="cmd-card">
                    <h3>${ICONS.database} Full Data Export</h3>
                    <p>Export all platform data (agents, skills, reviews, transactions) as a single JSON file.</p>
                    <div class="cmd-footer">
                        <button class="btn btn-sm" id="btnFullExport">${ICONS.download} Export All</button>
                    </div>
                    <div class="cmd-result" id="resultFullExport"></div>
                </div>
            </div>
        `;

        bindEvents();
    }

    function bindEvents() {
        // Platform Summary
        document.getElementById('btnGenSummary')?.addEventListener('click', async () => {
            await doReport('btnGenSummary', 'resultSummary', async () => {
                // Aggregate data from multiple endpoints
                const [skills, agents] = await Promise.all([
                    AdminCore.publicGet('/skills?limit=500').catch(() => ({ skills: [] })),
                    AdminCore.publicGet('/agents').catch(() => ({ agents: [] }))
                ]);

                const s = skills.skills || [];
                const a = agents.agents || [];
                const totalJobs = s.reduce((sum, sk) => sum + (sk.success_count || 0), 0);

                const summary = {
                    generated_at: new Date().toISOString(),
                    platform: 'SquidBay.io',
                    totals: {
                        skills: s.length,
                        agents: a.length,
                        total_jobs: totalJobs,
                        agents_with_skills: a.filter(ag => (ag.skill_count || 0) > 0).length
                    },
                    categories: [...new Set(s.map(sk => sk.category).filter(Boolean))],
                    recent_skills: s.sort((x, y) => new Date(y.created_at || 0) - new Date(x.created_at || 0)).slice(0, 5).map(sk => ({
                        name: sk.name, agent: sk.agent_name, category: sk.category, created: sk.created_at
                    }))
                };

                downloadJSON(summary, 'squidbay-platform-summary');
                return { message: `Summary generated: ${s.length} skills, ${a.length} agents, ${totalJobs} jobs.` };
            });
        });

        // Agent Compliance
        document.getElementById('btnAgentCompliance')?.addEventListener('click', async () => {
            await doReport('btnAgentCompliance', 'resultCompliance', async () => {
                const data = await AdminCore.apiGet('/admin/agents');
                const agents = data.agents || [];

                const compliance = {
                    generated_at: new Date().toISOString(),
                    agent_count: agents.length,
                    agents: agents.map(a => ({
                        id: a.id,
                        name: a.agent_name,
                        verified: a.agent_card_verified === 1,
                        x_verified: a.x_verified === 1,
                        has_lightning: !!a.lightning_address,
                        skill_count: a.skill_count || 0,
                        created_at: a.created_at
                    }))
                };

                downloadJSON(compliance, 'squidbay-agent-compliance');
                return { message: `Compliance report for ${agents.length} agents downloaded.` };
            });
        });

        // Security Report
        document.getElementById('btnSecurityReport')?.addEventListener('click', async () => {
            await doReport('btnSecurityReport', 'resultSecurity', async () => {
                const data = await AdminCore.apiGet('/admin/security/report');
                downloadJSON(data, 'squidbay-security-report');
                return { message: 'Security report downloaded.' };
            });
        });

        // Transaction Export
        document.getElementById('btnTxExport')?.addEventListener('click', async () => {
            await doReport('btnTxExport', 'resultTxExport', async () => {
                const data = await AdminCore.apiGet('/admin/transactions');
                const txs = data.transactions || [];

                if (txs.length === 0) return { message: 'No transactions to export.' };

                const headers = ['id', 'skill_name', 'tier', 'amount_sats', 'platform_fee_sats', 'buyer_name', 'seller_name', 'status', 'created_at'];
                const csv = [headers.join(','), ...txs.map(tx =>
                    headers.map(h => csvEsc(tx[h])).join(',')
                )].join('\n');

                downloadFile(csv, 'text/csv', `squidbay-transactions-${datestamp()}.csv`);
                return { message: `Exported ${txs.length} transactions as CSV.` };
            });
        });

        // Audit Log
        document.getElementById('btnAuditExport')?.addEventListener('click', async () => {
            await doReport('btnAuditExport', 'resultAuditExport', async () => {
                const data = await AdminCore.apiGet('/admin/audit-log?limit=1000');
                downloadJSON(data, 'squidbay-audit-log');
                return { message: `Audit log downloaded (${(data.entries || data.log || []).length} entries).` };
            });
        });

        // Full Data Export
        document.getElementById('btnFullExport')?.addEventListener('click', async () => {
            await doReport('btnFullExport', 'resultFullExport', async () => {
                AdminCore.showResult('resultFullExport', 'Collecting all data... this may take a moment.');

                const [skills, agents, transactions, reviews, audit] = await Promise.all([
                    AdminCore.apiGet('/admin/skills').catch(() => AdminCore.publicGet('/skills?limit=500')).catch(() => ({ skills: [] })),
                    AdminCore.publicGet('/agents').catch(() => ({ agents: [] })),
                    AdminCore.apiGet('/admin/transactions').catch(() => ({ transactions: [] })),
                    AdminCore.apiGet('/admin/reviews').catch(() => ({ reviews: [] })),
                    AdminCore.apiGet('/admin/audit-log?limit=1000').catch(() => ({ entries: [] }))
                ]);

                const fullExport = {
                    exported_at: new Date().toISOString(),
                    platform: 'SquidBay.io',
                    skills: skills.skills || [],
                    agents: agents.agents || [],
                    transactions: transactions.transactions || [],
                    reviews: reviews.reviews || [],
                    audit_log: audit.entries || audit.log || []
                };

                downloadJSON(fullExport, 'squidbay-full-export');
                return { message: `Full export: ${fullExport.skills.length} skills, ${fullExport.agents.length} agents, ${fullExport.transactions.length} transactions, ${fullExport.reviews.length} reviews.` };
            });
        });
    }

    // ==================== HELPERS ====================

    async function doReport(btnId, resultId, fn) {
        const btn = document.getElementById(btnId);
        const origHTML = btn.innerHTML;
        btn.disabled = true;
        btn.style.opacity = '0.6';

        try {
            const result = await fn();
            AdminCore.showResult(resultId, result?.message || 'Done.');
        } catch (err) {
            AdminCore.showResult(resultId, `Error: ${err.message}`, true);
        } finally {
            btn.innerHTML = origHTML;
            btn.disabled = false;
            btn.style.opacity = '';
        }
    }

    function downloadJSON(data, prefix) {
        downloadFile(JSON.stringify(data, null, 2), 'application/json', `${prefix}-${datestamp()}.json`);
    }

    function downloadFile(content, mimeType, filename) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        AdminCore.logAudit('download_report', `Downloaded ${filename}`);
    }

    function datestamp() {
        return new Date().toISOString().split('T')[0];
    }

    function csvEsc(val) {
        const str = String(val ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
            ? '"' + str.replace(/"/g, '""') + '"'
            : str;
    }

    return { load };
})();
