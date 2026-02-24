// ==================== ADMIN SQUIDBOT ====================
// X posting, Moltbook, scheduler controls — ADMIN social media ops only

const AdminSquidBot = (() => {

    // ==================== SVG ICONS ====================

    const ICONS = {
        send: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
        refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
        play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
        pause: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>',
        ban: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>',
        clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        messageCircle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>'
    };

    let schedulerStatus = null;
    let xStatus = null;

    // ==================== LOAD (called as loadStatus from index.html) ====================

    async function loadStatus() {
        const body = document.getElementById('squidbotBody');
        body.innerHTML = '<p class="loading-msg">Loading SquidBot status...</p>';

        try {
            const [sched, xStat] = await Promise.all([
                AdminCore.publicGet('/scheduler/status').catch(() => null),
                AdminCore.publicGet('/x/status').catch(() => null)
            ]);

            schedulerStatus = sched;
            xStatus = xStat;

            renderPage(body);
        } catch (err) {
            body.innerHTML = `<p class="loading-msg" style="color:var(--red)">Error: ${AdminCore.esc(err.message)}</p>`;
        }
    }

    // Alias for module loader convention
    function load() { loadStatus(); }

    // ==================== RENDER ====================

    function renderPage(body) {
        const isActive = schedulerStatus?.active;

        body.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Scheduler</div>
                    <div class="stat-value ${isActive ? 'green' : 'red'}">${isActive ? 'LIVE' : isActive === false ? 'OFF' : '--'}</div>
                    <div class="stat-sub">Posts: ${schedulerStatus?.daily_posts || 0}/${schedulerStatus?.max_posts_per_day || '?'} | Replies: ${schedulerStatus?.daily_replies || 0}/${schedulerStatus?.max_replies_per_day || '?'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">X Connection</div>
                    <div class="stat-value ${xStatus?.configured ? 'green' : 'red'}">${xStatus?.configured ? 'Connected' : 'Not Connected'}</div>
                    <div class="stat-sub">${xStatus?.bot_handle ? '@' + xStatus.bot_handle : ''}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Bot Handle</div>
                    <div class="stat-value cyan">${xStatus?.bot_handle ? '@' + xStatus.bot_handle : '--'}</div>
                    <div class="stat-sub">Founder: ${xStatus?.founder_handle ? '@' + xStatus.founder_handle : '--'}</div>
                </div>
            </div>

            <div class="cmd-grid">
                <!-- AI Post -->
                <div class="cmd-card">
                    <h3>${ICONS.send} AI-Generated Post</h3>
                    <p>Generate and post an AI-crafted tweet about SquidBay.</p>
                    <div class="cmd-footer">
                        <button class="btn btn-primary btn-sm" id="btnAIPost">${ICONS.play} Generate &amp; Post</button>
                    </div>
                    <div class="cmd-result" id="resultAIPost"></div>
                </div>

                <!-- Manual Post -->
                <div class="cmd-card">
                    <h3>${ICONS.send} Manual Post</h3>
                    <p>Write and post a custom tweet.</p>
                    <textarea class="cmd-textarea" id="manualPostText" placeholder="Write your tweet..." rows="3"></textarea>
                    <div class="cmd-footer">
                        <span style="font-size:0.7rem;color:var(--text-muted);" id="charCount">0/280</span>
                        <button class="btn btn-primary btn-sm" id="btnManualPost">${ICONS.send} Post</button>
                    </div>
                    <div class="cmd-result" id="resultManualPost"></div>
                </div>

                <!-- Moltbook Post -->
                <div class="cmd-card">
                    <h3>${ICONS.messageCircle} Moltbook Post</h3>
                    <p>AI-generated or manual post to Moltbook.</p>
                    <textarea class="cmd-textarea" id="moltbookText" placeholder="Leave empty for AI-generated..." rows="3"></textarea>
                    <div class="cmd-footer">
                        <button class="btn btn-primary btn-sm" id="btnMoltbook">${ICONS.send} Post to Moltbook</button>
                    </div>
                    <div class="cmd-result" id="resultMoltbook"></div>
                </div>

                <!-- Scheduler Controls -->
                <div class="cmd-card">
                    <h3>${ICONS.clock} Scheduler Controls</h3>
                    <p>Force actions or toggle the scheduler.</p>
                    <div class="btn-group" style="margin-bottom:8px;">
                        <button class="btn btn-sm" id="btnForcePost">${ICONS.play} Force Post</button>
                        <button class="btn btn-sm" id="btnForceBanter">${ICONS.messageCircle} Force Banter</button>
                        <button class="btn btn-sm" id="btnForcePoll">${ICONS.refresh} Force Poll</button>
                    </div>
                    <div style="margin-top:8px;">
                        <button class="btn btn-sm ${isActive ? 'btn-danger' : ''}" id="btnToggleScheduler">
                            ${isActive ? ICONS.pause + ' Pause Scheduler' : ICONS.play + ' Start Scheduler'}
                        </button>
                    </div>
                    <div class="cmd-result" id="resultScheduler"></div>
                </div>

                <!-- Handle Blocking -->
                <div class="cmd-card">
                    <h3>${ICONS.ban} Handle Blocking</h3>
                    <p>Block handles from SquidBot interactions.</p>
                    <input type="text" class="form-input" id="blockHandleInput" placeholder="@handle" style="margin-bottom:8px;">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-danger" id="btnBlockHandle">${ICONS.ban} Block</button>
                        <button class="btn btn-sm" id="btnViewBlocked">View Blocked</button>
                    </div>
                    <div class="cmd-result" id="resultBlocked"></div>
                </div>

                <!-- Recent Posts -->
                <div class="cmd-card">
                    <h3>${ICONS.clock} Recent Activity</h3>
                    <p>Latest posts and cached tweets.</p>
                    <div class="btn-group">
                        <button class="btn btn-sm" id="btnRecentPosts">${ICONS.refresh} Load Recent</button>
                    </div>
                    <div class="cmd-result" id="resultRecent"></div>
                </div>
            </div>
        `;

        bindEvents();
    }

    // ==================== EVENT BINDINGS ====================

    function bindEvents() {
        // Character count
        const textarea = document.getElementById('manualPostText');
        if (textarea) {
            textarea.addEventListener('input', () => {
                const count = textarea.value.length;
                const el = document.getElementById('charCount');
                el.textContent = `${count}/280`;
                el.style.color = count > 280 ? 'var(--red)' : 'var(--text-muted)';
            });
        }

        // AI Post
        document.getElementById('btnAIPost')?.addEventListener('click', async () => {
            await doAction('btnAIPost', 'resultAIPost', () =>
                AdminCore.apiPost('/admin/x/post', { mode: 'ai' })
            );
        });

        // Manual Post
        document.getElementById('btnManualPost')?.addEventListener('click', async () => {
            const text = document.getElementById('manualPostText').value.trim();
            if (!text) { AdminCore.showResult('resultManualPost', 'Enter tweet text', true); return; }
            if (text.length > 280) { AdminCore.showResult('resultManualPost', 'Tweet exceeds 280 chars', true); return; }
            await doAction('btnManualPost', 'resultManualPost', () =>
                AdminCore.apiPost('/admin/x/post', { mode: 'manual', text })
            );
        });

        // Moltbook
        document.getElementById('btnMoltbook')?.addEventListener('click', async () => {
            const text = document.getElementById('moltbookText').value.trim();
            await doAction('btnMoltbook', 'resultMoltbook', () =>
                AdminCore.apiPost('/admin/moltbook/post', text ? { text } : { mode: 'ai' })
            );
        });

        // Scheduler controls
        document.getElementById('btnForcePost')?.addEventListener('click', async () => {
            await doAction('btnForcePost', 'resultScheduler', () =>
                AdminCore.apiPost('/admin/scheduler/force-post')
            );
        });

        document.getElementById('btnForceBanter')?.addEventListener('click', async () => {
            await doAction('btnForceBanter', 'resultScheduler', () =>
                AdminCore.apiPost('/admin/scheduler/force-banter')
            );
        });

        document.getElementById('btnForcePoll')?.addEventListener('click', async () => {
            await doAction('btnForcePoll', 'resultScheduler', () =>
                AdminCore.apiPost('/admin/scheduler/force-poll')
            );
        });

        document.getElementById('btnToggleScheduler')?.addEventListener('click', async () => {
            const newState = !schedulerStatus?.active;
            await doAction('btnToggleScheduler', 'resultScheduler', async () => {
                const result = await AdminCore.apiPost('/admin/scheduler/toggle', { active: newState });
                AdminCore.logAudit('toggle_scheduler', `Scheduler ${newState ? 'started' : 'paused'}`);
                schedulerStatus = { ...schedulerStatus, active: newState };
                return result;
            });
        });

        // Handle blocking
        document.getElementById('btnBlockHandle')?.addEventListener('click', async () => {
            const handle = document.getElementById('blockHandleInput').value.trim().replace('@', '');
            if (!handle) { AdminCore.showResult('resultBlocked', 'Enter a handle', true); return; }
            await doAction('btnBlockHandle', 'resultBlocked', () =>
                AdminCore.apiPost('/admin/handles/blocked', { handle })
            );
        });

        document.getElementById('btnViewBlocked')?.addEventListener('click', async () => {
            await doAction('btnViewBlocked', 'resultBlocked', async () => {
                const data = await AdminCore.apiGet('/admin/handles/blocked');
                const handles = data.handles || data.blocked || [];
                return { message: handles.length > 0 ? handles.map(h => '@' + h).join(', ') : 'No blocked handles' };
            });
        });

        // Recent posts
        document.getElementById('btnRecentPosts')?.addEventListener('click', async () => {
            await doAction('btnRecentPosts', 'resultRecent', async () => {
                const data = await AdminCore.apiGet('/admin/x/recent');
                const posts = data.tweets || data.posts || [];
                if (posts.length === 0) return { message: 'No recent posts' };
                return { message: posts.map(p => `[${new Date(p.created_at || p.date).toLocaleString()}] ${p.text || p.content}`).join('\n\n') };
            });
        });
    }

    // ==================== ACTION HELPER ====================

    async function doAction(btnId, resultId, fn) {
        const btn = document.getElementById(btnId);
        const origHTML = btn.innerHTML;
        btn.disabled = true;
        btn.style.opacity = '0.6';

        try {
            const result = await fn();
            const msg = result?.message || result?.text || result?.tweet?.text || JSON.stringify(result, null, 2);
            AdminCore.showResult(resultId, msg);
        } catch (err) {
            AdminCore.showResult(resultId, `Error: ${err.message || 'Request failed'}`, true);
        } finally {
            btn.innerHTML = origHTML;
            btn.disabled = false;
            btn.style.opacity = '';
        }
    }

    // ==================== PUBLIC API ====================
    return { load, loadStatus };

})();
