// ==================== ADMIN SKILLS ====================
// Skills table, trust score badges, edit modal, soft delete, rescan, filters

const AdminSkills = (() => {

    let allSkills = [];
    let currentFilter = 'all'; // all | active | inactive
    let currentSearch = '';
    let currentCategory = 'all';
    let currentSort = 'name-asc';

    // ==================== SVG ICONS (Feather/Lucide style, matches site) ====================

    const ICONS = {
        edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
        scan: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
        link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>',
        deactivate: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>',
        reactivate: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        spinner: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line></svg>',
        error: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        // Tier icons (matching marketplace exactly)
        tierExec: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
        tierFile: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
        tierPkg: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline></svg>'
    };

    // ==================== MAIN LOAD ====================

    async function load() {
        const body = document.getElementById('skillsBody');
        body.innerHTML = '<p class="loading-msg">Loading skills...</p>';

        try {
            // Use admin endpoint to get ALL skills (including inactive)
            // Falls back to public endpoint if admin one doesn't exist yet
            let data;
            try {
                data = await AdminCore.apiGet('/admin/skills');
            } catch (e) {
                data = await AdminCore.publicGet('/skills?limit=500');
            }

            allSkills = data.skills || [];

            // Update header count
            const countEl = document.getElementById('skillCount');
            if (countEl) countEl.textContent = `(${allSkills.length})`;

            renderControls(body);
            renderTable();

        } catch (err) {
            body.innerHTML = `<p class="loading-msg" style="color:var(--red)">Error loading skills: ${AdminCore.esc(err.message)}</p>`;
        }
    }

    // ==================== CONTROLS ====================

    function renderControls(body) {
        const categories = [...new Set(allSkills.map(s => s.category).filter(Boolean))].sort();
        const activeCount = allSkills.filter(s => s.is_active !== false && s.is_active !== 0).length;
        const inactiveCount = allSkills.filter(s => s.is_active === false || s.is_active === 0).length;

        body.innerHTML = `
            <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
                <input type="text" class="form-input" id="skillSearchInput" placeholder="Search skills..."
                    style="max-width:260px;padding:7px 12px;font-size:0.82rem;" value="${AdminCore.esc(currentSearch)}">

                <select class="form-input" id="skillFilterStatus" style="max-width:160px;padding:7px 12px;font-size:0.82rem;">
                    <option value="all"${currentFilter === 'all' ? ' selected' : ''}>All (${allSkills.length})</option>
                    <option value="active"${currentFilter === 'active' ? ' selected' : ''}>Active (${activeCount})</option>
                    ${inactiveCount > 0 ? `<option value="inactive"${currentFilter === 'inactive' ? ' selected' : ''}>Inactive (${inactiveCount})</option>` : ''}
                </select>

                <select class="form-input" id="skillFilterCategory" style="max-width:160px;padding:7px 12px;font-size:0.82rem;">
                    <option value="all"${currentCategory === 'all' ? ' selected' : ''}>All Categories</option>
                    ${categories.map(c => `<option value="${AdminCore.esc(c)}"${currentCategory === c ? ' selected' : ''}>${AdminCore.esc(c)}</option>`).join('')}
                </select>

                <select class="form-input" id="skillSortSelect" style="max-width:160px;padding:7px 12px;font-size:0.82rem;">
                    <option value="name-asc"${currentSort === 'name-asc' ? ' selected' : ''}>Name A-Z</option>
                    <option value="name-desc"${currentSort === 'name-desc' ? ' selected' : ''}>Name Z-A</option>
                    <option value="trust-desc"${currentSort === 'trust-desc' ? ' selected' : ''}>Trust High-Low</option>
                    <option value="trust-asc"${currentSort === 'trust-asc' ? ' selected' : ''}>Trust Low-High</option>
                    <option value="jobs-desc"${currentSort === 'jobs-desc' ? ' selected' : ''}>Most Jobs</option>
                    <option value="created-desc"${currentSort === 'created-desc' ? ' selected' : ''}>Newest</option>
                    <option value="created-asc"${currentSort === 'created-asc' ? ' selected' : ''}>Oldest</option>
                </select>
            </div>

            <div id="skillsTableContainer"></div>
        `;

        // Bind filter events
        document.getElementById('skillSearchInput').addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase().trim();
            renderTable();
        });
        document.getElementById('skillFilterStatus').addEventListener('change', (e) => {
            currentFilter = e.target.value;
            renderTable();
        });
        document.getElementById('skillFilterCategory').addEventListener('change', (e) => {
            currentCategory = e.target.value;
            renderTable();
        });
        document.getElementById('skillSortSelect').addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderTable();
        });
    }

    // ==================== TABLE ====================

    function renderTable() {
        const container = document.getElementById('skillsTableContainer');
        if (!container) return;

        let filtered = [...allSkills];

        // Status filter
        if (currentFilter === 'active') {
            filtered = filtered.filter(s => s.is_active !== false && s.is_active !== 0);
        } else if (currentFilter === 'inactive') {
            filtered = filtered.filter(s => s.is_active === false || s.is_active === 0);
        }

        // Category filter
        if (currentCategory !== 'all') {
            filtered = filtered.filter(s => s.category === currentCategory);
        }

        // Search
        if (currentSearch) {
            filtered = filtered.filter(s =>
                (s.name || '').toLowerCase().includes(currentSearch) ||
                (s.agent_name || '').toLowerCase().includes(currentSearch) ||
                (s.category || '').toLowerCase().includes(currentSearch) ||
                (s.slug || '').toLowerCase().includes(currentSearch) ||
                (s.description || '').toLowerCase().includes(currentSearch)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (currentSort) {
                case 'name-asc': return (a.name || '').localeCompare(b.name || '');
                case 'name-desc': return (b.name || '').localeCompare(a.name || '');
                case 'trust-desc': return getTrust(b) - getTrust(a);
                case 'trust-asc': return getTrust(a) - getTrust(b);
                case 'jobs-desc': return (b.success_count || 0) - (a.success_count || 0);
                case 'created-desc': return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'created-asc': return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                default: return 0;
            }
        });

        if (filtered.length === 0) {
            container.innerHTML = '<p class="loading-msg" style="color:var(--text-dim)">No skills match your filters.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:36px;"></th>
                            <th>Skill</th>
                            <th>Agent</th>
                            <th>Category</th>
                            <th>Tiers</th>
                            <th>Trust</th>
                            <th>Jobs</th>
                            <th>Rating</th>
                            <th>Status</th>
                            <th>Last Scan</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(s => renderRow(s)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Bind action buttons via event delegation
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', handleAction);
        });
    }

    function renderRow(s) {
        const trust = getTrust(s);
        const trustDisplay = trust === -1 ? '--' : trust;
        const trustColor = trust === -1 ? 'var(--text-muted)' :
            trust >= 85 ? 'var(--green)' :
            trust >= 60 ? 'var(--orange)' : 'var(--red)';

        const isActive = s.is_active !== false && s.is_active !== 0;
        const rating = s.rating_count > 0 ? (s.rating_sum / s.rating_count).toFixed(1) : '--';

        // Tier badges with SVG icons (matching marketplace)
        const tiers = (s.available_tiers || []).map(t => {
            if (t === 'execution') return `<span class="badge badge-exec" title="Remote Execution">${ICONS.tierExec}</span>`;
            if (t === 'skill_file') return `<span class="badge badge-file" title="Skill File">${ICONS.tierFile}</span>`;
            if (t === 'full_package') return `<span class="badge badge-pkg" title="Full Package">${ICONS.tierPkg}</span>`;
            return '';
        }).join(' ');

        // Inline trust ring SVG
        const trustRing = trust === -1 ? '' : buildTrustRing(trust, 16, 2.5);

        // Scan info
        const scanDate = s.scan?.scanned_at ? AdminCore.formatDate(s.scan.scanned_at) : 'Never';
        const scanResult = s.scan?.result || '--';
        const scanColor = scanResult === 'clean' ? 'var(--green)' :
                          scanResult === 'warning' ? 'var(--orange)' :
                          scanResult === 'danger' ? 'var(--red)' : 'var(--text-muted)';

        return `<tr style="${!isActive ? 'opacity:0.5;' : ''}">
            <td>${s.icon || ''}</td>
            <td>
                <strong>${AdminCore.esc(s.name)}</strong>
                <br><span class="mono" style="font-size:0.65rem;color:var(--text-muted);">/${AdminCore.esc(s.slug || '')}</span>
            </td>
            <td>${AdminCore.esc(s.agent_name || '--')}</td>
            <td><span class="badge" style="background:var(--accent-dim);color:var(--accent);">${AdminCore.esc(s.category || '--')}</span></td>
            <td>${tiers || '--'}</td>
            <td style="text-align:center;">
                <div style="display:flex;align-items:center;gap:6px;justify-content:center;">
                    ${trustRing}
                    <span style="color:${trustColor};font-family:var(--font-mono);font-weight:700;font-size:0.82rem;">${trustDisplay}</span>
                </div>
            </td>
            <td class="mono" style="text-align:center;">${s.success_count || 0}</td>
            <td style="text-align:center;">${rating !== '--' ? '<span style="color:var(--orange);">*</span> ' + rating : '--'}</td>
            <td>${isActive
                ? '<span class="badge badge-active">Active</span>'
                : '<span class="badge badge-inactive">Inactive</span>'}</td>
            <td style="font-size:0.7rem;color:var(--text-dim);white-space:nowrap;">
                ${scanDate}
                <br><span style="color:${scanColor};">${AdminCore.esc(scanResult)}</span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm" data-action="edit" data-id="${s.id}" title="Edit skill">${ICONS.edit}</button>
                    <button class="btn btn-sm" data-action="scan" data-id="${s.id}" title="Rescan">${ICONS.scan}</button>
                    <button class="btn btn-sm" data-action="view" data-id="${s.id}" data-slug="${AdminCore.esc(s.slug || '')}" title="View on site">${ICONS.link}</button>
                    ${isActive
                        ? `<button class="btn btn-sm btn-danger" data-action="deactivate" data-id="${s.id}" data-name="${AdminCore.esc(s.name)}" title="Deactivate">${ICONS.deactivate}</button>`
                        : `<button class="btn btn-sm" data-action="reactivate" data-id="${s.id}" data-name="${AdminCore.esc(s.name)}" title="Reactivate" style="color:var(--green);">${ICONS.reactivate}</button>`
                    }
                </div>
            </td>
        </tr>`;
    }

    // ==================== TRUST RING SVG ====================

    function buildTrustRing(score, r, strokeWidth) {
        const size = (r + strokeWidth) * 2;
        const circumference = 2 * Math.PI * r;
        const minGapPx = circumference * 0.03; // 3% min gap for non-100 scores
        let fillLength;

        if (score === 100) {
            fillLength = circumference;
        } else {
            const rawFill = (score / 100) * circumference;
            const maxFill = circumference - minGapPx;
            fillLength = Math.min(rawFill, maxFill);
        }

        const gapLength = circumference - fillLength;
        const color = score >= 85 ? 'var(--green)' :
                      score >= 60 ? 'var(--orange)' : 'var(--red)';

        return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex-shrink:0;">
            <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none"
                stroke="rgba(255,255,255,0.06)" stroke-width="${strokeWidth}"/>
            <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none"
                stroke="${color}" stroke-width="${strokeWidth}"
                stroke-dasharray="${fillLength} ${gapLength}"
                stroke-dashoffset="${circumference * 0.25}"
                stroke-linecap="round"
                style="filter:drop-shadow(0 0 3px ${color});"
                transform="rotate(-90 ${size/2} ${size/2})"/>
        </svg>`;
    }

    // ==================== ACTIONS ====================

    function handleAction(e) {
        const btn = e.currentTarget;
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        switch (action) {
            case 'edit': openEditModal(id); break;
            case 'scan': triggerScan(id, btn); break;
            case 'view': viewOnSite(btn.dataset.slug); break;
            case 'deactivate': confirmDeactivate(id, btn.dataset.name); break;
            case 'reactivate': confirmReactivate(id, btn.dataset.name); break;
        }
    }

    function viewOnSite(slug) {
        if (slug) {
            window.open(`https://squidbay.io/skill/${slug}`, '_blank');
        }
    }

    // ==================== SCAN ====================

    async function triggerScan(id, btn) {
        const origHTML = btn.innerHTML;
        btn.innerHTML = ICONS.spinner;
        btn.disabled = true;
        btn.style.opacity = '0.5';

        try {
            const result = await AdminCore.apiPost(`/admin/scan/${id}`);
            AdminCore.logAudit('scan_skill', `Rescanned skill ${id}`);

            // Update the skill in our local array
            const skill = allSkills.find(s => s.id === id);
            if (skill && result.scan) {
                skill.scan = result.scan;
            }

            renderTable();
        } catch (err) {
            btn.innerHTML = ICONS.error;
            btn.style.color = 'var(--red)';
            setTimeout(() => {
                btn.innerHTML = origHTML;
                btn.disabled = false;
                btn.style.opacity = '';
                btn.style.color = '';
            }, 2000);
        }
    }

    // ==================== DEACTIVATE / REACTIVATE ====================

    function confirmDeactivate(id, name) {
        const skill = allSkills.find(s => s.id === id);
        if (!skill) return;

        showModal(`
            <h3>Deactivate Skill</h3>
            <p style="margin-bottom:16px;color:var(--text-dim);font-size:0.85rem;">
                This will hide <strong style="color:var(--text);">${AdminCore.esc(name)}</strong> from the marketplace.
                It will NOT be deleted — just hidden. You can reactivate it later.
            </p>
            <div class="form-group">
                <label class="form-label">Reason (required for audit log)</label>
                <input type="text" class="form-input" id="deactivateReason" placeholder="e.g., Agent request, policy violation, maintenance...">
            </div>
            <div class="modal-actions">
                <button class="btn" id="cancelDeactivateBtn">Cancel</button>
                <button class="btn btn-danger" id="confirmDeactivateBtn">Deactivate</button>
            </div>
        `);

        document.getElementById('cancelDeactivateBtn').addEventListener('click', () => {
            document.querySelector('.modal-overlay')?.remove();
        });

        document.getElementById('confirmDeactivateBtn').addEventListener('click', async () => {
            const reason = document.getElementById('deactivateReason').value.trim();
            if (!reason) {
                document.getElementById('deactivateReason').style.borderColor = 'var(--red)';
                document.getElementById('deactivateReason').focus();
                return;
            }

            const btn = document.getElementById('confirmDeactivateBtn');
            btn.textContent = 'Deactivating...';
            btn.disabled = true;

            try {
                await AdminCore.apiDelete(`/register/${id}`);
                AdminCore.logAudit('deactivate_skill', `Deactivated "${name}" (${id}). Reason: ${reason}`);

                // Update local state
                const skill = allSkills.find(s => s.id === id);
                if (skill) skill.is_active = 0;

                document.querySelector('.modal-overlay')?.remove();
                renderTable();
            } catch (err) {
                btn.textContent = 'Error — try again';
                btn.disabled = false;
            }
        });
    }

    function confirmReactivate(id, name) {
        showModal(`
            <h3>Reactivate Skill</h3>
            <p style="margin-bottom:16px;color:var(--text-dim);font-size:0.85rem;">
                This will make <strong style="color:var(--text);">${AdminCore.esc(name)}</strong> visible on the marketplace again.
            </p>
            <div class="modal-actions">
                <button class="btn" id="cancelReactivateBtn">Cancel</button>
                <button class="btn btn-primary" id="confirmReactivateBtn">Reactivate</button>
            </div>
        `);

        document.getElementById('cancelReactivateBtn').addEventListener('click', () => {
            document.querySelector('.modal-overlay')?.remove();
        });

        document.getElementById('confirmReactivateBtn').addEventListener('click', async () => {
            const btn = document.getElementById('confirmReactivateBtn');
            btn.textContent = 'Reactivating...';
            btn.disabled = true;

            try {
                await AdminCore.apiPut(`/register/${id}`, { is_active: true });
                AdminCore.logAudit('reactivate_skill', `Reactivated "${name}" (${id})`);

                const skill = allSkills.find(s => s.id === id);
                if (skill) skill.is_active = 1;

                document.querySelector('.modal-overlay')?.remove();
                renderTable();
            } catch (err) {
                btn.textContent = 'Error — try again';
                btn.disabled = false;
            }
        });
    }

    // ==================== EDIT MODAL ====================

    async function openEditModal(id) {
        const skill = allSkills.find(s => s.id === id);
        if (!skill) return;

        // Fetch full skill detail (includes details field)
        let fullSkill = skill;
        try {
            const data = await AdminCore.publicGet(`/skills/${id}`);
            if (data.skill) fullSkill = { ...skill, ...data.skill };
        } catch (e) {
            // Use what we have
        }

        showModal(`
            <h3>Edit Skill — ${AdminCore.esc(fullSkill.name)}</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" id="editName" value="${AdminCore.esc(fullSkill.name || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Slug</label>
                    <input type="text" class="form-input" id="editSlug" value="${AdminCore.esc(fullSkill.slug || '')}" style="font-family:var(--font-mono);font-size:0.8rem;">
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <input type="text" class="form-input" id="editCategory" value="${AdminCore.esc(fullSkill.category || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Icon (emoji)</label>
                    <input type="text" class="form-input" id="editIcon" value="${fullSkill.icon || ''}" style="font-size:1.2rem;text-align:center;" maxlength="4">
                </div>
                <div class="form-group">
                    <label class="form-label">Version</label>
                    <input type="text" class="form-input" id="editVersion" value="${AdminCore.esc(fullSkill.version || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Delivery Mode</label>
                    <select class="form-input" id="editDeliveryMode">
                        <option value="github_managed"${fullSkill.delivery_mode === 'github_managed' ? ' selected' : ''}>GitHub Managed</option>
                        <option value="api"${fullSkill.delivery_mode === 'api' ? ' selected' : ''}>API</option>
                        <option value="manual"${fullSkill.delivery_mode === 'manual' ? ' selected' : ''}>Manual</option>
                    </select>
                </div>
                <div class="form-group form-full">
                    <label class="form-label">Description</label>
                    <textarea class="cmd-textarea" id="editDescription" rows="3" style="min-height:60px;">${AdminCore.esc(fullSkill.description || '')}</textarea>
                </div>
                <div class="form-group form-full">
                    <label class="form-label">Details (Markdown)</label>
                    <textarea class="cmd-textarea" id="editDetails" rows="6" style="min-height:120px;font-family:var(--font-mono);font-size:0.78rem;">${AdminCore.esc(fullSkill.details || '')}</textarea>
                </div>
            </div>

            <h4 style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-dim);margin:16px 0 10px;">Pricing (sats)</h4>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Execution (per-use)</label>
                    <input type="number" class="form-input" id="editPriceExec" value="${fullSkill.price_execution || ''}" placeholder="Empty = disabled" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Skill File (rent/learn)</label>
                    <input type="number" class="form-input" id="editPriceFile" value="${fullSkill.price_skill_file || ''}" placeholder="Empty = disabled" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Full Package (own)</label>
                    <input type="number" class="form-input" id="editPricePkg" value="${fullSkill.price_full_package || ''}" placeholder="Empty = disabled" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Transfer Endpoint</label>
                    <input type="text" class="form-input" id="editEndpoint" value="${AdminCore.esc(fullSkill.transfer_endpoint || '')}" placeholder="https://..." style="font-family:var(--font-mono);font-size:0.78rem;">
                </div>
            </div>

            <div style="margin-top:8px;font-size:0.7rem;color:var(--text-muted);">
                Agent: ${AdminCore.esc(fullSkill.agent_name || '--')}
                &middot; ID: <span class="mono" style="font-size:0.65rem;">${fullSkill.id}</span>
                &middot; Created: ${AdminCore.formatDate(fullSkill.created_at)}
            </div>

            <div class="modal-actions">
                <button class="btn" id="cancelEditBtn">Cancel</button>
                <button class="btn btn-primary" id="saveEditBtn">Save Changes</button>
            </div>
            <div id="editResultMsg" style="margin-top:8px;font-size:0.8rem;"></div>
        `);

        // Bind buttons
        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            document.querySelector('.modal-overlay')?.remove();
        });
        document.getElementById('saveEditBtn').addEventListener('click', () => saveEdit(id));
    }

    async function saveEdit(id) {
        const btn = document.getElementById('saveEditBtn');
        const resultEl = document.getElementById('editResultMsg');
        btn.textContent = 'Saving...';
        btn.disabled = true;
        resultEl.textContent = '';

        // Build update payload
        const payload = {};
        const fields = {
            name: 'editName',
            slug: 'editSlug',
            category: 'editCategory',
            icon: 'editIcon',
            version: 'editVersion',
            delivery_mode: 'editDeliveryMode',
            description: 'editDescription',
            details: 'editDetails',
            transfer_endpoint: 'editEndpoint'
        };

        for (const [key, elId] of Object.entries(fields)) {
            const el = document.getElementById(elId);
            if (el) {
                const val = el.value.trim();
                payload[key] = val || null;
            }
        }

        // Pricing — parse as numbers, empty = null
        const priceExec = document.getElementById('editPriceExec').value.trim();
        const priceFile = document.getElementById('editPriceFile').value.trim();
        const pricePkg = document.getElementById('editPricePkg').value.trim();

        payload.price_execution = priceExec ? parseInt(priceExec, 10) : null;
        payload.price_skill_file = priceFile ? parseInt(priceFile, 10) : null;
        payload.price_full_package = pricePkg ? parseInt(pricePkg, 10) : null;

        try {
            const result = await AdminCore.apiPut(`/register/${id}`, payload);
            AdminCore.logAudit('edit_skill', `Edited skill ${payload.name || id}`);

            // Update local data
            const idx = allSkills.findIndex(s => s.id === id);
            if (idx !== -1 && result.skill) {
                allSkills[idx] = { ...allSkills[idx], ...result.skill };
            } else if (idx !== -1) {
                Object.assign(allSkills[idx], payload);
            }

            resultEl.style.color = 'var(--green)';
            resultEl.textContent = 'Saved successfully';

            setTimeout(() => {
                document.querySelector('.modal-overlay')?.remove();
                renderTable();
            }, 800);

        } catch (err) {
            resultEl.style.color = 'var(--red)';
            resultEl.textContent = `Error: ${err.message || 'Save failed'}`;
            btn.textContent = 'Save Changes';
            btn.disabled = false;
        }
    }

    // ==================== MODAL HELPER ====================

    function showModal(html) {
        // Remove existing modal
        document.querySelector('.modal-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `<div class="modal-box">${html}</div>`;

        // Close on overlay click (not modal box)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        document.body.appendChild(overlay);
    }

    // ==================== UTILITIES ====================

    function getTrust(s) {
        if (s.scan && typeof s.scan.risk_score === 'number') {
            return 100 - s.scan.risk_score;
        }
        return -1; // unscanned
    }

    // ==================== PUBLIC API ====================
    return { load };

})();
