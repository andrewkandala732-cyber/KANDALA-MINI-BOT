import type { WASocket, WAMessage, GroupMetadata } from "@whiskeysockets/baileys";
import { botState } from "../store.js";

function reply(sock: WASocket, msg: WAMessage, text: string) {
  return sock.sendMessage(msg.key.remoteJid!, { text }, { quoted: msg });
}

function getGroupSettings(jid: string) {
  if (!botState.groupSettings.has(jid)) botState.groupSettings.set(jid, {});
  return botState.groupSettings.get(jid)!;
}

async function getGroupMeta(sock: WASocket, jid: string): Promise<GroupMetadata | null> {
  try { return await sock.groupMetadata(jid); } catch { return null; }
}

function isAdmin(meta: GroupMetadata, jid: string): boolean {
  return meta.participants.some(p => p.id === jid && (p.admin === "admin" || p.admin === "superadmin"));
}

async function requireGroup(sock: WASocket, msg: WAMessage): Promise<boolean> {
  if (!msg.key.remoteJid!.endsWith("@g.us")) {
    await reply(sock, msg, "❌ This command can only be used in groups.");
    return false;
  }
  return true;
}

async function requireAdmin(sock: WASocket, msg: WAMessage, meta: GroupMetadata): Promise<boolean> {
  const botJid = sock.user?.id!;
  if (!isAdmin(meta, botJid)) {
    await reply(sock, msg, "❌ Bot must be an admin to use this command.");
    return false;
  }
  return true;
}

// ── Mute / Unmute member ─────────────────────────────────────────────────────
export async function muteCommand(sock: WASocket, msg: WAMessage) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    || msg.message?.extendedTextMessage?.contextInfo?.participant;
  if (!mentioned) return reply(sock, msg, "Usage: *.mute @user*");

  const settings = getGroupSettings(jid);
  if (!settings.muted) settings.muted = new Set();
  settings.muted.add(mentioned);
  const number = mentioned.split("@")[0];
  await reply(sock, msg, `🔇 @${number} has been muted. Their messages will be deleted.`, );
}

export async function unmuteCommand(sock: WASocket, msg: WAMessage) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    || msg.message?.extendedTextMessage?.contextInfo?.participant;
  if (!mentioned) return reply(sock, msg, "Usage: *.unmute @user*");

  const settings = getGroupSettings(jid);
  settings.muted?.delete(mentioned);
  const number = mentioned.split("@")[0];
  await reply(sock, msg, `🔊 @${number} has been unmuted.`);
}

export async function mutelistCommand(sock: WASocket, msg: WAMessage) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const settings = getGroupSettings(jid);
  const muted = [...(settings.muted || [])];
  if (!muted.length) return reply(sock, msg, "✅ No muted members.");
  const list = muted.map(m => `• +${m.split("@")[0]}`).join("\n");
  await reply(sock, msg, `🔇 *MUTED MEMBERS*\n\n${list}`);
}

// ── Hidetag ──────────────────────────────────────────────────────────────────
export async function hidetagCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const meta = await getGroupMeta(sock, jid);
  if (!meta) return reply(sock, msg, "❌ Could not fetch group info.");
  const text = args.join(" ") || "📢 Announcement";
  const mentions = meta.participants.map(p => p.id);
  await sock.sendMessage(jid, { text, mentions }, { quoted: msg });
}

// ── Tag admins ───────────────────────────────────────────────────────────────
export async function tagadminCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const meta = await getGroupMeta(sock, jid);
  if (!meta) return reply(sock, msg, "❌ Could not fetch group info.");
  const admins = meta.participants.filter(p => p.admin);
  if (!admins.length) return reply(sock, msg, "❌ No admins found.");
  const mentions = admins.map(p => p.id);
  const tags = admins.map(p => `@${p.id.split("@")[0]}`).join(" ");
  const text = (args.join(" ") ? `📢 ${args.join(" ")}\n\n` : "👮 *Admins:*\n\n") + tags;
  await sock.sendMessage(jid, { text, mentions }, { quoted: msg });
}

// ── Set group description ────────────────────────────────────────────────────
export async function setdescCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!await requireGroup(sock, msg)) return;
  if (!args.length) return reply(sock, msg, "Usage: *.setdesc [description]*");
  const jid = msg.key.remoteJid!;
  const meta = await getGroupMeta(sock, jid);
  if (!meta || !await requireAdmin(sock, msg, meta)) return;
  try {
    await sock.groupUpdateDescription(jid, args.join(" "));
    await reply(sock, msg, "✅ Group description updated!");
  } catch { await reply(sock, msg, "❌ Failed to update description."); }
}

