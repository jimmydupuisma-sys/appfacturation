## ADDED Requirements

### Requirement: Script de capture automatique des screenshots
Le système SHALL fournir un script `scripts/capture-docs.js` exécutable via `npm run capture-docs` qui lance Playwright, navigue vers chaque page de l'application et sauvegarde un screenshot PNG dans `frontend/public/docs/`.

#### Scenario: Exécution du script
- **WHEN** l'utilisateur exécute `npm run capture-docs`
- **THEN** le script démarre Vite dev server s'il ne tourne pas déjà
- **THEN** Playwright ouvre un browser (Chromium headless) à 1280×800
- **THEN** chaque page est capturée et sauvegardée sous `frontend/public/docs/<nom>.png`
- **THEN** le script affiche un résumé des fichiers créés

#### Scenario: Pages capturées
- **WHEN** le script s'exécute
- **THEN** les fichiers suivants sont créés : `dashboard.png`, `clients.png`, `prestations.png`, `devis.png`, `factures.png`, `urssaf.png`, `tva.png`, `parametres.png`

#### Scenario: Dossier de destination absent
- **WHEN** `frontend/public/docs/` n'existe pas
- **THEN** le script crée le dossier automatiquement avant de sauvegarder les screenshots
