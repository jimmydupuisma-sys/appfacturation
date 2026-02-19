## Context

electron-builder v25 rate `call-bind-apply-helpers` lors du packaging — c'est un bug de son resolver de dépendances transitives. La chaîne fautive : `pdfkit → fontkit → ... → get-intrinsic 1.3.x → get-proto → dunder-proto → call-bind-apply-helpers`. La version 1.3.x de `get-intrinsic` a introduit `get-proto` et `dunder-proto` comme nouvelles dépendances (2024). Les versions 1.2.x n'en ont pas besoin.

## Goals / Non-Goals

**Goals:**
- Éliminer `call-bind-apply-helpers` de l'arbre de dépendances en forçant `get-intrinsic ^1.2.4`
- Fix applicable en une ligne dans `package.json`

**Non-Goals:**
- Corriger le bug dans electron-builder upstream
- Changer l'architecture du build (esbuild bundling reste en place)

## Decisions

**`overrides` npm (choix retenu) vs alternatives :**

| Approche | Verdict |
|---|---|
| `overrides: { "get-intrinsic": "^1.2.4" }` | ✅ Ciblé, une ligne, rétro-compatible |
| Bundler pdfkit avec esbuild | ❌ Risque de casser les polices PDF (`__dirname` relocalisé) |
| Ajouter `call-bind-apply-helpers` en dep directe | ❌ Déjà essayé (v1.0.4), electron-builder le prune quand même |
| `asar: true` + asarUnpack | ⚠️ Plus complexe, risque sql.js WASM |

`get-intrinsic` 1.2.x est API-compatible avec 1.3.x pour tous ses consommateurs (call-bind, side-channel, set-function-name, etc.). Aucune fonctionnalité 1.3.x n'est utilisée par les dépendances de ce projet.

## Risks / Trade-offs

- **[Risque]** Un package futur pourrait nécessiter get-intrinsic 1.3.x → **Mitigation** : l'override peut être retiré si npm signale un conflit, ou mis à jour vers `^1.3.x` une fois le bug electron-builder corrigé.
- **[Risque]** Incompatibilité subtile de get-intrinsic 1.2.x avec un package → **Mitigation** : l'API publique est identique, les tests locaux valident le comportement.
