# KANDALA MINI BOT

A WhatsApp bot paired via Telegram. Link your WhatsApp using the Telegram control panel, then use all commands directly on WhatsApp.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the bot server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required env: `TELEGRAM_BOT_TOKEN` — from @BotFather on Telegram
- Optional env: `OPENAI_API_KEY` — enables .ai / .gpt commands

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- WhatsApp: @whiskeysockets/baileys (pairing code auth)
- Telegram: Telegraf
- AI: OpenAI API
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/bot/` — all bot logic
- `artifacts/api-server/src/bot/telegram.ts` — Telegram control panel bot
- `artifacts/api-server/src/bot/whatsapp.ts` — WhatsApp (Baileys) connection
- `artifacts/api-server/src/bot/commands/` — all command handlers
- `.baileys_auth/` — WhatsApp session (auto-created, do not delete while bot is linked)

## How to Link WhatsApp

1. Go to your Telegram bot (created via @BotFather)
2. Send: `/pair 254743760083` (use your actual WhatsApp number)
3. Copy the 8-character code returned
4. Open WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number
5. Enter the code → Done!

## WhatsApp Commands (prefix: `.`)

| Command | Description |
|---------|-------------|
| .menu | Show all commands |
| .alive | Bot status |
| .ping | Check bot speed |
| .owner | Owner info |
| .sticker | Image/video → sticker |
| .toimg | Sticker → image |
| .tts [text] | Text to speech |
| .ytmp3 [url] | YouTube audio |
| .ytmp4 [url] | YouTube video |
| .ai [question] | AI chat |
| .gpt [question] | GPT chat |
| .tagall | Tag all group members |
| .kick @user | Kick from group |
| .add [number] | Add to group |
| .promote @user | Make admin |
| .demote @user | Remove admin |
| .antilink on/off | Anti-link protection |
| .grouplink | Get group invite link |
| .joke | Random joke |
| .fact | Random fact |
| .quote | Random quote |
| .roast | Random roast |
| .weather [city] | Weather info |
| .wiki [query] | Wikipedia summary |
| .calc [expr] | Calculator |
| .define [word] | Dictionary |
| .translate [lang] [text] | Translate text |

## Architecture decisions

- WhatsApp session stored in `.baileys_auth/` using Baileys `useMultiFileAuthState`
- Telegram bot is the control panel; WhatsApp handles all user commands
- Commands use the `.` prefix (e.g. `.menu`, `.sticker`)
- All Baileys/native packages externalized from esbuild bundle
- Anti-link groups stored in memory (reset on restart; re-enable with `.antilink on`)

## User preferences

- Owner number: 254743760083
- Bot name: KANDALA MINI BOT
- Command prefix: `.`
