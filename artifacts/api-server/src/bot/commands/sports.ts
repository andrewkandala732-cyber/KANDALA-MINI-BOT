import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";

const COMPETITIONS: Record<string, { id: string; name: string; emoji: string }> = {
  epl: { id: "PL", name: "Premier League", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  cl: { id: "CL", name: "Champions League", emoji: "🏆" },
  bundesliga: { id: "BL1", name: "Bundesliga", emoji: "🇩🇪" },
  laliga: { id: "PD", name: "La Liga", emoji: "🇪🇸" },
  seriea: { id: "SA", name: "Serie A", emoji: "🇮🇹" },
  ligue1: { id: "FL1", name: "Ligue 1", emoji: "🇫🇷" },
  efl: { id: "ELC", name: "Championship", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  el: { id: "EL", name: "Europa League", emoji: "🌍" },
  wc: { id: "WC", name: "World Cup", emoji: "🌍" },
};

function getApiKey() {
  return process.env["FOOTBALL_API_KEY"] ?? "";
}

async function footballFetch(path: string) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("FOOTBALL_API_KEY not set");
  const res = await axios.get(`https://api.football-data.org/v4/${path}`, {
    headers: { "X-Auth-Token": apiKey },
    timeout: 10000,
  });
  return res.data;
}

async function sendNoKey(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, {
    text: "❌ *FOOTBALL_API_KEY* not set.\n\nGet a free key at: https://www.football-data.org/\nThen ask the owner to configure it.",
  }, { quoted: msg });
}

async function standingsCommand(sock: WASocket, msg: WAMessage, league: string) {
  const jid = msg.key.remoteJid!;
  const comp = COMPETITIONS[league];
  if (!comp) return;
  if (!getApiKey()) return sendNoKey(sock, msg);
  await sock.sendMessage(jid, { text: `⏳ Fetching ${comp.emoji} ${comp.name} standings...` }, { quoted: msg });
  try {
    const data = await footballFetch(`competitions/${comp.id}/standings`);
    const table = data.standings?.[0]?.table?.slice(0, 10) ?? [];
    const rows = table.map((t: any) =>
      `${t.position}. ${t.team.name}\n   P:${t.playedGames} W:${t.won} D:${t.draw} L:${t.lost} GD:${t.goalDifference} Pts:${t.points}`
    ).join("\n\n");
    await sock.sendMessage(jid, {
      text: `${comp.emoji} *${comp.name} Standings*\n(Top 10)\n\n${rows}`,
    }, { quoted: msg });
  } catch (err: any) {
    await sock.sendMessage(jid, { text: `❌ ${err.message ?? "Failed to fetch standings."}` }, { quoted: msg });
  }
}

async function matchesCommand(sock: WASocket, msg: WAMessage, league: string) {
  const jid = msg.key.remoteJid!;
  const comp = COMPETITIONS[league];
  if (!comp) return;
  if (!getApiKey()) return sendNoKey(sock, msg);
  await sock.sendMessage(jid, { text: `⏳ Fetching ${comp.emoji} ${comp.name} matches...` }, { quoted: msg });
  try {
    const data = await footballFetch(`competitions/${comp.id}/matches?status=LIVE,IN_PLAY,SCHEDULED&limit=10`);
    const matches = data.matches?.slice(0, 10) ?? [];
    if (!matches.length) {
      await sock.sendMessage(jid, { text: `${comp.emoji} No upcoming ${comp.name} matches found.` }, { quoted: msg });
      return;
    }
    const rows = matches.map((m: any) => {
      const date = new Date(m.utcDate).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      const score = m.status === "FINISHED" || m.status === "IN_PLAY"
        ? `${m.score?.fullTime?.home ?? "-"}:${m.score?.fullTime?.away ?? "-"}`
        : "vs";
      return `⚽ ${m.homeTeam.name} ${score} ${m.awayTeam.name}\n   📅 ${date} | ${m.status}`;
    }).join("\n\n");
    await sock.sendMessage(jid, { text: `${comp.emoji} *${comp.name} Matches*\n\n${rows}` }, { quoted: msg });
  } catch (err: any) {
    await sock.sendMessage(jid, { text: `❌ ${err.message ?? "Failed to fetch matches."}` }, { quoted: msg });
  }
}

