## Context

Les routes PDF existent déjà (`/api/factures/:id/pdf` et `/api/devis/:id/pdf`) et retournent `Content-Disposition: inline`. Le frontend utilise `Modal` comme composant de modale existant. Les pages `Factures.jsx` et `Devis.jsx` ont déjà le bouton `Download` de lucide-react.

## Goals / Non-Goals

**Goals:**
- Afficher le PDF dans une modale via `<iframe>`
- Bouton "Télécharger" qui force le download
- Fonctionne dans Electron (webview iframe)

**Non-Goals:**
- Génération PDF côté frontend
- Zoom, rotation ou annotations
- Partage par email depuis la modale

## Decisions

**iframe pointant vers la route PDF existante**
La route retourne déjà le PDF en `inline`. L'iframe l'affiche nativement sans librairie. Aucun changement backend.

**Bouton télécharger = `<a href download>`**
Pour forcer le téléchargement depuis la modale, on utilise un lien `<a>` avec l'attribut `download`. La route PDF répond aussi avec `Content-Disposition: inline` — le navigateur/Electron gère le download via `download` attribute.

**Modale plein écran (large)**
Le PDF nécessite de l'espace. On utilise une modale `max-w-4xl` avec hauteur fixe `h-[80vh]` pour l'iframe.

**Composant inline dans chaque page**
Pas de composant séparé — on ajoute directement l'état `previewUrl` + modale dans `Factures.jsx` et `Devis.jsx`. Simple, pas de surarchitecture.
