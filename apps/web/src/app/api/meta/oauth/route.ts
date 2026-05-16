import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encryptToken } from '@/lib/token-crypto'

export const runtime = 'nodejs'

const GRAPH_API = 'https://graph.facebook.com/v19.0'

/**
 * GET /api/meta/oauth?code=<code>&state=<workspaceId>
 *
 * Meta OAuth callback. Exchanges the short-lived code for a long-lived token
 * (valid ~60 days), fetches the user's ad accounts, then upserts an AdAccount
 * row per account. Redirects to /dashboard on success.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code        = searchParams.get('code')
  const workspaceId = searchParams.get('state')
  const error       = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? ''

  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard?meta_error=${encodeURIComponent(error)}`)
  }
  if (!code || !workspaceId) {
    return NextResponse.redirect(`${appUrl}/dashboard?meta_error=missing_params`)
  }

  const appId     = process.env.META_APP_ID ?? ''
  const appSecret = process.env.META_APP_SECRET ?? ''
  const redirectUri = `${appUrl}/api/meta/oauth`

  try {
    // ── Step 1: Exchange code for short-lived token ───────────────────────────
    const tokenRes = await fetch(
      `${GRAPH_API}/oauth/access_token?` +
        new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }).toString(),
    )
    const tokenJson = await tokenRes.json()
    if (!tokenJson.access_token) {
      throw new Error(tokenJson.error?.message ?? 'Token exchange failed')
    }
    const shortToken: string = tokenJson.access_token

    // ── Step 2: Exchange for long-lived token (~60 days) ─────────────────────
    const llRes = await fetch(
      `${GRAPH_API}/oauth/access_token?` +
        new URLSearchParams({
          grant_type:        'fb_exchange_token',
          client_id:         appId,
          client_secret:     appSecret,
          fb_exchange_token: shortToken,
        }).toString(),
    )
    const llJson = await llRes.json()
    const longToken: string = llJson.access_token ?? shortToken
    const expiresIn: number = llJson.expires_in ?? 5184000 // 60 days default
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000)

    const encryptedToken = encryptToken(longToken)

    // ── Step 3: Fetch ad accounts ─────────────────────────────────────────────
    const accountsRes = await fetch(
      `${GRAPH_API}/me/adaccounts?fields=id,name,currency,timezone_name&access_token=${longToken}`,
    )
    const accountsJson = await accountsRes.json()
    const accounts: Array<{ id: string; name: string; currency: string; timezone_name?: string }> =
      accountsJson.data ?? []

    // ── Step 4: Upsert AdAccount rows ─────────────────────────────────────────
    for (const acc of accounts) {
      await prisma.adAccount.upsert({
        where: { workspaceId_provider_externalId: { workspaceId, provider: 'meta', externalId: acc.id } },
        update: { name: acc.name, currency: acc.currency, timezone: acc.timezone_name, accessToken: encryptedToken, tokenExpiry },
        create: {
          workspaceId,
          provider:    'meta',
          externalId:  acc.id,
          name:        acc.name,
          currency:    acc.currency,
          timezone:    acc.timezone_name,
          accessToken: encryptedToken,
          tokenExpiry,
        },
      })
    }

    return NextResponse.redirect(`${appUrl}/dashboard?meta_connected=1`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.redirect(`${appUrl}/dashboard?meta_error=${encodeURIComponent(msg)}`)
  }
}
