/**
 * SquidBay - Security Report Page JS
 * js/security.js
 * 
 * Server-side routing (Railway):
 *   /skill/agent/slug/security → Express serves security.html → this JS reads window.location.pathname
 * 
 * Fetches: GET /skills/by-agent/:agent/:slug → GET /skills/:id/security
 */

const API_BASE = window.API_BASE || 'https://squidbay-api-production.up.railway.app';

/* ============================================
   INIT — Parse URL and load data
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // URL: /skill/{agent}/{slug}/security
    const pathMatch = window.location.pathname.match(/^\/skill\/([^\/]+)\/([^\/]+)\/security\/?$/);
    if (pathMatch) {
        const agentName = decodeURIComponent(pathMatch[1]);
        const slug = decodeURIComponent(pathMatch[2]);
        loadSecurityReport(agentName, slug);
        return;
    }

    // Fallback: ?id=uuid
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
        loadSecurityReportById(id);
        return;
    }

    showError('Missing Skill', 'No skill specified. <a href="/marketplace">Browse the marketplace</a>.');
});

/* ============================================
   DATA LOADING
   ============================================ */

async function loadSecurityReport(agentName, slug) {
    try {
        // First get the skill ID from the slug
        const skillRes = await fetch(`${API_BASE}/skills/by-agent/${encodeURIComponent(agentName)}/${encodeURIComponent(slug)}`);
        if (!skillRes.ok) throw new Error('Skill not found');
        const skillData = await skillRes.json();
        const skill = skillData.skill || skillData;
        if (!skill || !skill.id) throw new Error('Invalid skill data');

        // Now fetch the full security report
        const secRes = await fetch(`${API_BASE}/skills/${skill.id}/security`);
        if (!secRes.ok) throw new Error('Security report not available');
        const report = await secRes.json();

        renderSecurityReport(report, agentName, slug);
        document.getElementById('page-loader').classList.add('hidden');
        document.getElementById('security-content').classList.remove('hidden');
    } catch (err) {
        console.error('Error loading security report:', err);
        showError('Report Not Available', 'Security report could not be loaded. <a href="/marketplace">Browse the marketplace</a>.');
    }
}

async function loadSecurityReportById(id) {
    try {
        const secRes = await fetch(`${API_BASE}/skills/${id}/security`);
        if (!secRes.ok) throw new Error('Security report not available');
        const report = await secRes.json();

        const agentName = report.skill?.agent_name || '';
        const slug = report.skill?.slug || '';
        renderSecurityReport(report, agentName, slug);
        document.getElementById('page-loader').classList.add('hidden');
        document.getElementById('security-content').classList.remove('hidden');
    } catch (err) {
        console.error('Error loading security report by ID:', err);
        showError('Report Not Available', 'Security report could not be loaded. <a href="/marketplace">Browse the marketplace</a>.');
    }
}

/* ============================================
   RENDER — Main report page
   ============================================ */

function renderSecurityReport(report, agentName, slug) {
    const skill = report.skill;
    const scan = report.scan;
    const history = report.history || [];
    const content = document.getElementById('security-content');

    // Page title & meta
    document.title = `Security Report — ${esc(skill.name)} | SquidBay`;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && agentName && slug) {
        canonical.href = `https://squidbay.io/skill/${encodeURIComponent(agentName)}/${encodeURIComponent(slug)}/security`;
    }
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl && agentName && slug) {
        ogUrl.content = `https://squidbay.io/skill/${encodeURIComponent(agentName)}/${encodeURIComponent(slug)}/security`;
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = `Security Report — ${skill.name} | SquidBay`;

    // No scan available
    if (!scan) {
        content.innerHTML = `
            <div class="security-page">
                ${renderBackLink(agentName, slug)}
                ${renderHeader(skill, null)}
                <div class="verdict-banner verdict-clean" style="justify-content:center;text-align:center;">
                    <p style="color:var(--text-muted);margin:0;">No security scan data available for this skill yet.</p>
                </div>
                ${renderFooter(agentName, slug)}
            </div>`;
        return;
    }

    content.innerHTML = `
        <div class="security-page">
            ${renderBackLink(agentName, slug)}
            ${renderHeader(skill, scan)}
            ${renderVerdictBanner(scan)}
            ${renderSummaryCards(scan)}
            ${renderDetectionCategories(scan)}
            ${renderPermissionsInventory(scan.permissions || [])}
            ${renderExternalLinks(scan.external_links || {})}
            ${renderScanHistory(history)}
            ${renderFooter(agentName, slug)}
        </div>`;

    // Wire up expand/collapse
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('expanded');
            const body = header.nextElementSibling;
            if (body) body.classList.toggle('open');
        });
    });
}

