import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const KEEP_IDS = [
  'f0e29d81-b3b8-4983-a884-e2b4637db9f4', // Reduto
  'c512d617-475a-43aa-b596-15ab2acfece2', // Reduto da Gafieira - Bday Ariel Muniz
  'e274454f-4b54-45c1-8082-be46f7184211', // A HIstoria de quem dança - Marcelo Amorim
  'e8e865f4-7412-4f1b-aaad-0b1ad54dd1d8', // Aniversario R2
  'da8845ad-04a3-46ca-be17-e4f1bb18a273', // Baile do Altobelli 2
  'b8fe7bf5-2738-4504-abb2-15a5dda70ff9', // LambaSwag Domingo
  '3f16493b-9159-4694-bf53-6ac0bfb7e578', // LambaSwag
  'a679e041-59c9-4d74-b9d2-1a5bf57bc313', // Congresso Gerações
  'd61fb0f0-c6b6-4741-aba2-2c7415eda90a', // Aniversario Planet 2025
  '3d002919-f2c3-4f8b-8cd3-59950f14deb7', // Samba ao Quadrado
  'a507c1b6-a649-42d0-86f1-4ce9d2d97897', // Dançart - Casa de Vidro
  '5e5816dc-cbed-4d1f-81ae-953c35a99f95', // Academia Olimpo - Ultimo Baile
  '28a04418-251f-46e6-bd3e-646a429c4e39', // Forró a Bordo - 2024
  'f5860735-d6af-444a-a5b5-09e94e8d142b', // Q Baile - 23 de novembo
]

function extractStoragePath(url) {
  const match = url?.match(/\/public\/photos\/(.+)$/)
  return match ? match[1] : null
}

async function fetchAllPhotos(eventIds) {
  const PAGE = 1000
  let allPhotos = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('photos')
      .select('id, thumbnail_url, full_res_url')
      .in('event_id', eventIds)
      .range(from, from + PAGE - 1)
    if (error) throw error
    allPhotos = allPhotos.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return allPhotos
}

async function main() {
  console.log('=== 4Dance Event Cleanup ===\n')

  // 1. Get all events to delete
  const { data: eventsToDelete, error: evErr } = await supabase
    .from('events')
    .select('id, title')
    .not('id', 'in', `(${KEEP_IDS.join(',')})`)
  if (evErr) { console.error('Error fetching events:', evErr); process.exit(1) }

  console.log(`Events to delete: ${eventsToDelete.length}`)
  console.log(`Events to keep:   ${KEEP_IDS.length}\n`)

  const deleteEventIds = eventsToDelete.map(e => e.id)
  if (deleteEventIds.length === 0) { console.log('Nothing to delete.'); return }

  // 2. Fetch ALL photos (paginated)
  console.log('Fetching all photos (paginated)...')
  const photos = await fetchAllPhotos(deleteEventIds)
  console.log(`Photos to delete: ${photos.length}`)
  const photoIds = photos.map(p => p.id)

  // 3. Delete storage files in batches of 100
  const storagePaths = [...new Set(
    photos.flatMap(p => [
      extractStoragePath(p.thumbnail_url),
      extractStoragePath(p.full_res_url),
    ].filter(Boolean))
  )]
  console.log(`\nStep 1/4 — Deleting ${storagePaths.length} storage files...`)
  for (let i = 0; i < storagePaths.length; i += 100) {
    const batch = storagePaths.slice(i, i + 100)
    const { error } = await supabase.storage.from('photos').remove(batch)
    if (error) console.warn('Storage warning:', error.message)
    process.stdout.write(`\r  ${Math.min(i + 100, storagePaths.length)}/${storagePaths.length}`)
  }
  console.log()

  // 4. Delete photo_faces in batches of 200
  if (photoIds.length > 0) {
    console.log('Step 2/4 — Deleting photo_faces...')
    for (let i = 0; i < photoIds.length; i += 200) {
      const batch = photoIds.slice(i, i + 200)
      const { error } = await supabase.from('photo_faces').delete().in('photo_id', batch)
      if (error) console.warn('photo_faces warning:', error.message)
      process.stdout.write(`\r  ${Math.min(i + 200, photoIds.length)}/${photoIds.length}`)
    }
    console.log()

    // 5. Delete photos in batches of 200
    console.log('Step 3/4 — Deleting photos records...')
    for (let i = 0; i < photoIds.length; i += 200) {
      const batch = photoIds.slice(i, i + 200)
      const { error } = await supabase.from('photos').delete().in('id', batch)
      if (error) console.warn('photos warning:', error.message)
      process.stdout.write(`\r  ${Math.min(i + 200, photoIds.length)}/${photoIds.length}`)
    }
    console.log()
  }

  // 6. Delete events one by one to avoid statement timeout
  console.log(`Step 4/4 — Deleting ${deleteEventIds.length} events one by one...`)
  let deleted = 0
  let failed = []
  for (const id of deleteEventIds) {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      failed.push(id)
      process.stdout.write('x')
    } else {
      deleted++
      process.stdout.write('.')
    }
  }
  console.log()

  if (failed.length > 0) {
    console.warn(`\nFailed to delete ${failed.length} events (may have remaining FK constraints):`)
    failed.forEach(id => console.warn(' -', id))
  }

  // 7. Final count
  const { data: remaining } = await supabase.from('events').select('id, title').order('title')
  console.log(`\n=== Done! Deleted: ${deleted} | Remaining: ${remaining.length} ===`)
  remaining.forEach(e => console.log(' ✓', e.title))
}

main().catch(console.error)
