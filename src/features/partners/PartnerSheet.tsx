import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Partner, PartnerColumn } from '../../types'
import { Button, Field, Input, Select, Sheet, useToast } from '../../components/ui'

interface PartnerSheetProps {
  open: boolean
  onClose: () => void
  partner?: Partner | null
}

const BLANK_BASE = {
  name: '',
  address: '',
  pinTypeId: '',
  visibility: 'internal' as 'public' | 'internal',
  notes: '',
}

export default function PartnerSheet({ open, onClose, partner }: PartnerSheetProps) {
  const qc = useQueryClient()
  const { push } = useToast()
  const [form, setForm] = useState(BLANK_BASE)
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({})

  const { data: pinTypes } = useQuery({
    queryKey: ['pinTypes'],
    queryFn: () => api.pinTypes.list(),
    enabled: open,
  })

  const { data: columns = [] } = useQuery<PartnerColumn[]>({
    queryKey: ['partnerColumns'],
    queryFn: () => api.partners.getColumns(),
    enabled: open,
  })

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name,
        address: partner.address ?? '',
        pinTypeId: partner.pinTypeId ?? '',
        visibility: partner.visibility ?? 'internal',
        notes: partner.notes ?? '',
      })
      // Initialise dynamic values from existing partner data
      const dv: Record<string, string> = {}
      for (const col of columns) {
        dv[col.key] = partner.dynamicValues?.[col.key] ?? ''
      }
      setDynamicValues(dv)
    } else {
      setForm(BLANK_BASE)
      setDynamicValues({})
    }
  // columns intentionally omitted so re-fetching columns doesn't reset form mid-edit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner, open])

  // When columns load for the first time while editing, seed missing keys
  useEffect(() => {
    if (!partner || !open) return
    setDynamicValues(prev => {
      const next = { ...prev }
      for (const col of columns) {
        if (!(col.key in next)) {
          next[col.key] = partner.dynamicValues?.[col.key] ?? ''
        }
      }
      return next
    })
  }, [columns, partner, open])

  const set = (k: keyof typeof BLANK_BASE) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const setDyn = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDynamicValues(prev => ({ ...prev, [key]: e.target.value }))

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        address: form.address,
        pinTypeId: form.pinTypeId || undefined,
        visibility: form.visibility,
        notes: form.notes || null,
        // Only include non-empty dynamic values
        dynamicValues: Object.fromEntries(
          Object.entries(dynamicValues).filter(([, v]) => v !== '')
        ),
      }
      return partner ? api.partners.update(partner.id, payload) : api.partners.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] })
      qc.invalidateQueries({ queryKey: ['partner', partner?.id] })
      push({ title: partner ? 'Parceiro atualizado' : 'Parceiro criado', tone: 'success' })
      onClose()
    },
    onError: (err: Error) => {
      push({ title: 'Erro ao salvar', desc: err.message, tone: 'error' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  const hasDynamic = columns.length > 0

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={partner ? 'Editar parceiro' : 'Novo parceiro'}
      subtitle={partner ? `ID: ${partner.id}` : 'Preencha os dados do parceiro'}
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={mutation.isPending || !form.name}>
            {mutation.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Dados principais ─────────────────────── */}
        <SectionLabel>Dados principais</SectionLabel>

        <Field label="Nome" required>
          <Input value={form.name} onChange={set('name')} placeholder="Nome do parceiro" required />
        </Field>

        <Field label="Endereço" hint="Endereço completo para geocodificação">
          <Input value={form.address} onChange={set('address')} placeholder="Rua, número, cidade, estado" />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Tipo de pin">
            <Select value={form.pinTypeId} onChange={set('pinTypeId')}>
              <option value="">Nenhum</option>
              {pinTypes?.map((pt) => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Visibilidade">
            <Select value={form.visibility} onChange={set('visibility')}>
              <option value="internal">Interno</option>
              <option value="public">Público</option>
            </Select>
          </Field>
        </div>

        {/* ── Campos personalizados ────────────────── */}
        {hasDynamic && (
          <>
            <Divider />
            <SectionLabel>Campos personalizados</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {columns.map((col) => (
                <Field key={col.key} label={col.label}>
                  <Input
                    value={dynamicValues[col.key] ?? ''}
                    onChange={setDyn(col.key)}
                    placeholder={col.label}
                  />
                </Field>
              ))}
            </div>
          </>
        )}

        {/* ── Observação ───────────────────────────── */}
        <Divider />
        <SectionLabel>Observação</SectionLabel>
        <Field label="Observação interna" hint="Visível apenas para a equipe">
          <textarea
            className="input"
            style={{
              width: '100%',
              minHeight: 100,
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              fontSize: 13,
              lineHeight: 1.5,
            }}
            placeholder="Adicione uma observação…"
            value={form.notes}
            onChange={set('notes')}
          />
        </Field>
      </form>
    </Sheet>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--fg-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
    }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ borderTop: '1px solid var(--border)', margin: '0 -24px' }} />
}
