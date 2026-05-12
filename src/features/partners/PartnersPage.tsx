import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Partner } from '../../types'
import { Badge, Button, ConfirmDialog, Empty, Input, Select, Skeleton, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import PartnerSheet from './PartnerSheet'

export default function PartnersPage() {
  const qc = useQueryClient()
  const { push } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [visibility, setVisibility] = useState<'public' | 'internal' | ''>('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<Partner | null>(null)

  // Open edit sheet when ?edit=partnerId is present in the URL
  const editId = searchParams.get('edit')
  useEffect(() => {
    if (!editId) return
    api.partners.getById(editId).then((partner) => {
      setEditing(partner)
      setSheetOpen(true)
      // Clear the query param without triggering navigation
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('edit')
        return next
      }, { replace: true })
    }).catch(() => {
      // Partner not found or no access — silently clear param
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('edit')
        return next
      }, { replace: true })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  const { data, isLoading } = useQuery({
    queryKey: ['partners', page, visibility],
    queryFn: () => api.partners.list({
      page,
      limit: 20,
      visibility: visibility || undefined,
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.partners.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] })
      push({ title: 'Parceiro removido', tone: 'success' })
    },
    onError: () => push({ title: 'Erro ao remover parceiro', tone: 'error' }),
  })

  const openNew = () => {
    setEditing(null)
    setSheetOpen(true)
  }

  const openEdit = (p: Partner) => {
    setEditing(p)
    setSheetOpen(true)
  }

  const handleDelete = (p: Partner) => setConfirmTarget(p)

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="h1">Parceiros</h1>
          <div className="muted text-sm">
            {data?.total ?? 0} parceiro{data?.total !== 1 ? 's' : ''} cadastrado{data?.total !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="page-actions">
          <Button variant="primary" leftIcon={<I.plus size={14} />} onClick={openNew}>
            Novo parceiro
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Select
          value={visibility}
          onChange={(e) => { setVisibility(e.target.value as typeof visibility); setPage(1) }}
          style={{ width: 160 }}
        >
          <option value="">Todos</option>
          <option value="public">Público</option>
          <option value="internal">Interno</option>
        </Select>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(8)].map((_, i) => <Skeleton key={i} h={44} />)}
        </div>
      ) : data?.data.length === 0 ? (
        <Empty
          icon={<I.partners size={32} />}
          title="Nenhum parceiro encontrado"
          desc="Adicione seu primeiro parceiro para começar"
          action={<Button variant="primary" onClick={openNew}>Novo parceiro</Button>}
        />
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Endereço</th>
                <th>Cidade / Estado</th>
                <th>Tipo de pin</th>
                <th>Visibilidade</th>
                <th>Geocode</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {data?.data.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                  </td>
                  <td className="muted">{p.address ?? '—'}</td>
                  <td className="muted">
                    {[p.city, p.state].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td>
                    {p.pinTypeName ? (
                      <Badge style={{ background: (p.pinTypeColor ?? '#888') + '22', color: p.pinTypeColor ?? undefined }}>
                        {p.pinTypeName}
                      </Badge>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <Badge tone={p.visibility === 'public' ? 'success' : 'info'}>
                      {p.visibility === 'public' ? 'Público' : 'Interno'}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      tone={p.geocodeStatus === 'done' ? 'success' : p.geocodeStatus === 'failed' ? 'danger' : 'warning'}
                      dot
                    >
                      {p.geocodeStatus ?? 'pending'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="icon-btn" onClick={() => openEdit(p)} title="Editar">
                        <I.edit size={14} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => handleDelete(p)}
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

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Anterior
              </Button>
              <span className="muted text-sm">Página {page} de {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima →
              </Button>
            </div>
          )}
        </>
      )}

      <PartnerSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        partner={editing}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title={`Remover "${confirmTarget?.name}"?`}
        desc="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        onConfirm={() => {
          if (confirmTarget) deleteMutation.mutate(confirmTarget.id)
          setConfirmTarget(null)
        }}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}