/* ============================================
   RENDER — Back Link
   ============================================ */

function renderBackLink(agentName, slug) {
    const href = agentName && slug
        ? `/skill/${encodeURIComponent(agentName)}/${encodeURIComponent(slug)}`
        : '/marketplace';
    return `<a href="${href}" class="security-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back to skill
    </a>`;
}

/* ============================================
   RENDER — Header
   ============================================ */

function renderHeader(skill, scan) {
    const shieldColor = !scan ? 'var(--gray-light)' : scan.result === 'clean' ? 'var(--green)' : scan.result === 'warning' ? 'var(--yellow)' : 'var(--red)';
    const s = scan?.summary || {};
    const filesScanned = s.files_scanned || 0;
    const totalKB = s.total_bytes ? (s.total_bytes / 1024).toFixed(0) : '0';
    const scanDate = scan?.scanned_at ? formatDate(scan.scanned_at) : '';
    const scannerVersion = scan?.scanner_version || '';
    const patternsChecked = scan?.patterns_checked || 0;
    const categoriesChecked = scan?.categories_checked || 0;

    return `
        <div class="security-header">
            <div class="security-shield">
                <svg viewBox="0 0 24 24" fill="none" stroke="${shieldColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    ${scan?.result === 'clean' ? `<polyline points="9 12 11.5 14.5 16 10" stroke="${shieldColor}"/>` : ''}
                </svg>
            </div>
            <div class="security-header-info">
                <h1>Security Report — <a href="${skillUrl(skill)}" class="skill-name-link">${esc(skill.name)}</a></h1>
                <div class="security-header-meta">
                    ${skill.version ? `<span class="version-badge">v${esc(skill.version)}</span>` : ''}
                    ${scannerVersion ? `<span class="scanner-badge">Scanner v${esc(scannerVersion)}</span>` : ''}
                    ${scanDate ? `<span>Scanned ${scanDate}</span>` : ''}
                    ${filesScanned ? `<span>${filesScanned} files (${totalKB}KB) · ${categoriesChecked} categories · ${patternsChecked} patterns</span>` : ''}
                </div>
            </div>
        </div>`;
}

/* ============================================
   RENDER — Verdict Banner + Risk Ring
   ============================================ */

