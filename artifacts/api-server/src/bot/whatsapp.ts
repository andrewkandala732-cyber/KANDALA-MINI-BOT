import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { logger } from "../lib/logger.js";
import { botState } from "./store.js";
import { handleMessage } from "./commands/index.js";

const AUTH_DIR = join(process.cwd(), ".baileys_auth");

let onPairingCodeCallback: ((code: string) => void) | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;

export async function connectToWhatsApp(): Promise<WASocket> {
  await mkdir(AUTH_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["KANDALA MINI BOT", "Chrome", "1.0.0"],
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
    keepAliveIntervalMs: 10_000,
    markOnlineOnConnect: true,
  });

  botState.sock = sock;

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      if (isLoggedOut) {
        logger.warn("WhatsApp logged out. Session cleared.");
        botState.isConnected = false;
        botState.sock = null;
      } else if (reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        logger.info({ attempt: reconnectAttempts }, "Reconnecting to WhatsApp...");
        setTimeout(() => connectToWhatsApp(), 5000 * reconnectAttempts);
      } else {
        logger.error("Max reconnect attempts reached.");
        botState.isConnected = false;
      }
    } else if (connection === "open") {
      reconnectAttempts = 0;
      botState.isConnected = true;
      logger.info({ user: sock.user?.id }, "✅ WhatsApp connected!");
    } else if (connection === "connecting") {
      logger.info("Connecting to WhatsApp...");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      try {
        await handleMessage(sock, msg);
      } catch (err) {
        logger.error({ err }, "Error handling WhatsApp message");
      }
    }
  });

  return sock;
}

export async function requestPairingCode(phoneNumber: string): Promise<string> {
  if (!botState.sock) {
    await connectToWhatsApp();
    await new Promise(r => setTimeout(r, 3000));
  }

  const sock = botState.sock;
  if (!sock) throw new Error("WhatsApp socket not available");
  if (sock.authState.creds.registered) throw new Error("WhatsApp is already linked");

  const cleaned = phoneNumber.replace(/[^0-9]/g, "");
  const code = await sock.requestPairingCode(cleaned);
  return code;
}

export function getConnectionStatus() {
  return {
    isConnected: botState.isConnected,
    user: botState.sock?.user,
  };
}
