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
    price: 'R$ 197/mês',
    features: ['Parceiros ilimitados', 'Usuários ilimitados', 'Suporte via e-mail', 'Mapas públicos'],
  },
  {
    key: 'annual',
    label: 'Anual',
    price: 'R$ 1.970/ano',
    features: ['Tudo do Mensal', '2 meses grátis', 'Suporte prioritário', 'Onboarding dedicado'],
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
                        : 'Assine um plano para continuar usando o AtlaSync.'}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {PLANS.map((p) => {
                const isCurrent = planType === p.key
                return (
                  <Card key={p.key} style={isCurrent ? { border: '1px solid var(--accent)' } : undefined}>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{p.price}</div>
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {p.features.map((f) => (
                          <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
                            <I.check size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {isCurrent ? (
                        <Badge tone="success" style={{ alignSelf: 'flex-start' }}>Plano atual</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          style={{ width: '100%' }}
                          onClick={() => checkoutMutation.mutate(p.key)}
                          disabled={checkoutMutation.isPending}
                        >
                          Assinar {p.label}
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
