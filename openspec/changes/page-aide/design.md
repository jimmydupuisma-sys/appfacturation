## Context

L'application est une app Electron (React + Vite + Express/SQLite). La sidebar existe déjà avec 8 entrées de navigation. Il n'y a pas de documentation in-app. Les utilisateurs sont des personnes à qui le logiciel est partagé — pas des développeurs.

## Goals / Non-Goals

**Goals:**
- Page `/aide` accessible depuis la sidebar avec navigation par section
- Screenshot de chaque page principale de l'app
- Script automatisé (Playwright) pour régénérer les screenshots
- Aucune dépendance backend

**Non-Goals:**
- Documentation interactive/animée
- Recherche dans la documentation
- Vidéos ou GIFs
- Hébergement externe de la doc
- Screenshots de chaque état possible (modales, formulaires ouverts, etc.)

## Decisions

### D1 : Screenshots via Playwright sur le serveur dev
Le script `scripts/capture-docs.js` démarre Vite (`npm run dev:frontend` en background), attend que le port soit disponible, navigue vers chaque route, attend le rendu, capture, puis termine.

**Alternative écartée :** Screenshots manuels. Trop fastidieux à maintenir quand l'UI évolue. Playwright permet de tout régénérer en une commande.

**Alternative écartée :** Playwright sur le build Electron. Plus complexe à piloter programmatiquement depuis un script Node.

### D2 : Screenshots avec données vides/minimales
Le script navigue vers les pages telles quelles — sans seeder de données de démo. Les pages vides montrent l'UI proprement (états "empty state" sont déjà gérés dans l'app). Régénérer les screenshots après avoir rentré des données réelles donnera un meilleur résultat.

**Dimension des screenshots :** 1280×800 (rapport 16:10, adapté à l'affichage dans la doc).

### D3 : Page Aide — layout deux colonnes
```
┌──────────────────────────────────────────────────┐
│  Sidebar app (existante)                         │
├──────────┬───────────────────────────────────────┤
│  Nav doc │  Contenu                              │
│  sticky  │  ┌─────────────────────────────────┐ │
│          │  │ Titre section                   │ │
│  • Intro │  │ Description                     │ │
│  • Dash  │  │ Screenshot (img pleine largeur) │ │
│  • Cli   │  │ Tips / liste de fonctionnalités │ │
│  • Pres  │  └─────────────────────────────────┘ │
│  • Devis │                                       │
│  • Fact  │                                       │
│  • URSS  │                                       │
│  • TVA   │                                       │
│  • Param │                                       │
└──────────┴───────────────────────────────────────┘
```
La nav doc est sticky et met en surbrillance la section active au scroll (IntersectionObserver).

### D4 : Screenshots stockés dans `frontend/public/docs/`
Fichiers PNG nommés par route : `dashboard.png`, `clients.png`, etc. Référencés avec `/docs/dashboard.png`. Ignorés du git (`.gitignore`) ou inclus selon le choix — à décider.

### D5 : Playwright installé à la racine du projet
```bash
npm install --save-dev playwright
```
Script `capture-docs` dans `package.json` racine. Le script attend que Vite soit prêt sur le port 5173 avant de commencer.

**Note :** Le backend n'est pas nécessaire pour capturer les screenshots statiques des pages (même si les données ne chargent pas, la structure UI est visible). Si le backend tourne, les vraies données s'affichent.

## Risks / Trade-offs

- **Screenshots obsolètes si l'UI change** : mitigation → script `npm run capture-docs` facile à relancer
- **Playwright first install** : télécharge ~100MB de chromium → avertissement dans le README
- **IntersectionObserver** : bien supporté dans les navigateurs modernes et Electron ✓

## Migration Plan

1. Installer `playwright` à la racine
2. Créer `scripts/capture-docs.js`
3. Créer `frontend/public/docs/` et générer les screenshots
4. Créer `frontend/src/pages/Aide.jsx`
5. Ajouter route `/aide` dans `App.jsx`
6. Ajouter entrée Aide dans `Sidebar.jsx`
7. Ajouter script `capture-docs` dans `package.json`
