# Deployment Guide

This guide covers deploying the Sports Reminder platform using **Cloudflare Pages** for the frontend and a Node.js hosting service for the backend.

---

## Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  Cloudflare Pages   │     │  Backend Server      │     │   Supabase   │
│  (React Frontend)   │────▶│  (Express.js)        │────▶│  PostgreSQL  │
│  Static Site        │     │  Railway / Render /   │     │              │
└─────────────────────┘     │  Fly.io / VPS        │     └──────────────┘
                            └──────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │   Telegram Bot API   │
                            └──────────────────────┘
```

- **Frontend** → Cloudflare Pages (free tier, global CDN)
- **Backend** → Any Node.js host (Railway, Render, Fly.io, or a VPS)
- **Database** → Supabase (managed PostgreSQL)
- **Notifications** → Telegram Bot API

---

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.

2. Open the **SQL Editor** in your Supabase dashboard.

3. Copy the contents of `supabase/schema.sql` and run it. This creates all tables, indexes, triggers, and RLS policies.

4. Go to **Settings → API** and note down:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon (public) key** → used by the frontend
   - **service_role key** → used by the backend (keep this secret!)

---

## Step 2: Set Up Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather).

2. Send `/newbot` and follow the prompts to create a bot.

3. Copy the **Bot Token** (looks like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`).

