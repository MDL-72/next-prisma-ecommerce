import { verifyJWT } from '@/lib/jwt'
import { getErrorResponse } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

// Put real admin user IDs here (from Prisma Studio)
const ADMIN_USER_IDS = new Set<string>([
   // 'cl_admin_123',
])

const isAdminFromPayload = (p?: { isAdmin?: boolean; role?: string }) =>
   Boolean(p?.isAdmin || p?.role === 'ADMIN')

export async function middleware(req: NextRequest) {
   if (req.nextUrl.pathname.startsWith('/api/auth')) return NextResponse.next()

   const isAPI = req.nextUrl.pathname.startsWith('/api')
   const needsAdmin =
      req.nextUrl.pathname.startsWith('/reports') ||
      req.nextUrl.pathname.startsWith('/api/reports')

   // ---- DEV BYPASS ----
   const isDevBypass =
      process.env.NODE_ENV !== 'production' &&
      process.env.DEV_AUTH_BYPASS === 'true'

   if (isDevBypass) {
      const devAdminId = process.env.DEV_ADMIN_ID || 'dev-admin-id'
      const devIsAdmin =
         (process.env.DEV_IS_ADMIN ?? 'true').toLowerCase() === 'true'
      // if trying to access an admin page but devIsAdmin=false → redirect/403
      if (needsAdmin && !devIsAdmin) {
         return isAPI
            ? getErrorResponse(403, 'FORBIDDEN')
            : NextResponse.redirect(new URL('/', req.url))
      }

      // otherwise, forward headers + set cookies
      const h = new Headers(req.headers)
      h.set('X-USER-ID', devAdminId)
      h.set('X-USER-ADMIN', String(devIsAdmin))

      const res = NextResponse.next({ request: { headers: h } })
      res.cookies.set('token', 'dev-bypass', { httpOnly: true, path: '/' })
      res.cookies.set('logged-in', 'true', { path: '/' })
      res.cookies.set('is-admin', String(devIsAdmin), {
         httpOnly: false,
         path: '/',
         sameSite: 'lax',
         secure: process.env.NODE_ENV === 'production',
      })
      return res
   }
   // --------------------

   const getToken = () => {
      if (req.cookies.has('token')) return req.cookies.get('token')!.value
      const auth = req.headers.get('Authorization')
      return auth?.startsWith('Bearer ') ? auth.slice(7) : undefined
   }

   if (!process.env.JWT_SECRET_KEY) {
      console.error('JWT secret key is missing')
      return getErrorResponse(500, 'Internal Server Error')
   }

   const token = getToken()
   if (!token) {
      return isAPI
         ? getErrorResponse(401, 'INVALID TOKEN')
         : NextResponse.redirect(new URL('/login', req.url))
   }

   const h = new Headers(req.headers)
   let sub = ''
   let adminByClaim = false

   try {
      const payload = await verifyJWT<{ sub: string; isAdmin?: boolean; role?: string }>(token)
      sub = payload.sub
      adminByClaim = isAdminFromPayload(payload)
      h.set('X-USER-ID', sub)
   } catch {
      if (isAPI) return getErrorResponse(401, 'UNAUTHORIZED')
      const redirect = NextResponse.redirect(new URL('/login', req.url))
      redirect.cookies.delete('token')
      redirect.cookies.delete('logged-in')
      redirect.cookies.delete('is-admin')
      return redirect
   }

   const isAdmin = ADMIN_USER_IDS.has(sub) || adminByClaim
   h.set('X-USER-ADMIN', String(isAdmin))

   // Protect /reports (and /api/reports/*)
   if (needsAdmin && !isAdmin) {
      return isAPI
         ? getErrorResponse(403, 'FORBIDDEN')
         : NextResponse.redirect(new URL('/', req.url))
   }

   const res = NextResponse.next({ request: { headers: h } })
   res.cookies.set('is-admin', String(isAdmin), { httpOnly: false, path: '/' })
   return res
}

export const config = {
   matcher: [
      '/',
      '/products/:path*',
      '/banners/:path*',
      '/orders/:path*',
      '/categories/:path*',
      '/payments/:path*',
      '/codes/:path*',
      '/users/:path*',
      '/reports/:path*',
      '/api/:path*',
   ],
}
