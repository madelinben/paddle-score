import type { ReactNode } from "react";

type Tab = "rules" | "flow" | "scoring";

const Card = ({ icon, title, children }: { icon: string; title: string; children: ReactNode }) => (
  <section className="flex gap-3 rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-200">
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ball text-2xl shadow-inner">{icon}</span>
    <div className="min-w-0">
      <h2 className="text-xl font-black leading-tight">{title}</h2>
      <div className="mt-1 text-base font-medium leading-snug text-slate-700">{children}</div>
    </div>
  </section>
);

const Chip = ({ children, dark }: { children: ReactNode; dark?: boolean }) => (
  <span className={`rounded-xl px-3 py-1.5 text-lg font-black ${dark ? "bg-ink text-ball" : "bg-slate-100"}`}>{children}</span>
);

const Stat = ({ big, label, sub }: { big: string; label: string; sub: string }) => (
  <section className="rounded-2xl bg-white p-3 text-center shadow-md ring-1 ring-slate-200">
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ink text-3xl font-black text-ball">{big}</div>
    <h2 className="mt-1.5 text-base font-black leading-tight">{label}</h2>
    <p className="text-xs font-semibold text-slate-600">{sub}</p>
  </section>
);

const FLOW: [string, string, string[]][] = [
  ["🪙", "The Spin", ["Winner chooses to serve/receive, side of court, or gives the choice to the opponent."]],
  ["🎾", "During a Game", ["One player serves the entire game.", "Server alternates right/left after every point.", "Receivers stay on their chosen side for the whole set."]],
  ["🔁", "After a Game", ["Serve swaps to the opposing team (players alternate serving duties)."]],
  ["↔️", "Swapping Ends", ["Teams swap sides of the court on odd total games (Game 1, 3, 5)."]],
];

export default function Reference({ tab }: { tab: Tab }) {
  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-2xl space-y-3 p-3">
      {tab === "rules" && (
        <>
          <Card icon="🎾" title="The Serve">Underarm only. Let it bounce behind the service line, hit below the waist, aim diagonally. <b>2 attempts.</b></Card>
          <Card icon="⤵️" title="The Bounce">Ball must bounce once on your side before hitting a wall/fence. Wall/fence <i>before</i> the bounce = <b>out</b>.</Card>
          <Card icon="🧱" title="The Walls">After a bounce, the ball can hit the glass/mesh. You can play it off the glass over the net.</Card>
          <Card icon="🔄" title="Your Own Wall">You can hit the ball against your <i>own</i> glass wall to bounce it over (not the mesh).</Card>
          <Card icon="✋" title="Volleys">Allowed anytime <b>except</b> on the return of serve.</Card>
        </>
      )}
      {tab === "flow" && (
        <ol className="relative space-y-3 pl-1">
          <span className="absolute bottom-6 left-[27px] top-6 w-1 rounded bg-ink/15" />
          {FLOW.map(([icon, title, lines], i) => (
            <li key={title} className="relative flex gap-3">
              <span className="relative z-[1] grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-xl shadow-md ring-4 ring-[#eef2f7]">{icon}</span>
              <div className="flex-1 rounded-2xl bg-white p-3 shadow-md ring-1 ring-slate-200">
                <h2 className="text-lg font-black leading-tight"><span className="text-slate-400">{i + 1}.</span> {title}</h2>
                <ul className="mt-1 space-y-1 text-base font-medium leading-snug text-slate-700">
                  {lines.map((l) => <li key={l} className="flex gap-2"><span className="text-ink">•</span>{l}</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      )}
      {tab === "scoring" && (
        <>
          <section className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-200">
            <h2 className="text-xl font-black">Points</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Chip>0</Chip>›<Chip>15</Chip>›<Chip>30</Chip>›<Chip>40</Chip>›<Chip dark>Game</Chip>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-600">Love (0) → 15 → 30 → 40 → Game</p>
          </section>
          <section className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-200">
            <h2 className="text-xl font-black">Deuce <span className="text-slate-400">(40-40)</span></h2>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-ball p-3"><div className="text-2xl">⭐</div><b className="block">Golden Point</b><span className="text-sm font-semibold">Next point wins</span></div>
              <div className="rounded-xl bg-slate-100 p-3"><div className="text-2xl">➕</div><b className="block">Advantage</b><span className="text-sm font-semibold">Win by 2</span></div>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-600">Choose when you start a match.</p>
          </section>
          <div className="grid grid-cols-3 gap-2">
            <Stat big="6" label="Sets" sub="First to 6 games, win by 2" />
            <Stat big="7" label="Tie-break" sub="At 6-6. First to 7, win by 2" />
            <Stat big="3" label="Match" sub="Best of 3 sets" />
          </div>
        </>
      )}
    </div>
    </div>
  );
}
