export default function AuthAside() {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-inner">
        <div className="auth-brand">
          <div className="sidebar-mark" style={{ width: 36, height: 36 }}>
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
          <span className="auth-brand-name">atlasync<span className="dot">.</span></span>
        </div>

        <div className="auth-aside-content">
          <blockquote className="auth-quote">
            "Centralizamos todos os nossos parceiros no atlasync e o tempo de atualização do mapa
            caiu de horas para segundos."
          </blockquote>
          <div className="auth-quote-author">
            <div className="auth-quote-avatar">MS</div>
            <div>
              <div className="auth-quote-name">Mariana Silva</div>
              <div className="auth-quote-role">Diretora de Operações · TechVarejo</div>
            </div>
          </div>
        </div>

        <div className="auth-aside-stats">
          <div className="auth-stat">
            <div className="auth-stat-value">12k+</div>
            <div className="auth-stat-label">Parceiros mapeados</div>
          </div>
          <div className="auth-stat">
            <div className="auth-stat-value">99.9%</div>
            <div className="auth-stat-label">Uptime garantido</div>
          </div>
          <div className="auth-stat">
            <div className="auth-stat-value">150+</div>
            <div className="auth-stat-label">Empresas ativas</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
