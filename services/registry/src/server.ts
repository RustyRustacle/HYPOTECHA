import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import { RegistryProjection } from './projection.js';
import { RegistrySync } from './sync.js';
import { makeVerdict } from './guard.js';

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, '../../../.env') });

const rpcUrl = process.env.HEDERA_TESTNET_RPC_URL ?? 'https://testnet.hashio.io/api';
const mirrorBase = (process.env.MIRROR_NODE_URL ?? 'https://testnet.mirrornode.hedera.com/api/v1').replace(/\/$/, '');
const topicId = process.env.HCS_TOPIC_ID ?? '';

const projection = new RegistryProjection();
const sync = new RegistrySync(
  {
    accountId: process.env.ACCOUNT_ID ?? '',
    privateKey: process.env.PRIVATE_KEY ?? '',
    rpcUrl,
    mirrorBase,
    topicId,
    pollIntervalMs: Number(process.env.REGISTRY_POLL_MS ?? 10_000)
  },
  projection
);
sync.start();

const guardSchema = z.object({
  token: z.string().min(1),
  holder: z.string().min(1),
  amount: z.coerce.bigint().refine((v) => v > 0n, 'amount must be > 0'),
  claimant: z.string().optional(),
  partition: z.string().optional()
});

const app = express();
const port = Number(process.env.REGISTRY_PORT ?? 4001);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'hypotheca-registry',
    topicId,
    eventsIndexed: projection.totalRecords,
    lastSyncError: sync.syncError ?? null,
    timestamp: new Date().toISOString()
  });
});

app.get('/registry/holds', (req, res) => {
  const token = String(req.query.token ?? '').toLowerCase();
  const holder = req.query.holder ? String(req.query.holder) : undefined;
  if (!token) return res.status(400).json({ message: 'token query param required' });
  const rows = projection.activeHolds(token, holder);
  res.json({
    token,
    held: rows.reduce((sum, r) => sum + r.amount, 0n).toString(),
    holds: rows.map((r) => ({ ...r, amount: r.amount.toString() }))
  });
});

app.get('/registry/history', (_req, res) => {
  res.json({
    eventsIndexed: projection.totalRecords,
    history: projection.history(200).map((r) => ({ ...r, amount: r.amount.toString(), expiration: r.expiration?.toString() }))
  });
});

app.get('/registry/summary', (req, res) => {
  const token = req.query.token ? String(req.query.token).toLowerCase() : undefined;
  res.json({ summaries: projection.summaryFor(token ?? '', undefined) });
});

app.post('/registry/guard', async (req, res) => {
  const parsed = guardSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid request payload', errors: parsed.error.flatten() });
  }

  try {
    const verdict = await makeVerdict(
      projection,
      parsed.data.token,
      parsed.data.holder,
      parsed.data.amount,
      rpcUrl,
      parsed.data.partition,
      parsed.data.claimant
    );

    const body = {
      ok: verdict.ok,
      token: verdict.token,
      holder: verdict.holder,
      balance: verdict.balance.toString(),
      held: verdict.held.toString(),
      available: verdict.available.toString(),
      requested: verdict.requested.toString(),
      shortfall: verdict.shortfall.toString(),
      code: verdict.code ?? null,
      reason: verdict.reason ?? null,
      partition: verdict.partition,
      conflict: verdict.conflict
        ? {
            existingHoldId: verdict.conflict.existingHoldId,
            existingClaimant: verdict.conflict.existingClaimant ?? null,
            existingAmount: verdict.conflict.existingAmount.toString()
          }
        : null
    };

    if (!verdict.ok) {
      return res.status(409).json(body);
    }
    return res.json(body);
  } catch (error) {
    return res.status(502).json({ message: `guard evaluation failed: ${String(error)}` });
  }
});

app.listen(port, () => {
  console.log(`Hypotheca registry listening on http://localhost:${port}`);
});