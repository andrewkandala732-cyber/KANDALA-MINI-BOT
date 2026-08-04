/**
 * Telegram control panel — pure native-fetch long-poll implementation.
 * No telegraf / node-fetch dependency; works on Node 18+ out of the box.
 */
import { logger } from "../lib/logger.js";
import { requestPairingCode, getConnectionStatus, AUTH_DIR } from "./whatsapp.js";
import { rm } from "node:fs/promises";

const WELCOME =
  `🤖 *KANDALA MINI BOT* — Telegram Control\n\n` +
  `Send me a command to link your WhatsApp:\n\n` +
  `📋 *Commands:*\n` +
  `/start — Show this menu\n` +
  `/pair <number> — Link WhatsApp\n` +
  `/status — Check connection\n` +
  `/unpair — Unlink WhatsApp\n` +
  `/help — Show commands\n\n` +
  `💡 *Example:*\n` +
  "`/pair 254743760083`";

// ── Telegram Bot API helpers ──────────────────────────────────────────────────

let TOKEN: string;
let running = false;
let offset = 0;

async function tgApi(method: string, body: Record<string, unknown> = {}): Promise<unknown> {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json() as { ok: boolean; result: unknown; description?: string };
  if (!data.ok) throw new Error(`Telegram API ${method}: ${data.description ?? "unknown error"}`);
  return data.result;
}

async function sendMessage(chatId: number, text: string, extra: Record<string, unknown> = {}) {
  return tgApi("sendMessage", { chat_id: chatId, text, parse_mode: "Markdown", ...extra });
}

// ── Command handlers ──────────────────────────────────────────────────────────

async function handleUpdate(update: Record<string, unknown>) {
  const msg = update["message"] as Record<string, unknown> | undefined;
  if (!msg) return;

  const chatId = (msg["chat"] as Record<string, unknown>)?.["id"] as number;
  const text = ((msg["text"] as string) ?? "").trim();
  if (!chatId || !text) return;

  const [cmd, ...rest] = text.split(/\s+/);
  const command = cmd?.replace(/@.*$/, "").toLowerCase(); // strip @botname suffix

  try {
    if (command === "/start" || command === "/help") {
      await sendMessage(chatId, WELCOME);

    } else if (command === "/status") {
      const { isConnected, user } = getConnectionStatus();
      if (isConnected && user) {
        await sendMessage(chatId,
          `✅ *WhatsApp Connected*\n\n` +
          `👤 Name: ${user.name ?? "N/A"}\n` +
          `📱 Number: +${user.id.split(":")[0]}`
        );
      } else {
        await sendMessage(chatId, "❌ *Not Connected*\n\nUse /pair <number> to link your WhatsApp.");
      }

    } else if (command === "/unpair") {
      await rm(AUTH_DIR, { recursive: true, force: true });
      await sendMessage(chatId, "✅ WhatsApp unlinked. Use /pair to link again.");

    } else if (command === "/pair") {
      const { isConnected } = getConnectionStatus();
      if (isConnected) {
        await sendMessage(chatId, "✅ Already connected\\! Use /status to see details.\nSend /unpair first if you want to re-link.");
        return;
      }
      const phone = rest[0];
      if (!phone || !/^\+?\d{7,15}$/.test(phone)) {
        await sendMessage(chatId,
          "❌ Please provide your phone number in international format.\n\n" +
          "Example: `/pair 254743760083`"
        );
        return;
      }
      await sendMessage(chatId, "⏳ Connecting to WhatsApp... please wait \\~5 seconds\\.");
      try {
        const code = await requestPairingCode(phone);
        const formatted = code.replace(/(.{4})(.{4})/, "$1-$2");
        await sendMessage(chatId,
          `✅ *Your Pairing Code:*\n\n` +
          `\`${formatted}\`\n\n` +
          `📱 *How to enter it:*\n` +
          `1\\. Open WhatsApp on your phone\n` +
          `2\\. Tap ⋮ *Menu* → *Linked Devices*\n` +
          `3\\. Tap *Link a Device*\n` +
          `4\\. Tap *Link with phone number instead*\n` +
          `5\\. Enter: \`${formatted}\`\n\n` +
          `⏰ Code expires in \\~60 seconds\\.\n` +
          `After entering, wait a few seconds then send /status`
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.error({ err }, "Pairing code error");
        await sendMessage(chatId,
          `❌ *Pairing failed*\n\nError: ${errMsg}\n\nPlease try again with /pair`
        );
      }
    }
  } catch (err) {
    logger.error({ err, chatId, command }, "Telegram command error");
    try { await sendMessage(chatId, "❌ An error occurred. Please try again."); } catch {}
  }
}

// ── Long-poll loop ────────────────────────────────────────────────────────────

async function pollLoop() {
  logger.info("✅ Telegram bot polling started");
  while (running) {
    try {
      const updates = await tgApi("getUpdates", {
        offset,
        timeout: 25,
        allowed_updates: ["message"],
      }) as Array<Record<string, unknown>>;

      for (const update of updates) {
        const id = update["update_id"] as number;
        if (id >= offset) offset = id + 1;
        handleUpdate(update).catch(err => logger.error({ err }, "Error handling update"));
      }
    } catch (err) {
      logger.error({ err }, "Telegram polling error — retrying in 5s");
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  logger.info("Telegram bot stopped");
}

// ── Public API ────────────────────────────────────────────────────────────────

export function startTelegramBot() {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) {
    logger.warn("TELEGRAM_BOT_TOKEN not set — Telegram bot disabled");
    return;
  }
  TOKEN = token;
  running = true;
  pollLoop().catch(err => logger.error({ err }, "Telegram poll loop crashed"));

  process.once("SIGINT", () => { running = false; });
  process.once("SIGTERM", () => { running = false; });
}
