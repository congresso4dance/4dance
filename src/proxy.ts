import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * 🔒 SEGURANÇA ELITE: Content Security Policy (CSP)
 * Previne XSS, Clickjacking e outras injeções maliciosas.
 */
function generateCSP() {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.supabase.co https://*.stripe.com;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https://*.supabase.co https://*.stripe.com https://api.google.com;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  return { cspHeader, nonce }
}

// 🔒 SEGURANÇA ELITE: Rate Limiting Simples (In-Memory Fallback)
// Em produção, deve-se usar Redis/Upstash para escalabilidade serverless.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

function isRateLimited(ip: string) {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minuto
  const maxRequests = 100 // Limite por IP

  const record = rateLimitMap.get(ip) || { count: 0, lastReset: now }

  if (now - record.lastReset > windowMs) {
    record.count = 1
    record.lastReset = now
  } else {
    record.count++
  }

  rateLimitMap.set(ip, record)
  return record.count > maxRequests
}

export default async function proxy(request: NextRequest) {
  const ip = request.ip || 'anonymous'
  
  // 1. 🔒 Rate Limiting
  if (isRateLimited(ip)) {
    return new NextResponse('Muitas requisições. Tente novamente em 1 minuto.', { status: 429 })
  }

  // 2. 🔒 Gerar CSP
  const { cspHeader, nonce } = generateCSP()
  
  // Inicializar resposta com Headers de Segurança (Lei 15)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Headers de Segurança Padrão
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Proteger rotas /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Fetch Role bypassing RLS (Server-side only)
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {}
        }
      }
    )

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'user'

    // Regras de Acesso por Role (Hierarquia Elite)
    const allowedRoles = ['owner', 'admin', 'editor', 'assistant']
    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Apenas Owner e Admin entram no CRM e Recuperação
    if (request.nextUrl.pathname.startsWith('/admin/crm') || 
        request.nextUrl.pathname.startsWith('/admin/recovery')) {
      if (role !== 'owner' && role !== 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }

    // Apenas Owner entra em Configurações
    if (request.nextUrl.pathname.startsWith('/admin/settings')) {
      if (role !== 'owner') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  }

  // 🔒 Proteger rotas /portal-fotografo
  if (request.nextUrl.pathname.startsWith('/portal-fotografo')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return [] }, setAll() {} } }
    )

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'user'

    const allowedRoles = ['PHOTOGRAPHER', 'owner', 'admin', 'editor']
    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // 🔒 Proteger rotas /portal-produtor
  if (request.nextUrl.pathname.startsWith('/portal-produtor')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return [] }, setAll() {} } }
    )

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'user'

    const allowedRoles = ['PRODUCER', 'owner', 'admin']
    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

