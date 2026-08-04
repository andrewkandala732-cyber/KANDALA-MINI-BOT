import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { botState, isOwnerOrSudo } from "../store.js";

// ── helpers ───────────────────────────────────────────────────────────────────

function getSender(msg: WAMessage): string {
  return msg.key.participant ?? msg.key.remoteJid ?? "";
}

function isOwner(msg: WAMessage): boolean {
  return getSender(msg).includes(botState.ownerJid.split("@")[0]!);
}

function isSudo(msg: WAMessage): boolean {
  return isOwnerOrSudo(getSender(msg));
}

function toggleReply(sock: WASocket, msg: WAMessage, feature: string, state: boolean) {
  const icon = state ? "✅" : "❌";
  return sock.sendMessage(msg.key.remoteJid!, {
    text: `${icon} *${feature}* has been turned *${state ? "ON" : "OFF"}*.`,
  }, { quoted: msg });
}

function ownerOnly(sock: WASocket, msg: WAMessage) {
  return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Owner only command." }, { quoted: msg });
}

function sudoOnly(sock: WASocket, msg: WAMessage) {
  return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Owner/sudo only command." }, { quoted: msg });
}

// ── Mode & general settings ───────────────────────────────────────────────────

export async function modeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const jid = msg.key.remoteJid!;
  const mode = args[0]?.toLowerCase() as "public" | "group" | "private";
  if (!["public", "group", "private"].includes(mode)) {
    return sock.sendMessage(jid, {
      text: `⚙️ *Bot Mode*\n\n*Current:* ${botState.botSettings.mode}\n\nUsage: *.mode [public/group/private]*\n\n🌍 *public* — anyone can use the bot\n👥 *group* — groups only (owner can DM)\n🔒 *private* — owner only`,
    }, { quoted: msg });
  }
  botState.botSettings.mode = mode;
  const icons: Record<string, string> = { public: "🌍", group: "👥", private: "🔒" };
  return sock.sendMessage(jid, { text: `${icons[mode]} Bot mode set to *${mode.toUpperCase()}*` }, { quoted: msg });
}

export async function getsettingsCommand(sock: WASocket, msg: WAMessage) {
  const s = botState.botSettings;
  const on = (v: boolean) => (v ? "✅ ON" : "❌ OFF");
  return sock.sendMessage(msg.key.remoteJid!, {
    text: `⚙️ *BOT SETTINGS*\n\n` +
      `🤖 *Name:* ${s.botName}\n👤 *Owner:* ${s.ownerName}\n🔤 *Prefix:* ${s.prefix}\n` +
      `🌍 *Mode:* ${s.mode}\n🕐 *Timezone:* ${s.timezone}\n` +
      `💧 *Watermark:* ${s.watermark}\n\n` +
      `*── AUTO FEATURES ──*\n` +
      `▸ Always Online: ${on(s.alwaysOnline)}\n` +
      `▸ Auto Read: ${on(s.autoRead)}\n` +
      `▸ Auto React: ${on(s.autoReact)} ${s.autoReact ? s.autoReactEmoji : ""}\n` +
      `▸ Auto React Status: ${on(s.autoReactStatus)} ${s.autoReactStatus ? s.autoReactStatusEmoji : ""}\n` +
      `▸ Auto Record: ${on(s.autoRecord)}\n` +
      `▸ Auto Record Typing: ${on(s.autoRecordTyping)}\n` +
      `▸ Auto Block: ${on(s.autoblock)}\n` +
      `▸ Auto Bio: ${on(s.autoBio)}${s.autoBio ? ` "${s.autoBioText}"` : ""}\n\n` +
      `*── ANTI FEATURES ──*\n` +
      `▸ Anti Call: ${on(s.antiCall)}\n` +
      `▸ Anti Delete: ${on(s.antiDelete)}\n` +
      `▸ Anti Delete Status: ${on(s.antiDeleteStatus)}\n` +
      `▸ Anti Edit: ${on(s.antiEdit)}\n` +
      `▸ Anti View Once: ${on(s.antiViewOnce)}\n` +
      `▸ Anti Bug: ${on(s.antiBug)}\n\n` +
      `*── LISTS ──*\n` +
      `▸ Bad Words: ${s.badWords.length}\n` +
      `▸ Country Codes: ${s.countryCodes.length ? s.countryCodes.join(", ") : "none"}\n` +
      `▸ Ignore List: ${s.ignoreList.length}\n` +
      `▸ Sudo List: ${s.sudoList.length}`,
  }, { quoted: msg });
}