// ── Set group name ───────────────────────────────────────────────────────────
export async function setgroupnameCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!await requireGroup(sock, msg)) return;
  if (!args.length) return reply(sock, msg, "Usage: *.setgroupname [new name]*");
  const jid = msg.key.remoteJid!;
  const meta = await getGroupMeta(sock, jid);
  if (!meta || !await requireAdmin(sock, msg, meta)) return;
  try {
    await sock.groupUpdateSubject(jid, args.join(" "));
    await reply(sock, msg, `✅ Group name changed to: *${args.join(" ")}*`);
  } catch { await reply(sock, msg, "❌ Failed to update group name."); }
}

// ── Get group profile picture ────────────────────────────────────────────────
export async function getgroupppCommand(sock: WASocket, msg: WAMessage) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  try {
    const ppUrl = await sock.profilePictureUrl(jid, "image");
    const { default: axios } = await import("axios");
    const res = await axios.get(ppUrl, { responseType: "arraybuffer", timeout: 15000 });
    const meta = await getGroupMeta(sock, jid);
    await sock.sendMessage(jid, {
      image: Buffer.from(res.data),
      caption: `📷 *Group Photo*\n👥 ${meta?.subject || "Group"}`,
    }, { quoted: msg });
  } catch { await reply(sock, msg, "❌ This group has no profile picture."); }
}

// ── Set group profile picture ────────────────────────────────────────────────
export async function setppgroupCommand(sock: WASocket, msg: WAMessage) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const meta = await getGroupMeta(sock, jid);
  if (!meta || !await requireAdmin(sock, msg, meta)) return;

  const image = msg.message?.imageMessage
    || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  if (!image) return reply(sock, msg, "Usage: Send an image with *.setppgroup* caption or reply to an image.");

  try {
    const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
    const target = image === msg.message?.imageMessage ? msg : {
      key: { ...msg.key, id: msg.message?.extendedTextMessage?.contextInfo?.stanzaId },
      message: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage,
    } as WAMessage;
    const buf = await downloadMediaMessage(target, "buffer", {}) as Buffer;
    await sock.updateProfilePicture(jid, buf);
    await reply(sock, msg, "✅ Group profile picture updated!");
  } catch { await reply(sock, msg, "❌ Failed to update group picture."); }
}

// ── Welcome / Goodbye ────────────────────────────────────────────────────────
export async function welcomeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const settings = getGroupSettings(jid);
  const sub = args[0]?.toLowerCase();
  if (sub === "off") {
    settings.welcome = undefined;
    return reply(sock, msg, "✅ Welcome messages disabled.");
  }
  const custom = args.slice(1).join(" ") || "👋 Welcome to *{groupname}*, @{name}! 🎉";
  settings.welcome = custom;
  await reply(sock, msg,
    `✅ Welcome messages enabled!\n\n📝 Message:\n${custom}\n\n_Variables: {name} {groupname}_`
  );
}

export async function goodbyeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const settings = getGroupSettings(jid);
  const sub = args[0]?.toLowerCase();
  if (sub === "off") {
    settings.goodbye = undefined;
    return reply(sock, msg, "✅ Goodbye messages disabled.");
  }
  const custom = args.slice(1).join(" ") || "👋 Goodbye @{name}! Hope to see you again.";
  settings.goodbye = custom;
  await reply(sock, msg,
    `✅ Goodbye messages enabled!\n\n📝 Message:\n${custom}\n\n_Variables: {name} {groupname}_`
  );
}

// ── Poll ─────────────────────────────────────────────────────────────────────
export async function pollCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!await requireGroup(sock, msg)) return;
  const raw = args.join(" ");
  const parts = raw.split("|").map(s => s.trim()).filter(Boolean);
  if (parts.length < 3) return reply(sock, msg, "Usage: *.poll Title | Option1 | Option2 | Option3*\nExample: .poll Favorite color | Red | Blue | Green");
  const [name, ...options] = parts;
  const jid = msg.key.remoteJid!;
  try {
    await sock.sendMessage(jid, {
      poll: { name, values: options, selectableCount: 1 },
    } as any, { quoted: msg });
  } catch {
    // Fallback to text poll
    const numbered = options.map((o, i) => `${i + 1}️⃣ ${o}`).join("\n");
    await reply(sock, msg, `📊 *POLL: ${name}*\n\n${numbered}\n\nReply with the number to vote!`);
  }
}

