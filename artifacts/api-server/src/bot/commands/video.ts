import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const execAsync = promisify(exec);

async function downloadVideo(msg: WAMessage): Promise<Buffer | null> {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const videoMsg = quoted?.videoMessage || msg.message?.videoMessage;
  if (!videoMsg) return null;
  return await downloadMediaMessage(
    {
      key: msg.message?.extendedTextMessage?.contextInfo?.stanzaId
        ? { ...msg.key, id: msg.message.extendedTextMessage.contextInfo.stanzaId }
        : msg.key,
      message: quoted || msg.message,
    } as WAMessage,
    "buffer",
    {}
  ) as Buffer;
}

export async function toaudioCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const buffer = await downloadVideo(msg);
  if (!buffer) {
    await sock.sendMessage(jid, { text: "❌ Reply to a video message with *.toaudio*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Extracting audio from video..." }, { quoted: msg });
  try {
    const id = randomUUID();
    const inPath = join(tmpdir(), `${id}.mp4`);
    const outPath = join(tmpdir(), `${id}.mp3`);
    await writeFile(inPath, buffer);
    await execAsync(`ffmpeg -i "${inPath}" -vn -acodec libmp3lame -q:a 2 "${outPath}" -y`);
    const audioBuffer = await readFile(outPath);
    unlink(inPath).catch(() => {});
    unlink(outPath).catch(() => {});
    await sock.sendMessage(jid, { audio: audioBuffer, mimetype: "audio/mpeg", ptt: false }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to extract audio from video." }, { quoted: msg });
  }
}

export async function tovideoCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const audioMsg = quoted?.audioMessage || msg.message?.audioMessage;
  if (!audioMsg) {
    await sock.sendMessage(jid, { text: "❌ Reply to an audio message with *.tovideo*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Converting audio to video..." }, { quoted: msg });
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
    const id = randomUUID();
    const inPath = join(tmpdir(), `${id}.ogg`);
    const outPath = join(tmpdir(), `${id}.mp4`);
    await writeFile(inPath, buffer);
    await execAsync(`ffmpeg -f lavfi -i color=c=black:size=640x360:rate=25 -i "${inPath}" -shortest -c:v libx264 -crf 23 -c:a aac "${outPath}" -y`);
    const vidBuffer = await readFile(outPath);
    unlink(inPath).catch(() => {});
    unlink(outPath).catch(() => {});
    await sock.sendMessage(jid, {
      video: vidBuffer,
      caption: "🎬 Audio converted to video!",
      mimetype: "video/mp4",
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to convert audio to video." }, { quoted: msg });
  }
}

export async function volvideoCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const vol = parseInt(args[0] ?? "2");
  if (isNaN(vol) || vol < 1 || vol > 10) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.volvideo [volume 1-10]*\nExample: .volvideo 3" }, { quoted: msg });
    return;
  }
  const buffer = await downloadVideo(msg);
  if (!buffer) {
    await sock.sendMessage(jid, { text: "❌ Reply to a video message with *.volvideo [volume]*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: `⏳ Setting video volume to ${vol}x...` }, { quoted: msg });
  try {
    const id = randomUUID();
    const inPath = join(tmpdir(), `${id}.mp4`);
    const outPath = join(tmpdir(), `${id}_vol.mp4`);
    await writeFile(inPath, buffer);
    await execAsync(`ffmpeg -i "${inPath}" -af volume=${vol} -c:v copy "${outPath}" -y`);
    const vidBuffer = await readFile(outPath);
    unlink(inPath).catch(() => {});
    unlink(outPath).catch(() => {});
    await sock.sendMessage(jid, {
      video: vidBuffer,
      caption: `🔊 Volume set to ${vol}x!`,
      mimetype: "video/mp4",
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to change video volume." }, { quoted: msg });
  }
}
