import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { botState } from "../store.js";

function replyText(sock: WASocket, jid: string, msg: WAMessage, text: string) {
  return sock.sendMessage(jid, { text }, { quoted: msg });
}

export async function ephoto360menuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const list = `┏▣ ◈ *EPHOTO360 MENU* ◈
│➽ 1917style
│➽ advancedglow
│➽ blackpinklogo
│➽ blackpinkstyle
│➽ cartoonstyle
│➽ deletingtext
│➽ dragonball
│➽ effectclouds
│➽ flag3dtext
│➽ flagtext
│➽ freecreate
│➽ galaxystyle
│➽ galaxywallpaper
│➽ glitchtext
│➽ glowingtext
│➽ gradienttext
│➽ graffiti
│➽ incandescent
│➽ lighteffects
│➽ logomaker
│➽ luxurygold
│➽ makingneon
│➽ matrix
│➽ multicoloredneon
│➽ neonglitch
│➽ papercutstyle
│➽ pixelglitch
│➽ royaltext
│➽ sand
│➽ summerbeach
│➽ topography
│➽ typography
│➽ watercolortext
│➽ writetext
┗▣\n
Note: These effects require an external image-effect API or key. Use *.` + botState.botSettings.prefix + `ephoto360 <effect> <text/image>* once configured.`;
  return replyText(sock, jid, msg, list);
}

export async function apkCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  return replyText(sock, jid, msg, "🔧 APK download is not implemented. Use .downloadmenu for alternatives.");
}

export async function downloadCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  return replyText(sock, jid, msg, "🔎 Use .ytmp3/.ytmp4 for media downloads. For other downloads, this feature needs configuring.");
}

export async function gdriveCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  return replyText(sock, jid, msg, "📁 GDrive downloader not configured. Please provide a valid GDrive link and ensure the downloader is enabled.");
}

export async function gitcloneCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const repo = args.join(" ") || "<repo-url>";
  return replyText(sock, jid, msg, `📥 To clone a repo, run on your machine: git clone ${repo}`);
}

export async function igaudioCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  return replyText(sock, jid, msg, "🎵 Instagram audio download is not implemented here.");
}

export async function itunesCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  return replyText(sock, jid, msg, "🍎 iTunes search is not available. Try using .search or provide an external API key.");
}

export async function mediafireCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  return replyText(sock, jid, msg, "📤 MediaFire downloads require additional parsing — not configured.");
}

export async function pinCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  return replyText(sock, jid, msg, "📌 Pin is not supported in WhatsApp via Baileys. You can save the message locally.");
}

export async function savestatusCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  return replyText(sock, jid, msg, "💾 Save status is unavailable. This requires a status-scraping service.");
}

export async function telestickerCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  return replyText(sock, jid, msg, "📎 Telesticker integration not configured.");
}

export async function xvideoCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  return replyText(sock, jid, msg, "🔞 XVideo downloads are not supported.");
}

export async function addcodeCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ addcode not configured."); }
export async function allowCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ allow not configured."); }
export async function groupstatusPickerCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ Group status picker not configured."); }
export async function fetchgroupsCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ fetchgroups not configured."); }
export async function tosgroupCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ tosgroup not configured."); }

export async function autosavestatusCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ autosavestatus not configured."); }
export async function azaCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ aza not configured."); }
export async function deljunkCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ deljunk not configured."); }
export async function delstickercmdCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ delstickercmd not configured."); }
export async function dlvoCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ dlvo not configured."); }
export async function gcaddprivacyCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ gcaddprivacy not configured."); }

export async function hostipCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return replyText(sock, jid, msg, `🌐 Host public IP: ${data.ip}`);
  } catch {
    return replyText(sock, jid, msg, "❌ Could not fetch host IP.");
  }
}

export async function lastseenCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "👀 lastseen not available."); }
export async function listbadwordCommand(sock: WASocket, msg: WAMessage) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ No badword list available."); }
export async function listignorelistCommand(sock: WASocket, msg: WAMessage) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ No ignore list configured."); }
export async function listsudoCommand(sock: WASocket, msg: WAMessage) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ No sudo list configured."); }
export async function modestatusCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ modestatus not configured."); }
export async function ppprivacyCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ ppprivacy not configured."); }
export async function readreceiptsCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ readreceipts not configurable via bot."); }

export async function filtervcfCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "📇 filtervcf not implemented."); }
export async function gsmarenaCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "📱 gsmarena lookup not implemented."); }
export async function obfuscateCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const text = args.join(" ") || "";
  if (!text) return replyText(sock, jid, msg, "Usage: .obfuscate <text>");
  const ob = text.split("").map(ch => `\\u${ch.charCodeAt(0).toString(16)}`).join("");
  return replyText(sock, jid, msg, `Obfuscated: ${ob}`);
}

export async function runevalCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  return replyText(sock, msg.key.remoteJid!, msg, "⚠️ runeval is disabled for safety reasons.");
}

export async function sayCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const text = args.join(" ") || "";
  if (!text) return replyText(sock, jid, msg, "Usage: .say <message>");
  return replyText(sock, jid, msg, text);
}

export async function sswebCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "📸 ssweb not implemented."); }
export async function sswebpcCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "📸 sswebpc not implemented."); }
export async function sswebtabCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "📸 sswebtab not implemented."); }

export async function takeCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "⚙️ take not implemented."); }
export async function texttopdfCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "📄 texttopdf not implemented."); }
export async function tourlCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "🔗 tourl not implemented."); }
export async function toviewonceCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "🔒 toviewonce not implemented."); }
export async function vccCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "💳 vcc not implemented."); }
export async function volvideoCommand(sock: WASocket, msg: WAMessage, args: string[]) { return replyText(sock, msg.key.remoteJid!, msg, "🔊 volvideo not implemented."); }
