#!/data/data/com.termux/files/usr/bin/bash
# Starts the bot inside Termux. Run with: bash start-termux.sh
cd "$(dirname "$0")/bot" || exit 1

if [ ! -d node_modules ]; then
  echo "Dependencies are missing. Run: bash install-termux.sh"
  exit 1
fi

if [ ! -f appstate.json ]; then
  echo "Warning: bot/appstate.json is missing. The bot cannot log in to Messenger without it."
fi

# Keeps Android from suspending Termux while the bot runs.
if command -v termux-wake-lock >/dev/null 2>&1; then
  termux-wake-lock
fi

exec node index.js
