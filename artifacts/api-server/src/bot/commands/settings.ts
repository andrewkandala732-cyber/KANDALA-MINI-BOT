import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { botState, getGroupSettings } from "../store.js";

function isOwner(msg: WAMessage, sock: WASocket): boolean {
  const sender = msg.key.participant ?? msg.key.remoteJid ?? "";
  return sender.includes(botState.ownerJid.split("@")[0]!);
}

export async function modeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!isOwner(msg, sock)) return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  const mode = args[0]?.toLowerCase() as "public" | "group" | "private";
  if (!["public", "group", "private"].includes(mode)) {
    await sock.sendMessage(jid, {
      text: `⚙️ *Bot Mode*\n\n*Current:* ${botState.botSettings.mode}\n\nUsage: *.mode [public/group/private]*\n\n• public — responds to everyone\n• group — groups only\n• private — owner only`,
    }, { quoted: msg });
    return;
  }
  botState.botSettings.mode = mode;
  await sock.sendMessage(jid, { text: `✅ Bot mode set to: *${mode.toUpperCase()}*` }, { quoted: msg });
}

export async function getsettingsCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const s = botState.botSettings;
  await sock.sendMessage(jid, {
    text: `⚙️ *Bot Settings*\n\n🤖 *Name:* ${s.botName}\n👤 *Owner:* ${s.ownerName}\n📌 *Mode:* ${s.mode}\n🔤 *Prefix:* ${s.prefix}\n🌍 *Timezone:* ${s.timezone}\n📛 *Sticker Pack:* ${s.stickerPackName}\n✍️ *Author:* ${s.stickerAuthor}\n💧 *Watermark:* ${s.watermark}`,
  }, { quoted: msg });
}

export async function setbotnameCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!isOwner(msg, sock)) return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  const name = args.join(" ").trim();
  if (!name) return sock.sendMessage(jid, { text: "❌ Usage: *.setbotname [name]*" }, { quoted: msg });
  botState.botSettings.botName = name;
  botState.botName = name;
  await sock.sendMessage(jid, { text: `✅ Bot name set to: *${name}*` }, { quoted: msg });
}

export async function setownernameCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!isOwner(msg, sock)) return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  const name = args.join(" ").trim();
  if (!name) return sock.sendMessage(jid, { text: "❌ Usage: *.setownername [name]*" }, { quoted: msg });
  botState.botSettings.ownerName = name;
  await sock.sendMessage(jid, { text: `✅ Owner name set to: *${name}*` }, { quoted: msg });
}

