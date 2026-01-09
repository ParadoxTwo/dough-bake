import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  // Handle CORS preflight requests (likely from browser extensions or services)
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    
    // Only allow CORS for same-origin or known domains
    const allowedOrigins: string[] = [
      process.env.NEXT_PUBLIC_SITE_URL,
      'https://staging.doughandbake.store',
      'https://doughandbake.store',
    ].filter((url): url is string => typeof url === 'string' && url.length > 0)

    const response = new NextResponse(null, { status: 200 })
    
    // Only set CORS headers if origin matches or is null (same-origin)
    if (!origin || allowedOrigins.some(allowed => origin.includes(allowed))) {
      response.headers.set('Access-Control-Allow-Origin', origin ?? '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      response.headers.set('Access-Control-Max-Age', '86400')
    }
    
    return response
  }

  // Update Supabase session
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - static files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
