# Hypotheca Web Dashboard

Frontend for **Hypotheca**, the on-chain encumbrance enforcement layer for tokenized assets. This dashboard visualizes asset encumbrances, available balances, live claim events, and over-pledge rejections.

Built with **React 18 + Vite + TypeScript + TailwindCSS v4**.

---

## Features

- **Landing page** — full animated marketing site (mesh gradients, logo marquee, glassmorphism, scroll-reveal animations).
- **Dashboard** — KPI cards (total held, active claims, available balance) and a live event stream.
- **Assets** — list of tokenized assets with their encumbrance breakdown.
- **Claims** — full claims table (active / released / defaulted) with encumbrance bars.
- **Create Claim** — form to pledge a new claim against an asset.
- **History** — audit view of all claim lifecycle events.
- **Rejection modal** — highlights on-chain over-pledge rejections (the core demo moment).

> **Note:** All data is currently mock data (`src/data/mock.ts`). Contract and Mirror Node wiring is planned.

---

## Tech Stack

- **React 18** + **Vite**
- **TypeScript**
- **TailwindCSS v4**
- **Framer Motion** — animation
- **tsparticles** — particle backgrounds
- **lottie-react** — Lottie animations
- **lucide-react** / **@phosphor-icons/react** — icons
- **oxlint** — linting

---

## Getting Started

### Prerequisites

- Node.js 20+

### Install

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Serves with hot module replacement at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

Output is written to `dist/`.

### Lint

```bash
npm run lint
```

### Preview the Production Build

```bash
npm run preview
```

---

## Serving the Static Build

A minimal static server is included for hosting the built app on a fixed port:

```bash
node server.cjs
```

Serves `dist/` at `http://localhost:4173`. On Windows you can also run `start.bat`.

---

## Project Structure

```
apps/web
├── public/                 # Static assets (backgrounds, coins, audio)
├── src/
│   ├── assets/             # Images / svg assets
│   ├── components/         # UI components (Sidebar, Header, KPICard, ...)
│   ├── data/               # Mock data
│   ├── lib/                # Utilities & hooks (sound, counters, typing)
│   ├── pages/              # Route views (Dashboard, Claims, ...)
│   ├── App.tsx             # App shell & routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Design system & animations
├── server.cjs              # Static preview server
├── start.bat               # Windows start script
├── vite.config.ts
└── package.json
```

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview the production build |
