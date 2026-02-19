## ADDED Requirements

### Requirement: Configuration du seuil de CA
La page Paramètres SHALL permettre à l'utilisateur de configurer son seuil de CA annuel micro-entreprise.

#### Scenario: Saisie du seuil
- **WHEN** l'utilisateur saisit une valeur dans le champ "Seuil de CA"
- **THEN** la valeur est sauvegardée en base et utilisée par le Dashboard

#### Scenario: Valeur par défaut
- **WHEN** aucun seuil n'a jamais été configuré
- **THEN** le champ affiche 77700 comme valeur par défaut (seuil prestations de services 2024)

### Requirement: Persistance du seuil en base
La table `parametres` SHALL contenir une colonne `seuil_ca` de type REAL avec une valeur par défaut de 77700.

#### Scenario: Migration base existante
- **WHEN** l'application démarre sur une base existante sans la colonne `seuil_ca`
- **THEN** la colonne est ajoutée sans erreur et sans perte de données
