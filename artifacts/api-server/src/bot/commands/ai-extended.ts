import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import OpenAI from "openai";

function getOpenAI(): OpenAI | null {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: process.env["REPLIT_AI_BASE_URL"] ?? undefined });
}

async function aiChat(sock: WASocket, msg: WAMessage, systemPrompt: string, userInput: string, label: string) {
  const jid = msg.key.remoteJid!;
  const client = getOpenAI();
  if (!client) {
    await sock.sendMessage(jid, { text: "❌ OPENAI_API_KEY not set. AI commands require an API key." }, { quoted: msg });
    return;
  }
  if (!userInput.trim()) {
    await sock.sendMessage(jid, { text: `❌ Please provide input after the command.` }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userInput }],
      max_tokens: 1024,
    });
    const answer = res.choices[0]?.message?.content ?? "No response.";
    await sock.sendMessage(jid, { text: `${label}\n\n${answer}` }, { quoted: msg });
    await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
  } catch {
    await sock.sendMessage(jid, { text: "❌ AI request failed. Please try again." }, { quoted: msg });
    await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
  }
}

export async function analyzeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await aiChat(sock, msg,
    "You are an expert analyst. Analyze the given text for sentiment, tone, key themes, and main points. Be concise.",
    args.join(" "),
    "🔍 *AI ANALYSIS*"
  );
}

export async function codeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await aiChat(sock, msg,
    "You are an expert programmer. Provide clean, well-commented code solutions. Explain your approach briefly.",
    args.join(" "),
    "💻 *CODE HELPER*"
  );
}

export async function programmingCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await aiChat(sock, msg,
    "You are a senior software engineer. Answer programming questions clearly with examples where helpful.",
    args.join(" "),
    "🖥️ *PROGRAMMING HELP*"
  );
}

export async function recipeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await aiChat(sock, msg,
    "You are a professional chef. Provide a detailed recipe with ingredients and step-by-step instructions. Be practical.",
    args.join(" "),
    "🍽️ *RECIPE*"
  );
}

export async function storyCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await aiChat(sock, msg,
    "You are a creative storyteller. Write an engaging short story (max 300 words) based on the given topic or prompt.",
    args.join(" "),
    "📖 *STORY*"
  );
}

export async function summarizeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || "";
  const input = args.join(" ") || quotedText;
  if (!input) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.summarize [text]* or reply to a message with *.summarize*" }, { quoted: msg });
    return;
  }
  await aiChat(sock, msg,
    "You are an expert summarizer. Summarize the given text concisely in 3-5 bullet points, capturing the key ideas.",
    input,
    "📝 *SUMMARY*"
  );
}

export async function teachCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await aiChat(sock, msg,
    "You are a patient, expert teacher. Explain the topic clearly and simply, using examples and analogies. Aim for someone learning for the first time.",
    args.join(" "),
    "🎓 *TEACH MODE*"
  );
}

export async function translate2Command(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const [lang, ...rest] = args;
  if (!lang || !rest.length) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.translate2 [language] [text]*\nExample: .translate2 French Hello world" }, { quoted: msg });
    return;
  }
  await aiChat(sock, msg,
    `You are a professional translator. Translate the text to ${lang}. Output ONLY the translated text, nothing else.`,
    rest.join(" "),
    `🌐 *TRANSLATION → ${lang.toUpperCase()}*`
  );
}

export async function dalleCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const prompt = args.join(" ").trim();
  if (!prompt) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.dalle [description]*\nExample: .dalle a futuristic city at night" }, { quoted: msg });
    return;
  }
  const client = getOpenAI();
  if (!client) {
    await sock.sendMessage(jid, { text: "❌ OPENAI_API_KEY not set." }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { text: "🎨 Generating image..." }, { quoted: msg });
  try {
    const res = await client.images.generate({ model: "dall-e-3", prompt, size: "1024x1024", n: 1 });
    const url = res.data[0]?.url;
    if (!url) throw new Error("No image URL returned");
    const { default: axios } = await import("axios");
    const imgRes = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(imgRes.data);
    await sock.sendMessage(jid, { image: buffer, caption: `🎨 *DALL-E*\n\n_${prompt}_` }, { quoted: msg });
  } catch (err) {
    await sock.sendMessage(jid, { text: "❌ Image generation failed. Please try again." }, { quoted: msg });
  }
}

export async function generateCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  // Alias for dalle
  await dalleCommand(sock, msg, args);
}

export async function geminiCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    await sock.sendMessage(jid, { text: "❌ GEMINI_API_KEY not set. Ask the owner to configure it." }, { quoted: msg });
    return;
  }
  const prompt = args.join(" ").trim();
  if (!prompt) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.gemini [question]*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
  try {
    const { default: axios } = await import("axios");
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { timeout: 30000 }
    );
    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";
    await sock.sendMessage(jid, { text: `♊ *GEMINI AI*\n\n${text}` }, { quoted: msg });
    await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Gemini request failed." }, { quoted: msg });
  }
}

export async function deepseekCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const jid = msg.key.remoteJid!;
  const apiKey = process.env["DEEPSEEK_API_KEY"];
  if (!apiKey) {
    await sock.sendMessage(jid, { text: "❌ DEEPSEEK_API_KEY not set. Ask the owner to configure it." }, { quoted: msg });
    return;
  }
  const prompt = args.join(" ").trim();
  if (!prompt) {
    await sock.sendMessage(jid, { text: "❌ Usage: *.deepseek [question]*" }, { quoted: msg });
    return;
  }
  await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
  try {
    const client = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
    const res = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    });
    const text = res.choices[0]?.message?.content ?? "No response.";
    await sock.sendMessage(jid, { text: `🔵 *DEEPSEEK AI*\n\n${text}` }, { quoted: msg });
    await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
  } catch {
    await sock.sendMessage(jid, { text: "❌ DeepSeek request failed." }, { quoted: msg });
  }
}

export async function blackboxCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  // Route to openai as fallback
  await aiChat(sock, msg,
    "You are an expert AI assistant. Answer questions thoroughly and accurately.",
    args.join(" "),
    "⬛ *BLACKBOX AI*"
  );
}

export async function doppleaiCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  await aiChat(sock, msg,
    "You are a creative AI assistant. Be engaging, imaginative, and helpful.",
    args.join(" "),
    "🌀 *DOPPLE AI*"
  );
}
