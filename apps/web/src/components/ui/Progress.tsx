interface ProgressProps {
  value: number
  className?: string
  color?: string
}

export function Progress({ value, className = '', color }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={`w-full bg-[#2A2A3A] rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${clamped}%`,
          backgroundColor: color ?? '#7C3AED',
        }}
      />
    </div>
  )
}
