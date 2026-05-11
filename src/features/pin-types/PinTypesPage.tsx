import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { PinType } from '../../types'
import { Button, Empty, Field, Input, Modal, Skeleton, useToast } from '../../components/ui'
import { I } from '../../components/icons'

const PRESET_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6b7280',
]

interface PinTypeModalProps {
  open: boolean
  editing: PinType | null
  onClose: () => void
}

function PinTypeModal({ open, editing, onClose }: PinTypeModalProps) {
  const qc = useQueryClient()
  const { push } = useToast()
  const [name, setName] = useState(editing?.name ?? '')
  const [color, setColor] = useState(editing?.color ?? '#f59e0b')

  // Reset form when modal opens
  useState(() => {
    setName(editing?.name ?? '')
    setColor(editing?.color ?? '#f59e0b')
  })

  const mutation = useMutation({
    mutationFn: () =>
      editing
        ? api.pinTypes.update(editing.id, { name, color })
        : api.pinTypes.create({ name, color }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pinTypes'] })
      push({ title: editing ? 'Tipo atualizado' : 'Tipo criado', tone: 'success' })
      onClose()
    },
    onError: (err: Error) => push({ title: 'Erro ao salvar', desc: err.message, tone: 'error' }),
  })

  // Sync form when editing target changes
  const handleOpen = () => {
    setName(editing?.name ?? '')
    setColor(editing?.color ?? '#f59e0b')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar tipo de pin' : 'Novo tipo de pin'}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            disabled={!name.trim() || !color || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      }
    >
      {/* invisible trigger to sync state */}
      {open && <span style={{ display: 'none' }} ref={() => handleOpen()} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Nome">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Distribuidor"
            autoFocus
          />
        </Field>

        <Field label="Cor">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Preset swatches */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: c,
                    border: color === c ? '2px solid var(--fg)' : '2px solid transparent',
                    outline: color === c ? '2px solid var(--accent)' : 'none',
                    outlineOffset: 1,
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'outline 0.1s',
                  }}
                />
              ))}
            </div>

            {/* Hex + native color picker */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  width: 36,
                  height: 36,
                  padding: 2,
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elev)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
              <Input
                value={color}
                onChange={(e) => {
                  const v = e.target.value
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setColor(v)
                }}
                placeholder="#f59e0b"
                style={{ fontFamily: 'var(--font-mono)', flex: 1 }}
              />
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  flexShrink: 0,
                }}
              />
            </div>
          </div>
        </Field>
      </div>
    </Modal>
  )
}

export default function PinTypesPage() {
  const qc = useQueryClient()
  const { push } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PinType | null>(null)

  const { data: pinTypes, isLoading } = useQuery({
    queryKey: ['pinTypes'],
    queryFn: () => api.pinTypes.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.pinTypes.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pinTypes'] })
      push({ title: 'Tipo removido', tone: 'success' })
    },
    onError: () => push({ title: 'Erro ao remover tipo', tone: 'error' }),
  })

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (pt: PinType) => {
    setEditing(pt)
    setModalOpen(true)
  }

  const handleDelete = (pt: PinType) => {
    if (!window.confirm(`Remover tipo "${pt.name}"? Os parceiros associados perderão esse tipo.`)) return
    deleteMutation.mutate(pt.id)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="h1">Tipos de pin</h1>
          <div className="muted text-sm">
            {pinTypes?.length ?? 0} tipo{pinTypes?.length !== 1 ? 's' : ''} cadastrado{pinTypes?.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="page-actions">
          <Button variant="primary" leftIcon={<I.plus size={14} />} onClick={openNew}>
            Novo tipo
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} h={56} />)}
        </div>
      ) : !pinTypes?.length ? (
        <Empty
          icon={<I.pin size={28} />}
          title="Nenhum tipo de pin"
          desc="Crie tipos para classificar seus parceiros no mapa"
          action={<Button variant="primary" onClick={openNew}>Criar tipo</Button>}
        />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Cor</th>
              <th>Nome</th>
              <th>Criado em</th>
              <th style={{ width: 80 }} />
            </tr>
          </thead>
          <tbody>
            {pinTypes.map((pt) => (
              <tr key={pt.id}>
                <td>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: pt.color,
                      border: '1px solid color-mix(in srgb, var(--border) 50%, transparent)',
                    }}
                  />
                </td>
                <td style={{ fontWeight: 500 }}>{pt.name}</td>
                <td className="muted">{new Date(pt.createdAt).toLocaleDateString('pt-BR')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="icon-btn" onClick={() => openEdit(pt)} title="Editar">
                      <I.edit size={14} />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => handleDelete(pt)}
                      title="Remover"
                      style={{ color: 'var(--danger)' }}
                    >
                      <I.trash size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <PinTypeModal
        open={modalOpen}
        editing={editing}
        onClose={() => { setModalOpen(false); setEditing(null) }}
      />
    </div>
  )
}
