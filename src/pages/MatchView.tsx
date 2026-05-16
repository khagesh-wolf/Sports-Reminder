import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDateTime, getCountdown, getSportIcon } from '@/lib/utils'
import type { Match, Stream } from '@/types'
import Hls from 'hls.js'
import { ArrowLeft, Play, Clock, MapPin, RefreshCw } from 'lucide-react'

export default function MatchView() {
  const { slug } = useParams<{ slug: string }>()
  const [match, setMatch] = useState<Match | null>(null)
  const [streams, setStreams] = useState<Stream[]>([])
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMatch()
  }, [slug])

  const loadMatch = async () => {
    if (!slug) return
    try {
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('slug', slug)
        .single()

      if (matchData) {
        setMatch(matchData)
        const { data: streamData } = await supabase
          .from('streams')
          .select('*')
          .eq('match_id', matchData.id)
          .order('sort_order', { ascending: true })

        const s = streamData || []
        setStreams(s)
        if (s.length > 0) setSelectedStream(s[0])
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center text-dark-400">
        <div className="text-center">
          <p className="text-lg mb-4">Match not found</p>
          <Link to="/" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-2 text-dark-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Match Header */}
        <div className="card">
          <div className="text-center mb-4">
            <span className="text-xs text-dark-400">{getSportIcon(match.sport)} {match.league}</span>
            {match.status === 'live' && (
              <span className="badge-live ml-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="text-center">
              {match.team1_logo && <img src={match.team1_logo} alt="" className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 rounded-xl object-contain" />}
              <p className="font-bold text-sm sm:text-base">{match.team1}</p>
            </div>
            <div className="text-center">
              <p className="text-dark-500 text-2xl font-bold">VS</p>
            </div>
            <div className="text-center">
              {match.team2_logo && <img src={match.team2_logo} alt="" className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 rounded-xl object-contain" />}
              <p className="font-bold text-sm sm:text-base">{match.team2}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-dark-400">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDateTime(match.match_time)}</span>
            {match.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {match.venue}</span>}
          </div>
          {match.status === 'upcoming' && <MatchCountdown matchTime={match.match_time} />}
        </div>

        {/* Video Player */}
        {selectedStream && <VideoPlayer stream={selectedStream} />}

        {/* Stream Selector */}
        {streams.length > 1 && (
          <div className="card">
            <h3 className="font-semibold mb-3 text-sm">Select Stream</h3>
            <div className="flex flex-wrap gap-2">
              {streams.map((stream, idx) => (
                <button
                  key={stream.id}
                  onClick={() => setSelectedStream(stream)}
                  className={`btn-sm ${selectedStream?.id === stream.id ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Play className="w-3 h-3" />
                  {stream.label || `Stream ${idx + 1}`}
                  {stream.quality !== 'auto' && ` (${stream.quality})`}
                </button>
              ))}
            </div>
            {streams.some(s => s.backup_url) && (
              <div className="mt-3 pt-3 border-t border-dark-700">
                <h4 className="text-xs text-dark-400 mb-2">Backup Streams</h4>
                <div className="flex flex-wrap gap-2">
                  {streams.filter(s => s.backup_url).map((stream, idx) => (
                    <button
                      key={`backup-${stream.id}`}
                      onClick={() => setSelectedStream({ ...stream, stream_url: stream.backup_url! })}
                      className="btn-secondary btn-sm"
                    >
                      Backup {stream.label || `#${idx + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {streams.length === 0 && (
          <div className="card text-center py-12 text-dark-400">
            <Play className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Stream will be available soon</p>
            <button onClick={loadMatch} className="btn-secondary btn-sm mt-4">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function VideoPlayer({ stream }: { stream: Stream }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    setError(false)

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const url = stream.stream_url

    if (stream.stream_type === 'hls' || url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        })
        hls.loadSource(url)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setError(true)
        })
        hlsRef.current = hls
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url
      }
    } else {
      video.src = url
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [stream])

  return (
    <div className="rounded-xl overflow-hidden bg-black">
      {error ? (
        <div className="aspect-video flex items-center justify-center bg-dark-900 text-dark-400">
          <div className="text-center">
            <p className="mb-2">Stream unavailable</p>
            <button onClick={() => setError(false)} className="btn-secondary btn-sm">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full aspect-video bg-black"
          controls
          autoPlay
          playsInline
        />
      )}
    </div>
  )
}

function MatchCountdown({ matchTime }: { matchTime: string }) {
  const [countdown, setCountdown] = useState(getCountdown(matchTime))

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getCountdown(matchTime)), 1000)
    return () => clearInterval(interval)
  }, [matchTime])

  if (countdown.expired) return null

  return (
    <div className="mt-4 pt-4 border-t border-dark-700">
      <p className="text-center text-xs text-dark-400 mb-2">Match starts in</p>
      <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
        {[
          { v: countdown.days, l: 'Days' },
          { v: countdown.hours, l: 'Hours' },
          { v: countdown.minutes, l: 'Mins' },
          { v: countdown.seconds, l: 'Secs' },
        ].map(({ v, l }) => (
          <div key={l} className="bg-dark-900 rounded-lg py-2 text-center">
            <p className="text-lg font-bold font-mono">{String(v).padStart(2, '0')}</p>
            <p className="text-[10px] text-dark-500">{l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
