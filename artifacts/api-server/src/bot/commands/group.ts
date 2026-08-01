import type { WASocket, WAMessage } from "@whiskeysockets/baileys";

function getTaggedJid(msg: WAMessage): string | null {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  return mentioned?.[0] ?? null;
}

async function checkAdmin(sock: WASocket, jid: string): Promise<{ isBotAdmin: boolean; isSenderAdmin: boolean }> {
  const senderJid = msg_sender(msg_global);
  const meta = await sock.groupMetadata(jid);
  const botJid = sock.user?.id?.replace(/:.*@/, "@") ?? "";
  const botParticipant = meta.participants.find(p => p.id.replace(/:.*@/, "@") === botJid.replace(/:.*@/, "@"));
  const senderParticipant = meta.participants.find(p => p.id === msg_global.key.participant);
  return {
    isBotAdmin: botParticipant?.admin === "admin" || botParticipant?.admin === "superadmin",
    isSenderAdmin: senderParticipant?.admin === "admin" || senderParticipant?.admin === "superadmin",
  };
}

// Module-level message reference for admin check helper
let msg_global: WAMessage;
function msg_sender(_msg: WAMessage) {
  return _msg.key.participant ?? _msg.key.remoteJid ?? "";
}

export async function kickCommand(sock: WASocket, msg: WAMessage) {
  msg_global = msg;
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) {
    return sock.sendMessage(jid, { text: "❌ This command is for groups only." }, { quoted: msg });
  }
  const target = getTaggedJid(msg) ?? msg.message?.extendedTextMessage?.contextInfo?.participant;
  if (!target) return sock.sendMessage(jid, { text: "❌ Tag someone to kick." }, { quoted: msg });

  const meta = await sock.groupMetadata(jid);
  const botJid = (sock.user?.id ?? "").replace(/:.*@/, "@");
  const botP = meta.participants.find(p => p.id.replace(/:.*@/, "@") === botJid);
  if (!botP?.admin) return sock.sendMessage(jid, { text: "❌ I need to be an admin to kick." }, { quoted: msg });

  try {
    await sock.groupParticipantsUpdate(jid, [target], "remove");
    await sock.sendMessage(jid, { text: `✅ @${target.split("@")[0]} has been kicked.`, mentions: [target] }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to kick member." }, { quoted: msg });
  }
}

export async function addCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  const number = args[0]?.replace(/[^0-9]/g, "");
  if (!number) return sock.sendMessage(jid, { text: "❌ Usage: .add [number]\nExample: .add 254700000000" }, { quoted: msg });

  const meta = await sock.groupMetadata(jid);
  const botJid = (sock.user?.id ?? "").replace(/:.*@/, "@");
  const botP = meta.participants.find(p => p.id.replace(/:.*@/, "@") === botJid);
  if (!botP?.admin) return sock.sendMessage(jid, { text: "❌ I need admin to add members." }, { quoted: msg });

  const target = `${number}@s.whatsapp.net`;
  try {
    await sock.groupParticipantsUpdate(jid, [target], "add");
    await sock.sendMessage(jid, { text: `✅ @${number} has been added.`, mentions: [target] }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to add member. They may have privacy settings enabled." }, { quoted: msg });
  }
}

export async function promoteCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  const target = getTaggedJid(msg);
  if (!target) return sock.sendMessage(jid, { text: "❌ Tag someone to promote." }, { quoted: msg });

  try {
    await sock.groupParticipantsUpdate(jid, [target], "promote");
    await sock.sendMessage(jid, { text: `✅ @${target.split("@")[0]} promoted to admin! 🎉`, mentions: [target] }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to promote." }, { quoted: msg });
  }
}

export async function demoteCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  const target = getTaggedJid(msg);
  if (!target) return sock.sendMessage(jid, { text: "❌ Tag someone to demote." }, { quoted: msg });

  try {
    await sock.groupParticipantsUpdate(jid, [target], "demote");
    await sock.sendMessage(jid, { text: `✅ @${target.split("@")[0]} has been demoted.`, mentions: [target] }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to demote." }, { quoted: msg });
  }
}

export async function groupLinkCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  try {
    const code = await sock.groupInviteCode(jid);
    await sock.sendMessage(jid, { text: `🔗 *Group Invite Link:*\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Need admin to get group link." }, { quoted: msg });
  }
}

export async function revokeCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  try {
    await sock.groupRevokeInvite(jid);
    const code = await sock.groupInviteCode(jid);
    await sock.sendMessage(jid, { text: `✅ Group link revoked!\n🔗 New link: https://chat.whatsapp.com/${code}` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to revoke link." }, { quoted: msg });
  }
}

export async function openCloseCommand(sock: WASocket, msg: WAMessage, open: boolean) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  try {
    await sock.groupSettingUpdate(jid, open ? "not_announcement" : "announcement");
    await sock.sendMessage(jid, {
      text: open ? "✅ Group is now *open*. Everyone can send messages." : "🔒 Group is now *closed*. Only admins can send messages.",
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Need admin to change group settings." }, { quoted: msg });
  }
}
