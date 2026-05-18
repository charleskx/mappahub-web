declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

let initialized = false

export function initAnalytics() {
  if (!GA_ID || initialized) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, {
    // Anonymize IP for extra privacy protection
    anonymize_ip: true,
    // Disable ad personalization signals
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })

  initialized = true
}

export function disableAnalytics() {
  if (!GA_ID) return
  // Google's opt-out mechanism
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = true
  initialized = false
}

export function trackPageView(path: string) {
  if (!GA_ID || !initialized || !window.gtag) return
  window.gtag('event', 'page_view', { page_path: path })
}
