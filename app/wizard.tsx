"use client";
import { useEffect, useState, type ReactNode } from "react";
import { COLORS } from "./court";
import { other, partner, start, type Match, type Pair, type Team } from "@/lib/match";

const KEY = "padel-setup"; // long-term: player names + rules; the match itself lives in state only
const BG = ["bg-ta", "bg-tb"];
type Stage = "names" | "spin" | "choose" | "end" | "sr" | "positions";
const ORDER: Stage[] = ["names", "spin", "choose", "end", "sr", "positions"];

const Big = ({ onClick, children, color, sub }: { onClick: () => void; children: ReactNode; color?: string; sub?: string }) => (
  <button onClick={onClick} className={`min-h-16 w-full rounded-2xl px-4 text-left text-lg font-black shadow-md ${color ?? "bg-white text-ink ring-1 ring-slate-200"}`}>
    {children}
    {sub && <span className="block text-xs font-semibold opacity-80">{sub}</span>}
  </button>
);

export default function Wizard({ onStart }: { onStart: (m: Match) => void }) {
  const [stage, setStage] = useState<Stage>("names");
  const [hist, setHist] = useState<Stage[]>([]);
  const [names, setNames] = useState(["Alex", "Sam", "Jo", "Kim"]);
  const [golden, setGolden] = useState(true);
  const [chooser, setChooser] = useState<Team>(0); // team currently making a choice
  const [serveTeam, setServeTeam] = useState<Team | null>(null);
  const [endPicker, setEndPicker] = useState<Team>(0);
  const [top, setTop] = useState<Team>(1);
  const [right, setRight] = useState<Pair>([0, 2]);
  const [first, setFirst] = useState<number | null>(null);

  useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (o) { setNames(o.names); setGolden(o.golden); }
    } catch {}
  }, []);

  const go = (s: Stage) => { setHist((h) => [...h, stage]); setStage(s); };
  const back = () => { setStage(hist[hist.length - 1]); setHist((h) => h.slice(0, -1)); };
  const T = (t: Team) => `${names[2 * t] || "?"} & ${names[2 * t + 1] || "?"}`;
  const tn = (t: Team) => <span className={`rounded px-1.5 text-white ${BG[t]}`}>{T(t)}</span>;

  const pickServe = (t: Team, serving: boolean) => {
    const s = serving ? t : other(t);
    setServeTeam(s);
    setFirst(null);
    return s;
  };
  const begin = () => {
    const cfg = { golden, names: names.map((x, i) => x.trim() || `P${i + 1}`) };
    try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch {}
    const st = serveTeam ?? 0;
    onStart(start(cfg, first ?? right[st], right, top));
  };

  const step = ORDER.indexOf(stage) + 1;
  const firstServer = first ?? (serveTeam === null ? null : right[serveTeam]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 pt-3">
        {hist.length > 0 && <button onClick={back} className="min-h-11 rounded-xl bg-slate-200 px-3 text-sm font-extrabold">← Back</button>}
        <div className="ml-auto flex gap-1.5" aria-label={`Step ${step} of ${ORDER.length}`}>
          {ORDER.map((s, i) => <span key={s} className={`h-2 w-6 rounded-full ${i < step ? "bg-ink" : "bg-slate-300"}`} />)}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {stage === "names" && (
          <>
            <Head icon="👥" title="Who's playing?" text="Team A is on the near end (bottom of screen) to begin with." />
            {([0, 1] as Team[]).map((t) => (
              <div key={t} className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
                <div className={`px-3 py-1.5 text-sm font-black text-white ${BG[t]}`}>TEAM {t ? "B" : "A"}</div>
                {[2 * t, 2 * t + 1].map((p) => (
                  <div key={p} className="flex items-center gap-2 p-2">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black text-white ${BG[t]}`}>{names[p].slice(0, 2).toUpperCase() || "?"}</span>
                    <input value={names[p]} maxLength={12} aria-label={`Player ${p + 1} name`}
                      onChange={(e) => setNames((n) => n.map((x, i) => (i === p ? e.target.value : x)))}
                      onFocus={(e) => e.target.select()}
                      className="min-h-11 min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 text-base font-bold outline-none focus:border-ink" />
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
          </>
        )}

        {stage === "spin" && (
          <>
            <Head icon="🪙" title="The spin" text="Spin a racket (or toss a coin). The winner makes the first choice. Who won?" />
            {([0, 1] as Team[]).map((t) => (
              <Big key={t} color={`${BG[t]} text-white`} sub="won the spin" onClick={() => { setChooser(t); go("choose"); }}>{T(t)}</Big>
            ))}
          </>
        )}

        {stage === "choose" && (
          <>
            <Head icon="🎯" title="Make your choice" text={<>{tn(chooser)} choose one:</>} />
            <Big onClick={() => { const s = pickServe(chooser, true); setEndPicker(other(chooser)); void s; go("end"); }} sub={`${T(other(chooser))} then pick the court end`}>🎾 Serve first</Big>
            <Big onClick={() => { pickServe(chooser, false); setEndPicker(other(chooser)); go("end"); }} sub={`${T(other(chooser))} then pick the court end`}>🛡️ Receive first</Big>
            <Big onClick={() => { setServeTeam(null); setEndPicker(chooser); go("end"); }} sub={`${T(other(chooser))} then choose serve or receive`}>↔️ Choose the court end</Big>
            <Big onClick={() => setChooser(other(chooser))} color="bg-slate-200 text-ink" sub={`Pass the choice to ${T(other(chooser))}`}>🤝 Let the opponents choose</Big>
          </>
        )}

        {stage === "end" && (
          <>
            <Head icon="🧭" title="Pick a court end" text={<>{tn(endPicker)} choose where to start. The near end is the bottom of the screen.</>} />
            {[["Near end", "bottom of screen", false], ["Far end", "top of screen", true]].map(([l, sub, far]) => (
              <Big key={l as string} sub={sub as string} onClick={() => { setTop(far ? endPicker : other(endPicker)); setChooser(other(endPicker)); go(serveTeam === null ? "sr" : "positions"); }}>
                {l as string}
              </Big>
            ))}
          </>
        )}

        {stage === "sr" && (
          <>
            <Head icon="🎯" title="Serve or receive?" text={<>{tn(chooser)} choose:</>} />
            <Big onClick={() => { pickServe(chooser, true); go("positions"); }}>🎾 Serve first</Big>
            <Big onClick={() => { pickServe(chooser, false); go("positions"); }}>🛡️ Receive first</Big>
          </>
        )}

        {stage === "positions" && serveTeam !== null && (
          <>
            <Head icon="📍" title="Take your positions" text="Each team decides who plays right and who plays left. Receivers keep their side for the whole set." />
            {([0, 1] as Team[]).map((t) => (
              <div key={t} className="rounded-2xl bg-white p-2 shadow-md ring-1 ring-slate-200">
                <div className="flex items-center gap-2 px-1 pb-1">
                  <span className="h-3 w-3 rounded-full" style={{ background: COLORS[t] }} />
                  <span className="text-sm font-black">{T(t)}</span>
                  <button onClick={() => setRight((r) => r.map((x, i) => (i === t ? partner(x) : x)) as Pair)} className="ml-auto min-h-11 rounded-xl bg-slate-200 px-3 text-sm font-extrabold">⇄ swap sides</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[partner(right[t]), right[t]].map((p, i) => (
                    <div key={p} className={`rounded-xl p-2 text-center text-white ${BG[t]}`}>
                      <div className="text-[10px] font-extrabold tracking-wider opacity-80">{i ? "RIGHT" : "LEFT"}</div>
                      <div className="truncate text-base font-black">{names[p]}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="rounded-2xl bg-white p-3 shadow-md ring-1 ring-slate-200">
              <div className="mb-1 text-sm font-black">Who serves first? <span className="font-semibold text-slate-500">({T(serveTeam)})</span></div>
              <div className="grid grid-cols-2 gap-2">
                {[2 * serveTeam, 2 * serveTeam + 1].map((p) => (
                  <button key={p} onClick={() => setFirst(p)} aria-pressed={firstServer === p}
                    className={`min-h-12 rounded-xl text-base font-black ${firstServer === p ? "bg-ball ring-2 ring-ink" : "bg-slate-100"}`}>🎾 {names[p]}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-3 pt-1">
        {stage === "names" && <Next onClick={() => go("spin")}>Next: the spin →</Next>}
        {stage === "positions" && <Next onClick={begin}>Start match →</Next>}
      </div>
    </div>
  );
}

const Next = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button onClick={onClick} className="min-h-14 w-full rounded-2xl bg-ink text-lg font-black text-ball shadow-xl">{children}</button>
);

const Head = ({ icon, title, text }: { icon: string; title: string; text: ReactNode }) => (
  <div className="flex items-start gap-3">
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ball text-2xl shadow-inner">{icon}</span>
    <div>
      <h2 className="text-2xl font-black leading-tight">{title}</h2>
      <p className="text-sm font-medium text-slate-600">{text}</p>
    </div>
  </div>
);
