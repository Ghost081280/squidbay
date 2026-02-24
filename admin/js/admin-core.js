// ==================== ADMIN CORE ====================
// Auth, 2FA, navigation, session management, API helpers

const AdminCore = (() => {
    // ==================== CONFIG ====================
    const API = window.location.origin.includes('railway.app')
        ? window.location.origin
        : 'https://squidbay-api-production.up.railway.app';

    let adminKey = '';
    let sessionStart = null;
    let sessionTimer = null;
    let idleTimer = null;
    let failedAttempts = 0;
    let lockoutUntil = 0;
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_SECONDS = 900; // 15 minutes
    const SESSION_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours
    const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 min idle
    const loadedModules = new Set();

    // ==================== AUTH ====================

    async function authenticate() {
        // Check lockout
        if (Date.now() < lockoutUntil) {
            showLockout();
            return;
        }

        const key = document.getElementById('adminKeyInput').value.trim();
        if (!key) return;

        try {
            const res = await fetch(`${API}/admin/verify`, {
                headers: { 'x-squidbay-key': key }
            });

            if (!res.ok) throw new Error('bad key');

            const data = await res.json();

            // Key verified — store temporarily
            adminKey = key;

            // Check if 2FA is enabled
            if (data.totp_enabled) {
                // Show 2FA step
                document.getElementById('loginStep1').style.display = 'none';
                document.getElementById('loginStep2').style.display = 'block';
                document.getElementById('totpInput').focus();
                hideError();
            } else {
                // No 2FA — go straight in (will prompt to set up in settings)
                completeLogin();
            }

            failedAttempts = 0;
        } catch (e) {
            failedAttempts++;
            if (failedAttempts >= MAX_ATTEMPTS) {
                lockoutUntil = Date.now() + (LOCKOUT_SECONDS * 1000);
                showLockout();
            } else {
                showError(`Authentication failed (${failedAttempts}/${MAX_ATTEMPTS})`);
            }
            document.getElementById('adminKeyInput').value = '';
            document.getElementById('adminKeyInput').focus();
        }
    }

    async function verify2FA() {
        const code = document.getElementById('totpInput').value.trim();
        if (!code || code.length !== 6) return;

        try {
            const res = await fetch(`${API}/admin/2fa/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-squidbay-key': adminKey
                },
                body: JSON.stringify({ code })
            });

            if (!res.ok) throw new Error('invalid code');

            completeLogin();
        } catch (e) {
            failedAttempts++;
            if (failedAttempts >= MAX_ATTEMPTS) {
                lockoutUntil = Date.now() + (LOCKOUT_SECONDS * 1000);
                showLockout();
            } else {
                showError(`Invalid code (${failedAttempts}/${MAX_ATTEMPTS})`);
            }
            document.getElementById('totpInput').value = '';
            document.getElementById('totpInput').focus();
        }
    }

    async function verifyBackup() {
        const code = document.getElementById('backupCodeInput').value.trim();
        if (!code) return;

        try {
            const res = await fetch(`${API}/admin/2fa/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-squidbay-key': adminKey
                },
                body: JSON.stringify({ backup_code: code })
            });

            if (!res.ok) throw new Error('invalid backup code');

            completeLogin();
        } catch (e) {
            showError('Invalid backup code');
            document.getElementById('backupCodeInput').value = '';
        }
    }

    function completeLogin() {
        // Store session
        sessionStorage.setItem('squidbay_ops_key', adminKey);
        sessionStart = Date.now();

        // Show app
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('app').classList.add('active');

        // Start timers
        startSessionTimer();
        resetIdleTimer();

        // Listen for activity
        document.addEventListener('mousemove', resetIdleTimer);
        document.addEventListener('keypress', resetIdleTimer);
        document.addEventListener('click', resetIdleTimer);

        // Load dashboard
        switchTab('dashboard');

        // Log audit event
        logAudit('login', 'Admin logged in');
    }

    function logout() {
        logAudit('logout', 'Admin logged out');

        adminKey = '';
        sessionStart = null;
        sessionStorage.removeItem('squidbay_ops_key');

        // Clear timers
        if (sessionTimer) clearInterval(sessionTimer);
        if (idleTimer) clearTimeout(idleTimer);

        // Remove listeners
        document.removeEventListener('mousemove', resetIdleTimer);
        document.removeEventListener('keypress', resetIdleTimer);
        document.removeEventListener('click', resetIdleTimer);

        // Reset UI
        document.getElementById('app').classList.remove('active');
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('loginStep1').style.display = 'block';
        document.getElementById('loginStep2').style.display = 'none';
        document.getElementById('loginStepBackup').style.display = 'none';
        document.getElementById('adminKeyInput').value = '';
        document.getElementById('adminKeyInput').focus();
        hideError();
    }

    // ==================== SESSION MANAGEMENT ====================

    function startSessionTimer() {
        const timerEl = document.getElementById('sessionTimer');
        sessionTimer = setInterval(() => {
            if (!sessionStart) return;
            const elapsed = Date.now() - sessionStart;
            const remaining = SESSION_TIMEOUT - elapsed;

            if (remaining <= 0) {
                logout();
                showError('Session expired');
                return;
            }

            const hours = Math.floor(remaining / 3600000);
            const mins = Math.floor((remaining % 3600000) / 60000);
            timerEl.textContent = `Session: ${hours}h ${mins}m`;

            // Warn at 15 min
            if (remaining < 900000) {
                timerEl.style.color = 'var(--orange)';
            }
        }, 30000); // Update every 30s
    }

    function resetIdleTimer() {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            logout();
            showError('Logged out due to inactivity');
        }, IDLE_TIMEOUT);
    }

    // ==================== UI HELPERS ====================

    function showError(msg) {
        const el = document.getElementById('loginError');
        el.textContent = msg || 'Authentication failed';
        el.style.display = 'block';
    }

    function hideError() {
        document.getElementById('loginError').style.display = 'none';
    }

    function showLockout() {
        document.getElementById('loginStep1').style.display = 'none';
        document.getElementById('loginStep2').style.display = 'none';
        document.getElementById('loginStepBackup').style.display = 'none';
        document.getElementById('loginLockout').style.display = 'block';
        hideError();

        const tick = setInterval(() => {
            const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
            if (remaining <= 0) {
                clearInterval(tick);
                document.getElementById('loginLockout').style.display = 'none';
                document.getElementById('loginStep1').style.display = 'block';
                failedAttempts = 0;
                document.getElementById('adminKeyInput').focus();
                return;
            }
            document.getElementById('lockoutTimer').textContent = remaining;
        }, 1000);
    }

    function showTOTPInput() {
        document.getElementById('loginStepBackup').style.display = 'none';
        document.getElementById('loginStep2').style.display = 'block';
        document.getElementById('totpInput').focus();
    }

    function showBackupInput() {
        document.getElementById('loginStep2').style.display = 'none';
        document.getElementById('loginStepBackup').style.display = 'block';
        document.getElementById('backupCodeInput').focus();
    }

    // ==================== NAVIGATION ====================

    function switchTab(tab) {
        // Update nav
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navItem = document.querySelector(`[data-tab="${tab}"]`);
        if (navItem) navItem.classList.add('active');

        // Update panels
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(`panel-${tab}`);
        if (panel) panel.classList.add('active');

        // Close mobile sidebar
        closeSidebar();

        // Load module if not yet loaded
        loadModule(tab);
    }

    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.toggle('open');
        overlay.classList.toggle('visible');
    }

    function closeSidebar() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('visible');
    }

    // ==================== MODULE LOADER ====================

    const TAB_MODULES = {
        dashboard: 'js/admin-dashboard.js',
        analytics: 'js/admin-analytics.js',
        skills: 'js/admin-skills.js',
        agents: 'js/admin-agents.js',
        reviews: 'js/admin-reviews.js',
        transactions: 'js/admin-transactions.js',
        security: 'js/admin-security.js',
        squidbot: 'js/admin-squidbot.js',
        chat: 'js/admin-chat.js',
        github: 'js/admin-github.js',
        keys: 'js/admin-keys.js',
        infra: 'js/admin-infra.js',
        reports: 'js/admin-reports.js',
        settings: 'js/admin-settings.js'
    };

    function loadModule(tab) {
        const src = TAB_MODULES[tab];
        if (!src || loadedModules.has(tab)) {
            // Module already loaded — just call its load function
            triggerTabLoad(tab);
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            loadedModules.add(tab);
            triggerTabLoad(tab);
        };
        script.onerror = () => {
            const body = document.getElementById(`${tab}Body`);
            if (body) body.innerHTML = `<p class="loading-msg" style="color:var(--orange)">Module not yet implemented: ${tab}</p>`;
        };
        document.body.appendChild(script);
    }

    function triggerTabLoad(tab) {
        // Convention: each module exposes Admin{PascalCase}.load()
        const moduleMap = {
            dashboard: 'AdminDashboard',
            analytics: 'AdminAnalytics',
            skills: 'AdminSkills',
            agents: 'AdminAgents',
            reviews: 'AdminReviews',
            transactions: 'AdminTransactions',
            security: 'AdminSecurity',
            squidbot: 'AdminSquidBot',
            chat: 'AdminChat',
            github: 'AdminGitHub',
            keys: 'AdminKeys',
            infra: 'AdminInfra',
            reports: 'AdminReports',
            settings: 'AdminSettings'
        };

        const moduleName = moduleMap[tab];
        if (moduleName && window[moduleName] && typeof window[moduleName].load === 'function') {
            window[moduleName].load();
        }
    }

    // ==================== API HELPERS ====================

    function apiGet(path) {
        return fetch(`${API}${path}`, {
            headers: { 'x-squidbay-key': adminKey }
        }).then(handleResponse);
    }

    function apiPost(path, body) {
        return fetch(`${API}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-squidbay-key': adminKey
            },
            body: JSON.stringify(body)
        }).then(handleResponse);
    }

    function apiPut(path, body) {
        return fetch(`${API}${path}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-squidbay-key': adminKey
            },
            body: JSON.stringify(body)
        }).then(handleResponse);
    }

    function apiDelete(path) {
        return fetch(`${API}${path}`, {
            method: 'DELETE',
            headers: { 'x-squidbay-key': adminKey }
        }).then(handleResponse);
    }

    function handleResponse(res) {
        if (res.status === 401) {
            logout();
            showError('Session expired — please re-authenticate');
            throw new Error('Unauthorized');
        }
        return res.json();
    }

    // Public API endpoint (no auth needed)
    function publicGet(path) {
        return fetch(`${API}${path}`).then(r => r.json());
    }

    // ==================== UTILITIES ====================

    function esc(s) {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function formatDate(d) {
        if (!d) return '—';
        const date = new Date(d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
            date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function formatSats(sats) {
        if (!sats && sats !== 0) return '—';
        return Number(sats).toLocaleString() + ' sats';
    }

    function showResult(elementId, text, isError) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = text;
        el.className = `cmd-result visible${isError ? ' error' : ''}`;
    }

    function logAudit(action, detail) {
        // Fire and forget — best effort audit logging
        try {
            apiPost('/admin/audit-log', { action, detail }).catch(() => {});
        } catch (e) { /* ignore */ }
    }

    // ==================== KEYBOARD SHORTCUTS ====================

    document.addEventListener('keydown', (e) => {
        if (!adminKey) return; // Not logged in

        // Escape — close modals
        if (e.key === 'Escape') {
            const modal = document.querySelector('.modal-overlay');
            if (modal) modal.remove();
            closeSidebar();
        }

        // Cmd/Ctrl + K — focus search (future)
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            // TODO: global search
        }
    });

    // ==================== AUTO-LOGIN ====================

    (function init() {
        const saved = sessionStorage.getItem('squidbay_ops_key');
        if (saved) {
            document.getElementById('adminKeyInput').value = saved;
            authenticate();
        }

        // Enter key on login
        document.getElementById('adminKeyInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') authenticate();
        });

        document.getElementById('totpInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') verify2FA();
        });

        document.getElementById('backupCodeInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') verifyBackup();
        });
    })();

    // ==================== PUBLIC API ====================
    return {
        API,
        authenticate,
        verify2FA,
        verifyBackup,
        showTOTPInput,
        showBackupInput,
        logout,
        switchTab,
        toggleSidebar,
        closeSidebar,
        apiGet,
        apiPost,
        apiPut,
        apiDelete,
        publicGet,
        esc,
        formatDate,
        formatSats,
        showResult,
        logAudit,
        getKey: () => adminKey
    };
})();
