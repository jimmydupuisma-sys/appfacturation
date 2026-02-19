#!/bin/bash
cd "$(dirname "$0")"

# Tuer l'ancien serveur s'il existe
pkill -f "node.*backend/src/index.js" 2>/dev/null

# Lancer le backend
node backend/src/index.js &
SERVER_PID=$!

# Attendre que le serveur démarre
sleep 2

# Ouvrir dans le navigateur
open http://localhost:3001

# Attendre la fermeture
wait $SERVER_PID
