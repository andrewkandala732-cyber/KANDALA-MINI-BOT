import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";
import { botState } from "../store.js";

export async function qrcodeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const text = args.join(" ").trim();
  if (!text) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.qrcode [text or URL]*\nExample: .qrcode https://wa.me/254743760083" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Generating QR code..." }, { quoted: msg });
  try {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(text)}&format=png`;
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
    await sock.sendMessage(jid, {
      image: Buffer.from(res.data),
      caption: `📱 *QR Code Generated*\n\n_Content:_ ${text.slice(0, 80)}${text.length > 80 ? "..." : ""}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to generate QR code." }, { quoted: msg });
  }
}

export async function genpassCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const length = Math.min(Math.max(parseInt(args[0] ?? "16") || 16, 6), 64);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  await sock.sendMessage(jid, {
    text: `🔐 *Generated Password (${length} chars)*\n\n\`${pass}\`\n\n⚠️ _Save this securely. Don't share!_`,
  }, { quoted: msg });
}

export async function tinyurlCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const url = args[0]?.trim();
  if (!url || !url.startsWith("http")) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.tinyurl [URL]*\nExample: .tinyurl https://google.com" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "⏳ Shortening URL..." }, { quoted: msg });
  try {
    const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 10000 });
    await sock.sendMessage(jid, { text: `🔗 *URL Shortened!*\n\n📎 Original: ${url}\n✂️ Short: ${res.data}` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to shorten URL." }, { quoted: msg });
  }
}

