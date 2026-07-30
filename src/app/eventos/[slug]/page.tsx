import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from './gallery.module.css';
import { Metadata } from 'next';
// import Image from 'next/image';
import GalleryContent from '@/components/GalleryContent';
import VideoGallery from '@/components/VideoGallery';
import { signPhotoUrls, signSingleUrl, getSupabaseAdmin } from '@/utils/storage-helper';
import { VIDEO_PRICE_BRL } from '@/utils/pricing';

type Props = {
  params: Promise<{ slug: string }>;
};

type GalleryPhoto = {
  id: string;
  event_id: string;
  thumbnail_url: string;
  storage_path?: string | null;
  full_res_url: string;
  created_at?: string | null;
  [key: string]: unknown;
};

// DYNAMIC SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data: event } = await supabase
    .from('events')
    .select('title, description, cover_url, is_public')
    .eq('slug', slug)
    .single();

  if (!event || !event.is_public) return { title: 'Evento não encontrado | 4Dance' };

  return {
    title: `${event.title} | 4Dance`,
    description: event.description || `Confira os registros do evento ${event.title} na 4Dance.`,
    openGraph: {
      title: event.title,
      description: event.description || `Fotos oficiais do evento ${event.title}`,
      images: event.cover_url ? [{ url: event.cover_url, width: 1200, height: 630, alt: event.title }] : [],
      type: 'website',
      siteName: '4Dance Gallery',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.description || `Veja as fotos de ${event.title}`,
      images: event.cover_url ? [event.cover_url] : [],
    },
  };
}

export default async function EventGalleryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Fetch Event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!event || eventError) {
    notFound();
  }

  // Evento "escondido" (is_public = false) não deve abrir por link direto —
  // sem isso, quem tivesse o link salvo/compartilhado via em uma galeria com
  // as fotos quebradas em vez de um 404 limpo.
  if (!event.is_public) {
    notFound();
  }

  // Sign cover_url
  const signedCoverUrl = await signSingleUrl(event.cover_url);
  const eventWithSignedCover = { ...event, cover_url: signedCoverUrl };

  // 2. Fetch All Photos — usa service role para contornar RLS em galeria pública
  const photoFields = event.is_paid
    ? 'id,event_id,thumbnail_url,storage_path,created_at'
    : '*';

  const supabaseAdmin = getSupabaseAdmin();

  // Eventos grandes (700+ fotos) ficavam com a galeria cortada porque aqui só
  // buscava as primeiras 300 (.range(0, 299)) — o resto das fotos existia no
  // banco mas nunca chegava na página. Busca em lotes até trazer tudo, sem
  // depender do fetch de "carregar mais" no scroll (que fica só como reforço
  // de UX, não como a única forma de ver a galeria inteira).
  const PAGE_SIZE = 900;
  let rawPhotos: Record<string, unknown>[] = [];
  let totalPhotosCount = 0;
  let photosError: unknown = null;

  for (let offset = 0; ; offset += PAGE_SIZE) {
    // O cast via `unknown` é necessário porque `photoFields` é uma união de
    // dois literais diferentes ('*' ou uma lista de colunas) — o parser de
    // tipos do supabase-js não consegue inferir um shape único a partir disso
    // e gera um tipo `ParserError` interno que quebra o build (TS2352) se a
    // gente tentar tipar o resultado diretamente.
    const { data: batch, count, error: batchError } = (await supabaseAdmin
      .from('photos')
      .select(photoFields, { count: 'exact' })
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)) as unknown as {
        data: Record<string, unknown>[] | null;
        count: number | null;
        error: unknown;
      };

    if (batchError) {
      photosError = batchError;
      break;
    }

    totalPhotosCount = count ?? totalPhotosCount;
    rawPhotos = rawPhotos.concat(batch || []);

    if (!batch || batch.length < PAGE_SIZE) break;
  }

  // Para eventos pagos, usar thumbnail_url como full_res_url público (HD só via download seguro)
  if (photosError) {
    console.error('Erro ao carregar fotos do evento:', photosError);
  }

  const signedRawPhotos = await signPhotoUrls((rawPhotos || []) as unknown as GalleryPhoto[]);

  const galleryPhotos = (signedRawPhotos as unknown as Array<GalleryPhoto & { thumbnail_url?: string | null; full_res_url?: string | null }>)
    .filter((photo) => Boolean(photo.thumbnail_url))
    .map((photo) => {
      const cleanUrl = photo.full_res_url || photo.thumbnail_url || '';
      return {
        ...photo,
        thumbnail_url: event.is_paid ? (photo.thumbnail_url || '') : cleanUrl,
        full_res_url: photo.full_res_url || photo.thumbnail_url || '',
      };
    });
  const photos = event.is_paid
    ? galleryPhotos.map((photo) => ({ ...photo, full_res_url: photo.thumbnail_url }))
    : galleryPhotos;

  // 3. Fetch Videos (piloto) — venda separada das fotos, preço fixo.
  const { data: videos } = await supabaseAdmin
    .from('videos')
    .select('id, title')
    .eq('event_id', event.id)
    .order('created_at', { ascending: true });

  let purchasedVideoIds: string[] = [];
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (currentUser && videos && videos.length > 0) {
    const { data: paidOrders } = await supabaseAdmin
      .from('video_orders')
      .select('video_id')
      .eq('user_id', currentUser.id)
      .eq('status', 'paid')
      .in('video_id', videos.map((v) => v.id));
    purchasedVideoIds = (paidOrders || []).map((o) => o.video_id);
  }

  return (
    <main className={styles.main}>
      <Navbar />

      <header className={styles.heroSection}>
        {eventWithSignedCover.cover_url && (
          <div className={styles.heroBg}>
            <img 
              src={eventWithSignedCover.cover_url} 
              alt={eventWithSignedCover.title} 
              className={styles.blurImg}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className={styles.heroOverlay} />
          </div>
        )}
        
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <Link href="/eventos" className={styles.backBtn}>← Voltar para Eventos</Link>
            <div className={styles.animateIn}>
              <span className={styles.dateBadge}>
                {new Date(eventWithSignedCover.event_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
              <h1 className={styles.title}>{eventWithSignedCover.title}</h1>
              <div className={styles.metaInfo}>
                <span className={styles.location}>{eventWithSignedCover.location}</span>
                {eventWithSignedCover.styles && eventWithSignedCover.styles.length > 0 && (
                  <>
                    <span className={styles.separator}>•</span>
                    <span className={styles.styleTags}>{eventWithSignedCover.styles.join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.gallerySection}>
        <div className={styles.container}>
          <GalleryContent event={eventWithSignedCover} photos={photos || []} totalPhotosCount={totalPhotosCount ?? photos?.length ?? 0} />
          <VideoGallery videos={videos || []} purchasedVideoIds={purchasedVideoIds} price={VIDEO_PRICE_BRL} />
        </div>
      </section>
    </main>
  );
}
