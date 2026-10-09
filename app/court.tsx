import { curServer, other, partner, serveSide, teamOf, type Match, type Side, type Team } from "@/lib/match";

export const COLORS = ["#1d4ed8", "#c2410c"]; // team 0 blue, team 1 orange

export default function Court({ m }: { m: Match }) {
  const side = serveSide(m);
  const server = curServer(m);
  const st = teamOf(server);
  const rt = other(st);
  const isBottom = (t: Team) => t !== m.top;
  // A team's own right-hand side is screen-right at the bottom, screen-left at the top.
  const xOf = (t: Team, s: Side) => (isBottom(t) === (s === "R") ? 75 : 25);
  const flip = (s: Side): Side => (s === "R" ? "L" : "R");
  const base = (t: Team) => (isBottom(t) ? 190 : 10);
  const net = (t: Team) => (isBottom(t) ? 122 : 78);

  const receiver = side === "R" ? m.right[rt] : partner(m.right[rt]);
  const pos: Record<number, { x: number; y: number }> = {
    [server]: { x: xOf(st, side), y: base(st) },
    [partner(server)]: { x: xOf(st, flip(side)), y: net(st) },
    [receiver]: { x: xOf(rt, side), y: isBottom(rt) ? 178 : 22 },
    [partner(receiver)]: { x: xOf(rt, flip(side)), y: net(rt) },
  };
  const boxX = xOf(rt, side) < 50 ? 0 : 50;
  const boxY = isBottom(rt) ? 100 : 30.5;

  return (
    <svg viewBox="-8 -4 116 208" className="h-full w-full" role="img" aria-label="Court positions">
      <rect x="0" y="0" width="100" height="200" fill="#2563eb" />
      <rect x={boxX} y={boxY} width="50" height="69.5" fill="#fde047" opacity="0.55" />
      <g stroke="#fff" strokeWidth="1.2" fill="none">
        <rect x="0" y="0" width="100" height="200" />
        <line x1="0" y1="30.5" x2="100" y2="30.5" />
        <line x1="0" y1="169.5" x2="100" y2="169.5" />
        <line x1="50" y1="30.5" x2="50" y2="169.5" />
      </g>
      <line x1="-4" y1="100" x2="104" y2="100" stroke="#111827" strokeWidth="2.5" />
      {[0, 1, 2, 3].map((p) => (
        <g key={p} style={{ transform: `translate(${pos[p].x}px, ${pos[p].y}px)`, transition: "transform 500ms ease" }}>
          <circle r="9" fill={COLORS[teamOf(p)]} stroke={p === server ? "#fde047" : p === receiver ? "#fff" : "#111827"} strokeWidth={p === server || p === receiver ? 2.5 : 1} />
          <text textAnchor="middle" dy="2" fontSize="7" fontWeight="700" fill="#fff">{m.cfg.names[p].slice(0, 2).toUpperCase()}</text>
          <text y="16" textAnchor="middle" fontSize="6" fontWeight="700" fill="#fff" stroke="#111827" strokeWidth="1.6" paintOrder="stroke">{m.cfg.names[p]}</text>
          {p === server && <circle cx="9" cy="-8" r="3.5" fill="#d9f100" stroke="#111827" strokeWidth="0.8" />}
        </g>
      ))}
    </svg>
  );
}
