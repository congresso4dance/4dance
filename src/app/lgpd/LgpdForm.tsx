'use client'

import { useState } from 'react'
import { submitLgpdRequest } from './actions'
import styles from './legal.module.css'

export default function LgpdForm() {
  const [form, setForm] = useState({ name: '', email: '', type: 'deletion', description: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    const result = await submitLgpdRequest(form)
    if (result.success) {
      setStatus('success')
    } else {
      setErrorMsg(result.error ?? 'Erro desconhecido.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.successBox}>
        <strong>Solicitação enviada!</strong>
        <p>Responderemos em até 15 dias úteis no e-mail informado, conforme o Art. 18 da LGPD.</p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="name">Nome completo</label>
        <input id="name" type="text" required value={form.name} onChange={set('name')} placeholder="Seu nome" />
      </div>

      <div className={styles.field}>
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" required value={form.email} onChange={set('email')} placeholder="seu@email.com" />
      </div>

      <div className={styles.field}>
        <label htmlFor="type">Tipo de solicitação</label>
        <select id="type" value={form.type} onChange={set('type')}>
          <option value="access">Acesso aos meus dados</option>
          <option value="correction">Correção de dados</option>
          <option value="deletion">Exclusão de dados</option>
          <option value="portability">Portabilidade de dados</option>
          <option value="opposition">Oposição ao tratamento</option>
          <option value="revocation">Revogação de consentimento</option>
          <option value="other">Outra solicitação</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Descrição</label>
        <textarea
          id="description"
          required
          value={form.description}
          onChange={set('description')}
          placeholder="Descreva sua solicitação com o máximo de detalhes possível..."
          rows={5}
        />
      </div>

      {status === 'error' && <p className={styles.errorMsg}>{errorMsg}</p>}

      <button type="submit" className={styles.submitBtn} disabled={status === 'loading'}>
        {status === 'loading' ? 'Enviando...' : 'Enviar Solicitação'}
      </button>
    </form>
  )
}
