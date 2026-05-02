import { MessageSquareText, Plus, Trash2 } from "lucide-react";
import { createTestimonial, deleteTestimonial } from "@/app/actions/testimonial-actions";
import { createClient } from "@/utils/supabase/server";
import styles from "./testimonials.module.css";

interface Testimonial {
  id: string;
  created_at: string;
  author: string;
  role: string | null;
  content: string;
  avatar_url: string | null;
}

function getStatusMessage(status?: string, message?: string) {
  if (status === "created") return { tone: "success", text: "Depoimento publicado na home." };
  if (status === "deleted") return { tone: "success", text: "Depoimento removido." };
  if (status === "missing") return { tone: "error", text: "Nome e depoimento são obrigatórios." };
  if (status === "error") return { tone: "error", text: message || "Não foi possível salvar agora." };
  return null;
}

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const supabase = await createClient();
  const { status, message } = await searchParams;
  const statusMessage = getStatusMessage(status, message);

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("id, created_at, author, role, content, avatar_url")
    .order("created_at", { ascending: false });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Conteúdo da home</span>
          <h1>Depoimentos reais</h1>
          <p>Cadastre apenas falas autorizadas de clientes, organizadores ou dançarinos.</p>
        </div>
        <div className={styles.metric}>
          <MessageSquareText size={18} />
          <strong>{testimonials?.length || 0}</strong>
          <span>ativos</span>
        </div>
      </header>

      {statusMessage && (
        <div className={`${styles.notice} ${styles[statusMessage.tone]}`}>
          {statusMessage.text}
        </div>
      )}

      <section className={styles.grid}>
        <form action={createTestimonial} className={styles.form}>
          <div className={styles.formHeader}>
            <Plus size={18} />
            <h2>Novo depoimento</h2>
          </div>

          <label>
            Nome
            <input name="author" placeholder="Ex: Marina Souza" required />
          </label>

          <label>
            Cargo ou contexto
            <input name="role" placeholder="Ex: Organizadora do Congresso X" />
          </label>

          <label>
            Foto do avatar
            <input name="avatar_url" type="url" placeholder="https://..." />
          </label>

          <label>
            Depoimento
            <textarea
              name="content"
              placeholder="Cole aqui o depoimento real, com autorização de uso."
              rows={7}
              required
            />
          </label>

          <button type="submit" className={styles.primaryButton}>
            <Plus size={16} />
            Publicar
          </button>
        </form>

        <div className={styles.list}>
          <div className={styles.listHeader}>
            <h2>Publicados</h2>
            <span>Aparecem na home em ordem de cadastro</span>
          </div>

          {testimonials?.map((testimonial: Testimonial) => (
            <article key={testimonial.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.avatar}>
                  {testimonial.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={testimonial.avatar_url} alt={testimonial.author} />
                  ) : (
                    <span>{testimonial.author.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3>{testimonial.author}</h3>
                  {testimonial.role && <span>{testimonial.role}</span>}
                </div>
              </div>
              <p>&quot;{testimonial.content}&quot;</p>
              <form action={deleteTestimonial}>
                <input type="hidden" name="id" value={testimonial.id} />
                <button type="submit" className={styles.deleteButton}>
                  <Trash2 size={15} />
                  Remover
                </button>
              </form>
            </article>
          ))}

          {(!testimonials || testimonials.length === 0) && (
            <div className={styles.empty}>
              Nenhum depoimento cadastrado ainda. A seção da home ficará oculta até existir pelo menos um.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
