## 1. Base de données (electron/main.js)

- [x] 1.1 Migration : ajouter `tva_date_debut TEXT DEFAULT NULL` dans `parametres`
- [x] 1.2 Créer la table `tva_declarations` (trimestre, annee, montant_verse, statut, date_paiement, notes, UNIQUE(trimestre, annee))

## 2. Backend — Paramètres (electron/main.js)

- [x] 2.1 Ajouter `tva_date_debut` dans PUT `/api/parametres`

## 3. Backend — Routes TVA (electron/main.js)

- [x] 3.1 Ajouter GET `/api/tva/:annee` : retourne 4 trimestres avec montant_collecte calculé (factures >= tva_date_debut) et données de déclaration existantes
- [x] 3.2 Ajouter POST `/api/tva` : upsert d'une déclaration (trimestre, annee, montant_verse, statut, date_paiement, notes)

## 4. Backend — Dashboard (electron/main.js)

- [x] 4.1 Mettre à jour GET `/api/dashboard/stats` : filtrer `tva_collectee` par `tva_date_debut`, ajouter `tva_versee` (somme des déclarations payées) et `tva_restante`

## 5. Frontend — Paramètres

- [x] 5.1 Ajouter le champ "Date de début d'assujettissement" dans `Parametres.jsx` (visible si `tva_active`)

## 6. Frontend — Factures

- [x] 6.1 Mettre à jour `Factures.jsx` : charger `tva_date_debut` depuis les paramètres, afficher TTC uniquement pour les factures >= tva_date_debut

## 7. Frontend — Page TVA

- [x] 7.1 Créer `frontend/src/pages/TVA.jsx` : page avec sélecteur d'année, tableau des 4 trimestres, édition montant versé + statut
- [x] 7.2 Ajouter la route `/tva` et le lien dans la navigation (`App.jsx` ou sidebar)

## 8. Frontend — Dashboard

- [x] 8.1 Mettre à jour la carte TVA dans `Dashboard.jsx` pour afficher collectée / versée / reste à reverser (3 slides)
