import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { formatDateTime, getTimeUntil, getSportIcon } from '@/lib/utils'
import * as api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Calendar,
  Play,
  AlertTriangle,
  Star,
  Bell,
  Radio,
  RefreshCw,
  ChevronRight,
  Zap,
  Activity,
  Shield,
} from 'lucide-react'

export default function Dashboard() {
  const { stats, upcomingMatches, liveMatches, fetchStats, fetchUpcomingMatches, fetchLiveMatches } = useAppStore()

  useEffect(() => {
    fetchStats()
    fetchUpcomingMatches()
    fetchLiveMatches()
  }, [fetchStats, fetchUpcomingMatches, fetchLiveMatches])

  const handleFetchMatches = async () => {
    try {
      await api.triggerMatchFetch()
      toast.success('Match fetch triggered')
    } catch {
      toast.error('Server not configured. Set up the backend server.')
    }
  }

  const handleSendReminders = async () => {
    try {
      await api.triggerReminders()
      toast.success('Reminders sent')
    } catch {
      toast.error('Server not configured. Set up the backend server.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-dark-400 text-sm mt-1">Overview of your sports streams</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Total Matches" value={stats?.totalMatches ?? 0} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard icon={Radio} label="Live Now" value={stats?.liveMatches ?? 0} color="text-red-400" bg="bg-red-500/10" />
        <StatCard icon={Play} label="Active Streams" value={stats?.activeStreams ?? 0} color="text-green-400" bg="bg-green-500/10" />
        <StatCard icon={AlertTriangle} label="Missing Streams" value={stats?.missingStreams ?? 0} color="text-yellow-400" bg="bg-yellow-500/10" />
        <StatCard icon={Activity} label="Upcoming" value={stats?.upcomingMatches ?? 0} color="text-purple-400" bg="bg-purple-500/10" />
        <StatCard icon={Shield} label="Broken Streams" value={stats?.brokenStreams ?? 0} color="text-red-400" bg="bg-red-500/10" />
        <StatCard icon={Star} label="Favorite Teams" value={stats?.favoriteTeams ?? 0} color="text-amber-400" bg="bg-amber-500/10" />
        <StatCard icon={Bell} label="Notifications" value={stats?.notificationsSent ?? 0} color="text-cyan-400" bg="bg-cyan-500/10" />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleFetchMatches} className="btn-secondary btn-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Fetch Matches
          </button>
          <button onClick={handleSendReminders} className="btn-secondary btn-sm">
            <Bell className="w-3.5 h-3.5" /> Send Reminders
          </button>
          <Link to="/matches" className="btn-primary btn-sm">
            <Calendar className="w-3.5 h-3.5" /> Manage Matches
          </Link>
        </div>
      </div>

      {/* Warnings */}
      {stats && stats.missingStreams > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-medium text-sm">Stream Links Missing</p>
            <p className="text-yellow-400/70 text-xs mt-1">
              {stats.missingStreams} upcoming match{stats.missingStreams > 1 ? 'es' : ''} without stream links.
            </p>
            <Link to="/matches" className="text-yellow-400 text-xs underline mt-2 inline-block">
              View matches
            </Link>
          </div>
        </div>
      )}

      {stats && stats.brokenStreams > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium text-sm">Broken Streams Detected</p>
            <p className="text-red-400/70 text-xs mt-1">
              {stats.brokenStreams} stream{stats.brokenStreams > 1 ? 's' : ''} failed health check.
            </p>
            <Link to="/streams" className="text-red-400 text-xs underline mt-2 inline-block">
              View streams
            </Link>
          </div>
        </div>
      )}

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Live Now
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {liveMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
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
        {upcomingMatches.length === 0 ? (
          <div className="card text-center py-8 text-dark-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming matches</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcomingMatches.slice(0, 6).map((match) => (
              <MatchCard key={match.id} match={match} />
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

function MatchCard({ match }: { match: import('@/types').Match }) {
  const hasStreams = match.streams && match.streams.length > 0
  return (
    <Link to={`/matches/${match.id}`} className="card-hover block">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-dark-400">{getSportIcon(match.sport)} {match.league}</span>
        <span className={`badge ${match.status === 'live' ? 'badge-live' : match.status === 'upcoming' ? 'badge-upcoming' : 'badge-finished'}`}>
          {match.status === 'live' && <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
          {match.status}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 text-right">
          <p className="font-semibold text-sm truncate">{match.team1}</p>
        </div>
        <span className="text-dark-500 text-xs font-bold">VS</span>
        <div className="flex-1">
          <p className="font-semibold text-sm truncate">{match.team2}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-dark-400">
        <span>{formatDateTime(match.match_time)}</span>
        <div className="flex items-center gap-2">
          {!hasStreams && match.status === 'upcoming' && (
            <span className="text-yellow-400">No stream</span>
          )}
          {match.status === 'upcoming' && (
            <span className="text-primary-400">{getTimeUntil(match.match_time)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
