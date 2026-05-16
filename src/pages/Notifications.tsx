import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import * as api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Bell, Trash2, Send, MessageSquare, AlertTriangle, Clock, Radio } from 'lucide-react'

const typeIcons: Record<string, React.ElementType> = {
  reminder_2d: Clock,
  reminder_1d: Clock,
  reminder_30m: Clock,
  stream_missing: AlertTriangle,
  stream_broken: AlertTriangle,
  drm_missing: AlertTriangle,
  match_live: Radio,
  health_check: Bell,
  general: MessageSquare,
}

const typeLabels: Record<string, string> = {
  reminder_2d: '2 Day Reminder',
  reminder_1d: '1 Day Reminder',
  reminder_30m: '30 Min Reminder',
  stream_missing: 'Stream Missing',
  stream_broken: 'Stream Broken',
  drm_missing: 'DRM Missing',
  match_live: 'Match Live',
  health_check: 'Health Check',
  general: 'General',
}

export default function Notifications() {
  const { notifications, fetchNotifications } = useAppStore()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleClear = async () => {
    if (!confirm('Clear all notifications?')) return
    try {
      await api.clearNotifications()
      toast.success('Notifications cleared')
      fetchNotifications()
    } catch {
      toast.error('Failed to clear')
    }
  }

  const handleSendReminders = async () => {
    try {
      await api.triggerReminders()
      toast.success('Reminders sent')
      fetchNotifications()
    } catch {
      toast.error('Server not configured')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-dark-400 text-sm mt-1">{notifications.length} notifications</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSendReminders} className="btn-secondary">
            <Send className="w-4 h-4" /> Send Reminders
          </button>
          {notifications.length > 0 && (
            <button onClick={handleClear} className="btn-danger">
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-12 text-dark-400">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell
            return (
              <div key={notif.id} className="card flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  notif.type.includes('broken') || notif.type.includes('missing') ? 'bg-red-500/10' :
                  notif.type.includes('reminder') ? 'bg-blue-500/10' :
                  notif.type === 'match_live' ? 'bg-green-500/10' : 'bg-dark-700'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    notif.type.includes('broken') || notif.type.includes('missing') ? 'text-red-400' :
                    notif.type.includes('reminder') ? 'text-blue-400' :
                    notif.type === 'match_live' ? 'text-green-400' : 'text-dark-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-dark-300">{typeLabels[notif.type] || notif.type}</span>
                    {notif.telegram_sent && (
                      <span className="badge bg-blue-500/20 text-blue-400">Telegram</span>
                    )}
                    {notif.sent && (
                      <span className="badge bg-green-500/20 text-green-400">Sent</span>
                    )}
                  </div>
                  <p className="text-sm text-dark-200">{notif.message}</p>
                  <p className="text-xs text-dark-500 mt-1">{formatDateTime(notif.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
