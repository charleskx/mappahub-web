import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button, Field, Input, useToast } from '../../components/ui'
import AuthAside from './AuthAside'

export default function ForgotPage() {
  const { push } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.auth.forgotPassword(email)
      setSent(true)
      push({ title: 'E-mail enviado', desc: 'Verifique sua caixa de entrada.', tone: 'success' })
    } catch {
      push({ title: 'Erro', desc: 'Não foi possível enviar o e-mail.', tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <AuthAside />
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="h1">Recuperar senha</h1>
            <p className="muted">
              {sent
                ? 'Enviamos um link de recuperação para o seu e-mail.'
                : 'Informe seu e-mail e enviaremos as instruções.'}
            </p>
          </div>

          {!sent && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="E-mail">
                <Input
                  type="email"
                  placeholder="voce@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>

              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Enviando…' : 'Enviar link'}
              </Button>
            </form>
          )}

          <p className="auth-footer-text">
            <Link to="/login" className="link">
              ← Voltar para o login
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
