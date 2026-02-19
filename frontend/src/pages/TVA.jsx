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

function TVA() {
  const [annee, setAnnee] = useState(new Date().getFullYear())
  const [declarations, setDeclarations] = useState([])
  const [totalCollecte, setTotalCollecte] = useState(0)
  const [totalVerse, setTotalVerse] = useState(0)
  const [tauxTva, setTauxTva] = useState(20)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTrimestre, setEditingTrimestre] = useState(null)
  const [form, setForm] = useState({ montant_verse: '', date_paiement: '', notes: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [annee])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/tva/${annee}`)
      const data = await res.json()
      setDeclarations(data.declarations || [])
      setTotalCollecte(data.total_collecte || 0)
      setTotalVerse(data.total_verse || 0)
      setTauxTva(data.taux_tva || 20)
    } catch (error) {
      console.error('Erreur chargement TVA:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(decl) {
    setEditingTrimestre(decl)
    setForm({
      montant_verse: decl.montant_verse || '',
      date_paiement: decl.date_paiement || '',
      notes: decl.notes || ''
    })
    setIsModalOpen(true)
  }

  function closeModal() { setIsModalOpen(false); setEditingTrimestre(null) }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await fetch('/api/tva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trimestre: editingTrimestre.trimestre,
          annee,
          montant_verse: parseFloat(form.montant_verse) || 0,
          statut: editingTrimestre.statut,
          date_paiement: form.date_paiement || null,
          notes: form.notes
        })
      })
      closeModal(); loadData()
    } catch (error) {
      console.error('Erreur sauvegarde TVA:', error)
    }
  }

  async function toggleStatut(decl) {
    const newStatut = decl.statut === 'payé' ? 'impayé' : 'payé'
    try {
      await fetch('/api/tva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trimestre: decl.trimestre,
          annee,
          montant_verse: newStatut === 'payé' ? (decl.montant_verse || decl.montant_collecte || 0) : 0,
          statut: newStatut,
          date_paiement: newStatut === 'payé' ? new Date().toISOString().split('T')[0] : null,
          notes: decl.notes
        })
      })
      loadData()
    } catch (error) {
      console.error('Erreur mise à jour statut TVA:', error)
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

  const totalRestant = totalCollecte - totalVerse

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">TVA</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Suivi des déclarations trimestrielles</p>
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
            <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">TVA collectée ({tauxTva}%)</p>
            <p className="text-xl font-semibold font-mono tabular-nums text-gray-900 dark:text-slate-100">{formatMoney(totalCollecte)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Reste à reverser</p>
            <p className={`text-xl font-semibold font-mono tabular-nums ${totalRestant > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{formatMoney(totalRestant)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Total versé</p>
            <p className="text-xl font-semibold font-mono tabular-nums text-emerald-500">{formatMoney(totalVerse)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Grille des trimestres */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {declarations.map((d) => {
          const paye = d.statut === 'payé'
          return (
            <Card
              key={d.trimestre}
              className={paye
                ? '!border-emerald-200 dark:!border-emerald-900/50 !bg-emerald-50/50 dark:!bg-emerald-950/20'
                : ''
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{d.nom}</h3>
                  {paye && (
                    <span className="text-xs bg-emerald-400/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">payé</span>
                  )}
                </div>

                {d.ca_trimestre > 0 && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">
                    CA HT : <span className="font-mono">{formatMoney(d.ca_trimestre)}</span>
                  </p>
                )}

                <div className="flex justify-between items-baseline mb-3">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-600 mb-0.5">Collectée</p>
                    <p className={`text-base font-semibold font-mono tabular-nums ${paye ? 'text-gray-300 dark:text-slate-600 line-through' : 'text-amber-500'}`}>
                      {formatMoney(d.montant_collecte)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 dark:text-slate-600 mb-0.5">Versée</p>
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
                    title="Modifier le versement"
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

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingTrimestre ? `TVA — ${editingTrimestre.nom} ${annee}` : 'TVA'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {editingTrimestre && (
            <div className="bg-violet-50 dark:bg-violet-400/5 border border-violet-100 dark:border-violet-400/10 rounded-xl p-3 space-y-1">
              <p className="text-sm text-violet-700 dark:text-violet-300">
                CA HT du trimestre : <strong className="font-mono">{formatMoney(editingTrimestre.ca_trimestre)}</strong>
              </p>
              <p className="text-sm text-violet-700 dark:text-violet-300">
                TVA collectée ({tauxTva}%) : <strong className="font-mono">{formatMoney(editingTrimestre.montant_collecte)}</strong>
              </p>
            </div>
          )}
          <Input
            label="Montant versé (€)"
            type="number"
            step="0.01"
            value={form.montant_verse}
            onChange={(e) => setForm({ ...form, montant_verse: e.target.value })}
            placeholder={editingTrimestre ? String(editingTrimestre.montant_collecte || 0) : ''}
          />
          <Input
            label="Date de paiement"
            type="date"
            value={form.date_paiement}
            onChange={(e) => setForm({ ...form, date_paiement: e.target.value })}
          />
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

export default TVA
