import type { WASocket, WAMessage } from "@whiskeysockets/baileys";

export async function pingCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const start = Date.now();
  const sent = await sock.sendMessage(jid, { text: "🏓 Pong!" }, { quoted: msg });
  const latency = Date.now() - start;
  await sock.sendMessage(jid, {
    text: `🏓 *Pong!*\n⚡ *Speed:* ${latency}ms\n📶 *Status:* Online`,
  });
  return sent;
}
