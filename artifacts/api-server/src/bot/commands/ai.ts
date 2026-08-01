import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import OpenAI from "openai";

let openai: OpenAI | null = null;

function getClient() {
  if (!openai) {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) return null;
    openai = new OpenAI({
      apiKey,
      baseURL: process.env["REPLIT_AI_BASE_URL"] ?? undefined,
    });
  }
  return openai;
}

export async function aiCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const query = args.join(" ").trim();

  if (!query) {
    await sock.sendMessage(jid, {
      text: "❌ Usage: *.ai [your question]*\n\nExample: .ai What is the capital of Kenya?",
    }, { quoted: msg });
    return;
  }

  const client = getClient();
  if (!client) {
    await sock.sendMessage(jid, {
      text: "❌ AI is not configured. Please set the OPENAI_API_KEY.",
    }, { quoted: msg });
    return;
  }

  await sock.sendMessage(jid, { react: { text: "🤔", key: msg.key } });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are KANDALA MINI BOT, a helpful WhatsApp assistant. Keep responses concise and friendly.",
        },
        { role: "user", content: query },
      ],
      max_tokens: 1024,
    });

    const answer = response.choices[0]?.message?.content ?? "No response.";
    await sock.sendMessage(jid, {
      text: `🤖 *KANDALA AI*\n\n${answer}`,
    }, { quoted: msg });
    await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
  } catch (err) {
    await sock.sendMessage(jid, { text: "❌ AI request failed. Please try again." }, { quoted: msg });
    await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
  }
}
