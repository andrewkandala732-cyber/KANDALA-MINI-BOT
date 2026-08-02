import type { WASocket } from "@whiskeysockets/baileys";

export interface GroupSettings {
  welcomeEnabled: boolean;
  welcomeMessage: string;
  goodbyeEnabled: boolean;
  goodbyeMessage: string;
  mutedUsers: Set<string>;
  mode: "public" | "group" | "private";
  prefix: string;
  antiBadWord: boolean;
  badWords: string[];
  antilink: boolean;
  antiaudio: boolean;
  antiimage: boolean;
  antivideo: boolean;
  antigif: boolean;
  antisticker: boolean;
  antidocument: boolean;
  anticontact: boolean;
  antiforward: boolean;
  antipoll: boolean;
  antibot: boolean;
  antivoice: boolean;
  antiforeign: boolean;
  warnCount: Map<string, number>;
  maxWarns: number;
  chatbot: boolean;
}

export interface BotSettings {
  botName: string;
  ownerName: string;
  ownerNumber: string;
  prefix: string;
  mode: "public" | "group" | "private";
  autoViewStatus: boolean;
  autoReact: boolean;
  autoRead: boolean;
  autoRecord: boolean;
  antiCall: boolean;
  antiDelete: boolean;
  autoSaveStatus: boolean;
  chatbot: boolean;
  alwaysOnline: boolean;
  autoblock: boolean;
  statusEmoji: string;
  watermark: string;
  stickerPackName: string;
  stickerAuthor: string;
  font: number;
  timezone: string;
}

export interface BotState {
  sock: WASocket | null;
  isConnected: boolean;
  antilinkGroups: Set<string>;
  ownerJid: string;
  botName: string;
  startTime: Date;
  groupSettings: Map<string, GroupSettings>;
  botSettings: BotSettings;
}

export function defaultGroupSettings(): GroupSettings {
  return {
    welcomeEnabled: false,
    welcomeMessage: "Welcome @user to @group! 🎉",
    goodbyeEnabled: false,
    goodbyeMessage: "Goodbye @user, we'll miss you! 👋",
    mutedUsers: new Set(),
    mode: "public",
    prefix: ".",
    antiBadWord: false,
    badWords: [],
    antilink: false,
    antiaudio: false,
    antiimage: false,
    antivideo: false,
    antigif: false,
    antisticker: false,
    antidocument: false,
    anticontact: false,
    antiforward: false,
    antipoll: false,
    antibot: false,
    antivoice: false,
    antiforeign: false,
    warnCount: new Map(),
    maxWarns: 3,
    chatbot: false,
  };
}

export const botState: BotState = {
  sock: null,
  isConnected: false,
  antilinkGroups: new Set(),
  ownerJid: "254743760083@s.whatsapp.net",
  botName: "KANDALA MINI BOT",
  startTime: new Date(),
  groupSettings: new Map(),
  botSettings: {
    botName: "KANDALA MINI BOT",
    ownerName: "KANDALA",
    ownerNumber: "254743760083",
    prefix: ".",
    mode: "public",
    autoViewStatus: false,
    autoReact: false,
    autoRead: false,
    autoRecord: false,
    antiCall: false,
    antiDelete: false,
    autoSaveStatus: false,
    chatbot: false,
    alwaysOnline: false,
    autoblock: false,
    statusEmoji: "🤖",
    watermark: "KANDALA MINI BOT",
    stickerPackName: "KANDALA",
    stickerAuthor: "KANDALA BOT",
    font: 0,
    timezone: "Africa/Nairobi",
  },
};

export function getGroupSettings(jid: string): GroupSettings {
  if (!botState.groupSettings.has(jid)) {
    botState.groupSettings.set(jid, defaultGroupSettings());
  }
  return botState.groupSettings.get(jid)!;
}
