import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";

export async function memesCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, { text: "😂 Getting a meme..." }, { quoted: msg });
  try {
    const res = await axios.get("https://meme-api.com/gimme", { timeout: 10000 });
    const { title, url, subreddit } = res.data as { title: string; url: string; subreddit: string };
    const imgRes = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    await sock.sendMessage(jid, {
      image: Buffer.from(imgRes.data),
      caption: `😂 *${title}*\n_r/${subreddit}_`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to fetch meme. Try again!" }, { quoted: msg });
  }
}

export async function triviaCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  try {
    const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple", { timeout: 10000 });
    const q = res.data?.results?.[0];
    if (!q) throw new Error("no question");
    const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"');
    const question = decode(q.question);
    const correct = decode(q.correct_answer);
    const wrong = q.incorrect_answers.map(decode);
    const all = [...wrong, correct].sort(() => Math.random() - 0.5);
    const letters = ["A", "B", "C", "D"];
    const opts = all.map((a: string, i: number) => `${letters[i]}. ${a}`).join("\n");
    const correctLetter = letters[all.indexOf(correct)];

    await sock.sendMessage(jid, {
      text: `🧠 *TRIVIA*\n\n*Category:* ${decode(q.category)}\n*Difficulty:* ${q.difficulty.toUpperCase()}\n\n❓ ${question}\n\n${opts}\n\n_Reply with the letter!_\n||Answer: ${correctLetter}. ${correct}||`,
    }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to get trivia question. Try again!" }, { quoted: msg });
  }
}

export async function truthdetectorCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const claim = args.join(" ").trim();
  if (!claim) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.truthdetector [statement]*\nExample: .truthdetector The earth is flat" }, { quoted: msg });
    return;
  }

  // Fun fake detector with random truthfulness
  const rand = Math.random();
  let verdict: string, emoji: string, confidence: string;
  if (rand < 0.33) {
    verdict = "TRUE ✅";
    emoji = "🟢";
    confidence = `${Math.floor(75 + Math.random() * 25)}%`;
  } else if (rand < 0.66) {
    verdict = "FALSE ❌";
    emoji = "🔴";
    confidence = `${Math.floor(75 + Math.random() * 25)}%`;
  } else {
    verdict = "PARTIALLY TRUE ⚠️";
    emoji = "🟡";
    confidence = `${Math.floor(50 + Math.random() * 30)}%`;
  }

  await sock.sendMessage(jid, {
    text: `🔍 *TRUTH DETECTOR*\n\n📋 *Statement:*\n_"${claim}"_\n\n${emoji} *Verdict:* ${verdict}\n📊 *Confidence:* ${confidence}\n\n_⚠️ This is for entertainment only!_`,
  }, { quoted: msg });
}

export async function xxqcCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const texts = [
    "🎯 The universe is 13.8 billion years old. You are precisely on time.",
    "🌊 Water flows downhill. So does laziness. Be a mountain.",
    "🌟 Even stars die. But their light travels for millions of years. Leave something lasting.",
    "🎲 Life is random. Strategy is what you do with the randomness.",
    "🔥 Fire needs air to breathe. So do ideas — share them.",
    "⚡ Lightning strikes the tallest point. Being outstanding has risks. Take them anyway.",
  ];
  const text = texts[Math.floor(Math.random() * texts.length)]!;
  await sock.sendMessage(jid, { text: `💫 *XXQC*\n\n${text}` }, { quoted: msg });
}

export async function jokesCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  try {
    const res = await axios.get("https://v2.jokeapi.dev/joke/Any?safe-mode&type=twopart", { timeout: 8000 });
    const { setup, delivery } = res.data as { setup: string; delivery: string };
    await sock.sendMessage(jid, { text: `😂 *JOKE*\n\n${setup}\n\n||${delivery}||` }, { quoted: msg });
  } catch {
    // Fallback
    const { jokeCommand } = await import("./extra.js");
    await jokeCommand(sock, msg);
  }
}
