// ==================== ADMIN CHAT ====================
// Customer experience simulator — SquidBot sees what buyers see

const AdminChat = (() => {

    let chatHistory = [];

    // ==================== SVG ICONS ====================

    const ICONS = {
        send: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
        trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
    };

    // ==================== LOAD ====================

    function load() {
        const body = document.getElementById('chatBody');

        body.innerHTML = `
            <div class="chat-container">
                <div class="chat-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <span>🦑 SquidBot — Customer View</span>
                    <button class="btn btn-sm" id="chatClearBtn" title="Clear chat">${ICONS.trash} Clear</button>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="chat-msg">
                        <div class="avatar">🦑</div>
                        <div class="content">
                            Hey! I'm SquidBot. I can help you find skills, learn about agents, and navigate the marketplace. What are you looking for?
                        </div>
                    </div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Ask about skills, agents, pricing..." autocomplete="off">
                    <button class="btn btn-primary" id="chatSendBtn">${ICONS.send}</button>
                </div>
            </div>
            <div style="margin-top:8px;text-align:center;">
                <span style="font-size:0.68rem;color:var(--text-muted);">This simulates the buyer experience. SquidBot only sees marketplace data — no admin info.</span>
            </div>
        `;

        // Bind events
        document.getElementById('chatSendBtn').addEventListener('click', sendMessage);
        document.getElementById('chatInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        document.getElementById('chatClearBtn').addEventListener('click', () => {
            chatHistory = [];
            const messages = document.getElementById('chatMessages');
            messages.innerHTML = `
                <div class="chat-msg">
                    <div class="avatar">🦑</div>
                    <div class="content">Chat cleared. How can I help you?</div>
                </div>
            `;
        });

        document.getElementById('chatInput').focus();
    }

    // ==================== SEND MESSAGE ====================

    async function sendMessage() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.disabled = true;

        const messages = document.getElementById('chatMessages');

        // Add user message
        messages.innerHTML += `
            <div class="chat-msg user">
                <div class="avatar" style="background:var(--accent-dim);color:var(--accent);">You</div>
                <div class="content">${AdminCore.esc(text)}</div>
            </div>
        `;

        // Add typing indicator
        const typingId = 'typing-' + Date.now();
        messages.innerHTML += `
            <div class="chat-msg" id="${typingId}">
                <div class="avatar">🦑</div>
                <div class="content" style="color:var(--text-dim);font-style:italic;">Thinking...</div>
            </div>
        `;
        messages.scrollTop = messages.scrollHeight;

        // Track history for context
        chatHistory.push({ role: 'user', content: text });

        try {
            const response = await AdminCore.apiPost('/admin/chat', {
                message: text,
                history: chatHistory.slice(-10) // Last 10 messages for context
            });

            const reply = response.reply || response.message || response.text || 'No response received.';
            chatHistory.push({ role: 'assistant', content: reply });

            // Replace typing indicator
            const typingEl = document.getElementById(typingId);
            if (typingEl) {
                typingEl.querySelector('.content').textContent = reply;
                typingEl.querySelector('.content').style.color = '';
                typingEl.querySelector('.content').style.fontStyle = '';
            }

        } catch (err) {
            const typingEl = document.getElementById(typingId);
            if (typingEl) {
                typingEl.querySelector('.content').textContent = `Error: ${err.message || 'Could not reach SquidBot'}`;
                typingEl.querySelector('.content').style.color = 'var(--red)';
                typingEl.querySelector('.content').style.fontStyle = '';
            }
        }

        input.disabled = false;
        input.focus();
        messages.scrollTop = messages.scrollHeight;
    }

    // ==================== PUBLIC API ====================
    return { load };

})();
