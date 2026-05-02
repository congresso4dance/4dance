"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Images, ShoppingBag, Calendar, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ClientSidebar from '@/components/ClientSidebar';
import styles from './page.module.css';
import { signDisplayPhotos } from '@/app/actions/storage-actions';

type Profile = {
  full_name?: string | null;
};

type RecentPhoto = {
  id: string;
  full_res_url: string;
  events?: { title?: string | null } | null;
};

export default function MinhaContaPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [totalPurchased, setTotalPurchased] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [recentPhotos, setRecentPhotos] = useState<RecentPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        setUserEmail(user.email ?? null);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);

        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['paid', 'completed']);

        if (orders && orders.length > 0) {
          setTotalOrders(orders.length);
          const allPhotoIds = orders.flatMap(o => o.items as string[]);
          setTotalPurchased(allPhotoIds.length);

          const recentIds = allPhotoIds.slice(-4);
          const { data: photosData } = await supabase
            .from('photos')
            .select('*, events(title)')
            .in('id', recentIds);

          if (photosData && photosData.length > 0) {
            const signed = await signDisplayPhotos(photosData as unknown as RecentPhoto[]);
            setRecentPhotos((signed as unknown as RecentPhoto[]).slice(0, 4));
          }
        }
      } catch (err) {
        console.error('minha-conta init error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Dançarino';

  return (
    <div className={styles.portalContainer}>
      <ClientSidebar profile={profile} userEmail={userEmail} />

      <main className={styles.mainContent}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <header className={styles.welcomeHeader}>
            <div>
              <h1>Olá, {firstName}! 👋</h1>
              <p>Bem-vindo à sua área exclusiva 4Dance.</p>
            </div>
          </header>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(206,172,102,0.1)', color: 'var(--primary)' }}>
                <Images size={22} />
              </div>
              <div>
                <span className={styles.statValue}>{totalPurchased}</span>
                <span className={styles.statLabel}>Fotos compradas</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                <ShoppingBag size={22} />
              </div>
              <div>
                <span className={styles.statValue}>{totalOrders}</span>
                <span className={styles.statLabel}>Pedidos realizados</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>
                <Calendar size={22} />
              </div>
              <div>
                <span className={styles.statValue}>∞</span>
                <span className={styles.statLabel}>Acesso às suas fotos</span>
              </div>
            </div>
          </div>

          <div className={styles.actionsGrid}>
            <Link href="/minhas-fotos" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <Sparkles size={28} />
              </div>
              <div>
                <h3>Busca Facial</h3>
                <p>Nossa IA encontra você em todos os eventos</p>
              </div>
              <ArrowRight size={20} className={styles.actionArrow} />
            </Link>

            <Link href="/meus-pedidos" className={styles.actionCard}>
              <div className={styles.actionIcon} style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                <ShoppingBag size={28} />
              </div>
              <div>
                <h3>Minhas Compras</h3>
                <p>Download em HD das suas fotos pagas</p>
              </div>
              <ArrowRight size={20} className={styles.actionArrow} />
            </Link>

            <Link href="/eventos" className={styles.actionCard}>
              <div className={styles.actionIcon} style={{ background: 'rgba(244,63,94,0.1)', color: '#fb7185' }}>
                <Calendar size={28} />
              </div>
              <div>
                <h3>Explorar Eventos</h3>
                <p>Encontre novos eventos e galerias</p>
              </div>
              <ArrowRight size={20} className={styles.actionArrow} />
            </Link>
          </div>

          {recentPhotos.length > 0 && (
            <section className={styles.recentSection}>
              <div className={styles.sectionHeader}>
                <h2>Compras Recentes</h2>
                <Link href="/meus-pedidos" className={styles.seeAllLink}>
                  Ver todas <ArrowRight size={16} />
                </Link>
              </div>
              <div className={styles.recentGrid}>
                {recentPhotos.map((photo) => (
                  <div key={photo.id} className={styles.recentPhoto}>
                    <Image
                      src={photo.full_res_url}
                      alt="Foto recente"
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                    {photo.events?.title && (
                      <div className={styles.photoLabel}>{photo.events.title}</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      </main>
    </div>
  );
}
