"use client";
import { useEffect, useState } from "react";
import Court, { COLORS } from "./court";
import {
  curServer, goldenPoint, other, partner, point, pointLabels, serveSide, start, teamName, teamOf,
  type Match, type Pair, type Team,
} from "@/lib/match";

const KEY = "padel-setup"; // long-term: player names + rules; the match itself lives in state only
type Saved = { m: Match | null; past: Match[] };

export default function Play() {
  const [{ m, past }, setS] = useState<Saved>({ m: null, past: [] });

  if (!m) return <Setup onStart={(m) => setS({ m, past: [] })} />;

  const score = (t: Team) => setS({ m: point(m, t), past: [...past.slice(-199), { ...m, msg: null }] });
  const undo = () => past.length && setS({ m: past[past.length - 1], past: past.slice(0, -1) });
  const reset = () => confirm("Start a new match?") && setS({ m: null, past: [] });

  const server = curServer(m);
  const rt = other(teamOf(server));
  const recv = serveSide(m) === "R" ? m.right[rt] : partner(m.right[rt]);
  const labels = pointLabels(m);
  const n = m.cfg.names;

  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <div className="rounded-xl bg-white p-2 shadow">
        {([0, 1] as Team[]).map((t) => (
          <div key={t} className="flex items-center gap-2 py-0.5">
            <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: COLORS[t] }} />
            <span className="min-w-0 flex-1 truncate text-sm font-bold">
              {teamName(m, t)} {teamOf(server) === t && "🎾"}
            </span>
            {m.sets.map((s, i) => <span key={i} className="w-6 text-center text-lg text-gray-500">{s[t]}</span>)}
            <span className="w-7 text-center text-2xl font-black">{m.games[t]}</span>
            <span className="w-12 rounded bg-gray-900 py-0.5 text-center text-2xl font-black text-white">{labels[t]}</span>
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        <Court m={m} />
      </div>

      <p className="text-center text-sm font-bold leading-tight">
        {m.winner !== null ? `🏆 ${teamName(m, m.winner)} win!` : <>
          {m.tb && <span className="mr-1 rounded bg-yellow-300 px-1">TIE-BREAK</span>}
          {goldenPoint(m) && <span className="mr-1 rounded bg-yellow-300 px-1">GOLDEN POINT · receivers pick side</span>}
          {n[server]} serves from the {serveSide(m) === "R" ? "RIGHT" : "LEFT"} → {n[recv]}
        </>}
      </p>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        {([0, 1] as Team[]).map((t) => (
          <button key={t} disabled={m.winner !== null} onClick={() => score(t)}
            className="min-h-14 rounded-xl text-base font-black text-white active:opacity-80 disabled:opacity-40"
            style={{ background: COLORS[t] }}>
            + Point<br /><span className="text-xs font-semibold">{teamName(m, t)}</span>
          </button>
        ))}
        <div className="flex flex-col gap-1">
          <button onClick={undo} disabled={!past.length} className="min-h-11 min-w-11 rounded-lg bg-gray-900 px-2 text-sm font-bold text-white disabled:opacity-30">↶ Undo</button>
          <button onClick={reset} className="min-h-11 min-w-11 rounded-lg bg-gray-300 px-2 text-sm font-bold">New</button>
        </div>
      </div>

      {m.msg && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-2xl font-black">{m.msg.title}</h2>
            <ul className="my-3 space-y-2 text-lg font-semibold">
              {m.msg.lines.map((l) => <li key={l}>• {l}</li>)}
            </ul>
            <button onClick={() => setS({ m: { ...m, msg: null }, past })} className="min-h-14 w-full rounded-xl bg-gray-900 text-lg font-black text-white">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Setup({ onStart }: { onStart: (m: Match) => void }) {
  const [names, setNames] = useState(["Player 1", "Player 2", "Player 3", "Player 4"]);
  const [right, setRight] = useState<Pair>([0, 2]);
  const [first, setFirst] = useState(0);
  const [golden, setGolden] = useState(true);

  useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (o) { setNames(o.names); setGolden(o.golden); }
    } catch {}
  }, []);
  const begin = () => {
    const cfg = { golden, names: names.map((x, i) => x.trim() || `P${i + 1}`) };
    try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch {}
    onStart(start(cfg, first, right));
  };

  return (
    <div className="h-full space-y-3 overflow-y-auto p-3">
      {([0, 1] as Team[]).map((t) => (
        <div key={t} className="rounded-xl bg-white p-3 shadow">
          <div className="mb-1 flex items-center gap-2 font-black">
            <span className="h-4 w-4 rounded-full" style={{ background: COLORS[t] }} /> Team {t ? "B" : "A"}
            <button className="ml-auto min-h-11 rounded-lg bg-gray-200 px-3 text-sm" onClick={() => setRight((r) => (r.map((x, i) => (i === t ? partner(x) : x)) as Pair))}>
              ⇄ swap sides
            </button>
          </div>
          {[2 * t, 2 * t + 1].map((p) => (
            <div key={p} className="flex items-center gap-2 py-1">
              <input value={names[p]} onChange={(e) => setNames((n) => n.map((x, i) => (i === p ? e.target.value : x)))}
                className="min-h-11 min-w-0 flex-1 rounded-lg border-2 border-gray-300 px-3 text-base" maxLength={12} />
              <span className="w-14 text-center text-xs font-bold text-gray-600">{right[t] === p ? "RIGHT" : "LEFT"}</span>
              <button onClick={() => setFirst(p)} className={`min-h-11 rounded-lg px-3 text-sm font-bold ${first === p ? "bg-yellow-300" : "bg-gray-200"}`}>
                {first === p ? "🎾 serves" : "serve 1st"}
              </button>
            </div>
          ))}
        </div>
      ))}
      <label className="flex min-h-11 items-center gap-3 rounded-xl bg-white p-3 text-base font-bold shadow">
        <input type="checkbox" checked={golden} onChange={(e) => setGolden(e.target.checked)} className="h-6 w-6" />
        Golden point at 40-40 (off = advantage)
      </label>
      <button onClick={begin}
        className="min-h-14 w-full rounded-xl bg-gray-900 text-lg font-black text-white">
        Start match
      </button>
    </div>
  );
}
