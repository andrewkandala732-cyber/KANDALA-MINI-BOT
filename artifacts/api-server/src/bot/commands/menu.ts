import type { WASocket, WAMessage } from "@whiskeysockets/baileys";

export async function menuCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const menu = `
╔══════════════════════════════╗
║  🤖  *KANDALA MINI BOT*  🤖  ║
╚══════════════════════════════╝
> _Type .commandname to use_

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 *AI COMMANDS*
┣ .ai / .gpt — Ask AI anything
┣ .blackbox — Coding AI
┣ .code — Code generator
┣ .deepseek — Deep reasoning AI
┣ .gemini — Gemini-style AI
┣ .doppleai — Creative AI
┣ .story — Generate a story
┣ .recipe — Get a recipe
┣ .summarize — Summarize text
┣ .analyze — Analyze text
┣ .teach — Learn any topic
┣ .programming — Dev help
┣ .translate2 — AI translation
┗ .generate / .dalle — AI image

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎵 *AUDIO TOOLS*
┣ .tomp3 — Convert to MP3
┣ .toaudio — Extract audio
┣ .bass — Bass boost
┣ .robot — Robot voice
┣ .reverse — Reverse audio
┣ .earrape — Earrape effect
┣ .deep — Deep voice
┣ .blown — Blown speaker
┣ .volaudio [1-10] — Volume
┗ .toptt — Convert to voice note

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 *DOWNLOAD*
┣ .tiktok — TikTok video
┣ .tiktokaudio — TikTok audio
┣ .instagram — Instagram video
┣ .facebook — Facebook video
┣ .fbaudio — Facebook audio
┣ .twitter — Twitter video
┣ .twaudio — Twitter audio
┣ .song — Search & dl song
┣ .video — Search & dl video
┣ .ytmp3 — YouTube audio
┣ .ytmp4 — YouTube video
┣ .image — Image search
┗ .wallpaper — Get wallpaper

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 *FUN & GAMES*
┣ .truth — Truth question
┣ .dare — Dare challenge
┣ .truthordare — Random T/D
┣ .trivia — Trivia question
┣ .memes — Random meme
┣ .joke — Random joke
┣ .fact — Random fact
┣ .quote — Inspirational quote
┣ .roast — Random roast
┣ .truthdetector — Fun lie test
┗ .xxqc — Random funny message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 *RELIGION*
┣ .bible [verse] — Bible verse
┗ .quran [surah:ayah] — Quran

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 *SEARCH & INFO*
┣ .imdb — Movie/show info
┣ .lyrics — Song lyrics
┣ .yts — YouTube search
┣ .shazam — Identify song
┣ .weather [city] — Weather
┣ .wiki — Wikipedia search
┣ .define — Dictionary
┣ .define2 — Advanced dict
┣ .calc — Calculator
┗ .translate — Translate text

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ *TOOLS*
┣ .qrcode — Generate QR code
┣ .fancy — Fancy text style
┣ .fliptext — Flip text upside
┣ .genpass — Password generator
┣ .getpp — Get profile photo
┣ .getabout — Get user status
┣ .emojimix — Mix two emojis
┣ .tinyurl — Shorten URL
┣ .sticker — Image to sticker
┣ .toimg — Sticker to image
┣ .tts — Text to speech
┗ .device — Bot device info

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚽ *SPORTS*
┣ .eplstandings / .eplmatches
┣ .eplupcoming / .eplscorers
┣ .clstandings / .clmatches
┣ .laligastandings / .laligamatches
┣ .bundesligastandings
┣ .serieastandings / .serieamatches
┣ .ligue1standings / .ligue1matches
┣ .eflstandings / .eflmatches
┣ .elstandings / .elmatches
┣ .wcstandings / .wcmatches
┗ .wwenews / .wweschedule

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 *GROUP TOOLS* _(Admin only)_
┣ .tagall — Tag all members
┣ .tagadmin — Tag admins
┣ .hidetag [msg] — Hidden tag all
┣ .kick — Kick member
┣ .add — Add member
┣ .promote / .demote — Admin
┣ .mute / .unmute — Mute member
┣ .mutelist — List muted
┣ .warn — Warn member
┣ .kickall — Kick all members
┣ .poll — Create a poll
┣ .totalmembers — Member count
┣ .setdesc — Set description
┣ .setgroupname — Rename group
┣ .getgrouppp — Group photo
┣ .setppgroup — Set group photo
┣ .welcome [on/off] — Welcome msg
┣ .goodbye [on/off] — Bye msg
┣ .grouplink — Group invite link
┣ .invite — Invite link
┣ .revoke — Revoke group link
┣ .open / .close — Open/close
┣ .opentime / .closetime — Timed
┣ .announcements — Announce
┣ .mediatag — Tag all w/ media
┣ .listactive — List members
┣ .vcf — Export members VCF
┗ .groupid — Get group ID

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ *GROUP PROTECTION*
┣ .antilink on/off
┣ .antiaudio on/off
┣ .antiimage on/off
┣ .antivideo on/off
┣ .antisticker on/off
┣ .antigif on/off
┣ .antiforward on/off
┣ .antivoice on/off
┣ .antidocument on/off
┣ .antipoll on/off
┗ .antireaction on/off

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️ *BOT INFO*
┣ .alive — Status check
┣ .ping / .ping2 — Speed test
┣ .owner — Owner contact
┣ .runtime — Bot uptime
┣ .time — Current time
┣ .botstatus — Full status
┣ .repo — GitHub repo
┗ .userid — Your user ID

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Prefix:* .  |  👤 *Owner:* wa.me/254743760083
🤖 _KANDALA MINI BOT — Always Online_
`;
  await sock.sendMessage(jid, { text: menu }, { quoted: msg });
}
