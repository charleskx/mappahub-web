import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Card, CardHeader, Skeleton } from '../../components/ui'
import { I } from '../../components/icons'

function StatCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string
  value: string | number
  delta?: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="muted text-sm">{label}</div>
          <div className="h1" style={{ marginTop: 4 }}>{value}</div>
          {delta && (
            <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>{delta}</div>
          )}
        </div>
        <div style={{ color: 'var(--amber)', opacity: 0.8 }}>{icon}</div>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners', 'summary'],
    queryFn: () => api.partners.list({ page: 1, limit: 5 }),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="h1">Dashboard</h1>
        <p className="muted text-sm">Visão geral do seu workspace</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <Skeleton h={60} />
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              label="Total de parceiros"
              value={partners?.total ?? 0}
              delta="+12% este mês"
              icon={<I.partners size={22} />}
            />
            <StatCard
              label="Ativos no mapa"
              value={partners?.total ?? 0}
              icon={<I.map size={22} />}
            />
            <StatCard
              label="Importações"
              value="—"
              icon={<I.upload size={22} />}
            />
            <StatCard
              label="Membros da equipe"
              value="—"
              icon={<I.users size={22} />}
            />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardHeader title="Parceiros recentes" />
          <div>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {[...Array(5)].map((_, i) => <Skeleton key={i} h={36} />)}
              </div>
            ) : partners?.data.length === 0 ? (
              <div className="muted text-sm" style={{ padding: '24px 0', textAlign: 'center' }}>
                Nenhum parceiro cadastrado ainda
              </div>
            ) : (
              <table className="table" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cidade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {partners?.data.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td className="muted">{p.city ?? '—'}</td>
                      <td>
                        <Badge tone={p.active ? 'success' : 'warning'} dot>
                          {p.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Atividade recente" />
          <div className="muted text-sm" style={{ padding: '24px 0', textAlign: 'center' }}>
            Em breve
          </div>
        </Card>
      </div>
    </div>
  )
}
