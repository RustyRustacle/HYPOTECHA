import { formatCurrency } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: string
  subtext?: string
}

export function KPICard({ title, value, prefix = '', suffix = '', change, changeType = 'neutral', icon, subtext }: KPICardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-surface-raised flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-medium font-mono px-2 py-1 rounded-full ${
            changeType === 'positive' ? 'bg-primary/10 text-primary' :
            changeType === 'negative' ? 'bg-danger/10 text-danger' :
            'bg-surface-raised text-text-secondary'
          }`}>
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold font-mono text-text tracking-tight">
        {prefix}{formatCurrency(value)}{suffix}
      </div>
      <div className="text-sm text-text-secondary mt-1">{title}</div>
      {subtext && <div className="text-xs text-text-muted mt-1">{subtext}</div>}
    </div>
  )
}
