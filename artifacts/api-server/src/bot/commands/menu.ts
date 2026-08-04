import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { botState } from "../store.js";

const P = () => botState.botSettings.prefix;
const getBotImage = () => botState.botSettings.menuImage || "https://files.catbox.moe/pht92g.jpg";

export async function menuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  const mode = botState.botSettings.mode;
  const modeIcon = mode === "public" ? "🌍" : mode === "group" ? "👥" : "🔒";
  const menu = `╔══════════════════════════════╗
║   🤖 *${botState.botName}*  ║
╚══════════════════════════════╝

Type *${p}[category]menu* for details.

┏▣ ◈ *QUICK MENU* ◈
│➽ ${p}aimenu         ${p}audiomenu
│➽ ${p}downloadmenu   ${p}funmenu
│➽ ${p}gamesmenu      ${p}groupmenu
│➽ ${p}imagemenu      ${p}othermenu
│➽ ${p}ownermenu      ${p}religionmenu
│➽ ${p}searchmenu     ${p}settingsmenu
│➽ ${p}sportsmenu     ${p}toolsmenu
│➽ ${p}translatemenu  ${p}videomenu
┗▣

📌 *Prefix:* ${p}
${modeIcon} *Mode:* ${mode.toUpperCase()}
👤 *Owner:* wa.me/${botState.botSettings.ownerNumber}`;

  try {
    await sock.sendMessage(jid, {
      image: { url: getBotImage() },
      caption: menu,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: menu }, { quoted: msg });
  }
}

export async function aimenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *AI MENU* ◈\n│➽ ${p}ai\n│➽ ${p}analyze\n│➽ ${p}blackbox\n│➽ ${p}code\n│➽ ${p}dalle\n│➽ ${p}deepseek\n│➽ ${p}doppleai\n│➽ ${p}gemini\n│➽ ${p}generate\n│➽ ${p}gpt\n│➽ ${p}programming\n│➽ ${p}recipe\n│➽ ${p}story\n│➽ ${p}summarize\n│➽ ${p}teach\n│➽ ${p}translate2\n┗▣`,
  }, { quoted: msg });
}

export async function audiomenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *AUDIO MENU* ◈\n│➽ ${p}bass\n│➽ ${p}blown\n│➽ ${p}deep\n│➽ ${p}earrape\n│➽ ${p}reverse\n│➽ ${p}robot\n│➽ ${p}tomp3\n│➽ ${p}toptt\n│➽ ${p}tts\n│➽ ${p}volaudio\n┗▣`,
  }, { quoted: msg });
}

export async function downloadmenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *DOWNLOAD MENU* ◈\n│➽ ${p}apk\n│➽ ${p}download\n│➽ ${p}facebook\n│➽ ${p}fbaudio\n│➽ ${p}gdrive\n│➽ ${p}gitclone\n│➽ ${p}igaudio\n│➽ ${p}image\n│➽ ${p}instagram\n│➽ ${p}itunes\n│➽ ${p}mediafire\n│➽ ${p}pin\n│➽ ${p}savestatus\n│➽ ${p}song\n│➽ ${p}song2\n│➽ ${p}tiktok\n│➽ ${p}tiktokaudio\n│➽ ${p}twaudio\n│➽ ${p}twitter\n│➽ ${p}video\n│➽ ${p}ytmp3\n│➽ ${p}ytmp4\n┗▣`,
  }, { quoted: msg });
}

export async function funmenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *FUN MENU* ◈\n│➽ ${p}fact\n│➽ ${p}joke\n│➽ ${p}jokes\n│➽ ${p}memes\n│➽ ${p}quote\n│➽ ${p}roast\n│➽ ${p}trivia\n│➽ ${p}truthdetector\n│➽ ${p}xxqc\n┗▣`,
  }, { quoted: msg });
}

