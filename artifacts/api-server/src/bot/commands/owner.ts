import type { WASocket, WAMessage } from "@whiskeysockets/baileys";

export async function ownerCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const text = `
👑 *BOT OWNER*

📛 *Name:* KANDALA
📱 *Number:* +254743760083
🔗 *WhatsApp:* wa.me/254743760083

_This bot was created and is managed by the owner above._
`;
  await sock.sendMessage(jid, { text }, { quoted: msg });
  await sock.sendMessage(jid, {
    contacts: {
      displayName: "KANDALA",
      contacts: [{ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:KANDALA\nTEL;type=CELL;waid=254743760083:+254743760083\nEND:VCARD` }],
    },
  });
}
