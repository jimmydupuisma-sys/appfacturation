## Why

Actuellement, cliquer sur le bouton PDF d'une facture ou d'un devis déclenche directement l'ouverture du fichier sans pouvoir le consulter dans l'app. Un aperçu intégré permet de vérifier le document avant de le télécharger ou de l'imprimer.

## What Changes

- Ajout d'une modale "Aperçu PDF" dans `Factures.jsx` et `Devis.jsx` : l'iframe charge le PDF depuis la route existante `/api/factures/:id/pdf` ou `/api/devis/:id/pdf`
- Le bouton PDF existant (icône Download) ouvre la modale au lieu d'ouvrir directement le fichier
- La modale contient un bouton "Télécharger" et un bouton "Fermer"

## Capabilities

### New Capabilities
- `pdf-preview` : Modale d'aperçu PDF réutilisable affichant le document via iframe, avec actions télécharger/fermer

### Modified Capabilities
<!-- Aucune -->

## Impact

- Frontend uniquement : `Factures.jsx`, `Devis.jsx`
- Aucune modification backend nécessaire (routes PDF déjà existantes)
- Aucune dépendance externe
