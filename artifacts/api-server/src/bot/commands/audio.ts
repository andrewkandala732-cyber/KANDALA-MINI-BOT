import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const execAsync = promisify(exec);

async function downloadAudio(msg: WAMessage): Promise<{ buffer: Buffer; ext: string } | null> {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const audioMsg = quoted?.audioMessage || msg.message?.audioMessage;
  const videoMsg = quoted?.videoMessage || msg.message?.videoMessage;
  if (!audioMsg && !videoMsg) return null;

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

  return { buffer, ext: videoMsg ? "mp4" : "ogg" };
}

async function applyFfmpegFilter(inputBuffer: Buffer, inputExt: string, filter: string, outputExt = "mp3"): Promise<Buffer> {
  const id = randomUUID();
  const inPath = join(tmpdir(), `${id}.${inputExt}`);
  const outPath = join(tmpdir(), `${id}.${outputExt}`);
  await writeFile(inPath, inputBuffer);
  await execAsync(`ffmpeg -i "${inPath}" ${filter} "${outPath}" -y`);
  const out = await readFile(outPath);
  unlink(inPath).catch(() => {});
  unlink(outPath).catch(() => {});
  return out;
}

async function sendAudio(sock: WASocket, jid: string, msg: WAMessage, buffer: Buffer, caption?: string) {
  await sock.sendMessage(jid, { audio: buffer, mimetype: "audio/mpeg", ptt: false }, { quoted: msg });
  if (caption) await sock.sendMessage(jid, { text: caption });
}

export async function tomp3Command(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const media = await downloadAudio(msg);
  if (!media) {
    await sock.sendMessage(jid, { text: "❌ Reply to a video/audio message with *.tomp3*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Converting to MP3..." }, { quoted: msg });
  try {
    const out = await applyFfmpegFilter(media.buffer, media.ext, "-vn -acodec libmp3lame -q:a 2");
    await sendAudio(sock, jid, msg, out, "🎵 Converted to MP3!");
  } catch {
    await sock.sendMessage(jid, { text: "❌ Conversion failed." }, { quoted: msg });
  }
}

export async function reverseCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const media = await downloadAudio(msg);
  if (!media) {
    await sock.sendMessage(jid, { text: "❌ Reply to an audio/video message with *.reverse*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Reversing audio..." }, { quoted: msg });
  try {
    const out = await applyFfmpegFilter(media.buffer, media.ext, "-vn -af areverse -acodec libmp3lame");
    await sendAudio(sock, jid, msg, out, "⏪ Audio reversed!");
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to reverse audio." }, { quoted: msg });
  }
}

export async function bassCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const media = await downloadAudio(msg);
  if (!media) {
    await sock.sendMessage(jid, { text: "❌ Reply to an audio/video message with *.bass*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Boosting bass..." }, { quoted: msg });
  try {
    const out = await applyFfmpegFilter(media.buffer, media.ext, "-vn -af bass=g=20,dynaudnorm=f=200 -acodec libmp3lame");
    await sendAudio(sock, jid, msg, out, "🔉 Bass boosted!");
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to boost bass." }, { quoted: msg });
  }
}

export async function robotCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const media = await downloadAudio(msg);
  if (!media) {
    await sock.sendMessage(jid, { text: "❌ Reply to an audio message with *.robot*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Applying robot effect..." }, { quoted: msg });
  try {
    const out = await applyFfmpegFilter(media.buffer, media.ext, "-vn -af \"asetrate=44100*0.8,aresample=44100,atempo=1.25\" -acodec libmp3lame");
    await sendAudio(sock, jid, msg, out, "🤖 Robot voice applied!");
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to apply robot effect." }, { quoted: msg });
  }
}

export async function earrapeCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const media = await downloadAudio(msg);
  if (!media) {
    await sock.sendMessage(jid, { text: "❌ Reply to an audio message with *.earrape*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Applying earrape effect... ⚠️" }, { quoted: msg });
  try {
    const out = await applyFfmpegFilter(media.buffer, media.ext, "-vn -af volume=12,acompressor=threshold=0.1:ratio=9999:attack=0.0001:release=0.001 -acodec libmp3lame");
    await sendAudio(sock, jid, msg, out, "🔊⚠️ Earrape applied! Turn down your volume!");
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to apply earrape effect." }, { quoted: msg });
  }
}

export async function blownCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const media = await downloadAudio(msg);
  if (!media) {
    await sock.sendMessage(jid, { text: "❌ Reply to an audio message with *.blown*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Applying blown speaker effect..." }, { quoted: msg });
  try {
    const out = await applyFfmpegFilter(media.buffer, media.ext, "-vn -af \"acrusher=level_in=8:level_out=18:bits=8:mode=log:aa=1\" -acodec libmp3lame");
    await sendAudio(sock, jid, msg, out, "💥 Blown speaker effect applied!");
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to apply blown effect." }, { quoted: msg });
  }
}

export async function deepCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const media = await downloadAudio(msg);
  if (!media) {
    await sock.sendMessage(jid, { text: "❌ Reply to an audio message with *.deep*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Applying deep voice effect..." }, { quoted: msg });
  try {
    const out = await applyFfmpegFilter(media.buffer, media.ext, "-vn -af \"asetrate=44100*0.7,aresample=44100\" -acodec libmp3lame");
    await sendAudio(sock, jid, msg, out, "🔈 Deep voice applied!");
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to apply deep effect." }, { quoted: msg });
  }
}

export async function topttCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  // Alias for TTS
  const { ttsCommand } = await import("./tts.js");
  await ttsCommand(sock, msg, args);
}

export async function volaudioCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const vol = parseInt(args[0] ?? "2");
  if (isNaN(vol) || vol < 1 || vol > 20) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.volaudio [volume 1-20]*\nExample: .volaudio 5" }, { quoted: msg });
    return;
  }
  const media = await downloadAudio(msg);
  if (!media) {
    await sock.sendMessage(jid, { text: "❌ Reply to an audio/video message with *.volaudio [volume]*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: `⏳ Setting volume to ${vol}x...` }, { quoted: msg });
  try {
    const out = await applyFfmpegFilter(media.buffer, media.ext, `-vn -af volume=${vol} -acodec libmp3lame`);
    await sendAudio(sock, jid, msg, out, `🔊 Volume set to ${vol}x!`);
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to change volume." }, { quoted: msg });
  }
}
