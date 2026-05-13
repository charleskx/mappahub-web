import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { Button } from '../ui'
import { I } from '../icons'

const STATUS_CONFIG: Record<string, { title: string; desc: string; tone: string }> = {
  canceled: {
    title: 'Assinatura cancelada',
    desc: 'Sua assinatura foi cancelada e o acesso à plataforma foi suspenso. Reative seu plano para continuar usando o MappaHub.',
    tone: 'danger',
  },
  past_due: {
    title: 'Pagamento em atraso',
    desc: 'Houve uma falha no pagamento da sua assinatura. Regularize o pagamento para restaurar o acesso completo.',
    tone: 'warning',
  },
}

const ALLOWED_PATHS = ['/billing', '/support']

export default function SubscriptionWall({ children }: { children: React.ReactNode }) {
  const { subscriptionStatus } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isBlocked = subscriptionStatus === 'canceled' || subscriptionStatus === 'past_due'

  // Allow billing and support pages to render even with blocked subscription
  if (!isBlocked || ALLOWED_PATHS.some(p => pathname.startsWith(p))) return <>{children}</>

  const config = STATUS_CONFIG[subscriptionStatus!]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 24,
      background: 'var(--bg)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: subscriptionStatus === 'canceled'
            ? 'color-mix(in srgb, var(--danger) 12%, transparent)'
            : 'color-mix(in srgb, var(--warning) 12%, transparent)',
          color: subscriptionStatus === 'canceled' ? 'var(--danger)' : 'var(--warning)',
          display: 'grid',
          placeItems: 'center',
        }}>
          <I.alert size={28} />
        </div>

        {/* Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{config.title}</h1>
          <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.6 }}>
            {config.desc}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <Button
            variant="primary"
            style={{ width: '100%' }}
            leftIcon={<I.card size={14} />}
            onClick={() => navigate('/billing')}
          >
            {subscriptionStatus === 'canceled' ? 'Reativar assinatura' : 'Regularizar pagamento'}
          </Button>
          <Button
            variant="ghost"
            style={{ width: '100%' }}
            leftIcon={<I.ticket size={14} />}
            onClick={() => navigate('/support')}
          >
            Falar com suporte
          </Button>
        </div>

        {/* Logo / branding */}
        <div style={{ fontSize: 12, color: 'var(--fg-subtle)', marginTop: 8 }}>
          MappaHub · Suporte disponível em suporte@mappahub.com.br
        </div>
      </div>
    </div>
  )
}