export async function setbotnameCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const name = args.join(" ").trim();
  if (!name) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.setbotname [name]*" }, { quoted: msg });
  botState.botSettings.botName = name;
  botState.botName = name;
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Bot name set to *${name}*` }, { quoted: msg });
}

export async function setownernameCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const name = args.join(" ").trim();
  if (!name) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.setownername [name]*" }, { quoted: msg });
  botState.botSettings.ownerName = name;
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Owner name set to *${name}*` }, { quoted: msg });
}

export async function setownernumberCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const num = args[0]?.replace(/[^0-9]/g, "");
  if (!num) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.setownernumber [number]*" }, { quoted: msg });
  botState.botSettings.ownerNumber = num;
  botState.ownerJid = `${num}@s.whatsapp.net`;
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Owner number set to *+${num}*` }, { quoted: msg });
}

export async function setprefixCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const prefix = args[0]?.trim();
  if (!prefix) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.setprefix [prefix]*" }, { quoted: msg });
  botState.botSettings.prefix = prefix;
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Prefix set to *${prefix}*\n\nCommands: ${prefix}menu, ${prefix}ping, etc.` }, { quoted: msg });
}

export async function settimezoneCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const tz = args.join(" ").trim();
  if (!tz) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.settimezone [tz]*\nExample: .settimezone Africa/Nairobi" }, { quoted: msg });
  try {
    new Date().toLocaleString("en-US", { timeZone: tz });
    botState.botSettings.timezone = tz;
    return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Timezone set to *${tz}*` }, { quoted: msg });
  } catch {
    return sock.sendMessage(msg.key.remoteJid!, { text: `❌ Invalid timezone. Examples: Africa/Nairobi, America/New_York` }, { quoted: msg });
  }
}

export async function setstatusemojiCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isSudo(msg)) return sudoOnly(sock, msg);
  const emoji = args[0]?.trim();
  if (!emoji) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.setstatusemoji [emoji]*" }, { quoted: msg });
  botState.botSettings.statusEmoji = emoji;
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Status emoji set to ${emoji}` }, { quoted: msg });
}

export async function setwatermarkCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isSudo(msg)) return sudoOnly(sock, msg);
  const wm = args.join(" ").trim();
  if (!wm) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.setwatermark [text]*" }, { quoted: msg });
  botState.botSettings.watermark = wm;
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Watermark set to *${wm}*` }, { quoted: msg });
}

export async function setstickerpacknameCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isSudo(msg)) return sudoOnly(sock, msg);
  const name = args.join(" ").trim();
  if (!name) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.setstickerpackname [name]*" }, { quoted: msg });
  botState.botSettings.stickerPackName = name;
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Sticker pack name set to *${name}*` }, { quoted: msg });
}

export async function setstickerauthorCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isSudo(msg)) return sudoOnly(sock, msg);
  const author = args.join(" ").trim();
  if (!author) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.setstickerauthor [author]*" }, { quoted: msg });
  botState.botSettings.stickerAuthor = author;
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Sticker author set to *${author}*` }, { quoted: msg });
}

// ── Always Online ─────────────────────────────────────────────────────────────

export async function alwaysonlineCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const val = args[0]?.toLowerCase();
  if (!val || !["on","off"].includes(val)) {
    return sock.sendMessage(msg.key.remoteJid!, {
      text: `⚡ *Always Online*\nCurrent: ${botState.botSettings.alwaysOnline ? "✅ ON" : "❌ OFF"}\n\nUsage: *.alwaysonline on/off*`,
    }, { quoted: msg });
  }
  const state = val === "on";
  botState.botSettings.alwaysOnline = state;
  if (state && botState.sock) {
    await botState.sock.sendPresenceUpdate("available").catch(() => {});
  }
  return toggleReply(sock, msg, "Always Online", state);
}

// ── Anti Call ─────────────────────────────────────────────────────────────────

export async function anticallCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const val = args[0]?.toLowerCase();
  if (!val || !["on","off"].includes(val)) {
    return sock.sendMessage(msg.key.remoteJid!, {
      text: `📵 *Anti Call*\nCurrent: ${botState.botSettings.antiCall ? "✅ ON" : "❌ OFF"}\n\nUsage: *.anticall on/off*\n\nWhen ON, incoming calls are auto-rejected and the caller receives a message.`,
    }, { quoted: msg });
  }
  botState.botSettings.antiCall = val === "on";
  return toggleReply(sock, msg, "Anti Call", val === "on");
}

export async function setanticallmsgCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const text = args.join(" ").trim();
  if (!text) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.setanticallmsg [message]*" }, { quoted: msg });
  botState.botSettings.antiCallMessage = text;
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Anti-call message set:\n_"${text}"_` }, { quoted: msg });
}

