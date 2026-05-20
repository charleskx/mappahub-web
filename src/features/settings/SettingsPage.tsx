import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth'
import { Button, Card, CardHeader, Field, Input, Modal, OtpInput, Tabs, useToast } from '../../components/ui'
import { I } from '../../components/icons'

function ProfileTab() {
  const { user, refreshUser } = useAuth()
  const { push } = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      await api.users.update(user.id, { name })
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
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)

  const openSetup = async () => {
    try {
      const data = await api.auth.setup2fa()
      setQrData(data)
      setSetupOpen(true)
    } catch {
      push({ title: 'Erro ao gerar QR Code', tone: 'error' })
    }
  }

  const confirmSetup = async () => {
    if (code.length < 6) return
    try {
      const result = await api.auth.verify2fa(code)
      await refreshUser()
      setSetupOpen(false)
      setCode('')
      setQrData(null)
      setRecoveryCodes(result.recoveryCodes)
    } catch {
      push({ title: 'Código inválido', tone: 'error' })
    }
  }

  const confirmDisable = async () => {
    if (disableCode.length < 6) return
    try {
      await api.auth.disable2fa(disableCode)
      await refreshUser()
      push({ title: '2FA desativado', tone: 'success' })
      setDisableOpen(false)
      setDisableCode('')
    } catch {
      push({ title: 'Código inválido', tone: 'error' })
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Autenticação em dois fatores"
          desc="Adicione uma camada extra de segurança à sua conta"
        />
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 500 }}>
              {user?.twoFactorEnabled ? '2FA ativado' : '2FA desativado'}
            </div>
            <div className="muted text-sm" style={{ marginTop: 2 }}>
              {user?.twoFactorEnabled
                ? 'Sua conta está protegida com autenticação de dois fatores.'
                : 'Ative o 2FA para aumentar a segurança da sua conta.'}
            </div>
          </div>
          <Button
            variant={user?.twoFactorEnabled ? 'danger' : 'primary'}
            onClick={() => (user?.twoFactorEnabled ? setDisableOpen(true) : openSetup())}
          >
            {user?.twoFactorEnabled ? 'Desativar 2FA' : 'Ativar 2FA'}
          </Button>
        </div>
      </Card>

      {/* Setup 2FA modal */}
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

      {/* Recovery codes modal */}
      <Modal
        open={!!recoveryCodes}
        onClose={() => setRecoveryCodes(null)}
        title="2FA ativado — guarde seus códigos"
        desc="Salve estes códigos em um lugar seguro. Cada um pode ser usado uma vez para acessar sua conta caso perca o dispositivo."
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={() => setRecoveryCodes(null)}>Entendi, já salvei</Button>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '4px 0' }}>
          {recoveryCodes?.map((c) => (
            <code key={c} style={{
              fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
              background: 'var(--bg-subtle)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '7px 12px', textAlign: 'center',
              letterSpacing: '0.08em', color: 'var(--fg)',
            }}>{c}</code>
          ))}
        </div>
        <div className="muted text-xs" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <I.alert size={12} />
          Estes códigos não serão exibidos novamente.
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
  const [publicMap, setPublicMap] = useState(false)
  const [brandName, setBrandName] = useState('')
  const [brandWebsiteUrl, setBrandWebsiteUrl] = useState('')
  const [brandColor, setBrandColor] = useState('#4f46e5')
  const [brandFooterText, setBrandFooterText] = useState('')
  const [brandLogoUrl, setBrandLogoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (settings) {
      setPublicMap(settings.publicMapEnabled ?? false)
      setBrandName(settings.brandName ?? '')
      setBrandWebsiteUrl(settings.brandWebsiteUrl ?? '')
      setBrandColor(settings.brandColor ?? '#4f46e5')
      setBrandFooterText(settings.brandFooterText ?? '')
      setBrandLogoUrl(settings.brandLogoUrl ?? '')
    }
  }, [settings])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await api.settings.uploadLogo(file)
      setBrandLogoUrl(url)
      push({ title: 'Logo enviada!', tone: 'success' })
    } catch {
      push({ title: 'Erro ao enviar logo', desc: 'Use JPG, PNG ou WebP até 2 MB', tone: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const mutation = useMutation({
    mutationFn: () => api.settings.update({
      publicMapEnabled: publicMap,
      brandName: brandName || null,
      brandWebsiteUrl: brandWebsiteUrl || null,
      brandColor: brandColor || null,
      brandFooterText: brandFooterText || null,
      brandLogoUrl: brandLogoUrl || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      push({ title: 'Configurações salvas', tone: 'success' })
    },
    onError: () => push({ title: 'Erro ao salvar', tone: 'error' }),
  })

  if (isLoading) return <div className="muted">Carregando…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <CardHeader title="Mapa público" desc="Controle a visibilidade e embeds do mapa" />
        <div className="card-body">
          <Field label="Mapa público" hint="Permite gerar embeds públicos do mapa de parceiros">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="public-map"
                checked={publicMap}
                onChange={(e) => setPublicMap(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="public-map" style={{ cursor: 'pointer', fontSize: 14 }}>
                Habilitar mapa público
              </label>
            </div>
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Personalização do mapa público" desc="Adicione sua marca ao mapa público" />
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Logo" hint="JPG, PNG ou WebP — máx. 2 MB">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {brandLogoUrl && (
                <img
                  src={brandLogoUrl}
                  alt="Logo"
                  style={{ height: 40, maxWidth: 120, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border)', padding: 4 }}
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleLogoUpload}
              />
              <Button variant="ghost" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? 'Enviando…' : brandLogoUrl ? 'Trocar logo' : 'Enviar logo'}
              </Button>
              {brandLogoUrl && (
                <Button variant="ghost" size="sm" onClick={() => setBrandLogoUrl('')}>Remover</Button>
              )}
            </div>
          </Field>

          <Field label="Nome da empresa">
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Ex: Minha Empresa"
            />
          </Field>

          <Field label="Site" hint="Link ao clicar na logo">
            <Input
              value={brandWebsiteUrl}
              onChange={(e) => setBrandWebsiteUrl(e.target.value)}
              placeholder="https://empresa.com.br"
            />
          </Field>

          <Field label="Cor primária">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                style={{ width: 40, height: 36, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }}
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#4f46e5"
                style={{ maxWidth: 120 }}
              />
            </div>
          </Field>

          <Field label="Texto do rodapé" hint="Aparece na parte inferior do mapa público">
            <Input
              value={brandFooterText}
              onChange={(e) => setBrandFooterText(e.target.value)}
              placeholder="Ex: © 2025 Minha Empresa. Todos os direitos reservados."
            />
          </Field>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={() => mutation.mutate()} disabled={mutation.isPending || uploading}>
          {mutation.isPending ? 'Salvando…' : 'Salvar configurações'}
        </Button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const isEmployee = user?.role === 'employee'
  const tab = searchParams.get('tab') ?? 'profile'

  const tabs = [
    { value: 'profile', label: 'Perfil' },
    { value: 'security', label: 'Segurança' },
    ...(!isEmployee ? [{ value: 'workspace', label: 'Workspace' }] : []),
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="h1">Configurações</h1>
          <div className="muted text-sm">Gerencie sua conta e preferências do workspace</div>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={(v) => setSearchParams({ tab: v })}
        items={tabs}
      />

      {tab === 'profile' && <ProfileTab />}
      {tab === 'security' && <SecurityTab />}
      {tab === 'workspace' && !isEmployee && <WorkspaceTab />}
    </div>
  )
}
