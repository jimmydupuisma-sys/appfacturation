## 1. Base de données (electron/main.js)

- [x] 1.1 Ajouter les migrations pour `tva_active INTEGER DEFAULT 0`, `taux_tva REAL DEFAULT 20.0`, `seuil_tva REAL DEFAULT 37500` dans `initDatabase()`

## 2. Backend — Paramètres (electron/main.js)

- [x] 2.1 Ajouter `tva_active`, `taux_tva`, `seuil_tva` dans le PUT `/api/parametres`

## 3. Backend — Dashboard (electron/main.js)

- [x] 3.1 Inclure `tva_active` et `seuil_tva` dans la réponse de GET `/api/dashboard/stats`

## 4. Backend — PDF Facture (electron/main.js)

- [x] 4.1 Modifier la génération PDF dans `/api/factures/:id/pdf` pour afficher HT + TVA + TTC quand `tva_active = 1`, et supprimer la mention 293B dans ce cas

## 5. Frontend — Paramètres

- [x] 5.1 Ajouter le toggle "Assujetti à la TVA", le champ "Taux TVA (%)" et "Seuil franchise TVA (€)" dans `Parametres.jsx`

## 6. Frontend — Dashboard

- [x] 6.1 Créer le composant `SeuilTVABar` dans `Dashboard.jsx` (même structure que `SeuilCABar`, visible si `!tva_active && seuil_tva > 0`)

## 7. Frontend — Factures

- [x] 7.1 Afficher Total HT / TVA / Total TTC dans la modale de `Factures.jsx` quand `tva_active` est true (récupérer les paramètres au chargement)
