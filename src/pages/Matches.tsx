import { useEffect, useState } from 'react'
import * as api from '@/lib/api'
import type { ApiMatch } from '@/lib/api'
import toast from 'react-hot-toast'
import type { SheetMatch } from '@/types'
import {
  Search, Calendar, FileSpreadsheet, RefreshCw, Globe, Upload, AlertTriangle,
} from 'lucide-react'

type SourceFilter = 'all' | 'sheet' | 'api'

interface DisplayMatch {
  id: string
  tournament: string
  team1: string
  team2: string
  team1Logo: string
  team2Logo: string
  startTime: string
  endTime: string
  category: string
  matchId: string
  source: 'sheet' | 'api'
  bgImage: string
  apiMatch?: ApiMatch
  dateWarning?: string
}

function sheetToDisplay(m: SheetMatch): DisplayMatch {
  const dates = api.sanitizeMatchDates(m.Start_Time, m.End_Time)
  return {
    id: `sheet-${m.Match_ID || `${m.Team1_Name}-${m.Team2_Name}`}`,
    tournament: m.Tournament,
    team1: m.Team1_Name,
    team2: m.Team2_Name,
    team1Logo: m.Team1_Logo,
    team2Logo: m.Team2_Logo,
    startTime: dates.startTime,
    endTime: dates.endTime,
    category: m.Category,
    matchId: m.Match_ID,
    source: 'sheet',
    bgImage: m.BG_Image,
    dateWarning: dates.hasWarning ? dates.warning : undefined,
  }
}

function apiToDisplay(m: ApiMatch): DisplayMatch {
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
    matchId: m.id,
    source: 'api',
    bgImage: m.poster,
    apiMatch: m,
  }
}

export default function Matches() {
  const [displayMatches, setDisplayMatches] = useState<DisplayMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [sheetMatchIds, setSheetMatchIds] = useState<Set<string>>(new Set())
  const [addingToSheet, setAddingToSheet] = useState<string | null>(null)

  useEffect(() => {
    loadAllMatches()
  }, [])

  const loadAllMatches = async () => {
    setLoading(true)
    try {
      const [sheetData, apiData] = await Promise.all([
        api.getSheetMatches().catch(() => [] as SheetMatch[]),
        api.getAllApiMatches().catch(() => [] as ApiMatch[]),
      ])

      const sheetIds = new Set(sheetData.map(m => m.Match_ID).filter(Boolean))
      setSheetMatchIds(sheetIds)

      const sheetDisplays = sheetData.map(sheetToDisplay)
      const apiDisplays = apiData
        .filter(m => !sheetIds.has(m.id))
        .map(apiToDisplay)

      const merged = [...sheetDisplays, ...apiDisplays]
        .filter(m => getMatchStatus(m) !== 'finished')
        .sort((a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
      setDisplayMatches(merged)
    } catch {
      toast.error('Failed to load matches')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToSheet = async (match: DisplayMatch) => {
    if (!match.apiMatch) return
    setAddingToSheet(match.id)
    try {
      const sheetMatch = api.apiMatchToSheetFormat(match.apiMatch)
      await api.addMatchToSheet(sheetMatch)
      toast.success(`Added ${match.team1} vs ${match.team2} to Google Sheet`)
      setSheetMatchIds(prev => new Set([...prev, match.matchId]))
    } catch {
      toast.error('Failed to add match to sheet')
    } finally {
      setAddingToSheet(null)
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

  const categories = [...new Set(displayMatches.map(m => m.category).filter(Boolean))]

  const filtered = displayMatches.filter((m) => {
    if (sourceFilter === 'sheet' && m.source !== 'sheet') return false
    if (sourceFilter === 'api' && m.source !== 'api') return false
    if (categoryFilter && m.category !== categoryFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !m.team1.toLowerCase().includes(q) &&
        !m.team2.toLowerCase().includes(q) &&
        !m.tournament.toLowerCase().includes(q) &&
        !m.matchId.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const sheetCount = displayMatches.filter(m => m.source === 'sheet').length
  const apiCount = displayMatches.filter(m => m.source === 'api').length

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
            {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
            {sheetCount > 0 && <span className="text-green-400"> ({sheetCount} from Sheet)</span>}
            {apiCount > 0 && <span className="text-blue-400"> ({apiCount} from API)</span>}
          </p>
        </div>
        <button onClick={loadAllMatches} className="btn-secondary" disabled={loading}>
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
          <option value="">All Sports</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as SourceFilter)} className="select w-auto">
          <option value="all">All Sources</option>
          <option value="sheet">Google Sheet</option>
          <option value="api">Sports API</option>
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
          <p className="text-xs mt-2">Matches from sports APIs and Google Sheet will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((match) => {
            const status = getMatchStatus(match)
            const isInSheet = match.source === 'sheet' || sheetMatchIds.has(match.matchId)
            return (
              <div key={match.id} className="card-hover">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-dark-400">
                        {match.category === 'Cricket' ? '\u{1F3CF}' : '\u26BD'} {match.tournament}
                      </span>
                      <span className={`badge ${status === 'live' ? 'badge-live' : status === 'upcoming' ? 'badge-upcoming' : 'badge-finished'}`}>
                        {status === 'live' && <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
                        {status}
                      </span>
                      {isInSheet ? (
                        <span className="badge bg-green-500/20 text-green-400 gap-1">
                          <FileSpreadsheet className="w-3 h-3" /> In Sheet
                        </span>
                      ) : (
                        <span className="badge bg-blue-500/20 text-blue-400 gap-1">
                          <Globe className="w-3 h-3" /> API
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                      {match.team1Logo && (
                        <img src={match.team1Logo} alt={match.team1} className="w-6 h-6 rounded-full object-cover" />
                      )}
                      <h3 className="font-semibold">{match.team1} vs {match.team2}</h3>
                      {match.team2Logo && (
                        <img src={match.team2Logo} alt={match.team2} className="w-6 h-6 rounded-full object-cover" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-dark-400">
                      <span>{formatDate(match.startTime)}</span>
                      {match.matchId && <span className="text-dark-500">ID: {match.matchId}</span>}
                      {status === 'upcoming' && (
                        <span className="text-primary-400">in {getTimeUntil(match.startTime)}</span>
                      )}
                    </div>
                    {match.dateWarning && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-yellow-400">
                        <AlertTriangle className="w-3 h-3" />
                        {match.dateWarning}
                      </div>
                    )}
                  </div>
                  {match.source === 'api' && !isInSheet && (
                    <button
                      onClick={() => handleAddToSheet(match)}
                      disabled={addingToSheet === match.id}
                      className="btn-secondary btn-sm flex-shrink-0"
                      title="Add to Google Sheet"
                    >
                      <Upload className={`w-3.5 h-3.5 ${addingToSheet === match.id ? 'animate-spin' : ''}`} />
                      Add to Sheet
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
