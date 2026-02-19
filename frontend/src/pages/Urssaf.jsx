import { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { textareaClass } from '../components/ui/helpers'
import { ChevronLeft, ChevronRight, Check, X, Pencil } from 'lucide-react'

function formatMoney(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0)
}

function Urssaf() {
  const [annee, setAnnee] = useState(new Date().getFullYear())
  const [declarations, setDeclarations] = useState([])
  const [total, setTotal] = useState(0)
  const [totalDu, setTotalDu] = useState(0)
  const [totalCa, setTotalCa] = useState(0)
  const [tauxUrssaf, setTauxUrssaf] = useState(22)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMois, setEditingMois] = useState(null)
  const [form, setForm] = useState({ montant_du: '', notes: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [annee])

  async function loadData() {
    try {
      const res = await fetch(`/api/urssaf/${annee}`)
      const data = await res.json()
      setDeclarations(data.declarations)
      setTotal(data.total)
      setTotalDu(data.declarations.reduce((s, d) => s + (d.statut === 'payé' ? 0 : d.montant_du), 0))
      setTotalCa(data.total_ca || 0)
      setTauxUrssaf(data.taux_urssaf || 22)
    } catch (error) {
      console.error('Erreur chargement URSSAF:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(declaration) {
    setEditingMois(declaration)
    setForm({
      montant_du: declaration.montant_du_custom != null ? declaration.montant_du_custom : declaration.montant_du || '',
      notes: declaration.notes || ''
    })
    setIsModalOpen(true)
  }

  function closeModal() { setIsModalOpen(false); setEditingMois(null) }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const montantDuValue = form.montant_du !== '' ? parseFloat(form.montant_du) : null
      const isCustom = montantDuValue != null && montantDuValue !== editingMois.montant_du_calcule

      await fetch('/api/urssaf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mois: editingMois.mois,
          annee,
          montant_verse: editingMois.montant_verse || 0,
          montant_du_custom: isCustom ? montantDuValue : null,
          statut: editingMois.statut || 'impayé',
          date_paiement: editingMois.date_paiement || null,
          notes: form.notes
        })
      })
      closeModal(); loadData()
    } catch (error) {
      console.error('Erreur sauvegarde URSSAF:', error)
    }
  }

  async function toggleStatut(declaration) {
    const newStatut = declaration.statut === 'payé' ? 'impayé' : 'payé'
    try {
      await fetch('/api/urssaf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mois: declaration.mois,
          annee,
          montant_verse: newStatut === 'payé' ? (declaration.montant_verse || declaration.montant_du || 0) : 0,
          montant_du_custom: declaration.montant_du_custom != null ? declaration.montant_du_custom : null,
          statut: newStatut,
          date_paiement: newStatut === 'payé' ? new Date().toISOString().split('T')[0] : null,
          notes: declaration.notes
        })
      })
      loadData()
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-gray-100 dark:bg-[#1a2236] animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-[#1a2236] animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">URSSAF</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Suivi des cotisations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnnee(a => a - 1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a2236] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-lg font-semibold text-gray-900 dark:text-slate-100 w-16 text-center">{annee}</span>
          <button
            onClick={() => setAnnee(a => a + 1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a2236] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-5">
            <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">CA annuel</p>
            <p className="text-xl font-semibold font-mono tabular-nums text-gray-900 dark:text-slate-100">{formatMoney(totalCa)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Cotisations restantes ({tauxUrssaf}%)</p>
            <p className="text-xl font-semibold font-mono tabular-nums text-amber-500">{formatMoney(totalDu)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Total versé</p>
            <p className="text-xl font-semibold font-mono tabular-nums text-emerald-500">{formatMoney(total)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Grille des mois */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {declarations.map((d) => {
          const paye = d.statut === 'payé'
          return (
            <Card
              key={d.mois}
              className={paye
                ? '!border-emerald-200 dark:!border-emerald-900/50 !bg-emerald-50/50 dark:!bg-emerald-950/20'
                : ''
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{d.mois_nom}</h3>
                  {paye && (
                    <span className="text-xs bg-emerald-400/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">payé</span>
                  )}
                </div>

                {d.ca_mensuel > 0 && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">
                    CA : <span className="font-mono">{formatMoney(d.ca_mensuel)}</span>
                  </p>
                )}

                <div className="flex justify-between items-baseline mb-3">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-600 mb-0.5">Dû</p>
                    <p className={`text-base font-semibold font-mono tabular-nums ${paye ? 'text-gray-300 dark:text-slate-600 line-through' : 'text-amber-500'}`}>
                      {formatMoney(d.montant_du)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 dark:text-slate-600 mb-0.5">Versé</p>
                    <p className="text-base font-semibold font-mono tabular-nums text-emerald-500">
                      {formatMoney(d.montant_verse)}
                    </p>
                  </div>
                </div>

                {d.date_paiement && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">
                    le {new Date(d.date_paiement).toLocaleDateString('fr-FR')}
                  </p>
                )}

                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => openModal(d)}
                    className="p-1.5 rounded-md text-slate-400 dark:text-slate-600 hover:text-accent-400 hover:bg-accent-400/10 transition-colors"
                    title="Modifier le montant dû"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => toggleStatut(d)}
                    className={`p-1.5 rounded-md transition-colors ${
                      paye
                        ? 'text-emerald-500 hover:bg-emerald-400/10'
                        : 'text-slate-400 dark:text-slate-600 hover:text-emerald-400 hover:bg-emerald-400/10'
                    }`}
                    title={paye ? 'Marquer impayé' : 'Marquer payé'}
                  >
                    {paye ? <Check size={14} /> : <X size={14} />}
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingMois ? `URSSAF — ${editingMois.mois_nom} ${annee}` : 'URSSAF'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {editingMois && (
            <div className="bg-accent-50 dark:bg-accent-400/5 border border-accent-100 dark:border-accent-400/10 rounded-xl p-3 space-y-1">
              <p className="text-sm text-accent-700 dark:text-accent-300">
                CA du mois : <strong className="font-mono">{formatMoney(editingMois.ca_mensuel)}</strong>
              </p>
              <p className="text-sm text-accent-700 dark:text-accent-300">
                Cotisation auto ({tauxUrssaf}%) : <strong className="font-mono">{formatMoney(editingMois.montant_du_calcule)}</strong>
              </p>
            </div>
          )}
          <Input
            label="Montant dû (laisser vide = auto)"
            type="number"
            step="0.01"
            value={form.montant_du}
            onChange={(e) => setForm({ ...form, montant_du: e.target.value })}
            placeholder={editingMois ? String(editingMois.montant_du_calcule || 0) : ''}
          />
          {editingMois?.montant_du_custom != null && (
            <button type="button" onClick={() => setForm({ ...form, montant_du: '' })}
              className="text-sm text-accent-500 hover:text-accent-400 underline underline-offset-2">
              Revenir au calcul automatique
            </button>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={textareaClass} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Urssaf
