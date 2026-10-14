// Pure padel match logic. Players: team 0 = ids 0,1 / team 1 = ids 2,3.
export type Team = 0 | 1;
export type Pair = [number, number];
export type Side = "R" | "L";
// A prompt the players must confirm before play continues.
// pick: "serve" = live serve instructions, "positions" = choose right/left, "golden" = receivers pick side.
export type Step = { icon: string; title: string; lines: string[]; pick?: "serve" | "positions" | "golden" };
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
  gpSide: Side | null; // golden point: side the receivers chose
  steps: Step[]; // queued prompts, first one is showing
  note: string; // what just happened
};

export const teamOf = (p: number) => (p >> 1) as Team;
export const partner = (p: number) => p ^ 1;
export const other = (t: Team) => (1 - t) as Team;
export const teamName = (m: Match, t: Team) => `${m.cfg.names[2 * t]} & ${m.cfg.names[2 * t + 1]}`;
const SERVE: Step = { icon: "🎾", title: "", lines: [], pick: "serve" };

export function start(cfg: Config, first: number, right: Pair, top: Team = 1): Match {
  const t = teamOf(first);
  const next: Pair = [0, 0];
  next[t] = partner(first);
  next[other(t)] = right[other(t)]; // receiving team's first server = their right player
  return {
    cfg, sets: [], games: [0, 0], pts: [0, 0], tb: false, tbOrder: [],
    server: first, next, right, top, winner: null, gpSide: null, steps: [SERVE], note: "",
  };
}

const played = (m: Match) => m.pts[0] + m.pts[1];

export function curServer(m: Match) {
  return m.tb ? m.tbOrder[Math.floor((played(m) + 1) / 2) % 4] : m.server;
}

// Server alternates right/left every point, starting right. Golden point: receivers choose.
export const serveSide = (m: Match): Side => m.gpSide ?? (played(m) % 2 === 0 ? "R" : "L");

// Receiver stands diagonally: same side label as the server, on the other team.
export function receiverFor(m: Match, side: Side) {
  const rt = other(teamOf(curServer(m)));
  return side === "R" ? m.right[rt] : partner(m.right[rt]);
}

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

// Live instructions for the next serve; computed from current state so they never go stale.
export function serveStep(m: Match) {
  const nm = m.cfg.names;
  const s = curServer(m);
  const side = serveSide(m);
  const r = receiverFor(m, side);
  const title = m.tb
    ? `Tie-break · point ${played(m) + 1}`
    : `Set ${m.sets.length + 1} · Game ${m.games[0] + m.games[1] + 1}`;
  return {
    title,
    lines: [
      `${nm[s]} serves from the ${side === "R" ? "RIGHT" : "LEFT"}, behind the service line`,
      `${nm[r]} receives, standing diagonally opposite`,
      `${nm[partner(s)]} and ${nm[partner(r)]} wait near the net`,
      "Underarm serve: let it bounce, hit below the waist, aim diagonally. 2 attempts.",
    ],
  };
}

export const shift = (m: Match): Match => ({ ...m, steps: m.steps.slice(1) });
export const setRight = (m: Match, right: Pair): Match => ({ ...m, right });
export const pickGoldenSide = (m: Match, side: Side): Match => ({ ...m, gpSide: side });

function advance(m: Match): Match {
  const t = other(teamOf(m.server));
  const server = m.next[t];
  const next: Pair = [...m.next];
  next[t] = partner(server);
  return { ...m, server, next };
}

const swapStep = (why: string): Step => ({
  icon: "↔️",
  title: "Swap ends",
  lines: [why, "Both teams walk to the opposite end of the court", "Keep your own right/left sides"],
});

function endGame(m: Match, t: Team): Match {
  const games: Pair = [...m.games];
  games[t]++;
  const odd = (games[0] + games[1]) % 2 === 1;
  const setOver = m.tb || (games[t] >= 6 && games[t] - games[other(t)] >= 2);
  const top = odd ? other(m.top) : m.top;
  const A = teamName(m, t);
  const steps: Step[] = [
    { icon: "✅", title: `Game to ${A}`, lines: [m.tb ? `Tie-break won ${m.pts[0]}–${m.pts[1]}` : `Games: ${games[0]}–${games[1]}`] },
  ];
  const base = { ...m, pts: [0, 0] as Pair, tb: false, tbOrder: [] as number[], top, gpSide: null, note: "" };
  const swap = () => odd && steps.push(swapStep(`${games[0] + games[1]} games played: odd total`));

  if (setOver) {
    const sets = [...m.sets, games];
    const won: Pair = [0, 0];
    sets.forEach((s) => won[s[0] > s[1] ? 0 : 1]++);
    const line = sets.map((s) => `${s[0]}–${s[1]}`).join(", ");
    if (won[t] === 2) {
      steps.push({ icon: "🏆", title: `${A} win the match!`, lines: [`Sets: ${line}`, "Shake hands, great game!"] });
      return { ...base, sets, games: [0, 0], winner: t, steps };
    }
    swap();
    steps.push({ icon: "🏅", title: `Set to ${A}`, lines: [`Set scores: ${line}`, `Sets won: ${won[0]}–${won[1]}`] });
    steps.push({ icon: "📍", title: "New set: choose positions", lines: ["Each team decides who plays right and who plays left for this set"], pick: "positions" });
    steps.push(SERVE);
    return { ...advance({ ...base, sets, games: [0, 0] }), steps };
  }

  swap();
  let n = advance({ ...base, games });
  if (games[0] === 6 && games[1] === 6) {
    const opp = n.next[other(teamOf(n.server))];
    n = { ...n, tb: true, tbOrder: [n.server, opp, partner(n.server), partner(opp)] };
    steps.push({
      icon: "⚡",
      title: "Tie-break at 6-6",
      lines: ["First to 7 points, win by 2", "First server serves 1 point, then each player serves 2 in turn", "Server alternates right/left every point", "Swap ends every 6 points"],
    });
  }
  steps.push(SERVE);
  return { ...n, steps };
}

export function point(m: Match, t: Team): Match {
  if (m.winner !== null || m.steps.length) return m;
  const pts: Pair = [...m.pts];
  pts[t]++;
  const need = m.tb ? 7 : 4;
  const lead = m.tb || !m.cfg.golden ? 2 : 1; // golden point: 4-3 wins
  if (pts[t] >= need && pts[t] - pts[other(t)] >= lead) return endGame({ ...m, pts }, t);

  const n: Match = { ...m, pts, gpSide: null, steps: [] };
  const [a, b] = pointLabels(n);
  const side = serveSide(n) === "R" ? "RIGHT" : "LEFT";
  n.note = `Point to ${teamName(m, t)} · ${a}–${b}. ${m.cfg.names[curServer(n)]} serves from the ${side}.`;
  if (m.tb && (pts[0] + pts[1]) % 6 === 0) {
    n.top = other(m.top);
    n.steps.push(swapStep(`${pts[0] + pts[1]} tie-break points played`));
  } else if (m.tb && curServer(n) !== curServer(m)) {
    n.steps.push(SERVE); // server changes
  }
  if (goldenPoint(n)) {
    n.steps.push({
      icon: "⭐",
      title: "Golden point!",
      lines: ["40-40: the next point wins the game", "The receiving team chooses which side to receive"],
      pick: "golden",
    });
  }
  return n;
}
