import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { botState } from "../store.js";

export async function antilinkCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });

  const action = args[0]?.toLowerCase();
  if (action === "on") {
    botState.antilinkGroups.add(jid);
    await sock.sendMessage(jid, { text: "✅ *Anti-Link is ON*\nAny link shared in this group will be deleted and the sender warned." }, { quoted: msg });
  } else if (action === "off") {
    botState.antilinkGroups.delete(jid);
    await sock.sendMessage(jid, { text: "❌ *Anti-Link is OFF*\nLinks are now allowed in this group." }, { quoted: msg });
  } else {
    const status = botState.antilinkGroups.has(jid);
    await sock.sendMessage(jid, {
      text: `🔗 *Anti-Link Status:* ${status ? "✅ ON" : "❌ OFF"}\n\nUsage:\n.antilink on — Enable\n.antilink off — Disable`,
    }, { quoted: msg });
  }
}

export async function handleAntilinkMessage(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  if (!botState.antilinkGroups.has(jid)) return;

  const text = msg.message?.conversation
    || msg.message?.extendedTextMessage?.text
    || msg.message?.imageMessage?.caption
    || msg.message?.videoMessage?.caption
    || "";

  const linkRegex = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[^\s]+|wa\.me\/[^\s]+)/i;
  if (!linkRegex.test(text)) return;

  const sender = msg.key.participant ?? msg.key.remoteJid!;
  const meta = await sock.groupMetadata(jid);
  const senderP = meta.participants.find(p => p.id === sender);

  // Don't delete admin messages
  if (senderP?.admin === "admin" || senderP?.admin === "superadmin") return;

  try {
    await sock.sendMessage(jid, {
      delete: msg.key,
    });
    await sock.sendMessage(jid, {
      text: `⚠️ @${sender.split("@")[0]}, links are not allowed in this group!`,
      mentions: [sender],
    });
  } catch { /* bot may not be admin */ }
}
