import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { botState, getGroupSettings } from "../store.js";

// ── Core ─────────────────────────────────────────────────────────────────────
import {
  menuCommand, aimenuCommand, audiomenuCommand, downloadmenuCommand, funmenuCommand,
  gamesmenuCommand, groupmenuCommand, imagemenuCommand, othermenuCommand, ownermenuCommand,
  religionmenuCommand, searchmenuCommand, settingsmenuCommand, sportsmenuCommand,
  toolsmenuCommand, translatemenuCommand, videomenuCommand, categoriesCommand,
  botinfoCommand, groupstatusmenuCommand, supportmenuCommand, feedbackCommand,
  helpersCommand, wallpaperCommand, reminiCommand,
} from "./menu.js";
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

// ── AI Extended ───────────────────────────────────────────────────────────────
import {
  analyzeCommand, codeCommand, programmingCommand, recipeCommand, storyCommand,
  summarizeCommand, teachCommand, translate2Command, dalleCommand, generateCommand,
  geminiCommand, deepseekCommand, blackboxCommand, doppleaiCommand,
} from "./ai-extended.js";

// ── Audio ─────────────────────────────────────────────────────────────────────
import {
  tomp3Command, reverseCommand, bassCommand, robotCommand, earrapeCommand,
  blownCommand, deepCommand, topttCommand, volaudioCommand,
} from "./audio.js";

// ── Fun Extended ──────────────────────────────────────────────────────────────
import { memesCommand, triviaCommand, truthdetectorCommand, xxqcCommand, jokesCommand } from "./fun-extended.js";

// ── Games ─────────────────────────────────────────────────────────────────────
import { truthCommand, dareCommand, truthordareCommand } from "./games.js";

// ── Religion ─────────────────────────────────────────────────────────────────
import { bibleCommand, quranCommand } from "./religion.js";

// ── Search ────────────────────────────────────────────────────────────────────
import { lyricsCommand, imdbCommand, shazamCommand, ytsCommand, define2Command } from "./search.js";

// ── Tools ─────────────────────────────────────────────────────────────────────
import {
  qrcodeCommand, genpassCommand, tinyurlCommand, timeCommand, fancyCommand,
  runtimeCommand, deviceCommand, getppCommand, getaboutCommand, sswebCommand,
  emojimixCommand, flipTextCommand, obfuscateCommand, tourlCommand,
  useridCommand, gsmarenaCommand, calculateCommand, bostatusCommand, ping2Command,
  repoCommand, toviewonceCommand, runEvalCommand, filtervcfCommand,
} from "./tools.js";

// ── Video ─────────────────────────────────────────────────────────────────────
import { toaudioCommand, tovideoCommand, volvideoCommand } from "./video.js";

// ── Sports ────────────────────────────────────────────────────────────────────
import {
  eplstandingsCommand, eplmatchesCommand, eplscorersCommand, eplupcomingCommand,
  clstandingsCommand, clmatchesCommand, clscorersCommand, clupcomingCommand,
  bundesligastandingsCommand, bundesligamatchesCommand, bundesligascorersCommand, bundesligaupcomingCommand,
  laligastandingsCommand, laligamatchesCommand, laligascorersCommand, laligaupcomingCommand,
  serieastandingsCommand, serieamatchesCommand, serieascorersCommand, serieaupcomingCommand,
  ligue1standingsCommand, ligue1matchesCommand, ligue1scorersCommand, ligue1upcomingCommand,
  eflstandingsCommand, eflmatchesCommand, eflscorersCommand, eflupcomingCommand,
  elstandingsCommand, elmatchesCommand, elscorersCommand, elupcomingCommand,
  wcstandingsCommand, wcmatchesCommand, wcscorersCommand, wcupcomingCommand,
  wrestlingeventsCommand, wwenewsCommand, wwescheduleCommand,
} from "./sports.js";

