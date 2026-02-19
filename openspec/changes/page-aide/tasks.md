## 1. Dépendances et infrastructure

- [x] 1.1 Installer `playwright` en dépendance dev à la racine : `npm install --save-dev playwright`
- [x] 1.2 Installer les browsers Playwright : `npx playwright install chromium`
- [x] 1.3 Créer le dossier `frontend/public/docs/` (vide pour l'instant)
- [x] 1.4 Ajouter le script `"capture-docs": "node scripts/capture-docs.js"` dans `package.json` racine

## 2. Script Playwright de capture

- [x] 2.1 Créer `scripts/capture-docs.js` :
  - Importe `playwright` et `child_process`
  - Lance `npm run dev:frontend` en background (spawn, stdout supprimé)
  - Attend que `http://localhost:5173` soit disponible (poll avec retry)
  - Ouvre Chromium headless à 1280×800
  - Crée `frontend/public/docs/` si absent
  - Pour chaque route [/, /clients, /prestations, /devis, /factures, /urssaf, /tva, /parametres] : navigue, attend 1500ms (rendu), screenshot PNG
  - Ferme le browser et tue le processus Vite
  - Affiche la liste des fichiers créés
- [x] 2.2 Tester le script : `npm run capture-docs` → vérifier que 8 PNG sont créés dans `frontend/public/docs/`

## 3. Page Aide — composant

- [x] 3.1 Créer `frontend/src/pages/Aide.jsx` avec :
  - Layout deux colonnes : nav doc sticky à gauche (w-48), contenu à droite
  - Tableau `SECTIONS` avec `{ id, label, icon, screenshot, title, description, tips[] }` pour les 9 sections (intro + 8 pages)
  - Rendu de chaque section : `<section id={id}>` avec titre H2, screenshot (`<img src={/docs/${screenshot}}` avec fallback placeholder si absent), description, liste de tips
  - IntersectionObserver pour mettre en surbrillance la section active dans la nav doc
- [x] 3.2 Rédiger les descriptions et tips pour chaque section :
  - **Intro** : présentation de l'app, à qui elle s'adresse
  - **Dashboard** : vue d'ensemble CA, graphique mensuel, seuil URSSAF, alertes
  - **Clients** : gestion de la liste, ajout/édition/suppression, accès historique
  - **Prestations** : catalogue de services réutilisables dans devis/factures
  - **Devis** : création, statuts (brouillon/envoyé/accepté/refusé), conversion en facture, export PDF
  - **Factures** : création manuelle ou depuis devis, statuts (brouillon/envoyé/payé), export PDF
  - **URSSAF** : suivi des déclarations trimestrielles, cotisations calculées automatiquement
  - **TVA** : suivi de la franchise TVA, activation si seuil dépassé
  - **Paramètres** : infos entreprise affichées sur les documents, réglages TVA, apparence

## 4. Intégration dans l'app

- [x] 4.1 Ajouter `import Aide from './pages/Aide'` et la route `<Route path="/aide" element={<Aide />} />` dans `frontend/src/App.jsx`
- [x] 4.2 Ajouter l'entrée `{ to: '/aide', label: 'Aide', icon: HelpCircle }` dans `navItems` de `frontend/src/components/Sidebar.jsx` (importer `HelpCircle` depuis lucide-react), positionnée avant le toggle mode sombre

## 5. Vérification

- [x] 5.1 Vérifier que la route `/aide` s'affiche correctement et que le lien sidebar est actif
- [x] 5.2 Vérifier que la navigation par section défile bien et que la section active est mise en surbrillance
- [x] 5.3 Vérifier que les screenshots s'affichent (après avoir lancé `npm run capture-docs`)
- [x] 5.4 Vérifier le build : `npm run build:frontend` sans erreur
