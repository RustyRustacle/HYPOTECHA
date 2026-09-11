import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { JsonRpcProvider, Wallet } from 'ethers';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import { AnchorClient, AtsToken, HcsBus, type Envelope } from '@hypotheca/sdk';
import { makeVerdict, RegistryProjection, RegistrySync } from '@hypotheca/registry';

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, '../../../.env') });

const rpcUrl = process.env.HEDERA_TESTNET_RPC_URL ?? 'https://testnet.hashio.io/api';
const mirrorBase = (process.env.MIRROR_NODE_URL ?? 'https://testnet.mirrornode.hedera.com/api/v1').replace(/\/$/, '');
const anchorAddress = process.env.REGISTRY_ANCHOR ?? '';
const topicId = process.env.HCS_TOPIC_ID ?? '';
const accountId = process.env.ACCOUNT_ID ?? '';
const privateKey = process.env.PRIVATE_KEY ?? '';

const provider = new JsonRpcProvider(rpcUrl);
const signer = privateKey ? new Wallet(privateKey, provider) : undefined;
const anchor = new AnchorClient(anchorAddress, provider);
const projection = new RegistryProjection();

const sync = new RegistrySync(
  {
    accountId,
    privateKey,
    rpcUrl,
    mirrorBase,
    topicId,
    pollIntervalMs: Number(process.env.REGISTRY_POLL_MS ?? 10_000)
  },
  projection
);
sync.start();

const bus = new HcsBus({ accountId, privateKey, rpcUrl, mirrorBase, topicId });

const app = express();
const port = Number(process.env.PORT ?? 4000);

const claimSchema = z.object({
  token: z.string().min(1),
  holder: z.string().min(1).optional(),
  claimant: z.string().min(1),
  amount: z.coerce.bigint().refine((v) => v > 0n, 'amount must be > 0'),
  partition: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, 'partition must be a 32-byte hex string')
    .optional()
    .default('0x0000000000000000000000000000000000000000000000000000000000000001'),
  materialize: z.boolean().optional().default(true)
});

async function resolveInstances() {
  return anchor.getInstances();
}

async function toInstance(token: string) {
  const instance = (await resolveInstances()).find(
    (i) =>
      i.assetSymbol.toLowerCase() === token.toLowerCase() ||
      i.assetEvm.toLowerCase() === token.toLowerCase() ||
      `0.0.${i.assetDiamondEntity}` === token
  );
  if (!instance) throw new Error(`unknown asset: ${token}`);
  return instance;
}

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  let instancesCount = 0;
  try {
    instancesCount = (await resolveInstances()).length;
  } catch {
    // keep 0 when the anchor is unreachable
  }
  const history = projection.history(1000);
  const activeHeld = history.filter((h) => h.status === 'active').reduce((s, h) => s + h.amount, 0n);
  res.json({
    status: 'ok',
    service: 'hypotheca-api',
    registryEvents: projection.totalRecords,
    registrySyncError: sync.syncError ?? null,
    lastSyncAt: sync.lastSyncAt ?? null,
    activeHeld: activeHeld.toString(),
    instances: instancesCount,
    topic: topicId,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/assets', async (_req, res) => {
  try {
    const instances = await resolveInstances();
    res.json({
      assets: instances.map((i) => ({
        id: i.assetSymbol,
        platformId: i.platformId,
        name: i.assetName,
        symbol: i.assetSymbol,
        operator: i.operator,
        decimals: i.assetDecimals,
        faceValue: i.faceValue.toString(),
        maturityTs: i.maturityTs.toString(),
        entity: `0.0.${i.assetDiamondEntity}`,
        evm: i.assetEvm,
        active: i.active
      }))
    });
  } catch (error) {
    res.status(502).json({ message: `assets list failed: ${String(error)}` });
  }
});

