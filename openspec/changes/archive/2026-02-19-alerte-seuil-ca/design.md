## Context

L'app stocke le CA dans SQLite et l'expose via `/api/dashboard/stats`. La table `parametres` contient déjà les infos de configuration de l'auto-entrepreneur (taux URSSAF, SIRET, etc.). Le Dashboard affiche déjà le CA annuel via une `StatCard`.

## Goals / Non-Goals

**Goals:**
- Afficher une barre de progression CA vs seuil sur le Dashboard
- Permettre de configurer le seuil dans les Paramètres
- Alertes visuelles selon le niveau (≥75% = orange, ≥90% = rouge)

**Non-Goals:**
- Gestion multi-seuils (TVA, RSI...) — hors scope
- Notifications push / email
- Calcul automatique selon le type d'activité déclaré à l'URSSAF

## Decisions

**D1 — Stocker le seuil en base plutôt qu'en dur**
Le seuil varie selon l'activité (77 700 € services, 188 700 € commerce) et peut être révisé par la loi. On ajoute une colonne `seuil_ca` dans `parametres` avec une valeur par défaut de 77 700.

**D2 — Exposer le seuil via `/api/dashboard/stats`**
Le Dashboard fait déjà un seul appel à cette route. On y ajoute `seuil_ca` pour éviter un second fetch.

**D3 — Composant `SeuilCABar` autonome dans Dashboard.jsx**
Pas de nouveau fichier, on ajoute le composant directement dans Dashboard.jsx pour garder la cohérence avec les autres composants de la page.

**D4 — Migration SQL inline dans database.js**
Ajout de la colonne via `ALTER TABLE IF NOT EXISTS` au démarrage pour ne pas casser les bases existantes.

## Risks / Trade-offs

- [Seuil obsolète] Si la loi change le plafond, l'utilisateur doit le mettre à jour manuellement → Mitigation : valeur éditable dans Paramètres + note explicative dans l'UI
- [Migration DB] L'`ALTER TABLE` peut échouer si la colonne existe déjà → Mitigation : utiliser `try/catch` ou vérifier l'existence avant d'ajouter
