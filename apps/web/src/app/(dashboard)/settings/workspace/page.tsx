import { redirect } from 'next/navigation'

export default async function WorkspaceSettingsIndexPage() {
  redirect('/settings/workspace/ad-accounts')
}
