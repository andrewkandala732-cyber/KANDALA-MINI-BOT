import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";

export async function lyricsCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const query = args.join(" ").trim();
  if (!query) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.lyrics [song name]*\nExample: .lyrics Bohemian Rhapsody" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "🎵 Searching lyrics..." }, { quoted: msg });
  try {
    const res = await axios.get(`https://some-random-api.com/lyrics?title=${encodeURIComponent(query)}`, { timeout: 10000 });
    const { title, author, lyrics, thumbnail } = res.data as { title: string; author: string; lyrics: string; thumbnail?: { genius: string } };
    const trimmed = lyrics.slice(0, 3000) + (lyrics.length > 3000 ? "\n...[lyrics truncated]" : "");
    await sock.sendMessage(jid, {
      text: `🎵 *${title}*\n👤 *Artist:* ${author}\n\n${trimmed}`,
    }, { quoted: msg });
  } catch {
    // Fallback to lyrics.ovh
    try {
      const parts = query.split(/\s+by\s+/i);
      const titlePart = parts[0]?.trim() ?? query;
      const artistPart = parts[1]?.trim() ?? "unknown";
      const res2 = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artistPart)}/${encodeURIComponent(titlePart)}`, { timeout: 10000 });
      const lyrics = (res2.data as any).lyrics ?? "";
      const trimmed = lyrics.slice(0, 3000) + (lyrics.length > 3000 ? "\n...[lyrics truncated]" : "");
      await sock.sendMessage(jid, { text: `🎵 *${titlePart}*\n\n${trimmed}` }, { quoted: msg });
    } catch {
      await sock.sendMessage(jid, { text: `❌ Could not find lyrics for "${query}". Try format: *.lyrics [song] by [artist]*` }, { quoted: msg });
    }
  }
}

export async function imdbCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const query = args.join(" ").trim();
  if (!query) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.imdb [movie/show name]*\nExample: .imdb The Dark Knight" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "🎬 Searching IMDB..." }, { quoted: msg });

  const apiKey = process.env["OMDB_API_KEY"];
  if (!apiKey) {
    await sock.sendMessage(jid, { text: "❌ OMDB_API_KEY not set. Ask the owner to configure it.\n\nGet a free key at: https://www.omdbapi.com/apikey.aspx" }, { quoted: msg });
    return;
  }
  try {
    const res = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(query)}&apikey=${apiKey}&plot=short`, { timeout: 10000 });
    const d = res.data as any;
    if (d.Response === "False") throw new Error("not found");
    const text = `🎬 *${d.Title}* (${d.Year})\n\n📺 *Type:* ${d.Type}\n⭐ *Rating:* ${d.imdbRating}/10 (${d.imdbVotes} votes)\n🎭 *Genre:* ${d.Genre}\n🎬 *Director:* ${d.Director}\n👥 *Cast:* ${d.Actors}\n⏱️ *Runtime:* ${d.Runtime}\n🌍 *Language:* ${d.Language}\n\n📖 *Plot:*\n${d.Plot}`;
    if (d.Poster && d.Poster !== "N/A") {
      const imgRes = await axios.get(d.Poster, { responseType: "arraybuffer", timeout: 10000 });
      await sock.sendMessage(jid, { image: Buffer.from(imgRes.data), caption: text }, { quoted: msg });
    } else {
      await sock.sendMessage(jid, { text }, { quoted: msg });
    }
  } catch {
    await sock.sendMessage(jid, { text: `❌ No results found for "${query}".` }, { quoted: msg });
  }
}

export async function shazamCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, { text: "🎵 Shazam requires a RapidAPI key (Shazam API).\n\nSet RAPIDAPI_KEY to use this command." }, { quoted: msg });
}

export async function ytsCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const query = args.join(" ").trim();
  if (!query) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.yts [search query]*\nExample: .yts Afrobeats 2024 mix" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "🔍 Searching YouTube..." }, { quoted: msg });
  try {
    const ytdl = (await import("@distube/ytdl-core")).default;
    const res = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000,
    });
    const matches = (res.data as string).match(/\/watch\?v=([a-zA-Z0-9_-]{11})/g) ?? [];
    const ids = [...new Set(matches.map((m: string) => m.replace("/watch?v=", "")))].slice(0, 5);
    if (!ids.length) throw new Error("no results");
    const results: string[] = [];
    for (const id of ids) {
      try {
        const info = await ytdl.getBasicInfo(`https://www.youtube.com/watch?v=${id}`);
        const { title, lengthSeconds, author } = info.videoDetails;
        const dur = parseInt(lengthSeconds);
        const mins = Math.floor(dur / 60);
        const secs = dur % 60;
        results.push(`▶️ *${title}*\n👤 ${author.name} | ⏱️ ${mins}:${secs.toString().padStart(2, "0")}\n🔗 https://youtu.be/${id}`);
      } catch {}
    }
    await sock.sendMessage(jid, { text: `🔍 *YouTube Results for:* "${query}"\n\n${results.join("\n\n")}` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: `❌ No YouTube results found for "${query}".` }, { quoted: msg });
  }
}

export async function define2Command(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const word = args.join(" ").trim();
  if (!word) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.define2 [word or phrase]*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "📚 Looking up definition..." }, { quoted: msg });
  try {
    const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { timeout: 10000 });
    const entries = res.data as any[];
    const allMeanings: string[] = [];
    for (const entry of entries.slice(0, 2)) {
      for (const meaning of entry.meanings.slice(0, 2)) {
        const defs = meaning.definitions.slice(0, 2).map((d: any, i: number) =>
          `${i + 1}. ${d.definition}${d.example ? `\n   _"${d.example}"_` : ""}`
        ).join("\n");
        allMeanings.push(`*${meaning.partOfSpeech}*\n${defs}`);
      }
    }
    const phonetic = entries[0]?.phonetic ?? "";
    await sock.sendMessage(jid, {
      text: `📚 *${word.toUpperCase()}* ${phonetic}\n\n${allMeanings.join("\n\n")}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: `❌ No definition found for "${word}".` }, { quoted: msg });
  }
}