// ── Anti Delete ───────────────────────────────────────────────────────────────

export async function antideleteCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const val = args[0]?.toLowerCase();
  if (!val || !["on","off"].includes(val)) {
    return sock.sendMessage(msg.key.remoteJid!, {
      text: `🗑️ *Anti Delete*\nCurrent: ${botState.botSettings.antiDelete ? "✅ ON" : "❌ OFF"}\n\nUsage: *.antidelete on/off*\n\nWhen ON, deleted messages are re-sent in chat.`,
    }, { quoted: msg });
  }
  botState.botSettings.antiDelete = val === "on";
  return toggleReply(sock, msg, "Anti Delete", val === "on");
}

export async function antideletestatusCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const val = args[0]?.toLowerCase();
  if (!val || !["on","off"].includes(val)) {
    return sock.sendMessage(msg.key.remoteJid!, {
      text: `🗑️ *Anti Delete Status*\nCurrent: ${botState.botSettings.antiDeleteStatus ? "✅ ON" : "❌ OFF"}\n\nUsage: *.antideletestatus on/off*\n\nWhen ON, deleted statuses are saved before removal.`,
    }, { quoted: msg });
  }
  botState.botSettings.antiDeleteStatus = val === "on";
  return toggleReply(sock, msg, "Anti Delete Status", val === "on");
}

// ── Anti Edit ─────────────────────────────────────────────────────────────────

export async function antieditCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const val = args[0]?.toLowerCase();
  if (!val || !["on","off"].includes(val)) {
    return sock.sendMessage(msg.key.remoteJid!, {
      text: `✏️ *Anti Edit*\nCurrent: ${botState.botSettings.antiEdit ? "✅ ON" : "❌ OFF"}\n\nUsage: *.antiedit on/off*\n\nWhen ON, the original message is shown if someone edits it.`,
    }, { quoted: msg });
  }
  botState.botSettings.antiEdit = val === "on";
  return toggleReply(sock, msg, "Anti Edit", val === "on");
}

// ── Anti View Once ────────────────────────────────────────────────────────────

export async function antiviewonceCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const val = args[0]?.toLowerCase();
  if (!val || !["on","off"].includes(val)) {
    return sock.sendMessage(msg.key.remoteJid!, {
      text: `👁️ *Anti View Once*\nCurrent: ${botState.botSettings.antiViewOnce ? "✅ ON" : "❌ OFF"}\n\nUsage: *.antiviewonce on/off*\n\nWhen ON, view-once media is re-sent as normal media to the owner.`,
    }, { quoted: msg });
  }
  botState.botSettings.antiViewOnce = val === "on";
  return toggleReply(sock, msg, "Anti View Once", val === "on");
}

// ── Anti Bug ──────────────────────────────────────────────────────────────────

export async function antibugCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const val = args[0]?.toLowerCase();
  if (!val || !["on","off"].includes(val)) {
    return sock.sendMessage(msg.key.remoteJid!, {
      text: `🛡️ *Anti Bug*\nCurrent: ${botState.botSettings.antiBug ? "✅ ON" : "❌ OFF"}\n\nUsage: *.antibug on/off*\n\nProtects against crash/bug messages. ON by default.`,
    }, { quoted: msg });
  }
  botState.botSettings.antiBug = val === "on";
  return toggleReply(sock, msg, "Anti Bug", val === "on");
}

