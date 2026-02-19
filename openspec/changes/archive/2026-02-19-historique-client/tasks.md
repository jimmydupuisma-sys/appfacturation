## 1. Backend — Endpoint historique

- [x] 1.1 Ajouter `GET /api/clients/:id/historique` dans `electron/main.js` — retourne client, stats (ca_total, ca_annee, nb_factures, nb_devis), ca_par_annee[], factures[], devis[]

## 2. Frontend — Page ClientHistorique

- [x] 2.1 Créer `frontend/src/pages/ClientHistorique.jsx` avec chargement depuis `/api/clients/:id/historique`
- [x] 2.2 Ajouter les 4 cartes stats (CA total, CA année, nb factures, nb devis)
- [x] 2.3 Ajouter la section "Évolution CA par année" avec barres CSS relatives au max
- [x] 2.4 Ajouter le tableau des factures (numéro, date, montant, bouton PDF)
- [x] 2.5 Ajouter le tableau des devis (numéro, date, montant, statut, bouton → Facture)
- [x] 2.6 Ajouter le bouton "Nouvelle facture" qui navigue vers `/factures` avec state `{ client_id, openModal: true }`

## 3. Navigation et intégration

- [x] 3.1 Ajouter la route `/clients/:id` dans `frontend/src/App.jsx`
- [x] 3.2 Ajouter le bouton historique (icône) sur chaque ligne de `frontend/src/pages/Clients.jsx`
- [x] 3.3 Modifier `frontend/src/pages/Factures.jsx` pour ouvrir le modal pré-rempli si `location.state` contient `client_id` et `openModal: true`

## 4. Build

- [x] 4.1 `npm run build` dans `frontend/` et vérifier que tout compile
