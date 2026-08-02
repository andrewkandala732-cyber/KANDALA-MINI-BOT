import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export async function toimgCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const stickerMsg = quoted?.stickerMessage || msg.message?.stickerMessage;

  if (!stickerMsg) {
    await sock.sendMessage(jid, {
      text: "❌ Please reply to a sticker with *.toimg*",
    }, { quoted: msg });
    return;
  }

  await sock.sendMessage(jid, { text: "⏳ Converting sticker to image..." }, { quoted: msg });

  try {
    const buffer = await downloadMediaMessage(
      {
        key: msg.message?.extendedTextMessage?.contextInfo?.stanzaId
          ? { ...msg.key, id: msg.message.extendedTextMessage.contextInfo.stanzaId }
          : msg.key,
        message: quoted || msg.message,
      } as WAMessage,
      "buffer",
      {}
    ) as Buffer;

    const sharp = (await import("sharp")).default;
    const pngBuffer = await sharp(buffer).png().toBuffer();

    await sock.sendMessage(jid, {
      image: pngBuffer,
      caption: "🖼️ Here is your image!",
    });
  } catch (err) {
    await sock.sendMessage(jid, { text: "❌ Failed to convert sticker to image." }, { quoted: msg });
  }
}
