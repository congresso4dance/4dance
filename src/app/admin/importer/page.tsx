import { createClient } from '@/utils/supabase/server';
import AdminNavbar from '@/components/AdminNavbar';
import ImporterForm from '@/components/ImporterForm';
import styles from './importer.module.css';

export default async function AdminImporterPage() {
  const supabase = await createClient();

  // Fetch events to associate photos with
  const { data: events } = await supabase
    .from('events')
    .select('id, title, slug')
    .order('event_date', { ascending: false });

  return (
    <div className={styles.container}>
      <AdminNavbar active="importer" />
      
      <header className={styles.header}>
        <h1>Importador de Fotos (Facebook / Bulk)</h1>
        <p>Use esta ferramenta para cadastrar centenas de fotos de uma vez usando apenas os links.</p>
      </header>

      <section className={styles.toolSection}>
        <div className={styles.infoBox}>
          <h3>💡 Como pegar os links do Facebook?</h3>
          <ol>
            <li>Abra o álbum no Facebook pelo Chrome.</li>
            <li>Role a página até o final para carregar todas as fotos.</li>
            <li>Use uma extensão como <strong>"Image Downloader"</strong> ou <strong>"Link Klipper"</strong>.</li>
            <li>Selecione apenas os links das imagens e cole na caixa abaixo.</li>
          </ol>
        </div>

        <ImporterForm events={events || []} />
      </section>
    </div>
  );
}
