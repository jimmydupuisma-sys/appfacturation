## Why

La page Clients ne montre que les coordonnées — impossible de voir l'historique commercial d'un client (factures, devis, CA) sans aller chercher manuellement dans chaque section. Un auto-entrepreneur a besoin de voir en un coup d'œil la valeur et l'activité d'un client.

## What Changes

- Ajout d'un bouton "Historique" sur chaque ligne de la liste clients
- Nouvelle page dédiée `/clients/:id` affichant :
  - Stats : CA total, CA année en cours, nb factures, nb devis
  - Évolution du CA par année (barre de progression par année)
  - Liste des factures avec accès PDF direct
  - Liste des devis avec statut et action "convertir en facture"
  - Bouton "Nouvelle facture" pré-rempli avec ce client
- Nouveau endpoint API `GET /api/clients/:id/historique`

## Capabilities

### New Capabilities

- `client-historique` : Page d'historique par client — stats CA, évolution annuelle, factures, devis, conversion devis→facture

### Modified Capabilities

- `clients` : Ajout du lien vers la page historique depuis la liste

## Impact

- `frontend/src/pages/Clients.jsx` : ajout bouton historique sur chaque ligne
- `frontend/src/pages/ClientHistorique.jsx` : nouvelle page (à créer)
- `frontend/src/App.jsx` : ajout de la route `/clients/:id`
- `electron/main.js` : nouveau endpoint `GET /api/clients/:id/historique`
