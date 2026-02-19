## Context

L'app utilise Express + better-sqlite3 côté backend. Les factures sont stockées avec leurs lignes dans `factures` et `facture_lignes`. Le frontend React appelle `/api/factures` pour lister les factures. Il n'existe aucune fonctionnalité d'export actuellement.

## Goals / Non-Goals

**Goals:**
- Générer un CSV côté backend et le renvoyer comme téléchargement
- Couvrir les factures avec : numéro, date, client, montant total HT, statut
- Filtre par année via query param

**Non-Goals:**
- Export des devis
- Export des données URSSAF
- Export XLSX ou autre format
- Sélection de colonnes par l'utilisateur

## Decisions

**CSV généré côté backend (pas côté client)**
Le backend a déjà accès à toutes les données et peut joindre les tables. Évite de charger toutes les données dans le frontend juste pour exporter.

**Pas de librairie CSV**
Le format CSV des factures est simple (pas de valeurs multilignes complexes). On génère manuellement avec join + échappement basique. Zéro dépendance ajoutée.

**Header Content-Disposition pour déclencher le téléchargement**
La route retourne `Content-Type: text/csv` + `Content-Disposition: attachment; filename=factures-YYYY.csv`. Le navigateur (ou Electron) déclenche le téléchargement automatiquement.

**Lien `<a href>` dans le frontend**
Plutôt qu'un `fetch`, on utilise `window.location.href` ou un `<a>` pointant vers la route backend. Plus simple, fonctionne nativement dans Electron.

## Risks / Trade-offs

- Encodage : les noms de clients peuvent contenir des caractères spéciaux. On encode en UTF-8 avec BOM pour compatibilité Excel français.
- Guillemets dans les valeurs : on encapsule toutes les valeurs dans des guillemets doubles et on double les guillemets internes.
