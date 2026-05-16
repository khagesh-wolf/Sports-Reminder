import { useEffect, useState } from 'react'
import * as api from '@/lib/api'
import toast from 'react-hot-toast'
import type { AppSettings } from '@/types'
import { Settings as SettingsIcon, Save, Send, Key, Bot, Clock, Bell } from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testMessage, setTestMessage] = useState('Test notification from Sports Reminder')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await api.getSettings()
      setSettings(data)
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string, value: string) => {
    setSaving(true)
    try {
      await api.updateSetting(key, value)
      toast.success('Setting saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleTestTelegram = async () => {
    try {
      await api.sendTestTelegram(testMessage)
      toast.success('Test message sent!')
    } catch {
      toast.error('Failed to send. Check server & Telegram config.')
    }
  }

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-24 card" />)}</div>
  }

  if (!settings) {
    return <div className="card text-center py-8 text-dark-400">Failed to load settings</div>
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-dark-400 text-sm mt-1">Configure your platform</p>
      </div>

      {/* Telegram Bot */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" /> Telegram Bot
        </h2>
        <div className="space-y-4">
          <SettingField
            label="Bot Token"
            value={settings.telegram_bot_token}
            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            type="password"
            onSave={(v) => handleSave('telegram_bot_token', v)}
          />
          <SettingField
            label="Chat ID"
            value={settings.telegram_chat_id}
            placeholder="Your Telegram chat ID"
            onSave={(v) => handleSave('telegram_chat_id', v)}
          />
          <div className="border-t border-dark-700 pt-4">
            <label className="label">Test Message</label>
            <div className="flex gap-2">
              <input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="input flex-1"
              />
              <button onClick={handleTestTelegram} className="btn-secondary">
                <Send className="w-4 h-4" /> Test
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-amber-400" /> API Keys
        </h2>
        <div className="space-y-4">
          <SettingField
            label="Football API Key (API-Football / TheSportsDB)"
            value={settings.football_api_key}
            placeholder="Your football API key"
            type="password"
            onSave={(v) => handleSave('football_api_key', v)}
          />
          <SettingField
            label="Cricket API Key (CricAPI / SportMonks)"
            value={settings.cricket_api_key}
            placeholder="Your cricket API key"
            type="password"
            onSave={(v) => handleSave('cricket_api_key', v)}
          />
        </div>
      </div>

      {/* Reminders */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-green-400" /> Reminder Settings
        </h2>
        <div className="space-y-3">
          <ToggleSetting
            label="2-day reminder"
            checked={settings.reminder_2d_enabled === 'true'}
            onToggle={(v) => handleSave('reminder_2d_enabled', v ? 'true' : 'false')}
          />
          <ToggleSetting
            label="1-day reminder"
            checked={settings.reminder_1d_enabled === 'true'}
            onToggle={(v) => handleSave('reminder_1d_enabled', v ? 'true' : 'false')}
          />
          <ToggleSetting
            label="30-minute reminder"
            checked={settings.reminder_30m_enabled === 'true'}
            onToggle={(v) => handleSave('reminder_30m_enabled', v ? 'true' : 'false')}
          />
          <ToggleSetting
            label="Auto-publish matches at start time"
            checked={settings.auto_publish === 'true'}
            onToggle={(v) => handleSave('auto_publish', v ? 'true' : 'false')}
          />
        </div>
      </div>

      {/* Intervals */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" /> Intervals
        </h2>
        <div className="space-y-4">
          <SettingField
            label="Match Fetch Interval (seconds)"
            value={settings.match_fetch_interval}
            placeholder="21600"
            onSave={(v) => handleSave('match_fetch_interval', v)}
          />
          <SettingField
            label="Health Check Interval (seconds)"
            value={settings.health_check_interval}
            placeholder="300"
            onSave={(v) => handleSave('health_check_interval', v)}
          />
        </div>
      </div>
    </div>
  )
}

function SettingField({ label, value, placeholder, type = 'text', onSave }: {
  label: string; value: string; placeholder: string; type?: string; onSave: (v: string) => void
}) {
  const [localValue, setLocalValue] = useState(value)
  const changed = localValue !== value

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2">
        <input
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="input flex-1"
          placeholder={placeholder}
        />
        {changed && (
          <button onClick={() => onSave(localValue)} className="btn-primary btn-sm">
            <Save className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function ToggleSetting({ label, checked, onToggle }: {
  label: string; checked: boolean; onToggle: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-sm text-dark-300">{label}</span>
      <button
        onClick={() => onToggle(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-dark-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  )
}
