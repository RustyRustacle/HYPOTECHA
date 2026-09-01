# HYPOTECHA

Hypotheca is an on-chain encumbrance enforcement layer for tokenized assets. It records and enforces partial claims or collateral against an asset's available balance so a single tokenized position cannot be pledged beyond its real value.

The project is designed for Hedera Asset Tokenization Studio (ATS) and is structured to support a complete RWA workflow: issuance, encumbrance creation, automated rejection of over-pledging, claim release, and historical auditability.

## Why Hypotheca exists

The core problem in tokenized finance is not ownership alone — it is enforceable collateral state. A token may be owned by one entity while also being silently pledged to multiple counterparties. Without a shared, queryable, and enforceable source of truth, double-pledging becomes a systemic risk.

Hypotheca solves this by making available balance a first-class on-chain fact:

- total balance of an asset
- total active encumbrances
- available balance available for new claims
- rejection of any request that exceeds residual capacity

This creates a clean enforcement layer for use cases such as repo financing, securities lending, trade finance, and collateral management.

## Product vision

Hypotheca provides:

- claim lifecycle tracking for tokenized collateral
- rejection of over-pledging at the contract level
- explicit encumbrance state across obligors and claimants
- transparent audit history for lenders, issuers, and regulators
- a real-time dashboard for issuance and collateral status monitoring

## Repository structure

```text
HYPOTECHA/
├── apps/
│   ├── api/                 # Express API layer for orchestration and integration
│   └── web/                # React + Vite landing page and dashboard
├── packages/
│   ├── contracts/          # Solidity + Hardhat smart contract package
│   └── sdk/                # TypeScript SDK for contract interaction
├── services/
│   └── indexer/            # Mirror Node / event indexing service scaffold
├── scripts/                # deployment and verification utilities
├── test/                   # integration and E2E test plans
├── .env.example            # environment variables template
├── .gitignore
├── package.json            # workspaces and root commands
├── README.md
└── LICENSE                 # if added later
```

## System architecture

```text
User / Issuer / Lender
        │
        ▼
React frontend (apps/web)
        │
        ▼
API layer (apps/api)
        │
        ▼
Hypotheca SDK (packages/sdk)
        │
        ▼
Hypotheca contract layer (packages/contracts)
        │
        ├── ATS token base / identity layer
        ├── claim registry / available balance guard
        └── event and audit trail
```

### Core contract concepts

- `createClaim(...)`: records a claim against an obligor's available balance
- `releaseClaim(...)`: releases a claim and restores available balance
- `defaultClaim(...)`: marks a claim as defaulted by authorized admin flow
- `getAvailableBalance(...)`: returns the remaining unencumbered amount
- `getClaims(...)`: returns active claim history for a token / obligor pair

## Current implementation status

The repository currently contains a working frontend prototype and the foundational monorepo scaffolding for the full production stack.

Status by layer:

- Frontend dashboard: implemented and buildable
- API scaffold: implemented
- Smart contract scaffold: implemented
- SDK scaffold: implemented
- Indexer scaffold: implemented
- Production integration with live Hedera testnet: in progress
- Final contract logic and deployment flow: pending production hardening

## Prerequisites

Before running the project locally, ensure the following are installed:

- Node.js 20+
- npm 10+
- Git
- Optional: Hardhat-compatible local tooling for contract work

## Local setup

1. Clone the repository

```bash
git clone https://github.com/RustyRustacle/HYPOTECHA.git
cd HYPOTECHA
```

2. Install dependencies

```bash
npm install
```

3. Copy the environment template

```bash
cp .env.example .env
```

Then fill in the required values, especially:

```env
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
PRIVATE_KEY=your_private_key_here
ACCOUNT_ID=0.0.1234567
PORT=4000
NODE_ENV=development
```

## Run the project

### Frontend

```bash
npm run dev:web
```

### API

```bash
npm run dev:api
```

### Contract build and tests

```bash
npm run build:contracts
npm run test:contracts
```

### Indexer

```bash
npm run dev:indexer
```

## Workspace scripts

The root `package.json` includes the main commands:

```bash
npm run dev:web
npm run dev:api
npm run dev:indexer
npm run build:web
npm run build:contracts
npm run test:contracts
npm run deploy:testnet
```

## Development principles

This project follows a simple engineering approach:

- keep the contract logic explicit and auditable
- separate protocol logic from UI concerns
- make interface contracts stable before wallet integration
- prioritize event traceability and claim lifecycle correctness over cosmetic polish
- keep local app builds portable across environments via `.env`-driven setup

## Roadmap

### Phase 1: Foundations
- finalize contract states and lifecycle rules
- complete SDK integration contracts
- finalize API schema and validation

### Phase 2: Live network integration
- deploy on Hedera testnet
- verify contracts on HashScan
- connect UI to real contract calls

### Phase 3: Trust and auditability
- add claim history indexing and event queries
- verify reject-over-pledge flows in production-like conditions
- add admin/release/default handling and validation

### Phase 4: Demo and submission
- create 5-minute demo flow
- finalize dashboard UX and data storytelling
- produce submission-grade documentation and video walkthrough

## Security and correctness notes

This is still an evolving implementation. The current repository is best treated as a structured engineering scaffold for a production-grade collateral enforcement protocol. The eventual contract layer should be reviewed for:

- access control
- claim validation edge cases
- balance consistency across token and claim state
- default/release semantics
- event-driven data integrity for dashboard consumption

## Contributing

Contributions are welcome as long as they preserve the protocol's correctness and product scope. Before merging any substantive change:

- validate the contract package
- validate the SDK and API build
- confirm frontend compatibility
- document changes that affect the contract or workflow semantics

## License

Repository code is currently under active development. License terms should be finalized before public release or external production deployment.

## Summary

Hypotheca is designed to make encumbrance state enforceable, transparent, and verifiable. The current repository is a strong engineering base for the full solution: frontend, API, SDK, contract scaffold, and deployment preparation aligned with the Hedera ATS ecosystem.
