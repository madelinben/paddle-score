import { expect, test, type Page } from "@playwright/test";

// Defaults: Team A = Alex & Sam (near/bottom), Team B = Jo & Kim. Jo plays right, Kim left.
const pointBtn = (page: Page, team: "A" | "B") =>
  page.getByRole("button", { name: team === "A" ? /\+ Point.*Alex/ : /\+ Point.*Jo/ });
const dialog = (page: Page) => page.getByRole("dialog");
const confirm = (page: Page, name: RegExp) => dialog(page).getByRole("button", { name }).click();

async function startMatch(page: Page) {
  await page.goto("./");
  await page.getByRole("button", { name: /Next: the spin/ }).click();
  await page.getByRole("button", { name: /Alex & Sam/ }).click(); // won the spin
  await page.getByRole("button", { name: /Serve first/ }).click();
  await page.getByRole("button", { name: /Far end/ }).click(); // Jo & Kim pick far end
  await page.getByRole("button", { name: /Start match/ }).click();
}
async function ready(page: Page) {
  await confirm(page, /Ready: play/);
  await expect(dialog(page)).toBeHidden();
}
const score = async (page: Page, team: "A" | "B", n = 1) => {
  for (let i = 0; i < n; i++) await pointBtn(page, team).click();
};

test("layout is locked to the viewport and tabs show reference content", async ({ page }) => {
  await page.goto("./");
  const [sh, ch, sw, cw] = await page.evaluate(() => [
    document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth,
  ]);
  expect(sh).toBeLessThanOrEqual(ch);
  expect(sw).toBeLessThanOrEqual(cw);
  await page.getByRole("button", { name: "Rules" }).click();
  await expect(page.getByRole("heading", { name: "The Serve" })).toBeVisible();
  await page.getByRole("button", { name: "Flow" }).click();
  await expect(page.getByRole("heading", { name: /Swapping Ends/ })).toBeVisible();
  await page.getByRole("button", { name: "Scoring" }).click();
  await expect(page.getByText("Golden Point", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Match" }).click();
  await expect(page.getByRole("heading", { name: "Who's playing?" })).toBeVisible();
});

test("wizard: spin, choices and positions lead to correct first-serve prompt", async ({ page }) => {
  await startMatch(page);
  await expect(dialog(page)).toContainText("Set 1 · Game 1");
  await expect(dialog(page)).toContainText("Alex serves from the RIGHT");
  await expect(dialog(page)).toContainText("Jo receives, standing diagonally opposite");
  await expect(dialog(page)).toContainText("Sam and Kim wait near the net");
  await ready(page);
});

test("wizard: receive-first and back navigation", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Next: the spin/ }).click();
  await page.getByRole("button", { name: /Jo & Kim/ }).click();
  await page.getByRole("button", { name: /Receive first/ }).click(); // Jo & Kim receive -> Alex & Sam serve
  await page.getByRole("button", { name: /Near end/ }).click();
  await page.getByRole("button", { name: /← Back/ }).click();
  await expect(page.getByRole("heading", { name: "Pick a court end" })).toBeVisible();
  await page.getByRole("button", { name: /Near end/ }).click();
  await page.getByRole("button", { name: /Start match/ }).click();
  await expect(dialog(page)).toContainText("Alex serves from the RIGHT"); // right player of serving team
});

test("choosing the court end first makes the other team pick serve/receive", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Next: the spin/ }).click();
  await page.getByRole("button", { name: /Alex & Sam/ }).click();
  await page.getByRole("button", { name: /Choose the court end/ }).click();
  await page.getByRole("button", { name: /Near end/ }).click();
  await expect(page.getByRole("heading", { name: "Serve or receive?" })).toBeVisible();
  await page.getByRole("button", { name: /Serve first/ }).click();
  await page.getByRole("button", { name: /Start match/ }).click();
  await expect(dialog(page)).toContainText("Jo serves from the RIGHT");
});

test("points alternate serve side and undo restores state", async ({ page }) => {
  await startMatch(page);
  await ready(page);
  await score(page, "A");
  await expect(page.getByText(/Point to Alex & Sam · 15–0\. Alex serves from the LEFT/)).toBeVisible();
  await score(page, "B");
  await expect(page.getByText(/15–15\. Alex serves from the RIGHT/)).toBeVisible();
  await page.getByRole("button", { name: /Undo/ }).click();
  await expect(page.getByText(/15–0\. Alex serves from the LEFT/)).toBeVisible();
});

