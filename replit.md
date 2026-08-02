# KANDALA MINI BOT

A WhatsApp bot with a Telegram control panel. Link your WhatsApp via Telegram, then control the bot with `.` prefixed commands in any chat or group.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API + bot server
- `pnpm run typecheck` — full typecheck across all packages

## Required Environment Variables

- `TELEGRAM_BOT_TOKEN` — from [@BotFather](https://t.me/BotFather) on Telegram. Used to control WhatsApp linking.
- `OPENAI_API_KEY` *(optional)* — enables the `.ai` / `.gpt` commands.

## How to Link WhatsApp

1. Set `TELEGRAM_BOT_TOKEN` and restart the server
2. Open your Telegram bot and send `/pair 254XXXXXXXXX` (your number in international format)
3. Enter the 8-digit code in WhatsApp → Linked Devices → Link with phone number
4. Send `/status` to confirm connection

## Bot Commands (prefix: `.`)

| Category | Commands |
|---|---|
| General | `.menu`, `.alive`, `.ping`, `.owner` |
| Media | `.sticker`, `.toimg`, `.tts [text]` |
| Download | `.ytmp3 [url]`, `.ytmp4 [url]` |
| AI | `.ai [question]`, `.gpt [question]` |
| Group | `.tagall`, `.kick`, `.add`, `.promote`, `.demote`, `.antilink on/off`, `.grouplink`, `.revoke`, `.open`, `.close` |
| Fun | `.joke`, `.fact`, `.quote`, `.roast` |
| Info | `.weather [city]`, `.wiki [query]`, `.calc [expr]`, `.define [word]`, `.translate [lang] [text]` |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- WhatsApp: @whiskeysockets/baileys
- Telegram: telegraf
- AI: openai (gpt-4o-mini)
- Media: sharp, ffmpeg-static, @distube/ytdl-core
- API: Express 5

## Where things live

- `artifacts/api-server/src/bot/` — all bot logic
- `artifacts/api-server/src/bot/commands/` — individual command handlers
- `artifacts/api-server/src/bot/whatsapp.ts` — WhatsApp connection + pairing
- `artifacts/api-server/src/bot/telegram.ts` — Telegram control panel
- `.baileys_auth/` — WhatsApp session (auto-created, gitignored)

## User preferences

- Owner number: 254743760083

## Gotchas

- Bot auto-reconnects on disconnect (up to 10 attempts with exponential backoff)
- WhatsApp session persists in `.baileys_auth/` — restart won't require re-pairing
- The `.sticker` command requires ffmpeg (bundled via ffmpeg-static)
- Anti-link state is in-memory only — resets on restart
