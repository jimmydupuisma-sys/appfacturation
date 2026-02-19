## ADDED Requirements

### Requirement: Page historique client
Le système SHALL fournir une page dédiée `/clients/:id` affichant l'historique complet d'un client : stats CA, évolution annuelle, factures et devis.

#### Scenario: Accès depuis la liste clients
- **WHEN** l'utilisateur clique sur le bouton historique d'un client
- **THEN** le système navigue vers `/clients/:id`

#### Scenario: Affichage des stats
- **WHEN** la page charge
- **THEN** le système affiche : CA total (toutes années), CA année en cours, nombre de factures, nombre de devis

#### Scenario: Évolution CA par année
- **WHEN** le client a des factures sur plusieurs années
- **THEN** le système affiche une barre de progression par année, chaque barre étant relative à l'année au CA maximum

#### Scenario: Liste des factures
- **WHEN** la page charge
- **THEN** le système affiche toutes les factures du client triées par date décroissante, avec numéro, date, montant et bouton aperçu PDF

#### Scenario: Liste des devis
- **WHEN** la page charge
- **THEN** le système affiche tous les devis du client triés par date décroissante, avec numéro, date, montant et statut

#### Scenario: Conversion devis en facture
- **WHEN** l'utilisateur clique sur "→ Facture" sur un devis
- **THEN** le système navigue vers `/factures` avec le modal de création pré-rempli (client + lignes du devis)

#### Scenario: Nouvelle facture pré-remplie
- **WHEN** l'utilisateur clique sur "Nouvelle facture" depuis la page historique
- **THEN** le système navigue vers `/factures` avec le modal de création pré-rempli avec ce client

### Requirement: Endpoint API historique client
Le système SHALL exposer `GET /api/clients/:id/historique` retournant toutes les données agrégées d'un client en une seule requête.

#### Scenario: Données retournées
- **WHEN** une requête GET est faite sur `/api/clients/:id/historique`
- **THEN** le système retourne : client (infos), stats (ca_total, ca_annee, nb_factures, nb_devis), ca_par_annee[], factures[], devis[]

#### Scenario: Client inexistant
- **WHEN** l'id ne correspond à aucun client
- **THEN** le système retourne une erreur 404
