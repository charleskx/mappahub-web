import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Partner } from '../../types'
import { Button, Field, Input, Select, Sheet, Switch, useToast } from '../../components/ui'

interface PartnerSheetProps {
  open: boolean
  onClose: () => void
  partner?: Partner | null
}

const BLANK = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  lat: '',
  lng: '',
  pinTypeId: '',
  active: true,
  notes: '',
}

export default function PartnerSheet({ open, onClose, partner }: PartnerSheetProps) {
  const qc = useQueryClient()
  const { push } = useToast()
  const [form, setForm] = useState(BLANK)

  const { data: pinTypes } = useQuery({
    queryKey: ['pinTypes'],
    queryFn: () => api.pinTypes.list(),
    enabled: open,
  })

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name,
        email: partner.email ?? '',
        phone: partner.phone ?? '',
        address: partner.address ?? '',
        city: partner.city ?? '',
        state: partner.state ?? '',
        zipCode: partner.zipCode ?? '',
        lat: partner.lat != null ? String(partner.lat) : '',
        lng: partner.lng != null ? String(partner.lng) : '',
        pinTypeId: partner.pinTypeId ?? '',
        active: partner.active,
        notes: partner.notes ?? '',
      })
    } else {
      setForm(BLANK)
    }
  }, [partner, open])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload = {
        ...data,
        lat: data.lat ? Number(data.lat) : undefined,
        lng: data.lng ? Number(data.lng) : undefined,
        pinTypeId: data.pinTypeId || undefined,
      }
      return partner ? api.partners.update(partner.id, payload) : api.partners.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] })
      push({ title: partner ? 'Parceiro atualizado' : 'Parceiro criado', tone: 'success' })
      onClose()
    },
    onError: (err: Error) => {
      push({ title: 'Erro ao salvar', desc: err.message, tone: 'error' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(form)
  }

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
          <Button variant="primary" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Nome" required>
          <Input value={form.name} onChange={set('name')} placeholder="Nome do parceiro" required />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="E-mail">
            <Input type="email" value={form.email} onChange={set('email')} placeholder="email@parceiro.com" />
          </Field>
          <Field label="Telefone">
            <Input value={form.phone} onChange={set('phone')} placeholder="(11) 99999-9999" />
          </Field>
        </div>

        <Field label="Endereço">
          <Input value={form.address} onChange={set('address')} placeholder="Rua, número, complemento" />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
          <Field label="Cidade">
            <Input value={form.city} onChange={set('city')} placeholder="São Paulo" />
          </Field>
          <Field label="Estado">
            <Input value={form.state} onChange={set('state')} placeholder="SP" maxLength={2} />
          </Field>
          <Field label="CEP">
            <Input value={form.zipCode} onChange={set('zipCode')} placeholder="00000-000" />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Latitude" hint="Ex: -23.5505">
            <Input value={form.lat} onChange={set('lat')} placeholder="-23.5505" />
          </Field>
          <Field label="Longitude" hint="Ex: -46.6333">
            <Input value={form.lng} onChange={set('lng')} placeholder="-46.6333" />
          </Field>
        </div>

        <Field label="Tipo de pin">
          <Select value={form.pinTypeId} onChange={set('pinTypeId')}>
            <option value="">Selecione um tipo</option>
            {pinTypes?.map((pt) => (
              <option key={pt.id} value={pt.id}>{pt.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Observações">
          <textarea
            className="textarea"
            value={form.notes}
            onChange={set('notes')}
            placeholder="Informações adicionais"
            rows={3}
          />
        </Field>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="label">Parceiro ativo</span>
          <Switch checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />
        </div>
      </form>
    </Sheet>
  )
}