test("game end: result, swap ends, then next server prompt - each needs a tap", async ({ page }) => {
  await startMatch(page);
  await ready(page);
  await score(page, "A", 4);
  await expect(dialog(page)).toContainText("Game to Alex & Sam");
  await expect(dialog(page)).toContainText("Games: 1–0");
  await expect(pointBtn(page, "A")).toBeDisabled();
  await confirm(page, /Next/);
  await expect(dialog(page)).toContainText("Swap ends"); // 1 game played = odd
  await confirm(page, /Next/);
  await expect(dialog(page)).toContainText("Set 1 · Game 2");
  await expect(dialog(page)).toContainText("Jo serves from the RIGHT"); // serve passes to other team
  await ready(page);
  await score(page, "B", 4);
  await confirm(page, /Next/); // game result; 2 games = even, no swap prompt
  await expect(dialog(page)).toContainText("Set 1 · Game 3");
  await expect(dialog(page)).toContainText("Sam serves from the RIGHT"); // partner serves next for team A
});

test("golden point: receivers choose side and next point wins", async ({ page }) => {
  await startMatch(page);
  await ready(page);
  for (const t of ["A", "A", "A", "B", "B", "B"] as const) await score(page, t);
  await expect(dialog(page)).toContainText("Golden point!");
  await dialog(page).getByRole("button", { name: /Kim receives/ }).click();
  await expect(page.getByText(/Alex serves from the LEFT to Kim/)).toBeVisible();
  await score(page, "B");
  await expect(dialog(page)).toContainText("Game to Jo & Kim");
});

test("advantage mode has no golden prompt", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("switch", { name: /Golden point/ }).click();
  await page.getByRole("button", { name: /Next: the spin/ }).click();
  await page.getByRole("button", { name: /Alex & Sam/ }).click();
  await page.getByRole("button", { name: /Serve first/ }).click();
  await page.getByRole("button", { name: /Far end/ }).click();
  await page.getByRole("button", { name: /Start match/ }).click();
  await ready(page);
  for (const t of ["A", "A", "A", "B", "B", "B", "A"] as const) await score(page, t);
  await expect(dialog(page)).toBeHidden();
  await expect(page.getByText(/AD–40/)).toBeVisible();
  await score(page, "B");
  await expect(page.getByText(/40–40/)).toBeVisible();
});

test("full match: team A wins two sets, prompts at set boundary, then new match", async ({ page }) => {
  test.setTimeout(90_000);
  await startMatch(page);
  const seen: string[] = [];
  for (let i = 0; i < 400; i++) {
    const open = await dialog(page).isVisible();
    if (!open && (await page.getByRole("button", { name: /New match →/ }).isVisible())) break;
    if (open) {
      const title = (await dialog(page).getByRole("heading").innerText()).trim();
      if (seen.at(-1) !== title) seen.push(title);
      await dialog(page).getByRole("button", { name: /receives|Confirm positions|Ready|Got it|Next/ }).first().click();
    } else {
      await pointBtn(page, "A").click();
    }
  }
  expect(seen).toContain("Set to Alex & Sam");
  expect(seen).toContain("New set: choose positions");
  expect(seen.at(-1)).toBe("Alex & Sam win the match!");
  await expect(page.getByText(/win the match!/).first()).toBeVisible();
  await page.getByRole("button", { name: /New match →/ }).click();
  await expect(page.getByRole("heading", { name: "Who's playing?" })).toBeVisible();
});

