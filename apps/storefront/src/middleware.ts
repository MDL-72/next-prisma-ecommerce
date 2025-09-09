import { verifyJWT } from '@/lib/jwt'
import { getErrorResponse } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
   if (req.nextUrl.pathname.startsWith('/api/auth')) return NextResponse.next()

      console.log('devUserId', process.env.DEV_AUTH_BYPASS)
      // Development auth bypass: simulate a logged-in user without OTP/JWT
   if (process.env.DEV_AUTH_BYPASS === 'true') {
      const devUserId = process.env.DEV_USER_ID
      console.log('devUserId', devUserId)
      if (devUserId) {
         const res = NextResponse.next()
         res.headers.set('X-USER-ID', devUserId)
         // Make client-side hooks treat the session as logged in
         res.cookies.set('logged-in', 'true')
         // Provide a dummy token cookie to avoid redirects on protected pages
         if (!req.cookies.has('token')) {
            res.cookies.set('token', 'dev-bypass-token')
         }
         return res
      }
   }

   function isTargetingAPI() {
      return req.nextUrl.pathname.startsWith('/api')
   }

   function getToken() {
      let token: string | undefined

      if (req.cookies.has('token')) {
         token = req.cookies.get('token')?.value
      } else if (req.headers.get('Authorization')?.startsWith('Bearer ')) {
         token = req.headers.get('Authorization')?.substring(7)
      }

      return token
   }

   const token = getToken()

   if (!token) {
      if (isTargetingAPI()) return getErrorResponse(401, 'INVALID TOKEN')

      return NextResponse.redirect(new URL('/login', req.url))
   }

   const response = NextResponse.next()

   try {
      const { sub } = await verifyJWT<{ sub: string }>(token)
      response.headers.set('X-USER-ID', sub)
   } catch (error) {
      if (isTargetingAPI()) {
         return getErrorResponse(401, 'UNAUTHORIZED')
      }

      const redirect = NextResponse.redirect(new URL(`/login`, req.url))
      redirect.cookies.delete('token')
      redirect.cookies.delete('logged-in')
      return redirect
   }

   return response
}

export const config = {
   matcher: ['/profile/:path*', '/api/:path*'],
}
