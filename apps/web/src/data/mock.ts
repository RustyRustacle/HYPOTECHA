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
  img?: string
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
    img: '/asset/ust-123.jpg',
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
    img: '/asset/tcb-456.jpg',
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
    img: '/asset/reft-789.jpg',
    totalBalance: 2500000,
    totalHeld: 0,
    availableBalance: 2500000,
    claims: [],
  },
  {
    address: '0x000000000000000000000000000000000000DEAD',
    name: 'Gold Bullion Token',
    symbol: 'GLD-552',
    img: '/asset/gld-552.jpg',
    totalBalance: 800000,
    totalHeld: 300000,
    availableBalance: 500000,
    claims: [
      {
        claimId: '0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e',
        token: '0x000000000000000000000000000000000000DEAD',
        tokenName: 'GLD-552',
        obligor: '0x0000000000000000000000000000000000001111',
        obligorName: 'Aurum Holdings',
        claimant: '0x000000000000000000000000000000000000EEEE',
        claimantName: 'Bank E',
        amount: 300000,
        status: 'Active',
        createdAt: Date.now() / 1000 - 21600,
        txHash: '0xgold123...',
      },
    ],
  },
  {
    address: '0x000000000000000000000000000000000000BEEF',
    name: 'Trade Finance Cargo Token',
    symbol: 'CRG-014',
    img: '/asset/cargo.jpg',
    totalBalance: 1200000,
    totalHeld: 450000,
    availableBalance: 750000,
    claims: [
      {
        claimId: '0x1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
        token: '0x000000000000000000000000000000000000BEEF',
        tokenName: 'CRG-014',
        obligor: '0x0000000000000000000000000000000000002222',
        obligorName: 'Maritime Co.',
        claimant: '0x000000000000000000000000000000000000FFFF',
        claimantName: 'Port Lending',
        amount: 450000,
        status: 'Active',
        createdAt: Date.now() / 1000 - 7200,
        txHash: '0xcargo456...',
      },
    ],
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
  {
    claimId: '0x0d1e2f3a...',
    token: '0x...DEAD',
    tokenName: 'GLD-552',
    obligor: '0x...1111',
    obligorName: 'Aurum Holdings',
    claimant: '0x...EEEE',
    claimantName: 'Bank E',
    amount: 300000,
    status: 'Active',
    createdAt: Date.now() / 1000 - 21600,
    txHash: '0xgold123...',
  },
  {
    claimId: '0x1f2a3b4c...',
    token: '0x...BEEF',
    tokenName: 'CRG-014',
    obligor: '0x...2222',
    obligorName: 'Maritime Co.',
    claimant: '0x...FFFF',
    claimantName: 'Port Lending',
    amount: 450000,
    status: 'Active',
    createdAt: Date.now() / 1000 - 7200,
    txHash: '0xcargo456...',
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
  {
    id: '5',
    type: 'EncumbranceCreated',
    tokenName: 'GLD-552',
    claimantName: 'Bank E',
    amount: 300000,
    timestamp: Date.now() / 1000 - 5,
    txHash: '0xgold123456',
  },
]
