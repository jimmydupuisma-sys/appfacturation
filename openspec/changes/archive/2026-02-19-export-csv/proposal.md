## Why

L'auto-entrepreneur a besoin de pouvoir exporter ses données de facturation en CSV pour les intégrer dans un tableur (comptable, déclaration fiscale, suivi personnel). Actuellement, toutes les données sont uniquement consultables dans l'application.

## What Changes

- Ajout d'un bouton d'export CSV dans la page Factures
- Export des factures de l'année en cours (ou sélection d'année) avec colonnes : numéro, date, client, montant HT, statut
- Route backend `GET /api/factures/export-csv?annee=YYYY` retournant un fichier CSV

## Capabilities

### New Capabilities
- `export-csv-factures` : Export des factures au format CSV, déclenché depuis la page Factures, avec filtre par année

### Modified Capabilities
<!-- Aucune -->

## Impact

- Backend : nouvelle route dans `backend/src/routes/factures.js`
- Frontend : bouton dans `frontend/src/pages/Factures.jsx`
- Aucune dépendance externe (CSV généré manuellement, pas de lib)