export async function timeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const timezone = args.join(" ").trim() || botState.botSettings.timezone;
  try {
    const now = new Date().toLocaleString("en-US", {
      timeZone: timezone,
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
    });
    await sock.sendMessage(jid, {
      text: `🕐 *Current Time*\n\n🌍 *Timezone:* ${timezone}\n📅 ${now}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: `❌ Invalid timezone: "${timezone}"\n\nExamples: Africa/Nairobi, America/New_York, Europe/London, Asia/Kolkata` }, { quoted: msg });
  }
}

export async function fancyCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const text = args.join(" ").trim();
  if (!text) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.fancy [text]*\nExample: .fancy hello world" }, { quoted: msg });
    return;
  }

  const variants = [
    (s: string) => [...s].map(c => {
      const code = c.toLowerCase().charCodeAt(0) - 97;
      return code >= 0 && code < 26 ? String.fromCodePoint(0x1D400 + code) : c;
    }).join(""),
    (s: string) => [...s].map(c => {
      const code = c.toLowerCase().charCodeAt(0) - 97;
      return code >= 0 && code < 26 ? String.fromCodePoint(0x1D434 + code) : c;
    }).join(""),
    (s: string) => [...s].map(c => {
      const code = c.toLowerCase().charCodeAt(0) - 97;
      return code >= 0 && code < 26 ? String.fromCodePoint(0x1D468 + code) : c;
    }).join(""),
    (s: string) => [...s].map(c => c + "\u0336").join(""),
    (s: string) => text.split("").join(" "),
  ];

  const names = ["𝗕𝗼𝗹𝗱", "𝘐𝘵𝘢𝘭𝘪𝘤", "𝘽𝙤𝙡𝙙 𝙄𝙩𝙖𝙡𝙞𝙘", "S̶t̶r̶i̶k̶e̶", "S p a c e d"];

  const lines = variants.map((fn, i) => `*${names[i]}:* ${fn(text)}`).join("\n");
  await sock.sendMessage(jid, { text: `✨ *FANCY TEXT*\n\n${lines}` }, { quoted: msg });
}

export async function runtimeCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const ms = Date.now() - botState.startTime.getTime();
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const runtime = d > 0 ? `${d}d ${h % 24}h ${m % 60}m ${s % 60}s` : h > 0 ? `${h}h ${m % 60}m ${s % 60}s` : m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  await sock.sendMessage(jid, {
    text: `⏱️ *Bot Runtime*\n\n🕐 *Uptime:* ${runtime}\n📅 *Started:* ${botState.startTime.toLocaleString()}\n✅ *Status:* Online`,
  }, { quoted: msg });
}

export async function deviceCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const platform = process.platform;
  const arch = process.arch;
  const nodeVersion = process.version;
  const mem = process.memoryUsage();
  const totalMem = (mem.rss / 1024 / 1024).toFixed(2);
  const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(2);

  await sock.sendMessage(jid, {
    text: `📱 *BOT DEVICE INFO*\n\n💻 *Platform:* ${platform} (${arch})\n🟢 *Node.js:* ${nodeVersion}\n🧠 *Memory RSS:* ${totalMem} MB\n📦 *Heap:* ${heapUsed} / ${heapTotal} MB\n⏱️ *Uptime:* ${Math.floor(process.uptime())}s`,
  }, { quoted: msg });
}

export async function getppCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const quoted = msg.message?.extendedTextMessage?.contextInfo;
  const targetJid = quoted?.participant ?? (args[0] ? `${args[0].replace(/[^0-9]/g, "")}@s.whatsapp.net` : null);

  if (!targetJid) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.getpp @mention* or *.getpp [number]*\nOr reply to someone's message." }, { quoted: msg });
    return;
  }

  try {
    const ppUrl = await sock.profilePictureUrl(targetJid, "image");
    const res = await axios.get(ppUrl, { responseType: "arraybuffer", timeout: 10000 });
    const number = targetJid.split("@")[0];
    await sock.sendMessage(jid, {
      image: Buffer.from(res.data),
      caption: `🖼️ *Profile Picture*\n📱 +${number}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Could not get profile picture. User may have privacy settings." }, { quoted: msg });
  }
}

export async function getaboutCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const quoted = msg.message?.extendedTextMessage?.contextInfo;
  const targetJid = quoted?.participant ?? (args[0] ? `${args[0].replace(/[^0-9]/g, "")}@s.whatsapp.net` : null);
  if (!targetJid) {
    await sock.sendMessage(jid, { text: "❌ Tag or reply to someone to get their bio." }, { quoted: msg });
    return;
  }
  try {
    const status = await sock.fetchStatus(targetJid);
    const number = targetJid.split("@")[0];
    await sock.sendMessage(jid, {
      text: `📋 *User Status/Bio*\n📱 +${number}\n\n💬 _"${status?.status ?? "No status set"}"_`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Could not fetch status/bio." }, { quoted: msg });
  }
}

export async function sswebCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const url = args[0]?.trim();
  if (!url || !url.startsWith("http")) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.ssweb [URL]*\nExample: .ssweb https://google.com" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "📸 Taking screenshot..." }, { quoted: msg });
  try {
    const apiUrl = `https://api.screenshotmachine.com/?key=${process.env["SCREENSHOT_API_KEY"] ?? ""}&url=${encodeURIComponent(url)}&device=desktop&format=jpg&timeout=5`;
    if (!process.env["SCREENSHOT_API_KEY"]) {
      // Fallback: use a free screenshot API
      const res = await axios.get(`https://image.thum.io/get/width/1280/crop/800/${encodeURIComponent(url)}`, {
        responseType: "arraybuffer", timeout: 15000,
      });
      await sock.sendMessage(jid, {
        image: Buffer.from(res.data),
        caption: `📸 *Screenshot:*\n🌐 ${url}`,
      }, { quoted: msg });
    } else {
      const res = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 15000 });
      await sock.sendMessage(jid, { image: Buffer.from(res.data), caption: `📸 Screenshot of ${url}` }, { quoted: msg });
    }
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to take screenshot." }, { quoted: msg });
  }
}

