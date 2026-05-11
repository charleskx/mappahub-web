import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button, Field, Input, useToast } from '../../components/ui'
import AuthAside from './AuthAside'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { push } = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
    <div className="auth-layout">
      <AuthAside />
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="h1">Criar conta grátis</h1>
            <p className="muted">Comece seu trial de 30 dias, sem cartão de crédito.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Nome completo" error={errors.name}>
              <Input
                placeholder="Ana Costa"
                value={form.name}
                onChange={set('name')}
                required
                autoComplete="name"
              />
            </Field>

            <Field label="E-mail corporativo" error={errors.email}>
              <Input
                type="email"
                placeholder="ana@empresa.com"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Empresa" error={errors.company}>
              <Input
                placeholder="Acme Ltda."
                value={form.company}
                onChange={set('company')}
                required
              />
            </Field>

            <Field label="Senha" error={errors.password || errors.general}>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={set('password')}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Criando conta…' : 'Criar conta'}
            </Button>
          </form>

          <p className="auth-footer-text">
            Já tem conta?{' '}
            <Link to="/login" className="link">
              Entrar
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
