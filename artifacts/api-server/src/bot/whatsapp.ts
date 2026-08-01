import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { logger } from "../lib/logger.js";
import { botState } from "./store.js";
import { handleMessage } from "./commands/index.js";

export const AUTH_DIR = join(process.cwd(), ".baileys_auth");

let currentSock: WASocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;

function attachMessageHandler(sock: WASocket) {
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    logger.info({ type, count: messages.length }, "📨 messages.upsert received");

    for (const msg of messages) {
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        "";
      logger.info(
        { from: msg.key.remoteJid, fromMe: msg.key.fromMe, type, text: text.slice(0, 80) },
        "📩 raw message"
      );

      // Accept both "notify" (new msg) and "append" (e.g. from linked-device sync)
      if (type !== "notify" && type !== "append") continue;

      try {
        await handleMessage(sock, msg);
      } catch (err) {
        logger.error({ err }, "Error handling message");
      }
    }
  });
}

function attachConnectionHandler(sock: WASocket, saveCreds: () => Promise<void>) {
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      reconnectAttempts = 0;
      botState.isConnected = true;
      logger.info({ user: sock.user?.id }, "✅ WhatsApp connected!");
    } else if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const isLoggedOut =
        statusCode === DisconnectReason.loggedOut ||
        statusCode === DisconnectReason.multideviceMismatch;

      botState.isConnected = false;

      if (isLoggedOut) {
        logger.warn({ statusCode }, "WhatsApp logged out — session cleared");
        currentSock = null;
        botState.sock = null;
        await rm(AUTH_DIR, { recursive: true, force: true });
      } else if (reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        const delay = Math.min(5000 * reconnectAttempts, 60_000);
        logger.info({ attempt: reconnectAttempts, delayMs: delay }, "Scheduling reconnect...");
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => connectToWhatsApp(), delay);
      } else {
        logger.error("Max reconnect attempts reached. Use /pair on Telegram to re-link.");
        currentSock = null;
        botState.sock = null;
      }
    }
  });
}

/** Reconnect using an existing saved session. */
export async function connectToWhatsApp(): Promise<WASocket> {
  await mkdir(AUTH_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  if (currentSock) {
    try { currentSock.end(undefined); } catch {}
    currentSock = null;
  }

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 30_000,
    keepAliveIntervalMs: 15_000,
    retryRequestDelayMs: 250,
    markOnlineOnConnect: true,
    syncFullHistory: false,
  });

  currentSock = sock;
  botState.sock = sock;

  attachConnectionHandler(sock, saveCreds);
  attachMessageHandler(sock);

  return sock;
}

/**
 * Pair WhatsApp via pairing code.
 *
 * Flow:
 *  1. Clear any old session.
 *  2. Create a fresh socket (Ubuntu/Chrome, no QR).
 *  3. Wait 3 s for the WS handshake to complete.
 *  4. Call requestPairingCode() — must happen BEFORE Baileys QR timeout (~20 s).
 *  5. Return the code to Telegram. Socket stays alive and becomes the bot socket.
 */
export async function requestPairingCode(phoneNumber: string): Promise<string> {
  const cleaned = phoneNumber.replace(/[^0-9]/g, "");
  if (!cleaned || cleaned.length < 7) {
    throw new Error("Invalid phone number. Example: 254743760083");
  }

  if (botState.isConnected && botState.sock?.authState.creds.registered) {
    throw new Error("WhatsApp is already linked. Use /status to check.");
  }

  // Always start fresh
  await rm(AUTH_DIR, { recursive: true, force: true });
  await mkdir(AUTH_DIR, { recursive: true });

  if (currentSock) {
    try { currentSock.end(undefined); } catch {}
    currentSock = null;
    botState.sock = null;
  }

  logger.info({ phone: cleaned }, "Creating socket for pairing...");

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 30_000,
    keepAliveIntervalMs: 15_000,
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  currentSock = sock;
  botState.sock = sock;

  // Wire up persistence and reconnect logic on this socket
  attachConnectionHandler(sock, saveCreds);
  attachMessageHandler(sock);

  // Wait for WS handshake — MUST call requestPairingCode before QR timeout (~20 s)
  await new Promise(r => setTimeout(r, 3000));

  if (sock.authState.creds.registered) {
    throw new Error("Already registered — use /status.");
  }

  logger.info("Requesting pairing code from WhatsApp...");
  const code = await sock.requestPairingCode(cleaned);

  logger.info({ code }, "Pairing code obtained");
  return code;
}

export function getConnectionStatus() {
  return {
    isConnected: botState.isConnected,
    user: botState.sock?.user,
  };
}
