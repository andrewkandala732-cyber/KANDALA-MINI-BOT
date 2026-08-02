import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";

const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything! 😄",
  "What do you call a fake noodle? An Impasta! 🍝",
  "Why did the math book look so sad? Because it had too many problems! 📚",
  "What do you call cheese that isn't yours? Nacho cheese! 🧀",
  "Why can't you give Elsa a balloon? Because she'll let it go! 🎈",
  "What do you call a sleeping dinosaur? A dino-snore! 🦕",
  "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾",
  "What do you call a fish without eyes? A fsh! 🐟",
];

const FACTS = [
  "🌍 Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible.",
  "🐙 Octopuses have three hearts. Two pump blood to the gills, one pumps it to the rest of the body.",
  "🌊 The Pacific Ocean is larger than all of Earth's landmasses combined.",
  "🐘 Elephants are the only animals that can't jump.",
  "🌙 A day on Venus is longer than a year on Venus.",
  "🦋 Butterflies taste with their feet.",
  "⚡ Lightning strikes the Earth about 100 times every second.",
  "🧠 Your brain generates enough electricity to power a small light bulb.",
];

const QUOTES = [
  "💬 *The only way to do great work is to love what you do.* — Steve Jobs",
  "💬 *In the middle of every difficulty lies opportunity.* — Albert Einstein",
  "💬 *It does not matter how slowly you go as long as you do not stop.* — Confucius",
  "💬 *Life is what happens when you're busy making other plans.* — John Lennon",
  "💬 *The future belongs to those who believe in the beauty of their dreams.* — Eleanor Roosevelt",
  "💬 *Spread love everywhere you go.* — Mother Teresa",
  "💬 *When you reach the end of your rope, tie a knot and hang on.* — Franklin D. Roosevelt",
];

const ROASTS = [
  "You're not stupid, you just have bad luck thinking. 😂",
  "I'd roast you, but my mom said I'm not allowed to burn trash. 🗑️",
  "You're like a cloud — when you disappear, it's a beautiful day! ☁️",
  "I'm not saying I hate you, but I would unplug your life support to charge my phone. 📱",
  "You're the reason God created the middle finger. 🖕",
  "Some people are born great. You were just born. 😅",
];

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export async function jokeCommand(sock: WASocket, msg: WAMessage) {
  await sock.sendMessage(msg.key.remoteJid!, { text: `😂 *Random Joke*\n\n${random(JOKES)}` }, { quoted: msg });
}

export async function factCommand(sock: WASocket, msg: WAMessage) {
  await sock.sendMessage(msg.key.remoteJid!, { text: `📖 *Random Fact*\n\n${random(FACTS)}` }, { quoted: msg });
}

export async function quoteCommand(sock: WASocket, msg: WAMessage) {
  await sock.sendMessage(msg.key.remoteJid!, { text: `✨ *Quote of the Day*\n\n${random(QUOTES)}` }, { quoted: msg });
}

export async function roastCommand(sock: WASocket, msg: WAMessage) {
  await sock.sendMessage(msg.key.remoteJid!, { text: `🔥 *Roast Time!*\n\n${random(ROASTS)}` }, { quoted: msg });
}

export async function weatherCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const city = args.join(" ").trim();
  if (!city) return sock.sendMessage(jid, { text: "❌ Usage: *.weather [city]*\nExample: .weather Nairobi" }, { quoted: msg });

  try {
    const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=4`, { timeout: 10000 });
    await sock.sendMessage(jid, { text: `🌤️ *Weather for ${city}*\n\n${res.data}` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Could not fetch weather. Check the city name." }, { quoted: msg });
  }
}

export async function wikiCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const query = args.join(" ").trim();
  if (!query) return sock.sendMessage(jid, { text: "❌ Usage: *.wiki [topic]*" }, { quoted: msg });

  try {
    const res = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
      { timeout: 10000 }
    );
    const { title, extract } = res.data as { title: string; extract: string };
    const summary = extract?.slice(0, 800) + (extract?.length > 800 ? "..." : "");
    await sock.sendMessage(jid, {
      text: `📖 *${title}*\n\n${summary}\n\n🔗 https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Nothing found on Wikipedia for that topic." }, { quoted: msg });
  }
}

export async function calcCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const expr = args.join(" ").trim();
  if (!expr) return sock.sendMessage(jid, { text: "❌ Usage: *.calc [expression]*\nExample: .calc 5 * 12 + 3" }, { quoted: msg });

  try {
    const safe = expr.replace(/[^0-9+\-*/.() %]/g, "");
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${safe})`)();
    await sock.sendMessage(jid, { text: `🧮 *Calculator*\n\n📥 ${expr}\n📤 *${result}*` }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Invalid expression." }, { quoted: msg });
  }
}

export async function defineCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const word = args[0];
  if (!word) return sock.sendMessage(jid, { text: "❌ Usage: *.define [word]*" }, { quoted: msg });

  try {
    const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { timeout: 10000 });
    const data = (res.data as any[])[0];
    const meaning = data?.meanings?.[0];
    const def = meaning?.definitions?.[0];
    if (!def) throw new Error("no definition");

    const text = `📚 *${word.toUpperCase()}*\n\n🔤 *Part of speech:* ${meaning.partOfSpeech}\n📖 *Definition:* ${def.definition}${def.example ? `\n💬 *Example:* "${def.example}"` : ""}`;
    await sock.sendMessage(jid, { text }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: `❌ No definition found for "${word}".` }, { quoted: msg });
  }
}

export async function translateCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const [lang, ...rest] = args;
  const text = rest.join(" ");
  if (!lang || !text) return sock.sendMessage(jid, { text: "❌ Usage: *.translate [lang] [text]*\nExample: .translate sw Hello world" }, { quoted: msg });

  try {
    const res = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`,
      { timeout: 10000 }
    );
    const translated = (res.data as any)[0]?.map((x: any) => x[0]).join("") ?? "No result";
    const detected = (res.data as any)[2];
    await sock.sendMessage(jid, {
      text: `🌐 *Translation*\n\n🔤 From: ${detected ?? "auto"}\n🌍 To: ${lang}\n\n📝 ${translated}`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Translation failed." }, { quoted: msg });
  }
}
