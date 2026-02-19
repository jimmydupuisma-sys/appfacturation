import { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import { ActionButton, EmptyState, TableSkeleton, TableHead, textareaClass } from '../components/ui/helpers'
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react'

const uniteOptions = [
  { value: 'unité', label: 'Unité' },
  { value: 'heure', label: 'Heure' },
  { value: 'jour', label: 'Jour' },
  { value: 'forfait', label: 'Forfait' },
]

const emptyPrestation = { nom: '', description: '', prix_unitaire: '', unite: 'unité' }

function formatMoney(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0)
}

function Prestations() {
  const [prestations, setPrestations] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrestation, setEditingPrestation] = useState(null)
  const [form, setForm] = useState(emptyPrestation)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPrestations() }, [])

  async function loadPrestations() {
    try {
      const res = await fetch('/api/prestations')
      setPrestations(await res.json())
    } catch (error) {
      console.error('Erreur chargement prestations:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(prestation = null) {
    setEditingPrestation(prestation)
    setForm(prestation || emptyPrestation)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingPrestation(null)
    setForm(emptyPrestation)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const url = editingPrestation ? `/api/prestations/${editingPrestation.id}` : '/api/prestations'
      await fetch(url, {
        method: editingPrestation ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, prix_unitaire: parseFloat(form.prix_unitaire) })
      })
      closeModal(); loadPrestations()
    } catch (error) {
      console.error('Erreur sauvegarde prestation:', error)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette prestation ?')) return
    try {
      await fetch(`/api/prestations/${id}`, { method: 'DELETE' })
      loadPrestations()
    } catch (error) {
      console.error('Erreur suppression prestation:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Prestations</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
            {prestations.length} prestation{prestations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus size={16} />
          Nouvelle prestation
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton cols={5} />
          ) : prestations.length > 0 ? (
            <table className="w-full">
              <TableHead cols={[
                { label: 'Nom' }, { label: 'Description' }, { label: 'Prix' },
                { label: 'Unité' }, { label: '', right: true }
              ]} />
              <tbody>
                {prestations.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 border-gray-50 dark:border-[#1a2236] hover:bg-gray-50/50 dark:hover:bg-[#161b27] transition-colors">
                    <td className="px-6 py-3.5 text-sm font-medium text-gray-900 dark:text-slate-100">{p.nom}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-slate-400">{p.description || '—'}</td>
                    <td className="px-6 py-3.5 text-sm font-mono tabular-nums text-gray-700 dark:text-slate-300">{formatMoney(p.prix_unitaire)}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-slate-400">{p.unite}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <ActionButton onClick={() => openModal(p)} title="Modifier" color="sky">
                          <Pencil size={15} />
                        </ActionButton>
                        <ActionButton onClick={() => handleDelete(p.id)} title="Supprimer" color="red">
                          <Trash2 size={15} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon={Briefcase} message="Aucune prestation enregistrée" sub="Ajoutez vos tarifs pour les réutiliser facilement dans vos devis et factures" />
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingPrestation ? 'Modifier la prestation' : 'Nouvelle prestation'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nom *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={textareaClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prix unitaire *" type="number" step="0.01" value={form.prix_unitaire} onChange={(e) => setForm({ ...form, prix_unitaire: e.target.value })} required />
            <Select label="Unité" value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} options={uniteOptions} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Annuler</Button>
            <Button type="submit">{editingPrestation ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Prestations