// ── Group Extended ────────────────────────────────────────────────────────────
import {
  welcomeCommand, setwelcomeCommand, goodbyeCommand, setgoodbyeCommand,
  muteCommand, unmuteCommand, mutelistCommand, hidetagCommand, pollCommand,
  kickallCommand, kickinactiveCommand, totalmembersCommand, setdescCommand,
  setgroupnameCommand, mediatagCommand, warnCommand,
  antiaudioCommand, antibadwordCommand, antibotCommand, anticontactCommand,
  antidocumentCommand, antiforwardCommand, antigifCommand, antiimageCommand,
  antilinkgcCommand, antipollCommand, antistickerCommand, antivideoCommand,
  antivoiceCommand, antiforeignCommand, antidemoteCommand,
  handleGroupParticipantUpdate,
} from "./group-extended.js";

// ── Settings ──────────────────────────────────────────────────────────────────
import {
  modeCommand, getsettingsCommand, setbotnameCommand, setownernameCommand,
  setownernumberCommand, setprefixCommand, settimezoneCommand, setstatusemojiCommand,
  setwatermarkCommand, setstickerpacknameCommand, setstickerauthorCommand,
} from "./settings.js";

// ── Downloads Extended ────────────────────────────────────────────────────────
import {
  songCommand, song2Command, tiktokCommand, tiktokaudioCommand, instagramCommand,
  igaudioCommand, facebookCommand, fbaudioCommand, twitterCommand, twaudioCommand,
  pinCommand, apkCommand, downloadCommand, mediafireCommand, gdriveCommand,
  gitcloneCommand, itunesCommand, xvideoCommand, savestatusCommand,
  videodocCommand, imageCommand,
} from "./download-extended.js";

// ─────────────────────────────────────────────────────────────────────────────

function getMessageText(msg: WAMessage): string {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ""
  );
}

function getSenderJid(msg: WAMessage, sock: WASocket): string {
  return msg.key.participant ?? (msg.key.fromMe ? (sock.user?.id ?? "") : (msg.key.remoteJid ?? ""));
}

async function isMuted(msg: WAMessage, jid: string): Promise<boolean> {
  if (!jid.endsWith("@g.us")) return false;
  const settings = getGroupSettings(jid);
  const sender = msg.key.participant ?? msg.key.remoteJid ?? "";
  return settings.mutedUsers.has(sender);
}

