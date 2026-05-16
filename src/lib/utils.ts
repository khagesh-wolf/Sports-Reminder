import { MatchStatus, StreamStatus } from '@/types'

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDateTime(date: string): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

export function getTimeUntil(date: string): string {
  const now = new Date().getTime()
  const target = new Date(date).getTime()
  const diff = target - now

  if (diff <= 0) return 'Started'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function getCountdown(date: string): { days: number; hours: number; minutes: number; seconds: number; expired: boolean } {
  const now = new Date().getTime()
  const target = new Date(date).getTime()
  const diff = target - now

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    expired: false,
  }
}

export function getStatusColor(status: MatchStatus): string {
  switch (status) {
    case 'live': return 'bg-red-500'
    case 'upcoming': return 'bg-green-500'
    case 'finished': return 'bg-gray-500'
    case 'postponed': return 'bg-yellow-500'
    case 'cancelled': return 'bg-red-800'
    default: return 'bg-gray-500'
  }
}

export function getStreamStatusColor(status: StreamStatus): string {
  switch (status) {
    case 'active': return 'text-green-400'
    case 'broken': return 'text-red-400'
    case 'expired': return 'text-yellow-400'
    case 'unknown': return 'text-gray-400'
    default: return 'text-gray-400'
  }
}

export function getSportIcon(sport: string): string {
  return sport === 'football' ? '\u26BD' : '\uD83C\uDFCF'
}

export function generateSlug(team1: string, team2: string): string {
  return `${team1}-vs-${team2}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len) + '...'
}