// ── Total members ────────────────────────────────────────────────────────────
export async function totalmembersCommand(sock: WASocket, msg: WAMessage) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const meta = await getGroupMeta(sock, jid);
  if (!meta) return reply(sock, msg, "❌ Could not fetch group info.");
  const admins = meta.participants.filter(p => p.admin).length;
  await reply(sock, msg,
    `👥 *GROUP MEMBERS*\n\n` +
    `📋 Group: ${meta.subject}\n` +
    `👥 Total: ${meta.participants.length}\n` +
    `👮 Admins: ${admins}\n` +
    `👤 Members: ${meta.participants.length - admins}`
  );
}

// ── Kickall ──────────────────────────────────────────────────────────────────
export async function kickallCommand(sock: WASocket, msg: WAMessage) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const senderJid = msg.key.participant || msg.key.remoteJid!;
  const isOwner = senderJid.includes(botState.ownerJid.split("@")[0]!);
  if (!isOwner) return reply(sock, msg, "❌ Only the bot owner can use this command.");

  const meta = await getGroupMeta(sock, jid);
  if (!meta || !await requireAdmin(sock, msg, meta)) return;

  const botJid = sock.user?.id!;
  const toKick = meta.participants.filter(p => p.id !== botJid && !p.admin).map(p => p.id);
  if (!toKick.length) return reply(sock, msg, "❌ No regular members to kick.");

  await reply(sock, msg, `⚠️ Kicking ${toKick.length} members...`);
  let kicked = 0;
  for (const p of toKick) {
    try {
      await sock.groupParticipantsUpdate(jid, [p], "remove");
      kicked++;
      await new Promise(r => setTimeout(r, 500));
    } catch {}
  }
  await reply(sock, msg, `✅ Kicked ${kicked}/${toKick.length} members.`);
}

// ── Warn ─────────────────────────────────────────────────────────────────────
export async function warnCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    || msg.message?.extendedTextMessage?.contextInfo?.participant;
  if (!mentioned) return reply(sock, msg, "Usage: *.warn @user [reason]*");

  const key = `${jid}:${mentioned}`;
  const current = (botState.memberWarns.get(key) || 0) + 1;
  botState.memberWarns.set(key, current);
  const reason = args.slice(1).join(" ") || "No reason provided";
  const number = mentioned.split("@")[0];

  await sock.sendMessage(jid, {
    text: `⚠️ *WARNING ${current}/3*\n\n👤 @${number}\n📝 Reason: ${reason}${current >= 3 ? "\n\n🚨 MAX WARNINGS REACHED!" : ""}`,
    mentions: [mentioned],
  }, { quoted: msg });

  if (current >= 3) {
    const meta = await getGroupMeta(sock, jid);
    if (meta && await requireAdmin(sock, msg, meta)) {
      try {
        await sock.groupParticipantsUpdate(jid, [mentioned], "remove");
        botState.memberWarns.delete(key);
        await reply(sock, msg, `🔨 @${number} has been kicked after 3 warnings.`);
      } catch {}
    }
  }
}

// ── Kick inactive ─────────────────────────────────────────────────────────────
export async function kickinactiveCommand(sock: WASocket, msg: WAMessage) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const senderJid = msg.key.participant || jid;
  const isOwner = senderJid.includes(botState.ownerJid.split("@")[0]!);
  if (!isOwner) return reply(sock, msg, "❌ Only the bot owner can use this command.");
  await reply(sock, msg, "ℹ️ Kick-inactive requires tracking message history. Track activity with messages first, then use *.kickall* for non-active members.");
}

// ── Closetime / Opentime ─────────────────────────────────────────────────────
export async function closetimeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const delayMin = parseInt(args[0]) || 30;
  await reply(sock, msg, `⏰ Group will close in ${delayMin} minutes.`);
  setTimeout(async () => {
    try {
      await sock.groupSettingUpdate(jid, "announcement");
      await sock.sendMessage(jid, { text: "🔒 Group is now closed (admins only)." });
    } catch {}
  }, delayMin * 60 * 1000);
}

export async function opentimeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const delayMin = parseInt(args[0]) || 30;
  await reply(sock, msg, `⏰ Group will open in ${delayMin} minutes.`);
  setTimeout(async () => {
    try {
      await sock.groupSettingUpdate(jid, "not_announcement");
      await sock.sendMessage(jid, { text: "🔓 Group is now open for all members." });
    } catch {}
  }, delayMin * 60 * 1000);
}

