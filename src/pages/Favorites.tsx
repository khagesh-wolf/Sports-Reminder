import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import * as api from '@/lib/api'
import { getSportIcon } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Sport } from '@/types'
import { Star, Plus, Trash2, X } from 'lucide-react'

export default function Favorites() {
  const { favorites, fetchFavorites } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [newTeam, setNewTeam] = useState('')
  const [newSport, setNewSport] = useState<Sport>('football')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeam.trim()) return
    setSaving(true)
    try {
      await api.addFavoriteTeam({ team_name: newTeam.trim(), sport: newSport })
      toast.success(`${newTeam} added to favorites`)
      setNewTeam('')
      setShowForm(false)
      fetchFavorites()
    } catch (err) {
      toast.error((err as Error).message || 'Failed to add')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from favorites?`)) return
    try {
      await api.removeFavoriteTeam(id)
      toast.success(`${name} removed`)
      fetchFavorites()
    } catch {
      toast.error('Failed to remove')
    }
  }

  const footballTeams = favorites.filter(f => f.sport === 'football')
  const cricketTeams = favorites.filter(f => f.sport === 'cricket')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Favorite Teams</h1>
          <p className="text-dark-400 text-sm mt-1">
            {favorites.length} teams tracked &middot; Only matches with these teams are auto-fetched
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Team
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card border-primary-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Add Favorite Team</h3>
            <button onClick={() => setShowForm(false)} className="text-dark-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label">Team Name</label>
              <input
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                className="input"
                placeholder="e.g., Real Madrid"
                required
              />
            </div>
            <div>
              <label className="label">Sport</label>
              <select value={newSport} onChange={(e) => setNewSport(e.target.value as Sport)} className="select">
                <option value="football">Football</option>
                <option value="cricket">Cricket</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>
      )}

      {/* Football Teams */}
      <div>
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">{getSportIcon('football')}</span> Football ({footballTeams.length})
        </h2>
        {footballTeams.length === 0 ? (
          <div className="card text-center py-6 text-dark-400 text-sm">No football teams added</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {footballTeams.map((team) => (
              <div key={team.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.team_name} className="w-8 h-8 rounded object-contain" />
                  ) : (
                    <div className="w-8 h-8 bg-dark-700 rounded flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-400" />
                    </div>
                  )}
                  <span className="font-medium text-sm">{team.team_name}</span>
                </div>
                <button onClick={() => handleRemove(team.id, team.team_name)} className="btn-ghost btn-sm text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cricket Teams */}
      <div>
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">{getSportIcon('cricket')}</span> Cricket ({cricketTeams.length})
        </h2>
        {cricketTeams.length === 0 ? (
          <div className="card text-center py-6 text-dark-400 text-sm">No cricket teams added</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cricketTeams.map((team) => (
              <div key={team.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.team_name} className="w-8 h-8 rounded object-contain" />
                  ) : (
                    <div className="w-8 h-8 bg-dark-700 rounded flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-400" />
                    </div>
                  )}
                  <span className="font-medium text-sm">{team.team_name}</span>
                </div>
                <button onClick={() => handleRemove(team.id, team.team_name)} className="btn-ghost btn-sm text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="card bg-primary-500/5 border-primary-500/20">
        <h3 className="font-semibold text-sm mb-2">How Favorites Work</h3>
        <ul className="text-xs text-dark-400 space-y-1">
          <li>&#8226; The system automatically fetches matches from supported APIs</li>
          <li>&#8226; Only matches where at least one team is in your favorites are saved</li>
          <li>&#8226; You receive reminders only for matches involving your favorite teams</li>
          <li>&#8226; Add team names exactly as they appear in the sports API for best matching</li>
        </ul>
      </div>
    </div>
  )
}
