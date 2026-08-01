import { existsSync } from "node:fs";
import { join } from "node:path";
import { logger } from "../lib/logger.js";
import { connectToWhatsApp } from "./whatsapp.js";
import { startTelegramBot } from "./telegram.js";

const AUTH_CREDS = join(process.cwd(), ".baileys_auth", "creds.json");

export async function startBot() {
  logger.info("🚀 Starting KANDALA MINI BOT...");

  // Start Telegram control panel first — always needed
  startTelegramBot();

  // Only auto-connect WhatsApp if a saved session exists.
  // If no session, user must send /pair on Telegram to link.
  if (existsSync(AUTH_CREDS)) {
    logger.info("Found existing WhatsApp session — reconnecting...");
    try {
      await connectToWhatsApp();
    } catch (err) {
      logger.error({ err }, "Failed to restore WhatsApp session");
    }
  } else {
    logger.info("No WhatsApp session found. Send /pair <number> on Telegram to link.");
  }
}
