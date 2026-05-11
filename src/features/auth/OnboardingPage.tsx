import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth'
import { Button, Field, Input, useToast } from '../../components/ui'

const STEPS = ['Boas-vindas', 'Sua empresa', 'Concluído']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const { push } = useToast()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ companyName: '', mapsKey: '' })
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const finish = async () => {
    setLoading(true)
    try {
      await api.settings.update({ mapsKey: form.mapsKey })
      await refreshUser()
      navigate('/dashboard')
    } catch {
      push({ title: 'Erro ao salvar configurações', tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--bg-base)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {STEPS.map((s, i) => (
              <div
                key={s}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: i > step ? 0.4 : 1,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    background: i <= step ? 'var(--amber)' : 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    color: i <= step ? '#000' : 'var(--fg-muted)',
                  }}
                >
                  {i + 1}
                </div>
                <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{s}</span>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 24, height: 1, background: 'var(--border)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
            <h1 className="h1">Bem-vindo ao atlasync!</h1>
            <p className="muted" style={{ marginTop: 8, marginBottom: 32 }}>
              Vamos configurar sua conta em poucos passos para que você possa começar a mapear seus
              parceiros.
            </p>
            <Button variant="primary" onClick={() => setStep(1)}>
              Começar configuração
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="card" style={{ padding: 32 }}>
            <h2 className="h2" style={{ marginBottom: 4 }}>Sua empresa</h2>
            <p className="muted text-sm" style={{ marginBottom: 24 }}>
              Configure as informações básicas do seu workspace.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Nome da empresa">
                <Input
                  placeholder="Acme Ltda."
                  value={form.companyName}
                  onChange={set('companyName')}
                />
              </Field>
              <Field
                label="Google Maps API Key"
                hint="Necessária para exibir o mapa interativo. Você pode adicionar depois em Configurações."
              >
                <Input
                  placeholder="AIza..."
                  value={form.mapsKey}
                  onChange={set('mapsKey')}
                />
              </Field>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => setStep(0)}>Voltar</Button>
                <Button variant="primary" onClick={() => setStep(2)}>Continuar</Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
            <h1 className="h1">Tudo pronto!</h1>
            <p className="muted" style={{ marginTop: 8, marginBottom: 32 }}>
              Sua conta está configurada. Agora você pode começar a adicionar parceiros e criar seus
              mapas.
            </p>
            <Button variant="primary" onClick={finish} disabled={loading}>
              {loading ? 'Salvando…' : 'Ir para o Dashboard'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
