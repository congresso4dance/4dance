import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from './gallery.module.css';
import { Metadata } from 'next';
import Image from 'next/image';
import GalleryContent from '@/components/GalleryContent';
import { signPhotoUrls, signSingleUrl } from '@/utils/storage-helper';

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
    .select('title, description, cover_url')
    .eq('slug', slug)
    .single();

  if (!event) return { title: 'Evento não encontrado | 4Dance' };

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

  // Sign cover_url
  const signedCoverUrl = await signSingleUrl(event.cover_url);
  const eventWithSignedCover = { ...event, cover_url: signedCoverUrl };

  // 2. Fetch All Photos
  // Para eventos pagos, não expor full_res_url ao client — downloads passam pela API segura.
  const photoFields = event.is_paid
    ? 'id,event_id,thumbnail_url,storage_path,created_at'
    : '*';

  const { data: rawPhotos, count: totalPhotosCount, error: photosError } = await supabase
    .from('photos')
    .select(photoFields, { count: 'exact' })
    .eq('event_id', event.id)
    .order('created_at', { ascending: true })
    .range(0, 299);

  // Para eventos pagos, usar thumbnail_url como full_res_url público (HD só via download seguro)
  if (photosError) {
    console.error('Erro ao carregar fotos do evento:', photosError);
  }

  const signedRawPhotos = await signPhotoUrls((rawPhotos || []) as unknown as GalleryPhoto[]);

  const galleryPhotos = (signedRawPhotos as unknown as Array<GalleryPhoto & { thumbnail_url?: string | null; full_res_url?: string | null }>)
    .filter((photo) => Boolean(photo.thumbnail_url))
    .map((photo) => ({
      ...photo,
      thumbnail_url: photo.thumbnail_url || '',
      full_res_url: photo.full_res_url || photo.thumbnail_url || '',
    }));
  const photos = event.is_paid
    ? galleryPhotos.map((photo) => ({ ...photo, full_res_url: photo.thumbnail_url }))
    : galleryPhotos;

  return (
    <main className={styles.main}>
      <Navbar />

      <header className={styles.heroSection}>
        {eventWithSignedCover.cover_url && (
          <div className={styles.heroBg}>
            <Image 
              src={eventWithSignedCover.cover_url} 
              alt={eventWithSignedCover.title} 
              fill 
              priority 
              style={{ objectFit: 'cover' }}
              className={styles.blurImg}
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
        </div>
      </section>
    </main>
  );
}
