## Why

Quand des amis téléchargent l'app depuis internet, macOS Gatekeeper bloque le lancement avec un message alarmant ("peut contenir logiciel malveillant") car l'app n'est pas signée par Apple. Même le contournement manuel (clic droit → Ouvrir) est insuffisant sur les versions récentes de macOS. Un script d'installation inclus dans le DMG permet de retirer l'attribut quarantine automatiquement, offrant une expérience d'installation simple et moins intimidante.

## What Changes

- Ajout d'un script shell `Installer.command` dans le DMG
- Le script retire l'attribut quarantine de l'app (`xattr -dr com.apple.quarantine`)
- Le script copie l'app dans `/Applications`
- Le script lance l'app après installation
- Configuration `electron-builder` mise à jour pour inclure le script dans le DMG avec une mise en page claire

## Capabilities

### New Capabilities

- `dmg-installer`: Script d'installation inclus dans le DMG qui automatise le retrait du quarantine et l'installation dans /Applications

### Modified Capabilities

## Impact

- `package.json` : config `build.mac.dmg` à ajouter pour personnaliser le contenu du DMG
- Nouveau fichier `scripts/Installer.command` à créer
- Aucune dépendance externe, aucun changement fonctionnel à l'app elle-même
- Compatible macOS Ventura (13), Sonoma (14), Sequoia (15), Intel et Apple Silicon
