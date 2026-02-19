## 1. Base de données

- [x] 1.1 Ajouter la colonne `seuil_ca REAL DEFAULT 77700` dans la table `parametres` via migration au démarrage dans `database.js`

## 2. Backend — Paramètres

- [x] 2.1 Exposer `seuil_ca` dans la route GET `/api/parametres`
- [x] 2.2 Sauvegarder `seuil_ca` dans la route PUT `/api/parametres`

## 3. Backend — Dashboard

- [x] 3.1 Inclure `seuil_ca` dans la réponse de GET `/api/dashboard/stats`

## 4. Frontend — Paramètres

- [x] 4.1 Ajouter un champ numérique "Seuil de CA (€)" dans `Parametres.jsx`, lié à `seuil_ca`

## 5. Frontend — Dashboard

- [x] 5.1 Créer le composant `SeuilCABar` dans `Dashboard.jsx` (barre de progression + label CA / seuil)
- [x] 5.2 Appliquer la couleur selon le niveau : bleu <75%, orange ≥75%, rouge ≥90%
- [x] 5.3 Masquer le composant si `seuil_ca` est 0 ou absent
- [x] 5.4 Intégrer `SeuilCABar` dans le rendu du Dashboard sous les StatCards
