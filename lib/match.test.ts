import assert from "node:assert/strict";
import { test } from "node:test";
import { curServer, point, serveSide, start, type Match, type Team } from "./match.ts";

const cfg = (golden: boolean) => ({ golden, names: ["a1", "a2", "b1", "b2"] });
const win = (m: Match, t: Team, n = 1) => { for (let i = 0; i < n * 4; i++) m = point(m, t); return m; };

test("golden point ends game at 40-40", () => {
  let m = start(cfg(true), 0, [0, 2]);
  m = point(point(point(m, 0), 0), 0);
  m = point(point(point(m, 1), 1), 1);
  assert.deepEqual(m.pts, [3, 3]);
  m = point(m, 1);
  assert.deepEqual(m.games, [0, 1]);
});

test("advantage needs 2 clear points", () => {
  let m = start(cfg(false), 0, [0, 2]);
  for (let i = 0; i < 3; i++) m = point(point(m, 0), 1);
  m = point(m, 0);
  assert.deepEqual(m.games, [0, 0]);
  m = point(point(m, 1), 1);
  assert.deepEqual(m.games, [0, 0]);
  m = point(m, 1);
  assert.deepEqual(m.games, [0, 1]);
});

test("server rotates, ends swap on odd games, side alternates", () => {
  let m = start(cfg(true), 0, [0, 2]);
  assert.equal(serveSide(m), "R");
  m = point(m, 0);
  assert.equal(serveSide(m), "L");
  m = win(m, 0); // game 1 (3 pts + 1 already; golden)
  assert.equal(m.games[0] + m.games[1], 1);
  assert.equal(m.top, 0); // swapped
  assert.equal(m.server, 2); // team B serves
  m = win(m, 0);
  assert.equal(m.server, 1); // partner of a1
  assert.equal(m.top, 0); // even -> no swap
  m = win(m, 0);
  assert.equal(m.server, 3);
});

test("6-6 tie-break, rotation, and match win", () => {
  let m = start(cfg(true), 0, [0, 2]);
  for (let i = 0; i < 5; i++) { m = win(m, 0); m = win(m, 1); }
  m = win(m, 0); m = win(m, 1);
  assert.equal(m.tb, true);
  const first = curServer(m);
  m = point(m, 0);
  assert.notEqual(curServer(m), first);
  for (let i = 0; i < 6; i++) m = point(m, 0); // 7-0
  assert.deepEqual(m.sets[0], [7, 6]);
  m = win(m, 0, 6); // win set 2 (6-0)
  assert.equal(m.winner, 0);
});