export async function handleMessage(sock: WASocket, msg: WAMessage) {
  if (!msg.message) return;

  const jid = msg.key.remoteJid!;
  if (!jid) return;

  const text = getMessageText(msg).trim();
  if (!text) return;

  // Anti-link check
  if (jid.endsWith("@g.us")) {
    await handleAntilinkMessage(sock, msg);
  }

  // Mode check
  const mode = botState.botSettings.mode;
  const senderJid = getSenderJid(msg, sock);
  const isOwner = senderJid.includes(botState.ownerJid.split("@")[0]!);

  if (mode === "private" && !isOwner) return;
  if (mode === "group" && !jid.endsWith("@g.us") && !isOwner) return;

  // Mute check
  if (await isMuted(msg, jid)) return;

  const prefix = botState.botSettings.prefix;
  if (!text.startsWith(prefix)) return;

  const [rawCommand, ...args] = text.slice(prefix.length).trim().split(/\s+/);
  const command = rawCommand?.toLowerCase() ?? "";

  try {
    switch (command) {
      // ── Menus ────────────────────────────────────────────────────────────
      case "menu": case "help": await menuCommand(sock, msg); break;
      case "aimenu": await aimenuCommand(sock, msg); break;
      case "audiomenu": await audiomenuCommand(sock, msg); break;
      case "downloadmenu": await downloadmenuCommand(sock, msg); break;
      case "funmenu": await funmenuCommand(sock, msg); break;
      case "gamesmenu": await gamesmenuCommand(sock, msg); break;
      case "groupmenu": await groupmenuCommand(sock, msg); break;
      case "groupstatusmenu": await groupstatusmenuCommand(sock, msg); break;
      case "imagemenu": await imagemenuCommand(sock, msg); break;
      case "othermenu": await othermenuCommand(sock, msg); break;
      case "ownermenu": await ownermenuCommand(sock, msg); break;
      case "religionmenu": await religionmenuCommand(sock, msg); break;
      case "searchmenu": await searchmenuCommand(sock, msg); break;
      case "settingsmenu": await settingsmenuCommand(sock, msg); break;
      case "sportsmenu": await sportsmenuCommand(sock, msg); break;
      case "supportmenu": await supportmenuCommand(sock, msg); break;
      case "toolsmenu": await toolsmenuCommand(sock, msg); break;
      case "translatemenu": await translatemenuCommand(sock, msg); break;
      case "videomenu": await videomenuCommand(sock, msg); break;
      case "ephoto360menu": await sock.sendMessage(jid, { text: "❌ Ephoto360 effects are not available in this version." }, { quoted: msg }); break;
      case "categories": await categoriesCommand(sock, msg); break;
      case "botinfo": await botinfoCommand(sock, msg); break;
      case "feedback": await feedbackCommand(sock, msg, args); break;
      case "helpers": await helpersCommand(sock, msg); break;

      // ── General ──────────────────────────────────────────────────────────
      case "alive": await aliveCommand(sock, msg); break;
      case "ping": await pingCommand(sock, msg); break;
      case "ping2": await ping2Command(sock, msg); break;
      case "owner": await ownerCommand(sock, msg); break;
      case "repo": await repoCommand(sock, msg); break;
      case "runtime": await runtimeCommand(sock, msg); break;
      case "botstatus": await bostatusCommand(sock, msg); break;
      case "device": await deviceCommand(sock, msg); break;

      // ── Media ────────────────────────────────────────────────────────────
      case "sticker": case "s": await stickerCommand(sock, msg); break;
      case "toimg": case "toimage": await toimgCommand(sock, msg); break;
      case "tts": await ttsCommand(sock, msg, args); break;
      case "toptt": await topttCommand(sock, msg, args); break;
      case "wallpaper": await wallpaperCommand(sock, msg, args); break;
      case "remini": await reminiCommand(sock, msg); break;

      // ── Audio ────────────────────────────────────────────────────────────
      case "tomp3": await tomp3Command(sock, msg); break;
      case "reverse": await reverseCommand(sock, msg); break;
      case "bass": await bassCommand(sock, msg); break;
      case "robot": await robotCommand(sock, msg); break;
      case "earrape": await earrapeCommand(sock, msg); break;
      case "blown": await blownCommand(sock, msg); break;
      case "deep": await deepCommand(sock, msg); break;
      case "volaudio": await volaudioCommand(sock, msg, args); break;

      // ── Video ────────────────────────────────────────────────────────────
      case "toaudio": await toaudioCommand(sock, msg); break;
      case "tovideo": await tovideoCommand(sock, msg); break;
      case "volvideo": await volvideoCommand(sock, msg, args); break;

      // ── AI ───────────────────────────────────────────────────────────────
      case "ai": case "gpt": await aiCommand(sock, msg, args); break;
      case "analyze": await analyzeCommand(sock, msg, args); break;
      case "blackbox": await blackboxCommand(sock, msg, args); break;
      case "code": await codeCommand(sock, msg, args); break;
      case "dalle": await dalleCommand(sock, msg, args); break;
      case "deepseek": await deepseekCommand(sock, msg, args); break;
      case "doppleai": await doppleaiCommand(sock, msg, args); break;
      case "gemini": await geminiCommand(sock, msg, args); break;
      case "generate": await generateCommand(sock, msg, args); break;
      case "programming": await programmingCommand(sock, msg, args); break;
      case "recipe": await recipeCommand(sock, msg, args); break;
      case "story": await storyCommand(sock, msg, args); break;
      case "summarize": await summarizeCommand(sock, msg, args); break;
      case "teach": await teachCommand(sock, msg, args); break;
      case "translate2": await translate2Command(sock, msg, args); break;

      // ── Downloads ────────────────────────────────────────────────────────
      case "ytmp3": await ytdlCommand(sock, msg, args, "audio"); break;
      case "ytmp4": case "video": await ytdlCommand(sock, msg, args, "video"); break;
      case "song": await songCommand(sock, msg, args); break;
      case "song2": await song2Command(sock, msg, args); break;
      case "tiktok": await tiktokCommand(sock, msg, args); break;
      case "tiktokaudio": await tiktokaudioCommand(sock, msg, args); break;
      case "instagram": await instagramCommand(sock, msg, args); break;
      case "igaudio": await igaudioCommand(sock, msg, args); break;
      case "facebook": await facebookCommand(sock, msg, args); break;
      case "fbaudio": await fbaudioCommand(sock, msg, args); break;
      case "twitter": await twitterCommand(sock, msg, args); break;
      case "twaudio": await twaudioCommand(sock, msg, args); break;
      case "pin": await pinCommand(sock, msg, args); break;
      case "apk": await apkCommand(sock, msg, args); break;
      case "download": await downloadCommand(sock, msg, args); break;
      case "mediafire": await mediafireCommand(sock, msg, args); break;
      case "gdrive": await gdriveCommand(sock, msg, args); break;
      case "gitclone": await gitcloneCommand(sock, msg, args); break;
      case "itunes": await itunesCommand(sock, msg, args); break;
      case "telesticker": await sock.sendMessage(jid, { text: "❌ Telegram sticker conversion is not supported." }, { quoted: msg }); break;
      case "xvideo": await xvideoCommand(sock, msg, args); break;
      case "savestatus": await savestatusCommand(sock, msg); break;
      case "videodoc": await videodocCommand(sock, msg, args); break;
      case "image": await imageCommand(sock, msg, args); break;

      // ── Fun ──────────────────────────────────────────────────────────────
      case "joke": await jokeCommand(sock, msg); break;
      case "jokes": await jokesCommand(sock, msg); break;
      case "fact": await factCommand(sock, msg); break;
      case "quote": await quoteCommand(sock, msg); break;
      case "roast": await roastCommand(sock, msg); break;
      case "memes": await memesCommand(sock, msg); break;
      case "trivia": await triviaCommand(sock, msg); break;
      case "truthdetector": await truthdetectorCommand(sock, msg, args); break;
      case "xxqc": await xxqcCommand(sock, msg); break;

      // ── Games ────────────────────────────────────────────────────────────
      case "truth": await truthCommand(sock, msg); break;
      case "dare": await dareCommand(sock, msg); break;
      case "truthordare": await truthordareCommand(sock, msg, args); break;

      // ── Group ────────────────────────────────────────────────────────────
      case "tagall": await tagallCommand(sock, msg, args); break;
      case "tag": case "mediatag": await mediatagCommand(sock, msg, args); break;
      case "tagadmin": await tagadminCommand(sock, msg); break;
      case "hidetag": await hidetagCommand(sock, msg, args); break;
      case "kick": await kickCommand(sock, msg); break;
      case "kickall": await kickallCommand(sock, msg); break;
      case "kickinactive": await kickinactiveCommand(sock, msg, args); break;
      case "add": await addCommand(sock, msg, args); break;
      case "promote": await promoteCommand(sock, msg); break;
      case "demote": await demoteCommand(sock, msg); break;
      case "antilink": await antilinkCommand(sock, msg, args); break;
      case "antilinkgc": await antilinkgcCommand(sock, msg, args); break;
      case "grouplink": case "link": case "invite": await groupLinkCommand(sock, msg); break;
      case "revoke": case "resetlink": await revokeCommand(sock, msg); break;
      case "open": await openCloseCommand(sock, msg, true); break;
      case "close": await openCloseCommand(sock, msg, false); break;
      case "poll": await pollCommand(sock, msg, args); break;
      case "mute": await muteCommand(sock, msg); break;
      case "unmute": await unmuteCommand(sock, msg); break;
      case "mutelist": await mutelistCommand(sock, msg); break;
      case "welcome": await welcomeCommand(sock, msg, args); break;
      case "setwelcome": await setwelcomeCommand(sock, msg, args); break;
      case "goodbye": await goodbyeCommand(sock, msg, args); break;
      case "setgoodbye": await setgoodbyeCommand(sock, msg, args); break;
      case "totalmembers": await totalmembersCommand(sock, msg); break;
      case "setdesc": await setdescCommand(sock, msg, args); break;
      case "setgroupname": await setgroupnameCommand(sock, msg, args); break;
      case "warn": await warnCommand(sock, msg, args); break;
      case "userid": await useridCommand(sock, msg); break;
      case "announcements": await sock.sendMessage(jid, { text: "Use *.close* to make the group announcement-only." }, { quoted: msg }); break;
      // Anti- group commands
      case "antiaudio": await antiaudioCommand(sock, msg, args); break;
      case "antibadword": await antibadwordCommand(sock, msg, args); break;
      case "antibot": await antibotCommand(sock, msg, args); break;
      case "anticontact": await anticontactCommand(sock, msg, args); break;
      case "antidocument": await antidocumentCommand(sock, msg, args); break;
      case "antiforward": await antiforwardCommand(sock, msg, args); break;
      case "antigif": await antigifCommand(sock, msg, args); break;
      case "antiimage": await antiimageCommand(sock, msg, args); break;
      case "antipoll": await antipollCommand(sock, msg, args); break;
      case "antisticker": await antistickerCommand(sock, msg, args); break;
      case "antivideo": await antivideoCommand(sock, msg, args); break;
      case "antivoice": await antivoiceCommand(sock, msg, args); break;
      case "antiforeign": await antiforeignCommand(sock, msg, args); break;
      case "antidemote": await antidemoteCommand(sock, msg, args); break;
      // Stub group commands
      case "approve": case "addcode": case "allow": case "approveall":
      case "cancelkick": case "delcode": case "delppgroup": case "disapproveall":
      case "editsettings": case "getgrouppp": case "listactive": case "listallowed":
      case "listcode": case "listinactive": case "listrequests": case "reject":
      case "setppgroup": case "vcf": case "delallowed": case "closetime": case "opentime":
        await sock.sendMessage(jid, { text: `❌ \`${command}\` is not yet implemented.` }, { quoted: msg }); break;

      // ── Religion ─────────────────────────────────────────────────────────
      case "bible": await bibleCommand(sock, msg, args); break;
      case "quran": await quranCommand(sock, msg, args); break;

      // ── Search ───────────────────────────────────────────────────────────
      case "lyrics": await lyricsCommand(sock, msg, args); break;
      case "imdb": await imdbCommand(sock, msg, args); break;
      case "shazam": await shazamCommand(sock, msg); break;
      case "yts": await ytsCommand(sock, msg, args); break;
      case "define": await defineCommand(sock, msg, args); break;
      case "define2": await define2Command(sock, msg, args); break;
      case "weather": await weatherCommand(sock, msg, args); break;
      case "wiki": case "wikipedia": await wikiCommand(sock, msg, args); break;

      // ── Tools ────────────────────────────────────────────────────────────
      case "calc": case "calculate": await calcCommand(sock, msg, args); break;
      case "qrcode": await qrcodeCommand(sock, msg, args); break;
      case "genpass": await genpassCommand(sock, msg, args); break;
      case "tinyurl": await tinyurlCommand(sock, msg, args); break;
      case "time": await timeCommand(sock, msg, args); break;
      case "fancy": await fancyCommand(sock, msg, args); break;
      case "getpp": await getppCommand(sock, msg, args); break;
      case "getabout": await getaboutCommand(sock, msg, args); break;
      case "ssweb": case "sswebpc": case "sswebtab": await sswebCommand(sock, msg, args); break;
      case "emojimix": await emojimixCommand(sock, msg, args); break;
      case "fliptext": await flipTextCommand(sock, msg, args); break;
      case "obfuscate": await obfuscateCommand(sock, msg, args); break;
      case "tourl": await tourlCommand(sock, msg, args); break;
      case "gsmarena": await gsmarenaCommand(sock, msg, args); break;
      case "runeval": await runEvalCommand(sock, msg, args); break;
      case "filtervcf": await filtervcfCommand(sock, msg); break;
      case "toviewonce": await toviewonceCommand(sock, msg); break;
      case "texttopdf": await sock.sendMessage(jid, { text: "❌ PDF generation not supported." }, { quoted: msg }); break;
      case "vcc": await sock.sendMessage(jid, { text: "❌ VCC generation not available." }, { quoted: msg }); break;
      case "say": await sock.sendMessage(jid, { text: args.join(" ") || "❌ Usage: .say [text]" }); break;
      case "take": await sock.sendMessage(jid, { text: "❌ Screenshot capture not supported." }, { quoted: msg }); break;
      case "browse": await sock.sendMessage(jid, { text: args[0] ? `🌐 ${args[0]}` : "❌ Usage: .browse [URL]" }, { quoted: msg }); break;

      // ── Settings ─────────────────────────────────────────────────────────
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

      // ── Sports ───────────────────────────────────────────────────────────
      case "eplstandings": await eplstandingsCommand(sock, msg); break;
      case "eplmatches": await eplmatchesCommand(sock, msg); break;
      case "eplscorers": await eplscorersCommand(sock, msg); break;
      case "eplupcoming": await eplupcomingCommand(sock, msg); break;
      case "clstandings": await clstandingsCommand(sock, msg); break;
      case "clmatches": await clmatchesCommand(sock, msg); break;
      case "clscorers": await clscorersCommand(sock, msg); break;
      case "clupcoming": await clupcomingCommand(sock, msg); break;
      case "bundesligastandings": await bundesligastandingsCommand(sock, msg); break;
      case "bundesligamatches": await bundesligamatchesCommand(sock, msg); break;
      case "bundesligascorers": await bundesligascorersCommand(sock, msg); break;
      case "bundesligaupcoming": await bundesligaupcomingCommand(sock, msg); break;
      case "laligastandings": await laligastandingsCommand(sock, msg); break;
      case "laligamatches": await laligamatchesCommand(sock, msg); break;
      case "laligascorers": await laligascorersCommand(sock, msg); break;
      case "laligaupcoming": await laligaupcomingCommand(sock, msg); break;
      case "serieastandings": await serieastandingsCommand(sock, msg); break;
      case "serieamatches": await serieamatchesCommand(sock, msg); break;
      case "serieascorers": await serieascorersCommand(sock, msg); break;
      case "serieaupcoming": await serieaupcomingCommand(sock, msg); break;
      case "ligue1standings": await ligue1standingsCommand(sock, msg); break;
      case "ligue1matches": await ligue1matchesCommand(sock, msg); break;
      case "ligue1scorers": await ligue1scorersCommand(sock, msg); break;
      case "ligue1upcoming": await ligue1upcomingCommand(sock, msg); break;
      case "eflstandings": await eflstandingsCommand(sock, msg); break;
      case "eflmatches": await eflmatchesCommand(sock, msg); break;
      case "eflscorers": await eflscorersCommand(sock, msg); break;
      case "eflupcoming": await eflupcomingCommand(sock, msg); break;
      case "elstandings": await elstandingsCommand(sock, msg); break;
      case "elmatches": await elmatchesCommand(sock, msg); break;
      case "elscorers": await elscorersCommand(sock, msg); break;
      case "elupcoming": await elupcomingCommand(sock, msg); break;
      case "wcstandings": await wcstandingsCommand(sock, msg); break;
      case "wcmatches": await wcmatchesCommand(sock, msg); break;
      case "wcscorers": await wcscorersCommand(sock, msg); break;
      case "wcupcoming": await wcupcomingCommand(sock, msg); break;
      case "wrestlingevents": await wrestlingeventsCommand(sock, msg); break;
      case "wwenews": await wwenewsCommand(sock, msg); break;
      case "wweschedule": await wwescheduleCommand(sock, msg); break;

      // ── Translate ────────────────────────────────────────────────────────
      case "translate": case "tr": await translateCommand(sock, msg, args); break;

      // ── Owner ────────────────────────────────────────────────────────────
      case "block": await ownerBlockCommand(sock, msg, args, "block"); break;
      case "unblock": await ownerBlockCommand(sock, msg, args, "unblock"); break;
      case "delete": await deleteCommand(sock, msg); break;
      case "react": await reactCommand(sock, msg, args); break;
      case "forward": await forwardCommand(sock, msg, args); break;
      case "getid": await useridCommand(sock, msg); break;
      case "groupid": await groupidCommand(sock, msg); break;
      case "join": await joinCommand(sock, msg, args); break;
      case "leave": await leaveCommand(sock, msg); break;
      case "setbio": await setbioCommand(sock, msg, args); break;
      case "setprofilepic": await setprofilepicCommand(sock, msg); break;
      case "listblocked": await listblockedCommand(sock, msg); break;
      case "disk": await runtimeCommand(sock, msg); break;
      case "online": await sock.sendMessage(jid, { text: "✅ Bot is online!" }, { quoted: msg }); break;

      default:
        await sock.sendMessage(
          jid,
          { text: `❓ Unknown command: *${prefix}${command}*\n\nType *${prefix}menu* to see all commands.` },
          { quoted: msg }
        );
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await sock.sendMessage(jid, { text: `❌ Command error: ${errMsg}` }, { quoted: msg }).catch(() => {});
  }
}

// ── Helper command implementations ────────────────────────────────────────────

async function tagadminCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  try {
    const meta = await sock.groupMetadata(jid);
    const admins = meta.participants.filter(p => p.admin);
    const mentions = admins.map(a => a.id);
    const tags = admins.map(a => `@${a.id.split("@")[0]}`).join(" ");
    await sock.sendMessage(jid, { text: `👑 *Admins:*\n\n${tags}`, mentions }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to tag admins." }, { quoted: msg });
  }
}

async function ownerBlockCommand(sock: WASocket, msg: WAMessage, args: string[], action: "block" | "unblock") {
  const jid = msg.key.remoteJid!;
  const sender = msg.key.participant ?? msg.key.remoteJid ?? "";
  if (!sender.includes(botState.ownerJid.split("@")[0]!)) {
    return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  }
  const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    ?? (args[0] ? `${args[0].replace(/[^0-9]/g, "")}@s.whatsapp.net` : null);
  if (!target) return sock.sendMessage(jid, { text: `❌ Tag someone to ${action}.` }, { quoted: msg });
  try {
    await sock.updateBlockStatus(target, action);
    await sock.sendMessage(jid, { text: `✅ @${target.split("@")[0]} has been ${action}ed.`, mentions: [target] }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: `❌ Failed to ${action}.` }, { quoted: msg });
  }
}

