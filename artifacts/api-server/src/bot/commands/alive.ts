import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { botState } from "../store.js";

export async function aliveCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const uptime = getUptime();
  const text = `
✅ *KANDALA MINI BOT is ALIVE!*

🤖 *Bot Name:* ${botState.botName}
⚡ *Status:* Online
🕐 *Uptime:* ${uptime}
📅 *Started:* ${botState.startTime.toLocaleString()}
🔗 *Owner:* wa.me/254743760083

> _All systems operational_ 🚀
`;
  await sock.sendMessage(jid, { text }, { quoted: msg });
}

function getUptime(): string {
  const ms = Date.now() - botState.startTime.getTime();
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
