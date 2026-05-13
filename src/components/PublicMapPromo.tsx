import { Button } from './ui'
import { I } from './icons'

interface Props {
  onEnable: () => void
}

export function PublicMapPromo({ onEnable }: Props) {
  return (
    <div className="promo-wrap" style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      gap: 40,
    }}>

      {/* Illustration */}
      <div style={{ width: 320, height: 200 }}>
        <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Browser card */}
          <rect x="10" y="10" width="300" height="180" rx="12" fill="var(--bg-elev)" stroke="var(--border)" strokeWidth="1.5"/>
          {/* Titlebar */}
          <rect x="10" y="10" width="300" height="32" rx="12" fill="var(--bg-subtle)"/>
          <rect x="10" y="30"  width="300" height="12"  fill="var(--bg-subtle)"/>
          <circle cx="30" cy="26" r="5" fill="var(--danger)"  opacity=".5"/>
          <circle cx="46" cy="26" r="5" fill="#f59e0b"        opacity=".5"/>
          <circle cx="62" cy="26" r="5" fill="var(--success)" opacity=".5"/>
          {/* URL bar */}
          <rect x="80" y="19" width="170" height="14" rx="4" fill="var(--bg)" stroke="var(--border)" strokeWidth="1"/>
          <text x="165" y="30" fontSize="8" fill="var(--fg-muted)" textAnchor="middle" fontFamily="monospace">atlasync.com/mapa</text>

          {/* Map grid */}
          <line x1="10"  y1="80"  x2="310" y2="80"  stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
          <line x1="10"  y1="110" x2="310" y2="110" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
          <line x1="10"  y1="140" x2="310" y2="140" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
          <line x1="10"  y1="170" x2="310" y2="170" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
          <line x1="80"  y1="42"  x2="80"  y2="190" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
          <line x1="150" y1="42"  x2="150" y2="190" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
          <line x1="220" y1="42"  x2="220" y2="190" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
          <line x1="290" y1="42"  x2="290" y2="190" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>

          {/* Pin A — indigo */}
          <g className="pin-a">
            <circle className="pulse-a" cx="110" cy="136" r="6" fill="#4f46e5" opacity=".25"/>
            <path d="M110 119 C106.5 119 103 122.2 103 126.5 C103 132 110 140 110 140 C110 140 117 132 117 126.5 C117 122.2 113.5 119 110 119Z" fill="#4f46e5"/>
            <circle cx="110" cy="126.5" r="3" fill="white"/>
          </g>

          {/* Pin B — emerald */}
          <g className="pin-b">
            <circle className="pulse-b" cx="190" cy="106" r="6" fill="#10b981" opacity=".25"/>
            <path d="M190 89 C186.5 89 183 92.2 183 96.5 C183 102 190 110 190 110 C190 110 197 102 197 96.5 C197 92.2 193.5 89 190 89Z" fill="#10b981"/>
            <circle cx="190" cy="96.5" r="3" fill="white"/>
          </g>

          {/* Pin C — amber */}
          <g className="pin-c">
            <circle className="pulse-c" cx="255" cy="156" r="6" fill="#f59e0b" opacity=".25"/>
            <path d="M255 139 C251.5 139 248 142.2 248 146.5 C248 152 255 160 255 160 C255 160 262 152 262 146.5 C262 142.2 258.5 139 255 139Z" fill="#f59e0b"/>
            <circle cx="255" cy="146.5" r="3" fill="white"/>
          </g>

          {/* Footer badge */}
          <rect x="18" y="168" width="66" height="16" rx="4" fill="#4f46e5" opacity=".12"/>
          <text x="51" y="179.5" fontSize="7.5" fill="#4f46e5" textAnchor="middle" fontWeight="600" fontFamily="sans-serif">Powered by MappaHub</text>
        </svg>
      </div>

      {/* Copy */}
      <div style={{ textAlign: 'center', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
          Compartilhe seu mapa de parceiros com o mundo
        </h2>
        <p className="muted" style={{ fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Gere embeds públicos e incorpore o mapa interativo em qualquer site —
          via <strong>iFrame</strong> ou <strong>SDK JavaScript</strong> — com filtros,
          clusters e geolocalização automática.
        </p>
      </div>

      {/* Feature chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {[
          { icon: <I.code size={14} />, label: 'iFrame & SDK',    desc: 'Uma linha de código' },
          { icon: <I.map  size={14} />, label: 'Mapa interativo', desc: 'Filtros e clusters'  },
          { icon: <I.lock size={14} />, label: 'Token seguro',     desc: 'Acesso controlado'  },
        ].map((f) => (
          <div key={f.label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-elev)',
            minWidth: 160,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--accent-subtle, #4f46e510)',
              color: 'var(--accent)',
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              {f.icon}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{f.label}</div>
              <div className="muted text-xs">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <Button variant="primary" size="lg" leftIcon={<I.zap size={15} />} onClick={onEnable}>
          Habilitar mapa público
        </Button>
        <a
          href="https://atlasync.com"
          target="_blank"
          rel="noopener noreferrer"
          className="muted text-sm"
          style={{ color: 'var(--fg-muted)' }}
        >
          Saiba mais em atlasync.com →
        </a>
      </div>
    </div>
  )
}
