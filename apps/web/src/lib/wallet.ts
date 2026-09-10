import { useCallback, useEffect } from 'react'
import { useConnect, useConnection, useConnectors, useDisconnect, useReconnect } from 'wagmi'

export type ConnectionState = 'Connecting' | 'Connected' | 'Disconnected' | 'Paired'

/**
 * Long-zero EVM representation of a Hedera account id (0.0.<num>).
 * A Hedera account maps directly to a long-zero address; an EOA/contract from
 * another EVM chain keeps its own address as-is (used for the registry identity).
 */
export function accountIdToEvm(accountId: string): string {
  const num = accountId.split('.').pop()
  return `0x${BigInt(num ?? '0').toString(16).padStart(40, '0').slice(-40)}`
}

/** Reverse of accountIdToEvm — only meaningful for long-zero (0x…<last 5 bytes>) addresses. */
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
  connectionState: ConnectionState | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

export function useGeneralWallet(): WalletState {
  const { address, isConnected, status } = useConnection()
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
    connectionState: isConnected
      ? 'Connected'
      : status === 'connecting'
        ? 'Connecting'
        : 'Disconnected',
    connect,
    disconnect,
  }
}