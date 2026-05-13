import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { Button, Card, Progress, useToast } from '../../components/ui'
import { I } from '../../components/icons'

const STEPS = [
  { title: 'Bem-vindo ao MappaHub', desc: 'Vamos configurar tudo em 3 minutos.' },
  { title: 'Importe seus parceiros', desc: 'Faça upload de uma planilha agora ou depois.' },
  { title: 'Tudo pronto!', desc: 'Seu workspace está configurado.' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const { push } = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const finish = async () => {
    setLoading(true)
    try {
      await refreshUser()
      navigate('/dashboard')
    } catch {
      push({ title: 'Erro ao salvar configurações', tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const cur = STEPS[step]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="sidebar-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" />
            <circle cx="12" cy="9" r="2.5" fill="currentColor" />
          </svg>
        </div>
        <div className="sidebar-wordmark">MappaHub<span className="dot">.</span></div>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" size="sm" onClick={finish}>Pular</Button>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 540 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Passo {step + 1} de {STEPS.length}</div>
          <Progress value={(step + 1) / STEPS.length * 100} />
          <h1 className="h1" style={{ marginTop: 24 }}>{cur.title}</h1>
          <div className="muted" style={{ marginTop: 6 }}>{cur.desc}</div>

          <div style={{ marginTop: 28 }}>
            {step === 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                {[
                  { icon: <I.upload />, label: 'Importar planilha', desc: '.xlsx ou .csv' },
                  { icon: <I.map />, label: 'Mapas interativos', desc: 'Internos & públicos' },
                  { icon: <I.code />, label: 'Embed em sites', desc: 'iframe ou SDK' },
                ].map((f, i) => (
                  <div key={i} className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>{f.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{f.label}</div>
                    <div className="muted text-xs">{f.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="dropzone">
                <div className="dropzone-icon"><I.upload /></div>
                <div style={{ fontWeight: 600 }}>Arraste sua planilha aqui</div>
                <div className="muted text-xs">.xlsx ou .csv · até 50 MB</div>
                <Button variant="outline" size="sm" style={{ marginTop: 8 }}>Escolher arquivo</Button>
              </div>
            )}

            {step === 2 && (
              <Card>
                <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
                  <div style={{ margin: '0 auto 12px', width: 56, height: 56, borderRadius: '50%', background: 'var(--success-soft)', color: 'var(--success)', display: 'grid', placeItems: 'center' }}>
                    <I.check size={28} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>Workspace pronto!</div>
                  <div className="muted text-sm" style={{ marginTop: 4 }}>Você tem 14 dias grátis para explorar tudo.</div>
                </div>
              </Card>
            )}
          </div>

          <div style={{ marginTop: 32, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            {step > 0
              ? <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Voltar</Button>
              : <span />
            }
            <Button
              variant="primary"
              size="lg"
              disabled={loading}
              onClick={() => step === STEPS.length - 1 ? finish() : setStep((s) => s + 1)}
            >
              {step === STEPS.length - 1
                ? (loading ? 'Salvando…' : 'Ir para o dashboard')
                : 'Continuar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