function renderVerdictBanner(scan) {
    const score = scan.risk_score || 0;
    const result = scan.result || 'clean';
    const verdictClass = `verdict-${result}`;

    // Ring math — SVG circle circumference
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const fillPct = Math.min(score / 100, 1);
    const dashOffset = circumference * (1 - fillPct);

    // Ring color by score
    let ringColor;
    if (score === 0) ringColor = 'var(--green)';
    else if (score <= 15) ringColor = 'var(--green)';
    else if (score <= 40) ringColor = 'var(--yellow)';
    else if (score <= 70) ringColor = '#ff8c00';
    else ringColor = 'var(--red)';

    // Score label text
    let scoreLabel;
    if (score === 0) scoreLabel = 'No Threats Detected';
    else if (score <= 15) scoreLabel = 'Low Risk';
    else if (score <= 40) scoreLabel = 'Moderate Risk';
    else if (score <= 70) scoreLabel = 'High Risk';
    else scoreLabel = 'Critical Risk';

    // Verdict text
    const verdictLabels = {
        clean:    { title: 'No Threats Detected', sub: 'All security checks passed. This skill is clean.' },
        warning:  { title: 'Warnings Found',      sub: 'Minor flags detected. Review findings below.' },
        rejected: { title: 'Threats Detected',     sub: 'Critical security issues found. This skill has been deactivated.' }
    };
    const v = verdictLabels[result] || verdictLabels.clean;

    // For score 0, show a full green ring instead of empty
    const effectiveDashOffset = score === 0 ? 0 : dashOffset;

    return `
        <div class="verdict-banner ${verdictClass}">
            <div class="risk-ring-container">
                <svg class="risk-ring-svg" viewBox="0 0 100 100">
                    <circle class="risk-ring-bg" cx="50" cy="50" r="${radius}"/>
                    <circle class="risk-ring-fill" cx="50" cy="50" r="${radius}"
                        stroke="${ringColor}"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${effectiveDashOffset}"/>
                </svg>
                <div class="risk-ring-label">
                    <div class="risk-ring-score">${score}</div>
                    <div class="risk-ring-max">/ 100</div>
                </div>
            </div>
            <div class="verdict-info">
                <p class="verdict-label">${v.title}</p>
                <p class="verdict-sublabel">Threat Score: ${score}/100 — ${scoreLabel}</p>
                <p class="verdict-sublabel">${v.sub}</p>
            </div>
        </div>`;
}

/* ============================================
   RENDER — Summary Cards
   ============================================ */

function renderSummaryCards(scan) {
    const s = scan.summary || {};
    const files = s.files_scanned || 0;
    const totalKB = s.total_bytes ? (s.total_bytes / 1024).toFixed(0) : '0';
    const patterns = scan.patterns_checked || 0;
    const threats = (scan.findings || []).filter(f => f.severity !== 'info').length;

    return `
        <div class="summary-cards">
            <div class="summary-card">
                <div class="summary-card-value">${files}</div>
                <div class="summary-card-label">Files Scanned</div>
            </div>
            <div class="summary-card">
                <div class="summary-card-value">${totalKB}KB</div>
                <div class="summary-card-label">Source Analyzed</div>
            </div>
            <div class="summary-card">
                <div class="summary-card-value">${patterns}</div>
                <div class="summary-card-label">Detection Patterns</div>
            </div>
            <div class="summary-card">
                <div class="summary-card-value">${threats}</div>
                <div class="summary-card-label">Threats Found</div>
            </div>
        </div>`;
}

/* ============================================
   RENDER — Detection Categories (13 rows)
   ============================================ */

const CATEGORY_META = [
    { key: 'trackers',              label: 'Trackers & Ad Networks',      severity: 'reject',  summaryKey: 'trackers' },
    { key: 'injection',             label: 'Prompt Injection',            severity: 'reject',  summaryKey: 'injection_patterns' },
    { key: 'suspicious_import',     label: 'Suspicious Imports',          severity: 'warning', summaryKey: 'suspicious_imports' },
    { key: 'obfuscation',          label: 'Code Obfuscation',            severity: 'reject',  summaryKey: 'obfuscation' },
    { key: 'data_exfiltration',    label: 'Data Exfiltration',           severity: 'reject',  summaryKey: 'data_exfiltration' },
    { key: 'credential_harvesting', label: 'Credential Harvesting',      severity: 'reject',  summaryKey: 'credential_harvesting' },
    { key: 'hidden_element',       label: 'Hidden Elements',             severity: 'warning', summaryKey: 'hidden_elements' },
    { key: 'env_sniffing',         label: 'Environment Variable Access', severity: 'reject',  summaryKey: 'env_sniffing' },
    { key: 'supply_chain',         label: 'Supply Chain Attacks',        severity: 'reject',  summaryKey: 'supply_chain' },
    { key: 'file_system_attack',   label: 'File System Attacks',         severity: 'reject',  summaryKey: 'file_system' },
    { key: 'service_worker',       label: 'Service Worker Abuse',        severity: 'warning', summaryKey: 'service_worker' },
    { key: 'crypto_mining',        label: 'Crypto Mining',               severity: 'reject',  summaryKey: 'crypto_mining' },
    { key: 'external_url',         label: 'External URLs',               severity: 'info',    summaryKey: 'external_urls' }
];

