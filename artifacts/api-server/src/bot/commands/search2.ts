import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";

function reply(sock: WASocket, msg: WAMessage, text: string) {
  return sock.sendMessage(msg.key.remoteJid!, { text }, { quoted: msg });
}

export async function lyricsCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.lyrics [song name - artist]*\nExample: .lyrics Blinding Lights - The Weeknd");
  const query = args.join(" ");

  try {
    // Try lyrics.ovh (free, no key)
    let artist = "", title = query;
    if (query.includes(" - ")) {
      const parts = query.split(" - ");
      title = parts[0].trim();
      artist = parts[1]?.trim() || "";
    }

    const encoded = artist
      ? `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
      : `https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`;

    let lyrics = "";
    if (artist) {
      const res = await axios.get(encoded, { timeout: 10000 });
      lyrics = res.data.lyrics;
    } else {
      const res = await axios.get(encoded, { timeout: 10000 });
      const song = res.data.data?.[0];
      if (song) {
        const res2 = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(song.artist.name)}/${encodeURIComponent(song.title)}`, { timeout: 10000 });
        lyrics = res2.data.lyrics;
        artist = song.artist.name;
        title = song.title;
      }
    }

    if (!lyrics) throw new Error("No lyrics found");

    // Truncate if too long
    const maxLen = 3000;
    const truncated = lyrics.length > maxLen ? lyrics.slice(0, maxLen) + "\n\n_...lyrics truncated_" : lyrics;

    await reply(sock, msg,
      `🎵 *LYRICS*\n🎤 ${title}${artist ? ` - ${artist}` : ""}\n\n${truncated}`
    );
  } catch {
    await reply(sock, msg, `❌ Lyrics not found for: _${query}_\n\nTip: Try format: *.lyrics SongName - ArtistName*`);
  }
}

export async function imdbCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.imdb [movie/show title]*\nExample: .imdb Black Panther");
  const query = args.join(" ");
  const OMDB_KEY = process.env.OMDB_API_KEY;

  try {
    let data: any;
    if (OMDB_KEY) {
      const res = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(query)}&apikey=${OMDB_KEY}&plot=short`, { timeout: 10000 });
      data = res.data;
      if (data.Response === "False") throw new Error(data.Error || "Not found");
    } else {
      // Fallback: use public OMDB demo key
      const res = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(query)}&apikey=trilogy&plot=short`, { timeout: 10000 });
      data = res.data;
      if (data.Response === "False") throw new Error("Movie not found. Add OMDB_API_KEY to Replit Secrets for better results.");
    }

    const info =
      `🎬 *${data.Title}* (${data.Year})\n\n` +
      `📌 Type: ${data.Type}\n` +
      `⭐ Rating: ${data.imdbRating}/10 (${data.imdbVotes} votes)\n` +
      `🎭 Genre: ${data.Genre}\n` +
      `🎬 Director: ${data.Director}\n` +
      `🌟 Cast: ${data.Actors}\n` +
      `⏱️ Runtime: ${data.Runtime}\n` +
      `🌍 Country: ${data.Country}\n` +
      `🏆 Awards: ${data.Awards}\n\n` +
      `📖 *Plot:*\n${data.Plot}`;

    if (data.Poster && data.Poster !== "N/A") {
      try {
        const imgRes = await axios.get(data.Poster, { responseType: "arraybuffer", timeout: 15000 });
        await sock.sendMessage(msg.key.remoteJid!, {
          image: Buffer.from(imgRes.data),
          caption: info,
        }, { quoted: msg });
        return;
      } catch {}
    }
    await reply(sock, msg, info);
  } catch (e: any) {
    await reply(sock, msg, `❌ ${e.message}`);
  }
}

export async function ytsCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.yts [search query]*\nExample: .yts Ed Sheeran Shape of You");
  try {
    const res = await axios.get(
      `https://vid.puffyan.us/api/v1/search?q=${encodeURIComponent(args.join(" "))}&type=video&sort_by=relevance`,
      { timeout: 10000 }
    );
    const results = res.data?.slice(0, 5);
    if (!results?.length) return reply(sock, msg, "❌ No results found.");

    const list = results.map((v: any, i: number) => {
      const dur = v.lengthSeconds ? `${Math.floor(v.lengthSeconds / 60)}:${String(v.lengthSeconds % 60).padStart(2, "0")}` : "?";
      const views = v.viewCount ? `${(v.viewCount / 1000000).toFixed(1)}M views` : "";
      return `${i + 1}. *${v.title}*\n   ⏱️ ${dur} | 👁️ ${views}\n   🔗 https://youtu.be/${v.videoId}`;
    }).join("\n\n");

    await reply(sock, msg, `🔎 *YOUTUBE SEARCH*\n📝 "${args.join(" ")}"\n\n${list}\n\n_Use .ytmp3/.ytmp4 with a link to download_`);
  } catch {
    await reply(sock, msg, "❌ YouTube search failed. Try again later.");
  }
}

export async function shazamCommand(sock: WASocket, msg: WAMessage) {
  await reply(sock, msg,
    `🎵 *SHAZAM*\n\n` +
    `To identify a song:\n\n` +
    `1. Open *Shazam* on your phone\n` +
    `2. Point at the audio source\n` +
    `3. Share the result here\n\n` +
    `Or use *.lyrics [song name]* if you know part of the lyrics!\n` +
    `Or try *.song [name]* to download it directly.`
  );
}

export async function define2Command(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.define2 [word]*");
  const word = args[0].toLowerCase();
  try {
    const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { timeout: 8000 });
    const entry = res.data[0];
    const meanings = entry.meanings.slice(0, 3).map((m: any) => {
      const defs = m.definitions.slice(0, 2).map((d: any, i: number) =>
        `  ${i + 1}. ${d.definition}${d.example ? `\n     _"${d.example}"_` : ""}`
      ).join("\n");
      return `*${m.partOfSpeech}*\n${defs}`;
    }).join("\n\n");

    const phonetic = entry.phonetics?.find((p: any) => p.text)?.text || "";
    await reply(sock, msg, `📚 *DEFINITION: ${word.toUpperCase()}*\n🗣️ ${phonetic}\n\n${meanings}`);
  } catch {
    await reply(sock, msg, `❌ Definition not found for: *${word}*`);
  }
}

export async function reminiCommand(sock: WASocket, msg: WAMessage) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  const image = msg.message?.imageMessage || quoted;

  if (!image) return reply(sock, msg, "Usage: Send an image with *.remini* caption, or reply to an image with *.remini*\n\nThis enhances image quality using AI.");

  // Without a paid API, we can do basic sharp enhancement
  try {
    const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
    const target = image === quoted ? {
      key: { ...msg.key, id: msg.message?.extendedTextMessage?.contextInfo?.stanzaId },
      message: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage,
    } as any : msg;

    const buf = await downloadMediaMessage(target, "buffer", {}) as Buffer;
    const sharp = (await import("sharp")).default;

    const enhanced = await sharp(buf)
      .sharpen({ sigma: 2, m1: 0.5, m2: 3 })
      .normalize()
      .jpeg({ quality: 95 })
      .toBuffer();

    await sock.sendMessage(msg.key.remoteJid!, {
      image: enhanced,
      caption: "✨ *REMINI* — Image enhanced with sharpening + normalization",
    }, { quoted: msg });
  } catch (e: any) {
    await reply(sock, msg, `❌ Enhancement failed: ${e.message}`);
  }
}
