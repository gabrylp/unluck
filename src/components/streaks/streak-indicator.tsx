interface StreakIndicatorProps {
  current: number
  longest: number
}

export function StreakIndicator({ current, longest }: StreakIndicatorProps) {
  return (
    <div className="inline-flex items-center gap-2 glass rounded-none px-3 py-1.5">
      <div className="flex items-center gap-1">
        <span className="text-base">{current > 0 ? '🔥' : '○'}</span>
        <span className="font-bold text-base text-white/90">{current}</span>
        <span className="text-xs text-white/40">day{current !== 1 ? 's' : ''}</span>
      </div>
      <div className="text-xs text-white/30">
        Best: {longest}
      </div>
    </div>
  )
}
