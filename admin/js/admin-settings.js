// ==================== ADMIN SETTINGS ====================
// API config, Cloudflare token, 2FA setup, session, preferences

const AdminSettings = (() => {

    const ICONS = {
        settings: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
        shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        key: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>',
        globe: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
        save: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>',
        clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
    };

    async function load() {
        const body = document.getElementById('settingsBody');

        // Load current config
        let config = {};
        try {
            config = await AdminCore.apiGet('/admin/settings').catch(() => ({}));
        } catch (e) {}

        renderPage(body, config);
    }

    function renderPage(body, config) {
        body.innerHTML = `
            <div class="cmd-grid">
                <!-- 2FA Setup -->
                <div class="cmd-card">
                    <h3>${ICONS.shield} Two-Factor Authentication</h3>
                    <p>Set up TOTP-based 2FA for admin access. Supports any authenticator app.</p>
                    <div id="twoFASection"></div>
                    <div class="cmd-footer">
                        <button class="btn btn-primary btn-sm" id="btnSetup2FA">${ICONS.shield} Setup 2FA</button>
                        <button class="btn btn-sm btn-danger" id="btnDisable2FA" style="display:none;">${ICONS.shield} Disable 2FA</button>
                    </div>
                    <div class="cmd-result" id="result2FA"></div>
                </div>

                <!-- Cloudflare Analytics -->
                <div class="cmd-card">
                    <h3>${ICONS.globe} Cloudflare Analytics Token</h3>
                    <p>Required for the Analytics tab. Create a token with "Zone Analytics" read permission.</p>
                    <div class="form-group">
                        <input type="password" class="form-input" id="cfToken" placeholder="Bearer token..." 
                            value="${AdminCore.esc(config.cloudflare_token ? '****' + (config.cloudflare_token_suffix || '') : '')}"
                            style="font-family:var(--font-mono);font-size:0.78rem;">
                    </div>
                    <div class="form-group">
                        <input type="text" class="form-input" id="cfZoneId" placeholder="Zone ID"
                            value="${AdminCore.esc(config.cloudflare_zone_id || '')}"
                            style="font-family:var(--font-mono);font-size:0.78rem;">
                    </div>
                    <div class="cmd-footer">
                        <button class="btn btn-primary btn-sm" id="btnSaveCF">${ICONS.save} Save</button>
                    </div>
                    <div class="cmd-result" id="resultCF"></div>
                </div>

                <!-- Scheduler Config -->
                <div class="cmd-card">
                    <h3>${ICONS.clock} Scheduler Config</h3>
                    <p>Adjust SquidBot's posting limits and behavior.</p>
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Max Posts/Day</label>
                            <input type="number" class="form-input" id="schedMaxPosts" value="${config.max_posts_per_day || 3}" min="0" max="20">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Max Replies/Day</label>
                            <input type="number" class="form-input" id="schedMaxReplies" value="${config.max_replies_per_day || 10}" min="0" max="50">
                        </div>
                    </div>
                    <div class="cmd-footer">
                        <button class="btn btn-primary btn-sm" id="btnSaveSched">${ICONS.save} Save</button>
                    </div>
                    <div class="cmd-result" id="resultSched"></div>
                </div>

                <!-- API Base URL -->
                <div class="cmd-card">
                    <h3>${ICONS.settings} Platform Config</h3>
                    <p>Core platform settings.</p>
                    <div class="form-group">
                        <label class="form-label">API Base URL</label>
                        <input type="text" class="form-input" id="cfgApiUrl" value="${AdminCore.esc(config.api_base_url || 'https://squidbay-api-production.up.railway.app')}" 
                            style="font-family:var(--font-mono);font-size:0.78rem;" disabled>
                        <span style="font-size:0.65rem;color:var(--text-muted);">Configured in admin-core.js</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Revenue Split</label>
                        <input type="text" class="form-input" value="98% Agent / 2% Platform" disabled style="opacity:0.5;">
                        <span style="font-size:0.65rem;color:var(--text-muted);">Stripe-style — not configurable via UI</span>
                    </div>
                </div>

                <!-- Session Info -->
                <div class="cmd-card">
                    <h3>${ICONS.key} Active Session</h3>
                    <p>Current admin session details.</p>
                    <div style="font-size:0.8rem;color:var(--text-dim);line-height:1.8;">
                        <div>Session started: <span id="settingsSessionStart" class="mono">--</span></div>
                        <div>Key prefix: <span class="mono" style="color:var(--text-muted);">****</span></div>
                        <div>Storage: sessionStorage (browser tab only)</div>
                        <div>Idle timeout: 15 minutes</div>
                        <div>Max session: 4 hours</div>
                    </div>
                    <div class="cmd-footer" style="margin-top:12px;">
                        <button class="btn btn-sm btn-danger" onclick="AdminCore.logout()">End Session</button>
                    </div>
                </div>

                <!-- Backup Codes -->
                <div class="cmd-card">
                    <h3>${ICONS.key} 2FA Backup Codes</h3>
                    <p>Generate new backup codes. Previous codes will be invalidated.</p>
                    <div class="cmd-footer">
                        <button class="btn btn-sm" id="btnGenBackup">${ICONS.key} Generate New Codes</button>
                    </div>
                    <div class="cmd-result" id="resultBackup"></div>
                </div>
            </div>
        `;

        bindEvents();
    }

    function bindEvents() {
        // 2FA Setup
        document.getElementById('btnSetup2FA')?.addEventListener('click', async () => {
            try {
                const data = await AdminCore.apiPost('/admin/2fa/setup');
                if (data.qr_url || data.secret) {
                    const section = document.getElementById('twoFASection');
                    section.innerHTML = `
                        <div style="text-align:center;padding:16px;">
                            ${data.qr_url ? `<img src="${AdminCore.esc(data.qr_url)}" style="width:200px;height:200px;image-rendering:pixelated;margin-bottom:12px;">` : ''}
                            <div class="mono" style="font-size:0.75rem;color:var(--text-dim);margin-bottom:12px;">
                                Secret: <strong style="color:var(--accent);">${AdminCore.esc(data.secret || '')}</strong>
                            </div>
                            <div class="form-group" style="max-width:200px;margin:0 auto;">
                                <input type="text" class="form-input" id="verify2FACode" placeholder="Enter 6-digit code" 
                                    maxlength="6" inputmode="numeric" style="text-align:center;letter-spacing:6px;font-size:1.2rem;">
                            </div>
                            <button class="btn btn-primary btn-sm" id="btnVerify2FA" style="margin-top:8px;">Verify &amp; Enable</button>
                        </div>
                    `;

                    document.getElementById('btnVerify2FA')?.addEventListener('click', async () => {
                        const code = document.getElementById('verify2FACode').value.trim();
                        if (!code || code.length !== 6) {
                            AdminCore.showResult('result2FA', 'Enter a 6-digit code', true);
                            return;
                        }
                        try {
                            await AdminCore.apiPost('/admin/2fa/verify', { code });
                            AdminCore.showResult('result2FA', '2FA enabled successfully');
                            AdminCore.logAudit('enable_2fa', '2FA enabled');
                            section.innerHTML = '';
                        } catch (e) {
                            AdminCore.showResult('result2FA', `Invalid code: ${e.message}`, true);
                        }
                    });
                }
            } catch (err) {
                AdminCore.showResult('result2FA', `Error: ${err.message}`, true);
            }
        });

        // Disable 2FA
        document.getElementById('btnDisable2FA')?.addEventListener('click', async () => {
            if (!confirm('Disable 2FA? This reduces account security.')) return;
            try {
                await AdminCore.apiPost('/admin/2fa/disable');
                AdminCore.logAudit('disable_2fa', '2FA disabled');
                AdminCore.showResult('result2FA', '2FA disabled.');
            } catch (err) {
                AdminCore.showResult('result2FA', `Error: ${err.message}`, true);
            }
        });

        // Cloudflare save
        document.getElementById('btnSaveCF')?.addEventListener('click', async () => {
            const token = document.getElementById('cfToken').value.trim();
            const zoneId = document.getElementById('cfZoneId').value.trim();

            if (!token && !zoneId) {
                AdminCore.showResult('resultCF', 'Enter token and zone ID', true);
                return;
            }

            try {
                await AdminCore.apiPut('/admin/settings', {
                    cloudflare_token: token.startsWith('****') ? undefined : token,
                    cloudflare_zone_id: zoneId || undefined
                });
                AdminCore.logAudit('save_cf_config', 'Updated Cloudflare config');
                AdminCore.showResult('resultCF', 'Cloudflare config saved.');
            } catch (err) {
                AdminCore.showResult('resultCF', `Error: ${err.message}`, true);
            }
        });

        // Scheduler save
        document.getElementById('btnSaveSched')?.addEventListener('click', async () => {
            const maxPosts = parseInt(document.getElementById('schedMaxPosts').value, 10);
            const maxReplies = parseInt(document.getElementById('schedMaxReplies').value, 10);

            try {
                await AdminCore.apiPut('/admin/scheduler/config', {
                    max_posts_per_day: maxPosts,
                    max_replies_per_day: maxReplies
                });
                AdminCore.logAudit('save_scheduler_config', `Updated scheduler: ${maxPosts} posts, ${maxReplies} replies`);
                AdminCore.showResult('resultSched', 'Scheduler config saved.');
            } catch (err) {
                AdminCore.showResult('resultSched', `Error: ${err.message}`, true);
            }
        });

        // Backup codes
        document.getElementById('btnGenBackup')?.addEventListener('click', async () => {
            if (!confirm('Generate new backup codes? Previous codes will stop working.')) return;

            try {
                const data = await AdminCore.apiPost('/admin/2fa/backup-codes');
                const codes = data.codes || [];
                AdminCore.logAudit('gen_backup_codes', 'Generated new 2FA backup codes');

                if (codes.length > 0) {
                    const el = document.getElementById('resultBackup');
                    el.innerHTML = `
                        <div style="background:var(--bg-elevated);padding:12px;border-radius:var(--radius);margin-top:8px;">
                            <p style="font-size:0.75rem;color:var(--orange);margin-bottom:8px;">Save these codes somewhere safe. They won't be shown again.</p>
                            <div class="mono" style="font-size:0.85rem;line-height:2;color:var(--accent);">
                                ${codes.map(c => AdminCore.esc(c)).join('<br>')}
                            </div>
                        </div>
                    `;
                } else {
                    AdminCore.showResult('resultBackup', 'Backup codes generated. Check server response.');
                }
            } catch (err) {
                AdminCore.showResult('resultBackup', `Error: ${err.message}`, true);
            }
        });
    }

    return { load };
})();
