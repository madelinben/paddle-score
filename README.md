# Padel Quick Start

On-court padel scoring (golden point, serve side/order tracking), rules and match flow. Mobile-first.

Two ways this repo ships, from the same `src/`:

| Target | How |
|---|---|
| **GitHub Pages** (`madelinben.github.io/paddle-score/`) | `pnpm build:demo` builds `demo/` into `docs/` (Pages source: `main` / `/docs`) |
| **get-out-there** (Cloudflare) | imported as workspace package `@get-out-there/tool-paddle` (`PaddleApp`, `./styles.css`) |

```bash
pnpm install
pnpm dev          # demo at http://localhost:3100/paddle-score/
pnpm test         # logic unit tests
pnpm test:e2e     # Playwright
pnpm build:demo   # static site -> docs/
```

Package rules: no router/auth/app imports; styles are `pd-` prefixed; host must `@source` this folder and import `./styles.css`.
