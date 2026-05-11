import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Partner } from '../../types'
import { Badge, Button, Empty, Input, Skeleton, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import PartnerSheet from './PartnerSheet'

export default function PartnersPage() {
  const qc = useQueryClient()
  const { push } = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['partners', page, search],
    queryFn: () => api.partners.list({ page, limit: 20, search: search || undefined }),
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

  const handleDelete = (p: Partner) => {
    if (!window.confirm(`Remover "${p.name}"?`)) return
    deleteMutation.mutate(p.id)
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="h1">Parceiros</h1>
          <p className="muted text-sm">
            {data?.total ?? 0} parceiro{data?.total !== 1 ? 's' : ''} cadastrado{data?.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" leftIcon={<I.plus size={14} />} onClick={openNew}>
          Novo parceiro
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          icon={<I.search size={14} />}
          placeholder="Buscar parceiros…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          style={{ maxWidth: 320 }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(8)].map((_, i) => <Skeleton key={i} h={44} />)}
        </div>
      ) : data?.data.length === 0 ? (
        <Empty
          icon={<I.partners size={32} />}
          title="Nenhum parceiro encontrado"
          desc={search ? 'Tente outros termos de busca' : 'Adicione seu primeiro parceiro para começar'}
          action={!search && <Button variant="primary" onClick={openNew}>Novo parceiro</Button>}
        />
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Cidade / Estado</th>
                <th>Tipo de pin</th>
                <th>Status</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {data?.data.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                  </td>
                  <td className="muted">{p.email ?? '—'}</td>
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
                    <Badge tone={p.active ? 'success' : 'warning'} dot>
                      {p.active ? 'Ativo' : 'Inativo'}
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
    </div>
  )
}
