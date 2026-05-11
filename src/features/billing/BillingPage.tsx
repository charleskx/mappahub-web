import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Button, Card, CardHeader, Progress, Skeleton, useToast } from '../../components/ui'
import { I } from '../../components/icons'

const PLAN_LABELS: Record<string, string> = {
  trial: 'Trial',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const PLAN_TONES: Record<string, 'success' | 'warning' | 'info' | 'accent'> = {
  trial: 'warning',
  starter: 'info',
  pro: 'success',
  enterprise: 'accent',
}

export default function BillingPage() {
  const { push } = useToast()

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: () => api.billing.get(),
  })

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) => api.billing.checkout(plan),
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url
    },
    onError: () => push({ title: 'Erro ao iniciar checkout', tone: 'error' }),
  })

  const portalMutation = useMutation({
    mutationFn: () => api.billing.portal(),
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url
    },
    onError: () => push({ title: 'Erro ao abrir portal', tone: 'error' }),
  })

  const daysUsed = subscription?.trialEndsAt
    ? Math.max(0, 30 - Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="h1">Faturamento</h1>
        <p className="muted text-sm">Gerencie seu plano e assinatura</p>
      </div>

      {isLoading ? (
        <Card><Skeleton h={120} /></Card>
      ) : (
        <>
          <Card>
            <CardHeader
              title="Plano atual"
              action={
                subscription?.plan && (
                  <Badge tone={PLAN_TONES[subscription.plan]}>
                    {PLAN_LABELS[subscription.plan] ?? subscription.plan}
                  </Badge>
                )
              }
            />

            {subscription?.plan === 'trial' && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="muted text-sm">Período trial</span>
                  <span className="muted text-sm">{daysUsed} / 30 dias usados</span>
                </div>
                <Progress value={(daysUsed / 30) * 100} tone={daysUsed >= 25 ? 'danger' : undefined} />
                <p className="muted text-sm" style={{ marginTop: 12 }}>
                  {subscription.trialEndsAt
                    ? `Seu trial expira em ${new Date(subscription.trialEndsAt).toLocaleDateString('pt-BR')}.`
                    : 'Assine um plano para continuar usando o atlasync.'}
                </p>
              </div>
            )}

            {subscription?.plan !== 'trial' && subscription?.currentPeriodEnd && (
              <div className="muted text-sm" style={{ marginTop: 12 }}>
                Próxima renovação:{' '}
                <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}</strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {subscription?.plan !== 'trial' ? (
                <Button
                  variant="secondary"
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
                  onClick={() => checkoutMutation.mutate('starter')}
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? 'Aguarde…' : 'Assinar agora'}
                </Button>
              )}
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              {
                plan: 'starter',
                label: 'Starter',
                price: 'R$ 97/mês',
                features: ['Até 500 parceiros', '2 usuários', 'Suporte via e-mail'],
              },
              {
                plan: 'pro',
                label: 'Pro',
                price: 'R$ 197/mês',
                features: ['Parceiros ilimitados', '10 usuários', 'Suporte prioritário', 'Embeds ilimitados'],
              },
              {
                plan: 'enterprise',
                label: 'Enterprise',
                price: 'Sob consulta',
                features: ['Parceiros ilimitados', 'Usuários ilimitados', 'SLA garantido', 'Onboarding dedicado'],
              },
            ].map((p) => (
              <Card key={p.plan} style={subscription?.plan === p.plan ? { border: '1px solid var(--amber)' } : undefined}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{p.price}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
                      <I.check size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                {subscription?.plan !== p.plan && p.plan !== 'enterprise' && (
                  <Button
                    variant="outline"
                    style={{ width: '100%', marginTop: 16 }}
                    onClick={() => checkoutMutation.mutate(p.plan)}
                    disabled={checkoutMutation.isPending}
                  >
                    Assinar {p.label}
                  </Button>
                )}
                {p.plan === 'enterprise' && (
                  <Button variant="ghost" style={{ width: '100%', marginTop: 16 }}>
                    Falar com vendas
                  </Button>
                )}
                {subscription?.plan === p.plan && (
                  <Badge tone="success" style={{ marginTop: 16 }}>Plano atual</Badge>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
