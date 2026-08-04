import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  downloadMediaMessage,
  type WASocket,
  type WAMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { logger } from "../lib/logger.js";
import { botState } from "./store.js";
import { handleMessage, handleGroupParticipantUpdate } from "./commands/index.js";
import { resolveBioText } from "./commands/settings.js";

export const AUTH_DIR = join(process.cwd(), ".baileys_auth");

let currentSock: WASocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;
let bioBeatTimer: NodeJS.Timeout | null = null;

// ── Deleted message cache (for anti-delete) ───────────────────────────────────
const msgCache = new Map<string, WAMessage>();
const MSG_CACHE_MAX = 500;

function cacheMessage(msg: WAMessage) {
  if (!msg.key.id) return;
  msgCache.set(msg.key.id, msg);
  if (msgCache.size > MSG_CACHE_MAX) {
    const firstKey = msgCache.keys().next().value;
    if (firstKey) msgCache.delete(firstKey);
  }
}

// ── Auto-bio heartbeat ────────────────────────────────────────────────────────
function startBioBeat(sock: WASocket) {
  if (bioBeatTimer) clearInterval(bioBeatTimer);
  bioBeatTimer = setInterval(async () => {
    if (!botState.botSettings.autoBio || !botState.botSettings.autoBioText) return;
    try {
      await sock.updateProfileStatus(resolveBioText(botState.botSettings.autoBioText));
    } catch {}
  }, 60_000);
}

// ── Presence heartbeat (always-online) ───────────────────────────────────────
let presenceBeatTimer: NodeJS.Timeout | null = null;
function startPresenceBeat(sock: WASocket) {
  if (presenceBeatTimer) clearInterval(presenceBeatTimer);
  presenceBeatTimer = setInterval(async () => {
    if (!botState.botSettings.alwaysOnline) return;
    try { await sock.sendPresenceUpdate("available"); } catch {}
  }, 30_000);
}