async function deleteCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const quoted = msg.message?.extendedTextMessage?.contextInfo;
  if (!quoted?.stanzaId) {
    return sock.sendMessage(jid, { text: "❌ Reply to the message you want to delete." }, { quoted: msg });
  }
  try {
    await sock.sendMessage(jid, {
      delete: {
        remoteJid: jid,
        fromMe: false,
        id: quoted.stanzaId,
        participant: quoted.participant,
      },
    });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to delete message. I need to be admin." }, { quoted: msg });
  }
}

async function reactCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const emoji = args[0] ?? "❤️";
  const quoted = msg.message?.extendedTextMessage?.contextInfo;
  if (!quoted?.stanzaId) {
    return sock.sendMessage(jid, { text: "❌ Reply to a message with *.react [emoji]*" }, { quoted: msg });
  }
  await sock.sendMessage(jid, {
    react: { text: emoji, key: { remoteJid: jid, id: quoted.stanzaId, participant: quoted.participant } },
  });
}

async function forwardCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const target = args[0]?.replace(/[^0-9]/g, "");
  if (!quoted || !target) {
    return sock.sendMessage(jid, { text: "❌ Reply to a message and provide target number: *.forward [number]*" }, { quoted: msg });
  }
  try {
    await sock.sendMessage(`${target}@s.whatsapp.net`, { forward: msg });
    await sock.sendMessage(jid, { text: `✅ Forwarded to +${target}` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to forward." }, { quoted: msg });
  }
}

async function groupidCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ This is for groups only." }, { quoted: msg });
  await sock.sendMessage(jid, { text: `🆔 *Group ID:*\n\`${jid}\`` }, { quoted: msg });
}