export async function emojimixCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const parts = args.join(" ").split(/\+|\s+and\s+|\s+\+\s+/i);
  if (parts.length < 2) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.emojimix [emoji1] + [emoji2]*\nExample: .emojimix 😀 + 🔥" }, { quoted: msg });
    return;
  }
  const e1 = encodeURIComponent(parts[0].trim());
  const e2 = encodeURIComponent(parts[1].trim());
  await sock.sendMessage(jid, { text: "🔀 Mixing emojis..." }, { quoted: msg });
  try {
    const res = await axios.get(`https://emojimix.app/mix/${e1}+${e2}`, {
      responseType: "arraybuffer", headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000,
    });
    await sock.sendMessage(jid, {
      image: Buffer.from(res.data),
      caption: `🔀 *Emoji Mix:* ${parts[0].trim()} + ${parts[1].trim()}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Could not mix those emojis. Try different ones!" }, { quoted: msg });
  }
}

export async function flipTextCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const text = args.join(" ").trim();
  if (!text) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.fliptext [text]*" }, { quoted: msg });
    return;
  }
  const normal = "abcdefghijklmnopqrstuvwxyz";
  const flipped = "ɐqɔpǝɟƃɥıɾʞlɯuodbɹsʇnʌʍxʎz";
  const result = [...text.toLowerCase()].map(c => {
    const i = normal.indexOf(c);
    return i >= 0 ? flipped[i] : c;
  }).reverse().join("");
  await sock.sendMessage(jid, { text: `🔄 *Flipped Text:*\n\n${result}` }, { quoted: msg });
}

export async function texttopdfCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, { text: "❌ PDF generation requires additional setup. Use *.summarize* or *.code* instead for text processing." }, { quoted: msg });
}

export async function obfuscateCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const text = args.join(" ").trim();
  if (!text) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.obfuscate [text]*" }, { quoted: msg });
    return;
  }
  const result = [...text].map(c => {
    const r = Math.random();
    if (r < 0.33) return c + "\u0300";
    if (r < 0.66) return c + "\u0301";
    return c + "\u0308";
  }).join("");
  await sock.sendMessage(jid, { text: `🔀 *Obfuscated:*\n\n${result}` }, { quoted: msg });
}

export async function tourlCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const text = args.join(" ").trim();
  if (!text) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.tourl [text]*" }, { quoted: msg });
    return;
  }
  const encoded = encodeURIComponent(text);
  await sock.sendMessage(jid, { text: `🔗 *URL Encoded:*\n\n${encoded}` }, { quoted: msg });
}

export async function useridCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const quoted = msg.message?.extendedTextMessage?.contextInfo;
  const sender = quoted?.participant ?? msg.key.participant ?? (msg.key.fromMe ? sock.user?.id : msg.key.remoteJid);
  const number = sender?.split("@")[0]?.split(":")[0] ?? "unknown";
  await sock.sendMessage(jid, {
    text: `🪪 *User ID Info*\n\n📱 *JID:* ${sender}\n📞 *Number:* +${number}`,
  }, { quoted: msg });
}

export async function gsmarenaCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const query = args.join(" ").trim();
  if (!query) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.gsmarena [phone model]*\nExample: .gsmarena Samsung Galaxy S24" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: `📱 Search for "${query}" on GSMArena:\nhttps://www.gsmarena.com/search.php3?sQuickSearch=${encodeURIComponent(query)}` }, { quoted: msg });
}

export async function calculateCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const { calcCommand } = await import("./extra.js");
  await calcCommand(sock, msg, args);
}

export async function bostatusCommand(sock: WASocket, msg: WAMessage) {
  const { aliveCommand } = await import("./alive.js");
  await aliveCommand(sock, msg);
}

export async function ping2Command(sock: WASocket, msg: WAMessage) {
  const { pingCommand } = await import("./ping.js");
  await pingCommand(sock, msg);
}

export async function repoCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, {
    text: `🤖 *KANDALA MINI BOT*\n\n📦 *Repository:* https://github.com/andrewkandala732-cyber/KANDALA-MINI-BOT\n\n🌟 Star the repo if you like it!`,
  }, { quoted: msg });
}

export async function toviewonceCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, { text: "❌ View-once conversion is not supported yet." }, { quoted: msg });
}

export async function vccCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, { text: "💳 VCC generation is not available in this bot version." }, { quoted: msg });
}

export async function runEvalCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const senderJid = msg.key.participant ?? msg.key.remoteJid ?? "";
  if (!senderJid.includes(botState.ownerJid.split("@")[0]!)) {
    await sock.sendMessage(jid, { text: "❌ This command is for the owner only." }, { quoted: msg });
    return;
  }
  const code = args.join(" ");
  try {
    // eslint-disable-next-line no-new-func
    const result = await Function("sock", "msg", "botState", `"use strict"; return (async()=>{${code}})()`)(sock, msg, botState);
    await sock.sendMessage(jid, { text: `✅ Result:\n\`\`\`\n${JSON.stringify(result, null, 2)}\n\`\`\`` }, { quoted: msg });
  } catch (err) {
    await sock.sendMessage(jid, { text: `❌ Error:\n${err}` }, { quoted: msg });
  }
}

export async function filtervcfCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, { text: "📋 VCF filtering is not implemented in this version." }, { quoted: msg });
}
