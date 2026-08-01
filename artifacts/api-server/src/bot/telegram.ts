import { Telegraf, type Context } from "telegraf";
import { logger } from "../lib/logger.js";
import { requestPairingCode, getConnectionStatus } from "./whatsapp.js";
import { botState } from "./store.js";

let bot: Telegraf | null = null;

const WELCOME = `
🤖 *KANDALA MINI BOT* — Telegram Control Panel

Welcome! Use this bot to link your WhatsApp account.

📋 *Commands:*
/start — Show this menu
/pair <number> — Link WhatsApp with pairing code
/status — Check WhatsApp connection
/help — Show all commands

💡 *Example:*
/pair 254743760083
`;

export function startTelegramBot() {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) {
    logger.warn("TELEGRAM_BOT_TOKEN not set — Telegram bot disabled");
    return;
  }

  bot = new Telegraf(token);

  bot.start((ctx: Context) => {
    ctx.replyWithMarkdown(WELCOME);
  });

  bot.help((ctx: Context) => {
    ctx.replyWithMarkdown(WELCOME);
  });

  bot.command("status", (ctx: Context) => {
    const { isConnected, user } = getConnectionStatus();
    if (isConnected && user) {
      ctx.reply(
        `✅ *WhatsApp Connected!*\n\n👤 Name: ${user.name ?? "N/A"}\n📱 Number: +${user.id.split(":")[0]}`,
        { parse_mode: "Markdown" }
      );
    } else {
      ctx.reply(
        "❌ *WhatsApp Not Connected*\n\nUse /pair <your_number> to link.",
        { parse_mode: "Markdown" }
      );
    }
  });

  bot.command("pair", async (ctx: Context) => {
    const { isConnected } = getConnectionStatus();
    if (isConnected) {
      ctx.reply("✅ WhatsApp is already connected! Use /status to see details.");
      return;
    }

    const args = (ctx.message as any)?.text?.split(" ") ?? [];
    const phone = args[1];

    if (!phone || !/^\d{7,15}$/.test(phone.replace(/[+\-\s]/g, ""))) {
      ctx.reply(
        "❌ Please provide a valid phone number.\n\nExample: /pair 254743760083",
        { parse_mode: "Markdown" }
      );
      return;
    }

    ctx.reply("⏳ Generating WhatsApp pairing code...");

    try {
      const code = await requestPairingCode(phone);
      const formatted = code.match(/.{1,4}/g)?.join("-") ?? code;
      ctx.replyWithMarkdown(
        `✅ *Your WhatsApp Pairing Code:*\n\n` +
        `\`${formatted}\`\n\n` +
        `📱 *Steps to link:*\n` +
        `1. Open WhatsApp on your phone\n` +
        `2. Go to *Settings → Linked Devices*\n` +
        `3. Tap *Link a Device*\n` +
        `4. Choose *Link with phone number*\n` +
        `5. Enter the code above\n\n` +
        `⏰ Code expires in 60 seconds. Use /status to verify.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      ctx.reply(`❌ Failed to generate pairing code.\n\nError: ${msg}`);
    }
  });

  bot.catch((err, ctx: Context) => {
    logger.error({ err }, "Telegram bot error");
    ctx.reply("❌ An error occurred. Please try again.").catch(() => {});
  });

  bot.launch().then(() => {
    logger.info("✅ Telegram bot is running");
  }).catch((err) => {
    logger.error({ err }, "Failed to start Telegram bot");
  });

  // Graceful shutdown
  process.once("SIGINT", () => bot?.stop("SIGINT"));
  process.once("SIGTERM", () => bot?.stop("SIGTERM"));

  return bot;
}
