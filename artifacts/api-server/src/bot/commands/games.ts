import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";

function reply(sock: WASocket, msg: WAMessage, text: string) {
  return sock.sendMessage(msg.key.remoteJid!, { text }, { quoted: msg });
}

const truthQuestions = [
  "What is your biggest fear?",
  "What is the most embarrassing thing you've ever done?",
  "Have you ever lied to your best friend? About what?",
  "What is your biggest secret?",
  "What is something you've never told your parents?",
  "Have you ever cheated on a test?",
  "What is the worst thing you've ever done?",
  "Who was your first crush?",
  "Have you ever stolen anything?",
  "What is your biggest regret?",
  "Have you ever cried during a movie? Which one?",
  "What is your most embarrassing childhood memory?",
  "Have you ever pretended to be sick to avoid something?",
  "What is a bad habit you have?",
  "Who is the last person you talked about behind their back?",
  "Have you ever had a dream about someone in this chat?",
  "What is something you're afraid people will find out about you?",
  "Have you ever read someone else's messages without their permission?",
  "What is the most childish thing you still do?",
  "Have you ever ghosted someone? Why?",
  "What is the biggest lie you've ever told?",
  "Do you have a hidden talent you've never told anyone about?",
  "What is your guilty pleasure?",
  "Have you ever betrayed someone's trust?",
  "What is the most trouble you've ever been in?",
];

const daresChallenges = [
  "Send a funny voice note saying 'I am the champion!'",
  "Change your WhatsApp profile picture to a funny face for 1 hour.",
  "Tag the last person who texted you and say 'You are my hero!'",
  "Post a funny status and keep it for 30 minutes.",
  "Send a heart emoji to the 5th person in your contact list.",
  "Do 20 push-ups and send a voice note counting them.",
  "Text your mum or dad 'I love you to the moon and back!'",
  "Send a voice note of yourself singing your favorite song.",
  "Change your name in this group to 'KANDALA FAN' for 10 minutes.",
  "Do your best impression of a robot and send a voice note.",
  "Call someone in this group and say only 'boo!'",
  "Send a selfie with a funny face.",
  "Write a poem about the last thing you ate and share it.",
  "Send a voice note whispering your deepest secret... just kidding! Say your favorite food instead.",
  "Do a 10-second dance and describe it in text.",
  "Text your best friend 'I've been replaced by a robot'.",
  "Share your most recent downloaded photo.",
  "Go outside and do 3 jumping jacks, then come back and confirm.",
  "Type only in CAPITALS for the next 5 messages.",
  "Send a voice note in a funny accent.",
  "Share an embarrassing photo from 2+ years ago.",
  "Write a tongue twister and share it.",
  "Describe your last dream in detail.",
  "Send a message to someone saying 'I need to confess something' then say 'I ate the last biscuit'.",
  "Do your best animal sound in a voice note.",
];

export async function truthCommand(sock: WASocket, msg: WAMessage) {
  const question = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
  await reply(sock, msg, `🎯 *TRUTH*\n\n❓ ${question}\n\n_Answer honestly or take a dare!_`);
}

export async function dareCommand(sock: WASocket, msg: WAMessage) {
  const dare = daresChallenges[Math.floor(Math.random() * daresChallenges.length)];
  await reply(sock, msg, `🔥 *DARE*\n\n💪 ${dare}\n\n_Complete it or take a truth!_`);
}

export async function truthordareCommand(sock: WASocket, msg: WAMessage) {
  const isTruth = Math.random() > 0.5;
  if (isTruth) {
    const question = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
    await reply(sock, msg, `🎲 *TRUTH OR DARE → TRUTH!*\n\n❓ ${question}`);
  } else {
    const dare = daresChallenges[Math.floor(Math.random() * daresChallenges.length)];
    await reply(sock, msg, `🎲 *TRUTH OR DARE → DARE!*\n\n💪 ${dare}`);
  }
}

