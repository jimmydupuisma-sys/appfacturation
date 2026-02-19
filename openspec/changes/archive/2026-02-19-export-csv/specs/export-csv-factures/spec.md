## ADDED Requirements

### Requirement: Export CSV des factures
Le système SHALL fournir une route `GET /api/factures/export-csv` acceptant un paramètre `annee` (entier, ex: `2026`) et retournant un fichier CSV téléchargeable contenant toutes les factures de cette année.

#### Scenario: Export avec année valide
- **WHEN** le frontend appelle `GET /api/factures/export-csv?annee=2026`
- **THEN** le backend retourne un fichier CSV avec Content-Type `text/csv; charset=utf-8` et Content-Disposition `attachment; filename=factures-2026.csv`

#### Scenario: Colonnes du CSV
- **WHEN** le fichier CSV est généré
- **THEN** il contient les colonnes : Numéro, Date, Client, Montant HT (€), Statut

#### Scenario: Encodage UTF-8 avec BOM
- **WHEN** le fichier est ouvert dans Excel (Windows/Mac)
- **THEN** les caractères spéciaux (accents, etc.) s'affichent correctement grâce au BOM UTF-8

#### Scenario: Année par défaut
- **WHEN** le paramètre `annee` est absent
- **THEN** le backend utilise l'année en cours

### Requirement: Bouton d'export dans la page Factures
Le système SHALL afficher un bouton "Exporter CSV" dans la page Factures qui déclenche le téléchargement du fichier CSV de l'année actuellement sélectionnée (ou année en cours).

#### Scenario: Clic sur le bouton
- **WHEN** l'utilisateur clique sur "Exporter CSV"
- **THEN** le navigateur télécharge le fichier `factures-YYYY.csv`
