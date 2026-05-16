import { create } from 'zustand'
import type { Match, Stream, FavoriteTeam, Notification, DashboardStats } from '@/types'
import * as api from '@/lib/api'

interface AppState {
  matches: Match[]
  liveMatches: Match[]
  upcomingMatches: Match[]
  streams: Stream[]
  favorites: FavoriteTeam[]
  notifications: Notification[]
  stats: DashboardStats | null
  loading: boolean
  error: string | null

  fetchMatches: (filters?: { sport?: string; status?: string; search?: string }) => Promise<void>
  fetchLiveMatches: () => Promise<void>
  fetchUpcomingMatches: () => Promise<void>
  fetchStreams: (matchId?: string) => Promise<void>
  fetchFavorites: () => Promise<void>
  fetchNotifications: () => Promise<void>
  fetchStats: () => Promise<void>
  clearError: () => void
}

export const useAppStore = create<AppState>((set) => ({
  matches: [],
  liveMatches: [],
  upcomingMatches: [],
  streams: [],
  favorites: [],
  notifications: [],
  stats: null,
  loading: false,
  error: null,

  fetchMatches: async (filters) => {
    set({ loading: true, error: null })
    try {
      const matches = await api.getMatches(filters)
      set({ matches, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  fetchLiveMatches: async () => {
    try {
      const liveMatches = await api.getLiveMatches()
      set({ liveMatches })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  fetchUpcomingMatches: async () => {
    try {
      const upcomingMatches = await api.getUpcomingMatches()
      set({ upcomingMatches })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  fetchStreams: async (matchId) => {
    try {
      const streams = await api.getStreams(matchId)
      set({ streams })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  fetchFavorites: async () => {
    try {
      const favorites = await api.getFavoriteTeams()
      set({ favorites })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  fetchNotifications: async () => {
    try {
      const notifications = await api.getNotifications()
      set({ notifications })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  fetchStats: async () => {
    try {
      const stats = await api.getDashboardStats()
      set({ stats })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  clearError: () => set({ error: null }),
}))
