#!/usr/bin/env bash
# Installs everything the bot needs on Kali Linux (or Debian-based systems). Run with: bash install-kali.sh
set -euo pipefail

cd "$(dirname "$0")"

if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
else
  SUDO="sudo"
fi

echo "[1/4] Installing system packages..."
$SUDO apt-get update
$SUDO apt-get install -y nodejs npm ffmpeg yt-dlp python3 git build-essential
$SUDO apt-get install -y deno || echo "Warning: deno is not available from apt. The YouTube command may fail without it."

NODE_MAJOR=$(node -p "process.versions.major")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node.js 18 or newer is required. Found version $(node -v). Install a newer Node.js and run this again."
  exit 1
fi

echo "[2/4] Installing bot dependencies..."
cd bot
npm install --no-fund --no-audit

echo "[3/4] Preparing configuration..."
[ -f .env ] || cp .env.example .env
mkdir -p data

echo "[4/4] Checking tools..."
ffmpeg -version | head -n 1
yt-dlp --version || echo "Warning: yt-dlp is not working."

echo ""
echo "Installation finished."
echo "Next: put your Facebook session in bot/appstate.json, then run: bash start-kali.sh"
