import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { Button, Field, Input, useToast } from '../../components/ui'
import AuthAside from './AuthAside'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { push } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.requiresTwoFactor && result.tempToken) {
        navigate('/2fa', { state: { tempToken: result.tempToken } })
        return
      }
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Credenciais inválidas'
      setError(msg)
      push({ title: 'Erro ao entrar', desc: msg, tone: 'error' })
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
            <h1 className="h1">Bem-vindo de volta</h1>
            <p className="muted">Entre com suas credenciais para acessar a plataforma.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="E-mail" error={error ? ' ' : undefined}>
              <Input
                type="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Senha" error={error || undefined}>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>

            <div style={{ textAlign: 'right' }}>
              <Link to="/forgot" className="link" style={{ fontSize: 13 }}>
                Esqueci minha senha
              </Link>
            </div>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <p className="auth-footer-text">
            Não tem conta?{' '}
            <Link to="/register" className="link">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
