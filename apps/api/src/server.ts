import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

const createClaimSchema = z.object({
  token: z.string().min(1),
  obligor: z.string().min(1),
  claimant: z.string().min(1),
  amount: z.coerce.bigint().refine((v) => v > 0n, 'amount must be > 0')
});

const claimsStore = [
  {
    claimId: '0xdemo-claim-001',
    token: '0xTokenTreasury123',
    obligor: '0xCompanyA',
    claimant: '0xBankA',
    amount: 600000n,
    status: 'active',
    createdAt: 1724770000n,
    updatedAt: 1724770000n
  }
];

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'hypotheca-api',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/assets/:token/available-balance', (req, res) => {
  const { token } = req.params;
  const totalBalance = 1000000n;
  const active = claimsStore
    .filter((claim) => claim.token === token)
    .reduce((sum, claim) => sum + claim.amount, 0n);

  res.json({
    token,
    totalBalance: totalBalance.toString(),
    totalHeld: active.toString(),
    availableBalance: (totalBalance - active).toString()
  });
});

app.get('/api/assets/:token/claims', (req, res) => {
  const claims = claimsStore.filter((claim) => claim.token === req.params.token);
  res.json({ claims: claims.map((claim) => ({ ...claim, amount: claim.amount.toString() })) });
});

app.get('/api/encumbrances', (_req, res) => {
  res.json({
    message: 'Encumbrance API scaffold ready',
    claims: claimsStore.map((claim) => ({ ...claim, amount: claim.amount.toString() })),
    availableBalance: 400000n.toString()
  });
});

app.get('/api/encumbrances/:claimId', (req, res) => {
  const claim = claimsStore.find((entry) => entry.claimId === req.params.claimId);
  if (!claim) {
    return res.status(404).json({ message: 'Claim not found' });
  }

  return res.json({
    ...claim,
    amount: claim.amount.toString()
  });
});

app.post('/api/encumbrances', (req, res) => {
  const parsed = createClaimSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request payload',
      errors: parsed.error.flatten()
    });
  }

  const payload = parsed.data;
  const claim = {
    claimId: `0xdemo-claim-${claimsStore.length + 1}`,
    token: payload.token,
    obligor: payload.obligor,
    claimant: payload.claimant,
    amount: payload.amount,
    status: 'active',
    createdAt: BigInt(Date.now()),
    updatedAt: BigInt(Date.now())
  };

  claimsStore.push(claim);

  return res.status(202).json({
    message: 'Create encumbrance request accepted',
    claim: {
      ...claim,
      amount: claim.amount.toString()
    }
  });
});

app.listen(port, () => {
  console.log(`Hypotheca API listening on http://localhost:${port}`);
});
