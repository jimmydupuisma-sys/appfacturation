import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { ActionButton, TableHead } from '../components/ui/helpers'
import Button from '../components/ui/Button'
import { ArrowLeft, Download, Receipt, FileText, Plus } from 'lucide-react'

function formatMoney(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0)
}

function StatutBadge({ statut }) {
  const styles = {
    accepté: 'bg-emerald-400/10 text-emerald-400',
    refusé: 'bg-red-400/10 text-red-400',
    brouillon: 'bg-slate-400/10 text-slate-400',
    'en attente': 'bg-amber-400/10 text-amber-400',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[statut] || styles.brouillon}`}>
      {statut}
    </span>
  )
}

function ClientHistorique() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    fetch(`/api/clients/${id}/historique`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  function nouvelleFacture() {
    navigate('/factures', { state: { client_id: parseInt(id), openModal: true } })
  }

  function convertirDevis(devis) {
    navigate('/factures', { state: { client_id: parseInt(id), openModal: true, lignes: devis.lignes || [] } })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-gray-100 dark:bg-[#1a2236] animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-[#1a2236] animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-slate-600">
      <p className="text-sm">Impossible de charger l'historique.</p>
      <button onClick={() => navigate('/clients')} className="mt-3 text-xs text-accent-500 hover:underline">← Retour aux clients</button>
    </div>
  )
  if (!data) return null

  const { client, stats, ca_par_annee, factures, devis } = data
  const maxCa = Math.max(...ca_par_annee.map(a => a.total), 1)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#1a2236] transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{client.nom}</h1>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
              {[client.email, client.telephone, client.ville].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <Button onClick={nouvelleFacture}>
          <Plus size={16} />
          Nouvelle facture
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'CA total', value: formatMoney(stats.ca_total), color: 'text-gray-900 dark:text-slate-100' },
          { label: `CA ${new Date().getFullYear()}`, value: formatMoney(stats.ca_annee), color: 'text-accent-500' },
          { label: 'Factures', value: stats.nb_factures, color: 'text-gray-900 dark:text-slate-100' },
          { label: 'Devis', value: stats.nb_devis, color: 'text-gray-900 dark:text-slate-100' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="py-5">
              <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-xl font-semibold font-mono tabular-nums ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CA par année */}
      {ca_par_annee.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Évolution CA</h2>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            {ca_par_annee.map(({ annee, total }) => (
              <div key={annee} className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-400 dark:text-slate-500 w-10 shrink-0">{annee}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-[#1a2236] overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-accent-500 transition-all duration-500"
                    style={{ width: `${(total / maxCa) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono tabular-nums text-gray-500 dark:text-slate-400 w-24 text-right shrink-0">
                  {formatMoney(total)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Factures */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Factures</h2>
              <span className="text-xs text-gray-400 dark:text-slate-600">{factures.length}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {factures.length > 0 ? (
              <table className="w-full">
                <TableHead cols={[
                  { label: 'Numéro' }, { label: 'Date' },
                  { label: 'Montant', right: true }, { label: '', right: true }
                ]} />
                <tbody>
                  {factures.map(f => (
                    <tr key={f.id} className="border-b last:border-0 border-gray-50 dark:border-[#1a2236] hover:bg-gray-50/50 dark:hover:bg-[#161b27] transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-slate-100">{f.numero}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                        {new Date(f.date_emission).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold font-mono tabular-nums text-gray-900 dark:text-slate-100">
                        {formatMoney(f.total)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionButton onClick={() => setPreviewUrl(`/api/factures/${f.id}/pdf`)} title="Aperçu PDF" color="gray">
                          <Download size={14} />
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300 dark:text-slate-700">
                <Receipt size={28} className="mb-2" />
                <p className="text-sm">Aucune facture</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Devis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Devis</h2>
              <span className="text-xs text-gray-400 dark:text-slate-600">{devis.length}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {devis.length > 0 ? (
              <table className="w-full">
                <TableHead cols={[
                  { label: 'Numéro' }, { label: 'Date' }, { label: 'Statut' },
                  { label: 'Montant', right: true }, { label: '', right: true }
                ]} />
                <tbody>
                  {devis.map(d => (
                    <tr key={d.id} className="border-b last:border-0 border-gray-50 dark:border-[#1a2236] hover:bg-gray-50/50 dark:hover:bg-[#161b27] transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-slate-100">{d.numero}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                        {new Date(d.date_creation).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3"><StatutBadge statut={d.statut} /></td>
                      <td className="px-4 py-3 text-right text-sm font-semibold font-mono tabular-nums text-gray-900 dark:text-slate-100">
                        {formatMoney(d.total)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionButton onClick={() => convertirDevis(d)} title="Convertir en facture" color="sky">
                          <Receipt size={14} />
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300 dark:text-slate-700">
                <FileText size={28} className="mb-2" />
                <p className="text-sm">Aucun devis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PDF Preview */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0f1623] rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-[#1a2236]">
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Aperçu PDF</span>
              <div className="flex items-center gap-2">
                <a href={previewUrl} download className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-accent-500 hover:bg-accent-600 text-white transition-colors">
                  <Download size={14} /> Télécharger
                </a>
                <button onClick={() => setPreviewUrl(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#1a2236] transition-colors">
                  ✕
                </button>
              </div>
            </div>
            <iframe src={previewUrl} className="flex-1 w-full rounded-b-2xl" title="Aperçu PDF" />
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientHistorique
