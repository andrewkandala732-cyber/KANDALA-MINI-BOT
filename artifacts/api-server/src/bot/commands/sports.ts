import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import axios from "axios";

function reply(sock: WASocket, msg: WAMessage, text: string) {
  return sock.sendMessage(msg.key.remoteJid!, { text }, { quoted: msg });
}

const FOOTBALL_KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE = "https://api.football-data.org/v4";

const LEAGUES: Record<string, { id: number; name: string; short: string }> = {
  epl:       { id: 2021, name: "Premier League",    short: "EPL"  },
  cl:        { id: 2001, name: "Champions League",  short: "UCL"  },
  laliga:    { id: 2014, name: "La Liga",            short: "LaLiga" },
  bundesliga:{ id: 2002, name: "Bundesliga",         short: "BL"   },
  seriea:    { id: 2019, name: "Serie A",            short: "SA"   },
  ligue1:    { id: 2015, name: "Ligue 1",            short: "L1"   },
  efl:       { id: 2016, name: "Championship",       short: "EFL"  },
  el:        { id: 2146, name: "Europa League",      short: "UEL"  },
  wc:        { id: 2000, name: "World Cup",          short: "WC"   },
};

async function footballGet(endpoint: string) {
  if (!FOOTBALL_KEY) throw new Error("FOOTBALL_DATA_API_KEY not set.\nAdd it to Replit Secrets → football-data.org (free tier)");
  const res = await axios.get(`${BASE}${endpoint}`, {
    headers: { "X-Auth-Token": FOOTBALL_KEY },
    timeout: 10000,
  });
  return res.data;
}

function formatStandings(data: any, leagueName: string): string {
  const standings = data.standings?.[0]?.table?.slice(0, 10);
  if (!standings) return "No standings available.";
  const rows = standings.map((t: any) =>
    `${String(t.position).padStart(2)}. ${t.team.name.slice(0, 18).padEnd(18)} ${String(t.points).padStart(3)}pts  ${t.won}W-${t.draw}D-${t.lost}L`
  ).join("\n");
  return `🏆 *${leagueName} STANDINGS*\n\`\`\`\n#   Team               Pts\n${"─".repeat(40)}\n${rows}\n\`\`\``;
}

function formatMatches(data: any, leagueName: string, type: string): string {
  const matches = data.matches?.slice(0, 8);
  if (!matches?.length) return `No ${type} matches found.`;
  const rows = matches.map((m: any) => {
    const date = new Date(m.utcDate).toLocaleDateString("en-KE", { month: "short", day: "numeric" });
    const status = m.status === "FINISHED"
      ? `${m.score?.fullTime?.home ?? "?"}-${m.score?.fullTime?.away ?? "?"}`
      : m.status === "IN_PLAY" ? "🔴 LIVE" : date;
    return `• ${m.homeTeam.shortName || m.homeTeam.name} vs ${m.awayTeam.shortName || m.awayTeam.name}  [${status}]`;
  }).join("\n");
  return `⚽ *${leagueName} ${type.toUpperCase()} MATCHES*\n\n${rows}`;
}

function formatScorers(data: any, leagueName: string): string {
  const scorers = data.scorers?.slice(0, 10);
  if (!scorers?.length) return "No scorers data available.";
  const rows = scorers.map((s: any, i: number) =>
    `${i + 1}. ${s.player.name} (${s.team.shortName || s.team.name}) — ⚽ ${s.goals}`
  ).join("\n");
  return `🥅 *${leagueName} TOP SCORERS*\n\n${rows}`;
}

async function leagueStandings(sock: WASocket, msg: WAMessage, leagueKey: string) {
  const league = LEAGUES[leagueKey];
  if (!league) return reply(sock, msg, "❌ Unknown league.");
  try {
    const data = await footballGet(`/competitions/${league.id}/standings`);
    await reply(sock, msg, formatStandings(data, league.name));
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

async function leagueMatches(sock: WASocket, msg: WAMessage, leagueKey: string, type: "current" | "upcoming") {
  const league = LEAGUES[leagueKey];
  if (!league) return reply(sock, msg, "❌ Unknown league.");
  try {
    const statusFilter = type === "upcoming" ? "?status=SCHEDULED" : "?status=FINISHED&limit=8";
    const data = await footballGet(`/competitions/${league.id}/matches${statusFilter}`);
    await reply(sock, msg, formatMatches(data, league.name, type === "upcoming" ? "Upcoming" : "Recent"));
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

async function leagueScorers(sock: WASocket, msg: WAMessage, leagueKey: string) {
  const league = LEAGUES[leagueKey];
  if (!league) return reply(sock, msg, "❌ Unknown league.");
  try {
    const data = await footballGet(`/competitions/${league.id}/scorers?limit=10`);
    await reply(sock, msg, formatScorers(data, league.name));
  } catch (e: any) { await reply(sock, msg, `❌ ${e.message}`); }
}

// EPL
export const eplstandingsCommand = (s: WASocket, m: WAMessage) => leagueStandings(s, m, "epl");
export const eplmatchesCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "epl", "current");
export const eplupcomingCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "epl", "upcoming");
export const eplscorersCommand = (s: WASocket, m: WAMessage) => leagueScorers(s, m, "epl");

// Champions League
export const clstandingsCommand = (s: WASocket, m: WAMessage) => leagueStandings(s, m, "cl");
export const clmatchesCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "cl", "current");
export const clupcomingCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "cl", "upcoming");
export const clscorersCommand = (s: WASocket, m: WAMessage) => leagueScorers(s, m, "cl");

