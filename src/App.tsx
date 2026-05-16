import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Matches from '@/pages/Matches'
import MatchDetail from '@/pages/MatchDetail'
import Streams from '@/pages/Streams'
import Favorites from '@/pages/Favorites'
import Notifications from '@/pages/Notifications'
import Settings from '@/pages/Settings'
import MatchView from '@/pages/MatchView'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:id" element={<MatchDetail />} />
        <Route path="/streams" element={<Streams />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/match/:slug" element={<MatchView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
