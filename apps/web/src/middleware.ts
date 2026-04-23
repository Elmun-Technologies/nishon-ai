import { type NextRequest, NextResponse } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/platforms', '/campaigns', '/performance', '/reporting', '/reports',
  '/top-ads', '/creative-audit', '/creative-scorer', '/creative-hub', '/landing-page', '/auto-optimization',
  '/automation', '/retargeting', '/retarget', '/roi-calculator', '/simulation', '/ai-agents', '/budget',
  '/settings', '/wizard', '/team', '/audience', '/audiences', '/launch', '/ad-library', '/platform-architecture']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
  if (!isProtected) return NextResponse.next()

  const sessionCookie = request.cookies.get('adspectr_auth')
  if (sessionCookie?.value === '1') return NextResponse.next()

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
