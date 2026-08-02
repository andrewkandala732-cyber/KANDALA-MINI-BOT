import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { menuCommand } from "./menu.js";
import { aliveCommand } from "./alive.js";
import { pingCommand } from "./ping.js";
import { ownerCommand } from "./owner.js";
import { stickerCommand } from "./sticker.js";
import { toimgCommand } from "./toimg.js";
import { aiCommand } from "./ai.js";
import { ttsCommand } from "./tts.js";
import { ytdlCommand } from "./ytdl.js";
import { tagallCommand } from "./tagall.js";
import { antilinkCommand, handleAntilinkMessage } from "./antilink.js";
import {
  kickCommand, addCommand, promoteCommand, demoteCommand,
  groupLinkCommand, revokeCommand, openCloseCommand,
} from "./group.js";
import {
  jokeCommand, factCommand, quoteCommand, roastCommand,
  weatherCommand, wikiCommand, calcCommand, defineCommand, translateCommand,
} from "./extra.js";
import { botState } from "../store.js";

// Settings
import {
  modeCommand, getsettingsCommand, setbotnameCommand, setownernameCommand,
  setownernumberCommand, setprefixCommand, settimezoneCommand, setstatusemojiCommand,
  setwatermarkCommand, setstickerpacknameCommand, setstickerauthorCommand,
} from "./settings.js";

// AI2
import {
  codeCommand, storyCommand, recipeCommand, summarizeCommand, analyzeCommand,
  teachCommand, programmingCommand, translate2Command, generateCommand, dalleCommand,
  blackboxCommand, deepseekCommand, geminiCommand, doppleaiCommand,
} from "./ai2.js";

// Games
import {
  truthCommand, dareCommand, truthordareCommand, triviaCommand, memesCommand,
  truthdetectorCommand, xxqcCommand,
} from "./games.js";

// Religion
import { bibleCommand, quranCommand } from "./religion.js";

// Audio
import {
  tomp3Command, bassCommand, robotCommand, reverseCommand, earrapeCommand,
  deepCommand, blownCommand, volaudioCommand, toppttCommand, toaudioCommand,
} from "./audio.js";

// Downloads
import {
  tiktokCommand, tiktokaudioCommand, instagramCommand, facebookCommand, fbaudioCommand,
  twitterCommand, twaudioCommand, songCommand, song2Command, videoCommand,
  videodocCommand, imageCommand, wallpaperCommand,
} from "./download2.js";

// Tools2
import {
  qrcodeCommand, fancyCommand, fliptextCommand, genpassCommand,
  getppCommand, getaboutCommand, emojimixCommand, tinyurlCommand,
  runtimeCommand, timeCommand, botstatusCommand, repoCommand,
  ping2Command, deviceCommand, useridCommand,
} from "./tools2.js";

// Group2
import {
  muteCommand, unmuteCommand, mutelistCommand, hidetagCommand, tagadminCommand,
  setdescCommand, setgroupnameCommand, getgroupppCommand, setppgroupCommand,
  welcomeCommand, goodbyeCommand, pollCommand, totalmembersCommand, kickallCommand,
  warnCommand, kickinactiveCommand, closetimeCommand, opentimeCommand,
  antiaudioCommand, antiimageCommand, antivideoCommand, antistickerCommand,
  antigifCommand, antiforwardCommand, antivoiceCommand, antidocumentCommand,
  antipollCommand, antireactionCommand, inviteCommand, groupidCommand,
  announcementsCommand, mediatagCommand, listactiveCommand, listrequestsCommand, vcfCommand,
} from "./group2.js";

// Search2
import {
  lyricsCommand, imdbCommand, ytsCommand, shazamCommand, define2Command, reminiCommand,
} from "./search2.js";

// Sports
import {
  eplstandingsCommand, eplmatchesCommand, eplupcomingCommand, eplscorersCommand,
  clstandingsCommand, clmatchesCommand, clupcomingCommand, clscorersCommand,
  laligastandingsCommand, laligamatchesCommand, laligaupcomingCommand, laligascorersCommand,
  bundesligastandingsCommand, bundesligamatchesCommand, bundesligaupcomingCommand, bundesligascorersCommand,
  serieastandingsCommand, serieamatchesCommand, serieaupcomingCommand, serieascorersCommand,
  ligue1standingsCommand, ligue1matchesCommand, ligue1upcomingCommand, ligue1scorersCommand,
  eflstandingsCommand, eflmatchesCommand, eflupcomingCommand, eflscorersCommand,
  elstandingsCommand, elmatchesCommand, elupcomingCommand, elscorersCommand,
  wcstandingsCommand, wcmatchesCommand, wcupcomingCommand, wcscorersCommand,
  wwenewsCommand, wwescheduleCommand, wrestlingeventsCommand,
} from "./sports.js";