async function scorersCommand(sock: WASocket, msg: WAMessage, league: string) {
  const jid = msg.key.remoteJid!;
  const comp = COMPETITIONS[league];
  if (!comp) return;
  if (!getApiKey()) return sendNoKey(sock, msg);
  await sock.sendMessage(jid, { text: `⏳ Fetching ${comp.emoji} ${comp.name} top scorers...` }, { quoted: msg });
  try {
    const data = await footballFetch(`competitions/${comp.id}/scorers?limit=10`);
    const scorers = data.scorers?.slice(0, 10) ?? [];
    const rows = scorers.map((s: any, i: number) =>
      `${i + 1}. ${s.player.name} (${s.team.name})\n   ⚽ ${s.goals} goals${s.assists ? ` | 🎯 ${s.assists} assists` : ""}`
    ).join("\n\n");
    await sock.sendMessage(jid, { text: `${comp.emoji} *${comp.name} Top Scorers*\n\n${rows}` }, { quoted: msg });
  } catch (err: any) {
    await sock.sendMessage(jid, { text: `❌ ${err.message ?? "Failed to fetch scorers."}` }, { quoted: msg });
  }
}

// Export handlers for each league
export const eplstandingsCommand = (s: WASocket, m: WAMessage) => standingsCommand(s, m, "epl");
export const eplmatchesCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "epl");
export const eplscorersCommand = (s: WASocket, m: WAMessage) => scorersCommand(s, m, "epl");
export const eplupcomingCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "epl");

export const clstandingsCommand = (s: WASocket, m: WAMessage) => standingsCommand(s, m, "cl");
export const clmatchesCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "cl");
export const clscorersCommand = (s: WASocket, m: WAMessage) => scorersCommand(s, m, "cl");
export const clupcomingCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "cl");

export const bundesligastandingsCommand = (s: WASocket, m: WAMessage) => standingsCommand(s, m, "bundesliga");
export const bundesligamatchesCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "bundesliga");
export const bundesligascorersCommand = (s: WASocket, m: WAMessage) => scorersCommand(s, m, "bundesliga");
export const bundesligaupcomingCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "bundesliga");

export const laligastandingsCommand = (s: WASocket, m: WAMessage) => standingsCommand(s, m, "laliga");
export const laligamatchesCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "laliga");
export const laligascorersCommand = (s: WASocket, m: WAMessage) => scorersCommand(s, m, "laliga");
export const laligaupcomingCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "laliga");

export const serieastandingsCommand = (s: WASocket, m: WAMessage) => standingsCommand(s, m, "seriea");
export const serieamatchesCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "seriea");
export const serieascorersCommand = (s: WASocket, m: WAMessage) => scorersCommand(s, m, "seriea");
export const serieaupcomingCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "seriea");

export const ligue1standingsCommand = (s: WASocket, m: WAMessage) => standingsCommand(s, m, "ligue1");
export const ligue1matchesCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "ligue1");
export const ligue1scorersCommand = (s: WASocket, m: WAMessage) => scorersCommand(s, m, "ligue1");
export const ligue1upcomingCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "ligue1");

export const eflstandingsCommand = (s: WASocket, m: WAMessage) => standingsCommand(s, m, "efl");
export const eflmatchesCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "efl");
export const eflscorersCommand = (s: WASocket, m: WAMessage) => scorersCommand(s, m, "efl");
export const eflupcomingCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "efl");

export const elstandingsCommand = (s: WASocket, m: WAMessage) => standingsCommand(s, m, "el");
export const elmatchesCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "el");
export const elscorersCommand = (s: WASocket, m: WAMessage) => scorersCommand(s, m, "el");
export const elupcomingCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "el");

export const wcstandingsCommand = (s: WASocket, m: WAMessage) => standingsCommand(s, m, "wc");
export const wcmatchesCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "wc");
export const wcscorersCommand = (s: WASocket, m: WAMessage) => scorersCommand(s, m, "wc");
export const wcupcomingCommand = (s: WASocket, m: WAMessage) => matchesCommand(s, m, "wc");

export async function wrestlingeventsCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, {
    text: "🤼 *WWE/AEW Events*\n\nCheck the latest wrestling events:\n🌐 https://www.wwe.com/shows/\n🌐 https://www.allelitewrestling.com/",
  }, { quoted: msg });
}

export async function wwenewsCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  try {
    const res = await axios.get("https://www.wwe.com/news", { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000 });
    await sock.sendMessage(jid, { text: "📰 *WWE News:*\n🌐 https://www.wwe.com/news" }, { quoted: msg });
  } catch {
    await sock.sendMessage(jid, { text: "📰 *WWE News:* https://www.wwe.com/news" }, { quoted: msg });
  }
}

export async function wwescheduleCommand(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  await sock.sendMessage(jid, {
    text: "🗓️ *WWE Schedule:*\n🌐 https://www.wwe.com/shows/",
  }, { quoted: msg });
}
