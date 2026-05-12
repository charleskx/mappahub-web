import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { api } from '../../lib/api'
import { Button, Input, OtpInput, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import AuthAside from './AuthAside'

export default function TwoFactorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { loginWithTotp, refreshUser } = useAuth()
  const { push } = useToast()
  const state = location.state as { tempToken?: string } | null

  const [mode, setMode] = useState<'totp' | 'recovery'>('totp')
  const [code, setCode] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmitTotp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 6) { setError('Insira o código de 6 dígitos.'); return }
    if (!state?.tempToken) { setError('Sessão expirada. Faça login novamente.'); return }
    setError('')
    setLoading(true)
    try {
      await loginWithTotp(state.tempToken, code)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Código inválido'
      push({ title: 'Código inválido', desc: msg, tone: 'error' })
      setError(msg)
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recoveryCode.trim()) { setError('Insira o código de recuperação.'); return }
    if (!state?.tempToken) { setError('Sessão expirada. Faça login novamente.'); return }
    setError('')
    setLoading(true)
    try {
      await api.auth.loginWithRecoveryCode(state.tempToken, recoveryCode.trim())
      await refreshUser()
      navigate('/dashboard')
    } catch {
      setError('Código de recuperação inválido ou já utilizado.')
      setRecoveryCode('')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (next: 'totp' | 'recovery') => {
    setMode(next)
    setCode('')
    setRecoveryCode('')
    setError('')
  }

  return (
    <div className="auth-page">
      <AuthAside />
      <div className="auth-form-wrap">
        {mode === 'totp' ? (
          <form className="auth-form" style={{ textAlign: 'center' }} onSubmit={handleSubmitTotp}>
            <div style={{ margin: '0 auto 16px', width: 56, height: 56, borderRadius: 14, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
              <I.shield size={24} />
            </div>
            <h1 className="h1">Verificação em duas etapas</h1>
            <div className="muted text-sm" style={{ marginTop: 6 }}>
              Insira o código gerado pelo seu app autenticador
            </div>
            <div style={{ margin: '28px 0 12px' }}>
              <OtpInput value={code} onChange={setCode} length={6} />
            </div>
            {error && (
              <div className="error-text" style={{ justifyContent: 'center' }}>
                <I.alert size={12} />{error}
              </div>
            )}
            <div className="auth-form-fields" style={{ marginTop: 16 }}>
              <Button variant="primary" size="lg" type="submit" disabled={loading || code.length < 6}>
                {loading ? 'Verificando…' : 'Verificar e entrar'}
              </Button>
              <button
                type="button"
                className="text-sm muted"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--fg-muted)' }}
                onClick={() => switchMode('recovery')}
              >
                Usar código de recuperação
              </button>
            </div>
            <div className="auth-form-foot">
              <Link to="/login">← Cancelar</Link>
            </div>
          </form>
        ) : (
          <form className="auth-form" style={{ textAlign: 'center' }} onSubmit={handleSubmitRecovery}>
            <div style={{ margin: '0 auto 16px', width: 56, height: 56, borderRadius: 14, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
              <I.key size={24} />
            </div>
            <h1 className="h1">Código de recuperação</h1>
            <div className="muted text-sm" style={{ marginTop: 6 }}>
              Insira um dos códigos de recuperação gerados quando você ativou o 2FA
            </div>
            <div style={{ margin: '28px 0 12px' }}>
              <Input
                placeholder="XXXX-XXXX"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontSize: 16 }}
                autoFocus
              />
            </div>
            {error && (
              <div className="error-text" style={{ justifyContent: 'center' }}>
                <I.alert size={12} />{error}
              </div>
            )}
            <div className="auth-form-fields" style={{ marginTop: 16 }}>
              <Button variant="primary" size="lg" type="submit" disabled={loading || !recoveryCode.trim()}>
                {loading ? 'Verificando…' : 'Entrar com código de recuperação'}
              </Button>
              <button
                type="button"
                className="text-sm muted"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--fg-muted)' }}
                onClick={() => switchMode('totp')}
              >
                Usar app autenticador
              </button>
            </div>
            <div className="auth-form-foot">
              <Link to="/login">← Cancelar</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
