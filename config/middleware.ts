import { NextRequest, NextResponse } from 'next/server'
import SecurityMiddleware from '@/lib/security'

export function middleware(request: NextRequest) {
  // Apply security headers to all responses
  const response = NextResponse.next()
  
  // Check rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!SecurityMiddleware.checkRateLimit(request, 100, 15 * 60 * 1000)) {
      SecurityMiddleware.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        path: request.nextUrl.pathname
      }, request)
      
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '900' // 15 minutes
        }
      })
    }
  }
  
  // Apply security headers and return
  return SecurityMiddleware.applySecurityHeaders(response)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
