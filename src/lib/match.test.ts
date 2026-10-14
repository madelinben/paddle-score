import assert from "node:assert/strict";
import { test } from "node:test";
import { curServer, goldenPoint, pickGoldenSide, point, receiverFor, serveSide, serveStep, start, type Match, type Team } from "./match.ts";

const cfg = (golden: boolean) => ({ golden, names: ["a1", "a2", "b1", "b2"] });
const ok = (m: Match): Match => ({ ...m, steps: [] }); // user confirms every prompt
const p = (m: Match, t: Team) => point(ok(m), t);
const game = (m: Match, t: Team) => { for (let i = 0; i < 4; i++) m = p(m, t); return m; };

test("prompts block scoring until confirmed", () => {
  const m = start(cfg(true), 0, [0, 2]);
  assert.equal(m.steps.length, 1); // "play ball" serve prompt
  assert.equal(point(m, 0), m);
  assert.deepEqual(p(m, 0).pts, [1, 0]);
});

test("golden point: receivers pick side, next point wins", () => {
  let m = start(cfg(true), 0, [0, 2]);
  for (const t of [0, 0, 0, 1, 1, 1] as Team[]) m = p(m, t);
  assert.ok(goldenPoint(m));
  assert.equal(m.steps.at(-1)?.pick, "golden");
  m = pickGoldenSide(ok(m), "L");
  assert.equal(serveSide(m), "L");
  assert.equal(receiverFor(m, "L"), 3); // b2 = partner of right player b1
  m = p(m, 1);
  assert.deepEqual(m.games, [0, 1]);
  assert.equal(m.gpSide, null);
});

test("advantage needs 2 clear points", () => {
  let m = start(cfg(false), 0, [0, 2]);
  for (let i = 0; i < 3; i++) m = p(p(m, 0), 1);
  m = p(m, 0);
  m = p(p(m, 1), 1);
  assert.deepEqual(m.games, [0, 0]);
  m = p(m, 1);
  assert.deepEqual(m.games, [0, 1]);
});

test("server rotates, ends swap on odd games, side alternates, prompts queued in order", () => {
  let m = start(cfg(true), 0, [0, 2]);
  assert.equal(serveSide(m), "R");
  m = p(m, 0);
  assert.equal(serveSide(m), "L");
  for (let i = 0; i < 3; i++) m = p(m, 0); // 4th point wins the game
  assert.equal(m.games[0], 1);
  assert.deepEqual(m.steps.map((s) => s.title), ["Game to a1 & a2", "Swap ends", ""]);
  assert.equal(m.top, 0);
  assert.equal(m.server, 2);
  assert.match(serveStep(m).lines[0], /^b1 serves from the RIGHT/);
  m = game(m, 0);
  assert.equal(m.server, 1);
  assert.equal(m.top, 0); // even -> no swap
  m = game(m, 0);
  assert.equal(m.server, 3);
});

test("6-6 tie-break, rotation, swap every 6, set + match win", () => {
  let m = start(cfg(true), 0, [0, 2]);
  for (let i = 0; i < 5; i++) { m = game(m, 0); m = game(m, 1); }
  m = game(m, 0);
  m = game(m, 1);
  assert.equal(m.tb, true);
  assert.ok(m.steps.some((s) => s.title.startsWith("Tie-break")));
  const first = curServer(m);
  m = p(m, 0);
  assert.notEqual(curServer(m), first);
  assert.equal(m.steps[0].pick, "serve"); // server change prompt
  for (let i = 0; i < 4; i++) m = p(m, 0); // 5-0
  const topBefore = m.top;
  m = p(m, 1); // 5-1 = 6 points
  assert.notEqual(m.top, topBefore);
  assert.equal(m.steps[0].title, "Swap ends");
  m = p(p(m, 0), 0); // 7-1
  assert.deepEqual(m.sets[0], [7, 6]);
  assert.ok(m.steps.some((s) => s.pick === "positions"));
  for (let i = 0; i < 6; i++) m = game(m, 0);
  assert.equal(m.winner, 0);
  assert.equal(m.steps.at(-1)?.icon, "🏆");
});
