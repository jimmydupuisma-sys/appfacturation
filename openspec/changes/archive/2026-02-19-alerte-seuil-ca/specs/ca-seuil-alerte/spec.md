## ADDED Requirements

### Requirement: Affichage barre de progression CA vs seuil
Le Dashboard SHALL afficher une barre de progression indiquant le pourcentage du CA annuel par rapport au seuil micro-entreprise configuré.

#### Scenario: CA inférieur à 75% du seuil
- **WHEN** le CA annuel est inférieur à 75% du seuil configuré
- **THEN** la barre de progression est affichée en bleu/vert avec le pourcentage et les montants

#### Scenario: CA entre 75% et 90% du seuil
- **WHEN** le CA annuel est compris entre 75% et 90% du seuil configuré
- **THEN** la barre de progression est affichée en orange avec un message d'avertissement

#### Scenario: CA supérieur ou égal à 90% du seuil
- **WHEN** le CA annuel est supérieur ou égal à 90% du seuil configuré
- **THEN** la barre de progression est affichée en rouge avec un message d'alerte critique

#### Scenario: Seuil non configuré ou à zéro
- **WHEN** le seuil configuré est 0 ou absent
- **THEN** la barre de progression n'est pas affichée

### Requirement: Données de seuil exposées par le Dashboard
L'API `/api/dashboard/stats` SHALL retourner le `seuil_ca` configuré en plus des stats existantes.

#### Scenario: Seuil présent dans les paramètres
- **WHEN** la route `/api/dashboard/stats` est appelée
- **THEN** la réponse inclut un champ `seuil_ca` avec la valeur configurée
