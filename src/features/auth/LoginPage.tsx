import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { Button, Checkbox, Field, Input, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import AuthAside from './AuthAside'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { push } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
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
    <div className="auth-page">
      <AuthAside />
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1 className="h1">Bem-vindo de volta</h1>
          <div className="muted text-sm">Entre na sua conta MappaHub</div>
          <div className="auth-form-fields">
            <Field label="E-mail">
              <Input
                icon={<I.mail />}
                type="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>
            <Field
              label={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>Senha</span>
                  <Link to="/forgot" style={{ color: 'var(--accent)', fontSize: 12 }}>
                    Esqueci minha senha
                  </Link>
                </div>
              }
              error={error || undefined}
            >
              <div style={{ position: 'relative' }}>
                <Input
                  icon={<I.lock />}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 36 }}
                />
                <button
                  type="button"
                  className="icon-btn"
                  style={{ position: 'absolute', right: 2, top: 2 }}
                  onClick={() => setShowPw((s) => !s)}
                >
                  {showPw ? <I.eyeOff /> : <I.eye />}
                </button>
              </div>
            </Field>
            <Checkbox
              checked={remember}
              onChange={setRemember}
              label={<span style={{ fontSize: 12.5 }} className="muted">Manter conectado por 30 dias</span>}
            />
            <Button variant="primary" size="lg" type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </div>
          <div className="auth-form-foot">
            Não tem uma conta?{' '}
            <Link to="/register">Criar conta grátis</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
