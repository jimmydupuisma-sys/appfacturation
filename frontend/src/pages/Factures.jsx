import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import {
  ActionButton, EmptyState, TableSkeleton, TableHead,
  lineInputClass, textareaClass, prestationSelectClass
} from '../components/ui/helpers'
import { Plus, Pencil, Trash2, Download, X, Receipt } from 'lucide-react'

function formatMoney(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0)
}

function Factures() {
  const [factures, setFactures] = useState([])
  const [clients, setClients] = useState([])
  const [prestations, setPrestations] = useState([])
  const [previewUrl, setPreviewUrl] = useState(null)
  const [tvaActive, setTvaActive] = useState(false)
  const [tauxTva, setTauxTva] = useState(20.0)
  const [tvaDateDebut, setTvaDateDebut] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFacture, setEditingFacture] = useState(null)
  const [form, setForm] = useState({
    client_id: '',
    date_emission: new Date().toISOString().split('T')[0],
    date_paiement: new Date().toISOString().split('T')[0],
    notes: '',
    lignes: []
  })
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const handledState = useRef(false)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!loading && location.state?.openModal && !handledState.current) {
      handledState.current = true
      const { client_id, lignes } = location.state
      setForm(f => ({
        ...f,
        client_id: client_id || '',
        lignes: lignes || []
      }))
      setIsModalOpen(true)
    }
  }, [loading, location.state])

  async function loadData() {
    try {
      const [fRes, cRes, pRes, paramsRes] = await Promise.all([
        fetch('/api/factures'), fetch('/api/clients'), fetch('/api/prestations'), fetch('/api/parametres')
      ])
      setFactures(await fRes.json())
      setClients(await cRes.json())
      setPrestations(await pRes.json())
      const params = await paramsRes.json()
      setTvaActive(!!params.tva_active)
      setTauxTva(params.taux_tva ?? 20.0)
      setTvaDateDebut(params.tva_date_debut || null)
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  async function openModal(facture = null) {
    if (facture) {
      const res = await fetch(`/api/factures/${facture.id}`)
      const full = await res.json()
      setEditingFacture(full)
      setForm({
        client_id: full.client_id || '',
        date_emission: full.date_emission || '',
        date_paiement: full.date_paiement || '',
        notes: full.notes || '',
        lignes: full.lignes || []
      })
    } else {
      setEditingFacture(null)
      setForm({
        client_id: '',
        date_emission: new Date().toISOString().split('T')[0],
        date_paiement: new Date().toISOString().split('T')[0],
        notes: '',
        lignes: []
      })
    }
    setIsModalOpen(true)
  }

  function closeModal() { setIsModalOpen(false); setEditingFacture(null) }

  function addLigne() {
    setForm(p => ({ ...p, lignes: [...p.lignes, { description: '', quantite: 1, prix_unitaire: '' }] }))
  }

  function removeLigne(index) {
    setForm(p => ({ ...p, lignes: p.lignes.filter((_, i) => i !== index) }))
  }

  function updateLigne(index, field, value) {
    setForm(p => {
      const lignes = [...p.lignes]
      lignes[index] = {
        ...lignes[index],
        [field]: (field === 'quantite' || field === 'prix_unitaire')
          ? (value === '' ? '' : parseFloat(value) || 0)
          : value
      }
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
      const url = editingFacture ? `/api/factures/${editingFacture.id}` : '/api/factures'
      const res = await fetch(url, {
        method: editingFacture ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          client_id: form.client_id ? parseInt(form.client_id) : null,
          lignes: form.lignes.map(l => ({
            description: l.description,
            quantite: parseFloat(l.quantite) || 0,
            prix_unitaire: parseFloat(l.prix_unitaire) || 0
          }))
        })
      })
      if (!res.ok) return
      closeModal(); loadData()
    } catch (error) {
      console.error('Erreur sauvegarde facture:', error)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette facture ?')) return
    try {
      await fetch(`/api/factures/${id}`, { method: 'DELETE' })
      loadData()
    } catch (error) {
      console.error('Erreur suppression facture:', error)
    }
  }

  const total = form.lignes.reduce((s, l) => s + ((parseFloat(l.quantite) || 0) * (parseFloat(l.prix_unitaire) || 0)), 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Factures</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
            {factures.length} facture{factures.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { window.location.href = `/api/factures/export-csv?annee=${new Date().getFullYear()}` }}>
            <Download size={16} />
            Exporter CSV
          </Button>
          <Button onClick={() => openModal()}>
            <Plus size={16} />
            Nouvelle facture
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton cols={6} />
          ) : factures.length > 0 ? (
            <table className="w-full">
              <TableHead cols={[
                { label: 'Numéro' }, { label: 'Client' }, { label: 'Émission' },
                { label: 'Paiement' }, { label: 'Montant', right: true }, { label: '', right: true }
              ]} />
              <tbody>
                {factures.map((f) => (
                  <tr key={f.id} className="border-b last:border-0 border-gray-50 dark:border-[#1a2236] hover:bg-gray-50/50 dark:hover:bg-[#161b27] transition-colors">
                    <td className="px-6 py-3.5 text-sm font-medium text-gray-900 dark:text-slate-100">{f.numero}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-slate-400">{f.client_nom || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-slate-400">
                      {new Date(f.date_emission).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-slate-400">
                      {f.date_paiement ? new Date(f.date_paiement).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-semibold font-mono tabular-nums text-gray-900 dark:text-slate-100">
                      {tvaActive && (!tvaDateDebut || f.date_emission >= tvaDateDebut)
                        ? formatMoney(f.total * (1 + tauxTva / 100))
                        : formatMoney(f.total)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <ActionButton onClick={() => setPreviewUrl(`/api/factures/${f.id}/pdf`)} title="Aperçu PDF" color="gray">
                          <Download size={15} />
                        </ActionButton>
                        <ActionButton onClick={() => openModal(f)} title="Modifier" color="sky">
                          <Pencil size={15} />
                        </ActionButton>
                        <ActionButton onClick={() => handleDelete(f.id)} title="Supprimer" color="red">
                          <Trash2 size={15} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon={Receipt} message="Aucune facture" sub="Créez votre première facture pour commencer" />
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

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingFacture ? `Modifier ${editingFacture.numero}` : 'Nouvelle facture'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Client"
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            options={[{ value: '', label: 'Sélectionner un client' }, ...clients.map(c => ({ value: c.id, label: c.nom }))]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date d'émission" type="date" value={form.date_emission} onChange={(e) => setForm({ ...form, date_emission: e.target.value })} />
            <Input label="Date de paiement" type="date" value={form.date_paiement} onChange={(e) => setForm({ ...form, date_paiement: e.target.value })} />
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
                  <input type="number" placeholder="Qté" value={ligne.quantite} min="0" step="1"
                    onChange={(e) => updateLigne(i, 'quantite', e.target.value)}
                    className={`${lineInputClass} !w-16`} />
                  <input type="number" placeholder="Prix" step="0.01" value={ligne.prix_unitaire} min="0"
                    onChange={(e) => updateLigne(i, 'prix_unitaire', e.target.value)}
                    className={`${lineInputClass} !w-24`} />
                  <button type="button" onClick={() => removeLigne(i)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0">
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
            {form.lignes.length > 0 && (
              <div className="mt-2 space-y-0.5 text-right text-sm font-mono tabular-nums">
                {tvaActive ? (
                  <>
                    <div className="text-gray-500 dark:text-slate-400">Total HT : {formatMoney(total)}</div>
                    <div className="text-gray-500 dark:text-slate-400">TVA ({tauxTva}%) : {formatMoney(Math.round(total * tauxTva) / 100)}</div>
                    <div className="font-semibold text-gray-900 dark:text-slate-100">Total TTC : {formatMoney(total + Math.round(total * tauxTva) / 100)}</div>
                  </>
                ) : (
                  <div className="font-semibold text-gray-900 dark:text-slate-100">Total : {formatMoney(total)}</div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={textareaClass} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Annuler</Button>
            <Button type="submit">{editingFacture ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Factures
