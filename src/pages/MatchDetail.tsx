import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as api from '@/lib/api'
import { formatDateTime, getTimeUntil, getSportIcon } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Match, Stream, StreamFormData, StreamType } from '@/types'
import {
  ArrowLeft, Plus, Trash2, Edit3, ExternalLink, Activity,
  X, Play, Shield, Clock, MapPin, Copy,
} from 'lucide-react'

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>()
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStreamForm, setShowStreamForm] = useState(false)
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null)

  const loadMatch = async () => {
    if (!id) return
    try {
      const data = await api.getMatch(id)
      setMatch(data)
    } catch {
      toast.error('Match not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMatch() }, [id])

  if (loading) {
    return <div className="space-y-4"><div className="skeleton h-8 w-48" /><div className="skeleton h-40" /><div className="skeleton h-32" /></div>
  }

  if (!match) {
    return (
      <div className="text-center py-12 text-dark-400">
        <p>Match not found</p>
        <Link to="/matches" className="btn-primary btn-sm mt-4">Back to Matches</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/matches" className="btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{match.team1} vs {match.team2}</h1>
          <p className="text-dark-400 text-sm">{getSportIcon(match.sport)} {match.league}</p>
        </div>
      </div>

      {/* Match Info */}
      <div className="card">
        <div className="grid grid-cols-3 items-center gap-4 mb-4">
          <div className="text-center">
            {match.team1_logo && <img src={match.team1_logo} alt={match.team1} className="w-16 h-16 mx-auto mb-2 rounded-lg object-contain" />}
            <p className="font-bold">{match.team1}</p>
          </div>
          <div className="text-center">
            <span className={`badge ${match.status === 'live' ? 'badge-live' : match.status === 'upcoming' ? 'badge-upcoming' : 'badge-finished'}`}>
              {match.status === 'live' && <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
              {match.status}
            </span>
            <p className="text-dark-500 text-xl font-bold my-2">VS</p>
            {match.status === 'upcoming' && (
              <p className="text-primary-400 text-sm">{getTimeUntil(match.match_time)}</p>
            )}
          </div>
          <div className="text-center">
            {match.team2_logo && <img src={match.team2_logo} alt={match.team2} className="w-16 h-16 mx-auto mb-2 rounded-lg object-contain" />}
            <p className="font-bold">{match.team2}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-dark-400 border-t border-dark-700 pt-4">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDateTime(match.match_time)}</span>
          {match.venue && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {match.venue}</span>}
          <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> {match.published ? 'Published' : 'Not Published'}</span>
        </div>
      </div>

      {/* Streams */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Streams ({match.streams?.length || 0})</h2>
          <button onClick={() => { setShowStreamForm(true); setEditingStreamId(null) }} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Add Stream
          </button>
        </div>

        {showStreamForm && (
          <StreamForm
            matchId={match.id}
            editingId={editingStreamId}
            onClose={() => { setShowStreamForm(false); setEditingStreamId(null) }}
            onSaved={() => { setShowStreamForm(false); setEditingStreamId(null); loadMatch() }}
          />
        )}

        {!match.streams || match.streams.length === 0 ? (
          <div className="card text-center py-8 text-dark-400">
            <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No streams added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {match.streams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                onEdit={() => { setEditingStreamId(stream.id); setShowStreamForm(true) }}
                onDelete={async () => {
                  if (!confirm('Delete this stream?')) return
                  await api.deleteStream(stream.id)
                  toast.success('Stream deleted')
                  loadMatch()
                }}
                onCopy={() => {
                  navigator.clipboard.writeText(stream.stream_url)
                  toast.success('URL copied')
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StreamCard({ stream, onEdit, onDelete, onCopy }: {
  stream: Stream; onEdit: () => void; onDelete: () => void; onCopy: () => void
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-dark-400 uppercase">{stream.stream_type}</span>
            <span className={`badge ${stream.stream_status === 'active' ? 'bg-green-500/20 text-green-400' : stream.stream_status === 'broken' ? 'bg-red-500/20 text-red-400' : 'bg-dark-600 text-dark-300'}`}>
              {stream.stream_status}
            </span>
            {stream.label && <span className="badge bg-primary-500/20 text-primary-400">{stream.label}</span>}
          </div>
          <p className="text-sm text-dark-300 truncate font-mono">{stream.stream_url}</p>
          {stream.backup_url && (
            <p className="text-xs text-dark-500 truncate mt-1">Backup: {stream.backup_url}</p>
          )}
          {stream.drm_key && (
            <p className="text-xs text-dark-500 mt-1">DRM: Key set</p>
          )}
          {stream.last_checked && (
            <p className="text-xs text-dark-500 mt-1">Last checked: {formatDateTime(stream.last_checked)}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onCopy} className="btn-ghost btn-sm" title="Copy URL">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <a href={stream.stream_url} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm" title="Open URL">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button onClick={onEdit} className="btn-ghost btn-sm" title="Edit">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="btn-ghost btn-sm text-red-400" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function StreamForm({ matchId, editingId, onClose, onSaved }: {
  matchId: string; editingId: string | null; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<StreamFormData>({
    match_id: matchId,
    stream_url: '',
    stream_type: 'hls',
    drm_key: '',
    drm_kid: '',
    backup_url: '',
    quality: 'auto',
    label: '',
    sort_order: 0,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingId) {
      api.getStreams(matchId).then((streams) => {
        const stream = streams.find((s) => s.id === editingId)
        if (stream) {
          setForm({
            match_id: matchId,
            stream_url: stream.stream_url,
            stream_type: stream.stream_type,
            drm_key: stream.drm_key || '',
            drm_kid: stream.drm_kid || '',
            backup_url: stream.backup_url || '',
            quality: stream.quality,
            label: stream.label || '',
            sort_order: stream.sort_order,
          })
        }
      })
    }
  }, [editingId, matchId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await api.updateStream(editingId, form)
        toast.success('Stream updated')
      } else {
        await api.createStream(form)
        toast.success('Stream added')
      }
      onSaved()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card mb-4 border-primary-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{editingId ? 'Edit Stream' : 'Add Stream'}</h3>
        <button onClick={onClose} className="text-dark-400 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Stream URL</label>
          <input value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} className="input font-mono text-sm" placeholder="https://...m3u8" required />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Type</label>
            <select value={form.stream_type} onChange={(e) => setForm({ ...form, stream_type: e.target.value as StreamType })} className="select">
              <option value="hls">HLS (.m3u8)</option>
              <option value="dash">DASH (.mpd)</option>
              <option value="mpd">MPD</option>
              <option value="direct">Direct</option>
            </select>
          </div>
          <div>
            <label className="label">Quality</label>
            <input value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })} className="input" placeholder="auto, 720p, 1080p" />
          </div>
          <div>
            <label className="label">Label</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="input" placeholder="e.g., Primary" />
          </div>
        </div>
        <div>
          <label className="label">Backup URL</label>
          <input value={form.backup_url} onChange={(e) => setForm({ ...form, backup_url: e.target.value })} className="input font-mono text-sm" placeholder="Optional backup stream URL" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">DRM Key</label>
            <input value={form.drm_key} onChange={(e) => setForm({ ...form, drm_key: e.target.value })} className="input font-mono text-sm" placeholder="ClearKey / Widevine key" />
          </div>
          <div>
            <label className="label">DRM KID</label>
            <input value={form.drm_kid} onChange={(e) => setForm({ ...form, drm_kid: e.target.value })} className="input font-mono text-sm" placeholder="Key ID" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update' : 'Add Stream'}
          </button>
        </div>
      </form>
    </div>
  )
}
