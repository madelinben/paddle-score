"use client";
import { useState } from "react";
import Wizard from "./wizard";
import Court, { COLORS } from "./court";
import {
  curServer, goldenPoint, pickGoldenSide, point, pointLabels, receiverFor, serveSide, serveStep, setRight, shift, teamName, teamOf,
  type Match, type Pair, type Side, type Team,
} from "@/lib/match";

type Saved = { m: Match | null; past: Match[] };
const TEAM = ["bg-ta", "bg-tb"];

export default function Play() {
  const [{ m, past }, setS] = useState<Saved>({ m: null, past: [] });
  if (!m) return <Wizard onStart={(m) => setS({ m, past: [] })} />;

  const score = (t: Team) => setS({ m: point(m, t), past: [...past.slice(-199), { ...m, steps: [] }] });
  const undo = () => past.length && setS({ m: past[past.length - 1], past: past.slice(0, -1) });
  const reset = () => confirm("Start a new match?") && setS({ m: null, past: [] });

  const server = curServer(m);
  const recv = receiverFor(m, serveSide(m));
  const step = m.steps[0];
  const next = (nm: Match) => setS({ m: nm, past });
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
          <p className="w-full text-center text-lg font-black">🏆 {teamName(m, m.winner)} win the match!</p>
        ) : (
          <>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ball text-lg shadow-inner">🎾</span>
            <p className="text-sm font-bold leading-tight">
              {m.note && <span className="mb-0.5 block text-xs font-semibold text-slate-500">{m.note}</span>}
              <span className="font-black">{n[server]}</span> serves from the{" "}
              <span className="rounded bg-ink px-1.5 py-0.5 text-xs font-black text-ball">{serveSide(m) === "R" ? "RIGHT" : "LEFT"}</span>{" "}
              to <span className="font-black">{n[recv]}</span>
              {m.tb && <span className="ml-1 rounded bg-amber-300 px-1.5 py-0.5 text-xs font-black">TIE-BREAK</span>}
              {goldenPoint(m) && <span className="ml-1 rounded bg-amber-300 px-1.5 py-0.5 text-xs font-black">GOLDEN POINT · receivers pick side</span>}
            </p>
          </>
        )}
      </div>

      {m.winner !== null ? (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button onClick={() => setS({ m: null, past: [] })} className="min-h-16 rounded-2xl bg-ink text-lg font-black text-ball shadow-lg">New match →</button>
          <button onClick={undo} disabled={!past.length} className="min-h-16 rounded-2xl bg-slate-200 px-4 text-sm font-extrabold">↶ Undo</button>
        </div>
      ) : (
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
      )}

      {step && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-ink/70 p-3 backdrop-blur-sm sm:items-center">
          <div key={m.steps.length} className="w-full max-w-sm animate-sheet rounded-3xl bg-white p-5 shadow-2xl">
            <StepCard m={m} onNext={next} />
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({ m, onNext }: { m: Match; onNext: (m: Match) => void }) {
  const step = m.steps[0];
  const live = step.pick === "serve" ? serveStep(m) : null;
  const title = live?.title ?? step.title;
  const lines = live?.lines ?? step.lines;
  const last = m.steps.length === 1;
  const [right, setR] = useState<Pair>(m.right);

  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ball text-2xl">{step.icon}</span>
        {m.steps.length > 1 && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-600">{m.steps.length} prompts left</span>}
      </div>
      <h2 className="text-2xl font-black leading-tight">{title}</h2>
      <ul className="my-3 space-y-2">
        {lines.map((l) => (
          <li key={l} className="flex gap-2 rounded-xl bg-slate-100 p-3 text-base font-bold"><span className="text-emerald-600">✔</span>{l}</li>
        ))}
      </ul>

      {step.pick === "golden" && (
        <div className="grid grid-cols-2 gap-2">
          {(["L", "R"] as Side[]).map((sd) => (
            <button key={sd} onClick={() => onNext(shift(pickGoldenSide(m, sd)))} className="min-h-16 rounded-2xl bg-ink px-2 text-ball shadow-lg">
              <span className="block text-xs font-extrabold opacity-80">{sd === "R" ? "RIGHT" : "LEFT"} side</span>
              <span className="block truncate text-base font-black">{m.cfg.names[receiverFor(m, sd)]} receives</span>
            </button>
          ))}
        </div>
      )}

      {step.pick === "positions" && (
        <>
          {([0, 1] as Team[]).map((t) => (
            <div key={t} className="mb-2 flex items-center gap-2 rounded-xl bg-slate-100 p-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[t] }} />
              <span className="min-w-0 flex-1 truncate text-sm font-extrabold">
                <b className="text-slate-500">L</b> {m.cfg.names[right[t] ^ 1]} · <b className="text-slate-500">R</b> {m.cfg.names[right[t]]}
              </span>
              <button onClick={() => setR((r) => r.map((x, i) => (i === t ? x ^ 1 : x)) as Pair)} className="min-h-11 rounded-xl bg-white px-3 text-sm font-extrabold shadow">⇄</button>
            </div>
          ))}
          <button onClick={() => onNext(shift(setRight(m, right)))} className="min-h-14 w-full rounded-2xl bg-ink text-lg font-black text-ball shadow-lg">Confirm positions</button>
        </>
      )}

      {!step.pick || step.pick === "serve" ? (
        <button onClick={() => onNext(shift(m))} className="min-h-14 w-full rounded-2xl bg-ink text-lg font-black text-ball shadow-lg">
          {step.pick === "serve" ? "Ready: play!" : last ? "Got it" : "Next →"}
        </button>
      ) : null}
    </>
  );
}
