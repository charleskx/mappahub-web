import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { Button, OtpInput, useToast } from '../../components/ui'
import AuthAside from './AuthAside'

export default function TwoFactorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const { push } = useToast()
  const state = location.state as { email?: string; password?: string; tempToken?: string } | null

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 6) return
    setLoading(true)
    try {
      await login(state?.email ?? '', state?.password ?? '', code)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Código inválido'
      push({ title: 'Código inválido', desc: msg, tone: 'error' })
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <AuthAside />
      <main className="auth-main">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-header">
            <h1 className="h1">Verificação em duas etapas</h1>
            <p className="muted">
              Abra o seu aplicativo autenticador e insira o código de 6 dígitos.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
            <OtpInput value={code} onChange={setCode} length={6} />

            <Button
              type="submit"
              variant="primary"
              disabled={loading || code.length < 6}
              style={{ width: '100%' }}
            >
              {loading ? 'Verificando…' : 'Verificar código'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
