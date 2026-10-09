import { curServer, other, partner, serveSide, teamOf, type Match, type Side, type Team } from "@/lib/match";

export const COLORS = ["#1d4ed8", "#ea580c"]; // team 0 blue, team 1 orange

export default function Court({ m }: { m: Match }) {
  const side = serveSide(m);
  const server = curServer(m);
  const st = teamOf(server);
  const rt = other(st);
  const isBottom = (t: Team) => t !== m.top;
  // A team's own right-hand side is screen-right at the bottom, screen-left at the top.
  const xOf = (t: Team, s: Side) => (isBottom(t) === (s === "R") ? 75 : 25);
  const flip = (s: Side): Side => (s === "R" ? "L" : "R");
  const base = (t: Team) => (isBottom(t) ? 184 : 16);
  const net = (t: Team) => (isBottom(t) ? 122 : 78);

  const receiver = side === "R" ? m.right[rt] : partner(m.right[rt]);
  const pos: Record<number, { x: number; y: number }> = {
    [server]: { x: xOf(st, side), y: base(st) },
    [partner(server)]: { x: xOf(st, flip(side)), y: net(st) },
    [receiver]: { x: xOf(rt, side), y: isBottom(rt) ? 170 : 30 },
    [partner(receiver)]: { x: xOf(rt, flip(side)), y: net(rt) },
  };
  const boxX = xOf(rt, side) < 50 ? 0 : 50;
  const boxY = isBottom(rt) ? 100 : 30.5;
  const sp = pos[server];
  const rp = pos[receiver];

  return (
    <svg viewBox="-10 -6 120 212" className="h-full w-full drop-shadow-lg" role="img" aria-label="Court positions">
      <defs>
        <linearGradient id="court" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e40af" />
          <stop offset="0.5" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e40af" />
        </linearGradient>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 10 5 0 10z" fill="#d9f100" />
        </marker>
      </defs>
      <rect x="-10" y="-6" width="120" height="212" rx="6" fill="#15803d" />
      <rect x="-3" y="-3" width="106" height="206" rx="3" fill="#bfdbfe" opacity="0.5" />
      <rect x="0" y="0" width="100" height="200" fill="url(#court)" />
      <rect x={boxX} y={boxY} width="50" height="69.5" fill="#d9f100" opacity="0.4" className="pulse" />
      <g stroke="#fff" strokeWidth="1.1" fill="none">
        <rect x="0" y="0" width="100" height="200" />
        <line x1="0" y1="30.5" x2="100" y2="30.5" />
        <line x1="0" y1="169.5" x2="100" y2="169.5" />
        <line x1="50" y1="30.5" x2="50" y2="169.5" />
      </g>
      <rect x="-3" y="98.6" width="106" height="2.8" rx="1" fill="#0b1d3a" />
      <line x1="-3" y1="98.6" x2="103" y2="98.6" stroke="#fff" strokeWidth="0.6" strokeDasharray="2 1.5" />
      <line x1={sp.x} y1={sp.y} x2={rp.x} y2={rp.y} stroke="#d9f100" strokeWidth="1.6" strokeDasharray="3 3" markerEnd="url(#arrow)" opacity="0.95" />
      {[0, 1, 2, 3].map((p) => {
        const isS = p === server, isR = p === receiver;
        const w = Math.max(14, m.cfg.names[p].length * 3.7 + 6);
        return (
          <g key={p} style={{ transform: `translate(${pos[p].x}px, ${pos[p].y}px)`, transition: "transform 600ms cubic-bezier(.4,0,.2,1)" }}>
            <ellipse cy="9" rx="8" ry="2.5" fill="#000" opacity="0.25" />
            <circle r="9" fill={COLORS[teamOf(p)]} stroke={isS ? "#d9f100" : "#fff"} strokeWidth={isS || isR ? 2.6 : 1.4} />
            <text textAnchor="middle" dy="2.6" fontSize="7.5" fontWeight="800" fill="#fff">{m.cfg.names[p].slice(0, 2).toUpperCase()}</text>
            <rect x={-w / 2} y="12" width={w} height="8" rx="4" fill="#0b1d3a" opacity="0.85" />
            <text y="17.8" textAnchor="middle" fontSize="5" fontWeight="700" fill="#fff">{m.cfg.names[p]}</text>
            {isS && <circle cx="9" cy="-8" r="3.6" fill="#d9f100" stroke="#0b1d3a" strokeWidth="0.8" />}
            {isR && <text y="-12" textAnchor="middle" fontSize="5" fontWeight="800" fill="#fff" stroke="#0b1d3a" strokeWidth="1.2" paintOrder="stroke">RECEIVE</text>}
          </g>
        );
      })}
    </svg>
  );
}
