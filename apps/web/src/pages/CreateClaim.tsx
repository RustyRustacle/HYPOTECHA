import { useState } from 'react'
import { mockAssets } from '@/data/mock'
import { RejectionModal } from '@/components/RejectionModal'
import { PageHero } from '@/components/PageHero'

interface CreateClaimProps {
  onNavigate: (page: string) => void
}

export function CreateClaim({ onNavigate }: CreateClaimProps) {
  const [selectedAsset, setSelectedAsset] = useState(mockAssets[0])
  const [claimantAddress, setClaimantAddress] = useState('')
  const [claimantName, setClaimantName] = useState('')
  const [amount, setAmount] = useState('')
  const [showRejection, setShowRejection] = useState(false)

  const amountNum = parseFloat(amount) || 0
  const isValid = amountNum > 0 && amountNum <= selectedAsset.availableBalance && claimantAddress && claimantName

  const handleSubmit = () => {
    if (amountNum > selectedAsset.availableBalance) {
      setShowRejection(true)
      return
    }
    console.log('Creating claim:', { asset: selectedAsset.address, claimantAddress, amount: amountNum })
    onNavigate('dashboard')
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <PageHero
        badge="New Encumbrance"
        title="Create New Claim"
        subtitle="Pledge a portion of an asset as collateral to a claimant"
        media={{ kind: 'image', src: '/bg/stats-metal.jpg', opacity: 40 }}
      />

      <div className="bg-surface rounded-xl border border-border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Select Asset</label>
          <select
            value={selectedAsset.address}
            onChange={(e) => setSelectedAsset(mockAssets.find(a => a.address === e.target.value) || mockAssets[0])}
            className="w-full bg-surface-raised border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors"
          >
            {mockAssets.map(asset => (
              <option key={asset.address} value={asset.address}>
                {asset.name} ({asset.symbol}) — Available: ${asset.availableBalance.toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-surface-raised rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-secondary">Available Balance</span>
            <span className="font-mono font-semibold text-primary">${selectedAsset.availableBalance.toLocaleString()}</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden flex">
            {selectedAsset.totalHeld > 0 && (
              <div className="h-full bg-warning" style={{ width: `${(selectedAsset.totalHeld / selectedAsset.totalBalance) * 100}%` }} />
            )}
            <div className="h-full bg-primary/30" style={{ width: `${(selectedAsset.availableBalance / selectedAsset.totalBalance) * 100}%` }} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Claimant Name</label>
          <input
            type="text"
            value={claimantName}
            onChange={(e) => setClaimantName(e.target.value)}
            placeholder="e.g. Bank A"
            className="w-full bg-surface-raised border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Claimant Address</label>
          <input
            type="text"
            value={claimantAddress}
            onChange={(e) => setClaimantAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-surface-raised border border-border rounded-lg px-4 py-2.5 text-sm text-text font-mono placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Amount (USD)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            max={selectedAsset.availableBalance}
            className="w-full bg-surface-raised border border-border rounded-lg px-4 py-2.5 text-sm text-text font-mono placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          />
          {amountNum > selectedAsset.availableBalance && (
            <p className="text-xs text-danger mt-1.5">
              Amount exceeds available balance. This will be rejected on-chain.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex-1 px-4 py-2.5 rounded-lg bg-surface-raised border border-border text-sm font-medium text-text-secondary hover:bg-surface-raised/80 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {amountNum > selectedAsset.availableBalance ? 'Submit (Will Revert)' : 'Create Claim'}
          </button>
        </div>
      </div>

      <RejectionModal
        isOpen={showRejection}
        requestedAmount={amountNum}
        availableAmount={selectedAsset.availableBalance}
        onClose={() => setShowRejection(false)}
        onRetry={() => setShowRejection(false)}
      />
    </div>
  )
}