export async function gamesmenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *GAMES MENU* ◈\n│➽ ${p}dare\n│➽ ${p}truth\n│➽ ${p}truthordare\n┗▣`,
  }, { quoted: msg });
}

export async function groupmenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *GROUP MENU* ◈\n│➽ ${p}add           ${p}antilink\n│➽ ${p}antiaudio     ${p}antibadword\n│➽ ${p}antibot       ${p}anticontact\n│➽ ${p}antidocument  ${p}antiforward\n│➽ ${p}antigif       ${p}antiimage\n│➽ ${p}antipoll      ${p}antisticker\n│➽ ${p}antivideo     ${p}antivoice\n│➽ ${p}close         ${p}demote\n│➽ ${p}goodbye       ${p}grouplink\n│➽ ${p}hidetag       ${p}invite\n│➽ ${p}kick          ${p}kickall\n│➽ ${p}link          ${p}mediaTag\n│➽ ${p}mute          ${p}mutelist\n│➽ ${p}open          ${p}poll\n│➽ ${p}promote       ${p}resetlink\n│➽ ${p}revoke        ${p}setdesc\n│➽ ${p}setgroupname  ${p}tag\n│➽ ${p}tagadmin      ${p}tagall\n│➽ ${p}totalmembers  ${p}unmute\n│➽ ${p}userid        ${p}warn\n│➽ ${p}welcome\n┗▣`,
  }, { quoted: msg });
}

export async function imagemenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *IMAGE MENU* ◈\n│➽ ${p}image\n│➽ ${p}sticker\n│➽ ${p}toimg\n│➽ ${p}wallpaper\n┗▣`,
  }, { quoted: msg });
}

export async function othermenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *OTHER MENU* ◈\n│➽ ${p}alive\n│➽ ${p}botstatus\n│➽ ${p}device\n│➽ ${p}ping\n│➽ ${p}ping2\n│➽ ${p}repo\n│➽ ${p}runtime\n│➽ ${p}time\n┗▣`,
  }, { quoted: msg });
}

export async function ownermenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *OWNER MENU* ◈\n│➽ ${p}block\n│➽ ${p}delete\n│➽ ${p}disk\n│➽ ${p}forward\n│➽ ${p}getid\n│➽ ${p}groupid\n│➽ ${p}join\n│➽ ${p}leave\n│➽ ${p}listblocked\n│➽ ${p}owner\n│➽ ${p}react\n│➽ ${p}runeval\n│➽ ${p}setbio\n│➽ ${p}setprofilepic\n│➽ ${p}unblock\n│➽ ${p}warn\n┗▣`,
  }, { quoted: msg });
}

export async function religionmenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *RELIGION MENU* ◈\n│➽ ${p}bible [book:chapter:verse]\n│➽ ${p}quran [surah:ayah]\n┗▣\n\nExamples:\n${p}bible John 3:16\n${p}quran 2:255`,
  }, { quoted: msg });
}

export async function searchmenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *SEARCH MENU* ◈\n│➽ ${p}define\n│➽ ${p}define2\n│➽ ${p}imdb\n│➽ ${p}lyrics\n│➽ ${p}shazam\n│➽ ${p}weather\n│➽ ${p}wiki\n│➽ ${p}yts\n┗▣`,
  }, { quoted: msg });
}

export async function settingsmenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *SETTINGS MENU* ◈\n│➽ ${p}getsettings\n│➽ ${p}mode [public/group/private]\n│➽ ${p}setbotname [name]\n│➽ ${p}setownername [name]\n│➽ ${p}setownernumber [num]\n│➽ ${p}setprefix [prefix]\n│➽ ${p}settimezone [tz]\n│➽ ${p}setwatermark [text]\n│➽ ${p}setstickerpackname [name]\n│➽ ${p}setstickerauthor [author]\n│➽ ${p}setstatusemoji [emoji]\n│➽ ${p}setwelcome [msg]\n│➽ ${p}setgoodbye [msg]\n┗▣`,
  }, { quoted: msg });
}

export async function sportsmenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *SPORTS MENU* ◈\n│🏴󠁧󠁢󠁥󠁮󠁧󠁿 EPL\n│➽ ${p}eplstandings  ${p}eplmatches\n│➽ ${p}eplscorers    ${p}eplupcoming\n│🏆 Champions League\n│➽ ${p}clstandings   ${p}clmatches\n│➽ ${p}clscorers     ${p}clupcoming\n│🇩🇪 Bundesliga\n│➽ ${p}bundesligastandings  ${p}bundesligamatches\n│🇪🇸 La Liga\n│➽ ${p}laligastandings      ${p}laligamatches\n│🇮🇹 Serie A\n│➽ ${p}serieastandings      ${p}serieamatches\n│🇫🇷 Ligue 1\n│➽ ${p}ligue1standings      ${p}ligue1matches\n│🌍 Europa League\n│➽ ${p}elstandings          ${p}elmatches\n│🌍 World Cup\n│➽ ${p}wcstandings          ${p}wcmatches\n│🤼 WWE\n│➽ ${p}wrestlingevents   ${p}wwenews\n│➽ ${p}wweschedule\n┗▣\n\n⚠️ Requires FOOTBALL_API_KEY (free at football-data.org)`,
  }, { quoted: msg });
}

export async function toolsmenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *TOOLS MENU* ◈\n│➽ ${p}calculate\n│➽ ${p}device\n│➽ ${p}emojimix\n│➽ ${p}fancy\n│➽ ${p}fliptext\n│➽ ${p}genpass\n│➽ ${p}getabout\n│➽ ${p}getpp\n│➽ ${p}gsmarena\n│➽ ${p}obfuscate\n│➽ ${p}qrcode\n│➽ ${p}runeval\n│➽ ${p}ssweb\n│➽ ${p}sticker\n│➽ ${p}time\n│➽ ${p}tinyurl\n│➽ ${p}tourl\n│➽ ${p}userid\n┗▣`,
  }, { quoted: msg });
}

