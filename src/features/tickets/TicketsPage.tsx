import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth'
import { Badge, Button, Field, Modal, Skeleton, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import type { Ticket, TicketDetail } from '../../types'

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
}
const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  open: 'warning',
  in_progress: 'default',
  resolved: 'success',
}

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 86400 * 7) return `há ${Math.floor(diff / 86400)} dias`
  return new Date(iso).toLocaleDateString('pt-BR')
}

// ── New Ticket Modal ──────────────────────────────────────────────────────────
function NewTicketModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const { push } = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.tickets.create(title, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      push({ title: 'Ticket criado com sucesso', tone: 'success' })
      setTitle(''); setBody('')
      onClose()
    },
    onError: () => push({ title: 'Erro ao criar ticket', tone: 'error' }),
  })

  return (
    <Modal open={open} onClose={onClose} title="Novo ticket de suporte">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Assunto" required>
          <input
            className="input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Descreva brevemente o problema…"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </Field>
        <Field label="Descrição" required>
          <textarea
            className="input"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Explique o problema com detalhes…"
            rows={6}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
          />
        </Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={!title.trim() || !body.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Enviando…' : 'Enviar ticket'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Ticket Detail Modal ───────────────────────────────────────────────────────
function TicketDetailModal({
  ticket,
  onClose,
  isSuperAdmin,
}: {
  ticket: Ticket
  onClose: () => void
  isSuperAdmin: boolean
}) {
  const qc = useQueryClient()
  const { push } = useToast()
  const [reply, setReply] = useState('')

  const { data: detail, isLoading } = useQuery<TicketDetail>({
    queryKey: ['ticket', ticket.id],
    queryFn: () => api.tickets.getDetail(ticket.id),
  })

  const replyMutation = useMutation({
    mutationFn: () => api.tickets.reply(ticket.id, reply),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', ticket.id] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
      setReply('')
    },
    onError: () => push({ title: 'Erro ao enviar resposta', tone: 'error' }),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.tickets.updateStatus(ticket.id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', ticket.id] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
      push({ title: 'Status atualizado', tone: 'success' })
    },
    onError: () => push({ title: 'Erro ao atualizar status', tone: 'error' }),
  })

  const currentStatus = detail?.status ?? ticket.status

  return (
    <Modal open onClose={onClose} title={ticket.title} size="xl">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Badge tone={STATUS_TONE[currentStatus]}>{STATUS_LABEL[currentStatus]}</Badge>
          <span className="muted text-sm">Aberto por {ticket.userName ?? '—'}</span>
          <span className="muted text-sm">·</span>
          <span className="muted text-sm">{relTime(ticket.createdAt)}</span>

          {isSuperAdmin && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {(['open', 'in_progress', 'resolved'] as const).map(s => (
                <button
                  key={s}
                  className={`btn ${currentStatus === s ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: 12, padding: '3px 10px', height: 28 }}
                  disabled={currentStatus === s || statusMutation.isPending}
                  onClick={() => statusMutation.mutate(s)}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Original body */}
        <div style={{
          padding: '14px 16px', borderRadius: 8,
          background: 'var(--bg-subtle)', border: '1px solid var(--border)',
          fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
        }}>
          {ticket.body}
        </div>

        {/* Messages thread */}
        {isLoading ? (
          <Skeleton h={80} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {detail?.messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: msg.isStaff ? 'row-reverse' : 'row',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: msg.isStaff ? 'var(--accent)' : 'var(--bg-elev)',
                  border: '1px solid var(--border)',
                  display: 'grid', placeItems: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: msg.isStaff ? '#fff' : 'var(--fg)',
                }}>
                  {msg.isStaff ? 'SA' : (msg.userName?.[0] ?? '?').toUpperCase()}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: '75%' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 10,
                    background: msg.isStaff ? 'var(--accent)' : 'var(--bg-elev)',
                    color: msg.isStaff ? '#fff' : 'var(--fg)',
                    border: msg.isStaff ? 'none' : '1px solid var(--border)',
                    fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  }}>
                    {msg.body}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 4, textAlign: msg.isStaff ? 'right' : 'left' }}>
                    {msg.isStaff ? 'Suporte AtlaSync' : (msg.userName ?? '—')} · {relTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply box — only if not resolved */}
        {currentStatus !== 'resolved' && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <textarea
              className="input"
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Escreva sua resposta…"
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', fontSize: 13, marginBottom: 8 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                disabled={!reply.trim() || replyMutation.isPending}
                leftIcon={<I.send size={13} />}
                onClick={() => replyMutation.mutate()}
              >
                {replyMutation.isPending ? 'Enviando…' : 'Responder'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const [newOpen, setNewOpen] = useState(false)
  const [selected, setSelected] = useState<Ticket | null>(null)

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: () => api.tickets.list(),
  })

  const open = tickets.filter(t => t.status === 'open')
  const inProgress = tickets.filter(t => t.status === 'in_progress')
  const resolved = tickets.filter(t => t.status === 'resolved')

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="h1">Suporte</h1>
          <div className="muted text-sm">
            {isSuperAdmin
              ? `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} no total`
              : 'Fale com a equipe AtlaSync'}
          </div>
        </div>
        {!isSuperAdmin && (
          <div className="page-actions">
            <Button variant="primary" leftIcon={<I.plus size={14} />} onClick={() => setNewOpen(true)}>
              Novo ticket
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} h={64} />)}
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
          <I.bell size={40} style={{ color: 'var(--fg-muted)' }} />
          <div style={{ fontWeight: 600 }}>Nenhum ticket ainda</div>
          {!isSuperAdmin && (
            <Button variant="primary" onClick={() => setNewOpen(true)}>Abrir primeiro ticket</Button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { label: 'Abertos', items: open },
            { label: 'Em andamento', items: inProgress },
            { label: 'Resolvidos', items: resolved },
          ].map(({ label, items }) => items.length > 0 && (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                {label} ({items.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 16px', borderRadius: 10, textAlign: 'left', width: '100%',
                      background: 'var(--bg-elev)', border: '1px solid var(--border)',
                      cursor: 'pointer', transition: 'border-color .12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <Badge tone={STATUS_TONE[t.status]} style={{ flexShrink: 0 }}>{STATUS_LABEL[t.status]}</Badge>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </div>
                      {isSuperAdmin && t.userEmail && (
                        <div className="muted text-sm">{t.userName} · {t.userEmail}</div>
                      )}
                    </div>
                    <div className="muted text-sm" style={{ flexShrink: 0 }}>{relTime(t.updatedAt)}</div>
                    <I.chevronRight size={14} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <NewTicketModal open={newOpen} onClose={() => setNewOpen(false)} />

      {selected && (
        <TicketDetailModal
          ticket={selected}
          onClose={() => setSelected(null)}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  )
}
