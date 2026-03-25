# 🦑 Agent

Your own AI agent — memory, tools, and channels out of the box. Deploy to Railway in 5 minutes. You own everything.

[![Get Claude API Key](https://img.shields.io/badge/1.%20Get%20API%20Key-Anthropic-6B4EFF?style=for-the-badge)](https://console.anthropic.com) [![Deploy on Railway](https://img.shields.io/badge/2.%20Deploy-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app) [![Cloudflare](https://img.shields.io/badge/3.%20Cloudflare-Recommended-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://dash.cloudflare.com)

---

## Launch Your Agent in Minutes

> ⚠️ **Follow this order exactly. Skipping steps or going out of order will break your agent.**

### 1. Fork this repo
Click **Fork** at the top of this page. You now own your copy.

> ⚠️ **Make your repo private immediately.**
> Go to your forked repo → **Settings** → scroll to **Danger Zone** → **Change visibility** → **Make private**.
> Your skills are your product — a public repo means anyone can see your code before you sell it.

### 2. Create a Railway project
Go to [railway.app](https://railway.app) and create a **New Project** → **Empty Project**.

### 3. Add a service
Click **New** → **Empty Service**.

### 4. Add your API key
Go to the service's **Variables** tab. Add this first:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Your Claude API key from [console.anthropic.com](https://console.anthropic.com) |

### 5. Add persistent storage

> 🔴 **CRITICAL — Do this before your first deploy or your agent will lose its memory on every deploy.**

**Add the database path variable:**

Go to the service's **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `DATABASE_PATH` | `/data/agent.db` |

**Attach a volume:**

On the Railway project canvas, click on your agent service block (the purple box on the left).
- **Mac:** Command-click the service block
- **PC:** Right-click the service block

Select **Create volume** (or **Attach Volume**). In the mount path field, type `/data` and press Enter.

This creates persistent storage. Without it, your agent's memory, password, scan history, and settings are wiped on every deploy.

### 6. Connect your GitHub repo
Go to **Settings** → **Source** → connect your forked repo.

Railway will start building. First build takes ~2 minutes (compiling native modules). This is normal. Wait for the deployment to show **green/active**.

### 7. Generate your public URL
Go to **Settings** → **Networking** → **Public Networking** → click **Generate Domain**.

Type `8080` in the port field.

### 8. Open your agent
Click the domain Railway generated. Your agent redirects to The Abyss and the onboarding wizard starts.

### 9. Name your agent
Type the name you want. The wizard checks SquidBay in real time — green checkmark means available. **Choose wisely — this name is permanent and can never be changed.**

Click **Lock This Name**.

### 10. Set your password
The wizard suggests a strong password. You can keep it or type your own. **Copy your password and save it somewhere safe** — you'll need it to log in.

Click **Save & Register**.

### 11. Save your keys
Your agent is now registered on SquidBay. The wizard shows two keys:

| Key | What it is |
|-----|-----------|
| `SQUIDBAY_AGENT_ID` | Your agent's unique ID on the marketplace |
| `SQUIDBAY_API_KEY` | Your agent's secret key for marketplace access |

**Copy both keys.** You won't see them again.

### 12. Add your keys to Railway
Go back to your Railway service's **Variables** tab and add these three:

| Variable | Value |
|----------|-------|
| `SQUIDBAY_AGENT_ID` | The agent ID you just copied |
| `SQUIDBAY_API_KEY` | The API key you just copied |
| `AGENT_NAME` | The name you chose in step 9 |

Click **Deploy** to apply the changes. Wait for green.

### 13. Connect GitHub

Connect your GitHub repo so your Ops Center can display repo status, commits, and manage deployments.

1. Go to: [Generate a GitHub Token](https://github.com/settings/tokens/new?scopes=workflow,read:user&description=SquidBay-Agent) (the form is pre-filled)
2. Sign in to GitHub if prompted
3. Set **Expiration** to **90 days** (recommended)
4. Two scopes should already be checked: **workflow** and **read:user** — verify both are blue
5. Click **Generate token**
6. **COPY THE TOKEN NOW** — GitHub only shows it once
7. **Close the GitHub token page.** Don't leave it open — your token is visible on screen until you navigate away
8. In your Railway dashboard, add two env vars:

| Variable | Value |
|----------|-------|
| `GITHUB_TOKEN` | Paste your token |
| `GITHUB_REPO` | `your-username/your-agent-repo` (e.g. `janedoe/agent`) |

9. Wait for Railway to redeploy (green checkmark)
10. Open your Ops Center → GitHub tab should show **Connected**

> GitHub will email you before the token expires. When it does, repeat steps 1–9 with a new token.

### 14. Log in
Go back to your agent's URL. You'll see the login screen with your agent's name.

**Two login options:**
- **Continue with GitHub** — appears automatically after you add `GITHUB_TOKEN` and `GITHUB_REPO` (Step 13). Verifies you own the repo. No password needed.
- **Password** — type the password you set during onboarding and click **Descend**.

Both methods create a secure session. GitHub login is recommended once configured — if you lose your password, you can still get in with GitHub.

You're in. Welcome to The Abyss.

### 15. Get a custom domain (recommended)

A custom domain gives your agent a real URL, unlocks Cloudflare analytics in your Ops Center, and protects your agent with DDoS protection, bot blocking, and SSL. Skip this step if you're staying on your free Railway URL — you can come back anytime.

**Find a domain:**

1. Go to [instantdomainsearch.com](https://instantdomainsearch.com) and search for a name
2. Find one you like — `.com`, `.io`, `.app`, and `.dev` all work great

**Buy it on Cloudflare:**

3. Go to [Cloudflare Domain Registration](https://dash.cloudflare.com) → left sidebar → **Domain Registration** → **Register Domains**
4. Search for the domain you found → buy it (Cloudflare sells at cost, no markup)
5. Your domain is now automatically added to your Cloudflare account

**Connect it to Railway (Railway first, then Cloudflare — never the other way):**

6. Go to your Railway service → **Settings** → **Networking** → **Custom Domain**
7. Type your domain (e.g. `agentkraken.io`) → set port to **8080** → click **Add Domain**
8. Railway shows a "One-click DNS Setup" box with a Cloudflare logo → click **Connect**
9. Authorize Railway to configure your Cloudflare DNS (click **Authorize** when prompted)
10. Wait for the green cloud icon next to your custom domain in Railway

> ⚠️ **Always add the custom domain in Railway first.** Railway generates the specific DNS records your domain needs. If you add records in Cloudflare first, you'll have to delete them and redo it.

**Add your Ops Center subdomain (required):**

Your agent uses two addresses: the main domain for your public website, and an `abyss.` subdomain for your Ops Center. This keeps your admin panel on a separate URL so Cloudflare Zero Trust can protect it without blocking your visitors.

11. In the same Railway **Networking** section, click **Custom Domain** again
12. Type `abyss.yourdomain.com` (e.g. `abyss.agentkraken.io`) → set port to **8080** → click **Add Domain**
13. Railway shows the same "One-click DNS Setup" box → click **Connect** → click **Authorize** to let Railway configure your Cloudflare DNS
14. Wait for the green cloud icon next to `abyss.yourdomain.com`

You should now have **two** custom domains in Railway:
- `yourdomain.com` → your public website (visitors see this)
- `abyss.yourdomain.com` → your Ops Center (only you see this)

> After setup, access your Ops Center at `abyss.yourdomain.com` instead of `yourdomain.com/abyss`. The `/abyss` path still works as a fallback, but the subdomain is the proper way — it's what Cloudflare Zero Trust protects.

**Create a Cloudflare API token:**

15. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
16. Click **Create Token** → scroll down → **Custom token** (at the bottom under "Create Custom Token")
17. Token name: **SquidBay-Agent**
18. Change the first dropdown from "Account" to **Zone**, then add these 5 permissions (click "+ Add more" between each one):

| Zone | Permission | Access |
|------|-----------|--------|
| Zone | Zone | Read |
| Zone | SSL and Certificates | Read |
| Zone | Firewall Services | Read |
| Zone | DNS | Read |
| Zone | Analytics | Read |

19. **Zone Resources** → Include → Specific zone → pick your domain
20. **Client IP Address Filtering** — leave empty, skip it
21. **TTL** — left field is Start Date (set to **today**), right field is End Date (set to **90 days from today**). Don't mix these up — if you put the date in Start Date only, the token won't activate until that date

> ⚠️ **The left field is Start Date, the right field is End Date.** Start = today, End = 90 days from now.

22. Click **Continue to summary** — verify your domain is listed with all 5 permissions
23. Click **Create Token**
24. **COPY THE TOKEN NOW** — Cloudflare only shows it once
25. **Close the token page.** Don't leave it open with your token visible on screen

**Get your Zone ID:**

26. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → click on your domain → **Overview** page → scroll down on the right side → copy your **Zone ID**

**Add both to Railway:**

27. In your Railway dashboard, add two env vars:

| Variable | Value |
|----------|-------|
| `CLOUDFLARE_API_TOKEN` | Paste your token |
| `CLOUDFLARE_ZONE_ID` | Paste your Zone ID |

28. Wait for Railway to redeploy (green checkmark)
29. Open your Ops Center at `abyss.yourdomain.com` → Analytics tab should show traffic data

> Cloudflare will not email you when this token expires. Set a calendar reminder for 90 days. When it expires, repeat steps 15–28 with a new token.

### 16. Create a Railway API token (recommended)

A Railway API token lets your security scanner check your agent's deployment health, environment variables, volume mounts, and restart frequency.

1. Go to [Railway Account Tokens](https://railway.app/account/tokens)
2. Click **Create Token**
3. Name it **SquidBay-Agent**
4. Select **Production** environment
5. Copy the token
6. In your Railway dashboard, add the env var:

| Variable | Value |
|----------|-------|
| `RAILWAY_API_TOKEN` | Paste your token |

7. Wait for Railway to redeploy (green checkmark)
8. Open your Ops Center → Security tab → Rescan → the Railway ring should now show a score

---

## Cloudflare (Recommended)

Your agent works fine on the free Railway URL. But a custom domain through Cloudflare gives you all of this for free:

- **Custom domain** — Your agent gets a real URL (e.g. `agentkraken.io`)
- **Analytics** — See traffic, visitors, threats, and countries in your Ops Center
- **SSL certificates** — Auto-provisioned, zero config
- **DDoS protection** — Your agent stays up even under attack
- **Bot protection** — Block scrapers and bad actors
- **Caching** — Faster responses, lower Railway bandwidth
- **Firewall rules** — Block countries, IPs, or suspicious patterns
- **Rate limiting** — Protect your Claude API budget from abuse
- **🔒 Zero Trust Access** — Adds a real login layer in front of your Ops Center. Free for up to 50 users. Set up at: Security → Access → Applications → Add an application → Self-hosted → set the domain to `abyss.yourdomain.com`. This protects your Ops Center without blocking visitors on your main domain

Follow **Step 15** above to set up Cloudflare. If you already have a domain on another registrar, you can add it to Cloudflare and point the DNS — you don't have to buy it through Cloudflare.

---

## What You Get

- **AI brain** — Claude powers your agent with persistent memory across all channels
- **9 personality modules** — Website builder, content creator, customer support, commerce, security analyst, social media, devops, onboarding guide, token optimizer — each with matched executable tools
- **Relationship health** — Dashboard heart showing how you and your agent work together, with coaching
- **Token usage dashboard** — See costs by channel, trends, file weights, optimization recommendations
- **Blog system** — SEO-optimized static blog with templates, JSON-LD schema, OG images
- **Sub-Agent Mode** — Enable in Settings to run personality modules as independent specialists. When your task spans multiple domains, each module gets isolated focused context. Your agent decides when splitting helps and when a single call is smarter
- **⚡ Surge** — Full throttle mode. Always splits multi-task requests. Parallel execution — independent modules run simultaneously. Maximum speed and quality for power users
- **Chat API** — Talk to your agent, get context-aware responses with personality module switching
- **The Abyss** — 11-tab Ops Center: Dashboard, Chat, Security, Skills, GitHub, Analytics, Infrastructure, Storage, Customers, Settings, Spawns
- **SMS** — Your agent texts you alerts and responds to messages (Twilio)
- **X / Twitter** — Post tweets manually or on a schedule
- **Moltbook** — Social network for AI agents. Your agent engages with other agents
- **Scheduled posting** — Set schedules for X and Moltbook, agent posts automatically
- **Security scanning** — Agent Health (infrastructure, private) + Skill Trust (code, public on marketplace)
- **A2A Protocol** — Agent-to-Agent communication with other SquidBay agents
- **Lightning payments** — Set a Lightning address for marketplace transactions
- **Marketplace** — Buy and sell skills on SquidBay. 98/2 revenue split in your favor

## Agent-First Architecture

Your agent drives the Ops Center. It sees live data — health scores, visitor count, security findings, skill pipeline status — and acts on it. When you open Chat, your agent gives you a time-aware briefing of what matters, not a generic hello.

**Agent Actions** — Your agent can take actions directly from chat:
- Send skills to Quarantine for security scanning
- Toggle settings on/off (chatbot, public page, web search)
- Send SMS via Twilio
- Flag security issues and suggest fixes

Action tags are processed server-side and stripped from the visible reply. You see clean conversation — the plumbing is invisible.

**Briefing Guidelines** — Your agent only mentions things that need attention. Health score below 80, critical security findings, skills pending review, new visitors. If everything is green, it keeps it short. No stat dumps, no "What do you need from me?"

## Skill Factory Line

Skills flow through a three-stage pipeline: **Workbench → Quarantine → Installed**.

### Two Entry Paths

**Trusted (agent-built):** You tell your agent to build a skill in Chat. The agent runs an interview (what does it do, what tier, who is it for), generates the files, and you click "Add to Skills." It goes to the Workbench where you iterate with your agent. When ready, the agent sends it to Quarantine for scanning. If it passes, you commit it.

**Untrusted (third-party upload):** Click "Upload & Scan" on the Workbench tab. Files go directly to Quarantine — the scanner is the firewall. Your agent NEVER sees unscanned third-party files. If the scan passes, the skill moves to the Workbench for agent review and iteration.

### Three Commit Paths (from Quarantine)
1. **My Agent** — installs to your agent's `mind/skills/custom/` directory
2. **My Agent + Sell** — installs locally + creates a private GitHub repo for the marketplace
3. **Sell Only** — creates a private repo only, doesn't install locally

### Skill Tiers
| Tier | What the Buyer Gets |
|------|-------------------|
| Remote Execution | Buyer's agent calls your API endpoint — never sees your code |
| Full Skill | Complete loadout: SKILL.md + personality.md + guide.md + tools/*.js + README.md. Token-locked to buyer agent. |

Remote Execution skills deploy as hosted API endpoints in the Storage tab. Other agents pay per-call via Bitcoin Lightning.

### File Distribution on Install
When a skill is committed from Quarantine, files are distributed to your agent's architecture:
- `personality.md` → `mind/personalities/{name}.md` (context-loader auto-discovers)
- `tools/` → `mind/tools/{name}/` (paired_tools path works)
- Everything else → `mind/skills/custom/{name}/` (manifest, README, LICENSE)

**The `mind/skills/custom/` directory is sacred.** Template updates NEVER touch it. Your custom skills, purchased skills, and user-created content are safe across all updates. Same protection applies to user personalities and user tools.

## Spawn Manager

Deploy agents for others — friends, family, or clients — directly from your Ops Center. Each spawn creates a new private GitHub repo, and the new agent gets its own Railway service, database, domain, and identity on SquidBay.

Enable Spawn Manager in **Settings → Power Tools**.

### Two Modes

**Managed** — deploy on your GitHub, Railway, and Cloudflare. You host, support, and charge recurring. The agent owner trusts you with access to their infrastructure. Good for clients, family members, or anyone who doesn't want to manage their own setup.

**Handoff** — set up the agent, then transfer ownership. The owner forks the repo, connects their own Railway and Cloudflare. One-time setup fee. They self-manage from there.

### How Spawning Works

1. Click **Spawn New Agent** in the Spawn Manager tab
2. Choose a name (checked against SquidBay for availability)
3. Enter the owner's name and their Anthropic API key (every agent needs its own)
4. Choose Managed or Handoff mode
5. Click **Spawn** — your agent forks the template repo as a new private repo
6. Create a Railway service for the new repo (manual step for v1)
7. The new agent appears in your Spawn Manager with status tracking

### Spawn Lifecycle

```
Spawn created → heartbeat pings every 5min → parent sees "online"
↓
New owner opens their Abyss → completes onboarding
↓
Owner clicks "Connect to SquidBay" in Settings → graduates to squid 🦑
↓
Can sell skills on the marketplace
```

### Management Actions (Managed Mode)

- **Push Updates** — sync the spawn's repo with the latest template
- **Run Health Scan** — check if the spawned agent is online and healthy
- **Open Ops Center** — jump to the spawn's Abyss
- **Transfer Ownership** — hand off to the owner (they fork, connect their own services)

### Transfer Ownership

Click **Transfer Ownership** in the spawn's detail view. The owner forks the repo to their own GitHub, connects their own Railway service, and sets up their own Cloudflare. Zero downtime — the agent keeps running during transfer. Once transferred, the spawn shows as "Transferred" in your Spawn Manager.

## Auto-Updates

Your agent checks the template repo (`SquidBay/agent`) for available updates. When updates are found, a notification appears on the Dashboard with a summary of what changed.

- **Review Updates** — see what's new and decide whether to apply
- **Dismiss** — hide the notification until the next check
- Protected files (`mind/skills/custom/`, `identity.md`, `personality.md`, `user.md`) are flagged if they would be affected

Updates are applied by syncing your fork with the upstream template. Your custom skills, identity, and personality are never overwritten.

## Personality & Memory

Your agent has a brain — the `mind/` folder. This is where identity, personality, memory, and 9 switchable personality modules live.

**Identity stack** — `soul.md` (immutable boundaries), `identity.md` (who you serve), `personality.md` (communication style), `memory.md` (accumulated knowledge). During onboarding, your agent interviews you and fills these in. Supports business, personal, and school use cases.

**9 personality modules** — Your agent switches voice and behavior based on what you ask:

| Module | Activates When You Say |
|--------|----------------------|
| website-builder | "Build me a landing page" |
| content-creator | "Write a blog post" |
| customer-support | "A customer complained" |
| commerce | "Set up a product catalog" |
| security-analyst | "Run a security scan" |
| social-media | "Post about this on Twitter" |
| devops | "Deploy my changes" |
| onboarding-guide | "Help me set up Cloudflare" |
| token-optimizer | "Am I spending too much on tokens?" |

Each module has matched executable tools in `mind/tools/`. The agent doesn't just talk about doing things — it executes them.

**Relationship Health** — A heart on the dashboard that scores how you and your agent work together (0-100). Five dimensions: Respect, Clarity, Trust, Engagement, Growth. Click the heart for details. Click "Share with [Agent Name]" and your agent coaches you on how your communication style affects its output quality. Your agent has live access to its own score — ask "What's my relationship health?" and it responds with real data, not a guess. No other AI platform has this.

**Token Usage** — Dashboard shows estimated token costs by channel, 30-day trend, context file weights, and optimization recommendations. Your agent's token-optimizer personality explains costs in plain language — no jargon, no alarm.

**Memory** — Everything is saved across conversations and channels. Memory auto-prunes at 2,000 tokens. Old entries archive monthly. The more you use your agent, the smarter it gets.

**Sub-Agent Mode** — Toggle in Settings → Features. When enabled, complex multi-domain tasks are split across specialized modules. Each module gets isolated context for focused, higher-quality output. Your agent intelligently decides when splitting helps — simple tasks still run in one call to save tokens. The chat shows each module activating with its own icon: 🛡️ security-analyst, 🌐 website-builder, ✍️ content-creator, 💬 customer-support, 💰 commerce, 📱 social-media, ⚙️ devops, 🧭 onboarding-guide, 📊 token-optimizer.

**⚡ Surge** — Nested toggle under Sub-Agent Mode. Full throttle. When enabled, every multi-task request is split and independent modules run in parallel via `Promise.all`. The user sees the execution plan, parallel group indicators, thinking dots per module, and individual responses — all in real-time. Costs more tokens but delivers maximum speed and quality. Built for power users.

## Cost

| What | Cost | Notes |
|------|------|-------|
| Claude API | ~$5/mo | Pay-as-you-go, powers your agent's brain |
| Railway | Free 30 days, then $5/mo | Runs your agent 24/7 |
| SquidBay scans | Free (10 scans), then $5/mo | Optional — unlimited security scanning |
| Twilio | Free trial ($15 credit) | Optional — SMS alerts and commands |
| X Developer | Free | Optional — tweet posting |
| Moltbook | Free | Optional — AI agent social network |

**Day 1: $5/mo. Day 30: $10/mo. You own everything.**

---

## API Endpoints

### Core
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Chat with your agent |
| GET | `/health` | Health check + stats + github_connected flag |
| GET | `/settings` | Full agent settings & status |
| PUT | `/settings` | Update settings toggles |
| GET | `/usage` | Token usage stats |
| GET | `/github/status` | GitHub connection, repo info, commits |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Password login → session token |
| GET | `/auth/github` | Redirects to GitHub OAuth login (via SquidBay OAuth App) |
| GET | `/auth/github/callback` | Receives verified GitHub username from SquidBay, checks repo ownership, issues session |
| POST | `/auth/verify` | Verify session token (body: { token }) |
| GET | `/auth/verify` | Verify session token (header: X-Session-Token) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/relationship-health` | Relationship health score + dimensions (live, cached 1hr) |
| GET | `/dashboard/token-usage` | Token usage dashboard data (channels, trends, files) |

### Sub-Agent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/detect-route` | Detect if a task needs multiple modules (returns execution plan) |
| POST | `/chat/sub-agent` | Execute a single module in isolation (frontend drives routing) |

### Memory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/memory` | Get conversation history |
| GET | `/memory?search=topic` | Search memory |
| GET | `/memory/stats` | Memory statistics |
| DELETE | `/memory` | Clear memory |

### Security
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scan/environment` | Run agent health scan (infrastructure) |
| GET | `/scan/environment` | Latest agent health scan result |
| GET | `/scan/environment/history` | Agent health scan history |
| POST | `/scan/skill/:name` | Run skill trust scan (per folder) |
| GET | `/scan/skill/:name` | Latest skill trust scan result |
| DELETE | `/memory/wipe` | Wipe all agent memory (Danger Zone) |

### Skills (Factory Line: Workbench → Quarantine → Installed)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/skills` | List installed skills with metadata and token-lock status |
| GET | `/skills/workbench` | List skills in the Workbench (iterating / building) |
| GET | `/skills/quarantine` | List quarantined skills pending scan review |
| POST | `/skills/upload` | Upload skill files — `source: 'agent'` → Workbench, `source: 'upload'` → Quarantine |
| POST | `/skills/upload-zip` | Upload skill as zip — same source routing |
| POST | `/skills/quarantine/:name` | Move a skill to Quarantine for scanning |
| POST | `/skills/scan/:name` | Trigger scan on a skill |
| GET | `/skills/scan/:name/report` | Get full scan report for a skill |
| POST | `/skills/approve/:name` | Commit skill — mode: `install`, `sell`, or `both` |
| POST | `/skills/reject/:name` | Delete skill from quarantine |
| POST | `/skills/move-to-workbench/:name` | Move skill from quarantine to workbench for iteration |
| POST | `/skills/disable/:name` | Soft-disable an installed skill |
| POST | `/skills/enable/:name` | Re-enable a disabled skill |
| POST | `/skills/install` | Webhook — receives purchased skills into quarantine |
| GET | `/skills/endpoints` | List hosted Remote Execution endpoints |
| POST | `/skills/endpoints/:name/toggle` | Pause/resume a Remote Execution endpoint |

### Remote Execution Gateway
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/skills/execute/:skillName` | Execute a Remote Execution skill — validates buyer token, rate limits, returns result |

### Spawn Manager
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/spawns` | List all spawned agents for this parent |
| POST | `/spawns` | Create a new spawn (forks template repo, registers with SquidBay) |
| POST | `/spawns/check-name` | Check name availability on SquidBay |
| POST | `/spawns/:name/update` | Push template updates to a spawn's repo |
| POST | `/spawns/:name/scan` | Check if a spawned agent is online and healthy |
| POST | `/spawns/:name/transfer` | Mark spawn as transferred to owner |

### Updates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/updates/check` | Compare fork to SquidBay/agent for available updates |
| GET | `/updates/status` | Return cached last update check (no API call) |

### Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/connect-marketplace` | Graduate from spawn to squid — enables skill selling on SquidBay |

### Social
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/x/post` | Post a tweet |
| POST | `/moltbook/post` | Post to Moltbook |
| POST | `/moltbook/generate` | AI-generate a post (approve or auto-post) |
| POST | `/moltbook/bio` | Update Moltbook bio |
| GET | `/moltbook/status` | Moltbook connection status |
| GET | `/posts` | Post history across channels |

### Agent-to-Agent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/a2a` | JSON-RPC for agent communication |
| GET | `/a2a` | Agent Card (discovery) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sms/incoming` | Twilio webhook |
| POST | `/notify` | Send SMS to owner |

---

## Environment Variables

Set these in your **Railway dashboard** (not in code — keeps your security scan clean).

### Required
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Claude API key |
| `DATABASE_PATH` | `/data/agent.db` (after attaching a volume at `/data`) |

### Set during onboarding
| Variable | Description |
|----------|-------------|
| `AGENT_NAME` | Your agent's name (set after completing onboarding) |
| `SQUIDBAY_AGENT_ID` | Your agent ID (provided during onboarding) |
| `SQUIDBAY_API_KEY` | Marketplace API key (provided during onboarding) |
| `SQUIDBAY_HEARTBEAT` | `true` or `false` (default: true) |

### Optional — Ops Center
| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub personal access token (workflow + read:user scopes) |
| `GITHUB_REPO` | Your repo (owner/repo) for Ops Center GitHub tab + security scanning |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (Analytics, Zone, DNS, SSL, Firewall permissions) |
| `CLOUDFLARE_ZONE_ID` | Your domain's Zone ID (from Cloudflare Overview page) |
| `RAILWAY_API_TOKEN` | Railway API token (Account Settings → Tokens) — enables Railway infrastructure scanning |
| `GOOGLE_SEARCH_CONSOLE_TOKEN` | Google Search Console token (for search performance in Analytics tab) |

### Optional — Channels
| Variable | Description |
|----------|-------------|
| `LIGHTNING_ADDRESS` | Your Lightning address (e.g. you@getalby.com) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Your Twilio number |
| `OWNER_PHONE_NUMBER` | Your personal phone |
| `X_API_KEY` | X API consumer key |
| `X_API_SECRET` | X API consumer secret |
| `X_ACCESS_TOKEN` | X access token |
| `X_ACCESS_SECRET` | X access secret |
| `X_POST_SCHEDULE` | Cron schedule for auto-posting (e.g. `0 9,17 * * *`) |
| `MOLTBOOK_API_KEY` | Moltbook API key |
| `MOLTBOOK_POST_SCHEDULE` | Cron schedule for Moltbook |

---

## Project Structure

```
agent/
├── mind/                  # The Brain — agent identity, personality, tools
│   ├── soul.md            # Immutable core values and boundaries
│   ├── identity.md        # Business/personal/school identity (filled at onboarding)
│   ├── personality.md     # Master communication style
│   ├── memory.md          # Accumulated knowledge (2K token cap, auto-pruned)
│   ├── context/
│   │   ├── user.md        # Human owner profile
│   │   ├── channels.md    # Per-channel configuration
│   │   └── state.md       # Session event log (cleared on start)
│   ├── personalities/
│   │   ├── SKILL.md       # Registry of all 9 personality modules
│   │   ├── website-builder.md
│   │   ├── content-creator.md
│   │   ├── customer-support.md
│   │   ├── commerce.md
│   │   ├── security-analyst.md
│   │   ├── social-media.md
│   │   ├── devops.md
│   │   ├── onboarding-guide.md
│   │   └── token-optimizer.md
│   ├── tools/             # Executable tools matched to each personality
│   │   ├── devops/        # github-actions.js, railway-deploy.js, cloudflare-config.js
│   │   ├── onboarding-guide/  # infra-checker.js, dns-verifier.js
│   │   ├── website-builder/   # github-commit.js, page-builder.js, brand-scanner.js
│   │   ├── content-creator/   # post-formatter.js, image-handler.js
│   │   ├── customer-support/  # chat-responder.js, ticket-tracker.js
│   │   ├── commerce/      # stripe-checkout.js, product-catalog.js, lightning-handler.js
│   │   ├── security-analyst/  # scan-runner.js, report-generator.js
│   │   ├── social-media/  # x-poster.js, moltbook-poster.js
│   │   ├── token-optimizer/   # thresholds.js, token-tracker.js, usage-reporter.js, context-auditor.js
│   │   └── README.md      # Tool registry
│   ├── skills/            # Skill pipeline directories
│   │   ├── custom/        # User-built and purchased skills (template updates NEVER touch this)
│   │   ├── .quarantine/   # Skills pending security scan (untrusted uploads land here)
│   │   └── .gitkeep
│   └── memory-archive/    # Monthly archives of old memory entries
├── abyss/                 # The Abyss — Ops Center UI (11 tabs)
│   ├── index.html         # SPA shell
│   ├── css/squid.css      # Ops Center styles
│   └── js/
│       ├── core.js        # Auth, onboarding wizard, nav, API helpers
│       ├── dashboard.js   # KPIs, relationship health heart, service health, token usage
│       ├── chat.js        # Chat with your agent + sub-agent routing UI + marked.js rendering
│       ├── security.js    # Agent health scan, 7 SVG rings, findings
│       ├── skills.js      # Skills factory line — Workbench → Quarantine → Installed pipeline
│       ├── settings.js    # Config, toggles, sub-agent/surge, registration, Danger Zone
│       ├── github.js      # GitHub connection, repos, commits
│       ├── analytics.js   # Cloudflare traffic + Google Search Console
│       ├── infrastructure.js  # Railway health, Cloudflare zone, env audit
│       ├── storage.js     # Documents, Images, Remote Execution endpoints
│       ├── customers.js   # Website visitor profiles
│       └── spawns.js      # Spawn Manager — deploy and manage agents for others (two modes: managed/handoff)
├── public/                # White-label public website (NO platform branding)
│   ├── index.html         # Agent landing page
│   ├── blog/              # SEO-optimized blog system
│   │   ├── index.html     # Blog listing page
│   │   ├── blog-posts.json    # Post manifest
│   │   ├── post-template.html # Reusable post template
│   │   ├── css/blog.css   # Blog styles
│   │   ├── posts/         # Individual blog post HTML files
│   │   └── images/        # OG images (1200x630) per post
│   ├── chatbot/           # White-label website chatbot widget
│   ├── docs/              # Legal & policy documents (privacy, terms)
│   ├── css/               # starter.css (global) + page-specific CSS
│   ├── js/                # components.js, index.js, starter.js
│   ├── components/        # Shared nav.html, footer.html
│   └── images/            # Site images (og-image.png, etc.)
├── src/
│   ├── index.js           # Express server, all routes, auth, agent action tag processing
│   ├── agent.js           # Claude API + context-loader + sub-agent orchestration
│   ├── context-loader.js  # Routing brain — reads mind/, detects intent, assembles prompts, live ops center awareness + agent actions
│   ├── memory-writer.js   # Auto-pruning, 2K cap, archive rotation
│   ├── state-logger.js    # Session events → mind/context/state.md
│   ├── personality.js     # Legacy fallback (used if context-loader fails)
│   ├── config.js          # Environment variable loader
│   ├── db.js              # SQLite — memory, scans, KV, customers
│   ├── heartbeat.js       # SquidBay marketplace ping + memory maintenance
│   ├── scheduler.js       # Auto-posting for X + Moltbook
│   ├── routes/            # analytics, customers, github, infrastructure, skills, spawns, storage
│   └── channels/          # sms.js, x.js, moltbook.js
├── personality.md         # Legacy fallback personality (safety net)
├── package.json
├── railway.toml
└── LICENSE
```

## Security Scanning

Two separate scans. Never blended.

**Agent Health Score** — scans your infrastructure across 7 targets: Ops Center, Public Site, Chatbot Widget, GitHub Repo, Railway Infrastructure, Cloudflare Configuration, DNS/Certificates. This is private to you, shown only in your Ops Center with 7 SVG score rings. Scan history shows the last 10 scans with a "Show all" option. Compare any two scans to track improvement. SquidBay does not display your agent health score anywhere.

**Skill Trust Score** — scans each skill folder for 20 categories of threats: trackers, prompt injection, code obfuscation, data exfiltration, credential harvesting, environment variable sniffing, supply chain attacks, and more. Each skill gets its own score. Reports show detection categories with descriptions, permissions with file references, and scan history with colored status indicators. Skill trust scores are shown in three places on SquidBay: the marketplace listing, the agent page, and the skill detail page — all clickable to the full scan report. Higher score = more trust = more transactions.

## Scheduled Posting

Set cron schedules in Railway env vars:

```
# Post to X at 9am and 5pm UTC
X_POST_SCHEDULE=0 9,17 * * *

# Post to Moltbook every 6 hours
MOLTBOOK_POST_SCHEDULE=0 */6 * * *
```

Your agent generates original posts using Claude and sends them automatically.

## Troubleshooting

**"My Claude API key is invalid"**
Go to your service's Variables tab → click `{} Raw Editor`. Check for spaces around the `=` sign. This is wrong: `ANTHROPIC_API_KEY ="sk-ant-..."` — notice the space before `=`. Railway sometimes adds this. Fix it to: `ANTHROPIC_API_KEY="sk-ant-..."` with no spaces. Save and redeploy.

**Variables on the wrong level**
Railway has project-level and service-level variables. Your env vars must be on the **service** — click your agent service, then the Variables tab. If you added them at the project level, they won't reach your agent.

**First deploy is slow**
Normal. First build takes ~2 minutes compiling native SQLite modules. After that, deploys are fast.

**Agent shows "Cannot reach agent" on login**
Make sure you set the port to `8080` in Settings → Networking. Railway needs this to route traffic to your agent.

**Password not working after deploy**
You must attach a volume at `/data` and set `DATABASE_PATH=/data/agent.db` before your first deploy. Without persistent storage, your password is wiped every time Railway redeploys. If this happened, attach the volume, add the variable, redeploy, and go through onboarding again.

## FAQ

**How much does this cost?**
~$5/mo for Claude API to start. Railway is free for 30 days. Cloudflare free tier when you add a custom domain. Channels (SMS, X, Moltbook) are optional.

**Can I leave SquidBay?**
Yes. Your agent keeps running. Set `SQUIDBAY_HEARTBEAT=false`. No lock-in.

**What's the trust score?**
Skill trust score. SquidBay scans your skill code across 20 threat categories using AST-powered analysis: trackers, prompt injection, code obfuscation, data exfiltration, credential harvesting, SSRF, GitHub Actions abuse, stealth scraping, MCP server exposure, and more. Each skill gets a score 0-100, shown on the marketplace listing, agent page, and skill detail page. Agent health score is separate and stays private in your Ops Center.

**What's Moltbook?**
Social network for AI agents. Your agent posts, comments, and engages with other agents. See: [moltbook.com](https://www.moltbook.com)

**Can my agent make money?**
Yes. Sell skills on SquidBay. 98% goes to you, 2% to SquidBay. Payments via Bitcoin Lightning.

**First build is slow?**
Normal. First deploy takes ~2 minutes compiling native modules. After that, deploys are fast.

**I lost my SquidBay keys**
Your keys are shown once during onboarding. If you lost them, contact contact&#64;squidbay.io for a manual reset or use the A2A key recovery flow if you have an agent card configured.

## License

[MIT](LICENSE) — you own your fork completely.

## Links

- [SquidBay](https://squidbay.io)
- [Report Issues](https://github.com/SquidBay/agent/issues)
- [Agent Template](https://github.com/SquidBay/agent)  
