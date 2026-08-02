import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";
import { writeFile, readFile, unlink, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

function reply(sock: WASocket, msg: WAMessage, text: string) {
  return sock.sendMessage(msg.key.remoteJid!, { text }, { quoted: msg });
}

async function downloadWithYtdlp(url: string, audioOnly: boolean): Promise<{ path: string; title: string }> {
  const dir = join(tmpdir(), "kandala-dl");
  await mkdir(dir, { recursive: true });
  const outTemplate = join(dir, `dl_${Date.now()}.%(ext)s`);

  const args = audioOnly
    ? `-x --audio-format mp3 --audio-quality 128K -o "${outTemplate}" "${url}"`
    : `-f "best[filesize<50M]/bestvideo[ext=mp4]+bestaudio/best" -o "${outTemplate}" "${url}"`;

  // try yt-dlp first, then ytdlp from pip
  const cmds = ["yt-dlp", "python3 -m yt_dlp", "python -m yt_dlp"];
  for (const cmd of cmds) {
    try {
      const { stdout } = await execAsync(`${cmd} ${args}`, { timeout: 60000 });
      // Find the output file
      const match = stdout.match(/\[download\] Destination: (.+)/);
      if (match) return { path: match[1].trim(), title: "Download" };
      // Try to find recently created file
      const { stdout: ls } = await execAsync(`ls -t ${dir} | head -1`);
      const fname = ls.trim();
      if (fname) return { path: join(dir, fname), title: fname };
    } catch {}
  }
  throw new Error("yt-dlp not available");
}

async function trySocialDownload(sock: WASocket, msg: WAMessage, url: string, platform: string) {
  const jid = msg.key.remoteJid!;
  await reply(sock, msg, `⏳ Downloading from ${platform}... Please wait.`);
  
  try {
    // Try yt-dlp based download first
    const { path, title } = await downloadWithYtdlp(url, false);
    const buf = await readFile(path);
    await unlink(path).catch(() => {});
    await sock.sendMessage(jid, {
      video: buf,
      caption: `📥 *${platform.toUpperCase()} VIDEO*\n🔗 ${url}`,
    }, { quoted: msg });
  } catch {
    // Fallback: try cobalt.tools API (free, no key needed)
    try {
      const res = await axios.post("https://api.cobalt.tools/api/json", {
        url,
        vQuality: "720",
        filenamePattern: "basic",
        isAudioOnly: false,
      }, {
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        timeout: 15000,
      });

      if (res.data.url || res.data.urls) {
        const dlUrl = res.data.url || res.data.urls[0];
        const vidRes = await axios.get(dlUrl, { responseType: "arraybuffer", timeout: 60000 });
        const buf = Buffer.from(vidRes.data);
        if (buf.length > 60 * 1024 * 1024) {
          return reply(sock, msg, "❌ File too large (>60MB). Try a shorter video.");
        }
        await sock.sendMessage(jid, {
          video: buf,
          caption: `📥 *${platform.toUpperCase()} VIDEO*\n🔗 ${url}`,
        }, { quoted: msg });
      } else {
        await reply(sock, msg, `❌ Could not download. The ${platform} URL may be private or invalid.\n\nTip: Make sure the video is public.`);
      }
    } catch (e: any) {
      await reply(sock, msg, `❌ Download failed for ${platform}.\n\nMake sure:\n• The URL is correct\n• The video is public\n• URL format: ${platform === "TikTok" ? "https://www.tiktok.com/@user/video/..." : `https://www.${platform.toLowerCase()}.com/...`}`);
    }
  }
}

export async function tiktokCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.tiktok [url]*\nExample: .tiktok https://www.tiktok.com/@user/video/123");
  await trySocialDownload(sock, msg, args[0], "TikTok");
}

export async function tiktokaudioCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.tiktokaudio [url]*");
  const jid = msg.key.remoteJid!;
  await reply(sock, msg, "⏳ Extracting TikTok audio...");
  try {
    const res = await axios.post("https://api.cobalt.tools/api/json", {
      url: args[0], isAudioOnly: true,
    }, { headers: { "Accept": "application/json", "Content-Type": "application/json" }, timeout: 15000 });
    const dlUrl = res.data.url;
    const audRes = await axios.get(dlUrl, { responseType: "arraybuffer", timeout: 30000 });
    await sock.sendMessage(jid, { audio: Buffer.from(audRes.data), mimetype: "audio/mpeg" }, { quoted: msg });
  } catch { await reply(sock, msg, "❌ Could not extract TikTok audio."); }
}

export async function instagramCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.instagram [url]*\nExample: .instagram https://www.instagram.com/p/ABC123/");
  await trySocialDownload(sock, msg, args[0], "Instagram");
}

export async function facebookCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.facebook [url]*\nExample: .facebook https://www.facebook.com/video/123");
  await trySocialDownload(sock, msg, args[0], "Facebook");
}

export async function fbaudioCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.fbaudio [url]*");
  const jid = msg.key.remoteJid!;
  await reply(sock, msg, "⏳ Extracting Facebook audio...");
  try {
    const res = await axios.post("https://api.cobalt.tools/api/json", {
      url: args[0], isAudioOnly: true,
    }, { headers: { "Accept": "application/json", "Content-Type": "application/json" }, timeout: 15000 });
    const dlUrl = res.data.url;
    const audRes = await axios.get(dlUrl, { responseType: "arraybuffer", timeout: 30000 });
    await sock.sendMessage(jid, { audio: Buffer.from(audRes.data), mimetype: "audio/mpeg" }, { quoted: msg });
  } catch { await reply(sock, msg, "❌ Could not extract Facebook audio."); }
}

