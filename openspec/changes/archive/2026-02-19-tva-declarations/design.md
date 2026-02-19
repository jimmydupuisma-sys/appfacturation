## Context

L'app utilise sql.js dans Electron. La table `urssaf` est la référence pour le modèle de déclarations par période. La page URSSAF est le modèle UI de référence. La navigation est dans `App.jsx` ou un composant sidebar. `tva_active`, `taux_tva`, `seuil_tva` existent déjà dans `parametres`.

## Goals / Non-Goals

**Goals:**
- `tva_date_debut` : seules les factures émises à partir de cette date sont assujetties TVA
- Déclarations TVA par trimestre (T1/T2/T3/T4), montant collecté calculé auto
- Possibilité de saisir le montant versé et marquer payé/impayé
- Dashboard TVA : collectée (depuis date_debut) / versée / reste à reverser

**Non-Goals:**
- Déclarations mensuelles (trimestres suffisants pour micro-entrepreneur)
- Gestion TVA déductible sur achats
- Intégration avec un service fiscal externe
- Modification des PDFs de factures déjà générées

## Decisions

**tva_date_debut stockée comme TEXT (YYYY-MM-DD)**
Cohérent avec les autres dates dans la DB. Null = TVA s'applique à toutes les factures depuis l'activation du toggle.

**Calcul montant_collecte côté backend, à la volée**
Comme pour URSSAF, on calcule le montant collecté par trimestre via SQL : SUM des lignes des factures dont `date_emission` est dans le trimestre ET >= `tva_date_debut`. Pas de colonne TVA stockée par facture.

**Table tva_declarations : structure calquée sur urssaf**
```sql
CREATE TABLE IF NOT EXISTS tva_declarations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trimestre INTEGER NOT NULL,  -- 1, 2, 3, 4
  annee INTEGER NOT NULL,
  montant_verse REAL DEFAULT 0,
  statut TEXT DEFAULT 'impayé',
  date_paiement DATE,
  notes TEXT,
  UNIQUE(trimestre, annee)
)
```

**Page TVA calquée sur URSSAF**
Même structure : tableau avec les 4 trimestres, montant collecté (calculé), montant versé (éditable), statut, bouton de mise à jour. Sélecteur d'année identique.

**Affichage TTC dans la liste Factures conditionnel sur tva_date_debut**
Si `tva_active && tva_date_debut && facture.date_emission >= tva_date_debut` → affiche TTC. Sinon → affiche HT. La date est chargée depuis `/api/parametres` au même titre que `tva_active`.

**Dashboard : filtrage TVA collectée par tva_date_debut**
Le calcul `tva_collectee` dans `/api/dashboard/stats` filtre uniquement les factures >= `tva_date_debut` (si définie).

## Risks / Trade-offs

- Si `tva_date_debut` est null et `tva_active = 1` : on considère que toutes les factures de l'année sont assujetties (comportement actuel, acceptable comme fallback).
- Le montant collecté par trimestre est calculé sur le CA HT des factures × taux_tva — cela suppose que les prix sur les factures sont HT. Conforme au cas d'usage.
