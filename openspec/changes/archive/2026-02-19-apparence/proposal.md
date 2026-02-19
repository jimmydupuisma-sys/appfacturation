## Why

L'application est distribuée à d'autres utilisateurs qui ont des préférences visuelles différentes. Offrir une personnalisation de la couleur d'accent et de la police améliore l'appropriation du logiciel sans impacter les fonctionnalités métier.

## What Changes

- Remplacement de toutes les classes Tailwind `sky-*` par une couleur sémantique `accent-*` basée sur des CSS variables
- Ajout de 5 thèmes de couleur prédéfinis : Sky (défaut), Violet, Emerald, Rose, Amber
- Ajout de 10 polices sélectionnables via Google Fonts (chargées dynamiquement)
- Nouveau contexte React `ThemeContext` gérant thème et police, persistés en localStorage
- Nouvelle section "Apparence" dans la page Paramètres existante

## Capabilities

### New Capabilities
- `theme-system`: Système de thèmes d'accent couleur (5 presets) et de polices (10 options) appliqués dynamiquement via CSS variables et `data-theme` sur `<html>`, persistés en localStorage

### Modified Capabilities
- `parametres`: Ajout d'une section Apparence dans la page Paramètres existante pour accéder aux réglages de thème et police

## Impact

- `frontend/src/index.css` : ajout des CSS variables pour chaque thème
- `frontend/tailwind.config.js` : remplacement du mapping `aubergine` par `accent` avec CSS variables
- `frontend/index.html` : chargement dynamique des polices Google Fonts
- `frontend/src/contexts/` : nouveau fichier `Theme.jsx`
- `frontend/src/main.jsx` : ajout du `ThemeProvider`
- `frontend/src/pages/Parametres.jsx` : nouvelle section Apparence
- `frontend/src/components/Sidebar.jsx` + tous les JSX utilisant `sky-*` : rename vers `accent-*`
- Aucune modification backend, aucune rupture API
