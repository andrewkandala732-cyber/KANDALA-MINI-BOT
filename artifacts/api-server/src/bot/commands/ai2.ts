import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import axios from "axios";

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function askOpenAI(systemPrompt: string, userMessage: string): Promise<string> {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not set. Add it in Replit Secrets.");
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 800,
    },
    { headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" } }
  );
  return res.data.choices[0].message.content.trim();
}

function reply(sock: WASocket, msg: WAMessage, text: string) {
  return sock.sendMessage(msg.key.remoteJid!, { text }, { quoted: msg });
}

export async function codeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.code [language] [description]*\nExample: .code python fibonacci sequence");
  try {
    const result = await askOpenAI(
      "You are an expert programmer. Provide clean, working code with brief explanation. Use markdown-style code blocks.",
      args.join(" ")
    );
    await reply(sock, msg, `💻 *CODE GENERATOR*\n\n${result}`);
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

export async function storyCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.story [topic]*\nExample: .story a brave lion in the savanna");
  try {
    const result = await askOpenAI(
      "You are a creative storyteller. Write an engaging short story (150-200 words) with a clear beginning, middle, and end. Make it entertaining.",
      args.join(" ")
    );
    await reply(sock, msg, `📖 *STORY TIME*\n\n${result}`);
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

export async function recipeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.recipe [dish name]*\nExample: .recipe ugali with beef stew");
  try {
    const result = await askOpenAI(
      "You are a professional chef. Provide a complete recipe with ingredients (with quantities) and numbered step-by-step instructions. Be clear and practical.",
      `Recipe for: ${args.join(" ")}`
    );
    await reply(sock, msg, `🍳 *RECIPE*\n\n${result}`);
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

export async function summarizeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
    || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;
  const text = quoted || args.join(" ");
  if (!text) return reply(sock, msg, "Usage: *.summarize [text]* or reply to a message with *.summarize*");
  try {
    const result = await askOpenAI(
      "You are an expert at summarizing. Provide a clear, concise summary in bullet points. Keep it short but complete.",
      `Summarize this: ${text}`
    );
    await reply(sock, msg, `📋 *SUMMARY*\n\n${result}`);
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

export async function analyzeCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
    || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;
  const text = quoted || args.join(" ");
  if (!text) return reply(sock, msg, "Usage: *.analyze [text]* or reply to a message with *.analyze*");
  try {
    const result = await askOpenAI(
      "You are an analytical expert. Analyze the given text for tone, key points, sentiment, and provide insights. Be thorough but concise.",
      `Analyze this: ${text}`
    );
    await reply(sock, msg, `🔍 *ANALYSIS*\n\n${result}`);
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

export async function teachCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.teach [topic]*\nExample: .teach how photosynthesis works");
  try {
    const result = await askOpenAI(
      "You are an excellent teacher. Explain the topic clearly, simply, and engagingly. Use examples, analogies, and break it into easy-to-understand parts. Suitable for a general audience.",
      `Teach me about: ${args.join(" ")}`
    );
    await reply(sock, msg, `🎓 *LESSON*\n\n${result}`);
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

export async function programmingCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.programming [question]*\nExample: .programming what is recursion");
  try {
    const result = await askOpenAI(
      "You are a senior software engineer and programming expert. Answer programming questions with clear explanations, examples, and best practices. Include code snippets when helpful.",
      args.join(" ")
    );
    await reply(sock, msg, `👨‍💻 *PROGRAMMING HELP*\n\n${result}`);
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

export async function translate2Command(sock: WASocket, msg: WAMessage, args: string[]) {
  if (args.length < 2) return reply(sock, msg, "Usage: *.translate2 [language] [text]*\nExample: .translate2 French Hello how are you");
  const [lang, ...rest] = args;
  try {
    const result = await askOpenAI(
      `You are a professional translator. Translate the given text to ${lang}. Only output the translation, nothing else.`,
      rest.join(" ")
    );
    await reply(sock, msg, `🌐 *TRANSLATION → ${lang.toUpperCase()}*\n\n${result}`);
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

export async function generateCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.generate [image description]*\nExample: .generate a sunset over Mount Kenya");
  if (!OPENAI_KEY) return reply(sock, msg, "❌ OPENAI_API_KEY not set. Add it in Replit Secrets.");
  try {
    await reply(sock, msg, "🎨 Generating image... Please wait.");
    const res = await axios.post(
      "https://api.openai.com/v1/images/generations",
      { model: "dall-e-2", prompt: args.join(" "), n: 1, size: "512x512" },
      { headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" } }
    );
    const imageUrl = res.data.data[0].url;
    const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(imgRes.data);
    await sock.sendMessage(msg.key.remoteJid!, {
      image: buffer,
      caption: `🎨 *GENERATED IMAGE*\n📝 Prompt: ${args.join(" ")}`,
    }, { quoted: msg });
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

export const dalleCommand = generateCommand;

export async function blackboxCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.blackbox [coding question]*\nExample: .blackbox how to reverse a string in Python");
  try {
    const result = await askOpenAI(
      "You are Blackbox AI, a coding-focused assistant. Provide clear, working code solutions with explanations. Focus on practical, efficient solutions. Format code neatly.",
      args.join(" ")
    );
    await reply(sock, msg, `⬛ *BLACKBOX AI*\n\n${result}`);
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

export async function deepseekCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.deepseek [question]*");
  try {
    const result = await askOpenAI(
      "You are DeepSeek, an advanced AI assistant with deep reasoning capabilities. Provide thorough, insightful answers with step-by-step thinking.",
      args.join(" ")
    );
    await reply(sock, msg, `🔬 *DEEPSEEK AI*\n\n${result}`);
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

export async function geminiCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.gemini [question]*");
  try {
    const result = await askOpenAI(
      "You are Gemini, Google's advanced multimodal AI. Respond with balanced, factual, and helpful answers. Be comprehensive but clear.",
      args.join(" ")
    );
    await reply(sock, msg, `💎 *GEMINI AI*\n\n${result}`);
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

export async function doppleaiCommand(sock: WASocket, msg: WAMessage, args: string[]) {
  if (!args.length) return reply(sock, msg, "Usage: *.doppleai [creative prompt]*\nExample: .doppleai write a poem about rain in Nairobi");
  try {
    const result = await askOpenAI(
      "You are DoppleAI, a creative and imaginative AI. Generate vivid, creative, and emotionally resonant content. Be artistic and expressive.",
      args.join(" ")
    );
    await reply(sock, msg, `✨ *DOPPLE AI*\n\n${result}`);
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}
