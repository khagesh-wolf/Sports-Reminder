import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { formatDateTime, getTimeUntil, getSportIcon } from '@/lib/utils'
import * as api from '@/lib/api'
import toast from 'react-hot-toast'
import type { MatchFormData, Sport } from '@/types'
import {
  Plus, Search, Calendar, Trash2, Edit3,
  Eye, EyeOff, X,
} from 'lucide-react'

const LEAGUES = {
  football: ['UEFA Champions League', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'FIFA World Cup', 'FIFA Club World Cup'],
  cricket: ['IPL', 'ICC Cricket World Cup', 'ICC T20 World Cup', 'Asia Cup', 'The Ashes', 'Big Bash League', 'Caribbean Premier League'],
}

export default function Matches() {
  const { matches, fetchMatches, loading } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sportFilter, setSportFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMatches({ sport: sportFilter || undefined, status: statusFilter || undefined, search: searchQuery || undefined })
  }, [fetchMatches, sportFilter, statusFilter, searchQuery])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this match?')) return
    try {
      await api.deleteMatch(id)
      toast.success('Match deleted')
      fetchMatches()
    } catch {
      toast.error('Failed to delete match')
    }
  }

  const handleTogglePublish = async (id: string, published: boolean) => {
    try {
      await api.updateMatch(id, { published: !published })
      toast.success(published ? 'Match unpublished' : 'Match published')
      fetchMatches()
    } catch {
      toast.error('Failed to update match')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matches</h1>
          <p className="text-dark-400 text-sm mt-1">{matches.length} matches</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Match
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search teams or leagues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} className="select w-auto">
          <option value="">All Sports</option>
          <option value="football">Football</option>
          <option value="cricket">Cricket</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select w-auto">
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="live">Live</option>
          <option value="finished">Finished</option>
          <option value="postponed">Postponed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Match Form Modal */}
      {showForm && (
        <MatchForm
          editingId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null) }}
          onSaved={() => { setShowForm(false); setEditingId(null); fetchMatches() }}
        />
      )}

      {/* Matches List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card skeleton h-24" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="card text-center py-12 text-dark-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No matches found</p>
          <button onClick={() => setShowForm(true)} className="btn-primary btn-sm mt-4">
            <Plus className="w-3.5 h-3.5" /> Add Match
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const hasStreams = match.streams && match.streams.length > 0
            return (
              <div key={match.id} className="card-hover">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-dark-400">{getSportIcon(match.sport)} {match.league}</span>
                      <span className={`badge ${match.status === 'live' ? 'badge-live' : match.status === 'upcoming' ? 'badge-upcoming' : 'badge-finished'}`}>
                        {match.status === 'live' && <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
                        {match.status}
                      </span>
                      {match.published && <span className="badge bg-primary-500/20 text-primary-400">Published</span>}
                    </div>
                    <Link to={`/matches/${match.id}`} className="hover:text-primary-400 transition-colors">
                      <h3 className="font-semibold">{match.team1} vs {match.team2}</h3>
                    </Link>
                    <div className="flex items-center gap-4 mt-1 text-xs text-dark-400">
                      <span>{formatDateTime(match.match_time)}</span>
                      {match.venue && <span>{match.venue}</span>}
                      {match.status === 'upcoming' && (
                        <span className="text-primary-400">in {getTimeUntil(match.match_time)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {hasStreams ? (
                        <span className="text-xs text-green-400">{match.streams!.length} stream(s)</span>
                      ) : (
                        <span className="text-xs text-yellow-400">No streams</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePublish(match.id, match.published)}
                      className="btn-ghost btn-sm"
                      title={match.published ? 'Unpublish' : 'Publish'}
                    >
                      {match.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { setEditingId(match.id); setShowForm(true) }}
                      className="btn-ghost btn-sm"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(match.id)} className="btn-ghost btn-sm text-red-400" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
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

function MatchForm({ editingId, onClose, onSaved }: {
  editingId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<MatchFormData>({
    sport: 'football',
    league: '',
    team1: '',
    team2: '',
    team1_logo: '',
    team2_logo: '',
    match_time: '',
    venue: '',
    status: 'upcoming',
    published: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingId) {
      api.getMatch(editingId).then((match) => {
        setForm({
          sport: match.sport,
          league: match.league,
          team1: match.team1,
          team2: match.team2,
          team1_logo: match.team1_logo || '',
          team2_logo: match.team2_logo || '',
          match_time: new Date(match.match_time).toISOString().slice(0, 16),
          venue: match.venue || '',
          status: match.status,
          published: match.published,
        })
      })
    }
  }, [editingId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        match_time: new Date(form.match_time).toISOString(),
      }
      if (editingId) {
        await api.updateMatch(editingId, payload)
        toast.success('Match updated')
      } else {
        await api.createMatch(payload)
        toast.success('Match created')
      }
      onSaved()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const leagues = LEAGUES[form.sport as keyof typeof LEAGUES] || []

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{editingId ? 'Edit Match' : 'Add Match'}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Sport</label>
              <select
                value={form.sport}
                onChange={(e) => setForm({ ...form, sport: e.target.value as Sport, league: '' })}
                className="select"
              >
                <option value="football">Football</option>
                <option value="cricket">Cricket</option>
              </select>
            </div>
            <div>
              <label className="label">League</label>
              <select value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })} className="select" required>
                <option value="">Select league</option>
                {leagues.map((l) => <option key={l} value={l}>{l}</option>)}
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          {form.league === 'other' && (
            <div>
              <label className="label">Custom League Name</label>
              <input
                type="text"
                value={form.league === 'other' ? '' : form.league}
                onChange={(e) => setForm({ ...form, league: e.target.value })}
                className="input"
                placeholder="Enter league name"
                required
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Team 1</label>
              <input value={form.team1} onChange={(e) => setForm({ ...form, team1: e.target.value })} className="input" placeholder="Home team" required />
            </div>
            <div>
              <label className="label">Team 2</label>
              <input value={form.team2} onChange={(e) => setForm({ ...form, team2: e.target.value })} className="input" placeholder="Away team" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Team 1 Logo URL</label>
              <input value={form.team1_logo} onChange={(e) => setForm({ ...form, team1_logo: e.target.value })} className="input" placeholder="https://..." />
            </div>
            <div>
              <label className="label">Team 2 Logo URL</label>
              <input value={form.team2_logo} onChange={(e) => setForm({ ...form, team2_logo: e.target.value })} className="input" placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Match Time</label>
              <input type="datetime-local" value={form.match_time} onChange={(e) => setForm({ ...form, match_time: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Venue</label>
              <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="input" placeholder="Stadium name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MatchFormData['status'] })} className="select">
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="finished">Finished</option>
                <option value="postponed">Postponed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="w-4 h-4 rounded border-dark-600 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-dark-300">Published</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
