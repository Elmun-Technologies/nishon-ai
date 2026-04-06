import { create } from 'zustand'
import type { RetargetingCampaign, RetargetingWizardState, Platform, BudgetType } from '@/types/retargeting'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: RetargetingCampaign[] = [
  {
    id: 'camp_1',
    name: 'Savatga qo\'shgan — Meta',
    audienceId: 'aud_6',
    funnelStage: 'retargeting',
    platform: 'meta',
    budgetType: 'ABO',
    dailyBudget: 25,
    totalBudget: 750,
    status: 'active',
    startDate: '2024-01-15',
    createdAt: '2024-01-14',
  },
  {
    id: 'camp_2',
    name: 'Yuqori niyatli — Google',
    audienceId: 'aud_5',
    funnelStage: 'retargeting',
    platform: 'google',
    budgetType: 'CBO',
    dailyBudget: 40,
    totalBudget: 1200,
    status: 'active',
    startDate: '2024-01-10',
    createdAt: '2024-01-09',
  },
  {
    id: 'camp_3',
    name: 'VIP mijozlar — Retention',
    audienceId: 'aud_9',
    funnelStage: 'retention',
    platform: 'meta',
    budgetType: 'ABO',
    dailyBudget: 15,
    totalBudget: 450,
    status: 'active',
    startDate: '2024-01-01',
    createdAt: '2023-12-31',
  },
  {
    id: 'camp_4',
    name: 'Bir necha marta kirganlar',
    audienceId: 'aud_7',
    funnelStage: 'retargeting',
    platform: 'tiktok',
    budgetType: 'ABO',
    dailyBudget: 20,
    totalBudget: 600,
    status: 'paused',
    startDate: '2024-01-11',
    createdAt: '2024-01-10',
  },
]

const WIZARD_INITIAL: RetargetingWizardState = {
  step: 1,
  selectedAudience: null,
  selectedPlatforms: [],
  budgetType: 'ABO',
  dailyBudget: 20,
  startDate: '',
  endDate: '',
  campaignName: '',
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface RetargetingStore {
  campaigns: RetargetingCampaign[]
  wizard: RetargetingWizardState
  isLoading: boolean

  // Campaign actions
  addCampaign: (campaign: Omit<RetargetingCampaign, 'id' | 'createdAt'>) => void
  updateCampaignStatus: (id: string, status: RetargetingCampaign['status']) => void
  getCampaignsByAudience: (audienceId: string) => RetargetingCampaign[]

  // Wizard actions
  setWizardStep: (step: RetargetingWizardState['step']) => void
  updateWizard: (data: Partial<RetargetingWizardState>) => void
  resetWizard: () => void
  launchCampaign: () => void
}

export const useRetargetingStore = create<RetargetingStore>((set, get) => ({
  campaigns: MOCK_CAMPAIGNS,
  wizard: WIZARD_INITIAL,
  isLoading: false,

  addCampaign: (data) => {
    const newCampaign: RetargetingCampaign = {
      ...data,
      id: `camp_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    }
    set((s) => ({ campaigns: [newCampaign, ...s.campaigns] }))
  },

  updateCampaignStatus: (id, status) =>
    set((s) => ({
      campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, status } : c)),
    })),

  getCampaignsByAudience: (audienceId) =>
    get().campaigns.filter((c) => c.audienceId === audienceId),

  setWizardStep: (step) =>
    set((s) => ({ wizard: { ...s.wizard, step } })),

  updateWizard: (data) =>
    set((s) => ({ wizard: { ...s.wizard, ...data } })),

  resetWizard: () => set({ wizard: WIZARD_INITIAL }),

  launchCampaign: () => {
    const { wizard, addCampaign, resetWizard } = get()
    if (!wizard.selectedAudience || wizard.selectedPlatforms.length === 0) return

    wizard.selectedPlatforms.forEach((platform) => {
      addCampaign({
        name: wizard.campaignName || `${wizard.selectedAudience!.name} — ${platform}`,
        audienceId: wizard.selectedAudience!.id,
        funnelStage: wizard.selectedAudience!.funnelStage,
        platform,
        budgetType: wizard.budgetType,
        dailyBudget: wizard.dailyBudget,
        totalBudget: wizard.dailyBudget * 30,
        status: 'active',
        startDate: wizard.startDate || new Date().toISOString().split('T')[0],
        endDate: wizard.endDate || undefined,
      })
    })

    resetWizard()
  },
}))
