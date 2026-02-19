## 1. CSS Variables et Tailwind

- [x] 1.1 Ajouter les CSS variables d'accent pour les 5 thèmes dans `frontend/src/index.css` (`:root` + `[data-theme="violet"]`, `[data-theme="emerald"]`, `[data-theme="rose"]`, `[data-theme="amber"]`)
- [x] 1.2 Ajouter la CSS variable `--font-body` dans `:root` avec valeur par défaut `'Lora'`
- [x] 1.3 Mettre à jour `frontend/tailwind.config.js` : ajouter la couleur `accent` avec `rgb(var(--accent-X) / <alpha-value>)` pour les shades 50, 100, 300, 400, 500, 600, 700
- [x] 1.4 Supprimer ou garder le mapping `aubergine` (peut être supprimé car remplacé par `accent`)

## 2. Renommage sky → accent dans les JSX

- [x] 2.1 Renommer toutes les occurrences `sky-` en `accent-` dans `frontend/src/components/Sidebar.jsx`
- [x] 2.2 Renommer dans `frontend/src/components/ui/Button.jsx`
- [x] 2.3 Renommer dans `frontend/src/components/ui/Input.jsx`
- [x] 2.4 Renommer dans `frontend/src/components/ui/Select.jsx`
- [x] 2.5 Renommer dans `frontend/src/components/ui/helpers.jsx`
- [x] 2.6 Renommer dans `frontend/src/pages/Dashboard.jsx`
- [x] 2.7 Renommer dans `frontend/src/pages/Clients.jsx`
- [x] 2.8 Renommer dans `frontend/src/pages/ClientHistorique.jsx`
- [x] 2.9 Renommer dans `frontend/src/pages/Factures.jsx`
- [x] 2.10 Renommer dans `frontend/src/pages/Devis.jsx`
- [x] 2.11 Renommer dans `frontend/src/pages/TVA.jsx`
- [x] 2.12 Renommer dans `frontend/src/pages/Urssaf.jsx`
- [x] 2.13 Renommer dans `frontend/src/pages/Parametres.jsx`
- [x] 2.14 Vérification finale : `grep -r "sky-" frontend/src/ --include="*.jsx"` doit retourner zéro résultat

## 3. ThemeContext

- [x] 3.1 Créer `frontend/src/contexts/Theme.jsx` avec `ThemeProvider` et `useTheme` hook
  - Gère `theme` (string, défaut `'sky'`) et `font` (string, défaut `'Lora'`)
  - Au mount : lit localStorage, applique `data-theme` sur `<html>` et la CSS variable `--font-body` sur `<html>`
  - Fonction `setTheme(name)` : met à jour state + `data-theme` + localStorage
  - Fonction `setFont(name)` : injecte `<link>` Google Fonts si absent + met à jour CSS variable + localStorage
- [x] 3.2 Ajouter `ThemeProvider` dans `frontend/src/main.jsx` autour de l'app (après `DarkModeProvider`)

## 4. Section Apparence dans Paramètres

- [x] 4.1 Importer `useTheme` dans `frontend/src/pages/Parametres.jsx`
- [x] 4.2 Ajouter une `Card` "Apparence" avec la grille de 5 swatches de couleur cliquables (chaque swatch montre la couleur d'accent, bordure épaisse si actif)
- [x] 4.3 Ajouter dans la même Card la liste des 10 polices, chaque option rendue dans sa propre police (via `font-family` inline), avec indicateur visuel si active
- [x] 4.4 Vérifier que la sélection d'un thème change immédiatement l'interface et que la sélection d'une police applique la police instantanément

## 5. Vérification

- [x] 5.1 Tester les 5 thèmes : l'accent change bien dans la sidebar (nav active), les boutons, les inputs focus
- [x] 5.2 Tester les 10 polices : la police change sur toute l'interface
- [x] 5.3 Tester la persistance : fermer/rouvrir → thème et police restaurés
- [x] 5.4 Tester le fallback police : désactiver le réseau et vérifier que l'app fonctionne avec le fallback
