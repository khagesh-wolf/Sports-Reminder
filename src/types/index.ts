export type Sport = 'football' | 'cricket'

export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'postponed' | 'cancelled'

export type StreamType = 'hls' | 'dash' | 'mpd' | 'direct'

export type StreamStatus = 'unknown' | 'active' | 'broken' | 'expired'

export type NotificationType =
  | 'reminder_2d'
  | 'reminder_1d'
  | 'reminder_30m'
  | 'stream_missing'
  | 'stream_broken'
  | 'drm_missing'
  | 'match_live'
  | 'health_check'
  | 'general'

export interface Match {
  id: string
  sport: Sport
  league: string
  team1: string
  team2: string
  team1_logo: string | null
  team2_logo: string | null
  match_time: string
  venue: string | null
  status: MatchStatus
  published: boolean
  stream_added: boolean
  external_id: string | null
  slug: string | null
  created_at: string
  updated_at: string
  streams?: Stream[]
}

export interface Stream {
  id: string
  match_id: string
  stream_url: string
  stream_type: StreamType
  drm_key: string | null
  drm_kid: string | null
  backup_url: string | null
  quality: string
  stream_status: StreamStatus
  last_checked: string | null
  label: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface FavoriteTeam {
  id: string
  team_name: string
  sport: Sport
  logo_url: string | null
  created_at: string
}

export interface Notification {
  id: string
  match_id: string | null
  type: NotificationType
  message: string
  sent: boolean
  sent_at: string | null
  telegram_sent: boolean
  created_at: string
}

export interface AppSettings {
  telegram_bot_token: string
  telegram_chat_id: string
  football_api_key: string
  cricket_api_key: string
  auto_publish: string
  reminder_2d_enabled: string
  reminder_1d_enabled: string
  reminder_30m_enabled: string
  health_check_interval: string
  match_fetch_interval: string
}

export interface DashboardStats {
  totalMatches: number
  upcomingMatches: number
  liveMatches: number
  totalStreams: number
  activeStreams: number
  brokenStreams: number
  missingStreams: number
  favoriteTeams: number
  notificationsSent: number
}

export interface MatchFormData {
  sport: Sport
  league: string
  team1: string
  team2: string
  team1_logo?: string
  team2_logo?: string
  match_time: string
  venue?: string
  status?: MatchStatus
  published?: boolean
}

export interface StreamFormData {
  match_id: string
  stream_url: string
  stream_type?: StreamType
  drm_key?: string
  drm_kid?: string
  backup_url?: string
  quality?: string
  label?: string
  sort_order?: number
}
