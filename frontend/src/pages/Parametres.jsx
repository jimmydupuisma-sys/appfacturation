import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Save, Check } from 'lucide-react'
import { useTheme } from '../contexts/Theme'

const THEME_COLORS = {
  sky:     { bg: '#0ea5e9', label: 'Sky' },
  violet:  { bg: '#8b5cf6', label: 'Violet' },
  emerald: { bg: '#10b981', label: 'Emerald' },
  rose:    { bg: '#f43f5e', label: 'Rose' },
  amber:   { bg: '#f59e0b', label: 'Amber' },
}

function Parametres() {
  const { theme, font, setTheme, setFont, fonts } = useTheme()
  const [form, setForm] = useState({
    nom_entreprise: '', prenom: '', nom: '', adresse: '',
    code_postal: '', ville: '', siret: '', email: '',
    telephone: '', iban: '', taux_urssaf: 22.0, seuil_ca: 77700,
    tva_active: false, taux_tva: 20.0, seuil_tva: 37500, tva_date_debut: ''
  })
  const [initialForm, setInitialForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadParametres() }, [])

  async function loadParametres() {
    try {
      const res = await fetch('/api/parametres')
      const data = await res.json()
      if (data) {
        const loaded = {
          nom_entreprise: data.nom_entreprise || '',
          prenom: data.prenom || '',
          nom: data.nom || '',
          adresse: data.adresse || '',
          code_postal: data.code_postal || '',
          ville: data.ville || '',
          siret: data.siret || '',
          email: data.email || '',
          telephone: data.telephone || '',
          iban: data.iban || '',
          taux_urssaf: data.taux_urssaf || 22.0,
          seuil_ca: data.seuil_ca ?? 77700,
          tva_active: !!data.tva_active,
          taux_tva: data.taux_tva ?? 20.0,
          seuil_tva: data.seuil_tva ?? 37500,
          tva_date_debut: data.tva_date_debut || ''
        }
        setForm(loaded)
        setInitialForm(loaded)
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/parametres', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      setInitialForm(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error)
    } finally {
      setSaving(false)
    }
  }

  const isDirty = initialForm !== null && JSON.stringify(form) !== JSON.stringify(initialForm)

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-gray-100 dark:bg-[#1a2236] animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-40 rounded-xl bg-gray-100 dark:bg-[#1a2236] animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Paramètres</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Informations affichées sur vos documents</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Entreprise</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Nom de l'entreprise" {...f('nom_entreprise')} placeholder="Mon Entreprise" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prénom" {...f('prenom')} />
                <Input label="Nom" {...f('nom')} />
              </div>
              <Input label="SIRET" {...f('siret')} placeholder="123 456 789 00012" />
              <Input label="Taux URSSAF (%)" type="number" step="0.1"
                value={form.taux_urssaf}
                onChange={(e) => setForm({ ...form, taux_urssaf: parseFloat(e.target.value) })} />
              <Input label="Seuil de CA annuel (€)" type="number" step="100"
                value={form.seuil_ca}
                onChange={(e) => setForm({ ...form, seuil_ca: parseFloat(e.target.value) })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">TVA</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Assujetti à la TVA</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Activez si vous avez dépassé le seuil de franchise</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newActive = !form.tva_active
                    setForm({
                      ...form,
                      tva_active: newActive,
                      tva_date_debut: newActive && !form.tva_date_debut
                        ? new Date().toISOString().split('T')[0]
                        : form.tva_date_debut
                    })
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.tva_active ? 'bg-accent-500' : 'bg-gray-200 dark:bg-[#1a2236]'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.tva_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Taux TVA (%)" type="number" step="0.1"
                  value={form.taux_tva}
                  onChange={(e) => setForm({ ...form, taux_tva: parseFloat(e.target.value) })} />
                <Input label="Seuil franchise TVA (€)" type="number" step="100"
                  value={form.seuil_tva}
                  onChange={(e) => setForm({ ...form, seuil_tva: parseFloat(e.target.value) })} />
              </div>
              {form.tva_active && (
                <Input label="Date de début d'assujettissement" type="date"
                  value={form.tva_date_debut}
                  onChange={(e) => setForm({ ...form, tva_date_debut: e.target.value })} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Coordonnées</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Adresse" {...f('adresse')} placeholder="123 rue de la Paix" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Code postal" {...f('code_postal')} placeholder="75000" />
                <Input label="Ville" {...f('ville')} placeholder="Paris" />
              </div>
              <Input label="Email" type="email" {...f('email')} placeholder="contact@entreprise.fr" />
              <Input label="Téléphone" {...f('telephone')} placeholder="06 12 34 56 78" />
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={!isDirty || saving} className="min-w-[140px]">
            {saved ? (
              <><Check size={16} />Enregistré !</>
            ) : saving ? (
              'Enregistrement…'
            ) : (
              <><Save size={16} />Enregistrer</>
            )}
          </Button>
        </div>

        <div className="space-y-5 mt-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Banque</h2>
            </CardHeader>
            <CardContent>
              <Input label="IBAN" {...f('iban')} placeholder="FR76 1234 5678 9012 3456 7890 123" />
              <p className="text-xs text-gray-400 dark:text-slate-600 mt-2">
                L'IBAN sera affiché sur vos factures pour faciliter les paiements.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Aperçu sur les factures</h2>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-[#1a2236] rounded-xl p-4 text-sm text-gray-700 dark:text-slate-300 font-mono space-y-0.5">
                <p className="font-bold text-gray-900 dark:text-slate-100 not-italic font-sans text-base">
                  {form.nom_entreprise || 'Nom de l\'entreprise'}
                </p>
                {(form.prenom || form.nom) && <p>{form.prenom} {form.nom}</p>}
                {form.adresse && <p>{form.adresse}</p>}
                {(form.code_postal || form.ville) && <p>{form.code_postal} {form.ville}</p>}
                {form.siret && <p className="pt-1">SIRET : {form.siret}</p>}
                {form.email && <p>Email : {form.email}</p>}
                {form.telephone && <p>Tél : {form.telephone}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Apparence ─────────────────────────────────────── */}
        <Card className="mt-5">
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Apparence</h2>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Thème couleur */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Couleur d'accent</p>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(THEME_COLORS).map(([name, { bg, label }]) => (
                  <button
                    key={name}
                    type="button"
                    title={label}
                    onClick={() => setTheme(name)}
                    className={`w-9 h-9 rounded-full transition-all focus:outline-none ${
                      theme === name ? 'scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: bg,
                      outline: theme === name ? `3px solid ${bg}` : 'none',
                      outlineOffset: '3px',
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                Thème actif : <span className="font-medium">{THEME_COLORS[theme]?.label}</span>
              </p>
            </div>

            {/* Police */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Police</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {fonts.map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFont(name)}
                    className={`px-3 py-2.5 rounded-lg border text-sm transition-all text-left ${
                      font === name
                        ? 'border-accent-500 bg-accent-500/10 text-accent-500 dark:text-accent-400'
                        : 'border-gray-200 dark:border-[#1e2a3a] text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                    style={{ fontFamily: `'${name}', Georgia, sans-serif` }}
                  >
                    <span className="block text-base leading-tight">{name}</span>
                    <span className="block text-xs opacity-60 mt-0.5">Aa Bb 123</span>
                  </button>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>

      </form>
    </div>
  )
}

export default Parametres
