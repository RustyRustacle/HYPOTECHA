import { useEffect, useState, useCallback } from 'react'
import { HashConnect } from '@hashgraph/hashconnect'

const APP_METADATA = {
  name: 'Hypotheca',
  description: 'On-chain encumbrance registry for tokenized assets',
  icon: '/logo.png',
  url: window.location.origin,
}

export type ConnectionState = 'Connecting' | 'Connected' | 'Disconnected' | 'Paired'

/**
 * Long-zero EVM representation of a Hedera account id (0.0.<num>).
 * Sufficient for identifying the connected holder to the registry/API.
 */
export function accountIdToEvm(accountId: string): string {
  const num = accountId.split('.').pop()
  return `0x${BigInt(num ?? '0').toString(16).padStart(40, '0').slice(-40)}`
}

export interface WalletState {
  connected: boolean
  accountId: string | null
  evmAddress: string | null
  connectionState: ConnectionState | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

export function useHashpack(): WalletState {
  const [hashconnect] = useState(() => new HashConnect(false))
  const [connected, setConnected] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null)

  useEffect(() => {
    let disposed = false

    void (async () => {
      try {
        await hashconnect.init(APP_METADATA, 'testnet', false)
        await hashconnect.connect()
      } catch {
        // extension not available yet; lifecycle events will surface state
      }
    })()

    hashconnect.pairingEvent.on((data) => {
      if (disposed || data.accountIds.length === 0) return
      setAccountId(data.accountIds[0])
      setConnected(true)
      setConnectionState('Paired')
    })

    hashconnect.connectionStatusChangeEvent.on((state) => {
      if (disposed) return
      setConnectionState(state)
      if (state === 'Connected') {
        const restored = hashconnect.hcData.pairingData[0]
        if (restored?.accountIds.length) {
          setAccountId(restored.accountIds[0])
          setConnected(true)
        }
      }
      if (state === 'Disconnected') {
        setAccountId(null)
        setConnected(false)
      }
    })

    return () => {
      disposed = true
    }
  }, [hashconnect])

  const connect = useCallback(async () => {
    await hashconnect.connectToLocalWallet()
  }, [hashconnect])

  const disconnect = useCallback(async () => {
    try {
      await hashconnect.clearConnectionsAndData()
    } catch {
      // no-op
    }
    setAccountId(null)
    setConnected(false)
  }, [hashconnect])

  return {
    connected,
    accountId,
    evmAddress: accountId ? accountIdToEvm(accountId) : null,
    connectionState,
    connect,
    disconnect,
  }
}