import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";

export async function bibleCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const ref = args.join(" ").trim();

  if (!ref) {
    // Random verse
    const randomRefs = ["John 3:16", "Psalm 23:1", "Romans 8:28", "Philippians 4:13", "Proverbs 3:5", "Isaiah 40:31", "Jeremiah 29:11"];
    const randomRef = randomRefs[Math.floor(Math.random() * randomRefs.length)]!;
    try {
      const res = await axios.get(`https://bible-api.com/${encodeURIComponent(randomRef)}`, { timeout: 10000 });
      const { text, reference } = res.data as { text: string; reference: string };
      await sock.sendMessage(jid, { text: `📖 *BIBLE — Daily Verse*\n\n_"${text.trim()}"_\n\n— **${reference}**` }, { quoted: msg });
    } catch {
      await sock.sendMessage(jid, { text: "❌ Failed to fetch Bible verse. Try again!" }, { quoted: msg });
    }
    return;
  }

  await sock.sendMessage(jid, { text: `📖 Fetching "${ref}"...` }, { quoted: msg });
  try {
    const res = await axios.get(`https://bible-api.com/${encodeURIComponent(ref)}`, { timeout: 10000 });
    const { text, reference } = res.data as { text: string; reference: string };
    await sock.sendMessage(jid, {
      text: `📖 *BIBLE*\n\n*Reference:* ${reference}\n\n_"${text.trim()}"_`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: `❌ Could not find "${ref}". Try format: *John 3:16* or *Psalm 23:1-3*` }, { quoted: msg });
  }
}

export async function quranCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const ref = args.join(":").trim();

  let surah = 1, ayah = 1;

  if (!ref) {
    surah = Math.floor(Math.random() * 114) + 1;
    ayah = 1;
  } else {
    const parts = ref.split(/[:. ]/);
    surah = parseInt(parts[0] ?? "1") || 1;
    ayah = parseInt(parts[1] ?? "1") || 1;
  }

  await sock.sendMessage(jid, { text: `☪️ Fetching Quran ${surah}:${ayah}...` }, { quoted: msg });

  try {
    const [textRes, audioRes] = await Promise.all([
      axios.get(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surah}&verse_key=${surah}:${ayah}`, { timeout: 10000 }),
      axios.get(`https://api.quran.com/api/v4/quran/translations/131?verse_key=${surah}:${ayah}`, { timeout: 10000 }),
    ]);

    const arabic = textRes.data?.verses?.[0]?.text_uthmani ?? "";
    const translation = audioRes.data?.translations?.[0]?.text ?? "";
    const cleanTranslation = translation.replace(/<[^>]+>/g, "");

    await sock.sendMessage(jid, {
      text: `☪️ *QURAN*\n\n*Surah ${surah}:${ayah}*\n\n🕌 *Arabic:*\n${arabic}\n\n📖 *Translation (English):*\n_"${cleanTranslation}"_`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: `❌ Could not find Quran ${surah}:${ayah}. Try format: *.quran 2:255*` }, { quoted: msg });
  }
}
