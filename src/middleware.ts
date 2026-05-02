import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function generateCSP() {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.supabase.co https://*.stripe.com;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https://*.supabase.co https://*.stripe.com https://www.google-analytics.com https://region1.google-analytics.com;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()
  return { cspHeader, nonce }
}

export async function middleware(request: NextRequest) {
  const { cspHeader, nonce } = generateCSP()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  // Security headers
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  // Supabase session refresh — this is what keeps the user logged in
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: requestHeaders } })
          // Re-apply security headers after response recreation
          response.headers.set('Content-Security-Policy', cspHeader)
          response.headers.set('X-Content-Type-Options', 'nosniff')
          response.headers.set('X-Frame-Options', 'DENY')
          response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This call refreshes the session cookie — critical for keeping users logged in
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Protect /admin routes
  if (path.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )
    const { data: profile } = await adminSupabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role || ''
    const adminRoles = ['owner', 'admin', 'editor', 'assistant']
    if (!adminRoles.includes(role)) return NextResponse.redirect(new URL('/', request.url))
  }

  // Protect /portal-fotografo routes
  if (path.startsWith('/portal-fotografo')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )
    const { data: profile } = await adminSupabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role || ''
    if (!['PHOTOGRAPHER', 'owner', 'admin', 'editor'].includes(role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Protect /portal-produtor routes
  if (path.startsWith('/portal-produtor')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )
    const { data: profile } = await adminSupabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role || ''
    if (!['PRODUCER', 'owner', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Protect client area routes
  if (
    path.startsWith('/minha-conta') ||
    path.startsWith('/minhas-fotos') ||
    path.startsWith('/meus-pedidos')
  ) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
