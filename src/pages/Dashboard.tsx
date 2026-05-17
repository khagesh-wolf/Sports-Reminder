import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '@/lib/api'
import type { ApiMatch } from '@/lib/api'
import type { SheetMatch, SheetStream } from '@/types'
import {
  Calendar,
  Play,
  Bell,
  RefreshCw,
  ChevronRight,
  FileSpreadsheet,
  Globe,
} from 'lucide-react'

interface DashboardMatch {
  id: string
  tournament: string
  team1: string
  team2: string
  team1Logo: string
  team2Logo: string
  startTime: string
  endTime: string
  category: string
  source: 'sheet' | 'api'
}

function sheetToDash(m: SheetMatch): DashboardMatch {
  return {
    id: `sheet-${m.Match_ID || `${m.Team1_Name}-${m.Team2_Name}`}`,
    tournament: m.Tournament,
    team1: m.Team1_Name,
    team2: m.Team2_Name,
    team1Logo: m.Team1_Logo,
    team2Logo: m.Team2_Logo,
    startTime: m.Start_Time,
    endTime: m.End_Time,
    category: m.Category,
    source: 'sheet',
  }
}

function apiToDash(m: ApiMatch): DashboardMatch {
  return {
    id: m.id,
    tournament: m.league,
    team1: m.team1,
    team2: m.team2,
    team1Logo: m.team1Logo,
    team2Logo: m.team2Logo,
    startTime: m.matchTime,
    endTime: '',
    category: m.sport === 'cricket' ? 'Cricket' : 'Football',
    source: 'api',
  }
}

export default function Dashboard() {
  const [allMatches, setAllMatches] = useState<DashboardMatch[]>([])
  const [sheetStreams, setSheetStreams] = useState<SheetStream[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sheetMatches, apiMatches, streams] = await Promise.all([
        api.getSheetMatches().catch(() => [] as SheetMatch[]),
        api.getAllApiMatches().catch(() => [] as ApiMatch[]),
        api.getSheetStreams().catch(() => [] as SheetStream[]),
      ])

      const sheetIds = new Set(sheetMatches.map(m => m.Match_ID).filter(Boolean))
      const sheetDisplays = sheetMatches.map(sheetToDash)
      const apiDisplays = apiMatches
        .filter(m => !sheetIds.has(m.id))
        .map(apiToDash)

      const merged = [...sheetDisplays, ...apiDisplays]
        .filter(m => getMatchStatus(m) !== 'finished')
        .sort((a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
      setAllMatches(merged)
      setSheetStreams(streams)
    } catch {
      // Will show empty state
    } finally {
      setLoading(false)
    }
  }

  const getMatchStatus = (m: { startTime: string; endTime: string }): 'upcoming' | 'live' | 'finished' => {
    const now = new Date()
    const start = new Date(m.startTime)
    if (isNaN(start.getTime())) return 'upcoming'
    const end = m.endTime && !isNaN(new Date(m.endTime).getTime())
      ? new Date(m.endTime)
      : new Date(start.getTime() + 4 * 60 * 60 * 1000)
    if (now < start) return 'upcoming'
    if (now >= start && now <= end) return 'live'
    return 'finished'
  }

  const upcoming = allMatches.filter(m => getMatchStatus(m) === 'upcoming')
  const live = allMatches.filter(m => getMatchStatus(m) === 'live')

  const getTimeUntil = (dateStr: string): string => {
    const diff = new Date(dateStr).getTime() - Date.now()
    if (diff <= 0) return 'Started'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-dark-400 text-sm mt-1">Overview of your sports streams</p>
        </div>
        <button onClick={loadData} className="btn-secondary btn-sm" disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Total Matches" value={allMatches.length} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard icon={Bell} label="Upcoming" value={upcoming.length} color="text-purple-400" bg="bg-purple-500/10" />
        <StatCard icon={Play} label="Live Now" value={live.length} color="text-red-400" bg="bg-red-500/10" />
        <StatCard icon={FileSpreadsheet} label="Streams" value={sheetStreams.length} color="text-green-400" bg="bg-green-500/10" />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/matches" className="btn-primary btn-sm">
            <Calendar className="w-3.5 h-3.5" /> Manage Matches
          </Link>
          <Link to="/streams" className="btn-secondary btn-sm">
            <Play className="w-3.5 h-3.5" /> View Streams
          </Link>
        </div>
      </div>

      {/* Live Matches */}
      {live.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Live Now
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {live.map((match) => (
              <DashMatchCard key={match.id} match={match} status="live" formatDate={formatDate} getTimeUntil={getTimeUntil} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Upcoming Matches</h2>
          <Link to="/matches" className="text-primary-400 text-sm hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card skeleton h-20" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="card text-center py-8 text-dark-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming matches</p>
            <p className="text-xs mt-1">Matches from sports APIs and Google Sheet will appear here</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.slice(0, 6).map((match) => (
              <DashMatchCard key={match.id} match={match} status="upcoming" formatDate={formatDate} getTimeUntil={getTimeUntil} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: number; color: string; bg: string
}) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-dark-400 text-xs">{label}</p>
      </div>
    </div>
  )
}

function DashMatchCard({ match, status, formatDate, getTimeUntil }: {
  match: DashboardMatch; status: string;
  formatDate: (d: string) => string; getTimeUntil: (d: string) => string
}) {
  return (
    <div className="card-hover block">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-dark-400">
          {match.category === 'Cricket' ? '\u{1F3CF}' : '\u26BD'} {match.tournament}
        </span>
        <div className="flex items-center gap-1.5">
          {match.source === 'sheet' ? (
            <span className="badge bg-green-500/20 text-green-400 gap-1 text-[10px]">
              <FileSpreadsheet className="w-2.5 h-2.5" /> Sheet
            </span>
          ) : (
            <span className="badge bg-blue-500/20 text-blue-400 gap-1 text-[10px]">
              <Globe className="w-2.5 h-2.5" /> API
            </span>
          )}
          <span className={`badge ${status === 'live' ? 'badge-live' : 'badge-upcoming'}`}>
            {status === 'live' && <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
            {status}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-2">
        {match.team1Logo && <img src={match.team1Logo} alt="" className="w-5 h-5 rounded-full object-cover" />}
        <div className="flex-1 text-center">
          <p className="font-semibold text-sm truncate">{match.team1} vs {match.team2}</p>
        </div>
        {match.team2Logo && <img src={match.team2Logo} alt="" className="w-5 h-5 rounded-full object-cover" />}
      </div>
      <div className="flex items-center justify-between text-xs text-dark-400">
        <span>{formatDate(match.startTime)}</span>
        {status === 'upcoming' && (
          <span className="text-primary-400">{getTimeUntil(match.startTime)}</span>
        )}
      </div>
    </div>
  )
}
