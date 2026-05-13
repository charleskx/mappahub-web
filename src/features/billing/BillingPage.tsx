import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Button, Card, CardHeader, Progress, Skeleton, useToast } from '../../components/ui'
import { I } from '../../components/icons'

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  annual: 'Anual',
  trial: 'Trial',
}

const PLAN_TONES: Record<string, 'success' | 'warning' | 'info' | 'accent'> = {
  trial: 'warning',
  monthly: 'info',
  annual: 'success',
}

const PLANS = [
  {
    key: 'monthly',
    label: 'Mensal',
    price: 'R$ 297,90',
    period: '/mês',
    priceDetail: null,
    highlight: null,
    highlightTone: null as null,
    note: 'Sem fidelidade — cancele quando quiser',
    badge: null,
    features: ['Parceiros ilimitados', 'Usuários ilimitados', 'Suporte via e-mail', 'Mapas públicos'],
  },
  {
    key: 'annual',
    label: 'Anual',
    price: 'R$ 253,90',
    period: '/mês',
    priceDetail: 'R$ 3.046,80 cobrado anualmente',
    highlight: 'Economize R$ 528,00 por ano',
    highlightTone: 'success' as const,
    note: null,
    badge: 'Recomendado',
    features: [
      'Tudo do plano Mensal',
      'Suporte prioritário',
      'SLA de resposta em até 4h',
      'Onboarding dedicado',
    ],
  },
]

export default function BillingPage() {
  const { push } = useToast()

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: () => api.billing.get(),
  })

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) => api.billing.checkout(plan as 'monthly' | 'annual'),
    onSuccess: (data) => { if (data?.url) window.location.href = data.url },
    onError: () => push({ title: 'Erro ao iniciar checkout', tone: 'error' }),
  })

  const portalMutation = useMutation({
    mutationFn: () => api.billing.portal(),
    onSuccess: (data) => { if (data?.url) window.location.href = data.url },
    onError: () => push({ title: 'Erro ao abrir portal', tone: 'error' }),
  })

  const planType = subscription?.planType ?? ''
  const hasActivePlan = planType === 'monthly' || planType === 'annual'
  const daysUsed = subscription?.trialEndsAt
    ? Math.max(0, 14 - Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : 0

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="h1">Faturamento</h1>
          <div className="muted text-sm">Gerencie seu plano e assinatura</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {isLoading ? (
          <Card><div className="card-body"><Skeleton h={120} /></div></Card>
        ) : (
          <>
            {/* Current plan card */}
            <Card>
              <CardHeader
                title="Plano atual"
                action={planType ? <Badge tone={PLAN_TONES[planType]}>{PLAN_LABELS[planType] ?? planType}</Badge> : undefined}
              />
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {planType === 'trial' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="muted text-sm">Período trial</span>
                      <span className="muted text-sm">{daysUsed} / 14 dias usados</span>
                    </div>
                    <Progress value={(daysUsed / 14) * 100} tone={daysUsed >= 11 ? 'danger' : undefined} />
                    <div className="muted text-sm" style={{ marginTop: 8 }}>
                      {subscription?.trialEndsAt
                        ? `Seu trial expira em ${new Date(subscription.trialEndsAt).toLocaleDateString('pt-BR')}.`
                        : 'Assine um plano para continuar usando o MappaHub.'}
                    </div>
                  </div>
                )}

                {planType !== 'trial' && subscription?.currentPeriodEnd && (
                  <div className="muted text-sm">
                    Próxima renovação:{' '}
                    <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}</strong>
                  </div>
                )}

                <div>
                  {planType && planType !== 'trial' ? (
                    <Button
                      variant="outline"
                      leftIcon={<I.card size={14} />}
                      onClick={() => portalMutation.mutate()}
                      disabled={portalMutation.isPending}
                    >
                      {portalMutation.isPending ? 'Abrindo…' : 'Gerenciar assinatura'}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      leftIcon={<I.card size={14} />}
                      onClick={() => checkoutMutation.mutate('monthly')}
                      disabled={checkoutMutation.isPending}
                    >
                      {checkoutMutation.isPending ? 'Aguarde…' : 'Assinar agora'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Plan cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'stretch' }}>
              {PLANS.map((p) => {
                const isCurrent = planType === p.key
                const isAnnual = p.key === 'annual'
                return (
                  <Card
                    key={p.key}
                    style={{
                      border: isCurrent
                        ? '2px solid var(--accent)'
                        : isAnnual
                          ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)'
                          : undefined,
                      position: 'relative',
                      overflow: 'visible',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Recommended badge */}
                    {p.badge && !isCurrent && (
                      <div style={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        padding: '3px 14px',
                        borderRadius: 99,
                        whiteSpace: 'nowrap',
                      }}>
                        {p.badge}
                      </div>
                    )}

                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                      {/* Header */}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg-muted)', marginBottom: 8 }}>{p.label}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>{p.price}</span>
                          <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{p.period}</span>
                        </div>
                        {p.priceDetail && (
                          <div style={{ fontSize: 12, color: 'var(--fg-subtle)', marginTop: 3 }}>{p.priceDetail}</div>
                        )}
                        {/* Placeholder line so both headers occupy same height */}
                        {!p.priceDetail && (
                          <div style={{ fontSize: 12, marginTop: 3, visibility: 'hidden' }}>-</div>
                        )}
                      </div>

                      {/* Highlight pill — savings (annual) or note (monthly) */}
                      {p.highlight ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 10px',
                          borderRadius: 8,
                          background: 'color-mix(in srgb, var(--success) 10%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)',
                        }}>
                          <I.zap size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>{p.highlight}</span>
                        </div>
                      ) : p.note ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 10px',
                          borderRadius: 8,
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                        }}>
                          <I.check size={12} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)' }}>{p.note}</span>
                        </div>
                      ) : null}

                      {/* Features */}
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                        {p.features.map((f) => (
                          <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
                            <I.check size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      {isCurrent ? (
                        <Badge tone="success" style={{ alignSelf: 'flex-start' }}>Plano atual</Badge>
                      ) : hasActivePlan ? (
                        // User already has an active plan — guide to portal instead of new checkout
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                        }}>
                          <I.info size={13} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                            Para trocar de plano, use{' '}
                            <button
                              onClick={() => portalMutation.mutate()}
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, fontSize: 12 }}
                            >
                              gerenciar assinatura
                            </button>
                          </span>
                        </div>
                      ) : (
                        <Button
                          variant={isAnnual ? 'primary' : 'outline'}
                          style={{ width: '100%' }}
                          onClick={() => checkoutMutation.mutate(p.key)}
                          disabled={checkoutMutation.isPending}
                        >
                          {isAnnual ? '⚡ Assinar Anual' : 'Assinar Mensal'}
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
