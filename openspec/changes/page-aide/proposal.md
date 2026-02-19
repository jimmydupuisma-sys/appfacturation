## Why

L'application est partagée avec d'autres utilisateurs qui n'ont pas de documentation de référence. Une page d'aide intégrée permet à chaque utilisateur de comprendre les fonctionnalités sans avoir à contacter le créateur.

## What Changes

- Nouvelle route `/aide` dans l'application React
- Nouvelle page `Aide.jsx` avec navigation latérale par section, screenshots et descriptions de chaque fonctionnalité
- Ajout d'un lien "Aide" dans la sidebar principale (icône HelpCircle)
- Script Playwright `scripts/capture-docs.js` pour générer automatiquement les screenshots depuis le serveur de développement
- Screenshots stockés dans `frontend/public/docs/` et référencés statiquement dans la page

## Capabilities

### New Capabilities
- `page-aide`: Page de documentation in-app accessible depuis la sidebar, couvrant toutes les fonctionnalités de l'application avec screenshots et descriptions
- `capture-docs`: Script Playwright pour capturer automatiquement les screenshots de chaque page/section de l'application

### Modified Capabilities
- `parametres`: Ajout d'une entrée "Aide" dans la navigation sidebar (élément visuel modifié mais pas de changement de requirements métier)

## Impact

- `frontend/src/App.jsx` : nouvelle route `/aide`
- `frontend/src/components/Sidebar.jsx` : ajout du lien Aide
- `frontend/src/pages/Aide.jsx` : nouveau fichier, page complète
- `frontend/public/docs/` : dossier créé, screenshots PNG générés par Playwright
- `scripts/capture-docs.js` : script Node/Playwright (racine du projet)
- `package.json` : nouveau script `capture-docs`
- Dépendance dev : `playwright` (ou `@playwright/test`) installée à la racine
- Aucune modification backend
