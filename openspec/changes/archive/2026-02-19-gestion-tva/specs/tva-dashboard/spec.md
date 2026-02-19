## ADDED Requirements

### Requirement: Barre de progression seuil TVA sur le dashboard
Le système SHALL afficher une barre de progression "Seuil franchise TVA" sur le dashboard, visible uniquement si `tva_active = false` et `seuil_tva > 0`.

#### Scenario: Affichage de la barre TVA
- **WHEN** `tva_active` est false et `seuil_tva` > 0
- **THEN** une barre de progression affiche le CA annuel vs le seuil TVA avec le pourcentage

#### Scenario: Masquage quand TVA déjà active
- **WHEN** `tva_active` est true
- **THEN** la barre seuil TVA est masquée (inutile si déjà assujetti)

#### Scenario: Couleurs d'alerte
- **WHEN** le CA représente moins de 75% du seuil TVA
- **THEN** la barre est bleue

#### Scenario: Alerte approche seuil
- **WHEN** le CA représente 75% à 89% du seuil TVA
- **THEN** la barre est orange

#### Scenario: Alerte seuil critique
- **WHEN** le CA représente 90% ou plus du seuil TVA
- **THEN** la barre est rouge

### Requirement: Exposition de seuil_tva dans les stats dashboard
Le système SHALL inclure `seuil_tva` et `tva_active` dans la réponse de GET `/api/dashboard/stats`.

#### Scenario: Données TVA dans stats
- **WHEN** le frontend appelle GET `/api/dashboard/stats`
- **THEN** la réponse inclut `seuil_tva` et `tva_active`