// ── Anti-media commands ───────────────────────────────────────────────────────
function antiMediaToggle(type: keyof ReturnType<typeof getGroupSettings>, label: string) {
  return async (sock: WASocket, msg: WAMessage, args: string[]) => {
    if (!await requireGroup(sock, msg)) return;
    const jid = msg.key.remoteJid!;
    const settings = getGroupSettings(jid);
    const on = args[0]?.toLowerCase() !== "off";
    (settings as any)[type] = on;
    await reply(sock, msg, `${on ? "✅" : "❌"} Anti-${label} turned *${on ? "ON" : "OFF"}*`);
  };
}

export const antiaudioCommand   = antiMediaToggle("antiaudio",   "audio");
export const antiimageCommand   = antiMediaToggle("antiimage",   "image");
export const antivideoCommand   = antiMediaToggle("antivideo",   "video");
export const antistickerCommand = antiMediaToggle("antisticker", "sticker");
export const antigifCommand     = antiMediaToggle("antigif",     "gif");
export const antiforwardCommand = antiMediaToggle("antiforward", "forward");
export const antivoiceCommand   = antiMediaToggle("antivoice",   "voice");
export const antidocumentCommand = antiMediaToggle("antidocument","document");
export const antipollCommand    = antiMediaToggle("antipoll",    "poll");
export const antireactionCommand = antiMediaToggle("antireaction","reaction");

// ── Invite link ───────────────────────────────────────────────────────────────
export async function inviteCommand(sock: WASocket, msg: WAMessage) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  try {
    const code = await sock.groupInviteCode(jid);
    await reply(sock, msg, `🔗 *GROUP INVITE LINK*\n\nhttps://chat.whatsapp.com/${code}`);
  } catch { await reply(sock, msg, "❌ Could not get invite link. Bot needs to be admin."); }
}

// ── Group ID ──────────────────────────────────────────────────────────────────
export async function groupidCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await reply(sock, msg, `🆔 *GROUP ID*\n\n${jid}`);
}

// ── Announce / Mediatag ───────────────────────────────────────────────────────
export async function announcementsCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const meta = await getGroupMeta(sock, jid);
  if (!meta || !await requireAdmin(sock, msg, meta)) return;
  const text = args.join(" ");
  if (!text) return reply(sock, msg, "Usage: *.announcements [message]*");
  const mentions = meta.participants.map(p => p.id);
  await sock.sendMessage(jid, {
    text: `📢 *ANNOUNCEMENT*\n\n${text}`,
    mentions,
  }, { quoted: msg });
}

export async function mediatagCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const meta = await getGroupMeta(sock, jid);
  if (!meta) return;
  const mentions = meta.participants.map(p => p.id);
  const tags = meta.participants.map(p => `@${p.id.split("@")[0]}`).join(" ");
  const caption = args.join(" ") || "📸 Check this out!";
  await sock.sendMessage(jid, {
    text: `${caption}\n\n${tags}`,
    mentions,
  }, { quoted: msg });
}

// ── Listactive / Listrequests ─────────────────────────────────────────────────
export async function listactiveCommand(sock: WASocket, msg: WAMessage) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const meta = await getGroupMeta(sock, jid);
  if (!meta) return reply(sock, msg, "❌ Could not fetch group info.");
  const list = meta.participants.slice(0, 20).map(p => `• +${p.id.split("@")[0]}${p.admin ? " 👮" : ""}`).join("\n");
  await reply(sock, msg, `👥 *MEMBER LIST* (${meta.participants.length} total)\n\n${list}${meta.participants.length > 20 ? "\n_...and more_" : ""}`);
}

export async function listrequestsCommand(sock: WASocket, msg: WAMessage) {
  if (!await requireGroup(sock, msg)) return;
  await reply(sock, msg, "ℹ️ Join requests are handled via WhatsApp settings. Check the WhatsApp group admin panel.");
}

export async function vcfCommand(sock: WASocket, msg: WAMessage) {
  if (!await requireGroup(sock, msg)) return;
  const jid = msg.key.remoteJid!;
  const meta = await getGroupMeta(sock, jid);
  if (!meta) return reply(sock, msg, "❌ Could not fetch group info.");
  
  let vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:${meta.subject} Members\n`;
  for (const p of meta.participants) {
    const num = p.id.split("@")[0];
    vcf += `END:VCARD\nBEGIN:VCARD\nVERSION:3.0\nFN:+${num}\nTEL:+${num}\n`;
  }
  vcf += "END:VCARD";

  await sock.sendMessage(jid, {
    document: Buffer.from(vcf),
    mimetype: "text/vcard",
    fileName: `${meta.subject.replace(/\s+/g, "_")}_members.vcf`,
  }, { quoted: msg });
}
