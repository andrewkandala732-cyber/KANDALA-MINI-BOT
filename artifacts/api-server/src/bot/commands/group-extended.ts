import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { botState, getGroupSettings } from "../store.js";

function getSender(msg: WAMessage): string {
  return msg.key.participant ?? msg.key.remoteJid ?? "";
}

async function isGroupAdmin(sock: WASocket, jid: string, userJid: string): Promise<boolean> {
  try {
    const meta = await sock.groupMetadata(jid);
    const p = meta.participants.find(p => p.id === userJid || p.id.split(":")[0] === userJid.split(":")[0]);
    return p?.admin === "admin" || p?.admin === "superadmin";
  } catch {
    return false;
  }
}

async function isBotAdmin(sock: WASocket, jid: string): Promise<boolean> {
  const botJid = sock.user?.id ?? "";
  return isGroupAdmin(sock, jid, botJid);
}

export async function welcomeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  const settings = getGroupSettings(jid);
  const action = args[0]?.toLowerCase();
  if (action === "on") {
    settings.welcomeEnabled = true;
    await sock.sendMessage(jid, { text: "✅ *Welcome messages ON*\n\nNew members will be greeted automatically!" }, { quoted: msg });
  } else if (action === "off") {
    settings.welcomeEnabled = false;
    await sock.sendMessage(jid, { text: "❌ *Welcome messages OFF*" }, { quoted: msg });
  } else if (args.length > 1) {
    settings.welcomeMessage = args.slice(1).join(" ");
    await sock.sendMessage(jid, { text: `✅ *Welcome message set!*\n\n${settings.welcomeMessage}` }, { quoted: msg });
  } else {
    await sock.sendMessage(jid, {
      text: `👋 *Welcome Settings*\n\n*Status:* ${settings.welcomeEnabled ? "✅ ON" : "❌ OFF"}\n*Message:* ${settings.welcomeMessage}\n\n*Usage:*\n.welcome on/off — toggle\n.setwelcome [message] — set message\n\nUse @user for username, @group for group name`,
    }, { quoted: msg });
  }
}

export async function setwelcomeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  if (!args.length) return sock.sendMessage(jid, { text: "❌ Usage: *.setwelcome [message]*\nUse @user, @group as placeholders." }, { quoted: msg });
  const settings = getGroupSettings(jid);
  settings.welcomeMessage = args.join(" ");
  await sock.sendMessage(jid, { text: `✅ Welcome message set!\n\n_${settings.welcomeMessage}_` }, { quoted: msg });
}

export async function goodbyeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  const settings = getGroupSettings(jid);
  const action = args[0]?.toLowerCase();
  if (action === "on") {
    settings.goodbyeEnabled = true;
    await sock.sendMessage(jid, { text: "✅ *Goodbye messages ON*" }, { quoted: msg });
  } else if (action === "off") {
    settings.goodbyeEnabled = false;
    await sock.sendMessage(jid, { text: "❌ *Goodbye messages OFF*" }, { quoted: msg });
  } else {
    await sock.sendMessage(jid, {
      text: `👋 *Goodbye Settings*\n*Status:* ${settings.goodbyeEnabled ? "✅ ON" : "❌ OFF"}\n*Message:* ${settings.goodbyeMessage}\n\nUsage: .goodbye on/off or .setgoodbye [message]`,
    }, { quoted: msg });
  }
}

export async function setgoodbyeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  if (!args.length) return sock.sendMessage(jid, { text: "❌ Usage: *.setgoodbye [message]*" }, { quoted: msg });
  const settings = getGroupSettings(jid);
  settings.goodbyeMessage = args.join(" ");
  await sock.sendMessage(jid, { text: `✅ Goodbye message set!\n\n_${settings.goodbyeMessage}_` }, { quoted: msg });
}

export async function muteCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!target) return sock.sendMessage(jid, { text: "❌ Tag someone to mute." }, { quoted: msg });
  const settings = getGroupSettings(jid);
  settings.mutedUsers.add(target);
  await sock.sendMessage(jid, { text: `🔇 @${target.split("@")[0]} has been muted.`, mentions: [target] }, { quoted: msg });
}

export async function unmuteCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!target) return sock.sendMessage(jid, { text: "❌ Tag someone to unmute." }, { quoted: msg });
  const settings = getGroupSettings(jid);
  settings.mutedUsers.delete(target);
  await sock.sendMessage(jid, { text: `🔊 @${target.split("@")[0]} has been unmuted.`, mentions: [target] }, { quoted: msg });
}

export async function mutelistCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  const settings = getGroupSettings(jid);
  if (!settings.mutedUsers.size) {
    await sock.sendMessage(jid, { text: "✅ No users are muted in this group." }, { quoted: msg });
    return;
  }
  const list = [...settings.mutedUsers].map(jid => `• @${jid.split("@")[0]}`).join("\n");
  await sock.sendMessage(jid, {
    text: `🔇 *Muted Users (${settings.mutedUsers.size})*\n\n${list}`,
    mentions: [...settings.mutedUsers],
  }, { quoted: msg });
}

