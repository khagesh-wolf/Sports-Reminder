import { useEffect, useState } from 'react'
import * as api from '@/lib/api'
import toast from 'react-hot-toast'
import type { SheetMatch } from '@/types'
import {
  Search, Calendar, FileSpreadsheet, RefreshCw,
} from 'lucide-react'

export default function Matches() {
  const [sheetMatches, setSheetMatches] = useState<SheetMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    loadSheetMatches()
  }, [])

  const loadSheetMatches = async () => {
    setLoading(true)
    try {
      const data = await api.getSheetMatches()
      setSheetMatches(data)
    } catch {
      toast.error('Failed to load matches from Google Sheet')
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(sheetMatches.map(m => m.Category).filter(Boolean))]

  const filtered = sheetMatches.filter((m) => {
    if (categoryFilter && m.Category !== categoryFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !m.Team1_Name.toLowerCase().includes(q) &&
        !m.Team2_Name.toLowerCase().includes(q) &&
        !m.Tournament.toLowerCase().includes(q) &&
        !m.Match_ID.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const getMatchStatus = (m: SheetMatch): 'upcoming' | 'live' | 'finished' => {
    const now = new Date()
    const start = new Date(m.Start_Time)
    const end = m.End_Time ? new Date(m.End_Time) : new Date(start.getTime() + 4 * 60 * 60 * 1000)
    if (now < start) return 'upcoming'
    if (now >= start && now <= end) return 'live'
    return 'finished'
  }

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
          <h1 className="text-2xl font-bold">Matches</h1>
          <p className="text-dark-400 text-sm mt-1">
            {filtered.length} match{filtered.length !== 1 ? 'es' : ''} from Google Sheet
          </p>
        </div>
        <button onClick={loadSheetMatches} className="btn-secondary" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search teams, tournaments, or match IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select w-auto">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Matches List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card skeleton h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-dark-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No matches found</p>
          <p className="text-xs mt-2">Add matches to your Google Sheet to see them here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((match) => {
            const status = getMatchStatus(match)
            return (
              <div key={match.Match_ID || `${match.Team1_Name}-${match.Team2_Name}`} className="card-hover">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-dark-400">
                        {match.Category === 'Cricket' ? '🏏' : '⚽'} {match.Tournament}
                      </span>
                      <span className={`badge ${status === 'live' ? 'badge-live' : status === 'upcoming' ? 'badge-upcoming' : 'badge-finished'}`}>
                        {status === 'live' && <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
                        {status}
                      </span>
                      <span className="badge bg-green-500/20 text-green-400 gap-1">
                        <FileSpreadsheet className="w-3 h-3" /> In Sheet
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                      {match.Team1_Logo && (
                        <img src={match.Team1_Logo} alt={match.Team1_Name} className="w-6 h-6 rounded-full object-cover" />
                      )}
                      <h3 className="font-semibold">{match.Team1_Name} vs {match.Team2_Name}</h3>
                      {match.Team2_Logo && (
                        <img src={match.Team2_Logo} alt={match.Team2_Name} className="w-6 h-6 rounded-full object-cover" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-dark-400">
                      <span>{formatDate(match.Start_Time)}</span>
                      {match.Match_ID && <span className="text-dark-500">ID: {match.Match_ID}</span>}
                      {status === 'upcoming' && (
                        <span className="text-primary-400">in {getTimeUntil(match.Start_Time)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
