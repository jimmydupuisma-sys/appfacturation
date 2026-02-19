import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { ActionButton, EmptyState, TableSkeleton, TableHead, textareaClass } from '../components/ui/helpers'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react'

const emptyClient = {
  nom: '', email: '', telephone: '', adresse: '',
  code_postal: '', ville: '', siret: '', notes: ''
}

function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [form, setForm] = useState(emptyClient)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    try {
      const res = await fetch('/api/clients')
      setClients(await res.json())
    } catch (error) {
      console.error('Erreur chargement clients:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(client = null) {
    setEditingClient(client)
    setForm(client || emptyClient)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingClient(null)
    setForm(emptyClient)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      await fetch(url, {
        method: editingClient ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      closeModal()
      loadClients()
    } catch (error) {
      console.error('Erreur sauvegarde client:', error)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce client ?')) return
    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      loadClients()
    } catch (error) {
      console.error('Erreur suppression client:', error)
    }
  }

  const filtered = clients.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Clients</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus size={16} />
          Nouveau client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-slate-600" size={16} />
            <input
              type="text"
              placeholder="Rechercher un client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#1e2a3a] bg-white dark:bg-[#0f1117] text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton cols={5} />
          ) : filtered.length > 0 ? (
            <table className="w-full">
              <TableHead cols={[
                { label: 'Nom' }, { label: 'Email' }, { label: 'Téléphone' },
                { label: 'Ville' }, { label: '', right: true }
              ]} />
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id} className="border-b last:border-0 border-gray-50 dark:border-[#1a2236] hover:bg-gray-50/50 dark:hover:bg-[#161b27] transition-colors">
                    <td className="px-6 py-3.5 text-sm font-medium text-gray-900 dark:text-slate-100">
                      <button onClick={() => navigate(`/clients/${client.id}`)} className="hover:text-accent-500 transition-colors text-left">
                        {client.nom}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-slate-400">{client.email || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-slate-400">{client.telephone || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-slate-400">{client.ville || '—'}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <ActionButton onClick={() => openModal(client)} title="Modifier" color="sky">
                          <Pencil size={15} />
                        </ActionButton>
                        <ActionButton onClick={() => handleDelete(client.id)} title="Supprimer" color="red">
                          <Trash2 size={15} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={Users}
              message="Aucun client trouvé"
              sub={search ? 'Essayez un autre terme de recherche' : 'Ajoutez votre premier client pour commencer'}
            />
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingClient ? 'Modifier le client' : 'Nouveau client'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nom *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          </div>
          <Input label="Adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code postal" value={form.code_postal} onChange={(e) => setForm({ ...form, code_postal: e.target.value })} />
            <Input label="Ville" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
          </div>
          <Input label="SIRET" value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={textareaClass} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Annuler</Button>
            <Button type="submit">{editingClient ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Clients
