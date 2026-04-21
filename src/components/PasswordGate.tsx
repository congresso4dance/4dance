"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { verifyEventPassword } from "@/app/actions";
import styles from "./PasswordGate.module.css";

type Props = {
  eventId: string;
  onSuccess: () => void;
};

export default function PasswordGate({ eventId, onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await verifyEventPassword(eventId, password);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || "Erro de validação");
      }
    } catch (err) {
      setError("Falha na conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <Lock size={32} />
        </div>
        <h2 className={styles.title}>Álbum Privado</h2>
        <p className={styles.description}>
          Este conteúdo é protegido. Digite a senha de acesso para visualizar os registros.
        </p>

        <form onSubmit={handleSubmit} className={styles.inputGroup}>
          <input
            type="password"
            className={styles.input}
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Verificando..." : "Desbloquear Álbum"}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}
