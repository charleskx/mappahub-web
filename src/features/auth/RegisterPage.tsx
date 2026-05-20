import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth'
import { Button, Field, Input, Select, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import AuthAside from './AuthAside'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuth()
  const { push } = useToast()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', size: '', source: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await api.auth.register(form.name, form.email, form.password, form.company)
      push({ title: 'Conta criada!', desc: 'Verifique seu e-mail para ativar a conta.', tone: 'success' })
      navigate('/verify-email', { state: { email: form.email } })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta'
      push({ title: 'Erro', desc: msg, tone: 'error' })
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <AuthAside />
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="eyebrow">Passo {step} de 2</div>
          <h1 className="h1" style={{ marginTop: 6 }}>
            {step === 1 ? 'Crie sua conta' : 'Sobre sua empresa'}
          </h1>
          <div className="muted text-sm">
            {step === 1
              ? '14 dias grátis. Sem cartão de crédito.'
              : 'Vamos personalizar o workspace.'}
          </div>
          <div className="auth-form-fields">
            {step === 1 && (
              <>
                <GoogleLogin
                  onSuccess={async (response) => {
                    if (!response.credential) return
                    try {
                      await loginWithGoogle(response.credential)
                      navigate('/dashboard')
                    } catch {
                      push({ title: 'Erro ao entrar com Google', desc: 'Tente novamente.', tone: 'error' })
                    }
                  }}
                  onError={() => push({ title: 'Erro ao entrar com Google', desc: 'Tente novamente.', tone: 'error' })}
                  width="100%"
                  text="signup_with"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>ou crie com e-mail</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
              </>
            )}
            {step === 1 ? (
              <>
                <Field label="Nome completo">
                  <Input
                    placeholder="Ana Costa"
                    value={form.name}
                    onChange={set('name')}
                    required
                    autoComplete="name"
                  />
                </Field>
                <Field label="E-mail de trabalho">
                  <Input
                    icon={<I.mail />}
                    type="email"
                    placeholder="ana@empresa.com"
                    value={form.email}
                    onChange={set('email')}
                    required
                    autoComplete="email"
                  />
                </Field>
                <Field label="Senha" hint="Mínimo 12 caracteres">
                  <Input
                    icon={<I.lock />}
                    type="password"
                    placeholder="Mínimo 12 caracteres"
                    value={form.password}
                    onChange={set('password')}
                    required
                    minLength={12}
                    autoComplete="new-password"
                  />
                </Field>
                <Button variant="primary" size="lg" onClick={() => setStep(2)}>
                  Continuar
                </Button>
              </>
            ) : (
              <>
                <Field label="Nome da empresa / workspace" error={errors.general}>
                  <Input
                    icon={<I.building />}
                    placeholder="Acme Co."
                    value={form.company}
                    onChange={set('company')}
                    required
                  />
                </Field>
                <Field label="Quantos parceiros você gerencia?">
                  <Select value={form.size} onChange={set('size')}>
                    <option value="">Selecione...</option>
                    <option value="lt100">Menos de 100</option>
                    <option value="100-1000">100 – 1.000</option>
                    <option value="1000-10000">1.000 – 10.000</option>
                    <option value="gt10000">Mais de 10.000</option>
                  </Select>
                </Field>
                <Field label="Como nos conheceu?">
                  <Select value={form.source} onChange={set('source')}>
                    <option value="">Selecione...</option>
                    <option value="referral">Indicação</option>
                    <option value="google">Google</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="other">Outro</option>
                  </Select>
                </Field>
                <p style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.55, margin: 0 }}>
                  Ao criar sua conta, você concorda com nossos{' '}
                  <a href="/privacy-policy" target="_blank" style={{ color: 'var(--accent)' }}>
                    Termos de Uso e Política de Privacidade
                  </a>
                  . Seus dados serão usados exclusivamente para operar a plataforma, conforme a{' '}
                  <strong>LGPD (Lei 13.709/2018)</strong>.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    style={{ flex: 1 }}
                    disabled={loading}
                    onClick={handleSubmit as unknown as React.MouseEventHandler}
                  >
                    {loading ? 'Criando…' : 'Criar conta e iniciar trial'}
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="auth-form-foot">
            Já tem conta? <Link to="/login">Entrar</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
