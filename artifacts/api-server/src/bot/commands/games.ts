import type { WASocket, WAMessage } from "@whiskeysockets/baileys";

const TRUTHS = [
  "What is your biggest secret that you've never told anyone?",
  "What is your most embarrassing moment?",
  "Who was your first crush and do you still like them?",
  "What is the most childish thing you still do?",
  "What is your biggest fear?",
  "Have you ever lied to your best friend? About what?",
  "What is the worst thing you have ever done?",
  "What is something you are ashamed of?",
  "Who in this group would you date and why?",
  "What is your most annoying habit?",
  "What is something you did that you hoped no one found out about?",
  "If you could change one thing about your appearance, what would it be?",
  "What do you think people dislike about you?",
  "Who was the last person you stalked on social media?",
  "Have you ever pretended to be sick to avoid something?",
];

const DARES = [
  "Send a voice note of you singing your favorite song. 🎵",
  "Change your profile picture to a funny face for 1 hour. 😂",
  "Send a selfie with the most ridiculous expression you can make. 📸",
  "Write a love poem for the last person who texted you. 💌",
  "Tag 5 people and say something nice about each. 🌟",
  "Type with your nose and send the result. 👃",
  "Record yourself doing the worm dance (or trying to). 🐛",
  "Send a message to your last contact pretending to be a robot. 🤖",
  "Let the group pick your profile picture for the next hour. 🎭",
  "Send a voice message saying 'I am a potato' 3 times. 🥔",
  "Post an embarrassing childhood photo. 📷",
  "Text your crush a random emoji and show us the conversation. 💬",
  "Imitate a famous celebrity and send a voice note. 🌟",
  "Let the group choose your next WhatsApp status. ✍️",
  "Sing the national anthem of your country in a voice note. 🎤",
];

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export async function truthCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, {
    text: `🎯 *TRUTH*\n\n❓ ${random(TRUTHS)}\n\n_You MUST answer honestly! 👀_`,
  }, { quoted: msg });
}

export async function dareCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, {
    text: `🎲 *DARE*\n\n🔥 ${random(DARES)}\n\n_You MUST do it or face punishment! 😈_`,
  }, { quoted: msg });
}

export async function truthordareCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const choice = args[0]?.toLowerCase();
  if (choice === "truth" || choice === "t") {
    await truthCommand(sock, msg);
  } else if (choice === "dare" || choice === "d") {
    await dareCommand(sock, msg);
  } else {
    const rand = Math.random() < 0.5 ? "truth" : "dare";
    await sock.sendMessage(jid, {
      text: `🎮 *TRUTH OR DARE*\n\nUsage: *.truthordare truth* or *.truthordare dare*\n\nRandom spin: *${rand.toUpperCase()}*\n\nSend *.${rand}* to get your ${rand}!`,
    }, { quoted: msg });
  }
}
