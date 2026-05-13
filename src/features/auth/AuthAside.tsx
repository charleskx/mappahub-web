export default function AuthAside() {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="sidebar-mark">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" />
              <circle cx="12" cy="9" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <div className="sidebar-wordmark" style={{ fontSize: 17 }}>
            MappaHub<span className="dot">.</span>
          </div>
        </div>

        <div className="auth-quote">
          Gerencie e geocodifique{' '}
          <span className="accent">milhares de parceiros</span> a partir de uma
          única planilha — com mapas internos e públicos prontos para embutir em
          qualquer lugar.
        </div>

        <div style={{ display: 'flex', gap: 24, fontSize: 12.5, color: 'var(--fg-muted)' }}>
          <div>
            <div className="mono" style={{ color: 'var(--fg)', fontSize: 18, fontWeight: 600 }}>
              1.2M+
            </div>
            endereços geocodificados
          </div>
          <div>
            <div className="mono" style={{ color: 'var(--fg)', fontSize: 18, fontWeight: 600 }}>
              14d
            </div>
            trial gratuito
          </div>
        </div>
      </div>
    </aside>
  )
}
