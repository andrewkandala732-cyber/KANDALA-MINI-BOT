import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";

export async function ttsCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const text = args.join(" ").trim();

  if (!text) {
    await sock.sendMessage(jid, {
      text: "❌ Usage: *.tts [text]*\n\nExample: .tts Hello, how are you?",
    }, { quoted: msg });
    return;
  }

  await sock.sendMessage(jid, { text: "🔊 Generating audio..." }, { quoted: msg });

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 15000,
    });

    const audioBuffer = Buffer.from(res.data);
    await sock.sendMessage(jid, {
      audio: audioBuffer,
      mimetype: "audio/mpeg",
      ptt: false,
    }, { quoted: msg });
  } catch (err) {
    await sock.sendMessage(jid, { text: "❌ Failed to generate TTS audio. Please try again." }, { quoted: msg });
  }
}
