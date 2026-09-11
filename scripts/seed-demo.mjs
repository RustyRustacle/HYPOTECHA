import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JsonRpcProvider, Wallet, getAddress } from 'ethers';
import { AnchorClient, AtsToken, HcsBus, buildEnvelope, GUARD_CODES } from '@hypotheca/sdk';

/**
 * Seed the demo ledger with a believable, hand-picked encumbrance state on the
 * three demo assets (GREEN / GOLD / SUKUK), all REAL on-chain holds created by
 * the operator (escrow = operator so release works), plus two guard rejections
 * so the dashboard opens pre-populated for judges.
 *
 * Run once from repo root:  node scripts/seed-demo.mjs
 * Idempotency: NOT built in — a second run appends more records (fine for demo).
 */

const repo = resolve(import.meta.dirname, '..');

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv(resolve(repo, '.env'));
const P1 = '0x0000000000000000000000000000000000000000000000000000000000000001';

const BANK_A = getAddress('0x1111111111111111111111111111111111111111');
const BANK_B = getAddress('0x2222222222222222222222222222222222222222');
const BANK_C = getAddress('0x3333333333333333333333333333333333333333');

const SEED_HOLDS = [
  { symbol: 'GREEN', claimant: BANK_A, amount: 250000n },
  { symbol: 'GOLD', claimant: BANK_B, amount: 200000n },
  { symbol: 'SUKUK', claimant: BANK_C, amount: 400000n }
];

const SEED_REJECTIONS = [
  // over-pledge on GREEN: 600,000 attempted while 550,000 free after seed hold
  {
    symbol: 'GREEN',
    claimant: BANK_B,
    amount: 600000n,
    code: GUARD_CODES.GUARD_001,
    reason: 'Requested amount exceeds the available (unencumbered) balance'
  },
  // duplicate on GOLD to the same lender
  {
    symbol: 'GOLD',
    claimant: BANK_B,
    amount: 150000n,
    code: GUARD_CODES.REGISTRY_001,
    reason: 'Conflicting active encumbrance already exists on partition ' + P1
  }
];

async function main() {
  const rpc = env.HEDERA_TESTNET_RPC_URL ?? 'https://testnet.hashio.io/api';
  const mirror = (env.MIRROR_NODE_URL ?? 'https://testnet.mirrornode.hedera.com/api/v1').replace(/\/+$/, '');
  const provider = new JsonRpcProvider(rpc);
  const signer = new Wallet(env.PRIVATE_KEY, provider);
  const bus = new HcsBus({
    accountId: env.ACCOUNT_ID,
    privateKey: env.PRIVATE_KEY,
    rpcUrl: rpc,
    mirrorBase: mirror,
    topicId: env.HCS_TOPIC_ID
  });

  const anchor = new AnchorClient(env.REGISTRY_ANCHOR, provider);
  const instances = await anchor.getInstances();
  const bySymbol = new Map(instances.map((i) => [i.assetSymbol, i]));

  console.log('operator', signer.address.toLowerCase());
  console.log('assets on anchor:', instances.map((i) => i.assetSymbol).join(', '));

  for (const seed of SEED_HOLDS) {
    const inst = bySymbol.get(seed.symbol);
    if (!inst) throw new Error(`instance ${seed.symbol} not registered on anchor`);
    const ats = new AtsToken(inst.assetEvm, signer, { mirrorBase: mirror });
    const holdId = await ats.createHoldByPartition({
      partition: P1,
      amount: seed.amount,
      expirationTimestamp: inst.maturityTs,
      escrow: signer.address,
      to: seed.claimant
    });
    const envelope = buildEnvelope({
      op: 'HOLD_CREATED',
      assetId: inst.platformId,
      chainPartition: P1,
      sourceContract: inst.assetEvm,
      holder: signer.address,
      escrow: seed.claimant,
      amount: seed.amount,
      partition: P1,
      to: seed.claimant,
      expirationTs: inst.maturityTs,
      holdId
    });
    await bus.publish(envelope);
    const balance = await ats.balanceOf(signer.address);
    console.log(
      `SEED  ${seed.symbol}: hold#${holdId} ${seed.amount} -> ${seed.claimant} | on-chain bal now ${balance}`
    );
  }

  for (const rej of SEED_REJECTIONS) {
    const inst = bySymbol.get(rej.symbol);
    if (!inst) throw new Error(`instance ${rej.symbol} not registered on anchor`);
    const envelope = buildEnvelope({
      op: 'CONFLICT_REJECTED',
      assetId: inst.platformId,
      chainPartition: P1,
      sourceContract: inst.assetEvm,
      holder: signer.address,
      escrow: rej.claimant,
      amount: rej.amount,
      partition: P1,
      to: rej.claimant
    });
    envelope.rejectedCode = rej.code;
    envelope.rejectedReason = rej.reason;
    await bus.publish(envelope);
    console.log(`REJECT ${rej.symbol}: ${rej.code} ${rej.amount} -> ${rej.claimant}`);
  }

  console.log('\nDONE — ledger will reflect these once the registry sync polls the topic.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});