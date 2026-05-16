# Sports Reminder - Personal Stream Manager

A personal sports streaming management platform for tracking football and cricket matches, managing stream links, and receiving automated reminders via Telegram.

## Features

- **Dashboard** — Statistics, live matches, upcoming matches, quick actions
- **Match Management** — Add/edit/delete matches with team logos, league, venue
- **Stream Management** — HLS/DASH/DRM streams with backup URLs and health checking
- **Favorite Teams** — Auto-filter matches by your tracked teams
- **Automated Reminders** — 2-day, 1-day, 30-minute Telegram notifications
- **Cron Automation** — Auto-fetch matches, send reminders, check stream health
- **Match View** — Video player with HLS.js support and stream selector
- **Mobile-First** — Responsive dark-mode UI

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, TypeScript |
| State | Zustand |
| Database | Supabase PostgreSQL |
| Backend | Express.js, node-cron |
| Video | HLS.js |
| Notifications | Telegram Bot API |

## Setup

### 1. Database

1. Create a [Supabase](https://supabase.com) project
2. Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor
3. Copy your project URL and anon key

### 2. Frontend

```bash
cp .env.example .env
# Edit .env with your Supabase credentials

npm install
npm run dev
```

### 3. Backend Server

```bash
cd server
cp .env.example .env
# Edit .env with Supabase service key, Telegram bot token, API keys

npm install
npm run dev
```

## Environment Variables

### Frontend (.env)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

### Backend (server/.env)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-chat-id
FOOTBALL_API_KEY=your-api-key
CRICKET_API_KEY=your-cricket-api-key
PORT=3001
```

## Automation Schedule

| Job | Frequency | Description |
|-----|-----------|-------------|
| Match Fetch | Every 6 hours | Fetches from sports APIs, filters by favorites |
| Reminders | Every 30 minutes | Sends Telegram alerts at 2d, 1d, 30m before match |
| Health Check | Every 5 minutes | Validates stream URLs, alerts on broken streams |

## Telegram Bot Setup

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot with `/newbot`
3. Copy the bot token
4. Get your chat ID by messaging [@userinfobot](https://t.me/userinfobot)
5. Enter both in Settings page or server `.env`

## Sports APIs

### Football
- [TheSportsDB](https://www.thesportsdb.com/api.php) (free tier available)
- [API-Football](https://www.api-football.com/) (premium)

### Cricket
- [CricAPI](https://cricapi.com/) (free tier available)
- [SportMonks Cricket](https://www.sportmonks.com/cricket-api/)

## Project Structure

```
├── src/                    # Frontend (React)
│   ├── components/layout/  # Layout components
│   ├── lib/                # API, Supabase client, utilities
│   ├── pages/              # All pages
│   ├── store/              # Zustand state management
│   └── types/              # TypeScript types
├── server/                 # Backend (Express)
│   └── src/
│       ├── cron/           # Cron job scheduler
│       ├── routes/         # API routes
│       └── services/       # Business logic
└── supabase/               # Database schema
```