export async function setownernumberCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!isOwner(msg, sock)) return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  const num = args[0]?.replace(/[^0-9]/g, "");
  if (!num) return sock.sendMessage(jid, { text: "❌ Usage: *.setownernumber [number]*" }, { quoted: msg });
  botState.botSettings.ownerNumber = num;
  botState.ownerJid = `${num}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text: `✅ Owner number set to: +${num}` }, { quoted: msg });
}

export async function setprefixCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!isOwner(msg, sock)) return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  const prefix = args[0]?.trim();
  if (!prefix) return sock.sendMessage(jid, { text: "❌ Usage: *.setprefix [prefix]*\nExample: .setprefix !" }, { quoted: msg });
  botState.botSettings.prefix = prefix;
  await sock.sendMessage(jid, { text: `✅ Bot prefix set to: *${prefix}*\n\n_Note: Commands now use ${prefix}menu, ${prefix}ping, etc._` }, { quoted: msg });
}

export async function settimezoneCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!isOwner(msg, sock)) return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  const tz = args.join(" ").trim();
  if (!tz) return sock.sendMessage(jid, { text: "❌ Usage: *.settimezone [timezone]*\nExample: .settimezone Africa/Nairobi" }, { quoted: msg });
  try {
    new Date().toLocaleString("en-US", { timeZone: tz });
    botState.botSettings.timezone = tz;
    await sock.sendMessage(jid, { text: `✅ Timezone set to: *${tz}*` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: `❌ Invalid timezone: "${tz}"\nExamples: Africa/Nairobi, America/New_York, Asia/Kolkata` }, { quoted: msg });
  }
}

export async function setstatusemojiCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!isOwner(msg, sock)) return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  const emoji = args[0]?.trim();
  if (!emoji) return sock.sendMessage(jid, { text: "❌ Usage: *.setstatusemoji [emoji]*" }, { quoted: msg });
  botState.botSettings.statusEmoji = emoji;
  await sock.sendMessage(jid, { text: `✅ Status emoji set to: ${emoji}` }, { quoted: msg });
}

export async function setwatermarkCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!isOwner(msg, sock)) return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  const wm = args.join(" ").trim();
  if (!wm) return sock.sendMessage(jid, { text: "❌ Usage: *.setwatermark [text]*" }, { quoted: msg });
  botState.botSettings.watermark = wm;
  await sock.sendMessage(jid, { text: `✅ Watermark set to: *${wm}*` }, { quoted: msg });
}

export async function setstickerpacknameCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!isOwner(msg, sock)) return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  const name = args.join(" ").trim();
  if (!name) return sock.sendMessage(jid, { text: "❌ Usage: *.setstickerpackname [name]*" }, { quoted: msg });
  botState.botSettings.stickerPackName = name;
  await sock.sendMessage(jid, { text: `✅ Sticker pack name set to: *${name}*` }, { quoted: msg });
}

export async function setstickerauthorCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!isOwner(msg, sock)) return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  const author = args.join(" ").trim();
  if (!author) return sock.sendMessage(jid, { text: "❌ Usage: *.setstickerauthor [author]*" }, { quoted: msg });
  botState.botSettings.stickerAuthor = author;
  await sock.sendMessage(jid, { text: `✅ Sticker author set to: *${author}*` }, { quoted: msg });
}

// Stub settings commands
const stubOwnerOnly = (label: string) => async (sock: WASocket, msg: WAMessage, args: string[]) => {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, { text: `⚙️ *${label}*: This setting is noted but advanced config is not yet implemented.` }, { quoted: msg });
};

export const autoreactCommand = stubOwnerOnly("Auto-React");
export const autoreadCommand = stubOwnerOnly("Auto-Read");
export const autorecordCommand = stubOwnerOnly("Auto-Record");
export const autotypeCommand = stubOwnerOnly("Auto-Type");
export const autoviewstatusCommand = stubOwnerOnly("Auto-View-Status");
export const alwaysonlineCommand = stubOwnerOnly("Always-Online");
export const autoblockCommand = stubOwnerOnly("Auto-Block");
export const chatbotCommand = stubOwnerOnly("Chatbot");
export const antibugCommand = stubOwnerOnly("Anti-Bug");
export const anticallCommand = stubOwnerOnly("Anti-Call");
export const antideleteCommand = stubOwnerOnly("Anti-Delete");
export const antieditCommand = stubOwnerOnly("Anti-Edit");
export const antiviewonceCommand = stubOwnerOnly("Anti-View-Once");
export const autobioCommand = stubOwnerOnly("Auto-Bio");
export const autoreactstatusCommand = stubOwnerOnly("Auto-React-Status");
export const statusdelayCommand = stubOwnerOnly("Status-Delay");
export const statussettingsCommand = stubOwnerOnly("Status-Settings");
export const addmenuvideooCommand = stubOwnerOnly("Add-Menu-Video");
export const addmenuvideo = stubOwnerOnly("Add-Menu-Video");
export const setmenuCommand = stubOwnerOnly("Set-Menu");
export const addmenuimageCommand = stubOwnerOnly("Add-Menu-Image");
export const clearmenuimagesCommand = stubOwnerOnly("Clear-Menu-Images");
export const clearmenuvideoCommand = stubOwnerOnly("Clear-Menu-Videos");
export const setcontextlinkCommand = stubOwnerOnly("Set-Context-Link");
export const addbadwordCommand = stubOwnerOnly("Add-Bad-Word");
export const deletebadwordCommand = stubOwnerOnly("Delete-Bad-Word");
export const listbadwordCommand = stubOwnerOnly("List-Bad-Word");
export const addcountrycodeCommand = stubOwnerOnly("Add-Country-Code");
export const delcountrycodeCommand = stubOwnerOnly("Del-Country-Code");
export const listcountrycodeCommand = stubOwnerOnly("List-Country-Code");
export const addignorepCommand = stubOwnerOnly("Add-Ignore");
export const delignorepCommand = stubOwnerOnly("Del-Ignore");
export const listignorepCommand = stubOwnerOnly("List-Ignore");
export const addignorelistCommand = stubOwnerOnly("Add-Ignore-List");
export const delignorelistCommand = stubOwnerOnly("Del-Ignore-List");
export const listignorelistCommand = stubOwnerOnly("List-Ignore-List");
export const addsudoCommand = stubOwnerOnly("Add-Sudo");
export const delsudoCommand = stubOwnerOnly("Del-Sudo");
export const listsudoCommand = stubOwnerOnly("List-Sudo");
export const resetsettingCommand = stubOwnerOnly("Reset-Setting");
export const setwarnCommand = stubOwnerOnly("Set-Warn");
export const listwarnCommand = stubOwnerOnly("List-Warn");
export const resetwarnCommand = stubOwnerOnly("Reset-Warn");
export const setfontCommand = stubOwnerOnly("Set-Font");
export const delanticallmsgCommand = stubOwnerOnly("Del-Anti-Call-Msg");
export const setanticallmsgCommand = stubOwnerOnly("Set-Anti-Call-Msg");
export const showanticallmsgCommand = stubOwnerOnly("Show-Anti-Call-Msg");
export const testanticallmsgCommand = stubOwnerOnly("Test-Anti-Call-Msg");
export const delwelcomeCommand = stubOwnerOnly("Del-Welcome");
export const delgoodbyeCommand = stubOwnerOnly("Del-Goodbye");
export const showwelcomeCommand = stubOwnerOnly("Show-Welcome");
export const showgoodbyeCommand = stubOwnerOnly("Show-Goodbye");
export const testwelcomeCommand = stubOwnerOnly("Test-Welcome");
export const testgoodbyeCommand = stubOwnerOnly("Test-Goodbye");
export const setwelcomeimageCommand = stubOwnerOnly("Set-Welcome-Image");
export const setwelcomevideo = stubOwnerOnly("Set-Welcome-Video");
export const setgoodbyeimageCommand = stubOwnerOnly("Set-Goodbye-Image");
export const setgoodbyevideo = stubOwnerOnly("Set-Goodbye-Video");
export const setmenuvideo = stubOwnerOnly("Set-Menu-Video");
export const setmenuimage = stubOwnerOnly("Set-Menu-Image");
