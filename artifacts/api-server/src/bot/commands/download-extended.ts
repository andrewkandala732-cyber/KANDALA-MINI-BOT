import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";

async function notAvailable(sock: WASocket, msg: WAMessage, platform: string, note?: string) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, {
    text: `❌ *${platform} download* requires additional setup.${note ? `\n\n${note}` : ""}\n\n📥 Try *.ytmp3* or *.ytmp4* for YouTube.`,
  }, { quoted: msg });
}

export async function songCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const query = args.join(" ").trim();
  if (!query) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.song [song name]*\nExample: .song Afrobeats remix" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: `🎵 Searching for "${query}"...` }, { quoted: msg });
  try {
    const ytdl = (await import("@distube/ytdl-core")).default;
    const res = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000,
    });
    const matches = (res.data as string).match(/\/watch\?v=([a-zA-Z0-9_-]{11})/g) ?? [];
    const ids = [...new Set(matches.map((m: string) => m.replace("/watch?v=", "")))];
    if (!ids.length) throw new Error("no results");
    const url = `https://www.youtube.com/watch?v=${ids[0]}`;
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    const duration = parseInt(info.videoDetails.lengthSeconds);
    if (duration > 600) {
      await sock.sendMessage(jid, { text: "❌ Song is too long (max 10 minutes)." }, { quoted: msg });
      return;
    }
    const chunks: Buffer[] = [];
    const stream = ytdl(url, { quality: "highestaudio", filter: "audioonly" });
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    await sock.sendMessage(jid, { audio: buffer, mimetype: "audio/mpeg", ptt: false }, { quoted: msg });
    await sock.sendMessage(jid, { text: `🎵 *${title}*\n_Downloaded successfully_` });
  } catch {
    await sock.sendMessage(jid, { text: `❌ Could not find "${query}". Try *.ytmp3 [YouTube URL]*` }, { quoted: msg });
  }
}

export async function song2Command(sock: WASocket, msg: WAMessage, args: string[]) {
  await songCommand(sock, msg, args);
}

export async function tiktokCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const url = args[0]?.trim();
  if (!url || !url.includes("tiktok")) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.tiktok [TikTok URL]*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Downloading TikTok video..." }, { quoted: msg });
  try {
    const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, { timeout: 15000 });
    const data = res.data as any;
    const videoUrl = data?.video?.noWatermark ?? data?.video?.watermark;
    if (!videoUrl) throw new Error("no video URL");
    const vidRes = await axios.get(videoUrl, { responseType: "arraybuffer", timeout: 30000 });
    await sock.sendMessage(jid, {
      video: Buffer.from(vidRes.data),
      caption: `🎵 *${data?.title ?? "TikTok Video"}*\n_No watermark_`,
      mimetype: "video/mp4",
    }, { quoted: msg });
  } catch {
    await notAvailable(sock, msg, "TikTok", "The TikTok API may be temporarily unavailable. Try again later.");
  }
}

export async function tiktokaudioCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const url = args[0]?.trim();
  if (!url || !url.includes("tiktok")) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.tiktokaudio [TikTok URL]*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Downloading TikTok audio..." }, { quoted: msg });
  try {
    const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, { timeout: 15000 });
    const data = res.data as any;
    const audioUrl = data?.music;
    if (!audioUrl) throw new Error("no audio");
    const audRes = await axios.get(audioUrl, { responseType: "arraybuffer", timeout: 20000 });
    await sock.sendMessage(jid, { audio: Buffer.from(audRes.data), mimetype: "audio/mpeg", ptt: false }, { quoted: msg });
  } catch {
    await notAvailable(sock, msg, "TikTok audio");
  }
}

export async function instagramCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const url = args[0]?.trim();
  if (!url || !url.includes("instagram")) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.instagram [Instagram URL]*" }, { quoted: msg });
    return;
  }
  await notAvailable(sock, msg, "Instagram", "Login-required posts cannot be downloaded. Try public posts only.");
}

export async function igaudioCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await notAvailable(sock, msg, "Instagram Audio");
}

export async function facebookCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await notAvailable(sock, msg, "Facebook Video", "Facebook requires login for most videos.");
}

export async function fbaudioCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await notAvailable(sock, msg, "Facebook Audio");
}

export async function twitterCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await notAvailable(sock, msg, "Twitter/X", "Twitter API requires authentication.");
}

export async function twaudioCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await notAvailable(sock, msg, "Twitter Audio");
}

export async function pinCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await notAvailable(sock, msg, "Pinterest");
}

export async function apkCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const query = args.join(" ").trim();
  if (!query) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.apk [app name]*\nExample: .apk WhatsApp" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, {
    text: `📱 *APK Search: ${query}*\n\n🌐 APKPure: https://apkpure.com/search?q=${encodeURIComponent(query)}\n🌐 APKMirror: https://www.apkmirror.com/?s=${encodeURIComponent(query)}`,
  }, { quoted: msg });
}

export async function downloadCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const url = args[0]?.trim();
  if (!url) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.download [URL]*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Downloading..." }, { quoted: msg });
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 30000 });
    const ct = (res.headers["content-type"] as string) ?? "";
    const buffer = Buffer.from(res.data as ArrayBuffer);
    if (ct.startsWith("image/")) {
      await sock.sendMessage(jid, { image: buffer, caption: `📥 Downloaded from: ${url}` }, { quoted: msg });
    } else if (ct.startsWith("video/")) {
      await sock.sendMessage(jid, { video: buffer, mimetype: "video/mp4", caption: "📥 Video" }, { quoted: msg });
    } else if (ct.startsWith("audio/")) {
      await sock.sendMessage(jid, { audio: buffer, mimetype: "audio/mpeg", ptt: false }, { quoted: msg });
    } else {
      await sock.sendMessage(jid, {
        document: buffer,
        mimetype: ct || "application/octet-stream",
        fileName: "download",
        caption: "📥 Downloaded!",
      }, { quoted: msg });
    }
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to download. Check the URL." }, { quoted: msg });
  }
}

export async function mediafireCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await notAvailable(sock, msg, "MediaFire");
}

export async function gdriveCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await notAvailable(sock, msg, "Google Drive", "Use direct download links instead.");
}

export async function gitcloneCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const url = args[0]?.trim();
  if (!url || !url.includes("github")) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.gitclone [GitHub URL]*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: `📦 *GitHub Repo*\n🔗 ${url}\n\nClone: \`git clone ${url}\`` }, { quoted: msg });
}

export async function itunesCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await notAvailable(sock, msg, "iTunes");
}

export async function tele_stickerCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Telegram sticker conversion is not supported." }, { quoted: msg });
}

export async function xvideoCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ This command is not available." }, { quoted: msg });
}

export async function savestatusCommand(sock: WASocket, msg: WAMessage) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Status saving is not yet supported in this version." }, { quoted: msg });
}

export async function videodocCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await notAvailable(sock, msg, "Video document conversion");
}

export async function imageCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const query = args.join(" ").trim();
  if (!query) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.image [search query]*\nExample: .image nature landscape" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: `🔍 Fetching image for "${query}"...` }, { quoted: msg });
  try {
    const res = await axios.get(`https://loremflickr.com/640/480/${encodeURIComponent(query)}`, {
      responseType: "arraybuffer", timeout: 10000,
    });
    await sock.sendMessage(jid, {
      image: Buffer.from(res.data as ArrayBuffer),
      caption: `🖼️ *${query}*`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Could not find image. Try a different search." }, { quoted: msg });
  }
}
