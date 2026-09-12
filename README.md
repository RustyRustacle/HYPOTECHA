# HYPOTECHA

Hypotheca is an **on-chain encumbrance enforcement layer** for tokenized assets. It records and enforces partial claims/collateral against an asset's available balance so a single tokenized position can never be pledged beyond its real value — **double-pledging is structurally impossible**.

Built for the ETHGlobal Hedera bounty "Tokenization of Anything" on **Hedera Asset Tokenization Studio (ATS)**.

## How it works

The core primitive is an **EncumbranceLedger** contract that acts as the on-chain *vault* (token holder) for each platform asset:

1. The asset's balance is deposited into the vault.
2. A bank (creditor) draws a credit line via `requestLoan(platformId, creditor, units)`.
3. Each draw **materializes as an ATS hold locked inside the vault** (`createHoldByPartition`, escrow = the ledger). Because ATS holds deduct from the vault's `balanceOf`, the free (encumberable) amount is simply the vault's token balance — one unit can never back two claims.
4. `requestLoan` also enforces a **coverage gate**: collateral USD / outstanding USD (live Chainlink price) must stay above the platform threshold, with interest (bps) marked up into the drawn unit.
5. `repay` releases the hold back into the vault (`releaseHoldByPartition` — no identity check, exact "release-back" semantics).
6. `settle` is permissionless: if coverage drops below threshold (`CoverageBelowThreshold`) or the platform matures with open positions, every hold is **executed to its creditor** on-chain.
7. `withdraw` moves free units back to a depositor via a **create-then-execute transient hold** (the only whitelisted ATS transfer primitives on the deployed diamonds).

## Repository structure

```text
HYPOTECHA/
├── apps/
│   └── web/                  # React + Vite + wagmi/viem dashboard (reads + writes to the ledger)
├── packages/
│   ├── contracts/            # Solidity + Hardhat
│   │   ├── contracts/        # EncumbranceLedger.sol, RegistryAnchor.sol
│   │   ├── scripts/          # deploy-ledger, e2e-ledger, verify-ledger, spikes (M0)
│   │   └── test/             # 29 passing unit tests (ledger + anchor)
│   └── deployments/          # testnet.json (live addresses, chain 296)
├── docs/
│   ├── AUDIT.md              # Full bug & error audit (0 open High/Medium)
│   └── ...
├── .env.example
├── package.json              # workspaces + root scripts (incl. `npm run audit`)
└── README.md
```

No backend and no SDK — the frontend talks to the contracts **directly** via viem through any EVM wallet (Hedera Flow/COPE, MetaMask, Brave, ...). Event history is read from the mirror node (HashIO `eth_getLogs` is unsupported).

## Deployed on Hedera testnet (chain 296)

See `packages/deployments/testnet.json`:

| Contract | Address |
|---|---|
| EncumbranceLedger | `0xfa01E5b4F2765F33790e8d89A8620bdFd3a16958` |
| RegistryAnchor | `0x12E99d5F169eB3b34aabFb2936619febe7da0754` |
| SUKUK token (ATS diamond) | `0xb493ff39779e56a66350daa1c1cc9daaed913c3b` |
| USDC/USD Chainlink feed | `0xb632a7e7e02d76c0Ce99d9C62c7a2d1B5F92B6B5` |

Configured platform `0x…73756b756b` ("sukuk"): threshold 10,000 bps, interest 200 bps (2%), borrow cap 1,000,000, maturity 0 → 180-day hold grace.

## Local setup

```bash
npm install
cp .env.example .env   # fill PRIVATE_KEY / EVM_ADDRESS (contract scripts only)
```

## Run

```bash
npm run dev:web        # frontend (http://localhost:5173)
```

Pick **Launch App** → connect an EVM wallet (gate) → Dashboard, Asset, Pledge, Claims, History all read the live ledger. Pledges/releases are broadcast as real transactions signed by your wallet.

## Contract work

```bash
npm run build:contracts   # hardhat compile
npm run test:contracts    # hardhat test (29 unit tests)
npm run deploy:testnet    # deploy-ledger.ts
```

Key scripts: `packages/contracts/scripts/deploy-ledger.ts` (deploy + anchor references), `e2e-ledger.ts` (live testnet end-to-end, explicit `gasLimit=800_000n`, no gas-price override).

## Audit

```bash
npm run audit
```

Runs contract tests + contract typecheck + web lint + web build. Full findings in [`docs/AUDIT.md`](docs/AUDIT.md) — **0 open High/Medium/Low**.

## Why the vault model (vs. an off-chain registry)

- **Enforcement is on-chain** — over-pledging reverts in the contract (`InsufficientCollateral`), not in an API.
- **Truth is the token** — available = vault `balanceOf`; combined with ATS holds there is no double-count.
- **Creditors recover real collateral** — `settle` executes holds into each bank's address; the whole thing is verified on HashScan.
- **No KYC gate on mint/pledge** — identity matters only at settlement/withdrawal execution, where ATS gates the *recipient* (`onlyIdentifiedAddresses`).

Known limitations are documented in `docs/AUDIT.md` (Sourcify auto-verify for chain 296, mirror-node log pagination, single configured platform).