async function joinCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const sender = msg.key.participant ?? msg.key.remoteJid ?? "";
  if (!sender.includes(botState.ownerJid.split("@")[0]!)) {
    return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  }
  const link = args[0]?.trim();
  if (!link?.includes("chat.whatsapp.com/")) {
    return sock.sendMessage(jid, { text: "❌ Usage: *.join [WhatsApp group link]*" }, { quoted: msg });
  }
  const code = link.split("chat.whatsapp.com/")[1]!;
  try {
    await sock.groupAcceptInvite(code);
    await sock.sendMessage(jid, { text: "✅ Joined the group!" }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to join group." }, { quoted: msg });
  }
}

async function leaveCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const sender = msg.key.participant ?? msg.key.remoteJid ?? "";
  if (!sender.includes(botState.ownerJid.split("@")[0]!)) {
    return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  }
  if (!jid.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
  try {
    await sock.sendMessage(jid, { text: "👋 Leaving group. Goodbye!" });
    await sock.groupLeave(jid);
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to leave group." }, { quoted: msg });
  }
}

async function setbioCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const sender = msg.key.participant ?? msg.key.remoteJid ?? "";
  if (!sender.includes(botState.ownerJid.split("@")[0]!)) {
    return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  }
  const bio = args.join(" ").trim();
  if (!bio) return sock.sendMessage(jid, { text: "❌ Usage: *.setbio [bio text]*" }, { quoted: msg });
  try {
    await sock.updateProfileStatus(bio);
    await sock.sendMessage(jid, { text: `✅ Bio updated: _${bio}_` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to update bio." }, { quoted: msg });
  }
}

async function setprofilepicCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const sender = msg.key.participant ?? msg.key.remoteJid ?? "";
  if (!sender.includes(botState.ownerJid.split("@")[0]!)) {
    return sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
  }
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
  if (!imgMsg) return sock.sendMessage(jid, { text: "❌ Send or reply to an image with *.setprofilepic*" }, { quoted: msg });
  try {
    const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
    const buffer = await downloadMediaMessage(msg, "buffer", {}) as Buffer;
    await sock.updateProfilePicture(sock.user?.id ?? "", buffer);
    await sock.sendMessage(jid, { text: "✅ Profile picture updated!" }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to update profile picture." }, { quoted: msg });
  }
}

async function listblockedCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  try {
    const blocked = await sock.fetchBlocklist();
    if (!blocked.length) {
      await sock.sendMessage(jid, { text: "✅ No blocked users." }, { quoted: msg });
      return;
    }
    const list = blocked.map(id => `• +${id.split("@")[0]}`).join("\n");
    await sock.sendMessage(jid, { text: `🚫 *Blocked Users (${blocked.length})*\n\n${list}` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to fetch blocked list." }, { quoted: msg });
  }
}

// Re-export for external use
export { handleGroupParticipantUpdate };