export async function hidetagCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  try {
    const meta = await sock.groupMetadata(jid);
    const mentions = meta.participants.map(p => p.id);
    const text = args.join(" ") || "📢";
    await sock.sendMessage(jid, { text, mentions });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to hidetag." }, { quoted: msg });
  }
}

export async function pollCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const parts = args.join(" ").split("|").map(s => s.trim()).filter(Boolean);
  if (parts.length < 3) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.poll [question] | [option1] | [option2] ...*\nExample: .poll Favorite color? | Red | Blue | Green" }, { quoted: msg });
    return;
  }
  const [question, ...options] = parts;
  if (options.length < 2 || options.length > 12) {
    await sock.sendMessage(jid, { text: "❌ Polls need 2-12 options." }, { quoted: msg });
    return;
  }
  try {
    await sock.sendMessage(jid, {
      poll: { name: question!, values: options, selectableCount: 1 },
    });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to create poll." }, { quoted: msg });
  }
}

export async function kickallCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  const sender = getSender(msg);
  const ownerNum = botState.ownerJid.split("@")[0]!;
  if (!sender.includes(ownerNum)) {
    await sock.sendMessage(jid, { text: "❌ This command is for the owner only." }, { quoted: msg });
    return;
  }
  if (!(await isBotAdmin(sock, jid))) {
    await sock.sendMessage(jid, { text: "❌ I need to be an admin to kick members." }, { quoted: msg });
    return;
  }
  try {
    const meta = await sock.groupMetadata(jid);
    const botJid = sock.user?.id ?? "";
    const toKick = meta.participants.filter(p => !p.admin && p.id !== botJid && !p.id.includes(ownerNum));
    if (!toKick.length) {
      await sock.sendMessage(jid, { text: "✅ No non-admin members to kick." }, { quoted: msg });
      return;
    }
    await sock.sendMessage(jid, { text: `⏳ Kicking ${toKick.length} members...` }, { quoted: msg });
    for (const p of toKick) {
      try { await sock.groupParticipantsUpdate(jid, [p.id], "remove"); } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    await sock.sendMessage(jid, { text: `✅ Kicked ${toKick.length} members.` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to kick all members." }, { quoted: msg });
  }
}

export async function kickinactiveCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  await sock.sendMessage(jid, {
    text: "⚠️ Kicking inactive users requires message history tracking which is not yet supported.\n\nUse *.kickall* to remove all non-admin members.",
  }, { quoted: msg });
}

export async function totalmembersCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  try {
    const meta = await sock.groupMetadata(jid);
    const admins = meta.participants.filter(p => p.admin);
    await sock.sendMessage(jid, {
      text: `👥 *Group Members*\n\n📊 *Total:* ${meta.participants.length}\n👑 *Admins:* ${admins.length}\n👤 *Regular:* ${meta.participants.length - admins.length}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to get member count." }, { quoted: msg });
  }
}

export async function setdescCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  if (!args.length) return sock.sendMessage(jid, { text: "❌ Usage: *.setdesc [description]*" }, { quoted: msg });
  try {
    await sock.groupUpdateDescription(jid, args.join(" "));
    await sock.sendMessage(jid, { text: "✅ Group description updated!" }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to update description. I need to be admin." }, { quoted: msg });
  }
}

export async function setgroupnameCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  if (!args.length) return sock.sendMessage(jid, { text: "❌ Usage: *.setgroupname [new name]*" }, { quoted: msg });
  try {
    await sock.groupUpdateSubject(jid, args.join(" "));
    await sock.sendMessage(jid, { text: `✅ Group name updated to: *${args.join(" ")}*` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to update group name. I need to be admin." }, { quoted: msg });
  }
}

export async function mediatagCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  const announcement = args.join(" ") || "📸 *Media Alert*";
  try {
    const meta = await sock.groupMetadata(jid);
    const mentions = meta.participants.map(p => p.id);
    const tags = mentions.map(id => `@${id.split("@")[0]}`).join(" ");
    await sock.sendMessage(jid, { text: `${announcement}\n\n${tags}`, mentions }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to tag members." }, { quoted: msg });
  }
}

export async function antiaudioCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "antiaudio", "Anti-Audio");
}
export async function antibadwordCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "antiBadWord", "Anti-Bad Word");
}
export async function antibotCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "antibot", "Anti-Bot");
}
export async function antichannelpostCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Anti-channel-post is not supported yet." }, { quoted: msg });
}
export async function anticontactCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "anticontact", "Anti-Contact");
}
export async function antidocumentCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "antidocument", "Anti-Document");
}
export async function antiforwardCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "antiforward", "Anti-Forward");
}
export async function antigifCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "antigif", "Anti-GIF");
}
export async function antigroupmentionCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Anti-group-mention is not supported yet." }, { quoted: msg });
}
export async function antiimageCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "antiimage", "Anti-Image");
}
export async function antilinkgcCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "antilink", "Anti-Link (GC)");
}
export async function antilocationCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Anti-location is not supported yet." }, { quoted: msg });
}
export async function antimessageCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Anti-message is not supported yet." }, { quoted: msg });
}
export async function antipollCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "antipoll", "Anti-Poll");
}
export async function antireactionCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Anti-reaction is not supported yet." }, { quoted: msg });
}
export async function antistickerCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "antisticker", "Anti-Sticker");
}
export async function antitagCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Anti-tag is not supported yet." }, { quoted: msg });
}
export async function antitagadminCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Anti-tag-admin is not supported yet." }, { quoted: msg });
}
export async function antivideoCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "antivideo", "Anti-Video");
}
export async function antivoiceCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "antivoice", "Anti-Voice");
}
export async function antiforeignCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await toggleSetting(sock, msg, args, "antiforeign", "Anti-Foreign");
}
export async function antidemoteCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Anti-demote is not supported yet." }, { quoted: msg });
}
export async function antigroupstatusCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Anti-group-status is not supported yet." }, { quoted: msg });
}

async function toggleSetting(sock: WASocket, msg: WAMessage, args: string[], key: string, label: string) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  const settings = getGroupSettings(jid);
  const action = args[0]?.toLowerCase();
  const isOn = action === "on" ? true : action === "off" ? false : !(settings as any)[key];
  (settings as any)[key] = isOn;
  await sock.sendMessage(jid, { text: `${isOn ? "✅" : "❌"} *${label}* is now ${isOn ? "ON" : "OFF"}` }, { quoted: msg });
}

export async function warnCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!target) return sock.sendMessage(jid, { text: "❌ Tag someone to warn." }, { quoted: msg });
  const settings = getGroupSettings(jid);
  const current = (settings.warnCount.get(target) ?? 0) + 1;
  settings.warnCount.set(target, current);
  const reason = args.slice(1).join(" ") || "No reason given";
  if (current >= settings.maxWarns) {
    await sock.sendMessage(jid, {
      text: `⚠️ @${target.split("@")[0]} has been warned!\n\n*Reason:* ${reason}\n*Warns:* ${current}/${settings.maxWarns} — *MAX REACHED!*\n\nConsider kicking this user.`,
      mentions: [target],
    }, { quoted: msg });
  } else {
    await sock.sendMessage(jid, {
      text: `⚠️ @${target.split("@")[0]} has been warned!\n\n*Reason:* ${reason}\n*Warns:* ${current}/${settings.maxWarns}`,
      mentions: [target],
    }, { quoted: msg });
  }
}

export async function approveCommand(sock: WASocket, msg: WAMessage) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Approval system is not supported in this version." }, { quoted: msg });
}
export async function approveallCommand(sock: WASocket, msg: WAMessage) {
  await approveCommand(sock, msg);
}
export async function disapproveallCommand(sock: WASocket, msg: WAMessage) {
  await approveCommand(sock, msg);
}
export async function rejectCommand(sock: WASocket, msg: WAMessage) {
  await approveCommand(sock, msg);
}
export async function listallowedCommand(sock: WASocket, msg: WAMessage) {
  await approveCommand(sock, msg);
}
export async function allowCommand(sock: WASocket, msg: WAMessage) {
  await approveCommand(sock, msg);
}
export async function listrequestsCommand(sock: WASocket, msg: WAMessage) {
  await approveCommand(sock, msg);
}
export async function delallowedCommand(sock: WASocket, msg: WAMessage) {
  await approveCommand(sock, msg);
}

export async function handleGroupParticipantUpdate(
  sock: WASocket,
  update: { id: string; participants: string[]; action: string }
) {
  const { id: jid, participants, action } = update;
  const settings = getGroupSettings(jid);

  try {
    const meta = await sock.groupMetadata(jid);
    const groupName = meta.subject;

    for (const participant of participants) {
      const number = participant.split("@")[0];
      if (action === "add" && settings.welcomeEnabled) {
        const message = settings.welcomeMessage
          .replace("@user", `@${number}`)
          .replace("@group", groupName);
        await sock.sendMessage(jid, { text: message, mentions: [participant] });
      } else if (action === "remove" && settings.goodbyeEnabled) {
        const message = settings.goodbyeMessage
          .replace("@user", `+${number}`)
          .replace("@group", groupName);
        await sock.sendMessage(jid, { text: message });
      }
    }
  } catch {}
}
