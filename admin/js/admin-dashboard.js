// ==================== ADMIN DASHBOARD ====================
// Overview KPIs, system health, activity feed

const AdminDashboard = (() => {

    async function load() {
        const body = document.getElementById('dashboardBody');
        body.innerHTML = '<p class="loading-msg">Loading dashboard...</p>';

        try {
            const [skills, agents, scheduler, xStatus] = await Promise.all([
                AdminCore.publicGet('/skills?limit=500'),
                AdminCore.publicGet('/agents'),
                AdminCore.apiGet('/scheduler/status').catch(() => null),
                AdminCore.publicGet('/x/status').catch(() => null)
            ]);

            const skillList = skills.skills || [];
            const agentList = agents.agents || [];
            const totalJobs = skillList.reduce((sum, s) => sum + (s.success_count || 0), 0);
            const totalReviews = skillList.reduce((sum, s) => sum + (s.rating_count || 0), 0);
            const totalFees = skillList.reduce((sum, s) => sum + ((s.success_count || 0) * 2), 0); // estimate 2% fee

            // Calculate avg trust score
            const scannedSkills = skillList.filter(s => s.scan && typeof s.scan.risk_score === 'number');
            const avgTrust = scannedSkills.length > 0
                ? Math.round(scannedSkills.reduce((sum, s) => sum + (100 - s.scan.risk_score), 0) / scannedSkills.length)
                : '—';

            body.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Skills Listed</div>
                        <div class="stat-value cyan">${skillList.length}</div>
                        <div class="stat-sub">${scannedSkills.length} scanned</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Agents</div>
                        <div class="stat-value purple">${agentList.length}</div>
                        <div class="stat-sub">${agentList.filter(a => a.agent_card_verified).length} verified</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Jobs</div>
                        <div class="stat-value green">${totalJobs}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Reviews</div>
                        <div class="stat-value orange">${totalReviews}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Avg Trust Score</div>
                        <div class="stat-value green">${avgTrust}</div>
                        <div class="stat-sub">${scannedSkills.length} skills scanned</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">SquidBot Status</div>
                        <div class="stat-value ${scheduler?.active ? 'green' : 'red'}">${scheduler?.active ? 'LIVE' : scheduler ? 'OFF' : '—'}</div>
                        <div class="stat-sub">${scheduler ? `Posts: ${scheduler.daily_posts || 0} | Replies: ${scheduler.daily_replies || 0}` : ''}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">X Integration</div>
                        <div class="stat-value cyan">${xStatus?.configured ? 'Connected' : '—'}</div>
                        <div class="stat-sub">${xStatus?.bot_handle ? '@' + xStatus.bot_handle : ''}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Platform</div>
                        <div class="stat-value green">Online</div>
                        <div class="stat-sub">squidbay.io</div>
                    </div>
                </div>

                <h3 style="font-family:var(--font-mono);font-size:0.85rem;margin-bottom:12px;color:var(--text-dim);">
                    Skills Overview
                </h3>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Icon</th>
                                <th>Skill</th>
                                <th>Agent</th>
                                <th>Trust</th>
                                <th>Jobs</th>
                                <th>Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${skillList.map(s => {
                                const trust = s.scan ? (100 - (s.scan.risk_score || 0)) : '—';
                                const trustColor = trust === '—' ? 'var(--text-muted)' :
                                    trust >= 85 ? 'var(--green)' :
                                    trust >= 60 ? 'var(--orange)' : 'var(--red)';
                                const rating = s.rating_count > 0 ? (s.rating_sum / s.rating_count).toFixed(1) : '—';
                                return `<tr>
                                    <td>${s.icon || '🤖'}</td>
                                    <td><strong>${AdminCore.esc(s.name)}</strong><br><span style="font-size:0.65rem;color:var(--text-muted);">${AdminCore.esc(s.category || '')}</span></td>
                                    <td>${AdminCore.esc(s.agent_name || '—')}</td>
                                    <td style="color:${trustColor};font-family:var(--font-mono);font-weight:700;">${trust}</td>
                                    <td>${s.success_count || 0}</td>
                                    <td>${rating !== '—' ? '★ ' + rating : '—'}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('dashLastUpdated').textContent = `Updated ${new Date().toLocaleTimeString()}`;

        } catch (err) {
            body.innerHTML = `<p class="loading-msg" style="color:var(--red)">Error loading dashboard: ${AdminCore.esc(err.message)}</p>`;
        }
    }

    return { load };
})();
