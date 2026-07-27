import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/storage-helper';
import { PHOTO_STORAGE_BUCKET } from '@/utils/storage-constants';
import { deleteFromR2 } from '@/utils/r2-storage';

export async function POST(req: Request) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabaseUser
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role?.toLowerCase();
  if (!['admin', 'owner', 'photographer', 'editor'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { paths } = await req.json() as { paths: string[] };
  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ error: 'Missing paths' }, { status: 400 });
  }

  // Tenta remover do R2 (fotos novas) e do Supabase Storage legado (fotos
  // ainda não migradas). Um objeto ausente em um dos dois não é erro.
  const results = await Promise.allSettled([
    deleteFromR2(paths),
    (async () => {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.storage.from(PHOTO_STORAGE_BUCKET).remove(paths);
      if (error) throw error;
    })(),
  ]);

  const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failures.length === results.length) {
    return NextResponse.json({ error: failures[0].reason?.message || 'Falha ao remover arquivos' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
