## ADDED Requirements

### Requirement: Aperçu PDF depuis la liste des factures
Le système SHALL afficher une modale d'aperçu PDF lorsque l'utilisateur clique sur le bouton PDF d'une facture, au lieu d'ouvrir directement le fichier.

#### Scenario: Ouverture de l'aperçu
- **WHEN** l'utilisateur clique sur le bouton PDF d'une facture
- **THEN** une modale s'ouvre avec le PDF affiché dans une iframe

#### Scenario: Téléchargement depuis l'aperçu
- **WHEN** l'utilisateur clique sur "Télécharger" dans la modale
- **THEN** le fichier PDF est téléchargé localement

#### Scenario: Fermeture de la modale
- **WHEN** l'utilisateur clique sur "Fermer" ou en dehors de la modale
- **THEN** la modale se ferme

### Requirement: Aperçu PDF depuis la liste des devis
Le système SHALL afficher une modale d'aperçu PDF lorsque l'utilisateur clique sur le bouton PDF d'un devis.

#### Scenario: Ouverture de l'aperçu devis
- **WHEN** l'utilisateur clique sur le bouton PDF d'un devis
- **THEN** une modale s'ouvre avec le PDF du devis affiché dans une iframe

#### Scenario: Téléchargement depuis l'aperçu devis
- **WHEN** l'utilisateur clique sur "Télécharger" dans la modale
- **THEN** le fichier PDF du devis est téléchargé localement
