import { defineChain } from 'viem'
import { createConfig, http } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'

const hederaTestnet = defineChain({
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 8 },
  rpcUrls: {
    default: { http: ['https://testnet.hashio.io/api'] },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
  },
  testnet: true,
})

export const config = createConfig({
  chains: [hederaTestnet],
  connectors: [metaMask(), injected()],
  transports: {
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}