app.get('/api/assets/:token/available-balance', async (req, res) => {
  try {
    const instance = await toInstance(req.params.token);
const holder = String(req.query.holder ?? signer?.address ?? '').toLowerCase();
    if (!holder) return res.status(400).json({ message: 'holder query param required' });

    const verdict = await makeVerdict(projection, instance.assetEvm, holder, 0n, rpcUrl);
    res.json({
      token: instance.assetSymbol,
      totalBalance: (verdict.balance + verdict.held).toString(),
      totalHeld: verdict.held.toString(),
      availableBalance: verdict.available.toString(),
      holder
    });
  } catch (error) {
    res.status(502).json({ message: `available balance failed: ${String(error)}` });
  }
});

app.get('/api/overview', async (_req, res) => {
  try {
    const instances = await resolveInstances();
    const holder = signer?.address.toLowerCase() ?? '';
    const rows = [];
    for (const i of instances) {
      const ats = new AtsToken(i.assetEvm, provider);
      let balance = 0n;
      try {
        balance = await ats.balanceOf(holder);
      } catch {
        // token unreachable -> treated as fully encumbered by ledger
      }
      const held = projection.totalHeld(i.assetEvm, holder);
      const total = balance + held;
      rows.push({
        id: i.assetSymbol,
        platformId: i.platformId,
        name: i.assetName,
        symbol: i.assetSymbol,
        operator: i.operator,
        faceValue: i.faceValue.toString(),
        entity: `0.0.${i.assetDiamondEntity}`,
        evm: i.assetEvm,
        maturityTs: i.maturityTs.toString(),
        balance: balance.toString(),
        held: held.toString(),
        available: balance.toString(),
        encumberedPct: total > 0n ? Number((held * 10_000n) / total) / 100 : 0
      });
    }

    const history = projection.history(1000);
    const byEvm = new Map(instances.map((i) => [i.assetEvm.toLowerCase(), i]));
    const totals = rows.reduce(
      (acc, r) => ({
        faceValue: acc.faceValue + BigInt(r.faceValue),
        held: acc.held + BigInt(r.held),
        available: acc.available + BigInt(r.available)
      }),
      { faceValue: 0n, held: 0n, available: 0n }
    );

    res.json({
      holder,
      totals: {
        faceValue: totals.faceValue.toString(),
        held: totals.held.toString(),
        available: totals.available.toString(),
        encumberedPct:
          totals.faceValue > 0n ? Number((totals.held * 10_000n) / totals.faceValue) / 100 : 0
      },
      counts: {
        active: history.filter((h) => h.status === 'active').length,
        released: history.filter((h) => h.status === 'released').length,
        rejected: history.filter((h) => h.status === 'rejected').length,
        executed: history.filter((h) => h.status === 'executed').length,
        totalRecords: projection.totalRecords
      },
      assets: rows,
      lastEvents: history.slice(0, 8).map((h) => ({
        key: h.key,
        op: h.op,
        status: h.status,
        amount: h.amount.toString(),
        holder: h.holder,
        claimant: h.claimant,
        consensusTs: h.consensusTs,
        rejectedCode: h.rejectedCode ?? null,
        asset: byEvm.get(h.token.toLowerCase())
          ? {
              id: byEvm.get(h.token.toLowerCase())!.assetSymbol,
              entity: `0.0.${byEvm.get(h.token.toLowerCase())!.assetDiamondEntity}`
            }
          : null
      }))
    });
  } catch (error) {
    res.status(502).json({ message: `overview failed: ${String(error)}` });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const instances = await resolveInstances();
    const byEvm = new Map(instances.map((i) => [i.assetEvm.toLowerCase(), i]));
    const asset = req.query.asset ? String(req.query.asset).toLowerCase() : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    let events = projection.history(250).map((h) => {
      const inst = h.token ? byEvm.get(h.token.toLowerCase()) : undefined;
      return {
        key: h.key,
        op: h.op,
        status: h.status,
        amount: h.amount.toString(),
        holder: h.holder,
        claimant: h.claimant,
        to: h.to ?? null,
        partition: h.partition,
        expiration: h.expiration?.toString() ?? null,
        consensusTs: h.consensusTs,
        rejectedCode: h.rejectedCode ?? null,
        rejectedReason: h.rejectedReason ?? null,
        token: h.token,
        asset: inst
          ? {
              id: inst.assetSymbol,
              name: inst.assetName,
              entity: `0.0.${inst.assetDiamondEntity}`
            }
          : null
      };
    });
    if (asset) {
      events = events.filter(
        (e) => e.asset?.id.toLowerCase() === asset || e.token?.toLowerCase() === asset
      );
    }
    if (status) events = events.filter((e) => e.status === status);
    res.json({ events });
  } catch (error) {
    res.status(502).json({ message: `events failed: ${String(error)}` });
  }
});

