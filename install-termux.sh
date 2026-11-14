#!/data/data/com.termux/files/usr/bin/bash
# Installs everything the bot needs inside Termux. Run with: bash install-termux.sh
set -e

if [ -z "$PREFIX" ] || [ ! -d "$PREFIX/bin" ]; then
  echo "This script must be run inside Termux."
  exit 1
fi

cd "$(dirname "$0")"

echo "[1/4] Updating Termux packages..."
pkg update -y
pkg upgrade -y

echo "[2/4] Installing Node.js, FFmpeg, Python and yt-dlp..."
pkg install -y nodejs-lts ffmpeg python git
pkg install -y yt-dlp || echo "Warning: yt-dlp could not be installed. The YouTube command will not work until it is."
pkg install -y deno || echo "Warning: deno could not be installed. The YouTube command may fail without it."

NODE_MAJOR=$(node -p "process.versions.major")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node.js 18 or newer is required. Found version $(node -v)."
  exit 1
fi

echo "[3/4] Installing bot dependencies..."
cd bot
npm install --no-fund --no-audit

echo "[4/4] Preparing configuration..."
[ -f .env ] || cp .env.example .env
mkdir -p data

echo ""
echo "Installation finished."
echo "Next: put your Facebook session in bot/appstate.json, then run: bash start-termux.sh"
