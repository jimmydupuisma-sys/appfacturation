## ADDED Requirements

### Requirement: Page d'aide accessible depuis la sidebar
Le système SHALL exposer une page `/aide` accessible via un lien dans la sidebar principale (icône d'aide, label "Aide"), positionnée en bas de la liste de navigation avant le toggle mode sombre.

#### Scenario: Accès à la page d'aide
- **WHEN** l'utilisateur clique sur "Aide" dans la sidebar
- **THEN** la route `/aide` est affichée avec la page de documentation

#### Scenario: Lien actif dans la sidebar
- **WHEN** l'utilisateur est sur la route `/aide`
- **THEN** l'entrée "Aide" dans la sidebar est visuellement active (même style que les autres entrées actives)

### Requirement: Navigation par sections dans la page d'aide
La page SHALL afficher une navigation latérale sticky listant toutes les sections de documentation. La section visible à l'écran SHALL être mise en surbrillance dans la navigation.

#### Scenario: Navigation vers une section
- **WHEN** l'utilisateur clique sur une entrée de la navigation doc
- **THEN** la page défile vers la section correspondante

#### Scenario: Mise en surbrillance au scroll
- **WHEN** l'utilisateur fait défiler la page et qu'une section entre dans la zone visible
- **THEN** l'entrée correspondante dans la navigation doc est mise en surbrillance

### Requirement: Sections de documentation avec screenshots
La page SHALL couvrir les sections suivantes, chacune avec un titre, un screenshot PNG de la page correspondante et une description des fonctionnalités clés :
- Introduction (présentation générale)
- Dashboard
- Clients
- Prestations
- Devis
- Factures
- URSSAF
- TVA
- Paramètres

#### Scenario: Affichage d'un screenshot
- **WHEN** la section est affichée
- **THEN** le screenshot PNG correspondant est visible en pleine largeur dans la zone de contenu

#### Scenario: Screenshot manquant
- **WHEN** le fichier PNG d'une section n'existe pas encore
- **THEN** un placeholder visuel est affiché à la place (pas d'image cassée)
