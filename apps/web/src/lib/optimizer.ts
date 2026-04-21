/**
 * Auto-optimization — reklama "boqadi": 2 soatlik monitoring loop + smart alerts + escalate.
 * Targetolog oldindan tanlaydi: auto vs so'ra (Launch / sozlamalar bilan bir xil ruh).
 */

export type OptimizerPreference = {
  /** ROAS ikki marta ketma-ket < 2 */
  roasDrop: 'auto_reduce_budget' | 'ask_me'
  /** CTR past + frequency yuqori */
  creativeFatigue: 'auto_rotate' | 'ask_me'
}

export const DEFAULT_OPTIMIZER_PREFS: OptimizerPreference = {
  roasDrop: 'auto_reduce_budget',
  creativeFatigue: 'auto_rotate',
}

export interface CampaignSignalSlice {
  campaignId: string
  roas: number
  prevRoas: number
  ctr: number
  cpm: number
  frequency: number
  spend: number
  purchases: number
  asOf: number
}

export interface OptimizerTickResult {
  campaignId: string
  executed: Array<{ kind: string; detail: string }>
  alerts: Array<{ level: 'critical' | 'warn'; message: string }>
  escalations: string[]
  recommendations: Array<{ message: string }>
  learningDelta: string[]
}

function hashCampaign(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Signal bridge / Meta agregat o'rniga — barqaror demo slice (keyin API). */
export async function getSignal(campaignId: string): Promise<CampaignSignalSlice> {
  const h = hashCampaign(campaignId)
  const roas = 1.2 + (h % 80) / 100
  const prevRoas = roas - 0.05 + (h % 10) / 200
  return {
    campaignId,
    roas: Math.round(roas * 100) / 100,
    prevRoas: Math.round(prevRoas * 100) / 100,
    ctr: 0.8 + (h % 40) / 100,
    cpm: 3 + (h % 50) / 10,
    frequency: 2 + (h % 20) / 10,
    spend: 20 + (h % 80),
    purchases: h % 5,
    asOf: Date.now(),
  }
}

const learningKey = (campaignId: string) => `adspectr-optimizer-learning-${campaignId}`

export function readLearning(campaignId: string): { failedActions: number; notes: string[] } {
  if (typeof window === 'undefined') return { failedActions: 0, notes: [] }
  try {
    const raw = localStorage.getItem(learningKey(campaignId))
    if (!raw) return { failedActions: 0, notes: [] }
    return JSON.parse(raw) as { failedActions: number; notes: string[] }
  } catch {
    return { failedActions: 0, notes: [] }
  }
}

export function appendLearning(campaignId: string, note: string, incrementFailure = false): void {
  if (typeof window === 'undefined') return
  const cur = readLearning(campaignId)
  const failedActions = incrementFailure ? cur.failedActions + 1 : cur.failedActions
  const notes = [...cur.notes, note].slice(-40)
  localStorage.setItem(learningKey(campaignId), JSON.stringify({ failedActions, notes }))
}

/** Demo: agent 3 marta muvaffaqiyatsiz deb belgilash. */
export function bumpOptimizerFailureCount(campaignId: string): void {
  appendLearning(campaignId, 'failure_tick', true)
}

/** Keyin: Meta API, ichki queue. */
export async function execute(kind: string, value?: number): Promise<void> {
  void value
  await new Promise((r) => setTimeout(r, 30))
  void kind
}

export async function notify(message: string): Promise<void> {
  void message
  await new Promise((r) => setTimeout(r, 20))
}

/**
 * Rule engine — user snippet kengaytirilgan.
 * prefs: Launch da so'ralgan "auto" / "so'ra".
 */
export async function checkCampaign(
  campaignId: string,
  prefs: OptimizerPreference = DEFAULT_OPTIMIZER_PREFS,
): Promise<OptimizerTickResult> {
  const stats = await getSignal(campaignId)
  const executed: OptimizerTickResult['executed'] = []
  const alerts: OptimizerTickResult['alerts'] = []
  const escalations: OptimizerTickResult['escalations'] = []
  const recommendations: OptimizerTickResult['recommendations'] = []
  const learningDelta: string[] = []

  const learning = readLearning(campaignId)

  // Qavat 2 — kritik
  if (stats.roas < 1.0) {
    alerts.push({ level: 'critical', message: 'ROAS < 1.0 — pause + targetolog darhol (qavat 2).' })
    await execute('pause_campaign')
    executed.push({ kind: 'pause_campaign', detail: 'Kritik ROAS' })
    await notify('Kampaniya pause: ROAS kritik past.')
    learningDelta.push('pause: roas<1')
  }

  if (stats.spend >= 50 && stats.purchases === 0) {
    alerts.push({ level: 'critical', message: "Spend $50+, 0 purchase — auto-pause." })
    await execute('pause_campaign')
    executed.push({ kind: 'pause_zero_conv', detail: `spend ${stats.spend}` })
    await notify('0 purchase — pause.')
    learningDelta.push('pause: spend no conv')
  }

  // Qavat 1 — agent qoidalari
  if (stats.roas < 2 && stats.prevRoas < 2 && stats.roas >= 1) {
    if (prefs.roasDrop === 'auto_reduce_budget') {
      await execute('decrease_budget', 20)
      executed.push({ kind: 'decrease_budget', detail: '20%' })
      await notify(`Budget 20% kamaydi, ROAS ${stats.roas}`)
      learningDelta.push('budget -20%: roas<2 x2')
    } else {
      recommendations.push({
        message: `ROAS ${stats.roas} ikki marta <2 — budgetni 20% kamaytirishni tavsiya qilaman (tasdiq).`,
      })
    }
  }

  if (stats.ctr < 1 && stats.frequency > 2.5) {
    if (prefs.creativeFatigue === 'auto_rotate') {
      await execute('rotate_creative')
      executed.push({ kind: 'rotate_creative', detail: `CTR ${stats.ctr}% freq ${stats.frequency}` })
      await notify('Kreativ charchadi, zaxira yoqildi.')
      learningDelta.push('creative rotate')
    } else {
      recommendations.push({ message: 'CTR past, frequency yuqori — kreativ almashtirishni tavsiya.' })
    }
  }

  if (stats.cpm > 5) {
    recommendations.push({ message: `CPM $${stats.cpm.toFixed(2)} — audience kengaytirish tavsiyasi.` })
    alerts.push({ level: 'warn', message: 'Auction bosimi: CPM yuqori.' })
  }

  if (stats.frequency > 3) {
    recommendations.push({ message: 'Frequency > 3 — yangi kreativ yuklash (Creative fatigue).' })
  }

  if (learningDelta.length) {
    appendLearning(campaignId, learningDelta.join(' | '), false)
  }

  const learningAfter = readLearning(campaignId)
  if (learningAfter.failedActions >= 3) {
    escalations.push('Marketplace ticket: mutaxassis 1 soat ichida (aks holda refund).')
  }

  return {
    campaignId,
    executed,
    alerts,
    escalations,
    recommendations,
    learningDelta,
  }
}

export const OPTIMIZER_INTERVALS = {
  agentHours: 2,
  smartAlertsRealtime: true,
  specialistSlaHours: 1,
} as const
