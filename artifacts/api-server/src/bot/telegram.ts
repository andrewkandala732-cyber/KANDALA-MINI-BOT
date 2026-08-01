import { Telegraf, type Context } from "telegraf";
import { logger } from "../lib/logger.js";
import { requestPairingCode, getConnectionStatus, AUTH_DIR } from "./whatsapp.js";
import { rm } from "node:fs/promises";

let bot: Telegraf | null = null;

const WELCOME = `
🤖 *KANDALA MINI BOT* — Telegram Control

Send me a command to link your WhatsApp:

📋 *Commands:*
/start — Show this menu
/pair \\<number\\> — Link WhatsApp
/status — Check connection
/unpair — Unlink WhatsApp
/help — Show commands

💡 *Example:*
\`/pair 254743760083\`
`;

export function startTelegramBot() {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) {
    logger.warn("TELEGRAM_BOT_TOKEN not set — Telegram bot disabled");
    return;
  }

  bot = new Telegraf(token);

  bot.start((ctx: Context) => ctx.replyWithMarkdown(WELCOME));
  bot.help((ctx: Context) => ctx.replyWithMarkdown(WELCOME));

  bot.command("status", async (ctx: Context) => {
    const { isConnected, user } = getConnectionStatus();
    if (isConnected && user) {
      await ctx.reply(
        `✅ *WhatsApp Connected*\n\n👤 Name: ${user.name ?? "N/A"}\n📱 Number: +${user.id.split(":")[0]}`,
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply(
        "❌ *Not Connected*\n\nUse /pair <number> to link your WhatsApp.",
        { parse_mode: "Markdown" }
      );
    }
  });

  bot.command("unpair", async (ctx: Context) => {
    await rm(AUTH_DIR, { recursive: true, force: true });
    await ctx.reply("✅ WhatsApp unlinked. Use /pair to link again.");
  });

  bot.command("pair", async (ctx: Context) => {
    const { isConnected } = getConnectionStatus();
    if (isConnected) {
      await ctx.reply("✅ Already connected! Use /status to see details.\nSend /unpair first if you want to re-link.");
      return;
    }

    const text = (ctx.message as any)?.text ?? "";
    const phone = text.split(/\s+/)[1];

    if (!phone || !/^\+?\d{7,15}$/.test(phone)) {
      await ctx.reply(
        "❌ Please provide your phone number in international format.\n\nExample: `/pair 254743760083`",
        { parse_mode: "Markdown" }
      );
      return;
    }

    await ctx.reply("⏳ Connecting to WhatsApp... please wait ~5 seconds.");

    try {
      const code = await requestPairingCode(phone);
      // Format as XXXX-XXXX
      const formatted = code.replace(/(.{4})(.{4})/, "$1-$2");

      await ctx.replyWithMarkdown(
        `✅ *Your Pairing Code:*\n\n` +
        `\`${formatted}\`\n\n` +
        `📱 *How to enter it:*\n` +
        `1. Open WhatsApp on your phone\n` +
        `2. Tap ⋮ *Menu* → *Linked Devices*\n` +
        `3. Tap *Link a Device*\n` +
        `4. Tap *Link with phone number instead*\n` +
        `5. Enter: \`${formatted}\`\n\n` +
        `⏰ Code expires in ~60 seconds.\n` +
        `After entering, wait a few seconds then send /status`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err }, "Pairing code error");
      await ctx.reply(
        `❌ *Pairing failed*\n\nError: ${msg}\n\nPlease try again with /pair`,
        { parse_mode: "Markdown" }
      );
    }
  });

  bot.catch((err, ctx: Context) => {
    logger.error({ err }, "Telegram bot error");
    ctx.reply("❌ An error occurred. Please try again.").catch(() => {});
  });

  bot
    .launch()
    .then(() => logger.info("✅ Telegram bot running"))
    .catch((err) => logger.error({ err }, "Telegram bot failed to start"));

  process.once("SIGINT", () => bot?.stop("SIGINT"));
  process.once("SIGTERM", () => bot?.stop("SIGTERM"));
}