function renderDetectionCategories(scan) {
    const summary = scan.summary || {};
    const findings = scan.findings || [];

    // Group findings by type
    const findingsByType = {};
    for (const f of findings) {
        const t = f.type || 'unknown';
        if (!findingsByType[t]) findingsByType[t] = [];
        findingsByType[t].push(f);
    }

    let rows = '';
    for (const cat of CATEGORY_META) {
        const count = summary[cat.summaryKey] || 0;
        const catFindings = findingsByType[cat.key] || [];
        const hasFindings = count > 0 || catFindings.length > 0;
        const displayCount = count || catFindings.length;

        // Status icon and class
        let statusClass, statusIcon;
        if (!hasFindings) {
            statusClass = 'status-pass';
            statusIcon = '✓';
        } else if (cat.severity === 'info') {
            statusClass = 'status-info';
            statusIcon = 'ℹ';
        } else if (cat.severity === 'warning') {
            statusClass = 'status-warn';
            statusIcon = '!';
        } else {
            statusClass = 'status-fail';
            statusIcon = '✗';
        }

        const sevClass = hasFindings ? `sev-${cat.severity}` : 'sev-clean';

        // Individual findings (shown inline under the category row)
        let findingsHtml = '';
        if (catFindings.length > 0) {
            const maxShow = 20;
            findingsHtml = `<div class="category-findings">` +
                catFindings.slice(0, maxShow).map(f =>
                    `<div class="finding-item">` +
                    (f.file ? `<span class="finding-file">${esc(f.file)}</span>` : '') +
                    `<span class="finding-match" title="${esc(f.match || '')}">${esc((f.match || '').substring(0, 80))}</span>` +
                    `</div>`
                ).join('') +
                (catFindings.length > maxShow ? `<div class="finding-item" style="color:var(--gray-light);">+ ${catFindings.length - maxShow} more</div>` : '') +
                `</div>`;
        }

        rows += `
            <div class="category-row">
                <div class="category-status ${statusClass}">${statusIcon}</div>
                <span class="category-name">${cat.label}</span>
                <span class="category-finding-count ${sevClass}">${hasFindings ? displayCount + ' found' : 'Clear'}</span>
            </div>
            ${findingsHtml}`;
    }

    return `
        <div class="report-section">
            <div class="section-header expanded">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span class="section-title">Detection Categories</span>
                <span class="section-count">${CATEGORY_META.length} checked</span>
                <svg class="section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="section-body open">
                ${rows}
            </div>
        </div>`;
}

/* ============================================
   RENDER — Permissions Inventory
   ============================================ */

function renderPermissionsInventory(permissions) {
    if (!permissions || permissions.length === 0) return '';

    const detected = permissions.filter(p => p.detected);
    const notDetected = permissions.filter(p => !p.detected);
    const sorted = [...detected, ...notDetected];

    let rows = '';
    for (const p of sorted) {
        const isDetected = p.detected;
        const riskClass = p.risk === 'elevated' ? 'risk-elevated' : 'risk-neutral';

        rows += `
            <div class="perm-row">
                <span class="perm-check ${isDetected ? 'detected' : 'not-detected'}">${isDetected ? '✓' : '—'}</span>
                <span class="perm-label ${isDetected ? 'detected' : 'not-detected'}">${esc(p.label)}</span>
                <span class="perm-risk ${riskClass}">${esc(p.risk)}</span>
            </div>
            ${isDetected && p.files && p.files.length > 0 ? `<div class="perm-files">${p.files.map(f => esc(f)).join(', ')}</div>` : ''}`;
    }

    return `
        <div class="report-section">
            <div class="section-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <span class="section-title">Permissions Inventory</span>
                <span class="section-count">${detected.length} of ${permissions.length} detected</span>
                <svg class="section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="section-body">
                ${rows}
            </div>
        </div>`;
}

