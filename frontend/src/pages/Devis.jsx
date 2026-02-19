import { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import {
  ActionButton, EmptyState, TableSkeleton, TableHead,
  lineInputClass, textareaClass, prestationSelectClass
} from '../components/ui/helpers'
import { Plus, Pencil, Trash2, Download, ArrowRight, X, FileText } from 'lucide-react'

const statutOptions = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoyé', label: 'Envoyé' },
  { value: 'accepté', label: 'Accepté' },
  { value: 'refusé', label: 'Refusé' },
]

function formatMoney(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0)
}

function StatutBadge({ statut }) {
  const styles = {
    accepté: 'bg-emerald-400/10 text-emerald-400',
    refusé:  'bg-red-400/10 text-red-400',
    envoyé:  'bg-accent-400/10 text-accent-400',
    brouillon: 'bg-slate-400/10 text-slate-400',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[statut] || styles.brouillon}`}>
      {statut}
    </span>
  )
}

function Devis() {
  const [devisList, setDevisList] = useState([])
  const [clients, setClients] = useState([])
  const [prestations, setPrestations] = useState([])
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDevis, setEditingDevis] = useState(null)
  const [form, setForm] = useState({ client_id: '', date_validite: '', statut: 'brouillon', notes: '', lignes: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [dRes, cRes, pRes] = await Promise.all([
        fetch('/api/devis'), fetch('/api/clients'), fetch('/api/prestations')
      ])
      setDevisList(await dRes.json())
      setClients(await cRes.json())
      setPrestations(await pRes.json())
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  async function openModal(devis = null) {
    if (devis) {
      const res = await fetch(`/api/devis/${devis.id}`)
      const full = await res.json()
      setEditingDevis(full)
      setForm({ client_id: full.client_id || '', date_validite: full.date_validite || '', statut: full.statut, notes: full.notes || '', lignes: full.lignes || [] })
    } else {
      setEditingDevis(null)
      setForm({ client_id: '', date_validite: '', statut: 'brouillon', notes: '', lignes: [] })
    }
    setIsModalOpen(true)
  }

  function closeModal() { setIsModalOpen(false); setEditingDevis(null) }

  function addLigne() {
    setForm(p => ({ ...p, lignes: [...p.lignes, { description: '', quantite: 1, prix_unitaire: 0 }] }))
  }

  function removeLigne(i) {
    setForm(p => ({ ...p, lignes: p.lignes.filter((_, idx) => idx !== i) }))
  }

  function updateLigne(i, field, value) {
    setForm(p => {
      const lignes = [...p.lignes]
      lignes[i] = { ...lignes[i], [field]: value }
      return { ...p, lignes }
    })
  }

  function addPrestation(prestation) {
    setForm(p => ({
      ...p,
      lignes: [...p.lignes, { description: prestation.nom, quantite: 1, prix_unitaire: prestation.prix_unitaire }]
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const url = editingDevis ? `/api/devis/${editingDevis.id}` : '/api/devis'
      await fetch(url, {
        method: editingDevis ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      closeModal(); loadData()
    } catch (error) {
      console.error('Erreur sauvegarde devis:', error)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce devis ?')) return
    try {
      await fetch(`/api/devis/${id}`, { method: 'DELETE' })
      loadData()
    } catch (error) {
      console.error('Erreur suppression devis:', error)
    }
  }

  async function handleConvertir(id) {
    if (!confirm('Convertir ce devis en facture ?')) return
    try {
      await fetch(`/api/devis/${id}/convertir`, { method: 'POST' })
      loadData()
      alert('Facture créée avec succès !')
    } catch (error) {
      console.error('Erreur conversion:', error)
    }
  }

  const total = form.lignes.reduce((s, l) => s + (l.quantite * l.prix_unitaire), 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Devis</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
            {devisList.length} devis
          </p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus size={16} />
          Nouveau devis
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton cols={6} />
          ) : devisList.length > 0 ? (
            <table className="w-full">
              <TableHead cols={[
                { label: 'Numéro' }, { label: 'Client' }, { label: 'Date' },
                { label: 'Statut' }, { label: 'Montant', right: true }, { label: '', right: true }
              ]} />
              <tbody>
                {devisList.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 border-gray-50 dark:border-[#1a2236] hover:bg-gray-50/50 dark:hover:bg-[#161b27] transition-colors">
                    <td className="px-6 py-3.5 text-sm font-medium text-gray-900 dark:text-slate-100">{d.numero}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-slate-400">{d.client_nom || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-slate-400">
                      {new Date(d.date_creation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatutBadge statut={d.statut} />
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-semibold font-mono tabular-nums text-gray-900 dark:text-slate-100">
                      {formatMoney(d.total)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <ActionButton onClick={() => setPreviewUrl(`/api/devis/${d.id}/pdf`)} title="Aperçu PDF" color="gray">
                          <Download size={15} />
                        </ActionButton>
                        {d.statut !== 'accepté' && (
                          <ActionButton onClick={() => handleConvertir(d.id)} title="Convertir en facture" color="green">
                            <ArrowRight size={15} />
                          </ActionButton>
                        )}
                        <ActionButton onClick={() => openModal(d)} title="Modifier" color="sky">
                          <Pencil size={15} />
                        </ActionButton>
                        <ActionButton onClick={() => handleDelete(d.id)} title="Supprimer" color="red">
                          <Trash2 size={15} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon={FileText} message="Aucun devis" sub="Créez votre premier devis pour commencer" />
          )}
        </CardContent>
      </Card>

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
                  <X size={18} />
                </button>
              </div>
            </div>
            <iframe src={previewUrl} className="flex-1 w-full rounded-b-2xl" title="Aperçu PDF" />
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingDevis ? `Modifier ${editingDevis.numero}` : 'Nouveau devis'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Client"
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            options={[{ value: '', label: 'Sélectionner un client' }, ...clients.map(c => ({ value: c.id, label: c.nom }))]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date de validité" type="date" value={form.date_validite} onChange={(e) => setForm({ ...form, date_validite: e.target.value })} />
            <Select label="Statut" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })} options={statutOptions} />
          </div>

          {/* Lignes */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-600 dark:text-slate-400">Lignes</label>
              <div className="flex gap-2">
                {prestations.length > 0 && (
                  <select
                    onChange={(e) => {
                      const p = prestations.find(p => p.id === parseInt(e.target.value))
                      if (p) addPrestation(p)
                      e.target.value = ''
                    }}
                    className={prestationSelectClass}
                  >
                    <option value="">+ Ajouter prestation</option>
                    {prestations.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>
                )}
                <Button type="button" size="sm" variant="secondary" onClick={addLigne}>+ Ligne libre</Button>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {form.lignes.map((ligne, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" placeholder="Description" value={ligne.description}
                    onChange={(e) => updateLigne(i, 'description', e.target.value)}
                    className={`${lineInputClass} flex-1`} />
                  <input type="number" placeholder="Qté" value={ligne.quantite} min="0"
                    onChange={(e) => updateLigne(i, 'quantite', parseFloat(e.target.value))}
                    className={`${lineInputClass} !w-16`} />
                  <input type="number" placeholder="Prix" step="0.01" value={ligne.prix_unitaire} min="0"
                    onChange={(e) => updateLigne(i, 'prix_unitaire', parseFloat(e.target.value))}
                    className={`${lineInputClass} !w-24`} />
                  <button type="button" onClick={() => removeLigne(i)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0">
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
            {form.lignes.length > 0 && (
              <div className="text-right mt-2 text-sm font-semibold font-mono tabular-nums text-gray-900 dark:text-slate-100">
                Total : {formatMoney(total)}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={textareaClass} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Annuler</Button>
            <Button type="submit">{editingDevis ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Devis