// ── Auto React ────────────────────────────────────────────────────────────────

export async function autoreactCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const val = args[0]?.toLowerCase();
  const emoji = args[1]?.trim() ?? botState.botSettings.autoReactEmoji;
  if (!val || !["on","off"].includes(val)) {
    return sock.sendMessage(msg.key.remoteJid!, {
      text: `😄 *Auto React*\nCurrent: ${botState.botSettings.autoReact ? "✅ ON" : "❌ OFF"} ${botState.botSettings.autoReactEmoji}\n\nUsage: *.autoreact on/off [emoji]*\nExample: *.autoreact on ❤️*`,
    }, { quoted: msg });
  }
  botState.botSettings.autoReact = val === "on";
  if (val === "on" && emoji) botState.botSettings.autoReactEmoji = emoji;
  return sock.sendMessage(msg.key.remoteJid!, {
    text: `${val === "on" ? "✅" : "❌"} *Auto React* ${val === "on" ? "ON" : "OFF"}${val === "on" ? ` — Emoji: ${botState.botSettings.autoReactEmoji}` : ""}`,
  }, { quoted: msg });
}

export async function autoreactstatusCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const val = args[0]?.toLowerCase();
  const emoji = args[1]?.trim() ?? botState.botSettings.autoReactStatusEmoji;
  if (!val || !["on","off"].includes(val)) {
    return sock.sendMessage(msg.key.remoteJid!, {
      text: `😄 *Auto React Status*\nCurrent: ${botState.botSettings.autoReactStatus ? "✅ ON" : "❌ OFF"} ${botState.botSettings.autoReactStatusEmoji}\n\nUsage: *.autoreactstatus on/off [emoji]*`,
    }, { quoted: msg });
  }
  botState.botSettings.autoReactStatus = val === "on";
  if (val === "on" && emoji) botState.botSettings.autoReactStatusEmoji = emoji;
  return sock.sendMessage(msg.key.remoteJid!, {
    text: `${val === "on" ? "✅" : "❌"} *Auto React Status* ${val === "on" ? "ON" : "OFF"}${val === "on" ? ` — Emoji: ${botState.botSettings.autoReactStatusEmoji}` : ""}`,
  }, { quoted: msg });
}

// ── Auto Read ─────────────────────────────────────────────────────────────────

export async function autoreadCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const val = args[0]?.toLowerCase();
  if (!val || !["on","off"].includes(val)) {
    return sock.sendMessage(msg.key.remoteJid!, {
      text: `📖 *Auto Read*\nCurrent: ${botState.botSettings.autoRead ? "✅ ON" : "❌ OFF"}\n\nUsage: *.autoread on/off*\n\nWhen ON, messages are automatically marked as read (blue ticks).`,
    }, { quoted: msg });
  }
  botState.botSettings.autoRead = val === "on";
  return toggleReply(sock, msg, "Auto Read", val === "on");
}

// ── Auto Record ───────────────────────────────────────────────────────────────

export async function autorecordCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const val = args[0]?.toLowerCase();
  if (!val || !["on","off"].includes(val)) {
    return sock.sendMessage(msg.key.remoteJid!, {
      text: `🎙️ *Auto Record*\nCurrent: ${botState.botSettings.autoRecord ? "✅ ON" : "❌ OFF"}\n\nUsage: *.autorecord on/off*\n\nWhen ON, bot shows "recording..." whenever someone messages.`,
    }, { quoted: msg });
  }
  botState.botSettings.autoRecord = val === "on";
  return toggleReply(sock, msg, "Auto Record", val === "on");
}

export async function autorecordtypingCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const val = args[0]?.toLowerCase();
  if (!val || !["on","off"].includes(val)) {
    return sock.sendMessage(msg.key.remoteJid!, {
      text: `⌨️ *Auto Record Typing*\nCurrent: ${botState.botSettings.autoRecordTyping ? "✅ ON" : "❌ OFF"}\n\nUsage: *.autorecordtyping on/off*\n\nWhen ON, bot shows "typing..." whenever someone messages.`,
    }, { quoted: msg });
  }
  botState.botSettings.autoRecordTyping = val === "on";
  return toggleReply(sock, msg, "Auto Record Typing", val === "on");
}

