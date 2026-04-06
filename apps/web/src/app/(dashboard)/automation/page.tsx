'use client'

import Link from 'next/link'
import { Plus, Zap, Play, Pause, Trash2, Eye, Settings } from 'lucide-react'
import { useAutomationStore } from '@/stores/automation.store'
import { AUTOMATION_TEMPLATES } from '@/types/automation-templates'

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export default function AutomationPage() {
  const { automations, stats, toggleAutomation, deleteAutomation, executeAutomation } = useAutomationStore()

  const totalAutomations = automations.length
  const enabledAutomations = automations.filter((a) => a.enabled).length
  const totalBudgetImpact = stats.reduce((sum, s) => sum + s.budgetImpact, 0)
  const totalROASImprovement = stats.length
    ? (stats.reduce((sum, s) => sum + s.estimatedROASImprovement, 0) / stats.length).toFixed(2)
    : '—'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Zap size={24} /> Avtomatsiya Strategiyalari
          </h1>
          <p className="text-text-secondary mt-1">
            Madgicx asosida qurilgan avtomatik optimizatsiya strategiyalari
          </p>
        </div>
        <Link
          href="/automation/create"
          className="flex items-center gap-2 px-4 py-2 bg-info text-surface rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={18} /> Yangi
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Jami Strategiyalar', value: totalAutomations, icon: '📊' },
          { label: 'Faol', value: enabledAutomations, icon: '✅' },
          { label: 'Byudjet Ta\'siri', value: `$${totalBudgetImpact}`, icon: '💰' },
          { label: "O'rtacha ROAS Yaxşilanish", value: `${totalROASImprovement}x`, icon: '📈' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-lg border border-border bg-surface-2">
            <p className="text-xs text-text-tertiary mb-2">{stat.label}</p>
            <p className="text-2xl font-bold text-text-primary flex items-center gap-2">
              {stat.icon} {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Strategy Templates Grid */}
      {automations.length === 0 && (
        <div className="rounded-lg border border-border bg-surface-2 p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Boshlash uchun Strategiya Tanlang</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(AUTOMATION_TEMPLATES).map((template) => (
              <Link
                key={template.id}
                href={`/automation/create?template=${template.id}`}
                className="p-4 rounded-lg border border-border hover:border-border-hover hover:bg-surface transition-colors text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-text-primary">{template.name}</p>
                    <p className="text-xs text-text-tertiary mt-1 line-clamp-2">{template.description}</p>
                  </div>
                  <span className="text-2xl">{template.icon}</span>
                </div>
                <div className="flex gap-2 pt-2 text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    template.difficulty === 'beginner' ? 'bg-success/10 text-success' :
                    template.difficulty === 'intermediate' ? 'bg-warning/10 text-warning' :
                    'bg-text-tertiary/10 text-text-tertiary'
                  }`}>
                    {template.difficulty}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-border text-text-secondary">
                    {template.category}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Active Automations List */}
      {automations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Mavjud Strategiyalar</h2>

          <div className="space-y-3">
            {automations.map((automation) => {
              const stat = stats.find((s) => s.strategyId === automation.id)
              const template = Object.values(AUTOMATION_TEMPLATES).find(
                (t) => t.id === automation.strategyType
              )

              return (
                <div
                  key={automation.id}
                  className="p-4 rounded-lg border border-border bg-surface-2 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{template?.icon}</span>
                        <div>
                          <h3 className="font-semibold text-text-primary">{automation.name}</h3>
                          <p className="text-xs text-text-tertiary">{automation.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          automation.enabled
                            ? 'bg-success/10 text-success'
                            : 'bg-text-tertiary/10 text-text-tertiary'
                        }`}
                      >
                        {automation.enabled ? '✓ Faol' : '○ Noaktiv'}
                      </span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  {stat && (
                    <div className="grid grid-cols-4 gap-3 py-3 border-t border-border">
                      <div>
                        <p className="text-xs text-text-tertiary">Ijro qilingan</p>
                        <p className="text-sm font-semibold text-text-primary">{stat.totalExecutions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-tertiary">Ta\'sir (N)</p>
                        <p className="text-sm font-semibold text-text-primary">{stat.totalItemsAffected}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-tertiary">Byudjet</p>
                        <p className={`text-sm font-semibold ${stat.budgetImpact >= 0 ? 'text-success' : 'text-warning'}`}>
                          ${Math.abs(stat.budgetImpact)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-tertiary">ROAS Yaxşi</p>
                        <p className="text-sm font-semibold text-text-primary">{stat.estimatedROASImprovement.toFixed(2)}x</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="text-xs text-text-tertiary">
                      {automation.lastExecuted ? `Oxirgi ijro: ${automation.lastExecuted}` : 'Hali ijro qilinmadi'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => executeAutomation(automation.id)}
                        title="Testlab Ijro Qilish"
                        className="p-1.5 rounded-lg hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
                      >
                        <Play size={16} />
                      </button>
                      <Link
                        href={`/automation/${automation.id}`}
                        title="Ko'rish"
                        className="p-1.5 rounded-lg hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        href={`/automation/${automation.id}/edit`}
                        title="Tahrir Qilish"
                        className="p-1.5 rounded-lg hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
                      >
                        <Settings size={16} />
                      </Link>
                      <button
                        onClick={() => toggleAutomation(automation.id)}
                        title={automation.enabled ? 'Noaktiv Qilish' : 'Faol Qilish'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          automation.enabled
                            ? 'text-success hover:bg-success/10'
                            : 'text-text-tertiary hover:bg-surface-3 hover:text-text-primary'
                        }`}
                      >
                        {automation.enabled ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => deleteAutomation(automation.id)}
                        title="O'chirish"
                        className="p-1.5 rounded-lg hover:bg-warning/10 text-text-tertiary hover:text-warning transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Create Button (always available) */}
      {automations.length > 0 && (
        <div className="pt-4">
          <Link
            href="/automation/create"
            className="w-full py-3 border border-border rounded-lg text-center font-medium text-text-primary hover:bg-surface-2 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Yangi Strategiya Qo'shish
          </Link>
        </div>
      )}
    </div>
  )
}
