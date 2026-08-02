import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";

function reply(sock: WASocket, msg: WAMessage, text: string) {
  return sock.sendMessage(msg.key.remoteJid!, { text }, { quoted: msg });
}

export async function bibleCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  try {
    let reference: string;
    if (!args.length) {
      // Random verse selection
      const books = ["John 3:16", "Psalm 23:1", "Romans 8:28", "Philippians 4:13", "Jeremiah 29:11",
        "Proverbs 3:5", "Isaiah 40:31", "Psalm 46:1", "Matthew 5:9", "Galatians 5:22"];
      reference = books[Math.floor(Math.random() * books.length)];
    } else {
      reference = args.join(" ");
    }

    const encoded = encodeURIComponent(reference);
    const res = await axios.get(`https://bible-api.com/${encoded}`, { timeout: 10000 });
    const data = res.data;

    if (data.error) return reply(sock, msg, `❌ Verse not found: ${reference}\nExample: .bible John 3:16`);

    await reply(sock, msg,
      `📖 *HOLY BIBLE*\n\n📌 ${data.reference}\n\n_"${data.text.trim()}"_\n\n🕊️ *${data.translation_name || "World English Bible"}*`
    );
  } catch (e: any) {
    await reply(sock, msg, `❌ Could not fetch Bible verse. Try: .bible John 3:16`);
  }
}

export async function quranCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  try {
    let surah = 1, ayah = 1;

    if (args.length) {
      const parts = args[0].split(":");
      if (parts.length === 2) {
        surah = parseInt(parts[0]) || 1;
        ayah = parseInt(parts[1]) || 1;
      } else {
        surah = parseInt(args[0]) || 1;
        ayah = parseInt(args[1] || "1") || 1;
      }
    } else {
      // Random verse
      surah = Math.floor(Math.random() * 114) + 1;
      ayah = 1;
    }

    const [arabicRes, translationRes] = await Promise.all([
      axios.get(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.alafasy`, { timeout: 10000 }),
      axios.get(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.asad`, { timeout: 10000 }),
    ]);

    const arabic = arabicRes.data.data;
    const translation = translationRes.data.data;

    await reply(sock, msg,
      `🕌 *HOLY QURAN*\n\n📌 Surah ${arabic.surah.englishName} (${arabic.surah.name}) — Ayah ${ayah}\n\n` +
      `🌙 *Arabic:*\n${arabic.text}\n\n` +
      `📖 *Translation (Muhammad Asad):*\n_"${translation.text}"_\n\n` +
      `📿 Surah ${arabic.surah.number}: ${arabic.surah.englishName} (${arabic.surah.englishNameTranslation})`
    );
  } catch (e: any) {
    await reply(sock, msg, `❌ Could not fetch Quran verse.\nUsage: *.quran [surah:ayah]*\nExample: .quran 2:255 (Ayatul Kursi)`);
  }
}