// ── Auto Block ────────────────────────────────────────────────────────────────

export async function autoblockCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const val = args[0]?.toLowerCase();
  if (!val || !["on","off"].includes(val)) {
    return sock.sendMessage(msg.key.remoteJid!, {
      text: `🚫 *Auto Block*\nCurrent: ${botState.botSettings.autoblock ? "✅ ON" : "❌ OFF"}\n\nUsage: *.autoblock on/off*\n\nWhen ON + bot is in private mode, non-owners who DM are auto-blocked.`,
    }, { quoted: msg });
  }
  botState.botSettings.autoblock = val === "on";
  return toggleReply(sock, msg, "Auto Block", val === "on");
}

// ── Auto Bio ──────────────────────────────────────────────────────────────────

export async function autobioCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const jid = msg.key.remoteJid!;
  if (!args.length) {
    return sock.sendMessage(jid, {
      text: `📝 *Auto Bio*\nCurrent: ${botState.botSettings.autoBio ? "✅ ON" : "❌ OFF"}\n${botState.botSettings.autoBio ? `Bio: "${botState.botSettings.autoBioText}"` : ""}\n\nUsage:\n*.autobio on [bio text]* — enable with text\n*.autobio off* — disable\n\nVariables: {time} {date} {uptime}`,
    }, { quoted: msg });
  }
  const val = args[0]?.toLowerCase();
  if (val === "off") {
    botState.botSettings.autoBio = false;
    return sock.sendMessage(jid, { text: "❌ Auto Bio disabled." }, { quoted: msg });
  }
  const bioText = (val === "on" ? args.slice(1) : args).join(" ").trim();
  if (!bioText) return sock.sendMessage(jid, { text: "❌ Please provide bio text. Example: *.autobio on Bot uptime: {uptime}*" }, { quoted: msg });
  botState.botSettings.autoBio = true;
  botState.botSettings.autoBioText = bioText;
  // Update bio immediately
  try {
    const resolvedBio = resolveBioText(bioText);
    await sock.updateProfileStatus(resolvedBio);
  } catch {}
  return sock.sendMessage(jid, { text: `✅ Auto Bio enabled!\nBio: _"${bioText}"_\n\n_Updates every 60s. Variables: {time} {date} {uptime}_` }, { quoted: msg });
}

export function resolveBioText(template: string): string {
  const now = new Date();
  const tz = botState.botSettings.timezone;
  const uptime = (() => {
    const ms = Date.now() - botState.startTime.getTime();
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    return d > 0 ? `${d}d ${h%24}h` : h > 0 ? `${h}h ${m%60}m` : `${m}m`;
  })();
  return template
    .replace(/{time}/g, now.toLocaleTimeString("en-US", { timeZone: tz }))
    .replace(/{date}/g, now.toLocaleDateString("en-US", { timeZone: tz }))
    .replace(/{uptime}/g, uptime);
}

// ── Bad Words ─────────────────────────────────────────────────────────────────

export async function addbadwordCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isSudo(msg)) return sudoOnly(sock, msg);
  const word = args.join(" ").trim().toLowerCase();
  if (!word) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.addbadword [word]*" }, { quoted: msg });
  if (botState.botSettings.badWords.includes(word)) {
    return sock.sendMessage(msg.key.remoteJid!, { text: `⚠️ "*${word}*" is already in the bad words list.` }, { quoted: msg });
  }
  botState.botSettings.badWords.push(word);
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Added "*${word}*" to bad words list. (${botState.botSettings.badWords.length} total)` }, { quoted: msg });
}

export async function deletebadwordCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isSudo(msg)) return sudoOnly(sock, msg);
  const word = args.join(" ").trim().toLowerCase();
  if (!word) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.deletebadword [word]*" }, { quoted: msg });
  const idx = botState.botSettings.badWords.indexOf(word);
  if (idx === -1) return sock.sendMessage(msg.key.remoteJid!, { text: `⚠️ "*${word}*" not found in bad words list.` }, { quoted: msg });
  botState.botSettings.badWords.splice(idx, 1);
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Removed "*${word}*" from bad words list.` }, { quoted: msg });
}

