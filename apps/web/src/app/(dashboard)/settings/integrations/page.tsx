'use client'

import { useState } from 'react'
import { useI18n } from '@/i18n/use-i18n'
import {
  Plus,
  Check,
  AlertCircle,
  MoreVertical,
  Settings,
  Zap,
  Clock,
  Users,
  TrendingUp,
  Pause,
  Play,
  Trash2,
  RefreshCw,
  TestTube,
} from 'lucide-react'

// Mock data
const CONNECTED_INTEGRATIONS = [
  {
    id: 'conn_1',
    key: 'amocrm',
    name: 'AmoCRM',
    icon: '📱',
    status: 'active',
    account: 'company.amocrm.ru',
    lastSync: 2,
    nextSync: 28,
    stats: {
      synced: 4521,
      success: '99.8%',
    },
  },
  {
    id: 'conn_2',
    key: 'slack',
    name: 'Slack',
    icon: '💬',
    status: 'active',
    account: '#nishon-notifications',
    lastSync: 5,
    nextSync: 25,
    stats: {
      messages: 342,
      success: '100%',
    },
  },
]

const PENDING_INTEGRATIONS = [
  {
    id: 'pending_1',
    name: 'Mailchimp',
    icon: '📧',
    description: 'Email marketing automation',
  },
]

const AVAILABLE_INTEGRATIONS = [
  {
    id: 'avail_1',
    name: 'Google Analytics 4',
    icon: '📊',
    category: 'analytics',
    description: 'Track website behavior and conversions',
  },
  {
    id: 'avail_2',
    name: 'Zapier',
    icon: '⚡',
    category: 'automation',
    description: 'Connect to 1000+ apps',
  },
  {
    id: 'avail_3',
    name: 'Calendly',
    icon: '📅',
    category: 'productivity',
    description: 'Booking attribution tracking',
  },
]

interface Integration {
  id: string
  key?: string
  name: string
  icon: string
  status?: 'active' | 'pending' | 'error'
  account?: string
  lastSync?: number
  nextSync?: number
  stats?: Record<string, any>
}

