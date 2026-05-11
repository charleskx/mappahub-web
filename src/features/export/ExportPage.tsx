import { useState } from 'react'
import { api } from '../../lib/api'
import { Button, Card, CardHeader, Field, Select, useToast } from '../../components/ui'
import { I } from '../../components/icons'

export default function ExportPage() {
  const { push } = useToast()
  const [format, setFormat] = useState('xlsx')
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const blob = await api.export.download(format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `parceiros.${format}`
      a.click()
      URL.revokeObjectURL(url)
      push({ title: 'Exportação concluída', tone: 'success' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao exportar'
      push({ title: 'Erro na exportação', desc: msg, tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="h1">Exportar dados</h1>
        <p className="muted text-sm">Baixe todos os seus parceiros em diferentes formatos</p>
      </div>

      <Card style={{ maxWidth: 480 }}>
        <CardHeader
          title="Exportar parceiros"
          desc="Todos os campos serão incluídos na exportação"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
          <Field label="Formato do arquivo">
            <Select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
            </Select>
          </Field>

          <div
            style={{
              padding: 16,
              background: 'var(--bg-subtle)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <I.info size={16} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
            <div className="text-sm muted">
              A exportação inclui: nome, e-mail, telefone, endereço, coordenadas, tipo de pin e status
              de todos os parceiros do seu workspace.
            </div>
          </div>

          <Button
            variant="primary"
            leftIcon={<I.download size={14} />}
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? 'Exportando…' : `Exportar como ${format.toUpperCase()}`}
          </Button>
        </div>
      </Card>
    </div>
  )
}
