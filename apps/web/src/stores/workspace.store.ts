import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlatformId } from '@/components/platforms/PlatformSelector'
import { clearAuthTokens, setAccessToken as persistAccessTokenToStorage } from '@/lib/auth-storage'

interface User {
  id: string
  email: string
  name: string
  plan: string
  /** ISO end of FREE trial from API; missing on very old persisted sessions */
  trialEndsAt?: string | null
  isAdmin?: boolean
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
  targetAudience?: string | null
  targetLocation?: string | null
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
  /** Merge fields from /auth/me or billing without dropping other user fields */
  patchUser: (patch: Partial<User>) => void
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
      patchUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : state.user,
        })),
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      setAccessToken: (token) => {
        set({ accessToken: token })
        persistAccessTokenToStorage(token)
      },
      setLoading: (isLoading) => set({ isLoading }),
      setSelectedPlatforms: (selectedPlatforms) => set({ selectedPlatforms }),
      logout: () => {
        clearAuthTokens()
        set({ user: null, currentWorkspace: null, workspaces: [], accessToken: null, selectedPlatforms: [] })
      },
    }),
    {
      name: 'adspectr-workspace-store',
      partialize: (state) => ({
        user: state.user,
        currentWorkspace: state.currentWorkspace,
        accessToken: state.accessToken,
        selectedPlatforms: state.selectedPlatforms,
      }),
    },
  ),
)