/* ============================================
   RENDER — External Links
   ============================================ */

function renderExternalLinks(externalLinks) {
    const domains = Object.keys(externalLinks);
    if (domains.length === 0) return '';

    const totalLinks = domains.reduce((sum, d) => sum + externalLinks[d].length, 0);

    let groups = '';
    for (const domain of domains) {
        const links = externalLinks[domain];
        const maxShow = 10;
        groups += `
            <div class="ext-domain-group">
                <div class="ext-domain-header">
                    ${esc(domain)} <span class="ext-domain-count">(${links.length})</span>
                </div>
                ${links.slice(0, maxShow).map(link =>
                    `<div class="ext-link-item">` +
                    (link.file ? `<span class="finding-file">${esc(link.file)}</span>` : '') +
                    `<span class="ext-link-url" title="${esc(link.url)}">${esc(link.url)}</span>` +
                    `</div>`
                ).join('')}
                ${links.length > maxShow ? `<div class="ext-link-item" style="color:var(--gray-light);">+ ${links.length - maxShow} more</div>` : ''}
            </div>`;
    }

    return `
        <div class="report-section">
            <div class="section-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                <span class="section-title">External Connections</span>
                <span class="section-count">${totalLinks} URLs across ${domains.length} domains</span>
                <svg class="section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="section-body">
                ${groups}
            </div>
        </div>`;
}

/* ============================================
   RENDER — Scan History
   ============================================ */

function renderScanHistory(history) {
    if (!history || history.length === 0) return '';

    const maxShow = 20;
    const rows = history.slice(0, maxShow).map(h => {
        const resultClass = `result-${h.result}`;
        const label = h.result === 'clean' ? 'Clean' : h.result === 'warning' ? 'Warning' : 'Rejected';
        return `
            <div class="history-row">
                <div class="history-dot ${resultClass}"></div>
                <span class="history-date">${formatDate(h.scanned_at)}</span>
                <span class="history-result ${resultClass}">${label}</span>
                <span class="history-meta">Score: ${h.risk_score || 0}/100 · Scanner v${esc(h.scanner_version || '?')}</span>
            </div>`;
    }).join('');

    return `
        <div class="report-section">
            <div class="section-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span class="section-title">Scan History</span>
                <span class="section-count">${history.length} scans</span>
                <svg class="section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="section-body">
                ${rows}
            </div>
        </div>`;
}

/* ============================================
   RENDER — Footer
   ============================================ */

function renderFooter(agentName, slug) {
    const skillLink = agentName && slug
        ? `/skill/${encodeURIComponent(agentName)}/${encodeURIComponent(slug)}`
        : '/marketplace';
    return `
        <div class="security-footer">
            SquidBay scans every source file in this skill's repository.<br>
            This report was generated by automated static analysis — not AI summary, not antivirus.<br>
            Report concerns: <a href="mailto:contact&#64;squidbay.io">contact&#64;squidbay.io</a><br>
            <a href="${skillLink}">← Back to skill page</a>
        </div>`;
}

/* ============================================
   UTILITIES
   ============================================ */

function skillUrl(skill) {
    if (skill.slug && skill.agent_name) {
        return `/skill/${encodeURIComponent(skill.agent_name)}/${encodeURIComponent(skill.slug)}`;
    }
    return `/skill.html?id=${skill.id}`;
}

function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showError(title, message) {
    document.getElementById('page-loader').classList.add('hidden');
    document.getElementById('security-content').classList.add('hidden');
    const e = document.getElementById('error-display');
    e.innerHTML = `<h2>${title}</h2><p>${message}</p>`;
    e.classList.remove('hidden');
}
