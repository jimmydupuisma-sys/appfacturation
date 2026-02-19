## ADDED Requirements

### Requirement: Accès historique depuis la liste
Le système SHALL afficher un bouton d'accès à l'historique sur chaque ligne de la liste clients.

#### Scenario: Bouton historique visible
- **WHEN** la liste clients est affichée
- **THEN** chaque ligne contient un bouton permettant de naviguer vers `/clients/:id`
