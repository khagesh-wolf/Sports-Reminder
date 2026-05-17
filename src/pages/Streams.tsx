import { useEffect, useState } from 'react'
import * as api from '@/lib/api'
import toast from 'react-hot-toast'
import type { SheetStream } from '@/types'
import {
  Play, Search, FileSpreadsheet,
  ExternalLink, Copy, RefreshCw,
} from 'lucide-react'

export default function Streams() {
  const [streams, setStreams] = useState<SheetStream[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    loadStreams()
  }, [])

  const loadStreams = async () => {
    setLoading(true)
    try {
      const data = await api.getSheetStreams()
      setStreams(data)
    } catch {
      toast.error('Failed to load streams from Google Sheet')
    } finally {
      setLoading(false)
    }
  }

  const filtered = streams.filter((s) => {
    if (typeFilter && s.type !== typeFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !s.Match_ID.toLowerCase().includes(q) &&
        !s.url.toLowerCase().includes(q) &&
        !s.Server_Name.toLowerCase().includes(q) &&
        !s.id.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const streamTypes = [...new Set(streams.map(s => s.type).filter(Boolean))]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Streams</h1>
          <p className="text-dark-400 text-sm mt-1 flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {streams.length} streams from Google Sheet
          </p>
        </div>
        <button onClick={loadStreams} className="btn-secondary" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search by match ID, server, URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        {streamTypes.length > 1 && (
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="select w-auto">
            <option value="">All Types</option>
            {streamTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
        )}
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
          {filtered.map((stream, idx) => (
            <div key={`${stream.Match_ID}-${stream.id}-${idx}`} className="card">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-primary-400 mb-1">
                    Match: <span className="font-semibold">{stream.Match_ID}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-dark-400 uppercase font-mono">{stream.type}</span>
                    <span className="badge bg-primary-500/20 text-primary-400">{stream.Server_Name}</span>
                    <span className="text-xs text-dark-500">ID: {stream.id}</span>
                  </div>
                  <p className="text-sm text-dark-300 truncate font-mono">{stream.url}</p>
                  {stream.kid && (
                    <p className="text-xs text-dark-500 mt-1">DRM: KID configured</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleCopy(stream.url)} className="btn-ghost btn-sm" title="Copy URL">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a href={stream.url} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm" title="Open URL">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
