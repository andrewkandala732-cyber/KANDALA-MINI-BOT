import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { spawn } from "node:child_process";
import { writeFile, readFile, unlink, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import ffmpegPath from "ffmpeg-static";

function reply(sock: WASocket, msg: WAMessage, text: string) {
  return sock.sendMessage(msg.key.remoteJid!, { text }, { quoted: msg });
}

async function getAudioBuffer(msg: WAMessage): Promise<Buffer | null> {
  const m = msg.message;
  if (!m) return null;
  const hasAudio = m.audioMessage || m.voiceMessage;
  const hasVideo = m.videoMessage;
  const hasDoc = m.documentMessage && m.documentMessage.mimetype?.startsWith("audio");

  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!hasAudio && !hasVideo && !hasDoc && !quoted) return null;

  try {
    const target = (hasAudio || hasVideo || hasDoc) ? msg : {
      key: { ...msg.key, id: msg.message?.extendedTextMessage?.contextInfo?.stanzaId },
      message: quoted,
    } as WAMessage;
    const buf = await downloadMediaMessage(target, "buffer", {}) as Buffer;
    return buf;
  } catch { return null; }
}

function runFfmpeg(inputPath: string, outputPath: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath as string, ["-y", "-i", inputPath, ...args, outputPath]);
    let err = "";
    ff.stderr.on("data", d => err += d.toString());
    ff.on("close", code => code === 0 ? resolve() : reject(new Error(`ffmpeg error: ${err.slice(-300)}`)));
  });
}

async function processAudio(
  sock: WASocket, msg: WAMessage,
  label: string,
  ffArgs: string[],
  asVoice = false
) {
  const jid = msg.key.remoteJid!;
  const buf = await getAudioBuffer(msg);
  if (!buf) return reply(sock, msg, `❌ Please send or reply to an audio/voice/video message to use *.${label}*`);

  const dir = join(tmpdir(), "kandala-audio");
  await mkdir(dir, { recursive: true });
  const inPath = join(dir, `in_${Date.now()}.tmp`);
  const outPath = join(dir, `out_${Date.now()}.mp3`);

  try {
    await writeFile(inPath, buf);
    await runFfmpeg(inPath, outPath, ffArgs);
    const outBuf = await readFile(outPath);
    await sock.sendMessage(jid, {
      audio: outBuf,
      mimetype: "audio/mpeg",
      ptt: asVoice,
    }, { quoted: msg });
  } catch (e: any) {
    await reply(sock, msg, `❌ Audio processing failed: ${e.message}`);
  } finally {
    await unlink(inPath).catch(() => {});
    await unlink(outPath).catch(() => {});
  }
}

export async function tomp3Command(sock: WASocket, msg: WAMessage) {
  await processAudio(sock, msg, "tomp3",
    ["-vn", "-ar", "44100", "-ac", "2", "-b:a", "128k"]
  );
}

export async function bassCommand(sock: WASocket, msg: WAMessage) {
  await processAudio(sock, msg, "bass",
    ["-af", "bass=g=15:f=110:w=0.3,volume=2.0", "-ar", "44100", "-ac", "2", "-b:a", "128k"]
  );
}

export async function robotCommand(sock: WASocket, msg: WAMessage) {
  await processAudio(sock, msg, "robot",
    ["-af", "asetrate=44100*0.8,aresample=44100,atempo=1.25,vibrato=f=8:d=0.5,volume=1.5", "-ar", "44100", "-b:a", "128k"]
  );
}

export async function reverseCommand(sock: WASocket, msg: WAMessage) {
  await processAudio(sock, msg, "reverse",
    ["-af", "areverse", "-ar", "44100", "-b:a", "128k"]
  );
}

export async function earrapeCommand(sock: WASocket, msg: WAMessage) {
  await processAudio(sock, msg, "earrape",
    ["-af", "acrusher=level_in=8:level_out=18:bits=8:mode=log:aa=1,volume=8.0", "-ar", "44100", "-b:a", "128k"]
  );
}

export async function deepCommand(sock: WASocket, msg: WAMessage) {
  await processAudio(sock, msg, "deep",
    ["-af", "asetrate=44100*0.7,aresample=44100,atempo=1.43,volume=1.5", "-ar", "44100", "-b:a", "128k"]
  );
}

export async function blownCommand(sock: WASocket, msg: WAMessage) {
  await processAudio(sock, msg, "blown",
    ["-af", "acrusher=level_in=4:level_out=8:bits=4:mode=log,volume=3.0,highpass=f=200", "-ar", "44100", "-b:a", "128k"]
  );
}

export async function volaudioCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const vol = parseFloat(args[0] || "2");
  if (isNaN(vol) || vol <= 0 || vol > 10) return reply(sock, msg, "Usage: *.volaudio [1-10]*\nExample: .volaudio 3\n(1=normal, 2=2x louder, etc.)");
  await processAudio(sock, msg, "volaudio",
    ["-af", `volume=${vol}`, "-ar", "44100", "-b:a", "128k"]
  );
}

export async function toppttCommand(sock: WASocket, msg: WAMessage) {
  // Convert any audio to voice note (ptt)
  await processAudio(sock, msg, "toptt",
    ["-ar", "16000", "-ac", "1", "-b:a", "32k"],
    true
  );
}

export async function toaudioCommand(sock: WASocket, msg: WAMessage) {
  // Extract audio from video
  await processAudio(sock, msg, "toaudio",
    ["-vn", "-ar", "44100", "-ac", "2", "-b:a", "128k"]
  );
}
