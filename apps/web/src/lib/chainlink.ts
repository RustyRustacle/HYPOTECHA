import { parseAbi } from 'viem'
import { publicClient } from '@/lib/ledger'

export interface ChainlinkQuote {
  pair: string
  address: string
  price: number
  decimals: number
  updatedAt: number
  ageSec: number
  stale: boolean
  error?: string
}

const AGGREGATOR_ABI = parseAbi([
  'function decimals() view returns (uint8)',
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
])

export const CHAINLINK_FEEDS: { pair: string; address: `0x${string}` }[] = [
  { pair: 'BTC/USD', address: '0x058fE79CB5775d4b167920Ca6036B824805A9ABd' },
  { pair: 'ETH/USD', address: '0xb9d461e0b962aF219866aDfA7DD19C52bB9871b9' },
  { pair: 'HBAR/USD', address: '0x59bC155EB6c6C415fE43255aF66EcF0523c92B4a' },
  { pair: 'LINK/USD', address: '0xF111b70231E89D69eBC9f6C9208e9890383Ef432' },
  { pair: 'USDC/USD', address: '0xb632a7e7e02d76c0Ce99d9C62c7a2d1B5F92B6B5' },
  { pair: 'USDT/USD', address: '0x06823de8E77d708C4cB72Cbf04495D67afF4Bd37' },
  { pair: 'DAI/USD', address: '0xdA2aBF7C90aDC73CDF5cA8d720B87bD5F5863389' },
]

export async function fetchLivePrices(): Promise<ChainlinkQuote[]> {
  const rows = await Promise.all(
    CHAINLINK_FEEDS.map(async ({ pair, address }) => {
      try {
        const data = await publicClient.readContract({
          address,
          abi: AGGREGATOR_ABI,
          functionName: 'latestRoundData',
        })
        const decimals = await publicClient.readContract({ address, abi: AGGREGATOR_ABI, functionName: 'decimals' })
        const answer = Number(data[1])
        const updatedAt = Number(data[3])
        const now = Math.floor(Date.now() / 1000)
        const ageSec = now - updatedAt
        return {
          pair,
          address,
          decimals,
          price: answer / 10 ** decimals,
          updatedAt,
          ageSec,
          stale: ageSec > 86400,
        }
      } catch (e) {
        return { pair, address, price: 0, decimals: 0, updatedAt: 0, ageSec: 0, stale: true, error: String(e) }
      }
    })
  )
  return rows
}

export function formatUsd(value: number, maxDecimals = 2): string {
  if (!Number.isFinite(value) || value <= 0) return '—'
  if (value >= 1000) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (value >= 1) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: maxDecimals })}`
}

export function formatUsdLevel(value: number): 'usd' | 'alt' {
  return value >= 1 || value <= 0 ? 'usd' : 'alt'
}