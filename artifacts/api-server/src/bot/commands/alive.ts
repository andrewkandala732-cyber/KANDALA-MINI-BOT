import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { botState } from "../store.js";

const BOT_IMAGE_URL = "https://files.catbox.moe/pht92g.jpg";

export async function aliveCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const uptime = getUptime();
  const mode = botState.botSettings.mode;
  const modeIcon = mode === "public" ? "🌍" : mode === "group" ? "👥" : "🔒";
  const caption = `
✅ *${botState.botName} is ALIVE!*

🤖 *Bot Name:* ${botState.botName}
⚡ *Status:* Online & Ready
🕐 *Uptime:* ${uptime}
${modeIcon} *Mode:* ${mode.toUpperCase()}
🔤 *Prefix:* ${botState.botSettings.prefix}
📅 *Started:* ${botState.startTime.toLocaleString()}
🔗 *Owner:* wa.me/${botState.botSettings.ownerNumber}

> _All systems operational_ 🚀
`.trim();

  try {
    await sock.sendMessage(jid, {
      image: { url: BOT_IMAGE_URL },
      caption,
    }, { quoted: msg });
  } catch {
    // Fallback to text if image fails
    await sock.sendMessage(jid, { text: caption }, { quoted: msg });
  }
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