export default function IntegrationsPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('connected')
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Zap className="text-yellow-400" size={32} />
          Integrations Hub
        </h1>
        <p className="text-text-secondary mt-2">
          Connect and manage all your business tools in one place
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-tertiary">Connected</p>
              <p className="text-3xl font-bold text-emerald-400">2</p>
            </div>
            <Check className="text-emerald-400" size={32} />
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-tertiary">Pending</p>
              <p className="text-3xl font-bold text-yellow-400">1</p>
            </div>
            <Clock className="text-yellow-400" size={32} />
          </div>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-tertiary">Available</p>
              <p className="text-3xl font-bold text-blue-400">{AVAILABLE_INTEGRATIONS.length}</p>
            </div>
            <Plus className="text-blue-400" size={32} />
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-tertiary">Sync Health</p>
              <p className="text-3xl font-bold text-purple-400">99.8%</p>
            </div>
            <TrendingUp className="text-purple-400" size={32} />
          </div>
        </div>
      </div>

      {/* Connected Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Connected Integrations</h2>
        <div className="space-y-3">
          {CONNECTED_INTEGRATIONS.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConfigure={() => {
                setSelectedIntegration(integration)
                setShowConfigModal(true)
              }}
              onTest={() => console.log('Test:', integration.name)}
            />
          ))}
        </div>
      </section>

      {/* Pending Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Pending Setup</h2>
        <div className="space-y-3">
          {PENDING_INTEGRATIONS.map((integration) => (
            <PendingIntegrationCard
              key={integration.id}
              integration={integration}
              onSetup={() => console.log('Setup:', integration.name)}
            />
          ))}
        </div>
      </section>

      {/* Available Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Available Integrations</h2>
        <div className="grid grid-cols-3 gap-4">
          {AVAILABLE_INTEGRATIONS.map((integration) => (
            <AvailableIntegrationCard
              key={integration.id}
              integration={integration}
              onConnect={() => console.log('Connect:', integration.name)}
            />
          ))}
        </div>
      </section>

      {/* Configuration Modal */}
      {showConfigModal && selectedIntegration && (
        <ConfigurationModal
          integration={selectedIntegration}
          onClose={() => setShowConfigModal(false)}
          onSave={() => {
            console.log('Save config')
            setShowConfigModal(false)
          }}
        />
      )}

      {/* Debug Panel */}
      {showDebugPanel && (
        <DebugPanel
          integration={selectedIntegration}
          onClose={() => setShowDebugPanel(false)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Components

interface IntegrationCardProps {
  integration: any
  onConfigure: () => void
  onTest: () => void
}

function IntegrationCard({ integration, onConfigure, onTest }: IntegrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-6 hover:border-emerald-500/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{integration.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-white">{integration.name}</h3>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                <Check size={14} /> ACTIVE
              </span>
            </div>
            <p className="text-sm text-text-tertiary">{integration.account}</p>
          </div>
        </div>
        <IntegrationMenu onConfigure={onConfigure} onTest={onTest} />
      </div>

      {/* Stats */}
      {isExpanded && (
        <div className="space-y-4 py-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-tertiary">Last Sync</p>
              <p className="text-lg font-semibold text-white">{integration.lastSync} min ago</p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Next Sync</p>
              <p className="text-lg font-semibold text-white">in {integration.nextSync} min</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(integration.stats).map(([key, value]) => (
              <div key={key}>
                <p className="text-xs text-text-tertiary capitalize">{key}</p>
                <p className="text-lg font-semibold text-emerald-400">{value}</p>
              </div>
            ))}
          </div>

          {/* Activity */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">Recent Activity</p>
            <ul className="text-xs text-text-tertiary space-y-1">
              <li>✓ 2 min ago: Synced 3 new conversions</li>
              <li>✓ 15 min ago: Pulled deal data (12 records)</li>
              <li>✓ 1h ago: Updated 8 contact segments</li>
            </ul>
          </div>
        </div>
      )}

      {/* Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-4 text-sm text-emerald-300 hover:text-emerald-200 transition"
      >
        {isExpanded ? '← Collapse' : 'View Details →'}
      </button>
    </div>
  )
}

interface PendingIntegrationCardProps {
  integration: any
  onSetup: () => void
}

function PendingIntegrationCard({
  integration,
  onSetup,
}: PendingIntegrationCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{integration.icon}</div>
          <div>
            <h3 className="text-xl font-semibold text-white">{integration.name}</h3>
            <p className="text-sm text-text-tertiary">
              {integration.description}
            </p>
          </div>
        </div>
        <button
          onClick={onSetup}
          className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition font-medium"
        >
          Setup Now →
        </button>
      </div>
    </div>
  )
}

interface AvailableIntegrationCardProps {
  integration: any
  onConnect: () => void
}

function AvailableIntegrationCard({
  integration,
  onConnect,
}: AvailableIntegrationCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-6 hover:border-cyan-500/50 transition-all">
      <div className="text-4xl mb-4">{integration.icon}</div>
      <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
      <p className="text-sm text-text-tertiary mt-2">{integration.description}</p>
      <button
        onClick={onConnect}
        className="mt-4 w-full px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition font-medium text-sm"
      >
        Connect
      </button>
    </div>
  )
}

interface IntegrationMenuProps {
  onConfigure: () => void
  onTest: () => void
}

function IntegrationMenu({ onConfigure, onTest }: IntegrationMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-surface-2 transition"
      >
        <MoreVertical size={20} className="text-text-secondary" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface border border-white/10 rounded-lg shadow-lg z-10">
          <button
            onClick={() => {
              onConfigure()
              setIsOpen(false)
            }}
            className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-2 flex items-center gap-2"
          >
            <Settings size={16} /> Configure
          </button>
          <button
            onClick={() => {
              onTest()
              setIsOpen(false)
            }}
            className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-2 flex items-center gap-2"
          >
            <TestTube size={16} /> Test Connection
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-2 flex items-center gap-2">
            <Pause size={16} /> Pause
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/10">
            <Trash2 size={16} /> Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

interface ConfigurationModalProps {
  integration: any
  onClose: () => void
  onSave: () => void
}

function ConfigurationModal({
  integration,
  onClose,
  onSave,
}: ConfigurationModalProps) {
  const [fieldMappings, setFieldMappings] = useState([
    { nishonField: 'email', crmField: 'Email', required: true },
    { nishonField: 'phone', crmField: 'Phone', required: false },
    { nishonField: 'campaign.name', crmField: 'Campaign Source', required: true },
  ])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-elevated rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 border-b border-white/10 bg-surface-elevated p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Configure {integration.name}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-2 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Sync Settings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Sync Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Sync Frequency
                </label>
                <select className="w-full px-4 py-2 rounded-lg bg-surface-2 border border-white/10 text-text-primary">
                  <option>Every 15 minutes</option>
                  <option selected>Every 30 minutes</option>
                  <option>Hourly</option>
                  <option>Daily</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Batch Size
                </label>
                <input
                  type="number"
                  defaultValue="100"
                  className="w-full px-4 py-2 rounded-lg bg-surface-2 border border-white/10 text-text-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" defaultChecked id="webhook" className="w-4 h-4" />
                <label htmlFor="webhook" className="text-sm text-text-primary">
                  Enable webhook for real-time updates
                </label>
              </div>
            </div>
          </div>

          {/* Field Mapping */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Field Mapping</h3>
            <div className="space-y-3">
              {fieldMappings.map((mapping, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={mapping.nishonField}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg bg-surface-2/50 border border-white/10 text-text-secondary text-sm"
                  />
                  <span className="text-white">→</span>
                  <input
                    type="text"
                    value={mapping.crmField}
                    className="flex-1 px-3 py-2 rounded-lg bg-surface-2 border border-white/10 text-text-primary text-sm"
                  />
                  {mapping.required && (
                    <span className="text-xs text-emerald-400 font-medium">Required</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-surface-elevated p-6 flex items-center gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-white/20 text-text-primary hover:bg-surface-2 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  )
}

interface DebugPanelProps {
  integration: any
  onClose: () => void
}

function DebugPanel({ integration, onClose }: DebugPanelProps) {
  const [logs] = useState([
    { time: '2:34 PM', status: '✓', message: '5 conversions synced', type: 'success' },
    { time: '2:04 PM', status: '✓', message: 'Deal data pulled (12 records)', type: 'success' },
    { time: '1:34 PM', status: '✓', message: '3 conversions synced', type: 'success' },
    { time: '1:04 PM', status: '⚠', message: 'Field mapping mismatch (retry)', type: 'warning' },
  ])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-elevated rounded-2xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-surface-elevated">
          <h2 className="text-2xl font-bold text-white">Debug Logs</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-2">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-3">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                log.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-yellow-500/30 bg-yellow-500/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-text-tertiary">{log.time}</span>
                <span>{log.status}</span>
                <span className="text-sm text-text-primary">{log.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
