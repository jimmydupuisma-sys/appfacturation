## ADDED Requirements

### Requirement: Script d'installation dans le DMG
Le DMG SHALL inclure un fichier `Installer.command` exécutable qui automatise l'installation de l'app en retirant l'attribut quarantine macOS et en copiant l'app dans /Applications.

#### Scenario: Lancement du script depuis le DMG
- **WHEN** l'utilisateur double-clique sur `Installer.command` dans le DMG monté
- **THEN** Terminal s'ouvre et exécute le script

#### Scenario: Retrait du quarantine
- **WHEN** le script s'exécute
- **THEN** l'attribut `com.apple.quarantine` est retiré récursivement de `App Facturation.app`

#### Scenario: Copie dans Applications
- **WHEN** le quarantine a été retiré
- **THEN** l'app est copiée dans `/Applications/`

#### Scenario: Lancement automatique après installation
- **WHEN** la copie est terminée
- **THEN** l'app se lance automatiquement depuis `/Applications/`

### Requirement: Compatibilité macOS multi-versions
Le script SHALL fonctionner sur macOS Ventura (13), Sonoma (14) et Sequoia (15), sur architectures Intel et Apple Silicon.

#### Scenario: Exécution sur macOS Sequoia Apple Silicon
- **WHEN** le script est exécuté sur macOS 15 avec puce Apple Silicon
- **THEN** l'installation se déroule sans erreur

#### Scenario: Exécution sur macOS Ventura Intel
- **WHEN** le script est exécuté sur macOS 13 avec puce Intel
- **THEN** l'installation se déroule sans erreur

### Requirement: Chemin relatif au DMG
Le script SHALL localiser `App Facturation.app` relativement à son propre emplacement, indépendamment du point de montage du DMG.

#### Scenario: DMG monté à un emplacement non standard
- **WHEN** le DMG est monté dans un répertoire autre que `/Volumes/`
- **THEN** le script trouve et installe correctement l'app
