import type { WASocket } from "@whiskeysockets/baileys";

export interface BotState {
  sock: WASocket | null;
  isConnected: boolean;
  antilinkGroups: Set<string>;
  ownerJid: string;
  botName: string;
  startTime: Date;
}

export const botState: BotState = {
  sock: null,
  isConnected: false,
  antilinkGroups: new Set(),
  ownerJid: "254743760083@s.whatsapp.net",
  botName: "KANDALA MINI BOT",
  startTime: new Date(),
};
