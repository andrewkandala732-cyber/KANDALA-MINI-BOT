import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { botState } from "../store.js";

export async function menuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const menu = `
╔══════════════════════════════╗
║  🤖  *KANDALA MINI BOT*  🤖  ║
╚══════════════════════════════╝

> _Powered by Baileys + Telegraf_

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *GENERAL*
┣ .alive — Bot status check
┣ .ping — Check bot speed
┣ .owner — Owner contact
┗ .menu — Show this menu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 *MEDIA*
┣ .sticker — Image/video to sticker
┣ .toimg — Sticker to image
┗ .tts [text] — Text to speech

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 *DOWNLOAD*
┣ .ytmp4 [url] — YouTube video
┗ .ytmp3 [url] — YouTube audio

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 *AI TOOLS*
┣ .ai [question] — Ask AI anything
┗ .gpt [question] — GPT chat

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 *GROUP TOOLS*
┣ .tagall — Tag all members
┣ .kick @tag — Kick member
┣ .add [number] — Add member
┣ .promote @tag — Make admin
┣ .demote @tag — Remove admin
┣ .antilink on/off — Anti-link
┣ .grouplink — Get group link
┣ .revoke — Revoke group link
┣ .open — Open group
┗ .close — Close group

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 *FUN*
┣ .joke — Random joke
┣ .fact — Random fact
┣ .quote — Random quote
┗ .roast — Random roast

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 *INFO*
┣ .weather [city] — Weather info
┣ .wiki [query] — Wikipedia
┣ .calc [expr] — Calculator
┣ .define [word] — Dictionary
┗ .translate [lang] [text]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Prefix:* .  |  👤 *Owner:* wa.me/254743760083
`;
  await sock.sendMessage(jid, { text: menu }, { quoted: msg });
}
