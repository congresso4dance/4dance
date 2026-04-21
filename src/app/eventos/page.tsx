import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import Link from 'next/link';
import styles from './eventos.module.css';

export default async function EventsListPage({
  searchParams,
}: {
  searchParams: Promise<{ style?: string }>;
}) {
  const { style } = await searchParams;
  const supabase = await createClient();

  // 1. Fetch ALL public events to extract styles for the filter bar
  const { data: allEvents } = await supabase
    .from('events')
    .select('styles')
    .eq('is_public', true);

  const uniqueStyles = Array.from(new Set(allEvents?.flatMap(e => e.styles || []) || [])).sort();

  // 2. Fetch Filtered Events
  let query = supabase
    .from('events')
    .select('*, photos(count)')
    .eq('is_public', true)
    .order('event_date', { ascending: false });

  if (style) {
    query = query.contains('styles', [style]);
  }

  const { data: events } = await query;

  return (
    <main className={styles.main}>
      <Navbar />
      
      <header className={styles.header}>
        <div className={styles.container}>
          <h1 className={styles.title}>Galeria de Eventos</h1>
          <p className={styles.subtitle}>Explore nossas coberturas e encontre suas memórias.</p>
          
          <div className={styles.filterBar}>
            <Link 
              href="/eventos" 
              className={`${styles.filterLink} ${!style ? styles.active : ''}`}
            >
              Todos
            </Link>
            {uniqueStyles.map(s => (
              <Link 
                key={s} 
                href={`/eventos?style=${encodeURIComponent(s)}`}
                className={`${styles.filterLink} ${style === s ? styles.active : ''}`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <section className={styles.listSection}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {events?.map((event) => {
              const photoCount = event.photos?.[0]?.count || 0;
              return (
                <Link key={event.id} href={`/eventos/${event.slug}`} className={styles.eventCard}>
                  <div className={styles.cardImage}>
                    {event.cover_url ? (
                      <Image 
                        src={event.cover_url} 
                        alt={event.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                        unoptimized
                      />
                    ) : (
                      <div className={styles.placeholder}>
                        <span>{new Date(event.event_date).getFullYear()}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.cardContent}>
                    <h3>{event.title}</h3>
                    <span className={styles.itemCount}>{photoCount} itens</span>
                  </div>
                </Link>
              );
            })}
            {(!events || events.length === 0) && (
              <p className={styles.empty}>Processando novos eventos... Volte em breve!</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
