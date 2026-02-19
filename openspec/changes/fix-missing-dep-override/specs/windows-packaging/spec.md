## ADDED Requirements

### Requirement: App Windows se lance sans erreur de module manquant
L'application packagée pour Windows SHALL démarrer sans l'erreur `Cannot find module 'call-bind-apply-helpers'` ni toute autre erreur de dépendance transitive manquante.

#### Scenario: Lancement normal sur Windows
- **WHEN** l'utilisateur installe et lance l'app via le Setup .exe
- **THEN** la fenêtre Electron s'ouvre sans dialog d'erreur JavaScript

#### Scenario: Aucune régression des dépendances
- **WHEN** `npm install` est exécuté après l'ajout de l'override
- **THEN** aucun package ne signale de conflit de version dans la console
