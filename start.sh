#!/bin/bash

# Script de lancement de App Facturation
cd "$(dirname "$0")"

echo "Lancement de App Facturation..."
echo ""

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo "Installation des dépendances..."
    npm run setup
    echo ""
fi

# Lancer l'application
npm start
