export interface EncumbranceClaim {
  claimId: string
  token: string
  tokenName: string
  obligor: string
  obligorName: string
  claimant: string
  claimantName: string
  amount: number
  status: 'Active' | 'Released' | 'Defaulted'
  createdAt: number
  txHash: string
}

export interface TokenAsset {
  address: string
  name: string
  symbol: string
  totalBalance: number
  totalHeld: number
  availableBalance: number
  claims: EncumbranceClaim[]
}

export interface LiveEvent {
  id: string
  type: 'EncumbranceCreated' | 'EncumbranceReleased' | 'EncumbranceRejected' | 'EncumbranceDefaulted'
  tokenName: string
  claimantName: string
  amount: number
  timestamp: number
  txHash: string
  detail?: string
}

export const mockAssets: TokenAsset[] = [
  {
    address: '0x0000000000000000000000000000000000001234',
    name: 'US Treasury Bond #123',
    symbol: 'UST-123',
    totalBalance: 1000000,
    totalHeld: 600000,
    availableBalance: 400000,
    claims: [
      {
        claimId: '0x7a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
        token: '0x0000000000000000000000000000000000001234',
        tokenName: 'UST-123',
        obligor: '0x000000000000000000000000000000000000AAAA',
        obligorName: 'Company A',
        claimant: '0x000000000000000000000000000000000000BBBB',
        claimantName: 'Bank A',
        amount: 600000,
        status: 'Active',
        createdAt: Date.now() / 1000 - 86400,
        txHash: '0xabc123...',
      },
    ],
  },
  {
    address: '0x0000000000000000000000000000000000005678',
    name: 'Tokenized Corporate Bond',
    symbol: 'TCB-456',
    totalBalance: 500000,
    totalHeld: 200000,
    availableBalance: 300000,
    claims: [
      {
        claimId: '0x8b4c2e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
        token: '0x0000000000000000000000000000000000005678',
        tokenName: 'TCB-456',
        obligor: '0x000000000000000000000000000000000000CCCC',
        obligorName: 'Company B',
        claimant: '0x000000000000000000000000000000000000DDDD',
        claimantName: 'Bank C',
        amount: 200000,
        status: 'Active',
        createdAt: Date.now() / 1000 - 43200,
        txHash: '0xdef456...',
      },
    ],
  },
  {
    address: '0x0000000000000000000000000000000000009ABC',
    name: 'Real Estate Fund Token',
    symbol: 'REFT-789',
    totalBalance: 2500000,
    totalHeld: 0,
    availableBalance: 2500000,
    claims: [],
  },
]

export const mockAllClaims: EncumbranceClaim[] = [
  {
    claimId: '0x7a3f8b2c...',
    token: '0x...1234',
    tokenName: 'UST-123',
    obligor: '0x...AAAA',
    obligorName: 'Company A',
    claimant: '0x...BBBB',
    claimantName: 'Bank A',
    amount: 600000,
    status: 'Active',
    createdAt: Date.now() / 1000 - 86400,
    txHash: '0xabc123...',
  },
  {
    claimId: '0x8b4c2e5f...',
    token: '0x...5678',
    tokenName: 'TCB-456',
    obligor: '0x...CCCC',
    obligorName: 'Company B',
    claimant: '0x...DDDD',
    claimantName: 'Bank C',
    amount: 200000,
    status: 'Active',
    createdAt: Date.now() / 1000 - 43200,
    txHash: '0xdef456...',
  },
  {
    claimId: '0x9c5d3f6a...',
    token: '0x...1234',
    tokenName: 'UST-123',
    obligor: '0x...AAAA',
    obligorName: 'Company A',
    claimant: '0x...EEEE',
    claimantName: 'Bank D',
    amount: 150000,
    status: 'Released',
    createdAt: Date.now() / 1000 - 172800,
    txHash: '0xghi789...',
  },
]

export const mockEvents: LiveEvent[] = [
  {
    id: '1',
    type: 'EncumbranceCreated',
    tokenName: 'UST-123',
    claimantName: 'Bank A',
    amount: 600000,
    timestamp: Date.now() / 1000 - 120,
    txHash: '0xabc123def456',
  },
  {
    id: '2',
    type: 'EncumbranceRejected',
    tokenName: 'UST-123',
    claimantName: 'Bank B',
    amount: 500000,
    timestamp: Date.now() / 1000 - 60,
    txHash: '0x789ghi012jkl',
    detail: 'Exceeds available balance ($400,000)',
  },
  {
    id: '3',
    type: 'EncumbranceCreated',
    tokenName: 'UST-123',
    claimantName: 'Bank B',
    amount: 400000,
    timestamp: Date.now() / 1000 - 30,
    txHash: '0x345mno678pqr',
  },
  {
    id: '4',
    type: 'EncumbranceReleased',
    tokenName: 'UST-123',
    claimantName: 'Bank D',
    amount: 150000,
    timestamp: Date.now() / 1000 - 10,
    txHash: '0x901stu234vwx',
  },
]