export async function listbadwordCommand(sock: WASocket, msg: WAMessage) {
  const words = botState.botSettings.badWords;
  if (!words.length) return sock.sendMessage(msg.key.remoteJid!, { text: "📋 Bad words list is empty." }, { quoted: msg });
  return sock.sendMessage(msg.key.remoteJid!, {
    text: `📋 *Bad Words (${words.length})*\n\n${words.map((w, i) => `${i + 1}. ${w}`).join("\n")}`,
  }, { quoted: msg });
}

// ── Country Codes ─────────────────────────────────────────────────────────────

export async function addcountrycodeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const code = args[0]?.replace(/[^0-9]/g, "");
  if (!code) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.addcountrycode [code]*\nExample: *.addcountrycode 254*" }, { quoted: msg });
  if (botState.botSettings.countryCodes.includes(code)) {
    return sock.sendMessage(msg.key.remoteJid!, { text: `⚠️ +${code} already in allowed list.` }, { quoted: msg });
  }
  botState.botSettings.countryCodes.push(code);
  return sock.sendMessage(msg.key.remoteJid!, {
    text: `✅ +${code} added to allowed country codes.\n\n_Note: When the country code list is non-empty, anti-foreign will block numbers not on the list._`,
  }, { quoted: msg });
}

export async function delcountrycodeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const code = args[0]?.replace(/[^0-9]/g, "");
  const idx = botState.botSettings.countryCodes.indexOf(code ?? "");
  if (idx === -1) return sock.sendMessage(msg.key.remoteJid!, { text: `⚠️ +${code} not found.` }, { quoted: msg });
  botState.botSettings.countryCodes.splice(idx, 1);
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Removed +${code}.` }, { quoted: msg });
}

export async function listcountrycodeCommand(sock: WASocket, msg: WAMessage) {
  const codes = botState.botSettings.countryCodes;
  if (!codes.length) return sock.sendMessage(msg.key.remoteJid!, { text: "📋 No country codes set. All countries are allowed." }, { quoted: msg });
  return sock.sendMessage(msg.key.remoteJid!, {
    text: `📋 *Allowed Country Codes (${codes.length})*\n\n${codes.map(c => `+${c}`).join(", ")}`,
  }, { quoted: msg });
}

// ── Ignore List ───────────────────────────────────────────────────────────────

export async function addignorelistCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  const numArg = args.find(a => /^[0-9]+$/.test(a));
  const jid = mentioned ?? (numArg ? `${numArg}@s.whatsapp.net` : null);
  if (!jid) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.addignorelist @user* or *.addignorelist [number]*" }, { quoted: msg });
  if (botState.botSettings.ignoreList.includes(jid)) {
    return sock.sendMessage(msg.key.remoteJid!, { text: `⚠️ @${jid.split("@")[0]} already in ignore list.`, mentions: [jid] }, { quoted: msg });
  }
  botState.botSettings.ignoreList.push(jid);
  return sock.sendMessage(msg.key.remoteJid!, {
    text: `✅ @${jid.split("@")[0]} added to ignore list. Bot will not respond to them.`,
    mentions: [jid],
  }, { quoted: msg });
}

export async function delignorelistCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  const numArg = args.find(a => /^[0-9]+$/.test(a));
  const jid = mentioned ?? (numArg ? `${numArg}@s.whatsapp.net` : null);
  if (!jid) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Tag or provide number to remove." }, { quoted: msg });
  const idx = botState.botSettings.ignoreList.indexOf(jid);
  if (idx === -1) return sock.sendMessage(msg.key.remoteJid!, { text: `⚠️ Not in ignore list.` }, { quoted: msg });
  botState.botSettings.ignoreList.splice(idx, 1);
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Removed from ignore list.` }, { quoted: msg });
}

export async function listignorelistCommand(sock: WASocket, msg: WAMessage) {
  const list = botState.botSettings.ignoreList;
  if (!list.length) return sock.sendMessage(msg.key.remoteJid!, { text: "📋 Ignore list is empty." }, { quoted: msg });
  return sock.sendMessage(msg.key.remoteJid!, {
    text: `📋 *Ignore List (${list.length})*\n\n${list.map((j, i) => `${i + 1}. +${j.split("@")[0]}`).join("\n")}`,
  }, { quoted: msg });
}

