## Context

L'application utilise Tailwind CSS avec `darkMode: 'class'`. Les couleurs d'accent sont actuellement hardcodées en classes `sky-*` dans ~13 fichiers JSX (~64 occurrences). Un système de thèmes existe implicitement via `DarkModeContext` + classe `.dark` sur `<html>`. Les fonds sombres structurels sont en valeurs hex littérales (`#0a0c10`, `#1a2236`, etc.).

## Goals / Non-Goals

**Goals:**
- Permettre de changer la couleur d'accent (5 thèmes prédéfinis)
- Permettre de changer la police de l'interface (10 options Google Fonts)
- Persistance des préférences en localStorage
- Zéro modification backend

**Non-Goals:**
- Personnalisation couleur libre (picker hex) — thèmes prédéfinis uniquement
- Changer les couleurs structurelles sombres par thème
- Appliquer le thème aux PDFs générés
- Couleur différente par mode clair/sombre

## Decisions

### D1 : CSS variables pour les couleurs d'accent
Tailwind génère du CSS au build. Pour permettre un changement de couleur au runtime, on introduit des CSS variables sur `:root` et on configure Tailwind pour les référencer via `rgb(var(--accent-X) / <alpha-value>)`.

**Alternative écartée :** Injecter des overrides CSS par thème (ex. `[data-theme="violet"] .bg-sky-500 { ... }`). Fonctionne sans refactoring JSX mais fragile — toute nouvelle utilisation de `sky-*` "escaperait" le thème.

**Choix retenu :** Renommer toutes les classes `sky-*` en `accent-*` dans les JSX (refactoring one-shot, ~64 occurrences). Propre et pérenne.

### D2 : 5 thèmes couleur
```
sky      → #0ea5e9 (défaut actuel)
violet   → #8b5cf6
emerald  → #10b981
rose     → #f43f5e
amber    → #f59e0b
```
Appliqué via `document.documentElement.setAttribute('data-theme', theme)`.

### D3 : Chargement dynamique des polices
Charger les 10 polices au démarrage dans `index.html` serait lourd (~300KB+). On injecte dynamiquement une `<link>` Google Fonts uniquement pour la police active au démarrage et lors du changement.

**Polices proposées :** Inter, Poppins, DM Sans, Nunito, Raleway, IBM Plex Sans, Lora (défaut), Playfair Display, Merriweather, Source Serif 4.

Police appliquée via `document.documentElement.style.setProperty('--font-body', fontName)` + CSS `body { font-family: var(--font-body, 'Lora'), Georgia, serif; }`.

### D4 : ThemeContext séparé de DarkModeContext
Crée `frontend/src/contexts/Theme.jsx` pour gérer thème+police indépendamment du mode sombre. Les deux contextes coexistent dans `main.jsx`.

### D5 : UI dans Paramètres (section Apparence)
Pas de nouvelle route/page. La section Apparence est ajoutée en bas de `Parametres.jsx` après la section Banque, cohérent avec l'usage existant de cette page pour les préférences.

## Risks / Trade-offs

- **Rename sky→accent** : 13 fichiers à modifier. Risque d'oubli → mitigation : grep final pour vérifier l'absence de `sky-` dans les JSX après.
- **Google Fonts en Electron** : l'app tourne hors ligne possible. → mitigation : fallback défini (`Georgia, serif` ou `sans-serif`) pour chaque police. Si la police ne charge pas, le fallback s'applique silencieusement.
- **CSS variables dans Tailwind** : la syntaxe `rgb(var(--x) / <alpha>)` ne fonctionne qu'avec Tailwind v3+. L'app est déjà sur v3. ✓

## Migration Plan

1. Ajouter les CSS variables dans `index.css`
2. Mettre à jour `tailwind.config.js` (couleur `accent` + supprimer mapping `aubergine`)
3. Renommer globalement `sky-` → `accent-` dans tous les JSX
4. Créer `ThemeContext` + wrapper `ThemeProvider`
5. Brancher `ThemeProvider` dans `main.jsx`
6. Ajouter la section Apparence dans `Parametres.jsx`
7. Vérification : grep `sky-` dans src/ → doit retourner zéro résultat dans les JSX

Rollback : revenir en arrière sur les fichiers modifiés, supprimer les variables CSS ajoutées. Pas de migration de données (localStorage uniquement).
