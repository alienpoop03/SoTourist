#!/bin/bash

# Trova l'IP locale (Wi-Fi, tipicamente en0)
ip=$(ipconfig getifaddr en0)
if [ -z "$ip" ]; then
  ip=$(ipconfig getifaddr en1)
fi

echo "IP locale rilevato: $ip"

PROJ_DIR="$HOME/Desktop/Uni/Web e Mobile/Progetto-PWM/SoTourist"

# Apri VS Code
open -a "Visual Studio Code" "$PROJ_DIR"

# Backend
osascript -e 'tell application "Terminal" to do script "cd \"'"$PROJ_DIR"'/Back-End\" && node index.js"'

# Frontend
osascript -e 'tell application "Terminal" to do script "cd \"'"$PROJ_DIR"'/Front-End\" && ionic serve --host='"$ip"' --no-open"'

# Browser
sleep 8
open "http://$ip:8100"