app.get('/api/assets/:token/claims', async (req, res) => {
  try {
    const instance = await toInstance(req.params.token);
    const holder = req.query.holder ? String(req.query.holder).toLowerCase() : undefined;
    const holds = projection.activeHolds(instance.assetEvm, holder);
    res.json({
      token: instance.assetSymbol,
      claims: holds.map((h) => ({
        holdId: h.key,
        holder: h.holder,
        claimant: h.claimant,
        amount: h.amount.toString(),
        partition: h.partition,
        createdAt: h.consensusTs,
        status: h.status
      }))
    });
  } catch (error) {
    res.status(502).json({ message: `claims list failed: ${String(error)}` });
  }
});

app.get('/api/encumbrances', (_req, res) => {
  const history = projection.history(200).map((h) => ({
    ...h,
    amount: h.amount.toString(),
    expiration: h.expiration?.toString()
  }));
  res.json({
    claims: history.filter((h) => h.status === 'active'),
    history
  });
});

app.get('/api/encumbrances/:claimId', (req, res) => {
  const claim = projection.history(1000).find((h) => h.key === req.params.claimId);
  if (!claim) return res.status(404).json({ message: 'Encumbrance not found' });
  return res.json({
    ...claim,
    amount: claim.amount.toString(),
    expiration: claim.expiration?.toString()
  });
});

app.post('/api/encumbrances/guard', async (req, res) => {
  const parsed = claimSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid request payload', errors: parsed.error.flatten() });

  try {
    const instance = await toInstance(parsed.data.token);
    const verdict = await makeVerdict(
      projection,
      instance.assetEvm,
      parsed.data.holder ?? signer?.address ?? "",
      parsed.data.amount,
      rpcUrl,
      parsed.data.partition,
      parsed.data.claimant
    );
    const body = {
      ok: verdict.ok,
      token: instance.assetSymbol,
      holder: verdict.holder,
      balance: verdict.balance.toString(),
      held: verdict.held.toString(),
      available: verdict.available.toString(),
      requested: verdict.requested.toString(),
      shortfall: verdict.shortfall.toString(),
      code: verdict.code ?? null,
      reason: verdict.reason ?? null,
      partition: verdict.partition,
      claimant: verdict.claimant,
      conflict: verdict.conflict
        ? {
            existingHoldId: verdict.conflict.existingHoldId,
            existingClaimant: verdict.conflict.existingClaimant ?? null,
            existingAmount: verdict.conflict.existingAmount.toString()
          }
        : null
    };
    return verdict.ok ? res.json(body) : res.status(409).json(body);
  } catch (error) {
    return res.status(502).json({ message: `guard evaluation failed: ${String(error)}` });
  }
});

