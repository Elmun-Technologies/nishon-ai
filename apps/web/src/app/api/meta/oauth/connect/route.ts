import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/meta/oauth/connect?workspaceId=<id>
 *
 * Redirects the user to the Meta OAuth dialog to grant ads_read / ads_management
 * permissions. The workspaceId is encoded in the `state` param so the callback
 * route knows which workspace to attach the token to.
 */
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
  }

  const appId = process.env.META_APP_ID
  if (!appId) {
    return NextResponse.json({ error: 'META_APP_ID not configured' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? ''
  const redirectUri = `${appUrl}/api/meta/oauth`

  const params = new URLSearchParams({
    client_id:     appId,
    redirect_uri:  redirectUri,
    scope:         'ads_read,ads_management,business_management',
    state:         workspaceId,
    response_type: 'code',
  })

  const metaOAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  return NextResponse.redirect(metaOAuthUrl)
}
