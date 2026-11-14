# Legend Jan Messenger Bot

A Facebook Messenger bot built on Node.js. The bot code lives in the `bot/` folder.

## Before you start

1. Get your Facebook session file (`appstate.json`) and place it at `bot/appstate.json`.
   Never commit this file to GitHub. It is listed in `.gitignore`, but anyone who has it can use your account.
2. If you want the `زيد` assistant, add your OpenAI key to `bot/.env` as `OPENAI_API_KEY`.
   The install scripts create `bot/.env` from `bot/.env.example` automatically.

## Android (Termux)

Install Termux from F-Droid (the Play Store version is outdated), then run:

```
pkg install -y git
git clone <your-repo-url> legend-jan-bot
cd legend-jan-bot
bash install-termux.sh
bash start-termux.sh
```

## Kali Linux

```
git clone <your-repo-url> legend-jan-bot
cd legend-jan-bot
bash install-kali.sh
bash start-kali.sh
```

## Windows 10 / 11

Install Git for Windows if you do not have it, then in Command Prompt:

```
git clone <your-repo-url> legend-jan-bot
cd legend-jan-bot
install-windows.bat
start-windows.bat
```

The Windows installer uses `winget` to install Node.js, FFmpeg, yt-dlp and Deno if they are missing.
If it installed something new, close the window and open a new one before starting the bot.

## Where data is stored

- `bot/appstate.json`: Facebook session (never committed).
- `bot/data/`: JSON state (YouTube on/off, newspaper, Zed) and pinned-image cache.
- `bot/tmp/`: temporary audio files, removed after each song.

## Configuration

Edit `bot/.env`. See `bot/.env.example` for all options:

- `PORT`: port for the status page (default 3000).
- `OPENAI_API_KEY`: needed for the `زيد` command.
- `YTDLP_BIN`, `DENO_BIN`: full paths to yt-dlp and Deno if they are not on your PATH.

## Limitations

- Pinned group images are kept in memory only, as documented in `.agents/memory/pinned-group-images.md`. They are not restored after the bot restarts.
- The `يوت` command needs FFmpeg, yt-dlp and Deno on the system. YouTube changes often; keep yt-dlp updated.
- The bot must stay running to respond. On Android, keep Termux open (the start script requests a wake lock).
- The install scripts were written for Termux, Kali Linux and Windows 10/11. Only the Linux dependency install and the bot's tests were run during development; test the scripts on your own device before relying on them.
