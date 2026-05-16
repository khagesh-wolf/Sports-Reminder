import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import * as api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Match, Stream } from '@/types'
import {
  Play, Activity, AlertTriangle, Search,
  ExternalLink, Copy, Trash2, RefreshCw,
} from 'lucide-react'

export default function Streams() {
  const { matches, fetchMatches, loading } = useAppStore()
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const allStreams: (Stream & { match?: Match })[] = []
  for (const match of matches) {
    if (match.streams) {
      for (const stream of match.streams) {
        allStreams.push({ ...stream, match })
      }
    }
  }

  const filtered = allStreams.filter((s) => {
    if (statusFilter && s.stream_status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchName = s.match ? `${s.match.team1} ${s.match.team2}`.toLowerCase() : ''
      if (!matchName.includes(q) && !s.stream_url.toLowerCase().includes(q) && !(s.label || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this stream?')) return
    try {
      await api.deleteStream(id)
      toast.success('Stream deleted')
      fetchMatches()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied')
  }

  const handleHealthCheck = async () => {
    try {
      await api.triggerHealthCheck()
      toast.success('Health check triggered')
    } catch {
      toast.error('Server not configured')
    }
  }

  const activeCount = allStreams.filter(s => s.stream_status === 'active').length
  const brokenCount = allStreams.filter(s => s.stream_status === 'broken').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Streams</h1>
          <p className="text-dark-400 text-sm mt-1">
            {allStreams.length} total &middot; {activeCount} active &middot; {brokenCount} broken
          </p>
        </div>
        <button onClick={handleHealthCheck} className="btn-secondary">
          <Activity className="w-4 h-4" /> Health Check
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search streams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select w-auto">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="broken">Broken</option>
          <option value="expired">Expired</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      {/* Streams List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-20 card" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-dark-400">
          <Play className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No streams found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((stream) => (
            <div key={stream.id} className="card">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {stream.match && (
                    <Link to={`/matches/${stream.match.id}`} className="text-xs text-primary-400 hover:underline mb-1 inline-block">
                      {stream.match.team1} vs {stream.match.team2}
                    </Link>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-dark-400 uppercase">{stream.stream_type}</span>
                    <span className={`badge ${stream.stream_status === 'active' ? 'bg-green-500/20 text-green-400' : stream.stream_status === 'broken' ? 'bg-red-500/20 text-red-400' : 'bg-dark-600 text-dark-300'}`}>
                      {stream.stream_status}
                    </span>
                    {stream.label && <span className="badge bg-primary-500/20 text-primary-400">{stream.label}</span>}
                    {stream.quality !== 'auto' && <span className="text-xs text-dark-400">{stream.quality}</span>}
                  </div>
                  <p className="text-sm text-dark-300 truncate font-mono">{stream.stream_url}</p>
                  {stream.drm_key && <p className="text-xs text-dark-500 mt-1">DRM configured</p>}
                  {stream.last_checked && (
                    <p className="text-xs text-dark-500 mt-1">Checked: {formatDateTime(stream.last_checked)}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleCopy(stream.stream_url)} className="btn-ghost btn-sm" title="Copy URL">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a href={stream.stream_url} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => handleDelete(stream.id)} className="btn-ghost btn-sm text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