export async function translatemenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *TRANSLATE MENU* ◈\n│➽ ${p}translate [lang] [text]\n│➽ ${p}translate2 [language] [text]\n│➽ ${p}tr [lang] [text]\n┗▣\n\nExamples:\n${p}translate sw Hello world\n${p}translate2 French Good morning`,
  }, { quoted: msg });
}

export async function videomenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *VIDEO MENU* ◈\n│➽ ${p}toaudio\n│➽ ${p}tovideo\n│➽ ${p}volvideo\n│➽ ${p}ytmp4\n┗▣`,
  }, { quoted: msg });
}

export async function categoriesCommand(sock: WASocket, msg: WAMessage) {
  await menuCommand(sock, msg);
}

export async function botinfoCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const s = botState.botSettings;
  const ms = Date.now() - botState.startTime.getTime();
  const uptime = (() => {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    return day > 0 ? `${day}d ${hr%24}h` : hr > 0 ? `${hr}h ${min%60}m` : `${min}m ${sec%60}s`;
  })();
  await sock.sendMessage(jid, {
    text: `🤖 *BOT INFO*\n\n📛 *Name:* ${s.botName}\n👤 *Owner:* ${s.ownerName}\n📱 *Number:* +${s.ownerNumber}\n🔤 *Prefix:* ${s.prefix}\n⚙️ *Mode:* ${s.mode}\n⏱️ *Uptime:* ${uptime}\n🌍 *Timezone:* ${s.timezone}\n💧 *Watermark:* ${s.watermark}\n\n_Powered by @whiskeysockets/baileys_`,
  }, { quoted: msg });
}

export async function groupstatusmenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, { text: "⚙️ Group status features are available via group settings commands.\nUse *.groupmenu* to see all group commands." }, { quoted: msg });
}

export async function supportmenuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const p = P();
  await sock.sendMessage(jid, {
    text: `┏▣ ◈ *SUPPORT MENU* ◈\n│➽ ${p}feedback\n│➽ ${p}helpers\n┗▣\n\n👑 *Owner:* wa.me/${botState.botSettings.ownerNumber}`,
  }, { quoted: msg });
}

export async function feedbackCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const text = args.join(" ").trim();
  if (!text) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.feedback [your message]*\nExample: .feedback The bot is amazing!" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: `✅ *Feedback received!*\n\n_"${text}"_\n\nThank you for your feedback! 🙏` }, { quoted: msg });
}

export async function helpersCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, {
    text: `🤝 *BOT HELPERS*\n\n👑 *Creator:* KANDALA\n📱 *Contact:* wa.me/${botState.botSettings.ownerNumber}\n\n_For bot support, contact the owner above._`,
  }, { quoted: msg });
}

export async function wallpaperCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const query = args.join(" ").trim() || "nature";
  await sock.sendMessage(jid, { text: `🖼️ Fetching wallpaper for "${query}"...` }, { quoted: msg });
  try {
    const { default: axios } = await import("axios");
    const res = await axios.get(`https://source.unsplash.com/random/1920x1080/?${encodeURIComponent(query)}`, {
      responseType: "arraybuffer", timeout: 15000,
    });
    await sock.sendMessage(jid, {
      image: Buffer.from(res.data as ArrayBuffer),
      caption: `🖼️ *Wallpaper: ${query}*\n_Via Unsplash_`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Could not fetch wallpaper. Try again!" }, { quoted: msg });
  }
}

export async function reminiCommand(sock: WASocket, msg: WAMessage) {
  await sock.sendMessage(msg.key.remoteJid!, { text: "❌ AI image enhancement (Remini) requires a paid API key. This feature is not available." }, { quoted: msg });
}
