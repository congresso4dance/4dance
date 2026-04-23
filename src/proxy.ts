import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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
              headers: request.headers,
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

    // Verificar Role no Banco de Dados
    const { data: profile } = await supabase
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

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