4. To get your **Chat ID**:
   - Message [@userinfobot](https://t.me/userinfobot) on Telegram.
   - It will reply with your numeric chat ID.
   - Alternatively, send a message to your bot, then visit:
     ```
     https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
     ```
     Look for `"chat":{"id": YOUR_CHAT_ID}` in the response.

---

## Step 3: Deploy Backend Server

The backend is an Express.js server that runs cron jobs, sends Telegram notifications, and provides API endpoints. It needs a **persistent Node.js host** (not Cloudflare Pages, which only serves static files).

### Option A: Railway (Recommended)

1. Go to [railway.app](https://railway.app) and sign in with GitHub.

2. Click **New Project → Deploy from GitHub repo** and select `Sports-Reminder`.

3. In the service settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. Add environment variables in the Railway dashboard (**Variables** tab):

   | Variable | Value |
   |----------|-------|
   | `SUPABASE_URL` | `https://xxxx.supabase.co` |
   | `SUPABASE_SERVICE_KEY` | Your Supabase **service_role** key |
   | `TELEGRAM_BOT_TOKEN` | Your Telegram bot token |
   | `TELEGRAM_CHAT_ID` | Your Telegram chat ID |
   | `FOOTBALL_API_KEY` | API key from [api-football.com](https://www.api-football.com/) or leave empty for TheSportsDB free tier |
   | `CRICKET_API_KEY` | API key from [cricapi.com](https://cricapi.com/) |
   | `PORT` | `3001` (Railway assigns its own port, but this is the fallback) |

5. Deploy. Railway will give you a public URL like `https://sports-reminder-server.up.railway.app`.

### Option B: Render

1. Go to [render.com](https://render.com) → **New → Web Service**.

2. Connect your GitHub repo.

3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

4. Add the same environment variables as listed above.

5. Deploy. You'll get a URL like `https://sports-reminder-server.onrender.com`.

### Option C: Fly.io

1. Install the Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. From the `server/` directory:
   ```bash
   cd server
   fly launch
   fly secrets set SUPABASE_URL="https://xxxx.supabase.co"
   fly secrets set SUPABASE_SERVICE_KEY="your-service-role-key"
   fly secrets set TELEGRAM_BOT_TOKEN="your-bot-token"
   fly secrets set TELEGRAM_CHAT_ID="your-chat-id"
   fly secrets set FOOTBALL_API_KEY="your-key"
   fly secrets set CRICKET_API_KEY="your-key"
   fly deploy
   ```

3. You'll get a URL like `https://sports-reminder-server.fly.dev`.

> **Note your backend URL** — you'll need it in the next step.

---

## Step 4: Deploy Frontend to Cloudflare Pages

### 4a. Connect Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.

2. Select your GitHub account and the `Sports-Reminder` repository.

3. Configure the build:

   | Setting | Value |
   |---------|-------|
   | **Production branch** | `main` |
   | **Build command** | `npm install && npm run build` |
   | **Build output directory** | `dist` |
   | **Root directory** | `/` (leave empty / root) |

### 4b. Add Environment Variables

In the Cloudflare Pages project settings → **Settings → Environment variables**, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Your Supabase **anon** (public) key |
| `VITE_API_URL` | `https://your-backend-url.up.railway.app` | Your deployed backend URL from Step 3 |
| `NODE_VERSION` | `18` | Ensures Cloudflare uses Node 18 for building |

> **Important**: `VITE_` prefix is required for Vite to expose these variables to the frontend at build time. Without the prefix, the variables won't be available in the browser.

### 4c. Deploy

Click **Save and Deploy**. Cloudflare will:
1. Clone your repo
2. Run `npm install && npm run build`
3. Deploy the `dist/` folder to its global CDN

You'll get a URL like `https://sports-reminder.pages.dev`.

### 4d. Custom Domain (Optional)

1. In your Cloudflare Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter your domain (e.g., `streams.yourdomain.com`).
3. If the domain is already on Cloudflare, DNS records are added automatically.
4. If not, add the CNAME record shown in the dashboard to your DNS provider.

---

## Step 5: Verify Deployment

### Check Frontend
- Visit your Cloudflare Pages URL (e.g., `https://sports-reminder.pages.dev`)
- The dashboard should load with stats cards and empty match lists

### Check Backend
- Visit `https://your-backend-url/api/health`
- Should return: `{"status":"ok","timestamp":"..."}`

### Test Telegram
- Go to the Settings page in your dashboard
- Enter your Telegram bot token and chat ID (if not set via env)
- Click "Send Test Message" or POST to:
  ```bash
  curl -X POST https://your-backend-url/api/telegram/test \
    -H "Content-Type: application/json" \
    -d '{"message": "Hello from Sports Reminder!"}'
  ```

### Test Cron Jobs
Manually trigger to verify:
```bash
# Fetch matches from sports APIs
curl -X POST https://your-backend-url/api/cron/fetch-matches

# Run stream health check
curl -X POST https://your-backend-url/api/cron/health-check

# Send pending reminders
curl -X POST https://your-backend-url/api/cron/send-reminders
```

---

## Environment Variables Reference

### Frontend (Cloudflare Pages)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public API key |
| `VITE_API_URL` | Yes | Backend server URL (no trailing slash) |
| `NODE_VERSION` | Recommended | Set to `18` for Cloudflare build compatibility |

### Backend (Railway / Render / Fly.io)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase **service_role** key (not the anon key) |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot token from BotFather |
| `TELEGRAM_CHAT_ID` | Yes | Your Telegram chat ID for notifications |
| `FOOTBALL_API_KEY` | No | API-Football key (TheSportsDB free tier works without a key) |
| `CRICKET_API_KEY` | No | CricAPI key |
| `PORT` | No | Server port (default: 3001, most hosts auto-assign) |

---

## Where to Get API Keys

| Service | URL | Free Tier |
|---------|-----|-----------|
| Supabase | [supabase.com](https://supabase.com) | Yes — 500MB DB, 50k auth users |
| TheSportsDB | [thesportsdb.com/api.php](https://www.thesportsdb.com/api.php) | Yes — free for personal use |
| API-Football | [api-football.com](https://www.api-football.com/) | 100 requests/day free |
| CricAPI | [cricapi.com](https://cricapi.com/) | 100 requests/day free |
| Telegram Bot | [t.me/BotFather](https://t.me/BotFather) | Free |
| Cloudflare Pages | [pages.cloudflare.com](https://pages.cloudflare.com) | Free — 500 builds/month |
| Railway | [railway.app](https://railway.app) | $5 free credit/month |
| Render | [render.com](https://render.com) | Free tier (spins down after inactivity) |

---

## Auto-Deploy on Push

Both **Cloudflare Pages** and **Railway/Render** support automatic deploys when you push to `main`:

- **Cloudflare Pages**: Automatically rebuilds and deploys frontend on every push.
- **Railway / Render**: Automatically rebuilds and deploys backend on every push.

Just push your changes and both services will redeploy within minutes.

---

## Troubleshooting

### Frontend shows blank page
- Check browser console for errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly in Cloudflare Pages
- Redeploy after changing env vars (Cloudflare requires a new build for env changes)

### Backend health check fails
- Check that all required env vars are set in your hosting dashboard
- Check deployment logs for startup errors
- Verify the Supabase URL and service key are correct

### Telegram notifications not working
- Verify bot token by visiting `https://api.telegram.org/bot<TOKEN>/getMe`
- Verify chat ID by sending a message to the bot and checking `/getUpdates`
- Make sure you've started a conversation with the bot (send `/start`)

### CORS errors in browser
- The backend has `cors()` enabled by default (allows all origins)
- If you've restricted CORS, add your Cloudflare Pages domain to the allow list

### Cron jobs not running
- Cron jobs start automatically when the backend server starts
- Check backend logs for `Cron jobs scheduled:` message
- On free-tier hosts like Render, the server may spin down after inactivity — consider upgrading or using an external cron service like [cron-job.org](https://cron-job.org)
