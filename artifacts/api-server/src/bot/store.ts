import type { WASocket } from "@whiskeysockets/baileys";

export interface GroupSettings {
  antilink?: boolean;
  antiaudio?: boolean;
  antiimage?: boolean;
  antivideo?: boolean;
  antisticker?: boolean;
  antigif?: boolean;
  antiforward?: boolean;
  antivoice?: boolean;
  antidocument?: boolean;
  antipoll?: boolean;
  antireaction?: boolean;
  antitag?: boolean;
  antilinkgc?: boolean;
  welcome?: string;
  goodbye?: string;
  muted?: Set<string>;
}

export interface BotState {
  sock: WASocket | null;
  isConnected: boolean;
  antilinkGroups: Set<string>;
  groupSettings: Map<string, GroupSettings>;
  memberWarns: Map<string, number>;
  ownerJid: string;
  botName: string;
  startTime: Date;
}

export const botState: BotState = {
  sock: null,
  isConnected: false,
  antilinkGroups: new Set(),
  groupSettings: new Map(),
  memberWarns: new Map(),
  ownerJid: "254743760083@s.whatsapp.net",
  botName: "KANDALA MINI BOT",
  startTime: new Date(),
};
