# Deployment Guide

Deploy the Sports Reminder platform using **Cloudflare Pages** (frontend) and **Render** (backend).

---

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  Cloudflare Pages   │     │   Render.com         │     │   Supabase   │
│  (React Frontend)   │────▶│   (Express.js)       │────▶│  PostgreSQL  │
│  Static Site / CDN  │     │   Web Service        │     │              │
└─────────────────────┘     └──────────┬───────────┘     └──────────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │   Telegram Bot API   │
                            └──────────────────────┘
```

---

## Step 1: Set Up Supabase (Database)

1. Go to [supabase.com](https://supabase.com) → **New Project**.

2. Fill in:
   - **Project name**: `sports-reminder`
   - **Database password**: Choose a strong password
   - **Region**: Pick the closest to you

3. Wait for the project to be created (~2 minutes).

4. Open the **SQL Editor** (left sidebar → SQL Editor).

5. Click **New query**, paste the entire contents of `supabase/schema.sql`, and click **Run**.

6. Go to **Settings → API** (left sidebar → Project Settings → API) and copy:

   | What | Where to find | Used by |
   |------|---------------|---------|
   | **Project URL** | Under "Project URL" | Frontend + Backend |
   | **anon public key** | Under "Project API keys" → `anon` `public` | Frontend only |
   | **service_role key** | Under "Project API keys" → `service_role` `secret` | Backend only |

   > **Warning**: The `service_role` key has full database access. Never expose it in frontend code.

---

## Step 2: Set Up Telegram Bot

1. Open Telegram → search for **@BotFather** → start a chat.

2. Send: `/newbot`

3. Follow the prompts:
   - Bot name: `Sports Reminder Bot` (or anything you like)
   - Bot username: `sports_reminder_xyz_bot` (must end with `bot`)

4. BotFather will reply with your **Bot Token**. Copy it.
   ```
   Example: 7123456789:AAF1kD3mN-abc123XYZ456def789ghi
   ```

5. Get your **Chat ID**:
   - Open Telegram → search for **@userinfobot** → start a chat
   - It replies with your ID:
     ```
     Id: 123456789
     ```
   - Copy this number

6. **Start your bot**: Open Telegram → search for your bot's username → send `/start`. This is required before the bot can send you messages.

---

## Step 3: Deploy Backend on Render

### 3a. Create Render Account

1. Go to [render.com](https://render.com) → **Get Started for Free**.
2. Sign up with your **GitHub** account (recommended — makes repo connection automatic).

### 3b. Create Web Service

1. From the Render dashboard, click **New +** → **Web Service**.

2. Connect your GitHub repo:
   - If you signed up with GitHub, your repos will appear automatically
   - Search for `Sports-Reminder` and click **Connect**

3. Configure the service:

   | Setting | Value |
   |---------|-------|
   | **Name** | `sports-reminder-server` |
   | **Region** | Pick closest to you (e.g., `Oregon (US West)`) |
   | **Branch** | `main` |
   | **Root Directory** | `server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` |

### 3c. Add Environment Variables

Scroll down to **Environment Variables** section and click **Add Environment Variable** for each:

| Key | Value | Notes |
|-----|-------|-------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | From Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOi...` | From Supabase → Settings → API → `service_role` key |
| `TELEGRAM_BOT_TOKEN` | `7123456789:AAF1...` | From BotFather in Step 2 |
| `TELEGRAM_CHAT_ID` | `123456789` | From @userinfobot in Step 2 |
| `FOOTBALL_API_KEY` | *(leave empty or add key)* | Optional — TheSportsDB free tier works without a key |
| `CRICKET_API_KEY` | *(leave empty or add key)* | Optional — get free key at [cricapi.com](https://cricapi.com) |
| `NODE_VERSION` | `18` | Ensures Render uses Node 18 |

### 3d. Deploy

1. Click **Create Web Service**.
2. Render will clone your repo, install dependencies, build, and start the server.
3. Wait for the deploy to complete (2-5 minutes).
4. You'll see a green **"Live"** badge when it's ready.
5. Your backend URL will look like:
   ```
   https://sports-reminder-server.onrender.com
   ```

### 3e. Verify Backend

Visit your backend URL + `/api/health`:
```
https://sports-reminder-server.onrender.com/api/health
```

You should see:
```json
{"status":"ok","timestamp":"2025-01-15T10:30:00.000Z"}
```

### 3f. Keep Server Alive (Important for Free Tier)

Render's free tier spins down the server after 15 minutes of inactivity. This breaks cron jobs (match fetching, reminders, health checks).

**Solution — Use a free cron pinger:**

1. Go to [cron-job.org](https://cron-job.org) → create a free account.

2. Create a new cron job:

   | Setting | Value |
   |---------|-------|
   | **Title** | `Keep Sports Reminder alive` |
   | **URL** | `https://sports-reminder-server.onrender.com/api/health` |
   | **Schedule** | Every 5 minutes |
   | **Request Method** | `GET` |

3. Save. This pings your health endpoint every 5 minutes, preventing Render from spinning down.

**Alternative pingers** (if cron-job.org doesn't work for you):
- [UptimeRobot](https://uptimerobot.com) — free, 5-minute checks
- [Freshping](https://freshping.io) — free, 1-minute checks

> **Note**: If you upgrade to Render's paid tier ($7/month), the server stays always-on and you don't need a pinger.

---

## Step 4: Deploy Frontend on Cloudflare Pages

### 4a. Create Cloudflare Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → sign up (free).

### 4b. Connect Repository

1. In the Cloudflare dashboard → **Workers & Pages** (left sidebar) → **Create** → **Pages** → **Connect to Git**.

2. Sign in with GitHub and select the `Sports-Reminder` repository.

3. Configure the build:

   | Setting | Value |
   |---------|-------|
   | **Project name** | `sports-reminder` (or your choice) |
   | **Production branch** | `main` |
   | **Framework preset** | `None` |
   | **Build command** | `npm install && npm run build` |
   | **Build output directory** | `dist` |
   | **Root directory** | `/` (leave empty) |

### 4c. Add Environment Variables

Click **Environment variables** (expand the section) and add:

| Variable name | Value | Notes |
|---------------|-------|-------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Same Supabase URL as backend |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase **anon** key (NOT service_role) |
| `VITE_API_URL` | `https://sports-reminder-server.onrender.com` | Your Render backend URL from Step 3 |
| `NODE_VERSION` | `18` | Required for the build to work |

> **Important**: The `VITE_` prefix is required. Vite only exposes env vars prefixed with `VITE_` to the browser. Without this prefix, the variables won't be available in the app.

### 4d. SPA Routing

The repo already includes a `public/_redirects` file with:
```
/* /index.html 200
```
This ensures React Router handles all routes. Without it, navigating directly to `/matches` or `/settings` would return a 404.

### 4e. Deploy

1. Click **Save and Deploy**.
2. Cloudflare will build and deploy your frontend (1-3 minutes).
3. You'll get a URL like:
   ```
   https://sports-reminder.pages.dev
   ```

### 4f. Custom Domain (Optional)

1. In your Cloudflare Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter your domain (e.g., `streams.yourdomain.com`).
3. If the domain is already on Cloudflare, DNS is configured automatically.
4. Otherwise, add the CNAME record shown in the dashboard to your DNS provider.

---

## Step 5: Verify Everything Works

### 1. Check Frontend
- Visit your Cloudflare Pages URL (e.g., `https://sports-reminder.pages.dev`)
- The dashboard should load with empty stats

### 2. Check Backend
```bash
curl https://sports-reminder-server.onrender.com/api/health
```
Expected: `{"status":"ok","timestamp":"..."}`

### 3. Test Telegram Bot
```bash
curl -X POST https://sports-reminder-server.onrender.com/api/telegram/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from Sports Reminder!"}'
```
You should receive the message in Telegram.

### 4. Test Match Fetching
```bash
curl -X POST https://sports-reminder-server.onrender.com/api/cron/fetch-matches
```
Then check your dashboard — new matches should appear.

### 5. Test Health Check
```bash
curl -X POST https://sports-reminder-server.onrender.com/api/cron/health-check
```

### 6. Test Reminders
```bash
curl -X POST https://sports-reminder-server.onrender.com/api/cron/send-reminders
```

---

## Environment Variables — Complete Reference

### Frontend (Cloudflare Pages)

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `VITE_SUPABASE_URL` | Yes | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase → Settings → API → `anon` key |
| `VITE_API_URL` | Yes | Your Render backend URL (no trailing slash) |
| `NODE_VERSION` | Yes | Set to `18` |

### Backend (Render)

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `SUPABASE_URL` | Yes | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase → Settings → API → `service_role` key |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram @BotFather |
| `TELEGRAM_CHAT_ID` | Yes | Telegram @userinfobot |
| `FOOTBALL_API_KEY` | No | [api-football.com](https://www.api-football.com/) (TheSportsDB free tier needs no key) |
| `CRICKET_API_KEY` | No | [cricapi.com](https://cricapi.com/) |
| `NODE_VERSION` | Yes | Set to `18` |

---

## Where to Get API Keys

| Service | URL | Free Tier |
|---------|-----|-----------|
| Supabase | [supabase.com](https://supabase.com) | Yes — 500MB DB |
| TheSportsDB | [thesportsdb.com/api.php](https://www.thesportsdb.com/api.php) | Yes — free for personal use |
| API-Football | [api-football.com](https://www.api-football.com/) | 100 requests/day |
| CricAPI | [cricapi.com](https://cricapi.com/) | 100 requests/day |
| Telegram Bot | [t.me/BotFather](https://t.me/BotFather) | Free |
| Cloudflare Pages | [pages.cloudflare.com](https://pages.cloudflare.com) | Free — 500 builds/month |
| Render | [render.com](https://render.com) | Free — 750 hours/month |

---

## Auto-Deploy on Push

Both services auto-deploy when you push to `main`:

- **Cloudflare Pages**: Rebuilds and deploys frontend automatically.
- **Render**: Rebuilds and deploys backend automatically.

Just `git push` and both redeploy within minutes.

---

## Updating Environment Variables

### On Cloudflare Pages
1. Go to your project → **Settings** → **Environment variables**
2. Edit/add variables
3. **Trigger a new deployment** (Cloudflare only applies env vars during build):
   - Push a new commit, OR
   - Go to **Deployments** → click the three dots on the latest deploy → **Retry deployment**

### On Render
1. Go to your service → **Environment** tab
2. Edit/add variables
3. Click **Save Changes** — Render will automatically redeploy with the new values

---

## Troubleshooting

### Frontend shows blank page
- Open browser console (F12) → check for errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Cloudflare Pages
- Make sure you redeployed after changing env vars

### Backend returns 502 or won't start
- Check Render logs: go to your service → **Logs** tab
- Common issues:
  - Missing env vars → add them in the **Environment** tab
  - Wrong `Root Directory` → must be `server`
  - TypeScript build errors → check that `server/tsconfig.json` is valid

### Telegram messages not received
- Verify bot token: visit `https://api.telegram.org/bot<TOKEN>/getMe`
- Verify chat ID: visit `https://api.telegram.org/bot<TOKEN>/getUpdates`
- Make sure you sent `/start` to your bot in Telegram

### CORS errors in browser console
- The backend has `cors()` enabled (allows all origins) by default
- If you restricted CORS, add your Cloudflare Pages domain

### Cron jobs stopped running
- On free Render, the server sleeps after 15 min of inactivity
- Set up a cron pinger (see Step 3f above)
- Check Render logs for `Cron jobs scheduled:` on startup

### Database connection errors
- Verify `SUPABASE_URL` starts with `https://` and ends with `.supabase.co`
- Verify `SUPABASE_SERVICE_KEY` is the `service_role` key, not the `anon` key
- Check if you ran `supabase/schema.sql` in the SQL Editor
