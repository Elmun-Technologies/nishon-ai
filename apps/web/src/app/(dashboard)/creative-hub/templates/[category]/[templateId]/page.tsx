'use client'

export const dynamic = 'force-dynamic'

import { useParams } from 'next/navigation'
import { CreativeHubRedirect, type CreativeHubTab } from '../../../components/CreativeHubRedirect'

export default function Page() {
  const params = useParams()
  const category = typeof params?.category === 'string' ? params.category : ''
  const tab: CreativeHubTab | undefined =
    category.includes('social') || category.includes('ugc') ? 'ugc' : 'image'

  return <CreativeHubRedirect tab={tab} />
}
