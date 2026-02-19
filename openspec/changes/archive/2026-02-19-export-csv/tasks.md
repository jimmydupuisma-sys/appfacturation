## 1. Backend — Route export CSV

- [x] 1.1 Ajouter la route `GET /api/factures/export-csv` dans `factures.js` : requête SQL jointure factures + clients + lignes, génération CSV avec BOM UTF-8, headers Content-Disposition

## 2. Frontend — Bouton export

- [x] 2.1 Ajouter un bouton "Exporter CSV" dans `Factures.jsx` qui déclenche le téléchargement via `window.location.href` avec l'année en cours (ou filtre actif)
