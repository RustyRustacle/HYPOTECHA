import { useCallback, useEffect } from 'react'
import {
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useReconnect,
  useSwitchChain,
  useWalletClient,
} from 'wagmi'
import { hederaTestnet } from '@/lib/wagmi'

export type ConnectionState = 'Connecting' | 'Connected' | 'Disconnected' | 'Paired'

/**
 * Reverse mapping from an EVM address to a Hedera account id — only meaningful
 * for long-zero addresses (0x…<last 5 bytes>). EOA/contract addresses from other
 * EVM chains stay as-is (used for the registry identity).
 */
export function evmToAccountId(evm: string): string | null {
  try {
    const bn = BigInt(evm)
    if (bn > BigInt(0xffffffffff)) return null
    return `0.0.${bn}`
  } catch {
    return null
  }
}

export interface WalletState {
  connected: boolean
  accountId: string | null
  evmAddress: string | null
  chainId: number | null
  connectionState: ConnectionState | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

export function useGeneralWallet(): WalletState {
  const { address, isConnected, status, chainId } = useConnection()
  const { connectAsync } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { reconnectAsync } = useReconnect()
  const connectors = useConnectors()

  useEffect(() => {
    // Re-attach to any previously authorized session on load.
    void reconnectAsync().catch(() => {})
  }, [reconnectAsync])

  const connect = useCallback(async () => {
    // Prefer the injected provider in-browser (Brave/Chrome wallet, MetaMask,
    // etc). Fall back to any available connector if injected is missing.
    const preferred = connectors.find((c) => c.id === 'injected')
    const connector = preferred ?? connectors[0]
    if (!connector) return
    try {
      await connectAsync({ connector })
    } catch {
      // user declined or no wallet; gate stays open
    }
  }, [connectAsync, connectors])

  const disconnect = useCallback(async () => {
    try {
      await disconnectAsync()
    } catch {
      // no-op
    }
  }, [disconnectAsync])

  return {
    connected: isConnected,
    accountId: address ? evmToAccountId(address) : null,
    evmAddress: address ?? null,
    chainId: chainId ?? null,
    connectionState: isConnected
      ? 'Connected'
      : status === 'connecting'
        ? 'Connecting'
        : 'Disconnected',
    connect,
    disconnect,
  }
}

/**
 * The viem `WalletClient` used to sign ledger transactions. `useWalletClient`
 * asserts the wallet's current chain matches the configured chain (Hedera
 * Testnet 296); when the wallet is connected but standing on another network
 * that assert throws and `signer` stays `undefined` — which is exactly the
 * confusing "connect a wallet" state. This hook surfaces that mismatch
 * explicitly so callers can tell the user to switch networks.
 */
export function useWalletSigner() {
  const { isConnected, chainId } = useConnection()
  const { data: signer } = useWalletClient()
  const { switchChainAsync, isPending } = useSwitchChain()
  const isWrongChain = Boolean(isConnected && chainId && chainId !== hederaTestnet.id)

  const switchToHedera = useCallback(async () => {
    if (!isWrongChain) return
    try {
      // Requests wallet_switchEthereumChain (and wallet_addEthereumChain the
      // first time, since the injected connector knows the chain config).
      await switchChainAsync({ chainId: hederaTestnet.id })
    } catch {
      // user declined or chain unsupported; the banner stays visible
    }
  }, [isWrongChain, switchChainAsync])

  return { signer, chainId: chainId ?? null, isWrongChain, switchToHedera, switching: isPending }
}