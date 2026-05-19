import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button, Field, Input, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import AuthAside from './AuthAside'

export default function AcceptInvitePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { push } = useToast()
  const token = params.get('token') ?? ''

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!token) {
    return (
      <div className="auth-page">
        <AuthAside />
        <div className="auth-form-wrap">
          <div className="auth-form" style={{ textAlign: 'center' }}>
            <div style={{ margin: '0 auto 16px', width: 56, height: 56, borderRadius: 14, background: 'var(--danger-soft)', color: 'var(--danger)', display: 'grid', placeItems: 'center' }}>
              <I.alert size={28} />
            </div>
            <h1 className="h1">Link inválido</h1>
            <div className="muted text-sm" style={{ marginTop: 6 }}>
              Este link de convite é inválido ou expirou.
            </div>
            <div className="auth-form-fields" style={{ marginTop: 20 }}>
              <Link to="/login">
                <Button variant="primary" size="lg">Ir para o login</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (name.trim().length < 2) {
      setError('O nome deve ter ao menos 2 caracteres')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      await api.auth.acceptInvite(token, name.trim(), password)
      push({ title: 'Bem-vindo ao MappaHub!', desc: 'Sua conta foi ativada com sucesso.', tone: 'success' })
      navigate('/dashboard')
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Link inválido ou expirado')
        : 'Link inválido ou expirado'
      setError(msg)
      push({ title: 'Erro ao ativar conta', desc: msg, tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <AuthAside />
      <div className="auth-form-wrap">
        <div className="auth-form">
          <h1 className="h1">Ativar conta</h1>
          <div className="muted text-sm">Você foi convidado para o MappaHub. Configure seu acesso abaixo.</div>
          <form className="auth-form-fields" onSubmit={handleSubmit}>
            <Field label="Seu nome" error={error || undefined}>
              <Input
                icon={<I.user />}
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                autoFocus
              />
            </Field>
            <Field label="Senha">
              <div style={{ position: 'relative' }}>
                <Input
                  icon={<I.lock />}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', display: 'flex', padding: 0 }}
                >
                  {showPw ? <I.eyeOff size={16} /> : <I.eye size={16} />}
                </button>
              </div>
            </Field>
            <Field label="Confirmar senha">
              <Input
                icon={<I.lock />}
                type={showPw ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>
            <Button variant="primary" size="lg" type="submit" disabled={loading}>
              {loading ? 'Ativando…' : 'Ativar conta'}
            </Button>
          </form>
          <div className="auth-form-foot">
            <Link to="/login">← Já tenho uma conta</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
