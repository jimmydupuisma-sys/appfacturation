## Why

Un auto-entrepreneur qui dépasse le seuil de franchise TVA (37 500 € pour les prestations de services en 2025) doit collecter et facturer la TVA. L'app doit permettre d'activer la TVA pour que les factures affichent HT + TVA + TTC, et que le dashboard alerte à l'approche du seuil.

## What Changes

- Ajout de 3 paramètres : `tva_active` (booléen), `taux_tva` (REAL, défaut 20.0), `seuil_tva` (REAL, défaut 37500)
- Page Paramètres : toggle "Assujetti à la TVA" + champs taux et seuil
- Dashboard : barre de progression seuil TVA (comme SeuilCABar, visible uniquement si `tva_active = false` et `seuil_tva > 0`)
- Factures (UI) : affichage Total HT / TVA / Total TTC quand TVA activée
- PDF Facture : affichage HT + TVA + TTC quand TVA activée, suppression de la mention "TVA non applicable"
- Pas de modification des factures existantes

## Capabilities

### New Capabilities
- `tva-parametres` : Configuration TVA (toggle, taux, seuil) dans les paramètres
- `tva-dashboard` : Barre de progression seuil TVA sur le dashboard
- `tva-factures` : Calcul et affichage TVA sur les factures (UI + PDF)

### Modified Capabilities
<!-- Aucune -->

## Impact

- `electron/main.js` : migration DB (3 colonnes), routes parametres, dashboard/stats, PDF facture
- `frontend/src/pages/Parametres.jsx` : toggle + champs TVA
- `frontend/src/pages/Dashboard.jsx` : composant SeuilTVABar
- `frontend/src/pages/Factures.jsx` : affichage HT/TVA/TTC dans la modale
