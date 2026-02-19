# App Facturation

Application de gestion de factures pour auto-entrepreneur.

## Installation

### Prérequis

- Node.js 18+ (https://nodejs.org)

### Installation des dépendances

```bash
cd app-facturation
npm install
npm run setup
```

## Lancement

```bash
npm start
```

Ou double-cliquez sur `start.sh`

L'application sera accessible sur **http://localhost:5173**

## Fonctionnalités

- **Dashboard** : Vue d'ensemble du CA, graphiques mensuels
- **Clients** : Gestion de votre base clients
- **Prestations** : Catalogue de vos services avec tarifs
- **Devis** : Création, suivi, conversion en facture
- **Factures** : Génération de factures PDF
- **URSSAF** : Suivi mensuel des versements
- **Paramètres** : Configuration de vos informations (SIRET, adresse, IBAN...)

## Structure

```
app-facturation/
├── backend/          # API Node.js + Express
├── frontend/         # Interface React + Vite
├── data/             # Base de données SQLite
└── start.sh          # Script de lancement
```

## Données

Vos données sont stockées localement dans `data/facturation.db`.

Pour sauvegarder vos données, copiez simplement ce fichier.