// La Liga
export const laligastandingsCommand = (s: WASocket, m: WAMessage) => leagueStandings(s, m, "laliga");
export const laligamatchesCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "laliga", "current");
export const laligaupcomingCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "laliga", "upcoming");
export const laligascorersCommand = (s: WASocket, m: WAMessage) => leagueScorers(s, m, "laliga");

// Bundesliga
export const bundesligastandingsCommand = (s: WASocket, m: WAMessage) => leagueStandings(s, m, "bundesliga");
export const bundesligamatchesCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "bundesliga", "current");
export const bundesligaupcomingCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "bundesliga", "upcoming");
export const bundesligascorersCommand = (s: WASocket, m: WAMessage) => leagueScorers(s, m, "bundesliga");

// Serie A
export const serieastandingsCommand = (s: WASocket, m: WAMessage) => leagueStandings(s, m, "seriea");
export const serieamatchesCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "seriea", "current");
export const serieaupcomingCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "seriea", "upcoming");
export const serieascorersCommand = (s: WASocket, m: WAMessage) => leagueScorers(s, m, "seriea");

// Ligue 1
export const ligue1standingsCommand = (s: WASocket, m: WAMessage) => leagueStandings(s, m, "ligue1");
export const ligue1matchesCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "ligue1", "current");
export const ligue1upcomingCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "ligue1", "upcoming");
export const ligue1scorersCommand = (s: WASocket, m: WAMessage) => leagueScorers(s, m, "ligue1");

// EFL Championship
export const eflstandingsCommand = (s: WASocket, m: WAMessage) => leagueStandings(s, m, "efl");
export const eflmatchesCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "efl", "current");
export const eflupcomingCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "efl", "upcoming");
export const eflscorersCommand = (s: WASocket, m: WAMessage) => leagueScorers(s, m, "efl");

// Europa League
export const elstandingsCommand = (s: WASocket, m: WAMessage) => leagueStandings(s, m, "el");
export const elmatchesCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "el", "current");
export const elupcomingCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "el", "upcoming");
export const elscorersCommand = (s: WASocket, m: WAMessage) => leagueScorers(s, m, "el");

// World Cup
export const wcstandingsCommand = (s: WASocket, m: WAMessage) => leagueStandings(s, m, "wc");
export const wcmatchesCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "wc", "current");
export const wcupcomingCommand = (s: WASocket, m: WAMessage) => leagueMatches(s, m, "wc", "upcoming");
export const wcscorersCommand = (s: WASocket, m: WAMessage) => leagueScorers(s, m, "wc");

// WWE / Wrestling
export async function wwenewsCommand(sock: WASocket, msg: WAMessage) {
  try {
    const res = await axios.get("https://newsapi.org/v2/everything?q=WWE+wrestling&sortBy=publishedAt&pageSize=5&apiKey=demo", { timeout: 8000 });
    if (res.data.articles?.length) {
      const articles = res.data.articles.slice(0, 5);
      const text = articles.map((a: any, i: number) => `${i + 1}. *${a.title}*\n   📰 ${a.source.name}`).join("\n\n");
      await reply(sock, msg, `🥊 *WWE NEWS*\n\n${text}`);
    } else throw new Error("no articles");
  } catch {
    await reply(sock, msg, `🥊 *WWE NEWS*\n\nFor latest WWE news visit:\n📰 https://www.wwe.com/news\n📺 https://www.wrestlinginc.com\n\n_Add NEWS_API_KEY to secrets for live news._`);
  }
}

export async function wwescheduleCommand(sock: WASocket, msg: WAMessage) {
  await reply(sock, msg,
    `📅 *WWE SCHEDULE*\n\n` +
    `🎯 For the latest WWE event schedule:\n\n` +
    `• 🌐 https://www.wwe.com/events\n` +
    `• 📺 WWE Network / Peacock\n` +
    `• 📱 WWE App\n\n` +
    `_Add FOOTBALL_DATA_API_KEY to secrets for football scores._`
  );
}

export async function wrestlingeventsCommand(sock: WASocket, msg: WAMessage) {
  return wwescheduleCommand(sock, msg);
}