function getMessageText(msg: WAMessage): string {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.documentMessage?.caption ||
    ""
  );
}

// Handle welcome/goodbye on group participant updates
export async function handleGroupParticipantUpdate(
  sock: WASocket,
  update: { id: string; participants: string[]; action: string }
) {
  const { id: jid, participants, action } = update;
  const settings = botState.groupSettings.get(jid);
  if (!settings) return;

  try {
    const meta = await sock.groupMetadata(jid);
    for (const participant of participants) {
      const number = participant.split("@")[0];
      if (action === "add" && settings.welcome) {
        const text = settings.welcome
          .replace(/{name}/g, `+${number}`)
          .replace(/{groupname}/g, meta.subject);
        await sock.sendMessage(jid, { text, mentions: [participant] });
      } else if (action === "remove" && settings.goodbye) {
        const text = settings.goodbye
          .replace(/{name}/g, `+${number}`)
          .replace(/{groupname}/g, meta.subject);
        await sock.sendMessage(jid, { text, mentions: [participant] });
      }
    }
  } catch {}
}

export async function handleMessage(sock: WASocket, msg: WAMessage) {
  if (!msg.message) return;

  const jid = msg.key.remoteJid!;
  if (!jid) return;

  const text = getMessageText(msg).trim();
  if (!text) return;

  const senderJid = msg.key.participant ?? (msg.key.fromMe ? (sock.user?.id ?? jid) : jid);

  // ── Group anti-media enforcement ──────────────────────────────────────────
  if (jid.endsWith("@g.us")) {
    await handleAntilinkMessage(sock, msg);
    await handleAntiMedia(sock, msg);
  }

  if (!text.startsWith(".")) return;

  const [rawCommand, ...args] = text.slice(1).trim().split(/\s+/);
  const command = rawCommand?.toLowerCase() ?? "";

  const isOwner = senderJid.startsWith(botState.ownerJid.split("@")[0]!);

  try {
    switch (command) {

      // ── General ────────────────────────────────────────────────────────────
      case "menu": case "help": await menuCommand(sock, msg); break;
      case "alive":             await aliveCommand(sock, msg); break;
      case "ping":              await pingCommand(sock, msg); break;
      case "ping2":             await ping2Command(sock, msg); break;
      case "owner":             await ownerCommand(sock, msg); break;
      case "runtime":           await runtimeCommand(sock, msg); break;
      case "time":              await timeCommand(sock, msg); break;
      case "botstatus":         await botstatusCommand(sock, msg); break;
      case "repo":              await repoCommand(sock, msg); break;
      case "device":            await deviceCommand(sock, msg); break;
      case "userid":            await useridCommand(sock, msg); break;
      case "botinfo":           await botstatusCommand(sock, msg); break;

      // ── Media ──────────────────────────────────────────────────────────────
      case "s": case "sticker": await stickerCommand(sock, msg); break;
      case "toimg": case "toimage": await toimgCommand(sock, msg); break;
      case "tts":               await ttsCommand(sock, msg, args); break;
      case "remini":            await reminiCommand(sock, msg); break;

      // ── AI ─────────────────────────────────────────────────────────────────
      case "ai": case "gpt": case "chatgpt": await aiCommand(sock, msg, args); break;
      case "blackbox":          await blackboxCommand(sock, msg, args); break;
      case "code":              await codeCommand(sock, msg, args); break;
      case "deepseek":          await deepseekCommand(sock, msg, args); break;
      case "gemini":            await geminiCommand(sock, msg, args); break;
      case "doppleai":          await doppleaiCommand(sock, msg, args); break;
      case "story":             await storyCommand(sock, msg, args); break;
      case "recipe":            await recipeCommand(sock, msg, args); break;
      case "summarize":         await summarizeCommand(sock, msg, args); break;
      case "analyze":           await analyzeCommand(sock, msg, args); break;
      case "teach":             await teachCommand(sock, msg, args); break;
      case "programming":       await programmingCommand(sock, msg, args); break;
      case "translate2":        await translate2Command(sock, msg, args); break;
      case "generate": case "dalle": await generateCommand(sock, msg, args); break;

      // ── Audio ──────────────────────────────────────────────────────────────
      case "tomp3":             await tomp3Command(sock, msg); break;
      case "toaudio":           await toaudioCommand(sock, msg); break;
      case "bass":              await bassCommand(sock, msg); break;
      case "robot":             await robotCommand(sock, msg); break;
      case "reverse":           await reverseCommand(sock, msg); break;
      case "earrape":           await earrapeCommand(sock, msg); break;
      case "deep":              await deepCommand(sock, msg); break;
      case "blown":             await blownCommand(sock, msg); break;
      case "volaudio":          await volaudioCommand(sock, msg, args); break;
      case "toptt":             await toppttCommand(sock, msg); break;

      // ── Downloads ──────────────────────────────────────────────────────────
      case "ytmp3": case "ytaudio": await ytdlCommand(sock, msg, args, "audio"); break;
      case "ytmp4": case "ytvideo": await ytdlCommand(sock, msg, args, "video"); break;
      case "tiktok":            await tiktokCommand(sock, msg, args); break;
      case "tiktokaudio":       await tiktokaudioCommand(sock, msg, args); break;
      case "instagram":         await instagramCommand(sock, msg, args); break;
      case "facebook":          await facebookCommand(sock, msg, args); break;
      case "fbaudio":           await fbaudioCommand(sock, msg, args); break;
      case "twitter":           await twitterCommand(sock, msg, args); break;
      case "twaudio":           await twaudioCommand(sock, msg, args); break;
      case "song": case "song2": await songCommand(sock, msg, args); break;
      case "video": case "videodoc": await videoCommand(sock, msg, args); break;
      case "image":             await imageCommand(sock, msg, args); break;
      case "wallpaper":         await wallpaperCommand(sock, msg, args); break;

      // ── Fun & Games ────────────────────────────────────────────────────────
      case "truth":             await truthCommand(sock, msg); break;
      case "dare":              await dareCommand(sock, msg); break;
      case "truthordare":       await truthordareCommand(sock, msg); break;
      case "trivia":            await triviaCommand(sock, msg); break;
      case "memes":             await memesCommand(sock, msg); break;
      case "joke": case "jokes": await jokeCommand(sock, msg); break;
      case "fact":              await factCommand(sock, msg); break;
      case "quote": case "quotes": await quoteCommand(sock, msg); break;
      case "roast":             await roastCommand(sock, msg); break;
      case "truthdetector":     await truthdetectorCommand(sock, msg, args); break;
      case "xxqc":              await xxqcCommand(sock, msg); break;

      // ── Religion ───────────────────────────────────────────────────────────
      case "bible":             await bibleCommand(sock, msg, args); break;
      case "quran":             await quranCommand(sock, msg, args); break;

      // ── Search & Info ──────────────────────────────────────────────────────
      case "weather":           await weatherCommand(sock, msg, args); break;
      case "wiki": case "wikipedia": await wikiCommand(sock, msg, args); break;
      case "calc": case "calculate": await calcCommand(sock, msg, args); break;
      case "define":            await defineCommand(sock, msg, args); break;
      case "define2":           await define2Command(sock, msg, args); break;
      case "translate": case "tr": await translateCommand(sock, msg, args); break;
      case "imdb":              await imdbCommand(sock, msg, args); break;
      case "lyrics":            await lyricsCommand(sock, msg, args); break;
      case "yts":               await ytsCommand(sock, msg, args); break;
      case "shazam":            await shazamCommand(sock, msg); break;

      // ── Tools ──────────────────────────────────────────────────────────────
      case "qrcode":            await qrcodeCommand(sock, msg, args); break;
      case "fancy":             await fancyCommand(sock, msg, args); break;
      case "fliptext":          await fliptextCommand(sock, msg, args); break;
      case "genpass":           await genpassCommand(sock, msg, args); break;
      case "getpp":             await getppCommand(sock, msg); break;
      case "getabout":          await getaboutCommand(sock, msg); break;
      case "emojimix":          await emojimixCommand(sock, msg, args); break;
      case "tinyurl":           await tinyurlCommand(sock, msg, args); break;

      // ── Sports ─────────────────────────────────────────────────────────────
      case "eplstandings":      await eplstandingsCommand(sock, msg); break;
      case "eplmatches":        await eplmatchesCommand(sock, msg); break;
      case "eplupcoming":       await eplupcomingCommand(sock, msg); break;
      case "eplscorers":        await eplscorersCommand(sock, msg); break;
      case "clstandings":       await clstandingsCommand(sock, msg); break;
      case "clmatches":         await clmatchesCommand(sock, msg); break;
      case "clupcoming":        await clupcomingCommand(sock, msg); break;
      case "clscorers":         await clscorersCommand(sock, msg); break;
      case "laligastandings":   await laligastandingsCommand(sock, msg); break;
      case "laligamatches":     await laligamatchesCommand(sock, msg); break;
      case "laligaupcoming":    await laligaupcomingCommand(sock, msg); break;
      case "laligascorers":     await laligascorersCommand(sock, msg); break;
      case "bundesligastandings": await bundesligastandingsCommand(sock, msg); break;
      case "bundesligamatches": await bundesligamatchesCommand(sock, msg); break;
      case "bundesligaupcoming": await bundesligaupcomingCommand(sock, msg); break;
      case "bundesligascorers": await bundesligascorersCommand(sock, msg); break;
      case "serieastandings":   await serieastandingsCommand(sock, msg); break;
      case "serieamatches":     await serieamatchesCommand(sock, msg); break;
      case "serieaupcoming":    await serieaupcomingCommand(sock, msg); break;
      case "serieascorers":     await serieascorersCommand(sock, msg); break;
      case "ligue1standings":   await ligue1standingsCommand(sock, msg); break;
      case "ligue1matches":     await ligue1matchesCommand(sock, msg); break;
      case "ligue1upcoming":    await ligue1upcomingCommand(sock, msg); break;
      case "ligue1scorers":     await ligue1scorersCommand(sock, msg); break;
      case "eflstandings":      await eflstandingsCommand(sock, msg); break;
      case "eflmatches":        await eflmatchesCommand(sock, msg); break;
      case "eflupcoming":       await eflupcomingCommand(sock, msg); break;
      case "eflscorers":        await eflscorersCommand(sock, msg); break;
      case "elstandings":       await elstandingsCommand(sock, msg); break;
      case "elmatches":         await elmatchesCommand(sock, msg); break;
      case "elupcoming":        await elupcomingCommand(sock, msg); break;
      case "elscorers":         await elscorersCommand(sock, msg); break;
      case "wcstandings":       await wcstandingsCommand(sock, msg); break;
      case "wcmatches":         await wcmatchesCommand(sock, msg); break;
      case "wcupcoming":        await wcupcomingCommand(sock, msg); break;
      case "wcscorers":         await wcscorersCommand(sock, msg); break;
      case "wwenews":           await wwenewsCommand(sock, msg); break;
      case "wweschedule":       await wwescheduleCommand(sock, msg); break;
      case "wrestlingevents":   await wrestlingeventsCommand(sock, msg); break;

      // ── Group Management ───────────────────────────────────────────────────
      case "tagall":            await tagallCommand(sock, msg, args); break;
      case "tagadmin":          await tagadminCommand(sock, msg, args); break;
      case "hidetag":           await hidetagCommand(sock, msg, args); break;
      case "kick":              await kickCommand(sock, msg); break;
      case "add":               await addCommand(sock, msg, args); break;
      case "promote":           await promoteCommand(sock, msg); break;
      case "demote":            await demoteCommand(sock, msg); break;
      case "mute":              await muteCommand(sock, msg); break;
      case "unmute":            await unmuteCommand(sock, msg); break;
      case "mutelist":          await mutelistCommand(sock, msg); break;
      case "warn":              await warnCommand(sock, msg, args); break;
      case "kickall":           await kickallCommand(sock, msg); break;
      case "kickinactive":      await kickinactiveCommand(sock, msg); break;
      case "poll":              await pollCommand(sock, msg, args); break;
      case "totalmembers":      await totalmembersCommand(sock, msg); break;
      case "setdesc":           await setdescCommand(sock, msg, args); break;
      case "setgroupname":      await setgroupnameCommand(sock, msg, args); break;
      case "getgrouppp":        await getgroupppCommand(sock, msg); break;
      case "setppgroup":        await setppgroupCommand(sock, msg); break;
      case "welcome":           await welcomeCommand(sock, msg, args); break;
      case "goodbye":           await goodbyeCommand(sock, msg, args); break;
      case "grouplink": case "link": await groupLinkCommand(sock, msg); break;
      case "invite":            await inviteCommand(sock, msg); break;
      case "revoke": case "resetlink": await revokeCommand(sock, msg); break;
      case "open":              await openCloseCommand(sock, msg, true); break;
      case "close":             await openCloseCommand(sock, msg, false); break;
      case "opentime":          await opentimeCommand(sock, msg, args); break;
      case "closetime":         await closetimeCommand(sock, msg, args); break;
      case "announcements":     await announcementsCommand(sock, msg, args); break;
      case "mediatag":          await mediatagCommand(sock, msg, args); break;
      case "listactive":        await listactiveCommand(sock, msg); break;
      case "listrequests":      await listrequestsCommand(sock, msg); break;
      case "groupid":           await groupidCommand(sock, msg); break;
      case "vcf":               await vcfCommand(sock, msg); break;

      // ── Group Protection ───────────────────────────────────────────────────
      case "antilink":          await antilinkCommand(sock, msg, args); break;
      case "antiaudio":         await antiaudioCommand(sock, msg, args); break;
      case "antiimage":         await antiimageCommand(sock, msg, args); break;
      case "antivideo":         await antivideoCommand(sock, msg, args); break;
      case "antisticker":       await antistickerCommand(sock, msg, args); break;
      case "antigif":           await antigifCommand(sock, msg, args); break;
      case "antiforward":       await antiforwardCommand(sock, msg, args); break;
      case "antivoice":         await antivoiceCommand(sock, msg, args); break;
      case "antidocument":      await antidocumentCommand(sock, msg, args); break;
      case "antipoll":          await antipollCommand(sock, msg, args); break;
      case "antireaction":      await antireactionCommand(sock, msg, args); break;

      // ── Settings ──────────────────────────────────────────────────────────────
      case "mode": await modeCommand(sock, msg, args); break;
      case "getsettings": await getsettingsCommand(sock, msg); break;
      case "setbotname": await setbotnameCommand(sock, msg, args); break;
      case "setownername": await setownernameCommand(sock, msg, args); break;
      case "setownernumber": await setownernumberCommand(sock, msg, args); break;
      case "setprefix": await setprefixCommand(sock, msg, args); break;
      case "settimezone": await settimezoneCommand(sock, msg, args); break;
      case "setstatusemoji": await setstatusemojiCommand(sock, msg, args); break;
      case "setwatermark": await setwatermarkCommand(sock, msg, args); break;
      case "setstickerpackname": await setstickerpacknameCommand(sock, msg, args); break;
      case "setstickerauthor": await setstickerauthorCommand(sock, msg, args); break;

      default:
        await sock.sendMessage(
          jid,
          { text: `❓ Unknown command: *.${command}*\n\nType *.menu* to see all commands.` },
          { quoted: msg }
        );
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await sock.sendMessage(jid, { text: `❌ Command error: ${errMsg}` }, { quoted: msg }).catch(() => {});
  }
}

// ── Anti-media enforcement ────────────────────────────────────────────────────
async function handleAntiMedia(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const m = msg.message;
  if (!m) return;

  const settings = botState.groupSettings.get(jid);
  if (!settings) return;

  const senderJid = msg.key.participant || jid;
  const isAdmin = async () => {
    try {
      const meta = await sock.groupMetadata(jid);
      return meta.participants.some(p => p.id === senderJid && p.admin);
    } catch { return false; }
  };

  // Check muted members
  if (settings.muted?.has(senderJid)) {
    try {
      await sock.sendMessage(jid, { delete: msg.key });
    } catch {}
    return;
  }

  const checks: Array<[boolean | undefined, keyof typeof m]> = [
    [settings.antiaudio,    "audioMessage"],
    [settings.antiimage,    "imageMessage"],
    [settings.antivideo,    "videoMessage"],
    [settings.antisticker,  "stickerMessage"],
    [settings.antigif,      "videoMessage"],
    [settings.antivoice,    "audioMessage"],
    [settings.antidocument, "documentMessage"],
  ];

  for (const [enabled, key] of checks) {
    if (enabled && m[key]) {
      if (await isAdmin()) return; // Admins exempt
      try {
        await sock.sendMessage(jid, { delete: msg.key });
        await sock.sendMessage(jid, {
          text: `⚠️ @${senderJid.split("@")[0]} — This type of media is not allowed here.`,
          mentions: [senderJid],
        });
      } catch {}
      return;
    }
  }

  // Anti-forward
  if (settings.antiforward && m.extendedTextMessage?.contextInfo?.isForwarded) {
    if (await isAdmin()) return;
    try { await sock.sendMessage(jid, { delete: msg.key }); } catch {}
  }
}
