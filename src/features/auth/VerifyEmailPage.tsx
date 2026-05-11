import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import AuthAside from './AuthAside'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { push } = useToast()
  const token = params.get('token')
  const email = (location.state as { email?: string })?.email ?? ''

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) return
    setStatus('verifying')
    api.auth
      .verifyEmail(token)
      .then(() => {
        setStatus('success')
        push({ title: 'E-mail verificado!', desc: 'Sua conta está ativa.', tone: 'success' })
        setTimeout(() => navigate('/login'), 2000)
      })
      .catch(() => {
        setStatus('error')
        push({ title: 'Link inválido', desc: 'O link expirou ou já foi usado.', tone: 'error' })
      })
  }, [token, navigate, push])

  const resend = async () => {
    if (!email) return
    setResending(true)
    try {
      await api.auth.resendVerification(email)
      push({ title: 'E-mail reenviado', tone: 'success' })
    } catch {
      push({ title: 'Erro ao reenviar', tone: 'error' })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-layout">
      <AuthAside />
      <main className="auth-main">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          {status === 'verifying' && (
            <>
              <div className="skel" style={{ width: 48, height: 48, borderRadius: 24, margin: '0 auto 16px' }} />
              <h1 className="h1">Verificando…</h1>
            </>
          )}
          {status === 'success' && (
            <>
              <div style={{ color: 'var(--success)', marginBottom: 16 }}><I.check size={48} /></div>
              <h1 className="h1">E-mail verificado!</h1>
              <p className="muted">Redirecionando para o login…</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div style={{ color: 'var(--danger)', marginBottom: 16 }}><I.alert size={48} /></div>
              <h1 className="h1">Link inválido</h1>
              <p className="muted">O link expirou ou já foi utilizado.</p>
              {email && (
                <Button variant="primary" onClick={resend} disabled={resending} style={{ marginTop: 16 }}>
                  {resending ? 'Reenviando…' : 'Reenviar e-mail'}
                </Button>
              )}
            </>
          )}
          {status === 'idle' && (
            <>
              <div style={{ color: 'var(--amber)', marginBottom: 16 }}><I.mail size={48} /></div>
              <h1 className="h1">Verifique seu e-mail</h1>
              <p className="muted">
                Enviamos um link de confirmação para <strong>{email}</strong>. Clique nele para ativar sua
                conta.
              </p>
              {email && (
                <Button variant="ghost" onClick={resend} disabled={resending} style={{ marginTop: 16 }}>
                  {resending ? 'Reenviando…' : 'Reenviar e-mail'}
                </Button>
              )}
            </>
          )}
          <p className="auth-footer-text" style={{ marginTop: 24 }}>
            <Link to="/login" className="link">← Voltar para o login</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