// ── Event attachment ──────────────────────────────────────────────────────────
function attachHandlers(sock: WASocket) {
  // ── Group participant events ────────────────────────────────────────────────
  sock.ev.on("group-participants.update", async (update) => {
    try { await handleGroupParticipantUpdate(sock, update); } catch (err) {
      logger.error({ err }, "Error in group-participants.update");
    }
  });

  // ── Anti-call ──────────────────────────────────────────────────────────────
  sock.ev.on("call", async (calls) => {
    for (const call of calls) {
      if (!botState.botSettings.antiCall) continue;
      if (call.status !== "offer") continue;
      try {
        await sock.rejectCall(call.id, call.from);
        await sock.sendMessage(call.from, {
          text: botState.botSettings.antiCallMessage,
        });
        logger.info({ from: call.from }, "📵 Call rejected (anti-call)");
      } catch (err) {
        logger.error({ err }, "Error rejecting call");
      }
    }
  });

  // ── Main messages handler ──────────────────────────────────────────────────
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    for (const msg of messages) {
      if (!msg.message) continue;
      const jid = msg.key.remoteJid!;
      if (!jid) continue;

      // Cache all messages for anti-delete
      cacheMessage(msg);

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption || "";

      logger.info(
        { from: jid, fromMe: msg.key.fromMe, type, text: text.slice(0, 80) },
        "📩 raw message"
      );

      if (type !== "notify" && type !== "append") continue;
      if (msg.key.fromMe) continue;

      const senderJid = msg.key.participant ?? msg.key.remoteJid ?? "";
      const isOwner = senderJid.includes(botState.ownerJid.split("@")[0]!);

      // ── Ignore list ──────────────────────────────────────────────────────────
      if (botState.botSettings.ignoreList.includes(senderJid)) continue;

      // ── Anti-bug: filter known crash messages ────────────────────────────────
      if (botState.botSettings.antiBug) {
        const bugPatterns = [
          /\u0000/,          // null byte
          /[\uFFFE\uFFFF]/,  // BOM surrogates
        ];
        if (bugPatterns.some(p => p.test(text))) {
          logger.warn({ from: jid }, "🛡️ Bug message blocked");
          continue;
        }
      }

      // ── Auto read ────────────────────────────────────────────────────────────
      if (botState.botSettings.autoRead) {
        try { await sock.readMessages([msg.key]); } catch {}
      }

      // ── Auto record / typing presence ────────────────────────────────────────
      if (botState.botSettings.autoRecord) {
        try { await sock.sendPresenceUpdate("recording", jid); } catch {}
      } else if (botState.botSettings.autoRecordTyping) {
        try { await sock.sendPresenceUpdate("composing", jid); } catch {}
      }

      // ── Always online: refresh presence ──────────────────────────────────────
      if (botState.botSettings.alwaysOnline) {
        try { await sock.sendPresenceUpdate("available"); } catch {}
      }

      // ── Auto react ───────────────────────────────────────────────────────────
      if (botState.botSettings.autoReact && msg.key.id) {
        try {
          await sock.sendMessage(jid, {
            react: { text: botState.botSettings.autoReactEmoji, key: msg.key },
          });
        } catch {}
      }

      // ── Anti view-once: re-send to owner as normal media ─────────────────────
      if (botState.botSettings.antiViewOnce) {
        const voImg = msg.message?.imageMessage;
        const voVid = msg.message?.videoMessage;
        const isVO = voImg?.viewOnce || voVid?.viewOnce;
        if (isVO) {
          try {
            const buffer = await downloadMediaMessage(msg, "buffer", {}) as Buffer;
            const ownerJid = botState.ownerJid;
            if (voImg) {
              await sock.sendMessage(ownerJid, {
                image: buffer, caption: `👁️ *Anti View Once*\nFrom: @${senderJid.split("@")[0]}`,
              });
            } else if (voVid) {
              await sock.sendMessage(ownerJid, {
                video: buffer, mimetype: "video/mp4", caption: `👁️ *Anti View Once*\nFrom: @${senderJid.split("@")[0]}`,
              });
            }
          } catch {}
        }
      }

      // ── Auto block (private mode, non-owner DMs) ─────────────────────────────
      if (
        botState.botSettings.autoblock &&
        botState.botSettings.mode === "private" &&
        !isOwner &&
        !jid.endsWith("@g.us")
      ) {
        try { await sock.updateBlockStatus(senderJid, "block"); } catch {}
        continue;
      }

      // ── Command handler ──────────────────────────────────────────────────────
      try {
        await handleMessage(sock, msg);
      } catch (err) {
        logger.error({ err }, "Error handling message");
      }
    }
  });

  // ── Anti-delete ────────────────────────────────────────────────────────────
  sock.ev.on("messages.delete", async (item) => {
    if (!botState.botSettings.antiDelete) return;
    if (!("keys" in item)) return;
    for (const key of item.keys) {
      if (!key.id) continue;
      const cached = msgCache.get(key.id);
      if (!cached || !cached.message) continue;
      const jid = cached.key.remoteJid!;
      const from = cached.key.participant ?? cached.key.remoteJid ?? "";
      try {
        const text =
          cached.message.conversation ||
          cached.message.extendedTextMessage?.text || "";
        const imgMsg = cached.message.imageMessage;
        const vidMsg = cached.message.videoMessage;
        const header = `🗑️ *Anti-Delete*\nFrom: @${from.split("@")[0]}`;
        if (imgMsg) {
          await sock.sendMessage(jid, {
            image: { url: imgMsg.url ?? "" },
            caption: `${header}\n${imgMsg.caption ?? ""}`,
            mentions: [from],
          });
        } else if (vidMsg) {
          await sock.sendMessage(jid, {
            video: { url: vidMsg.url ?? "" },
            caption: `${header}\n${vidMsg.caption ?? ""}`,
            mimetype: "video/mp4",
            mentions: [from],
          });
        } else if (text) {
          await sock.sendMessage(jid, {
            text: `${header}\n\n${text}`,
            mentions: [from],
          });
        }
        msgCache.delete(key.id);
      } catch {}
    }
  });

  // ── Anti-edit ─────────────────────────────────────────────────────────────
  sock.ev.on("messages.update", async (updates) => {
    if (!botState.botSettings.antiEdit) return;
    for (const { key, update } of updates) {
      if (!update.message) continue;
      const original = key.id ? msgCache.get(key.id) : null;
      if (!original) continue;
      const origText =
        original.message?.conversation ||
        original.message?.extendedTextMessage?.text || "";
      const newText =
        update.message?.conversation ||
        update.message?.extendedTextMessage?.text || "";
      if (!origText || origText === newText) continue;
      const jid = key.remoteJid!;
      const from = key.participant ?? key.remoteJid ?? "";
      try {
        await sock.sendMessage(jid, {
          text: `✏️ *Anti-Edit*\nFrom: @${from.split("@")[0]}\n\n*Original:*\n${origText}\n\n*Edited to:*\n${newText}`,
          mentions: [from],
        });
      } catch {}
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
      // Kick off background timers
      startBioBeat(sock);
      startPresenceBeat(sock);
    } else if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const isLoggedOut =
        statusCode === DisconnectReason.loggedOut ||
        statusCode === DisconnectReason.multideviceMismatch;

      botState.isConnected = false;
      if (bioBeatTimer) { clearInterval(bioBeatTimer); bioBeatTimer = null; }
      if (presenceBeatTimer) { clearInterval(presenceBeatTimer); presenceBeatTimer = null; }

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
  attachHandlers(sock);

  return sock;
}

export async function requestPairingCode(phoneNumber: string): Promise<string> {
  const cleaned = phoneNumber.replace(/[^0-9]/g, "");
  if (!cleaned || cleaned.length < 7) throw new Error("Invalid phone number. Example: 254743760083");

  if (botState.isConnected && botState.sock?.authState.creds.registered) {
    throw new Error("WhatsApp is already linked. Use /status to check.");
  }

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

  attachConnectionHandler(sock, saveCreds);
  attachHandlers(sock);

  await new Promise(r => setTimeout(r, 3000));

  if (sock.authState.creds.registered) throw new Error("Already registered — use /status.");

  logger.info("Requesting pairing code from WhatsApp...");
  const code = await sock.requestPairingCode(cleaned);
  logger.info({ code }, "Pairing code obtained");
  return code;
}

export function getConnectionStatus() {
  return { isConnected: botState.isConnected, user: botState.sock?.user };
}
