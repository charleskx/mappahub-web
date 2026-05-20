import { useCallback, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Button, Card, CardHeader, Empty, Modal, Progress, Select, Skeleton, useToast } from '../../components/ui'
import { I } from '../../components/icons'

function downloadTemplate() {
  const rows = [
    ['nome', 'endereço', 'tipo', 'visibilidade', 'telefone', 'site'],
    ['Distribuidora Norte', 'Av. Paulista, 1000, São Paulo - SP', 'Distribuidor', 'public', '(11) 91234-5678', 'https://exemplo.com.br'],
    ['Loja Centro', 'Rua XV de Novembro, 200, Curitiba - PR', 'Loja', 'public', '(41) 98765-4321', ''],
    ['Representante Sul', 'Av. Borges de Medeiros, 500, Porto Alegre - RS', 'Representante', 'internal', '', ''],
  ]
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'modelo-importacao.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function formatBytes(bytes: number | null | undefined) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'done') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'processing') return 'info'
  return 'warning'
}

export default function ImportPage() {
  const qc = useQueryClient()
  const { push } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [mode, setMode] = useState<'full' | 'incremental'>('full')
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['importJobs'],
    queryFn: () => api.import.list(),
    refetchInterval: 5000,
  })

  const handleFile = useCallback(
    async (file: File) => {
      setUploading(true)
      setUploadProgress(0)
      try {
        const result = await api.import.upload(file, mode, (pct) => setUploadProgress(pct))
        const { jobId } = result

        qc.invalidateQueries({ queryKey: ['importJobs'] })

        // Poll for progress since SSE requires auth header which EventSource can't send
        const poll = setInterval(async () => {
          try {
            const job = await api.import.getById(jobId)
            qc.setQueryData(['importJobs'], (old: typeof jobs) =>
              old ? old.map((j) => (j.id === jobId ? job : j)) : [job],
            )
            if (job.status === 'done' || job.status === 'failed') {
              clearInterval(poll)
              qc.invalidateQueries({ queryKey: ['importJobs'] })
              qc.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
              qc.invalidateQueries({ queryKey: ['partners'] })
              push({
                title: job.status === 'done' ? 'Importação concluída' : 'Importação falhou',
                desc: job.status === 'done'
                  ? `${job.created ?? 0} criados · ${job.updated ?? 0} atualizados`
                  : undefined,
                tone: job.status === 'done' ? 'success' : 'error',
              })
            }
          } catch {
            clearInterval(poll)
          }
        }, 2000)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao importar'
        push({ title: 'Erro', desc: msg, tone: 'error' })
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [push, qc, mode],
  )

  const requestUpload = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      push({ title: 'Formato inválido', desc: 'Use arquivos .xlsx, .xls ou .csv', tone: 'error' })
      return
    }
    setPendingFile(file)
  }

  const confirmUpload = () => {
    if (pendingFile) {
      setPendingFile(null)
      handleFile(pendingFile)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) requestUpload(file)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) requestUpload(file)
    e.target.value = ''
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="h1">Importar planilha</h1>
          <div className="muted text-sm">Importe parceiros em massa a partir de arquivos Excel ou CSV</div>
        </div>
        <div className="page-actions">
          <Button variant="outline" leftIcon={<I.download size={14} />} onClick={downloadTemplate}>
            Baixar modelo
          </Button>
          <Select value={mode} onChange={(e) => setMode(e.target.value as 'full' | 'incremental')} style={{ width: 160 }}>
            <option value="full">Substituição total</option>
            <option value="incremental">Incremental</option>
          </Select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card>
        <div
          className={`dropzone${dragging ? ' dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={onInputChange}
          />
          {uploading ? (
            <div style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
              <div style={{ marginBottom: 12, color: 'var(--accent)' }}><I.upload size={32} /></div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>Enviando…</div>
              <Progress value={uploadProgress} />
              <div className="muted text-sm" style={{ marginTop: 8 }}>{uploadProgress}%</div>
            </div>
          ) : (
            <>
              <div style={{ color: 'var(--fg-muted)', marginBottom: 12 }}><I.upload size={32} /></div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                Arraste o arquivo aqui ou clique para selecionar
              </div>
              <div className="muted text-sm">Suporta .xlsx, .xls e .csv · Máx. 50 MB</div>
              <Button variant="outline" size="sm" style={{ marginTop: 16 }}>
                Selecionar arquivo
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Column reference */}
      <Card>
        <CardHeader title="Colunas da planilha" />
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 80px 1fr', gap: '6px 16px', fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: 'var(--fg-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coluna</span>
            <span style={{ fontWeight: 600, color: 'var(--fg-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Obrigatório</span>
            <span style={{ fontWeight: 600, color: 'var(--fg-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</span>

            {[
              { col: 'nome', required: true, desc: 'Nome do parceiro' },
              { col: 'endereço', required: true, desc: 'Endereço completo usado para geocoding' },
              { col: 'tipo', required: false, desc: 'Nome do tipo de pin cadastrado no sistema' },
              { col: 'visibilidade', required: false, desc: 'public ou internal (padrão: public)' },
              { col: 'outras colunas', required: false, desc: 'Qualquer coluna extra vira campo dinâmico do parceiro' },
            ].map(({ col, required, desc }) => (
              <>
                <span key={col} className="mono" style={{ color: 'var(--fg)' }}>{col}</span>
                <span key={col + '-req'}>
                  {required
                    ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Sim</span>
                    : <span style={{ color: 'var(--fg-subtle)' }}>Não</span>}
                </span>
                <span key={col + '-desc'} className="muted text-sm" style={{ fontSize: 13 }}>{desc}</span>
              </>
            ))}
          </div>
        </div>
      </Card>

      {/* Confirmation modal */}
      <Modal
        open={!!pendingFile}
        onClose={() => setPendingFile(null)}
        title={mode === 'full' ? 'Atenção: substituição total' : 'Confirmar importação'}
        desc={mode === 'full'
          ? 'Esta ação substituirá todos os parceiros existentes pelos dados da planilha. Registros que não estiverem no arquivo serão removidos permanentemente.'
          : 'Os dados da planilha serão mesclados com a base atual. Registros existentes serão atualizados e novos serão criados.'}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setPendingFile(null)}>Cancelar</Button>
            <Button variant={mode === 'full' ? 'danger' : 'primary'} onClick={confirmUpload}>
              {mode === 'full' ? 'Sim, substituir tudo' : 'Confirmar importação'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'full' && (
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              background: 'color-mix(in srgb, var(--danger) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
              borderRadius: 8, padding: '10px 12px',
            }}>
              <I.alert size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
              <span className="text-sm" style={{ color: 'var(--danger)' }}>
                Esta operação <strong>não pode ser desfeita</strong>. Exporte um backup antes de continuar.
              </span>
            </div>
          )}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 6,
            background: 'var(--bg-subtle)', borderRadius: 8, padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted text-sm">Arquivo</span>
              <span className="text-sm" style={{ fontWeight: 500 }}>{pendingFile?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted text-sm">Tamanho</span>
              <span className="text-sm">{pendingFile ? formatBytes(pendingFile.size) : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted text-sm">Modo</span>
              <span className="text-sm">{mode === 'full' ? 'Substituição total' : 'Incremental'}</span>
            </div>
          </div>
        </div>
      </Modal>

      <Card>
        <CardHeader
          title="Histórico de importações"
          desc="Acompanhe o status das importações anteriores"
        />
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {[...Array(3)].map((_, i) => <Skeleton key={i} h={44} />)}
          </div>
        ) : !jobs?.length ? (
          <Empty
            icon={<I.fileSheet size={28} />}
            title="Nenhuma importação ainda"
            desc="Faça upload de um arquivo para começar"
          />
        ) : (
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Tamanho</th>
                <th>Modo</th>
                <th>Criados</th>
                <th>Atualizados</th>
                <th>Erros</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td style={{ fontWeight: 500 }}>{j.fileName}</td>
                  <td className="muted">{formatBytes(j.fileSize)}</td>
                  <td className="muted">{j.mode === 'full' ? 'Total' : 'Incremental'}</td>
                  <td>{j.created ?? '—'}</td>
                  <td>{j.updated ?? '—'}</td>
                  <td style={{ color: j.failed ? 'var(--danger)' : 'inherit' }}>
                    {j.failed ?? '—'}
                  </td>
                  <td>
                    <Badge tone={statusTone(j.status)}>{j.status}</Badge>
                  </td>
                  <td className="muted">
                    {new Date(j.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      </div>
    </div>
  )
}
