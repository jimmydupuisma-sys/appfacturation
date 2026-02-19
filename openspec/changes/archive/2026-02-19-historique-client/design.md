## Context

L'app est une Electron app avec un serveur Express embarqué (`electron/main.js`) et un frontend React/Vite. La DB est sql.js (SQLite in-memory, persistée sur disque). Les données clients, factures et devis existent déjà avec des relations `client_id`. Il n'existe pas encore de vue agrégée par client.

## Goals / Non-Goals

**Goals:**
- Page `/clients/:id` avec stats CA et listes factures/devis
- Endpoint API unique qui retourne tout l'historique d'un client
- Accès PDF direct depuis l'historique
- Action "convertir devis en facture" accessible depuis la page
- Navigation fluide (bouton retour vers liste, bouton "nouvelle facture" pré-rempli)

**Non-Goals:**
- Statut payé/impayé sur les factures (pas dans le modèle de données actuel)
- Timeline chronologique mixte factures+devis (tableau séparé suffit)
- Export CSV par client

## Decisions

**1. Page dédiée vs drawer latéral**
Page dédiée `/clients/:id` — les deux tableaux (factures + devis) plus le graphe CA par année nécessitent de l'espace. Un drawer serait trop cramped. Permet aussi un accès direct par URL.

**2. Endpoint unique `GET /api/clients/:id/historique`**
Retourne en une requête : infos client, stats (ca_total, ca_annee, nb_factures, nb_devis), ca_par_annee[], factures[], devis[]. Évite les appels multiples depuis la page.

**3. CA par année — barre de progression simple**
Pas de recharts ici : une liste `année → montant → barre CSS` suffit et reste cohérente avec le design minimaliste. Chaque barre est relative au max des années.

**4. Conversion devis→facture**
Bouton `[→ Facture]` sur les devis dont le statut est `accepté` ou `en attente`. Redirige vers `/factures` avec un état pré-rempli (client + lignes du devis). Implémenté via `useNavigate` + state React Router.

**5. "Nouvelle facture" pré-remplie**
Même mécanique : `navigate('/factures', { state: { client_id: id } })`. La page Factures ouvre le modal si elle reçoit ce state.

## Risks / Trade-offs

- [Conversion devis→facture nécessite de modifier Factures.jsx pour lire le state de navigation] → Vérifier que ça n'interfère pas avec le flux normal d'ouverture du modal
- [Performance sur clients avec beaucoup de factures] → Pas de pagination pour l'instant (auto-entrepreneur = volume faible)

## Open Questions

- Faut-il afficher les lignes détaillées de chaque facture dans l'historique, ou juste le total ? → Non, total suffit (accès PDF pour le détail)
