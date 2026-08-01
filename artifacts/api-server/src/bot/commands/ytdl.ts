import type { WASocket, WAMessage } from "@whiskeysockets/baileys";

export async function ytdlCommand(sock: WASocket, msg: WAMessage, args: string[], type: "audio" | "video" = "audio") {
  const jid = msg.key.remoteJid!;
  const url = args[0];

  if (!url || !url.includes("youtu")) {
    await sock.sendMessage(jid, {
      text: `❌ Usage: *.${type === "audio" ? "ytmp3" : "ytmp4"} [YouTube URL]*\n\nExample: .ytmp3 https://youtube.com/watch?v=...`,
    }, { quoted: msg });
    return;
  }

  await sock.sendMessage(jid, {
    text: `⏳ Downloading ${type === "audio" ? "audio 🎵" : "video 🎬"} from YouTube...`,
  }, { quoted: msg });

  try {
    // Lazy import to avoid esbuild bundling issues
    const ytdl = (await import("@distube/ytdl-core")).default;

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.slice(0, 60);
    const duration = parseInt(info.videoDetails.lengthSeconds);

    if (duration > 600) {
      await sock.sendMessage(jid, {
        text: "❌ Video is too long (max 10 minutes).",
      }, { quoted: msg });
      return;
    }

    if (type === "audio") {
      const chunks: Buffer[] = [];
      const stream = ytdl(url, { quality: "highestaudio", filter: "audioonly" });
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      await sock.sendMessage(jid, {
        audio: buffer,
        mimetype: "audio/mpeg",
        ptt: false,
      }, { quoted: msg });
      await sock.sendMessage(jid, { text: `🎵 *${title}*\n_Downloaded successfully_` });
    } else {
      const chunks: Buffer[] = [];
      const stream = ytdl(url, { quality: "lowest" });
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      await sock.sendMessage(jid, {
        video: buffer,
        caption: `🎬 *${title}*`,
        mimetype: "video/mp4",
      }, { quoted: msg });
    }
  } catch (err) {
    await sock.sendMessage(jid, {
      text: "❌ Download failed. Make sure the URL is valid and the video is not age-restricted.",
    }, { quoted: msg });
  }
}
