import { IWorkspace } from './workspace.types'

export enum UserPlan {
  FREE = 'free',
  STARTER = 'starter',
  GROWTH = 'growth',
  PRO = 'pro',
  AGENCY = 'agency',
}

export interface IUser {
  id: string
  email: string
  name: string
  plan: UserPlan
  isEmailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IUserWithWorkspaces extends IUser {
  workspaces: IWorkspace[]
}
