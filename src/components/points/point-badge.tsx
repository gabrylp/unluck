interface PointBadgeProps {
  balance: number
}

export function PointBadge({ balance }: PointBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 glass rounded-none px-3 py-1.5 text-sm font-medium">
      <span className="text-white/70">✦</span>
      <span className="text-white/90">{balance}</span>
    </div>
  )
}
