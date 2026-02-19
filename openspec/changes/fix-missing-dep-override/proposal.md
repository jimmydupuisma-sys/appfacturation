## Why

electron-builder rate `call-bind-apply-helpers` lors du packaging Windows : cette dépendance transitive de `pdfkit` (via fontkit → get-intrinsic 1.3.x → dunder-proto) n'est jamais incluse dans `resources/app/node_modules`, causant un crash au lancement de l'app packagée.

## What Changes

- Ajouter un champ `overrides` dans `package.json` pour forcer `get-intrinsic` à rester en version `^1.2.4` sur tout l'arbre de dépendances
- Bumper la version à `1.0.9`
- Régénérer `package-lock.json` en local après l'ajout

## Capabilities

### New Capabilities
- Aucune

### Modified Capabilities
- Aucune (changement purement infrastructure/build)

## Impact

- `package.json` : ajout du champ `overrides`
- `package-lock.json` : à régénérer (`npm install`) après la modification
- Toutes les dépendances transitives utilisant `get-intrinsic` seront forcées en 1.2.x → `dunder-proto`, `get-proto`, `call-bind-apply-helpers` ne seront plus installés
