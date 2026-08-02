import type { WASocket, WAMessage } from "@whiskeysockets/baileys";

export async function tagallCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) {
    return sock.sendMessage(jid, { text: "❌ This command is for groups only." }, { quoted: msg });
  }

  try {
    const meta = await sock.groupMetadata(jid);
    const participants = meta.participants;
    const mentions = participants.map(p => p.id);
    const announcement = args.join(" ") || "📢 *Attention everyone!*";

    const tags = participants.map(p => `@${p.id.split("@")[0]}`).join(" ");
    const text = `${announcement}\n\n${tags}`;

    await sock.sendMessage(jid, { text, mentions }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to tag all members." }, { quoted: msg });
  }
}