export async function triviaCommand(sock: WASocket, msg: WAMessage) {
  try {
    const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple", { timeout: 8000 });
    const q = res.data.results[0];
    const allAnswers = [...q.incorrect_answers, q.correct_answer]
      .sort(() => Math.random() - 0.5);
    const letters = ["A", "B", "C", "D"];
    const options = allAnswers.map((a: string, i: number) => `${letters[i]}. ${a.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&")}`).join("\n");
    const question = q.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&");
    const correct = q.correct_answer.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&");
    const difficulty = q.difficulty.toUpperCase();
    const category = q.category;

    await reply(sock, msg,
      `🧠 *TRIVIA*\n📚 Category: ${category}\n⚡ Difficulty: ${difficulty}\n\n❓ ${question}\n\n${options}\n\n||✅ Answer: ${correct}||`
    );
  } catch {
    const fallback = [
      { q: "What is the capital of Kenya?", a: "Nairobi", opts: ["A. Mombasa", "B. Nairobi", "C. Kisumu", "D. Nakuru"] },
      { q: "How many planets are in our solar system?", a: "8", opts: ["A. 7", "B. 8", "C. 9", "D. 10"] },
      { q: "What is 12 × 12?", a: "144", opts: ["A. 122", "B. 134", "C. 144", "D. 156"] },
    ];
    const f = fallback[Math.floor(Math.random() * fallback.length)];
    await reply(sock, msg, `🧠 *TRIVIA*\n\n❓ ${f.q}\n\n${f.opts.join("\n")}\n\n||✅ Answer: ${f.a}||`);
  }
}

export async function memesCommand(sock: WASocket, msg: WAMessage) {
  try {
    const res = await axios.get("https://meme-api.com/gimme", { timeout: 8000 });
    const meme = res.data;
    const imgRes = await axios.get(meme.url, { responseType: "arraybuffer", timeout: 15000 });
    await sock.sendMessage(msg.key.remoteJid!, {
      image: Buffer.from(imgRes.data),
      caption: `😂 *${meme.title}*\n📌 r/${meme.subreddit} | 👍 ${meme.ups}`,
    }, { quoted: msg });
  } catch {
    await reply(sock, msg, "😂 *MEME*\n\nWhy don't scientists trust atoms?\n\n_Because they make up everything!_ 😂");
  }
}

export async function truthdetectorCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.truthdetector [statement]*\nExample: .truthdetector I never lie");
  const score = Math.floor(Math.random() * 101);
  let verdict: string, emoji: string;
  if (score >= 80) { verdict = "LIKELY TRUE"; emoji = "✅"; }
  else if (score >= 50) { verdict = "UNCERTAIN"; emoji = "🤔"; }
  else if (score >= 20) { verdict = "SUSPICIOUS"; emoji = "⚠️"; }
  else { verdict = "PROBABLY FALSE"; emoji = "❌"; }

  const bars = "█".repeat(Math.floor(score / 10)) + "░".repeat(10 - Math.floor(score / 10));
  await reply(sock, msg,
    `🔍 *TRUTH DETECTOR*\n\n📝 Statement: _"${args.join(" ")}"_\n\n${emoji} Verdict: *${verdict}*\n\nTruth Score: ${score}%\n[${bars}]\n\n_⚠️ This is for fun only!_`
  );
}

export async function xxqcCommand(sock: WASocket, msg: WAMessage) {
  const responses = [
    "😂 If you're reading this, you're officially awesome! Send this to 5 people or your sandwich will fall face down for a week.",
    "🤔 Fun fact: The average person spends 6 months of their lifetime waiting for red lights. You just spent 3 seconds reading this.",
    "😅 Your future self called. They said stop overthinking and send .menu for some fun!",
    "🌚 Scientists have discovered that people who use .xxqc are 47% more interesting than average. Completely made up fact.",
    "😂 Life tip: If someone says you can't do it, show them the .menu and prove you can do anything.",
  ];
  await reply(sock, msg, responses[Math.floor(Math.random() * responses.length)]);
}
