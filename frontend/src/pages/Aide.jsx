import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard, Users, Briefcase, FileText, Receipt,
  Building2, Percent, Settings, BookOpen, Zap,
} from 'lucide-react'

const SECTIONS = [
  {
    id: 'intro',
    label: 'Introduction',
    icon: Zap,
    title: 'Bienvenue dans App Facturation',
    screenshot: null,
    description: "App Facturation est un logiciel de gestion conçu pour les auto-entrepreneurs et les freelances.\nIl vous permet de gérer vos clients, créer des devis et factures professionnels,\nsuivre votre chiffre d'affaires et anticiper vos déclarations URSSAF et TVA.",
    tips: [
      "Commencez par renseigner vos informations dans Paramètres — elles apparaîtront sur tous vos documents.",
      "Créez votre catalogue de prestations pour gagner du temps lors de la rédaction de devis et factures.",
      "Le Dashboard vous donne une vue d'ensemble de votre activité en temps réel.",
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    screenshot: 'dashboard.png',
    description: "Le Dashboard centralise les informations clés de votre activité :\nchiffre d'affaires de l'année, nombre de factures et devis en cours,\net un graphique de l'évolution mensuelle du CA.",
    tips: [
      "La jauge de CA indique votre progression vers le seuil de franchise (URSSAF ou TVA).",
      "Les alertes colorées vous préviennent quand vous approchez des seuils réglementaires.",
      "Cliquez sur les cartes de statut pour naviguer directement vers les listes filtrées.",
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    title: 'Gestion des clients',
    screenshot: 'clients.png',
    description: "La page Clients liste tous vos clients avec leur contact et le montant total facturé.\nVous pouvez ajouter, modifier ou supprimer un client, et accéder à l'historique complet de ses devis et factures.",
    tips: [
      "Utilisez la recherche pour trouver rapidement un client par nom ou email.",
      "L'historique client affiche tous les devis et factures associés, avec leur statut et montant.",
      "La suppression d'un client est possible uniquement s'il n'a pas de documents associés.",
    ],
  },
  {
    id: 'prestations',
    label: 'Prestations',
    icon: Briefcase,
    title: 'Catalogue de prestations',
    screenshot: 'prestations.png',
    description: "Les prestations sont vos services ou produits habituels.\nEn les définissant ici, vous pouvez les ajouter en un clic dans vos devis et factures\nsans avoir à resaisir le libellé et le prix à chaque fois.",
    tips: [
      "Définissez un prix unitaire HT par défaut — il sera pré-rempli lors de l'ajout au document.",
      "Les prestations peuvent être modifiées dans chaque document sans affecter le catalogue.",
      "Créez autant de prestations que nécessaire : elles sont filtrables par nom.",
    ],
  },
  {
    id: 'devis',
    label: 'Devis',
    icon: FileText,
    title: 'Devis',
    screenshot: 'devis.png',
    description: "Créez des devis professionnels à envoyer à vos clients.\nChaque devis passe par plusieurs statuts : Brouillon → Envoyé → Accepté ou Refusé.\nUn devis accepté peut être converti en facture en un clic.",
    tips: [
      "Ajoutez des lignes depuis votre catalogue de prestations ou saisissez-les manuellement.",
      "La conversion en facture reprend automatiquement toutes les lignes du devis.",
      "Téléchargez le PDF pour l'envoyer directement à votre client.",
      "Un devis refusé peut être dupliqué et modifié pour faire une nouvelle proposition.",
    ],
  },
  {
    id: 'factures',
    label: 'Factures',
    icon: Receipt,
    title: 'Factures',
    screenshot: 'factures.png',
    description: "Gérez l'intégralité de votre facturation. Créez des factures manuellement ou depuis un devis accepté.\nLe statut Payé déclenche la comptabilisation du CA dans le Dashboard et les calculs URSSAF.",
    tips: [
      "Passez une facture en statut \"Payé\" pour qu'elle soit comptabilisée dans votre CA annuel.",
      "L'IBAN renseigné dans Paramètres apparaît automatiquement sur chaque facture PDF.",
      "La numérotation des factures est automatique et séquentielle.",
      "Si vous êtes assujetti à la TVA, la TVA est calculée et affichée sur le PDF.",
    ],
  },
  {
    id: 'urssaf',
    label: 'URSSAF',
    icon: Building2,
    title: 'Déclarations URSSAF',
    screenshot: 'urssaf.png',
    description: "La page URSSAF vous aide à préparer vos déclarations trimestrielles.\nElle calcule automatiquement le CA de chaque trimestre et le montant des cotisations\nen fonction du taux paramétré dans vos réglages.",
    tips: [
      "Le taux de cotisation URSSAF est configurable dans Paramètres (défaut : 22%).",
      "Seules les factures avec le statut \"Payé\" sont comptabilisées dans le CA déclaré.",
      "Cochez chaque déclaration une fois effectuée pour suivre votre historique.",
    ],
  },
  {
    id: 'tva',
    label: 'TVA',
    icon: Percent,
    title: 'Suivi TVA',
    screenshot: 'tva.png',
    description: "La page TVA affiche votre CA cumulé par rapport au seuil de franchise TVA.\nSi vous dépassez le seuil, vous devez vous assujettir à la TVA — activez-le dans Paramètres\net l'application ajoutera automatiquement la TVA sur vos futurs documents.",
    tips: [
      "Le seuil de franchise TVA standard est de 37 500 € (vérifiez le seuil actuel en vigueur).",
      "Une fois assujetti, indiquez la date de début d'assujettissement dans Paramètres.",
      "Les factures créées avant la date d'assujettissement restent sans TVA.",
    ],
  },
  {
    id: 'parametres',
    label: 'Paramètres',
    icon: Settings,
    title: 'Paramètres',
    screenshot: 'parametres.png',
    description: "La page Paramètres regroupe toutes vos informations professionnelles et vos préférences.\nLes informations entreprise (nom, adresse, SIRET, IBAN) sont affichées sur vos devis et factures PDF.\nLa section Apparence vous permet de personnaliser les couleurs et la police de l'interface.",
    tips: [
      "Renseignez votre IBAN pour qu'il apparaisse sur vos factures et facilite les paiements.",
      "Activez la TVA dans les paramètres dès que vous dépassez le seuil de franchise.",
      "Changez la couleur d'accent et la police dans la section Apparence — vos préférences sont sauvegardées automatiquement.",
    ],
  },
]

function ScreenshotPlaceholder({ label }) {
  return (
    <div className="w-full h-48 rounded-xl bg-gray-100 dark:bg-[#1a2236] flex items-center justify-center border border-gray-200 dark:border-[#1e2a3a]">
      <div className="text-center">
        <BookOpen size={28} className="text-gray-300 dark:text-slate-600 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-xs text-gray-400 dark:text-slate-500">
          Screenshot &ldquo;{label}&rdquo; non disponible
        </p>
        <p className="text-xs text-gray-300 dark:text-slate-600 mt-0.5">
          Lancez <code className="font-mono bg-gray-200 dark:bg-[#0f1117] px-1 rounded">npm run capture-docs</code>
        </p>
      </div>
    </div>
  )
}

function Screenshot({ file, label }) {
  const [error, setError] = useState(false)
  if (!file) return null
  if (error) return <ScreenshotPlaceholder label={label} />
  return (
    <img
      src={`/docs/${file}`}
      alt={`Capture d'écran ${label}`}
      className="w-full rounded-xl border border-gray-200 dark:border-[#1e2a3a] shadow-sm"
      onError={() => setError(true)}
    />
  )
}

function Aide() {
  const [activeId, setActiveId] = useState('intro')
  const sectionRefs = useRef({})

  useEffect(() => {
    const observers = []
    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id]
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id) },
        { threshold: 0.3, rootMargin: '-60px 0px -40% 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  function scrollTo(id) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex gap-8 min-h-full">

      {/* ── Nav doc sticky ─────────────────────────────────── */}
      <nav className="hidden lg:block w-44 shrink-0">
        <div className="sticky top-0 pt-1">
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
            Sections
          </p>
          <ul className="space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  onClick={() => scrollTo(id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left ${
                    activeId === id
                      ? 'bg-accent-500/10 text-accent-500 dark:text-accent-400 font-medium'
                      : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#1a2236]'
                  }`}
                >
                  <Icon size={14} className="shrink-0" strokeWidth={activeId === id ? 2 : 1.75} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ── Contenu ────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-16 pb-16">

        {/* En-tête */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Aide</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
            Guide d&apos;utilisation de l&apos;application
          </p>
        </div>

        {/* Sections */}
        {SECTIONS.map(({ id, title, screenshot, description, tips, label }) => (
          <section
            key={id}
            id={id}
            ref={el => { sectionRefs.current[id] = el }}
            className="scroll-mt-4"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
              {title}
            </h2>

            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed mb-4 whitespace-pre-line">
              {description}
            </p>

            <Screenshot file={screenshot} label={label} />

            {tips.length > 0 && (
              <div className="mt-4 space-y-2">
                {tips.map((tip, i) => (
                  <div key={i} className="flex gap-2.5 text-sm text-gray-600 dark:text-slate-400">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent-400 shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 border-b border-gray-100 dark:border-[#1e2a3a]" />
          </section>
        ))}

      </div>
    </div>
  )
}

export default Aide
