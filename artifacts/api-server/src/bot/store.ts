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
  timezone: string;
  statusEmoji: string;
  watermark: string;
  stickerPackName: string;
  stickerAuthor: string;
  font: number;

  // Auto features
  autoViewStatus: boolean;
  autoReact: boolean;
  autoReactEmoji: string;
  autoReactStatus: boolean;
  autoReactStatusEmoji: string;
  autoRead: boolean;
  autoRecord: boolean;
  autoRecordTyping: boolean;
  autoSaveStatus: boolean;
  alwaysOnline: boolean;
  autoblock: boolean;
  autoBio: boolean;
  autoBioText: string;
  chatbot: boolean;

  // Anti features
  antiCall: boolean;
  antiCallMessage: string;
  antiDelete: boolean;
  antiDeleteStatus: boolean;
  antiEdit: boolean;
  antiViewOnce: boolean;
  antiBug: boolean;

  // Lists
  badWords: string[];
  countryCodes: string[];         // allowed country codes e.g. ["254","1","44"]
  ignoreList: string[];           // JIDs to completely ignore
  sudoList: string[];             // sudo users (elevated access)

  // Media
  menuImage: string;
  menuVideo: string;
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
    timezone: "Africa/Nairobi",
    statusEmoji: "🤖",
    watermark: "KANDALA MINI BOT",
    stickerPackName: "KANDALA",
    stickerAuthor: "KANDALA BOT",
    font: 0,

    autoViewStatus: false,
    autoReact: false,
    autoReactEmoji: "❤️",
    autoReactStatus: false,
    autoReactStatusEmoji: "❤️",
    autoRead: false,
    autoRecord: false,
    autoRecordTyping: false,
    autoSaveStatus: false,
    alwaysOnline: false,
    autoblock: false,
    autoBio: false,
    autoBioText: "",
    chatbot: false,

    antiCall: false,
    antiCallMessage: "❌ This bot does not accept calls.",
    antiDelete: false,
    antiDeleteStatus: false,
    antiEdit: false,
    antiViewOnce: false,
    antiBug: true,

    badWords: [],
    countryCodes: [],
    ignoreList: [],
    sudoList: [],

    menuImage: "https://files.catbox.moe/pht92g.jpg",
    menuVideo: "",
  },
};

export function getGroupSettings(jid: string): GroupSettings {
  if (!botState.groupSettings.has(jid)) {
    botState.groupSettings.set(jid, defaultGroupSettings());
  }
  return botState.groupSettings.get(jid)!;
}

/** Check if JID is owner or sudo */
export function isOwnerOrSudo(jid: string): boolean {
  const bare = jid.split("@")[0]!;
  if (bare === botState.ownerJid.split("@")[0]) return true;
  return botState.botSettings.sudoList.some(s => s.split("@")[0] === bare);
}
