import { logger } from "../lib/logger.js";
import { connectToWhatsApp } from "./whatsapp.js";
import { startTelegramBot } from "./telegram.js";

export async function startBot() {
  logger.info("🚀 Starting KANDALA MINI BOT...");

  // Start Telegram control panel
  startTelegramBot();

  // Connect to WhatsApp (will use saved session if available)
  try {
    await connectToWhatsApp();
  } catch (err) {
    logger.error({ err }, "Failed to connect to WhatsApp on startup");
  }
}