test("names persist in localStorage but a match does not survive reload", async ({ page }) => {
  await page.goto("./");
  await page.getByLabel("Player 1 name").fill("Zed");
  await page.getByRole("button", { name: /Next: the spin/ }).click();
  await page.getByRole("button", { name: /Zed & Sam/ }).click();
  await page.getByRole("button", { name: /Serve first/ }).click();
  await page.getByRole("button", { name: /Far end/ }).click();
  await page.getByRole("button", { name: /Start match/ }).click();
  await ready(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Who's playing?" })).toBeVisible();
  await expect(page.getByLabel("Player 1 name")).toHaveValue("Zed");
});

// Confirm every open prompt, recording titles.
async function drain(page: Page, seen: string[]) {
  await dialog(page).waitFor({ timeout: 400 }).catch(() => {}); // prompt may not appear for this point
  while (await dialog(page).isVisible()) {
    seen.push((await dialog(page).getByRole("heading").innerText()).trim());
    await dialog(page).getByRole("button", { name: /Confirm positions|Ready|Got it|Next/ }).first().click();
  }
}

test("tie-break at 6-6: rules prompt, server rotation, swap ends every 6 points, set to 7-6", async ({ page }) => {
  test.setTimeout(60_000);
  const seen: string[] = [];
  await startMatch(page);
  await drain(page, seen);
  for (let g = 0; g < 6; g++) {
    for (const t of ["A", "B"] as const) {
      await score(page, t, 4);
      await drain(page, seen);
    }
  }
  expect(seen).toContain("Tie-break at 6-6");
  expect(seen.at(-1)).toBe("Tie-break · point 1");
  seen.length = 0;
  for (const t of ["A", "B", "A", "B", "A", "B"] as const) {
    await score(page, t);
    await drain(page, seen);
  }
  // server changes after point 1, 3, 5; ends swap after 6 points
  expect(seen).toEqual(["Tie-break · point 2", "Tie-break · point 4", "Tie-break · point 6", "Swap ends"]);
  seen.length = 0;
  for (let i = 0; i < 4; i++) { // 7-3, with server-change prompts in between
    await score(page, "A");
    if (i < 3) await drain(page, seen);
  }
  await expect(dialog(page)).toContainText("Tie-break won 7–3");
  await drain(page, seen);
  expect(seen).toContain("Set to Alex & Sam");
});

const VIEWPORTS = [
  ["small phone", 320, 568],
  ["phone", 390, 780],
  ["landscape phone", 667, 375],
  ["tablet", 768, 1024],
  ["laptop", 1280, 720],
  ["desktop", 1920, 1080],
] as const;

for (const [name, width, height] of VIEWPORTS) {
  test(`no page scroll or overflow on ${name} (${width}x${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    // Nothing the user needs may sit outside the viewport, and the page itself never scrolls.
    // Long wizard/reference content may scroll inside its own card (allowed); everything else must fit.
    const check = async (where: string, selectors: string[]) => {
      await page.waitForTimeout(450); // let the prompt slide-in animation finish
      const bad = await page.evaluate((sels) => {
        const de = document.documentElement;
        const out: string[] = [];
        if (de.scrollWidth > innerWidth) out.push(`page scrollWidth ${de.scrollWidth}`);
        if (de.scrollHeight > innerHeight) out.push(`page scrollHeight ${de.scrollHeight}`);
        // "@content x": must sit inside the content area, i.e. not hidden under the header or nav.
        const area = document.querySelector("main > div")!.getBoundingClientRect();
        for (const raw of sels) {
          const inContent = raw.startsWith("@content ");
          const sel = inContent ? raw.slice(9) : raw;
          document.querySelectorAll(sel).forEach((el) => {
            const r = el.getBoundingClientRect();
            if (inContent && r.width && (r.top < area.top - 0.5 || r.bottom > area.bottom + 0.5 || r.left < area.left - 0.5 || r.right > area.right + 0.5)) {
              out.push(`${sel} outside content area: ${Math.round(r.top)}-${Math.round(r.bottom)} vs ${Math.round(area.top)}-${Math.round(area.bottom)}`);
            }
            if (!r.width || el.closest(".overflow-y-auto") !== null) return; // hidden or inside an internal scroller
            if (r.left < -0.5 || r.top < -0.5 || r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5) {
              out.push(`${sel} "${(el.textContent ?? "").slice(0, 20)}" at ${Math.round(r.left)},${Math.round(r.top)}-${Math.round(r.right)},${Math.round(r.bottom)}`);
            }
          });
        }
        return out;
      }, selectors);
      expect(bad, where).toEqual([]);
    };

    await page.goto("./");
    await check("wizard names", ["header", "nav", "nav button", "input", "button[role=switch]"]);
    await page.getByRole("button", { name: /Next: the spin/ }).click();
    await check("wizard spin", ["nav", "main button"]);
    await page.getByRole("button", { name: /Alex & Sam/ }).click();
    await page.getByRole("button", { name: /Serve first/ }).click();
    await page.getByRole("button", { name: /Far end/ }).click();
    await check("wizard positions", ["nav", "main button"]);
    await page.getByRole("button", { name: /Start match/ }).click();
    await check("serve prompt", ["[role=dialog] > div", "[role=dialog] button"]);
    await ready(page);
    await check("match", ["header", "nav", "@content svg[role=img]", "@content main > div button", "@content main > div p"]);
    await score(page, "A", 4);
    await check("game-end prompt", ["[role=dialog] > div", "[role=dialog] button"]);
    await drain(page, []);
    for (const tab of ["Rules", "Flow", "Scoring"]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      await check(`${tab} tab`, ["header", "nav", "nav button"]);
    }
  });
}
