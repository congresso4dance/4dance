'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'

export default function Analytics({ gaId }: { gaId: string }) {
  const [consented, setConsented] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('cookie_consent') === 'accepted') {
      setConsented(true)
    }
    const handler = () => setConsented(true)
    window.addEventListener('cookie_consent_accepted', handler)
    return () => window.removeEventListener('cookie_consent_accepted', handler)
  }, [])

  if (!consented) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
      </Script>
    </>
  )
}
