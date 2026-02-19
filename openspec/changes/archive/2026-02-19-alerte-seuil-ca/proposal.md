## Why

Un auto-entrepreneur peut perdre le bénéfice du régime micro-entreprise s'il dépasse le seuil de chiffre d'affaires annuel sans s'en rendre compte. L'app ne donne actuellement aucune indication de la proximité de ce seuil.

## What Changes

- Ajout d'une barre de progression du CA annuel sur le Dashboard, affichant le % du seuil atteint
- Affichage du seuil applicable configurable (prestation de services ou vente de marchandises)
- Alerte visuelle colorée selon le niveau d'avancement (normal / avertissement / danger)
- Le seuil est configurable dans les Paramètres

## Capabilities

### New Capabilities

- `ca-seuil-alerte`: Barre de progression sur le Dashboard indiquant le CA annuel par rapport au seuil micro-entreprise, avec alertes visuelles selon le niveau atteint

### Modified Capabilities

- `parametres`: Ajout d'un champ "seuil de CA" (ou type d'activité) dans la page Paramètres pour configurer le plafond applicable

## Impact

- `frontend/src/pages/Dashboard.jsx` : ajout du composant barre de progression
- `frontend/src/pages/Parametres.jsx` : ajout du champ seuil
- `backend/src/routes/dashboard.js` : exposer le seuil configuré dans les stats
- `backend/src/routes/parametres.js` : gestion du nouveau champ
- `backend/src/database.js` : ajout colonne `seuil_ca` dans la table `parametres`
