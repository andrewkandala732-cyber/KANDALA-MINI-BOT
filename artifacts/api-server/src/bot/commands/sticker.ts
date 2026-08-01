import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const execAsync = promisify(exec);

export async function stickerCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const mediaMsg = quoted?.imageMessage || quoted?.videoMessage
    || msg.message?.imageMessage || msg.message?.videoMessage;

  if (!mediaMsg) {
    await sock.sendMessage(jid, {
      text: "❌ Please send or reply to an image/video with *.sticker*",
    }, { quoted: msg });
    return;
  }

  await sock.sendMessage(jid, { text: "⏳ Converting to sticker..." }, { quoted: msg });

  try {
    // Download media
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

    const id = randomUUID();
    const isVideo = !!(quoted?.videoMessage || msg.message?.videoMessage);
    const inPath = join(tmpdir(), `${id}.${isVideo ? "mp4" : "jpg"}`);
    const outPath = join(tmpdir(), `${id}.webp`);

    await writeFile(inPath, buffer);

    if (isVideo) {
      await execAsync(
        `ffmpeg -i "${inPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15" -loop 0 -ss 0 -t 6 -preset default -an -vsync 0 "${outPath}" -y`
      );
    } else {
      // Use sharp via require (externalized)
      const sharp = (await import("sharp")).default;
      await sharp(buffer).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp().toFile(outPath);
    }

    const webpBuffer = await readFile(outPath);
    await sock.sendMessage(jid, {
      sticker: webpBuffer,
    });

    // Cleanup
    unlink(inPath).catch(() => {});
    unlink(outPath).catch(() => {});
  } catch (err) {
    await sock.sendMessage(jid, { text: "❌ Failed to create sticker. Make sure ffmpeg is installed." }, { quoted: msg });
  }
}
