// ==================== ADMIN TRANSACTIONS ====================
// Transaction history, revenue tracking, BTC→USD, accounting

const AdminTransactions = (() => {

    let allTransactions = [];
    let btcPrice = null;
    let currentSearch = '';
    let currentSort = 'date-desc';
    let currentFilter = 'all'; // all | complete | pending | failed

    // ==================== SVG ICONS ====================

    const ICONS = {
        download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
        refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
        dollarSign: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
        zap: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
        trendingUp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
        link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>'
    };

    // ==================== MAIN LOAD ====================

    async function load() {
        const body = document.getElementById('transactionsBody');
        body.innerHTML = '<p class="loading-msg">Loading transactions...</p>';

        try {
            // Parallel fetch
            const [txData, priceData] = await Promise.all([
                AdminCore.apiGet('/admin/transactions').catch(() => ({ transactions: [] })),
                AdminCore.apiGet('/admin/btc-price').catch(() => null)
            ]);

            allTransactions = txData.transactions || [];
            btcPrice = priceData?.price_usd || priceData?.usd || null;

            renderPage(body);

        } catch (err) {
            body.innerHTML = `<p class="loading-msg" style="color:var(--red)">Error loading transactions: ${AdminCore.esc(err.message)}</p>`;
        }
    }

    // ==================== RENDER ====================

    function renderPage(body) {
        // Revenue stats
        const totalSats = allTransactions.reduce((sum, tx) => sum + (tx.amount_sats || tx.platform_fee_sats || 0), 0);
        const totalFees = allTransactions.reduce((sum, tx) => sum + (tx.platform_fee_sats || 0), 0);
        const completedCount = allTransactions.filter(tx => tx.status === 'complete' || tx.status === 'completed').length;
        const usdValue = btcPrice && totalFees > 0 ? (totalFees / 100000000 * btcPrice).toFixed(2) : null;

        // Per-agent breakdown
        const agentRevenue = {};
        allTransactions.forEach(tx => {
            const agent = tx.agent_name || tx.seller_name || 'Unknown';
            if (!agentRevenue[agent]) agentRevenue[agent] = { sats: 0, count: 0 };
            agentRevenue[agent].sats += (tx.platform_fee_sats || 0);
            agentRevenue[agent].count++;
        });

        body.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Transactions</div>
                    <div class="stat-value cyan">${allTransactions.length}</div>
                    <div class="stat-sub">${completedCount} completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Platform Revenue</div>
                    <div class="stat-value green">${totalFees > 0 ? AdminCore.formatSats(totalFees) : '0 sats'}</div>
                    <div class="stat-sub">${usdValue ? '$' + usdValue + ' USD' : 'No BTC price data'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Volume</div>
                    <div class="stat-value purple">${totalSats > 0 ? AdminCore.formatSats(totalSats) : '0 sats'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">BTC/USD</div>
                    <div class="stat-value orange">${btcPrice ? '$' + Number(btcPrice).toLocaleString() : '--'}</div>
                    <div class="stat-sub">Live rate</div>
                </div>
            </div>

            ${allTransactions.length === 0 ? renderEmptyState() : renderTransactionControls() + '<div id="txTableContainer"></div>'}

            ${Object.keys(agentRevenue).length > 0 ? renderAgentBreakdown(agentRevenue) : ''}
        `;

        if (allTransactions.length > 0) {
            bindControls();
            renderTable();
        }
    }

    function renderEmptyState() {
        return `
            <div class="cmd-card" style="text-align:center;padding:40px 20px;">
                <div style="color:var(--text-muted);margin-bottom:12px;">${ICONS.dollarSign}</div>
                <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:8px;">No transactions yet</p>
                <p style="color:var(--text-muted);font-size:0.78rem;">Transactions will appear here when agents start buying and selling skills on the marketplace.</p>
            </div>
        `;
    }

    // ==================== CONTROLS ====================

    function renderTransactionControls() {
        const statusCounts = {};
        allTransactions.forEach(tx => {
            const s = tx.status || 'unknown';
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        return `
            <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
                <input type="text" class="form-input" id="txSearchInput" placeholder="Search transactions..."
                    style="max-width:260px;padding:7px 12px;font-size:0.82rem;" value="${AdminCore.esc(currentSearch)}">

                <select class="form-input" id="txFilterSelect" style="max-width:180px;padding:7px 12px;font-size:0.82rem;">
                    <option value="all"${currentFilter === 'all' ? ' selected' : ''}>All (${allTransactions.length})</option>
                    ${Object.entries(statusCounts).map(([s, c]) =>
                        `<option value="${s}"${currentFilter === s ? ' selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)} (${c})</option>`
                    ).join('')}
                </select>

                <select class="form-input" id="txSortSelect" style="max-width:160px;padding:7px 12px;font-size:0.82rem;">
                    <option value="date-desc"${currentSort === 'date-desc' ? ' selected' : ''}>Newest</option>
                    <option value="date-asc"${currentSort === 'date-asc' ? ' selected' : ''}>Oldest</option>
                    <option value="amount-desc"${currentSort === 'amount-desc' ? ' selected' : ''}>Highest Amount</option>
                    <option value="amount-asc"${currentSort === 'amount-asc' ? ' selected' : ''}>Lowest Amount</option>
                </select>

                <button class="btn btn-sm" id="txExportBtn" title="Export CSV">${ICONS.download} CSV</button>
            </div>
        `;
    }

    function bindControls() {
        document.getElementById('txSearchInput')?.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase().trim();
            renderTable();
        });
        document.getElementById('txFilterSelect')?.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            renderTable();
        });
        document.getElementById('txSortSelect')?.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderTable();
        });
        document.getElementById('txExportBtn')?.addEventListener('click', exportCSV);
    }

    // ==================== TABLE ====================

    function renderTable() {
        const container = document.getElementById('txTableContainer');
        if (!container) return;

        let filtered = [...allTransactions];

        // Status filter
        if (currentFilter !== 'all') {
            filtered = filtered.filter(tx => tx.status === currentFilter);
        }

        // Search
        if (currentSearch) {
            filtered = filtered.filter(tx =>
                (tx.id || '').toLowerCase().includes(currentSearch) ||
                (tx.skill_name || '').toLowerCase().includes(currentSearch) ||
                (tx.buyer_name || '').toLowerCase().includes(currentSearch) ||
                (tx.seller_name || tx.agent_name || '').toLowerCase().includes(currentSearch) ||
                (tx.tier || '').toLowerCase().includes(currentSearch)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (currentSort) {
                case 'date-desc': return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'date-asc': return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                case 'amount-desc': return (b.amount_sats || 0) - (a.amount_sats || 0);
                case 'amount-asc': return (a.amount_sats || 0) - (b.amount_sats || 0);
                default: return 0;
            }
        });

        if (filtered.length === 0) {
            container.innerHTML = '<p class="loading-msg" style="color:var(--text-dim)">No transactions match your filters.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Skill</th>
                            <th>Tier</th>
                            <th>Amount</th>
                            <th>Fee (2%)</th>
                            <th>Buyer</th>
                            <th>Seller</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(tx => renderTxRow(tx)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderTxRow(tx) {
        const statusClass = (tx.status === 'complete' || tx.status === 'completed') ? 'badge-complete' :
                           tx.status === 'pending' ? 'badge-pending' :
                           tx.status === 'failed' ? 'badge-failed' : 'badge-inactive';

        const tierClass = tx.tier === 'execution' ? 'badge-exec' :
                         tx.tier === 'skill_file' ? 'badge-file' :
                         tx.tier === 'full_package' ? 'badge-pkg' : '';

        const feeDisplay = tx.platform_fee_sats ? AdminCore.formatSats(tx.platform_fee_sats) :
                          tx.amount_sats ? AdminCore.formatSats(Math.round(tx.amount_sats * 0.02)) : '--';

        return `<tr>
            <td class="mono" style="font-size:0.65rem;color:var(--text-muted);" title="${AdminCore.esc(tx.id || '')}">${(tx.id || '').substring(0, 8)}...</td>
            <td><strong>${AdminCore.esc(tx.skill_name || '--')}</strong></td>
            <td>${tx.tier ? `<span class="badge ${tierClass}">${AdminCore.esc(tx.tier)}</span>` : '--'}</td>
            <td class="mono" style="font-weight:600;color:var(--accent);">${tx.amount_sats ? AdminCore.formatSats(tx.amount_sats) : '--'}</td>
            <td class="mono" style="font-size:0.75rem;color:var(--green);">${feeDisplay}</td>
            <td>${AdminCore.esc(tx.buyer_name || '--')}</td>
            <td>${AdminCore.esc(tx.seller_name || tx.agent_name || '--')}</td>
            <td><span class="badge ${statusClass}">${AdminCore.esc(tx.status || 'unknown')}</span></td>
            <td style="font-size:0.75rem;color:var(--text-dim);white-space:nowrap;">${AdminCore.formatDate(tx.created_at)}</td>
        </tr>`;
    }

    // ==================== AGENT BREAKDOWN ====================

    function renderAgentBreakdown(agentRevenue) {
        const sorted = Object.entries(agentRevenue).sort((a, b) => b[1].sats - a[1].sats);

        return `
            <h3 style="font-family:var(--font-mono);font-size:0.85rem;margin:24px 0 12px;color:var(--text-dim);">Revenue by Agent</h3>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Transactions</th>
                            <th>Platform Fees</th>
                            ${btcPrice ? '<th>USD Value</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(([name, data]) => `<tr>
                            <td><strong>${AdminCore.esc(name)}</strong></td>
                            <td class="mono" style="text-align:center;">${data.count}</td>
                            <td class="mono" style="color:var(--green);">${AdminCore.formatSats(data.sats)}</td>
                            ${btcPrice ? `<td class="mono" style="color:var(--orange);">$${(data.sats / 100000000 * btcPrice).toFixed(2)}</td>` : ''}
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ==================== CSV EXPORT ====================

    function exportCSV() {
        if (allTransactions.length === 0) return;

        const headers = ['id', 'skill_name', 'tier', 'amount_sats', 'platform_fee_sats', 'buyer_name', 'seller_name', 'status', 'created_at'];
        const rows = allTransactions.map(tx =>
            headers.map(h => {
                const val = tx[h] ?? '';
                // Escape CSV values
                const str = String(val);
                return str.includes(',') || str.includes('"') || str.includes('\n')
                    ? '"' + str.replace(/"/g, '""') + '"'
                    : str;
            }).join(',')
        );

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `squidbay-transactions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        AdminCore.logAudit('export_transactions', `Exported ${allTransactions.length} transactions as CSV`);
    }

    // ==================== PUBLIC API ====================
    return { load };

})();
