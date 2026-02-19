## ADDED Requirements

### Requirement: Page TVA avec déclarations trimestrielles
Le système SHALL fournir une page `/tva` affichant les 4 trimestres de l'année sélectionnée, avec pour chaque trimestre : le montant collecté (calculé), le montant versé (éditable) et le statut (payé/impayé).

#### Scenario: Affichage des trimestres
- **WHEN** l'utilisateur accède à la page TVA
- **THEN** les 4 trimestres sont affichés avec montant collecté, versé, statut et solde

#### Scenario: Calcul montant collecté par trimestre
- **WHEN** le backend calcule le montant collecté pour un trimestre
- **THEN** il somme (quantite * prix_unitaire * taux_tva / 100) des factures du trimestre dont la date_emission >= tva_date_debut

#### Scenario: Saisie d'un paiement TVA
- **WHEN** l'utilisateur saisit un montant versé et clique sur "Enregistrer"
- **THEN** la déclaration est sauvegardée avec le montant versé et le statut

#### Scenario: Sélection d'année
- **WHEN** l'utilisateur change l'année sélectionnée
- **THEN** les trimestres de la nouvelle année sont affichés

### Requirement: Routes backend TVA
Le système SHALL exposer `GET /api/tva/:annee` retournant les 4 trimestres avec montants calculés et déclarations existantes, et `POST /api/tva` pour upsert une déclaration.

#### Scenario: GET /api/tva/:annee
- **WHEN** le frontend appelle GET /api/tva/2026
- **THEN** le backend retourne un tableau de 4 objets {trimestre, annee, montant_collecte, montant_verse, statut, ...}

#### Scenario: POST /api/tva
- **WHEN** le frontend envoie {trimestre, annee, montant_verse, statut, date_paiement}
- **THEN** la déclaration est créée ou mise à jour (upsert)

### Requirement: Carte TVA dashboard mise à jour
Le système SHALL mettre à jour la carte TVA du dashboard pour afficher collectée (filtrée par date_debut) / versée (somme des paiements) / reste à reverser.

#### Scenario: Carte TVA avec versements
- **WHEN** des déclarations TVA ont été marquées payées
- **THEN** le dashboard affiche TVA collectée, TVA versée, et le solde restant
