## 1. Script d'installation

- [x] 1.1 Créer `scripts/Installer.command` avec le script shell (xattr + cp + open)
- [x] 1.2 Rendre le script exécutable (`chmod +x`)

## 2. Configuration electron-builder

- [x] 2.1 Ajouter la config `dmg.contents` dans `package.json` pour inclure `Installer.command` dans le DMG
- [x] 2.2 Vérifier que le script est bien copié lors du build (`npm run build:electron`)

## 3. Vérification

- [x] 3.1 Rebuilder le DMG (`npm run build:electron`)
- [x] 3.2 Monter le DMG et vérifier que `Installer.command` est présent
- [ ] 3.3 Tester le script sur macOS (double-clic → Terminal → app installée et lancée)
