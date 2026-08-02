import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";
import { botState } from "../store.js";

function reply(sock: WASocket, msg: WAMessage, text: string) {
  return sock.sendMessage(msg.key.remoteJid!, { text }, { quoted: msg });
}

// ── QR Code ─────────────────────────────────────────────────────────────────
export async function qrcodeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.qrcode [text/url]*\nExample: .qrcode https://wa.me/254743760083");
  const text = args.join(" ");
  try {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(text)}`;
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
    await sock.sendMessage(msg.key.remoteJid!, {
      image: Buffer.from(res.data),
      caption: `📱 *QR CODE*\n📝 Content: ${text}`,
    }, { quoted: msg });
  } catch { await reply(sock, msg, "❌ Failed to generate QR code."); }
}

// ── Fancy Text ───────────────────────────────────────────────────────────────
const fancyMap: Record<string, string> = {
  a: "𝒶", b: "𝒷", c: "𝒸", d: "𝒹", e: "𝑒", f: "𝒻", g: "𝑔", h: "𝒽",
  i: "𝒾", j: "𝒿", k: "𝓀", l: "𝓁", m: "𝓂", n: "𝓃", o: "𝑜", p: "𝓅",
  q: "𝓆", r: "𝓇", s: "𝓈", t: "𝓉", u: "𝓊", v: "𝓋", w: "𝓌", x: "𝓍",
  y: "𝓎", z: "𝓏", A: "𝒜", B: "𝐵", C: "𝒞", D: "𝒟", E: "𝐸", F: "𝐹",
  G: "𝒢", H: "𝐻", I: "𝐼", J: "𝒥", K: "𝒦", L: "𝐿", M: "𝑀", N: "𝒩",
  O: "𝒪", P: "𝒫", Q: "𝒬", R: "𝑅", S: "𝒮", T: "𝒯", U: "𝒰", V: "𝒱",
  W: "𝒲", X: "𝒳", Y: "𝒴", Z: "𝒵",
};

export async function fancyCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.fancy [text]*\nExample: .fancy KANDALA MINI BOT");
  const text = args.join(" ");
  const fancy = text.split("").map(c => fancyMap[c] || c).join("");
  await reply(sock, msg, `✨ *FANCY TEXT*\n\n${fancy}`);
}

// ── Flip Text ────────────────────────────────────────────────────────────────
const flipMap: Record<string, string> = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ",
  i: "ı", j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d",
  q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x",
  y: "ʎ", z: "z", A: "∀", B: "𐐒", C: "Ɔ", D: "ᗡ", E: "Ǝ", F: "Ⅎ",
  G: "⅁", H: "H", I: "I", J: "ſ", K: "⋊", L: "⅂", M: "W", N: "N",
  O: "O", P: "Ԁ", Q: "Q", R: "ᴚ", S: "S", T: "⊥", U: "∩", V: "Λ",
  W: "M", X: "X", Y: "⅄", Z: "Z", "1": "Ɩ", "2": "ᄅ", "3": "Ɛ",
  "4": "ㄣ", "5": "ϛ", "6": "9", "7": "L", "8": "8", "9": "6",
  "0": "0", ".": "˙", ",": "'", "?": "¿", "!": "¡",
};

export async function fliptextCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.fliptext [text]*\nExample: .fliptext Hello World");
  const text = args.join(" ");
  const flipped = text.split("").map(c => flipMap[c] || c).reverse().join("");
  await reply(sock, msg, `🙃 *FLIPPED TEXT*\n\n${flipped}`);
}

// ── Password Generator ───────────────────────────────────────────────────────
export async function genpassCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const length = Math.min(Math.max(parseInt(args[0]) || 16, 8), 64);
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
  let password = "";
  for (let i = 0; i < length; i++) password += chars[Math.floor(Math.random() * chars.length)];
  await reply(sock, msg,
    `🔐 *PASSWORD GENERATOR*\n\n` +
    `Length: ${length} characters\n\n` +
    `🗝️ \`${password}\`\n\n` +
    `_⚠️ Save this password securely! Never share it._`
  );
}

// ── Get Profile Picture ──────────────────────────────────────────────────────
export async function getppCommand(sock: WASocket, msg: WAMessage) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
  const target = (mentioned && mentioned[0]) || quoted;
  
  if (!target) return reply(sock, msg, "Usage: *.getpp @mention* or reply to someone's message with .getpp");
  
  try {
    const ppUrl = await sock.profilePictureUrl(target, "image");
    const res = await axios.get(ppUrl, { responseType: "arraybuffer", timeout: 15000 });
    const jid = target.split("@")[0];
    await sock.sendMessage(msg.key.remoteJid!, {
      image: Buffer.from(res.data),
      caption: `👤 *Profile Picture*\n📱 +${jid}`,
    }, { quoted: msg });
  } catch {
    await reply(sock, msg, "❌ Could not get profile picture. The user may have privacy settings enabled.");
  }
}

// ── Get About/Status ─────────────────────────────────────────────────────────
export async function getaboutCommand(sock: WASocket, msg: WAMessage) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
  const target = (mentioned && mentioned[0]) || quoted;
  
  if (!target) return reply(sock, msg, "Usage: *.getabout @mention* or reply to someone's message");
  
  try {
    const status = await sock.fetchStatus(target);
    const jid = target.split("@")[0];
    await reply(sock, msg,
      `📋 *USER STATUS*\n\n👤 Number: +${jid}\n📝 About: ${status?.status || "No status set"}`
    );
  } catch {
    await reply(sock, msg, "❌ Could not fetch user status. Privacy settings may be enabled.");
  }
}

