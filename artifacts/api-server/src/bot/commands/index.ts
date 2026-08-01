import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { menuCommand } from "./menu.js";
import { aliveCommand } from "./alive.js";
import { pingCommand } from "./ping.js";
import { ownerCommand } from "./owner.js";
import { stickerCommand } from "./sticker.js";
import { toimgCommand } from "./toimg.js";
import { aiCommand } from "./ai.js";
import { ttsCommand } from "./tts.js";
import { ytdlCommand } from "./ytdl.js";
import { tagallCommand } from "./tagall.js";
import { antilinkCommand, handleAntilinkMessage } from "./antilink.js";
import {
  kickCommand,
  addCommand,
  promoteCommand,
  demoteCommand,
  groupLinkCommand,
  revokeCommand,
  openCloseCommand,
} from "./group.js";
import {
  jokeCommand,
  factCommand,
  quoteCommand,
  roastCommand,
  weatherCommand,
  wikiCommand,
  calcCommand,
  defineCommand,
  translateCommand,
} from "./extra.js";
import { botState } from "../store.js";

function getMessageText(msg: WAMessage): string {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ""
  );
}

export async function handleMessage(sock: WASocket, msg: WAMessage) {
  if (msg.key.fromMe) return;
  if (!msg.message) return;

  const jid = msg.key.remoteJid!;
  const text = getMessageText(msg).trim();
  const senderJid = msg.key.participant ?? jid;

  // Run anti-link check for all messages in groups
  if (jid.endsWith("@g.us")) {
    await handleAntilinkMessage(sock, msg);
  }

  // Only process commands starting with prefix '.'
  if (!text.startsWith(".")) return;

  const [rawCommand, ...args] = text.slice(1).trim().split(/\s+/);
  const command = rawCommand?.toLowerCase() ?? "";

  const isOwner = senderJid.startsWith(botState.ownerJid.split("@")[0]!);

  try {
    switch (command) {
      // General
      case "menu":
      case "help":
        await menuCommand(sock, msg);
        break;
      case "alive":
        await aliveCommand(sock, msg);
        break;
      case "ping":
        await pingCommand(sock, msg);
        break;
      case "owner":
        await ownerCommand(sock, msg);
        break;

      // Media
      case "s":
      case "sticker":
        await stickerCommand(sock, msg);
        break;
      case "toimg":
        await toimgCommand(sock, msg);
        break;
      case "tts":
        await ttsCommand(sock, msg, args);
        break;

      // Downloads
      case "ytmp3":
      case "ytaudio":
        await ytdlCommand(sock, msg, args, "audio");
        break;
      case "ytmp4":
      case "ytvideo":
        await ytdlCommand(sock, msg, args, "video");
        break;

      // AI
      case "ai":
      case "gpt":
      case "chatgpt":
        await aiCommand(sock, msg, args);
        break;

      // Group tools
      case "tagall":
        await tagallCommand(sock, msg, args);
        break;
      case "kick":
        await kickCommand(sock, msg);
        break;
      case "add":
        await addCommand(sock, msg, args);
        break;
      case "promote":
        await promoteCommand(sock, msg);
        break;
      case "demote":
        await demoteCommand(sock, msg);
        break;
      case "antilink":
        await antilinkCommand(sock, msg, args);
        break;
      case "grouplink":
      case "link":
        await groupLinkCommand(sock, msg);
        break;
      case "revoke":
        await revokeCommand(sock, msg);
        break;
      case "open":
        await openCloseCommand(sock, msg, true);
        break;
      case "close":
        await openCloseCommand(sock, msg, false);
        break;

      // Fun
      case "joke":
        await jokeCommand(sock, msg);
        break;
      case "fact":
        await factCommand(sock, msg);
        break;
      case "quote":
        await quoteCommand(sock, msg);
        break;
      case "roast":
        await roastCommand(sock, msg);
        break;

      // Info
      case "weather":
        await weatherCommand(sock, msg, args);
        break;
      case "wiki":
      case "wikipedia":
        await wikiCommand(sock, msg, args);
        break;
      case "calc":
      case "calculate":
        await calcCommand(sock, msg, args);
        break;
      case "define":
        await defineCommand(sock, msg, args);
        break;
      case "translate":
      case "tr":
        await translateCommand(sock, msg, args);
        break;

      default:
        // Unknown command — silently ignore or reply
        await sock.sendMessage(
          jid,
          { text: `❓ Unknown command: *.${command}*\n\nType *.menu* to see all commands.` },
          { quoted: msg }
        );
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await sock.sendMessage(jid, { text: `❌ Command error: ${errMsg}` }, { quoted: msg }).catch(() => {});
  }
}
