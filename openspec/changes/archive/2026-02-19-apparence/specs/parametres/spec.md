## ADDED Requirements

### Requirement: Section Apparence dans les Paramètres
Le système SHALL afficher une section "Apparence" dans la page Paramètres existante, permettant la sélection du thème couleur et de la police. Cette section SHALL être positionnée après les sections métier existantes (Banque).

#### Scenario: Affichage des options de thème
- **WHEN** l'utilisateur accède à la page Paramètres
- **THEN** une section "Apparence" est visible avec les 5 swatches de couleur et les 10 options de police

#### Scenario: Thème actif visuellement identifié
- **WHEN** un thème est actif
- **THEN** le swatch correspondant est visuellement marqué comme sélectionné (bordure ou indicateur)

#### Scenario: Police active visuellement identifiée
- **WHEN** une police est active
- **THEN** l'option de police correspondante est visuellement marquée comme sélectionnée

#### Scenario: Prévisualisation des polices
- **WHEN** les options de police sont affichées
- **THEN** chaque option est rendue dans sa propre police pour permettre la comparaison visuelle
