// Pure padel match logic. Players: team 0 = ids 0,1 / team 1 = ids 2,3.
export type Team = 0 | 1;
export type Pair = [number, number];
export type Side = "R" | "L";
export type Msg = { title: string; lines: string[] };
export type Config = { golden: boolean; names: string[] };
export type Match = {
  cfg: Config;
  sets: Pair[]; // finished sets
  games: Pair; // current set
  pts: Pair; // current game (or tie-break) points
  tb: boolean;
  tbOrder: number[]; // tie-break serving rotation
  server: number; // current game's server (tie-break: first server)
  next: Pair; // who serves next for each team
  right: Pair; // player on the right-hand side per team (fixed for the set)
  top: Team; // team currently at the top end
  winner: Team | null;
  msg: Msg | null; // modal prompt to show
};

export const teamOf = (p: number) => (p >> 1) as Team;
export const partner = (p: number) => p ^ 1;
export const other = (t: Team) => (1 - t) as Team;
export const teamName = (m: Match, t: Team) => `${m.cfg.names[2 * t]} & ${m.cfg.names[2 * t + 1]}`;

export function start(cfg: Config, first: number, right: Pair): Match {
  const t = teamOf(first);
  const next: Pair = [0, 0];
  next[t] = partner(first);
  next[other(t)] = right[other(t)]; // receiving team's first server = their right player
  return {
    cfg, sets: [], games: [0, 0], pts: [0, 0], tb: false, tbOrder: [],
    server: first, next, right, top: 1, winner: null, msg: null,
  };
}

const played = (m: Match) => m.pts[0] + m.pts[1];

export function curServer(m: Match) {
  return m.tb ? m.tbOrder[Math.floor((played(m) + 1) / 2) % 4] : m.server;
}

// Server alternates right/left every point, starting right.
export const serveSide = (m: Match): Side => (played(m) % 2 === 0 ? "R" : "L");

export const goldenPoint = (m: Match) => m.cfg.golden && !m.tb && m.pts[0] === 3 && m.pts[1] === 3;

export function pointLabels(m: Match): [string, string] {
  const [a, b] = m.pts;
  if (m.tb) return [String(a), String(b)];
  if (a >= 3 && b >= 3 && !m.cfg.golden) {
    if (a === b) return ["40", "40"];
    return a > b ? ["AD", "40"] : ["40", "AD"];
  }
  const L = ["0", "15", "30", "40"];
  return [L[Math.min(a, 3)], L[Math.min(b, 3)]];
}

function advance(m: Match): Match {
  const t = other(teamOf(m.server));
  const server = m.next[t];
  const next: Pair = [...m.next];
  next[t] = partner(server);
  return { ...m, server, next };
}

function endGame(m: Match, t: Team): Match {
  const games: Pair = [...m.games];
  games[t]++;
  const odd = (games[0] + games[1]) % 2 === 1;
  const setOver = m.tb || (games[t] >= 6 && games[t] - games[other(t)] >= 2);
  const top = odd ? other(m.top) : m.top;
  const lines: string[] = [];
  const base = { ...m, pts: [0, 0] as Pair, tb: false, tbOrder: [] as number[], top };
  const swap = () => odd && lines.push("Swap ends of the court");

  if (setOver) {
    const sets = [...m.sets, games];
    const won = sets.filter((s) => s[t] > s[other(t)]).length;
    if (won === 2) {
      return { ...base, sets, games: [0, 0], winner: t, msg: { title: `${teamName(m, t)} win the match!`, lines: [] } };
    }
    swap();
    lines.push("New set: teams may choose sides again");
    const n = advance({ ...base, sets, games: [0, 0] });
    lines.push(`${m.cfg.names[n.server]} serves`);
    return { ...n, msg: { title: `Set to ${teamName(m, t)}`, lines } };
  }

  swap();
  let n = advance({ ...base, games });
  if (games[0] === 6 && games[1] === 6) {
    const opp = n.next[other(teamOf(n.server))];
    n = { ...n, tb: true, tbOrder: [n.server, opp, partner(n.server), partner(opp)] };
    lines.push("TIE-BREAK: first to 7, win by 2", `${m.cfg.names[n.server]} serves 1 point, then each player serves 2`, "Swap ends every 6 points");
  } else {
    lines.push(`${m.cfg.names[n.server]} serves next game`);
  }
  return { ...n, msg: { title: `Game to ${teamName(m, t)}`, lines } };
}

export function point(m: Match, t: Team): Match {
  if (m.winner !== null) return m;
  const pts: Pair = [...m.pts];
  pts[t]++;
  const need = m.tb ? 7 : 4;
  const lead = m.tb || !m.cfg.golden ? 2 : 1; // golden point: 4-3 wins
  if (pts[t] >= need && pts[t] - pts[other(t)] >= lead) return endGame({ ...m, pts }, t);
  if (m.tb && (pts[0] + pts[1]) % 6 === 0) {
    return { ...m, pts, top: other(m.top), msg: { title: "Swap ends", lines: ["Tie-break: change ends every 6 points"] } };
  }
  return { ...m, pts, msg: null };
}
