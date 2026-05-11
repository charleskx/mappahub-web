import { useCallback, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Button, Card, CardHeader, Empty, Progress, Skeleton, useToast } from '../../components/ui'
import { I } from '../../components/icons'

function formatBytes(bytes: number) {
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
  const [progress, setProgress] = useState(0)

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['importJobs'],
    queryFn: () => api.importJobs.list(),
    refetchInterval: 5000,
  })

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        push({ title: 'Formato inválido', desc: 'Use arquivos .xlsx, .xls ou .csv', tone: 'error' })
        return
      }
      setUploading(true)
      setProgress(0)
      try {
        const eventSource = await api.importJobs.upload(file, (pct) => setProgress(pct))
        if (eventSource) {
          eventSource.onmessage = (e) => {
            const data = JSON.parse(e.data)
            if (data.status === 'done' || data.status === 'failed') {
              eventSource.close()
              qc.invalidateQueries({ queryKey: ['importJobs'] })
              push({
                title: data.status === 'done' ? 'Importação concluída' : 'Importação falhou',
                desc: data.status === 'done' ? `${data.imported} parceiros importados` : data.error,
                tone: data.status === 'done' ? 'success' : 'error',
              })
            }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao importar'
        push({ title: 'Erro', desc: msg, tone: 'error' })
      } finally {
        setUploading(false)
        setProgress(0)
        qc.invalidateQueries({ queryKey: ['importJobs'] })
      }
    },
    [push, qc],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="h1">Importar planilha</h1>
        <p className="muted text-sm">Importe parceiros em massa a partir de arquivos Excel ou CSV</p>
      </div>

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
              <div style={{ marginBottom: 12, color: 'var(--amber)' }}><I.upload size={32} /></div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>Enviando…</div>
              <Progress value={progress} />
              <div className="muted text-sm" style={{ marginTop: 8 }}>{progress}%</div>
            </div>
          ) : (
            <>
              <div style={{ color: 'var(--fg-muted)', marginBottom: 12 }}><I.upload size={32} /></div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                Arraste o arquivo aqui ou clique para selecionar
              </div>
              <div className="muted text-sm">Suporta .xlsx, .xls e .csv · Máx. 10 MB</div>
              <Button variant="outline" size="sm" style={{ marginTop: 16 }}>
                Selecionar arquivo
              </Button>
            </>
          )}
        </div>
      </Card>

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
                <th>Importados</th>
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
                  <td>{j.importedCount ?? '—'}</td>
                  <td style={{ color: j.errorCount ? 'var(--danger)' : 'inherit' }}>
                    {j.errorCount ?? '—'}
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
  )
}