// ── Emoji Mix ────────────────────────────────────────────────────────────────
export async function emojimixCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (args.length < 2) return reply(sock, msg, "Usage: *.emojimix [emoji1] [emoji2]*\nExample: .emojimix 😀 🔥");
  const [e1, e2] = args;
  try {
    const codepoint1 = [...e1][0]?.codePointAt(0)?.toString(16);
    const codepoint2 = [...e2][0]?.codePointAt(0)?.toString(16);
    if (!codepoint1 || !codepoint2) return reply(sock, msg, "❌ Please use valid emojis.");
    
    const url = `https://www.gstatic.com/android/keyboard/emojikitchen/20230301/u${codepoint1}/u${codepoint1}_u${codepoint2}.png`;
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
    await sock.sendMessage(msg.key.remoteJid!, {
      image: Buffer.from(res.data),
      caption: `🎨 *EMOJI MIX*\n${e1} + ${e2} = ?`,
    }, { quoted: msg });
  } catch {
    await reply(sock, msg, `🎨 *EMOJI MIX*\n${e1} + ${e2} = ${e1}${e2}✨\n\n_Visual mix not available for this combination_`);
  }
}

// ── TinyURL ──────────────────────────────────────────────────────────────────
export async function tinyurlCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.tinyurl [url]*\nExample: .tinyurl https://google.com");
  const url = args[0];
  try {
    const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 10000 });
    await reply(sock, msg, `🔗 *URL SHORTENER*\n\n📎 Original: ${url}\n✂️ Short: ${res.data}`);
  } catch { await reply(sock, msg, "❌ Failed to shorten URL."); }
}

// ── Runtime / Time ───────────────────────────────────────────────────────────
export async function runtimeCommand(sock: WASocket, msg: WAMessage) {
  const uptime = Date.now() - botState.startTime.getTime();
  const days = Math.floor(uptime / 86400000);
  const hours = Math.floor((uptime % 86400000) / 3600000);
  const minutes = Math.floor((uptime % 3600000) / 60000);
  const seconds = Math.floor((uptime % 60000) / 1000);
  await reply(sock, msg,
    `⏱️ *BOT RUNTIME*\n\n🕐 ${days}d ${hours}h ${minutes}m ${seconds}s\n📅 Started: ${botState.startTime.toLocaleString()}`
  );
}

export async function timeCommand(sock: WASocket, msg: WAMessage) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-KE", { timeZone: "Africa/Nairobi", hour12: true });
  const dateStr = now.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", weekday: "long", year: "numeric", month: "long", day: "numeric" });
  await reply(sock, msg, `🕐 *CURRENT TIME*\n\n⏰ ${timeStr}\n📅 ${dateStr}\n🌍 Timezone: Africa/Nairobi (EAT)`);
}

export async function botstatusCommand(sock: WASocket, msg: WAMessage) {
  const uptime = Date.now() - botState.startTime.getTime();
  const hours = Math.floor(uptime / 3600000);
  const minutes = Math.floor((uptime % 3600000) / 60000);
  await reply(sock, msg,
    `🤖 *BOT STATUS*\n\n` +
    `📛 Name: ${botState.botName}\n` +
    `🟢 Status: ${botState.isConnected ? "Connected" : "Disconnected"}\n` +
    `⏱️ Uptime: ${hours}h ${minutes}m\n` +
    `👤 Owner: wa.me/254743760083\n` +
    `📡 Platform: WhatsApp (Baileys)\n` +
    `🔧 Version: 1.0.0`
  );
}

export async function repoCommand(sock: WASocket, msg: WAMessage) {
  await reply(sock, msg,
    `📂 *BOT REPOSITORY*\n\n` +
    `🤖 Bot: KANDALA MINI BOT\n` +
    `🔗 GitHub: https://github.com/andrewkandala732-cyber/KANDALA-MINI-BOT\n` +
    `👨‍💻 Developer: KANDALA\n` +
    `⭐ Give it a star if you like it!\n\n` +
    `_Built with Baileys + Express + Telegraf_`
  );
}

export async function ping2Command(sock: WASocket, msg: WAMessage) {
  const start = Date.now();
  const sent = await sock.sendMessage(msg.key.remoteJid!, { text: "🏓 Pong!" }, { quoted: msg });
  const ping = Date.now() - start;
  await sock.sendMessage(msg.key.remoteJid!, {
    text: `🏓 *PONG!*\n\n⚡ Speed: ${ping}ms\n🟢 Status: Online\n🤖 Bot: ${botState.botName}`,
  }, { quoted: msg });
}

export async function deviceCommand(sock: WASocket, msg: WAMessage) {
  await reply(sock, msg,
    `📱 *BOT DEVICE INFO*\n\n` +
    `🤖 Bot Name: ${botState.botName}\n` +
    `📡 Platform: WhatsApp Web (Baileys)\n` +
    `🌐 Browser: Ubuntu Chrome\n` +
    `💾 Session: Multi-File Auth\n` +
    `🔗 Mode: Linked Device (Pairing Code)\n` +
    `⚙️ Engine: Node.js + TypeScript`
  );
}

export async function useridCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const senderJid = msg.key.participant || (msg.key.fromMe ? sock.user?.id : jid) || jid;
  const number = senderJid.split("@")[0]?.split(":")[0];
  await reply(sock, msg,
    `🆔 *USER ID*\n\n` +
    `📱 Number: +${number}\n` +
    `🔑 JID: ${senderJid}\n` +
    `💬 Chat: ${jid}`
  );
}
