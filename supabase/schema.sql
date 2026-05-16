-- Sports Reminder Platform Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport VARCHAR(20) NOT NULL CHECK (sport IN ('football', 'cricket')),
  league VARCHAR(255) NOT NULL,
  team1 VARCHAR(255) NOT NULL,
  team2 VARCHAR(255) NOT NULL,
  team1_logo TEXT,
  team2_logo TEXT,
  match_time TIMESTAMPTZ NOT NULL,
  venue VARCHAR(500),
  status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished', 'postponed', 'cancelled')),
  published BOOLEAN DEFAULT false,
  stream_added BOOLEAN DEFAULT false,
  external_id VARCHAR(255),
  slug VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_match_time ON matches(match_time);
CREATE INDEX idx_matches_sport ON matches(sport);
CREATE INDEX idx_matches_slug ON matches(slug);
CREATE UNIQUE INDEX idx_matches_external_id ON matches(external_id) WHERE external_id IS NOT NULL;

-- ============================================
-- STREAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  stream_url TEXT NOT NULL,
  stream_type VARCHAR(50) DEFAULT 'hls' CHECK (stream_type IN ('hls', 'dash', 'mpd', 'direct')),
  drm_key TEXT,
  drm_kid TEXT,
  backup_url TEXT,
  quality VARCHAR(20) DEFAULT 'auto',
  stream_status VARCHAR(30) DEFAULT 'unknown' CHECK (stream_status IN ('unknown', 'active', 'broken', 'expired')),
  last_checked TIMESTAMPTZ,
  label VARCHAR(100),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_streams_match_id ON streams(match_id);
CREATE INDEX idx_streams_status ON streams(stream_status);

-- ============================================
-- FAVORITE TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorite_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name VARCHAR(255) NOT NULL,
  sport VARCHAR(20) NOT NULL CHECK (sport IN ('football', 'cricket')),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_favorite_teams_name_sport ON favorite_teams(team_name, sport);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('reminder_2d', 'reminder_1d', 'reminder_30m', 'stream_missing', 'stream_broken', 'drm_missing', 'match_live', 'health_check', 'general')),
  message TEXT NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  telegram_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_sent ON notifications(sent);
CREATE INDEX idx_notifications_match_id ON notifications(match_id);

-- ============================================
-- SETTINGS TABLE (key-value store for app config)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('telegram_bot_token', ''),
  ('telegram_chat_id', ''),
  ('football_api_key', ''),
  ('cricket_api_key', ''),
  ('auto_publish', 'false'),
  ('reminder_2d_enabled', 'true'),
  ('reminder_1d_enabled', 'true'),
  ('reminder_30m_enabled', 'true'),
  ('health_check_interval', '300'),
  ('match_fetch_interval', '21600')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- DEFAULT FAVORITE TEAMS
-- ============================================
INSERT INTO favorite_teams (team_name, sport) VALUES
  ('Real Madrid', 'football'),
  ('Barcelona', 'football'),
  ('Manchester City', 'football'),
  ('India', 'cricket'),
  ('Nepal', 'cricket'),
  ('Royal Challengers Bengaluru', 'cricket'),
  ('Chennai Super Kings', 'cricket')
ON CONFLICT (team_name, sport) DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER tr_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_streams_updated_at
  BEFORE UPDATE ON streams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to generate match slug
CREATE OR REPLACE FUNCTION generate_match_slug()
RETURNS TRIGGER AS $$
BEGIN
  NEW.slug = LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(NEW.team1 || '-vs-' || NEW.team2, '[^a-zA-Z0-9\-]', '-', 'g'),
      '-+', '-', 'g'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_matches_slug
  BEFORE INSERT ON matches
  FOR EACH ROW EXECUTE FUNCTION generate_match_slug();

-- ============================================
-- ROW LEVEL SECURITY (personal use - allow all via anon key)
-- ============================================
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on streams" ON streams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on favorite_teams" ON favorite_teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
