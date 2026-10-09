const CONTENT = {
  rules: [
    ["The Serve", "Underarm only. Let it bounce behind the service line, hit below the waist, aim diagonally. 2 attempts."],
    ["The Bounce", "Ball must bounce once on your side before hitting a wall/fence. If it hits the wall/fence before bouncing, it is out."],
    ["The Walls", "After a bounce, the ball can hit the glass/mesh. You can play it off the glass over the net."],
    ["Your Own Wall", "You can hit the ball against your own glass wall to bounce it over (not the mesh)."],
    ["Volleys", "Allowed anytime except on the return of serve."],
  ],
  flow: [
    ["The Spin", "Winner chooses to serve/receive, side of court, or gives choice to opponent."],
    ["During a Game", "One player serves the entire game. Server alternates right/left after every point. Receivers stay on their chosen side for the whole set."],
    ["After a Game", "Serve swaps to the opposing team (players alternate serving duties)."],
    ["Swapping Ends", "Teams swap sides of the court on odd total games (Game 1, 3, 5)."],
  ],
  scoring: [
    ["Points", "Love (0) > 15 > 30 > 40 > Game."],
    ["Deuce (40-40)", "Golden Point (next point wins) OR Advantage (win by 2). Pick in match setup."],
    ["Sets", "First to 6 games (must win by 2)."],
    ["Tie-break", "Played at 6-6. First to 7 points (must win by 2)."],
    ["Match", "Best of 3 sets."],
  ],
};

export default function Reference({ tab }: { tab: keyof typeof CONTENT }) {
  return (
    <div className="h-full space-y-3 overflow-y-auto p-3">
      {CONTENT[tab].map(([h, b]) => (
        <section key={h} className="rounded-xl bg-white p-4 shadow">
          <h2 className="text-xl font-black">{h}</h2>
          <p className="mt-1 text-lg leading-snug text-gray-800">{b}</p>
        </section>
      ))}
    </div>
  );
}
