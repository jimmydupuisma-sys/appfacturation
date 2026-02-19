## Context

L'app tourne dans Electron avec un serveur Express embarqué dans `electron/main.js`. La DB est sql.js (in-memory, sauvegardée sur disque). Les paramètres sont dans la table `parametres` (id=1). Le frontend React sert `frontend/dist` (rebuild nécessaire après chaque modif). Les PDF sont générés avec pdfkit dans `electron/main.js`.

## Goals / Non-Goals

**Goals:**
- Toggle TVA activable/désactivable sans perte de données
- Quand TVA active : factures affichent HT + TVA + TTC, PDF mis à jour
- Quand TVA inactive : comportement identique à aujourd'hui
- Barre seuil TVA sur le dashboard (alerte avant de franchir le seuil)
- Les factures existantes ne sont pas modifiées

**Non-Goals:**
- Calcul rétroactif de TVA sur les factures passées
- Gestion de TVA par taux différents par ligne
- Déclaration de TVA automatique
- Modification de la table `factures` (pas de colonne tva stockée)

## Decisions

**TVA calculée à la volée, non stockée par facture**
Le taux TVA est global dans `parametres`. On calcule `total_ht * taux_tva / 100` à l'affichage et dans le PDF. Pas de migration lourde, pas de colonne dans `factures`. Si le taux change, les anciens PDFs peuvent être regénérés avec le nouveau taux — acceptable pour un micro-entrepreneur.

**`tva_active` comme INTEGER (0/1) dans SQLite**
sql.js ne supporte pas BOOLEAN natif. On stocke 0/1, on convertit en booléen dans le code.

**Barre seuil TVA distincte de la barre CA**
Deux composants séparés (`SeuilCABar` existant, nouveau `SeuilTVABar`). La barre TVA est visible seulement quand TVA non encore active (inutile de montrer le seuil si on est déjà assujetti). Couleurs identiques : bleu < 75%, orange ≥ 75%, rouge ≥ 90%.

**Mention légale PDF dynamique**
- TVA inactive → "TVA non applicable, art. 293 B du CGI" (existant)
- TVA active → tableau HT + TVA + TTC, pas de mention 293B

## Risks / Trade-offs

- Le taux TVA est global : si un utilisateur change de taux en cours d'année, les PDFs regénérés refléteront le nouveau taux. Acceptable pour la cible (micro-entrepreneur solo).
- sql.js : pas de `ALTER TABLE` avec valeurs par défaut complexes — on utilise le pattern try/catch existant.
