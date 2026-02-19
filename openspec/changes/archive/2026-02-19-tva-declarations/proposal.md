## Why

La TVA ne s'applique pas rétroactivement aux factures passées — seulement à partir de la date d'assujettissement. De plus, une fois assujetti, l'auto-entrepreneur doit déclarer et verser la TVA trimestriellement. L'app doit permettre de définir la date de début d'assujettissement et de suivre les déclarations TVA comme l'URSSAF.

## What Changes

- Ajout de `tva_date_debut` dans les paramètres (date à partir de laquelle la TVA s'applique)
- Nouvelle table `tva_declarations` (trimestres, montant collecté automatique, montant versé, statut)
- Nouvelles routes backend GET/POST `/api/tva/:annee`
- Nouvelle page `TVA.jsx` avec les 4 trimestres de l'année (sélecteur d'année)
- Mise à jour du dashboard : carte TVA avec collectée / versée / reste (filtrée par date début)
- Mise à jour de la liste Factures : TTC affiché uniquement pour les factures >= tva_date_debut
- Ajout de TVA dans la navigation sidebar

## Capabilities

### New Capabilities
- `tva-date-debut` : Paramètre date de début d'assujettissement, filtrage des calculs TVA
- `tva-declarations-page` : Page de suivi des déclarations TVA trimestrielles

### Modified Capabilities
<!-- Aucune -->

## Impact

- `electron/main.js` : migration, routes GET/POST tva, mise à jour dashboard stats et factures list
- `frontend/src/pages/TVA.jsx` : nouvelle page
- `frontend/src/pages/Parametres.jsx` : champ tva_date_debut
- `frontend/src/pages/Dashboard.jsx` : carte TVA mise à jour
- `frontend/src/pages/Factures.jsx` : TTC conditionnel sur date_debut
- `frontend/src/App.jsx` (ou sidebar) : ajout lien TVA dans navigation
