#!/usr/bin/env bash
# Starts the bot on Kali Linux. Run with: bash start-kali.sh
set -euo pipefail

cd "$(dirname "$0")/bot"

if [ ! -d node_modules ]; then
  echo "Dependencies are missing. Run: bash install-kali.sh"
  exit 1
fi

if [ ! -f appstate.json ]; then
  echo "Warning: bot/appstate.json is missing. The bot cannot log in to Messenger without it."
fi

exec node index.js
