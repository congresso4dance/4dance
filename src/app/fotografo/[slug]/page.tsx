import { getSupabaseAdmin, signSingleUrl } from '@/utils/storage-helper';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Camera } from 'lucide-react';
import styles from './fotografo-publico.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, public_page_enabled')
    .eq('public_slug', slug)
    .single();

  if (!profile || !profile.public_page_enabled) {
    return { title: 'Fotógrafo não encontrado | 4Dance' };
  }

  return {
    title: `${profile.full_name} | Fotógrafo 4Dance`,
    description: `Confira os eventos de dança de salão fotografados por ${profile.full_name} no 4Dance.`,
  };
}

export default async function PhotographerPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, bio, public_page_enabled')
    .eq('public_slug', slug)
    .single();

  if (!profile || !profile.public_page_enabled) {
    notFound();
  }

  // Eventos públicos onde este fotógrafo é dono ou colaborador aceito.
  const { data: links } = await supabase
    .from('event_photographers')
    .select('event_id')
    .eq('photographer_id', profile.id);

  const eventIds = (links || []).map((l) => l.event_id);

  let events: Array<{ id: string; title: string; slug: string; event_date: string; location: string | null; cover_url: string | null }> = [];

  if (eventIds.length > 0) {
    const { data: eventRows } = await supabase
      .from('events')
      .select('id, title, slug, event_date, location, cover_url')
      .in('id', eventIds)
      .eq('is_public', true)
      .order('event_date', { ascending: false });

    events = await Promise.all(
      (eventRows || []).map(async (e) => ({
        ...e,
        cover_url: await signSingleUrl(e.cover_url),
      }))
    );
  }

  const initial = profile.full_name?.charAt(0)?.toUpperCase() || 'F';

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.avatar}>{initial}</div>
        <h1>{profile.full_name}</h1>
        <p className={styles.role}>Fotógrafo parceiro 4Dance</p>
        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
      </header>

      <section className={styles.eventsSection}>
        <h2><Camera size={20} /> Eventos fotografados</h2>

        {events.length === 0 ? (
          <p className={styles.empty}>Nenhum evento público ainda.</p>
        ) : (
          <div className={styles.grid}>
            {events.map((event) => (
              <Link key={event.id} href={`/eventos/${event.slug}`} className={styles.card}>
                <div className={styles.cover}>
                  {event.cover_url ? (
                    <Image src={event.cover_url} alt={event.title} fill style={{ objectFit: 'cover' }} unoptimized />
                  ) : (
                    <div className={styles.coverPlaceholder} />
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <h3>{event.title}</h3>
                  <div className={styles.meta}>
                    <span><Calendar size={14} /> {new Date(event.event_date).toLocaleDateString('pt-BR')}</span>
                    {event.location && <span><MapPin size={14} /> {event.location}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
