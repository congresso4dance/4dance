'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './CookieBanner.module.css'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) setVisible(true)
  }, [])

  const respond = (choice: 'accepted' | 'declined') => {
    localStorage.setItem('cookie_consent', choice)
    if (choice === 'accepted') {
      window.dispatchEvent(new Event('cookie_consent_accepted'))
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={styles.banner} role="dialog" aria-label="Aviso de cookies">
      <div className={styles.inner}>
        <div className={styles.text}>
          <strong>Cookies & Privacidade</strong>
          <p>
            Usamos cookies para melhorar sua experiência e analisar o tráfego.
            Veja nossa{' '}
            <Link href="/privacidade">Política de Privacidade</Link> e{' '}
            <Link href="/cookies">Política de Cookies</Link>.
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.decline} onClick={() => respond('declined')}>
            Recusar
          </button>
          <button className={styles.accept} onClick={() => respond('accepted')}>
            Aceitar
          </button>
        </div>
      </div>
    </div>
  )
}