// ── Sudo List ─────────────────────────────────────────────────────────────────

export async function addsudoCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  const numArg = args.find(a => /^[0-9]+$/.test(a));
  const jid = mentioned ?? (numArg ? `${numArg}@s.whatsapp.net` : null);
  if (!jid) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.addsudo @user* or *.addsudo [number]*" }, { quoted: msg });
  if (botState.botSettings.sudoList.includes(jid)) {
    return sock.sendMessage(msg.key.remoteJid!, { text: `⚠️ @${jid.split("@")[0]} is already sudo.`, mentions: [jid] }, { quoted: msg });
  }
  botState.botSettings.sudoList.push(jid);
  return sock.sendMessage(msg.key.remoteJid!, {
    text: `✅ @${jid.split("@")[0]} is now a *Sudo User*. They can use owner commands.`,
    mentions: [jid],
  }, { quoted: msg });
}

export async function delsudoCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  const numArg = args.find(a => /^[0-9]+$/.test(a));
  const jid = mentioned ?? (numArg ? `${numArg}@s.whatsapp.net` : null);
  if (!jid) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Tag or provide number to remove." }, { quoted: msg });
  const idx = botState.botSettings.sudoList.indexOf(jid);
  if (idx === -1) return sock.sendMessage(msg.key.remoteJid!, { text: `⚠️ Not a sudo user.` }, { quoted: msg });
  botState.botSettings.sudoList.splice(idx, 1);
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Sudo access removed from @${jid.split("@")[0]}.`, mentions: [jid] }, { quoted: msg });
}

export async function listsudoCommand(sock: WASocket, msg: WAMessage) {
  const list = botState.botSettings.sudoList;
  if (!list.length) return sock.sendMessage(msg.key.remoteJid!, { text: "📋 No sudo users." }, { quoted: msg });
  return sock.sendMessage(msg.key.remoteJid!, {
    text: `👑 *Sudo Users (${list.length})*\n\n${list.map((j, i) => `${i + 1}. +${j.split("@")[0]}`).join("\n")}`,
  }, { quoted: msg });
}

// ── Menu Image / Video ────────────────────────────────────────────────────────

export async function addmenuimageCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const jid = msg.key.remoteJid!;
  // Check for quoted image first
  const quotedImg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  const urlArg = args[0]?.trim();
  if (!quotedImg && !urlArg) {
    return sock.sendMessage(jid, { text: "❌ Usage: *.addmenuimage [URL]* or reply to an image with *.addmenuimage*" }, { quoted: msg });
  }
  const url = urlArg ?? "quoted_image";
  botState.botSettings.menuImage = url;
  return sock.sendMessage(jid, { text: `✅ Menu image set!\n\nType *.menu* to see it in action.${url === "quoted_image" ? "\n\n⚠️ Note: quoted image URL is stored as reference." : ""}` }, { quoted: msg });
}

export async function addmenuvideoCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  const url = args[0]?.trim();
  if (!url) return sock.sendMessage(msg.key.remoteJid!, { text: "❌ Usage: *.addmenuvideo [URL]*" }, { quoted: msg });
  botState.botSettings.menuVideo = url;
  return sock.sendMessage(msg.key.remoteJid!, { text: `✅ Menu video set to:\n${url}` }, { quoted: msg });
}

export async function clearmenuimagesCommand(sock: WASocket, msg: WAMessage) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  botState.botSettings.menuImage = "https://files.catbox.moe/pht92g.jpg";
  return sock.sendMessage(msg.key.remoteJid!, { text: "✅ Menu image reset to default." }, { quoted: msg });
}

export async function clearmenuvideoCommand(sock: WASocket, msg: WAMessage) {
  if (!isOwner(msg)) return ownerOnly(sock, msg);
  botState.botSettings.menuVideo = "";
  return sock.sendMessage(msg.key.remoteJid!, { text: "✅ Menu video cleared." }, { quoted: msg });
}
