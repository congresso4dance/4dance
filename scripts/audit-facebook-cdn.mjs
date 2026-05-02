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

const FACEBOOK_OR_FILTER = [
  'thumbnail_url.ilike.%fbcdn%',
  'thumbnail_url.ilike.%fbsbx%',
  'thumbnail_url.ilike.%scontent.%',
  'full_res_url.ilike.%fbcdn%',
  'full_res_url.ilike.%fbsbx%',
  'full_res_url.ilike.%scontent.%'
].join(',')

const SUPABASE_OR_FILTER = [
  'thumbnail_url.ilike.%supabase.co/storage/v1/object/public/photos%',
  'full_res_url.ilike.%supabase.co/storage/v1/object/public/photos%'
].join(',')

async function countPhotos(label, filter) {
  let query = supabase.from('photos').select('id', {
    count: 'exact',
    head: true
  })

  if (filter) {
    query = query.or(filter)
  }

  const { count, error } = await query

  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }

  return count ?? 0
}

async function main() {
  const total = await countPhotos('total photos')
  const facebook = await countPhotos(
    'facebook cdn photos',
    FACEBOOK_OR_FILTER
  )
  const supabaseStorage = await countPhotos(
    'supabase storage photos',
    SUPABASE_OR_FILTER
  )

  const unknown = Math.max(total - facebook - supabaseStorage, 0)
  const facebookPct = total === 0 ? 0 : (facebook / total) * 100
  const supabasePct = total === 0 ? 0 : (supabaseStorage / total) * 100

  console.log('=== 4Dance CDN Audit ===')
  console.log(`Total photos:              ${total}`)
  console.log(`Facebook CDN photos:       ${facebook} (${facebookPct.toFixed(1)}%)`)
  console.log(`Supabase Storage photos:   ${supabaseStorage} (${supabasePct.toFixed(1)}%)`)
  console.log(`Other/unknown URL photos:  ${unknown}`)

  const { data: samples, error: sampleError } = await supabase
    .from('photos')
    .select('id, event_id, thumbnail_url, full_res_url, events(title, slug)')
    .or(FACEBOOK_OR_FILTER)
    .limit(10)

  if (sampleError) {
    throw new Error(`samples: ${sampleError.message}`)
  }

  if (samples?.length) {
    console.log('\nSample Facebook CDN records:')
    for (const photo of samples) {
      const event = Array.isArray(photo.events) ? photo.events[0] : photo.events
      const url = photo.thumbnail_url || photo.full_res_url || ''
      console.log(`- ${photo.id} | ${event?.title || photo.event_id} | ${url.slice(0, 120)}`)
    }
  }

  if (facebook > 0) {
    console.log('\nRecommendation: migrate these images into Supabase Storage and update photos.thumbnail_url/full_res_url before removing Facebook remotePatterns.')
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
