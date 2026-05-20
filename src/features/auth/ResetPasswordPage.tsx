import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button, Field, Input, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import AuthAside from './AuthAside'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { push } = useToast()
  const token = params.get('token') ?? ''

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
              Este link de redefinição é inválido ou expirou.
            </div>
            <div className="auth-form-fields" style={{ marginTop: 20 }}>
              <Button variant="primary" size="lg" onClick={() => navigate('/forgot')}>
                Solicitar novo link
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 12) {
      setError('A senha deve ter ao menos 12 caracteres')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      await api.auth.resetPassword(token, password)
      push({ title: 'Senha redefinida!', desc: 'Faça login com sua nova senha.', tone: 'success' })
      navigate('/login')
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Link inválido ou expirado')
        : 'Link inválido ou expirado'
      setError(msg)
      push({ title: 'Erro ao redefinir senha', desc: msg, tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <AuthAside />
      <div className="auth-form-wrap">
        <div className="auth-form">
          <h1 className="h1">Nova senha</h1>
          <div className="muted text-sm">Escolha uma senha segura para sua conta.</div>
          <form className="auth-form-fields" onSubmit={handleSubmit}>
            <Field label="Nova senha" error={error || undefined}>
              <div style={{ position: 'relative' }}>
                <Input
                  icon={<I.lock />}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Mínimo 12 caracteres"
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
              {loading ? 'Salvando…' : 'Redefinir senha'}
            </Button>
          </form>
          <div className="auth-form-foot">
            <Link to="/login">← Voltar para o login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
