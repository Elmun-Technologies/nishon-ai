/**
 * Runtime: har soat (cron / worker) agent tekshiruvi — MVP da stub.
 * Production: Bull / Cloud Scheduler + alohida worker jarayoni.
 */

export type ExecutorTickResult = {
  agentId: string
  ranAt: string
  suggestions: string[]
  /** Hech qachon avtomatik pause — faqat tavsiya */
  requiresHumanApproval: true
}

export function describeExecutorSchedule(): string {
  return 'Har 1 soat: metrikalarni o‘qiydi → qoidalarga qarshi tekshiradi → tavsiya xabar (tasdiq kutadi).'
}

export function mockExecutorTick(agentId: string): ExecutorTickResult {
  return {
    agentId,
    ranAt: new Date().toISOString(),
    suggestions: [
      'ROAS 1.8 — byudjetni 20% kamaytirishni tavsiya qilaman (tasdiq kerak).',
      'Seshanba CPA odatdagidan past — shu kuni scaling tavsiyasi.',
    ],
    requiresHumanApproval: true,
  }
}
