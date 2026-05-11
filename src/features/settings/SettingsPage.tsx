import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth'
import { Button, Card, CardHeader, Field, Input, Modal, OtpInput, Tabs, useToast } from '../../components/ui'

function ProfileTab() {
  const { user, refreshUser } = useAuth()
  const { push } = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    try {
      await api.settings.updateProfile({ name })
      await refreshUser()
      push({ title: 'Perfil atualizado', tone: 'success' })
    } catch {
      push({ title: 'Erro ao salvar', tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Perfil" desc="Informações da sua conta" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
        <Field label="Nome">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="E-mail">
          <Input value={user?.email ?? ''} disabled />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={save} disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function SecurityTab() {
  const { push } = useToast()
  const { user, refreshUser } = useAuth()
  const [setupOpen, setSetupOpen] = useState(false)
  const [qrData, setQrData] = useState<{ qrCode: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [disableOpen, setDisableOpen] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const openSetup = async () => {
    try {
      const data = await api.settings.setup2fa()
      setQrData(data)
      setSetupOpen(true)
    } catch {
      push({ title: 'Erro ao gerar QR Code', tone: 'error' })
    }
  }

  const confirmSetup = async () => {
    if (code.length < 6) return
    try {
      await api.settings.verify2fa(code)
      await refreshUser()
      push({ title: '2FA ativado!', tone: 'success' })
      setSetupOpen(false)
      setCode('')
      setQrData(null)
    } catch {
      push({ title: 'Código inválido', tone: 'error' })
    }
  }

  const confirmDisable = async () => {
    if (disableCode.length < 6) return
    try {
      await api.settings.disable2fa(disableCode)
      await refreshUser()
      push({ title: '2FA desativado', tone: 'success' })
      setDisableOpen(false)
      setDisableCode('')
    } catch {
      push({ title: 'Código inválido', tone: 'error' })
    }
  }

  const changePassword = async () => {
    if (!oldPw || !newPw) return
    setPwLoading(true)
    try {
      await api.settings.changePassword(oldPw, newPw)
      push({ title: 'Senha alterada', tone: 'success' })
      setOldPw('')
      setNewPw('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar senha'
      push({ title: 'Erro', desc: msg, tone: 'error' })
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader title="Autenticação em dois fatores" desc="Adicione uma camada extra de segurança à sua conta" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
          <div>
            <div style={{ fontWeight: 500 }}>
              {user?.twoFactorEnabled ? '2FA ativado' : '2FA desativado'}
            </div>
            <div className="muted text-sm">
              {user?.twoFactorEnabled
                ? 'Sua conta está protegida com autenticação de dois fatores.'
                : 'Ative o 2FA para aumentar a segurança da sua conta.'}
            </div>
          </div>
          <Button
            variant={user?.twoFactorEnabled ? 'danger' : 'primary'}
            onClick={() => user?.twoFactorEnabled ? setDisableOpen(true) : openSetup()}
          >
            {user?.twoFactorEnabled ? 'Desativar 2FA' : 'Ativar 2FA'}
          </Button>
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <CardHeader title="Alterar senha" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          <Field label="Senha atual">
            <Input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder="••••••••" />
          </Field>
          <Field label="Nova senha">
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={changePassword} disabled={pwLoading || !oldPw || !newPw}>
              {pwLoading ? 'Salvando…' : 'Alterar senha'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 2FA setup modal */}
      <Modal
        open={setupOpen}
        onClose={() => { setSetupOpen(false); setCode(''); setQrData(null) }}
        title="Ativar autenticação em dois fatores"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setSetupOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={confirmSetup} disabled={code.length < 6}>Ativar 2FA</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', textAlign: 'center' }}>
          <p className="muted text-sm" style={{ textAlign: 'left', width: '100%' }}>
            1. Escaneie o QR Code com o seu aplicativo autenticador (Google Authenticator, Authy, etc.)
          </p>
          {qrData && (
            <img src={qrData.qrCode} alt="QR Code 2FA" style={{ width: 200, height: 200, borderRadius: 8 }} />
          )}
          {qrData && (
            <div style={{ textAlign: 'left', width: '100%' }}>
              <div className="muted text-sm" style={{ marginBottom: 4 }}>Ou insira a chave manualmente:</div>
              <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--bg-subtle)', padding: '4px 8px', borderRadius: 4 }}>
                {qrData.secret}
              </code>
            </div>
          )}
          <p className="muted text-sm" style={{ textAlign: 'left', width: '100%' }}>
            2. Insira o código de 6 dígitos gerado pelo aplicativo:
          </p>
          <OtpInput value={code} onChange={setCode} length={6} />
        </div>
      </Modal>

      {/* Disable 2FA modal */}
      <Modal
        open={disableOpen}
        onClose={() => { setDisableOpen(false); setDisableCode('') }}
        title="Desativar 2FA"
        desc="Insira o código do seu aplicativo autenticador para confirmar."
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setDisableOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDisable} disabled={disableCode.length < 6}>Desativar</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <OtpInput value={disableCode} onChange={setDisableCode} length={6} />
        </div>
      </Modal>
    </>
  )
}

function WorkspaceTab() {
  const { push } = useToast()
  const qc = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
  })
  const [mapsKey, setMapsKey] = useState('')

  useEffect(() => {
    if (settings) setMapsKey(settings.mapsKey ?? '')
  }, [settings])

  const mutation = useMutation({
    mutationFn: () => api.settings.update({ mapsKey }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      push({ title: 'Configurações salvas', tone: 'success' })
    },
    onError: () => push({ title: 'Erro ao salvar', tone: 'error' }),
  })

  if (isLoading) return <div className="muted">Carregando…</div>

  return (
    <Card>
      <CardHeader title="Configurações do workspace" desc="Personalize as configurações da sua empresa" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
        <Field
          label="Google Maps API Key"
          hint="Necessária para exibir o mapa interativo de parceiros"
        >
          <Input
            value={mapsKey}
            onChange={(e) => setMapsKey(e.target.value)}
            placeholder="AIza..."
          />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando…' : 'Salvar configurações'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'profile'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="h1">Configurações</h1>
        <p className="muted text-sm">Gerencie sua conta e preferências do workspace</p>
      </div>

      <Tabs
        value={tab}
        onChange={(v) => setSearchParams({ tab: v })}
        items={[
          { value: 'profile', label: 'Perfil' },
          { value: 'security', label: 'Segurança' },
          { value: 'workspace', label: 'Workspace' },
        ]}
      />

      <div>
        {tab === 'profile' && <ProfileTab />}
        {tab === 'security' && <SecurityTab />}
        {tab === 'workspace' && <WorkspaceTab />}
      </div>
    </div>
  )
}
