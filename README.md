# HYPOTECHA

**On-chain encumbrance enforcement layer for tokenized assets.**

Hypotheca records and enforces encumbrances — partial claims or collateral on an asset's value — to prevent **double-pledging**, the situation where a single asset is pledged for more than it is worth to more than one party.

Built for the ETHGlobal Hedera Bounty Track *"Tokenization of Anything"*.

---

## Problem

Tokenization removes the friction of asset ownership, but it also removes the guardrails. Without a shared source of truth, the same tokenized asset can be pledged as collateral to multiple lenders simultaneously, and no single party sees the full picture until a default happens.

**Hypotheca solves this by making the available (unencumbered) balance of any asset a first-class, queryable, and enforceable on-chain fact.**

---

## What It Does

- **Create claims** — a lender records a claim against a portion of an obligor's asset balance.
- **Prevent over-pledging** — the protocol rejects any claim that would push total encumbrance beyond what the obligor actually holds.
- **Release claims** — a claim is released, restoring the obligor's available balance.
- **Default management** — an admin can mark a claim as defaulted.
- **Full audit trail** — every claim lifecycle event is recorded on-chain and queryable.

---

## Architecture

A **standalone external Diamond Facet** (EIP-2535) — deliberately *not* a fork of the ATS monorepo. Hypotheca adds a single logic layer on top of existing Asset Tokenization Studio tokens via `@hashgraph/asset-tokenization-sdk`, rather than taking ownership of the tokens themselves.

```
HYPOTECHA
├── apps/
│   └── web/                 # React dashboard (Vite + TailwindCSS)
├── packages/                # (planned)
│   ├── contracts/           # EncumbranceFacet — standalone Diamond
│   └── sdk/                 # TypeScript SDK wrapper over ATS SDK
├── scripts/                 # (planned) deploy & demo tooling
└── test/                    # (planned) integration tests
```

### On-Chain Design

The core contract, `EncumbranceFacet.sol`, uses a namespaced storage layout (ERC-7201) and exposes a carefully scoped surface.

| Function | Access | Purpose |
| --- | --- | --- |
| `initialize()` | Admin | One-time initialization |
| `createClaim(token, obligor, claimant, amount)` | Verified participant | Record a claim against available balance |
| `releaseClaim(claimId)` | Claimant / Admin | Release a claim, restore available balance |
| `defaultClaim(claimId)` | Admin | Mark a claim as defaulted |
| `getAvailableBalance(token, obligor)` | View | Remaining encumberable balance |
| `getActiveClaims(token, obligor)` | View | Active claims on an asset |
| `getTotalHeld(token, obligor)` | View | Total encumbered value |
| `getClaimHistory(token, obligor)` | View | Full audit history |

The guard check that prevents over-pledging enforces the invariant `balance >= totalHeld + amount` before any claim is accepted.

---

## Project Status

> **Note:** This reflects the live state of the repository as of **2026-08-26**.

### Done

- **Frontend dashboard** — fully built (React 18 + Vite + TailwindCSS v4).
  - 6 pages: Landing, Dashboard, Assets, Claims, CreateClaim, History.
  - 7 components: Sidebar, Header, KPICard, EncumbranceBar, ClaimsTable, EventLog, RejectionModal.
  - Landing page with a complete animated design system (mesh gradients, marquee, glassmorphism, scroll-triggered reveals).
  - Production build passes (`npm run build`).
  - Static preview server (`server.cjs`) serving on port `4173`.

### In Progress

- Frontend-to-contract wiring (currently all mock data in `src/data/mock.ts`).

### Not Started

- `EncumbranceFacet.sol` smart contract.
- TypeScript SDK wrapper (`@hypotheca/sdk`).
- Wallet integration (HashPack / WalletConnect).
- Mirror Node event listener.
- Tests and deployment scripts.

---

## Getting Started

### Prerequisites

- Node.js 20+
- Package manager of your choice (`npm`, `pnpm`, `bun`)

### Run the Frontend Dashboard

```bash
cd apps/web
npm install
npm run dev
```

Visit `http://localhost:5173`.

### Build for Production

```bash
cd apps/web
npm run build
```

### Serve the Production Build

```bash
node server.cjs
```

Serves the static build at `http://localhost:4173`.

---

## Roadmap

1. **Smart contracts** — implement and test `EncumbranceFacet.sol`.
2. **Deployment** — deploy to Hedera testnet and verify on HashScan.
3. **SDK** — ship `@hypotheca/sdk` wrapping the ATS SDK with encumbrance methods.
4. **Wallet & Mirror Node** — connect the dashboard to real contracts and stream live events.
5. **End-to-end** — demo flow: issue → pledge → reject over-pledge → repay → release.
6. **Submission package** — demo video, docs, and ETHGlobal deliverable checklist.

---

## Testing Strategy

- **Smart contracts** — Hardhat + Mocha/Chai, covering claim lifecycle, over-pledge boundaries, access control, and event emission.
- **SDK** — unit tests for wrapper methods plus integration tests against Hedera testnet.
- **Frontend** — Vitest + React Testing Library for components, Playwright for E2E flows.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Smart contracts | Solidity, Hardhat, EIP-2535 Diamond facets, ERC-7201 storage |
| SDK | TypeScript, `@hashgraph/asset-tokenization-sdk`, `ethers` v6 |
| Frontend | React 18, Vite, TypeScript, TailwindCSS, Framer Motion, tsparticles, lottie-react |
| Chain | Hedera testnet |

---

## Key References

- [Asset Tokenization Studio](https://github.com/hashgraph/asset-tokenization-studio)
- [ATS SDK on npm](https://www.npmjs.com/package/@hashgraph/asset-tokenization-sdk)
- [Hedera Documentation](https://docs.hedera.com/)
- [Hedera Testnet RPC](https://testnet.hashio.io/api)
- [Hedera Mirror Node (testnet)](https://testnet.mirrornode.hedera.com/api/v1/)
- [HashScan (testnet)](https://hashscan.io/testnet/)

---

## License

Proprietary — work in progress for ETHGlobal. © 2026 Hypotheca.
