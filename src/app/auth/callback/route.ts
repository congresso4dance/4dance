import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Role-based redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const adminSupabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { cookies: { getAll() { return [] }, setAll() {} } }
        );

        const { data: profile } = await adminSupabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const role = (profile?.role || 'user').toLowerCase();
        const adminRoles = ['owner', 'admin', 'editor', 'assistant'];

        if (adminRoles.includes(role)) {
          return NextResponse.redirect(`${origin}/admin`);
        } else if (role === 'photographer') {
          return NextResponse.redirect(`${origin}/portal-fotografo`);
        } else if (role === 'producer') {
          return NextResponse.redirect(`${origin}/portal-produtor`);
        }
      }

      return NextResponse.redirect(`${origin}/minha-conta`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
