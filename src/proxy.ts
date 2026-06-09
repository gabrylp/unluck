import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/gate', '/api/gate']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = publicPaths.some((p) => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  const auth = request.cookies.get('unluck-auth')
  if (auth?.value === '1') return NextResponse.next()

  return NextResponse.redirect(new URL('/gate', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
