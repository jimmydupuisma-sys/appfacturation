#!/bin/bash

# Installer.command — App Facturation
# Double-cliquez sur ce fichier pour installer App Facturation.
# Terminal va s'ouvrir brièvement, puis l'app se lancera automatiquement.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="App Facturation.app"
APP_SRC="$SCRIPT_DIR/$APP_NAME"
APP_DEST="/Applications/$APP_NAME"

echo "Installation de App Facturation..."

# Retirer l'attribut quarantine (nécessaire pour éviter le blocage macOS)
xattr -dr com.apple.quarantine "$APP_SRC" 2>/dev/null || true

# Copier dans /Applications (demande le mot de passe admin si nécessaire)
if [ -d "$APP_DEST" ]; then
  echo "Mise à jour de l'installation existante..."
  sudo rm -rf "$APP_DEST"
fi

sudo cp -R "$APP_SRC" /Applications/

echo "Installation terminée. Lancement de l'app..."
open "$APP_DEST"
