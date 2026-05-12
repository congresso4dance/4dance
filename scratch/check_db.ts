import { getSupabaseAdmin } from './src/utils/storage-helper';

async function test() {
  const supabase = getSupabaseAdmin();
  const { data: events } = await supabase.from('events').select('cover_url').limit(5);
  console.log('Cover URLs in DB:', events);
}

test();
