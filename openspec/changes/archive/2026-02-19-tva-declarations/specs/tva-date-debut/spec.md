## ADDED Requirements

### Requirement: Date de début d'assujettissement TVA
Le système SHALL stocker une `tva_date_debut` (format YYYY-MM-DD) dans les paramètres, représentant la date à partir de laquelle les factures sont assujetties à la TVA.

#### Scenario: Champ date visible quand TVA active
- **WHEN** `tva_active` est true dans la page Paramètres
- **THEN** un champ "Date de début d'assujettissement" est affiché

#### Scenario: Filtrage TVA collectée par date début
- **WHEN** `tva_date_debut` est définie et le backend calcule la TVA collectée
- **THEN** seules les factures dont `date_emission >= tva_date_debut` sont comptabilisées

#### Scenario: Affichage TTC conditionnel dans la liste factures
- **WHEN** `tva_active` est true ET `facture.date_emission >= tva_date_debut`
- **THEN** la colonne Montant affiche le total TTC

#### Scenario: Facture antérieure à la date début
- **WHEN** `tva_active` est true ET `facture.date_emission < tva_date_debut`
- **THEN** la colonne Montant affiche le total HT (sans TVA)

#### Scenario: tva_date_debut absente
- **WHEN** `tva_active` est true ET `tva_date_debut` est null
- **THEN** toutes les factures de l'année courante sont considérées assujetties