app.post('/api/encumbrances', async (req, res) => {
  const parsed = claimSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid request payload', errors: parsed.error.flatten() });

  try {
    const instance = await toInstance(parsed.data.token);
    const verdict = await makeVerdict(
      projection,
      instance.assetEvm,
      parsed.data.holder ?? signer?.address ?? "",
      parsed.data.amount,
      rpcUrl,
      parsed.data.partition,
      parsed.data.claimant
    );
    if (!verdict.ok) {
      try {
        const rejected: Envelope = {
          v: 1,
          op: 'CONFLICT_REJECTED',
          assetId: instance.platformId,
          chainPartition: parsed.data.partition,
          sourceContract: instance.assetEvm,
          holder: parsed.data.holder ?? signer?.address ?? "",
          escrow: parsed.data.claimant,
          to: parsed.data.claimant,
          partition: parsed.data.partition,
          amount: parsed.data.amount.toString(),
          rejectedCode: verdict.code,
          rejectedReason: verdict.reason ?? 'Rejected by registry guard'
        };
        await bus.publish(rejected);
      } catch {
        // best-effort: the rejection is still returned to the caller
      }
      return res.status(409).json({
        ok: false,
        message: verdict.reason ?? 'Over-pledge detected: requested exceeds available balance',
        requested: verdict.requested.toString(),
        available: verdict.available.toString(),
        shortfall: verdict.shortfall.toString(),
        code: verdict.code,
        reason: verdict.reason ?? null,
        conflict: verdict.conflict
          ? {
              existingHoldId: verdict.conflict.existingHoldId,
              existingClaimant: verdict.conflict.existingClaimant ?? null,
              existingAmount: verdict.conflict.existingAmount.toString()
            }
: null
    });
    }

    let holdId: string | undefined;
    if (parsed.data.materialize && signer) {
      const ats = new AtsToken(instance.assetEvm, signer, { mirrorBase });
holdId = await ats.createHoldByPartition({
        partition: parsed.data.partition,
        amount: parsed.data.amount,
        expirationTimestamp: BigInt(instance.maturityTs),
        escrow: signer.address,
        to: parsed.data.claimant
      });
    }

    const envelope: Envelope = {
      v: 1,
      op: 'HOLD_CREATED',
      assetId: instance.platformId,
      chainPartition: parsed.data.partition,
      sourceContract: instance.assetEvm,
      holdId,
      holder: parsed.data.holder ?? signer?.address ?? "",
      escrow: parsed.data.claimant,
      to: parsed.data.claimant,
      partition: parsed.data.partition,
      amount: parsed.data.amount.toString(),
      expiration: undefined
    };
    const hcsStatus = await bus.publish(envelope);

    const claim = {
      holdId: holdId ?? null,
      token: instance.assetSymbol,
      tokenEvm: instance.assetEvm,
      holder: parsed.data.holder ?? signer?.address ?? "",
      claimant: parsed.data.claimant,
      amount: parsed.data.amount.toString(),
      partition: parsed.data.partition,
      status: 'active',
      statusText: hcsStatus,
      createdAt: new Date().toISOString()
    };

    return res.status(202).json({ message: 'Encumbrance recorded on the HCS registry', claim });
  } catch (error) {
    return res.status(502).json({ message: `create encumbrance failed: ${String(error)}` });
  }
});

app.post('/api/encumbrances/:claimId/release', async (req, res) => {
  try {
    const hold = projection.find(req.params.claimId);
if (!hold || hold.status !== 'active') {
      return res.status(404).json({ message: 'Active encumbrance not found' });
    }

    let atsReleaseTx: string | undefined;
    const isNumericHold = /^\d+$/.test(hold.key);
    if (signer && hold.partition && isNumericHold) {
      try {
        const ats = new AtsToken(hold.token, signer, { mirrorBase });
        atsReleaseTx = await ats.releaseHoldByPartition(
          { partition: hold.partition, tokenHolder: hold.holder, holdId: BigInt(hold.key) },
          hold.amount
        );
      } catch (error) {
        return res.status(502).json({ message: `ATS release failed: ${String(error)}` });
      }
    }

    const released: Envelope = {
      v: 1,
      op: 'HOLD_RELEASED',
      assetId: hold.assetId,
      chainPartition: hold.partition,
      sourceContract: hold.token,
      holdId: hold.key,
      holder: hold.holder,
      escrow: hold.claimant,
      to: hold.to,
      partition: hold.partition,
      amount: hold.amount.toString(),
      txId: atsReleaseTx
    };
    const hcsStatus = await bus.publish(released);

    return res.json({
      message: 'Encumbrance released on the HCS registry',
      claim: {
        holdId: hold.key,
        token: hold.token,
        holder: hold.holder,
        claimant: hold.claimant,
        amount: hold.amount.toString(),
        partition: hold.partition,
        status: 'released',
        statusText: hcsStatus,
        releasedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(502).json({ message: `release encumbrance failed: ${String(error)}` });
  }
});

app.listen(port, () => {
  console.log(`Hypotheca API listening on http://localhost:${port}`);
});
