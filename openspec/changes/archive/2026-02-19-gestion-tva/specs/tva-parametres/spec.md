## ADDED Requirements

### Requirement: Configuration TVA dans les paramètres
Le système SHALL stocker et exposer trois paramètres TVA : `tva_active` (0 ou 1), `taux_tva` (REAL, défaut 20.0), `seuil_tva` (REAL, défaut 37500).

#### Scenario: Lecture des paramètres TVA
- **WHEN** le frontend appelle GET `/api/parametres`
- **THEN** la réponse inclut `tva_active`, `taux_tva` et `seuil_tva`

#### Scenario: Sauvegarde des paramètres TVA
- **WHEN** le frontend appelle PUT `/api/parametres` avec `tva_active`, `taux_tva`, `seuil_tva`
- **THEN** les valeurs sont persistées en base

### Requirement: Interface toggle TVA dans Paramètres
Le système SHALL afficher dans la page Paramètres un toggle "Assujetti à la TVA", un champ "Taux TVA (%)" et un champ "Seuil franchise TVA (€)".

#### Scenario: Activation du toggle
- **WHEN** l'utilisateur active le toggle TVA et sauvegarde
- **THEN** `tva_active` passe à 1 et les factures affichent TVA

#### Scenario: Désactivation du toggle
- **WHEN** l'utilisateur désactive le toggle TVA et sauvegarde
- **THEN** `tva_active` passe à 0 et les factures reviennent en mode sans TVA
