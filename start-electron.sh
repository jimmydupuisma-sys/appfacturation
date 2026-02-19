#!/bin/bash
cd "$(dirname "$0")"

# Tuer les anciens processus
pkill -f "electron.*app-facturation" 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

# Lancer Electron
npx electron . &
