import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from './gallery.module.css';
import { Metadata } from 'next';
import Image from 'next/image';
import GalleryContent from '@/components/GalleryContent';

type Props = {
  params: Promise<{ slug: string }>;
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

  // 2. Fetch Photos
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', event.id)
    .order('created_at', { ascending: true });

  return (
    <main className={styles.main}>
      <Navbar />

      <header className={styles.heroSection}>
        {event.cover_url && (
          <div className={styles.heroBg}>
            <Image 
              src={event.cover_url} 
              alt={event.title} 
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
                {new Date(event.event_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
              <h1 className={styles.title}>{event.title}</h1>
              <div className={styles.metaInfo}>
                <span className={styles.location}>{event.location}</span>
                {event.styles && event.styles.length > 0 && (
                  <>
                    <span className={styles.separator}>•</span>
                    <span className={styles.styleTags}>{event.styles.join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.gallerySection}>
        <div className={styles.container}>
          <GalleryContent event={event} photos={photos || []} />
        </div>
      </section>
    </main>
  );
}
