import { supabase } from './supabase'
import type {
  Match, Stream, FavoriteTeam, Notification,
  MatchFormData, StreamFormData, DashboardStats, AppSettings,
} from '@/types'

// ============================================
// MATCHES
// ============================================
export async function getMatches(filters?: {
  sport?: string
  status?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<Match[]> {
  let query = supabase
    .from('matches')
    .select('*, streams(*)')
    .order('match_time', { ascending: true })

  if (filters?.sport) query = query.eq('sport', filters.sport)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.search) {
    query = query.or(`team1.ilike.%${filters.search}%,team2.ilike.%${filters.search}%,league.ilike.%${filters.search}%`)
  }
  if (filters?.limit) query = query.limit(filters.limit)
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getMatch(id: string): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .select('*, streams(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getMatchBySlug(slug: string): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .select('*, streams(*)')
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}

export async function createMatch(match: MatchFormData): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert(match)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMatch(id: string, match: Partial<MatchFormData & { published: boolean; stream_added: boolean; status: string }>): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .update(match)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMatch(id: string): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', id)
  if (error) throw error
}

export async function getUpcomingMatches(limit = 10): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*, streams(*)')
    .in('status', ['upcoming', 'live'])
    .gte('match_time', new Date().toISOString())
    .order('match_time', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function getLiveMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*, streams(*)')
    .eq('status', 'live')
    .order('match_time', { ascending: true })
  if (error) throw error
  return data || []
}

// ============================================
// STREAMS
// ============================================
export async function getStreams(matchId?: string): Promise<Stream[]> {
  let query = supabase
    .from('streams')
    .select('*')
    .order('sort_order', { ascending: true })

  if (matchId) query = query.eq('match_id', matchId)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createStream(stream: StreamFormData): Promise<Stream> {
  const { data, error } = await supabase
    .from('streams')
    .insert(stream)
    .select()
    .single()
  if (error) throw error

  await supabase.from('matches').update({ stream_added: true }).eq('id', stream.match_id)

  return data
}

export async function updateStream(id: string, stream: Partial<StreamFormData & { stream_status: string }>): Promise<Stream> {
  const { data, error } = await supabase
    .from('streams')
    .update(stream)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteStream(id: string): Promise<void> {
  const { error } = await supabase.from('streams').delete().eq('id', id)
  if (error) throw error
}

// ============================================
// FAVORITE TEAMS
// ============================================
export async function getFavoriteTeams(): Promise<FavoriteTeam[]> {
  const { data, error } = await supabase
    .from('favorite_teams')
    .select('*')
    .order('sport', { ascending: true })
    .order('team_name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function addFavoriteTeam(team: { team_name: string; sport: string; logo_url?: string }): Promise<FavoriteTeam> {
  const { data, error } = await supabase
    .from('favorite_teams')
    .insert(team)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeFavoriteTeam(id: string): Promise<void> {
  const { error } = await supabase.from('favorite_teams').delete().eq('id', id)
  if (error) throw error
}

// ============================================
// NOTIFICATIONS
// ============================================
export async function getNotifications(limit = 50): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function clearNotifications(): Promise<void> {
  const { error } = await supabase.from('notifications').delete().neq('id', '')
  if (error) throw error
}

// ============================================
// SETTINGS
// ============================================
export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
  if (error) throw error

  const settings: Record<string, string> = {}
  for (const row of data || []) {
    settings[row.key] = row.value || ''
  }
  return settings as unknown as AppSettings
}

export async function updateSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
  if (error) throw error
}

// ============================================
// DASHBOARD STATS
// ============================================
export async function getDashboardStats(): Promise<DashboardStats> {
  const [matchesRes, streamsRes, favRes, notifRes] = await Promise.all([
    supabase.from('matches').select('id, status, stream_added', { count: 'exact' }),
    supabase.from('streams').select('id, stream_status', { count: 'exact' }),
    supabase.from('favorite_teams').select('id', { count: 'exact' }),
    supabase.from('notifications').select('id', { count: 'exact' }).eq('sent', true),
  ])

  const matches = matchesRes.data || []
  const streams = streamsRes.data || []

  return {
    totalMatches: matchesRes.count || 0,
    upcomingMatches: matches.filter(m => m.status === 'upcoming').length,
    liveMatches: matches.filter(m => m.status === 'live').length,
    totalStreams: streamsRes.count || 0,
    activeStreams: streams.filter(s => s.stream_status === 'active').length,
    brokenStreams: streams.filter(s => s.stream_status === 'broken').length,
    missingStreams: matches.filter(m => !m.stream_added && m.status === 'upcoming').length,
    favoriteTeams: favRes.count || 0,
    notificationsSent: notifRes.count || 0,
  }
}

// ============================================
// SERVER API CALLS (for cron/automation)
// ============================================
const API_URL = import.meta.env.VITE_API_URL || ''

export async function triggerMatchFetch(): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/cron/fetch-matches`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to trigger match fetch')
  return res.json()
}

export async function triggerReminders(): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/cron/send-reminders`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to trigger reminders')
  return res.json()
}

export async function sendTestTelegram(message: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/api/telegram/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error('Failed to send test message')
  return res.json()
}

// ============================================
// SPORTS API (TheSportsDB — direct frontend calls)
// ============================================
import type { SheetMatch, SheetStream } from '@/types'

export interface ApiMatch {
  id: string
  sport: 'football' | 'cricket'
  league: string
  leagueBadge: string
  team1: string
  team2: string
  team1Logo: string
  team2Logo: string
  matchTime: string
  venue: string
  status: 'upcoming' | 'live' | 'finished'
  poster: string
  source: 'api'
}

const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3'

const FOOTBALL_LEAGUES: { id: string; name: string }[] = [
  { id: '4328', name: 'English Premier League' },
  { id: '4335', name: 'Spanish La Liga' },
  { id: '4332', name: 'Italian Serie A' },
  { id: '4331', name: 'German Bundesliga' },
  { id: '4334', name: 'French Ligue 1' },
  { id: '4480', name: 'UEFA Champions League' },
  { id: '4481', name: 'UEFA Europa League' },
]

async function fetchLeagueNextEvents(leagueId: string): Promise<ApiMatch[]> {
  try {
    const res = await fetch(`${THESPORTSDB_BASE}/eventsnextleague.php?id=${leagueId}`)
    if (!res.ok) return []
    const data = await res.json()
    if (!data.events) return []
    return data.events.map((e: Record<string, string | null>) => ({
      id: `tsdb-${e.idEvent}`,
      sport: 'football' as const,
      league: e.strLeague || '',
      leagueBadge: e.strLeagueBadge || '',
      team1: e.strHomeTeam || 'TBD',
      team2: e.strAwayTeam || 'TBD',
      team1Logo: e.strHomeTeamBadge || '',
      team2Logo: e.strAwayTeamBadge || '',
      matchTime: e.strTimestamp || '',
      venue: e.strVenue || '',
      status: e.strStatus === 'Match Finished' ? 'finished' as const
        : e.strStatus === 'Not Started' ? 'upcoming' as const : 'live' as const,
      poster: e.strThumb || e.strPoster || '',
      source: 'api' as const,
    }))
  } catch {
    return []
  }
}

const CRICKET_LEAGUES: { id: string; name: string }[] = [
  { id: '4460', name: 'Indian Premier League' },
  { id: '5067', name: 'Pakistan Super League' },
  { id: '4461', name: 'Australian Big Bash League' },
  { id: '5529', name: 'Bangladesh Premier League' },
  { id: '5176', name: 'Caribbean Premier League' },
  { id: '4463', name: 'English T20 Blast' },
  { id: '5533', name: 'Nepal Premier League' },
]

export async function getFootballMatches(): Promise<ApiMatch[]> {
  const results = await Promise.all(
    FOOTBALL_LEAGUES.map(l => fetchLeagueNextEvents(l.id))
  )
  return results.flat().sort((a, b) =>
    new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()
  )
}

export async function getCricketMatches(): Promise<ApiMatch[]> {
  const results = await Promise.all(
    CRICKET_LEAGUES.map(l => fetchLeagueNextEvents(l.id))
  )
  return results.flat().map(m => ({ ...m, sport: 'cricket' as const })).sort((a, b) =>
    new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()
  )
}

export async function getAllApiMatches(): Promise<ApiMatch[]> {
  const [football, cricket] = await Promise.all([
    getFootballMatches(),
    getCricketMatches(),
  ])
  return [...football, ...cricket].sort((a, b) =>
    new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()
  )
}

export function apiMatchToSheetFormat(m: ApiMatch): SheetMatch {
  return {
    Tournament: m.league,
    Team1_Name: m.team1,
    Team1_Logo: m.team1Logo,
    Team2_Name: m.team2,
    Team2_Logo: m.team2Logo,
    Start_Time: m.matchTime,
    End_Time: '',
    BG_Image: m.poster,
    Category: m.sport === 'cricket' ? 'Cricket' : 'Football',
    Match_ID: m.id,
  }
}

// ============================================
// GOOGLE SHEET (direct opensheet reads + SheetDB writes)
// ============================================

const GOOGLE_SHEETS_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID || '1RthMctHFdKX7yEznC25Va8weBKwjchXCvXS4f4QCl6U'
const OPENSHEET_BASE = 'https://opensheet.elk.sh'
const SHEETDB_API_URL = import.meta.env.VITE_SHEETDB_API_URL || 'https://sheetdb.io/api/v1/7x064zge9xgsu'

export async function getSheetMatches(): Promise<SheetMatch[]> {
  const res = await fetch(`${OPENSHEET_BASE}/${GOOGLE_SHEETS_ID}/Matches`)
  if (!res.ok) throw new Error('Failed to fetch sheet matches')
  return await res.json()
}

export async function getSheetStreams(): Promise<SheetStream[]> {
  const res = await fetch(`${OPENSHEET_BASE}/${GOOGLE_SHEETS_ID}/Streams`)
  if (!res.ok) throw new Error('Failed to fetch sheet streams')
  return await res.json()
}

export async function getSheetStreamsByMatchId(matchId: string): Promise<SheetStream[]> {
  const all = await getSheetStreams()
  return all.filter(s => s.Match_ID === matchId)
}

export async function addMatchToSheet(match: SheetMatch): Promise<void> {
  const res = await fetch(`${SHEETDB_API_URL}?sheet=Matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [match] }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`Failed to add match to sheet: ${text}`)
  }
}
