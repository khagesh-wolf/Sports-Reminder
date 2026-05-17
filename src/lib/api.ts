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
// GOOGLE SHEET (direct opensheet reads + SheetDB writes)
// ============================================
import type { SheetMatch, SheetStream } from '@/types'

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
