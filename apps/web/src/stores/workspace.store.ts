import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlatformId } from '@/components/platforms/PlatformSelector'

interface User {
  id: string
  email: string
  name: string
  plan: string
}

interface Workspace {
  id: string
  name: string
  industry: string
  monthlyBudget: number
  goal: string
  autopilotMode: string
  isOnboardingComplete: boolean
  aiStrategy: any | null
}

interface WorkspaceStore {
  user: User | null
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  accessToken: string | null
  isLoading: boolean
  /** Platforms selected by user for campaign management */
  selectedPlatforms: PlatformId[]

  setUser: (user: User | null) => void
  setCurrentWorkspace: (workspace: Workspace | null) => void
  setWorkspaces: (workspaces: Workspace[]) => void
  setAccessToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  setSelectedPlatforms: (platforms: PlatformId[]) => void
  logout: () => void
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      user: null,
      currentWorkspace: null,
      workspaces: [],
      accessToken: null,
      isLoading: false,
      selectedPlatforms: [],

      setUser: (user) => set({ user }),
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      setAccessToken: (token) => {
        set({ accessToken: token })
        if (token) localStorage.setItem('nishon_access_token', token)
        else localStorage.removeItem('nishon_access_token')
      },
      setLoading: (isLoading) => set({ isLoading }),
      setSelectedPlatforms: (selectedPlatforms) => set({ selectedPlatforms }),
      logout: () => {
        localStorage.removeItem('nishon_access_token')
        localStorage.removeItem('nishon_refresh_token')
        set({ user: null, currentWorkspace: null, workspaces: [], accessToken: null, selectedPlatforms: [] })
      },
    }),
    {
      name: 'nishon-workspace-store',
      partialize: (state) => ({
        user: state.user,
        currentWorkspace: state.currentWorkspace,
        accessToken: state.accessToken,
        selectedPlatforms: state.selectedPlatforms,
      }),
    },
  ),
)