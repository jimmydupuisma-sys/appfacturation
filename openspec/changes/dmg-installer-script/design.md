## Context

L'app est distribuée via un DMG non signé (electron-builder, config `mac.target: dmg`). Sur macOS, tout fichier téléchargé depuis internet reçoit l'attribut étendu `com.apple.quarantine`. Gatekeeper vérifie cet attribut au lancement et bloque les apps non signées avec un dialogue alarmant qui n'offre pas de bouton "Ouvrir".

La commande `xattr -dr com.apple.quarantine <app>` retire cet attribut récursivement. Si exécutée avant le premier lancement, Gatekeeper ne bloque plus.

La clé : un fichier `.command` (script shell) déclenche lui aussi un dialogue Gatekeeper, mais beaucoup moins alarmant — il affiche "Ouvrir quand même ?" avec un bouton clair, contrairement à l'app qui n'offre que "Mettre à la corbeille".

## Goals / Non-Goals

**Goals:**
- Créer `scripts/Installer.command` : retire le quarantine, copie dans /Applications, lance l'app
- Inclure ce script dans le DMG via la config electron-builder
- Fonctionner sur macOS 13, 14, 15 (Intel et Apple Silicon)
- L'utilisateur n'a qu'une seule action à faire : double-cliquer le script

**Non-Goals:**
- Signer ou notariser l'app (nécessite Apple Developer Program à 99$/an)
- Supporter Windows (déjà géré séparément via NSIS)
- Mise à jour automatique de l'app après installation initiale

## Decisions

**Script `.command` plutôt qu'un `.sh` ou un `.app` custom**
→ Les fichiers `.command` s'ouvrent nativement dans Terminal sur double-clic, sans configuration supplémentaire. `.sh` ne s'ouvre pas par défaut. Un `.app` custom serait aussi bloqué par Gatekeeper.

**Chemin relatif pour trouver l'app dans le DMG**
→ Le script utilise `$(cd "$(dirname "$0")" && pwd)` pour résoudre son propre emplacement. Ainsi peu importe où le DMG est monté, le chemin vers l'app est correct.

**Copie dans `/Applications` via `cp -R`**
→ Simple, sans dépendance. L'alternative `ditto` préserve mieux les métadonnées mais `cp -R` suffit ici. On retire le quarantine AVANT la copie pour que l'app installée soit propre.

**Vérification si l'app est déjà ouverte**
→ Non implémenté — trop de complexité pour le cas d'usage (amis, pas production).

## Risks / Trade-offs

- [L'utilisateur refuse le dialogue du script] → Documenter clairement dans le DMG (texte sur le fond) que le script est sûr
- [L'app est déjà dans /Applications] → `cp -R` écrase silencieusement — acceptable pour une mise à jour
- [Droits insuffisants sur /Applications] → Le script demande le mot de passe admin via `sudo` si nécessaire. Ajouter `sudo cp -R` et `sudo xattr`.
- [macOS change le comportement des .command] → Risque faible, la mécanique xattr est stable depuis des années

## Migration Plan

1. Créer `scripts/Installer.command` avec les permissions exécutables (`chmod +x`)
2. Ajouter la config `dmg.contents` dans `package.json` pour inclure le script
3. Rebuilder le DMG et tester sur macOS (idéalement Sequoia)
4. Distribuer le nouveau DMG aux amis
