"use client";
import { useEffect, useState } from "react";
import Court, { COLORS } from "./court";
import {
  curServer, goldenPoint, other, partner, point, pointLabels, serveSide, start, teamName, teamOf,
  type Match, type Pair, type Team,
} from "@/lib/match";

const KEY = "padel-setup"; // long-term: player names + rules; the match itself lives in state only
type Saved = { m: Match | null; past: Match[] };
const TEAM = ["bg-ta", "bg-tb"];

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
    <div className="flex h-full flex-col gap-2 p-2.5">
      <div className="rounded-2xl bg-white p-2 shadow-md ring-1 ring-slate-200">
        <div className="mb-0.5 flex justify-end gap-1 pr-1 text-[10px] font-extrabold tracking-wider text-slate-400">
          {m.sets.map((_, i) => <span key={i} className="w-7 text-center">SET {i + 1}</span>)}
          <span className="w-9 text-center">GAMES</span><span className="w-14 text-center">POINTS</span>
        </div>
        {([0, 1] as Team[]).map((t) => (
          <div key={t} className="flex items-center gap-2 py-0.5">
            <span className={`h-9 w-1.5 shrink-0 rounded-full ${TEAM[t]}`} />
            <div className="min-w-0 flex-1 text-sm font-extrabold leading-tight">
              <div className="truncate">{n[2 * t]}</div>
              <div className="truncate">{n[2 * t + 1]}</div>
            </div>
            {teamOf(server) === t && <span className="grid h-5 w-5 place-items-center rounded-full bg-ball text-[11px] shadow ring-1 ring-ink/30" title="Serving">🎾</span>}
            {m.sets.map((s, i) => <span key={i} className="w-7 text-center text-lg font-bold text-slate-400">{s[t]}</span>)}
            <span className="w-9 text-center text-3xl font-black tabular-nums">{m.games[t]}</span>
            <span className="w-14 rounded-xl bg-ink py-0.5 text-center text-3xl font-black tabular-nums text-ball">{labels[t]}</span>
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1"><Court m={m} /></div>

      <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-md ring-1 ring-slate-200">
        {m.winner !== null ? (
          <p className="w-full text-center text-lg font-black">🏆 {teamName(m, m.winner)} win!</p>
        ) : (
          <>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ball text-lg shadow-inner">🎾</span>
            <p className="text-sm font-bold leading-tight">
              <span className="font-black">{n[server]}</span> serves from the{" "}
              <span className="rounded bg-ink px-1.5 py-0.5 text-xs font-black text-ball">{serveSide(m) === "R" ? "RIGHT" : "LEFT"}</span>{" "}
              to <span className="font-black">{n[recv]}</span>
              {m.tb && <span className="ml-1 rounded bg-amber-300 px-1.5 py-0.5 text-xs font-black">TIE-BREAK</span>}
              {goldenPoint(m) && <span className="ml-1 rounded bg-amber-300 px-1.5 py-0.5 text-xs font-black">GOLDEN POINT · receivers pick side</span>}
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        {([0, 1] as Team[]).map((t) => (
          <button key={t} disabled={m.winner !== null} onClick={() => score(t)}
            className={`min-h-16 rounded-2xl px-2 text-white shadow-lg transition disabled:opacity-40 ${TEAM[t]}`}>
            <span className="block text-lg font-black leading-tight">+ Point</span>
            <span className="block truncate text-xs font-semibold opacity-90">{n[2 * t]} & {n[2 * t + 1]}</span>
          </button>
        ))}
        <div className="grid gap-1.5">
          <button onClick={undo} disabled={!past.length} className="min-h-[30px] rounded-xl bg-ink px-3 text-sm font-extrabold text-white disabled:opacity-30">↶ Undo</button>
          <button onClick={reset} className="min-h-[30px] rounded-xl bg-slate-200 px-3 text-sm font-extrabold text-slate-700">New</button>
        </div>
      </div>

      {m.msg && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-ink/70 p-3 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm animate-sheet rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-1 grid h-12 w-12 place-items-center rounded-2xl bg-ball text-2xl">{m.winner !== null ? "🏆" : "📣"}</div>
            <h2 className="text-2xl font-black leading-tight">{m.msg.title}</h2>
            <ul className="my-3 space-y-2">
              {m.msg.lines.map((l) => (
                <li key={l} className="flex gap-2 rounded-xl bg-slate-100 p-3 text-base font-bold">
                  <span className="text-emerald-600">✔</span>{l}
                </li>
              ))}
            </ul>
            <button onClick={() => setS({ m: { ...m, msg: null }, past })} className="min-h-14 w-full rounded-2xl bg-ink text-lg font-black text-ball shadow-lg">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Setup({ onStart }: { onStart: (m: Match) => void }) {
  const [names, setNames] = useState(["Alex", "Sam", "Jo", "Kim"]);
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
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        <div>
          <h2 className="text-2xl font-black leading-tight">New match</h2>
          <p className="text-sm font-medium text-slate-600">Enter names, tap <b>R/L</b> to swap a team&apos;s sides, tap 🎾 to pick who serves first.</p>
        </div>
        {([0, 1] as Team[]).map((t) => (
          <div key={t} className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
            <div className={`flex items-center justify-between px-3 py-1.5 text-sm font-black text-white ${TEAM[t]}`}>
              <span>TEAM {t ? "B" : "A"}</span>
              <button onClick={() => setRight((r) => r.map((x, i) => (i === t ? partner(x) : x)) as Pair)}
                className="min-h-8 rounded-full bg-white/20 px-3 text-xs font-extrabold">⇄ swap sides</button>
            </div>
            {[2 * t, 2 * t + 1].map((p) => (
              <div key={p} className="flex items-center gap-2 p-2">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black text-white ${TEAM[t]}`}>
                  {names[p].slice(0, 2).toUpperCase() || "?"}
                </span>
                <input value={names[p]} maxLength={12} aria-label={`Player ${p + 1} name`}
                  onChange={(e) => setNames((n) => n.map((x, i) => (i === p ? e.target.value : x)))}
                  onFocus={(e) => e.target.select()}
                  className="min-h-11 min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 text-base font-bold outline-none focus:border-ink" />
                <button onClick={() => setRight((r) => r.map((x, i) => (i === t ? partner(x) : x)) as Pair)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-black text-slate-700" aria-label="Swap side">
                  {right[t] === p ? "R" : "L"}
                </button>
                <button onClick={() => setFirst(p)} aria-pressed={first === p} aria-label="Serves first"
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl transition ${first === p ? "bg-ball ring-2 ring-ink" : "bg-slate-100 opacity-50"}`}>
                  🎾
                </button>
              </div>
            ))}
          </div>
        ))}
        <button onClick={() => setGolden((g) => !g)} role="switch" aria-checked={golden}
          className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-md ring-1 ring-slate-200">
          <span className="flex-1">
            <span className="block text-base font-black">Golden point</span>
            <span className="block text-xs font-medium text-slate-600">{golden ? "At 40-40 the next point wins" : "At 40-40 play advantage (win by 2)"}</span>
          </span>
          <span className={`flex h-8 w-14 items-center rounded-full p-1 transition-colors ${golden ? "bg-ink" : "bg-slate-300"}`}>
            <span className={`h-6 w-6 rounded-full transition-transform ${golden ? "translate-x-6 bg-ball" : "bg-white"}`} />
          </span>
        </button>
      </div>
      <div className="p-3 pt-1">
        <button onClick={begin} className="min-h-14 w-full rounded-2xl bg-ink text-lg font-black text-ball shadow-xl">Start match →</button>
      </div>
    </div>
  );
}
