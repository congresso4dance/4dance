const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pxvcgautbaobysvhyfzi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dmNnYXV0YmFvYnlzdmh5ZnppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYzMTkxMCwiZXhwIjoyMDkyMjA3OTEwfQ.RcJIPLe1bQZSjom6ZgCc6QUrauen3qGArq6lX4TIuPw'
);

async function runAudit() {
  console.log('--- Database Audit ---');

  // 1. Total photos
  const { count: totalPhotos } = await supabase.from('photos').select('*', { count: 'exact', head: true });
  console.log('Total Photos in DB:', totalPhotos);

  // 2. Fetch all unique event_ids from photos
  const { data: photoEvents } = await supabase.from('photos').select('event_id');
  const counts = {};
  photoEvents.forEach(p => {
    counts[p.event_id] = (counts[p.event_id] || 0) + 1;
  });

  const sortedEvents = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log('\nTop 10 Events by Photos:');
  
  for (const [eventId, count] of sortedEvents) {
    const { data: event } = await supabase.from('events').select('slug, title').eq('id', eventId).single();
    console.log(`- ${event?.slug || 'unknown'} (${event?.title || 'No Title'}): ${count} photos`);
  }

  // 3. Check specific Alpha Elite event
  const { data: alpha } = await supabase.from('events').select('id, slug').eq('slug', 'alpha-elite').single();
  if (alpha) {
    console.log(`\nAlpha Elite ID: ${alpha.id}`);
    const { count: alphaPhotos } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('event_id', alpha.id);
    console.log(`Alpha Elite Photos: ${alphaPhotos}`);
  } else {
    console.log('\nAlpha Elite slug not found in database.');
  }
}

runAudit();