export async function twitterCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.twitter [url]*\nExample: .twitter https://twitter.com/user/status/123");
  await trySocialDownload(sock, msg, args[0], "Twitter");
}

export async function twaudioCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.twaudio [url]*");
  const jid = msg.key.remoteJid!;
  await reply(sock, msg, "⏳ Extracting Twitter audio...");
  try {
    const res = await axios.post("https://api.cobalt.tools/api/json", {
      url: args[0], isAudioOnly: true,
    }, { headers: { "Accept": "application/json", "Content-Type": "application/json" }, timeout: 15000 });
    const dlUrl = res.data.url;
    const audRes = await axios.get(dlUrl, { responseType: "arraybuffer", timeout: 30000 });
    await sock.sendMessage(jid, { audio: Buffer.from(audRes.data), mimetype: "audio/mpeg" }, { quoted: msg });
  } catch { await reply(sock, msg, "❌ Could not extract Twitter audio."); }
}

export async function songCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.song [song name]*\nExample: .song Wamlambez Sailors");
  const jid = msg.key.remoteJid!;
  await reply(sock, msg, `🎵 Searching for "${args.join(" ")}"...`);
  try {
    // Search YouTube using invidious (no key needed)
    const searchRes = await axios.get(`https://vid.puffyan.us/api/v1/search?q=${encodeURIComponent(args.join(" "))}&type=video&sort_by=relevance`, { timeout: 10000 });
    const videos = searchRes.data;
    if (!videos || !videos.length) return reply(sock, msg, "❌ No results found.");
    const video = videos[0];
    const ytUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    const title = video.title;

    // Use ytdl-core to download audio
    const ytdl = await import("@distube/ytdl-core");
    const info = await ytdl.default.getInfo(ytUrl);
    const format = ytdl.default.chooseFormat(info.formats, { quality: "lowestaudio", filter: "audioonly" });
    const dlRes = await axios.get(format.url, { responseType: "arraybuffer", timeout: 60000, maxContentLength: 50 * 1024 * 1024 });
    const buf = Buffer.from(dlRes.data);

    await sock.sendMessage(jid, {
      audio: buf,
      mimetype: "audio/mpeg",
      fileName: `${title}.mp3`,
    }, { quoted: msg });
  } catch (e: any) {
    await reply(sock, msg, `❌ Could not download song. Try *.ytmp3 [youtube url]* instead.\nError: ${e.message?.slice(0, 100)}`);
  }
}

export async function song2Command(sock: WASocket, msg: WAMessage, args: string[]) {
  // Alias for song
  return songCommand(sock, msg, args);
}

export async function videoCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.video [search query or url]*\nExample: .video funny cats");
  const jid = msg.key.remoteJid!;

  // If it looks like a URL, treat as direct download
  if (args[0].startsWith("http")) {
    return trySocialDownload(sock, msg, args[0], "Video");
  }

  await reply(sock, msg, `🎬 Searching for "${args.join(" ")}"...`);
  try {
    const searchRes = await axios.get(`https://vid.puffyan.us/api/v1/search?q=${encodeURIComponent(args.join(" "))}&type=video`, { timeout: 10000 });
    const video = searchRes.data[0];
    if (!video) return reply(sock, msg, "❌ No results found.");
    const ytUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    await reply(sock, msg, `✅ Found: *${video.title}*\n\nUse: *.ytmp4 ${ytUrl}*`);
  } catch {
    await reply(sock, msg, "❌ Search failed. Try: .ytmp4 [youtube url]");
  }
}

export async function videodocCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  // Download video as document (for larger files)
  if (!args.length) return reply(sock, msg, "Usage: *.videodoc [url]*");
  const jid = msg.key.remoteJid!;
  await reply(sock, msg, "⏳ Downloading as document...");
  try {
    const res = await axios.get(args[0], { responseType: "arraybuffer", timeout: 60000, maxContentLength: 100 * 1024 * 1024 });
    await sock.sendMessage(jid, {
      document: Buffer.from(res.data),
      mimetype: "video/mp4",
      fileName: "video.mp4",
    }, { quoted: msg });
  } catch { await reply(sock, msg, "❌ Download failed."); }
}

export async function imageCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.image [search query]*\nExample: .image beautiful Kenya sunset");
  const jid = msg.key.remoteJid!;
  try {
    const res = await axios.get(`https://source.unsplash.com/800x600/?${encodeURIComponent(args.join(","))}`, {
      responseType: "arraybuffer", timeout: 15000, maxRedirects: 5,
    });
    await sock.sendMessage(jid, {
      image: Buffer.from(res.data),
      caption: `🖼️ *IMAGE SEARCH*\n📝 Query: ${args.join(" ")}\n📷 Source: Unsplash`,
    }, { quoted: msg });
  } catch { await reply(sock, msg, "❌ Could not fetch image."); }
}

export async function wallpaperCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const query = args.join(" ") || "nature landscape";
  const jid = msg.key.remoteJid!;
  try {
    const res = await axios.get(`https://source.unsplash.com/1920x1080/?${encodeURIComponent(query)}`, {
      responseType: "arraybuffer", timeout: 20000, maxRedirects: 5,
    });
    await sock.sendMessage(jid, {
      image: Buffer.from(res.data),
      caption: `🖼️ *WALLPAPER*\n📝 Theme: ${query}\n📷 Source: Unsplash`,
    }, { quoted: msg });
  } catch { await reply(sock, msg, "❌ Could not fetch wallpaper."); }
}
