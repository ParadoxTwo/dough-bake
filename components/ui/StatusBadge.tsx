interface StatusBadgeProps {
  status: string
  className?: string
}

const statusColors: Record<string, { bg: string; text: string }> = {
  completed: {
    bg: 'rgba(34, 197, 94, 0.2)',
    text: 'rgb(22, 163, 74)'
  },
  pending: {
    bg: 'rgba(234, 179, 8, 0.2)',
    text: 'rgb(161, 98, 7)'
  },
  processing: {
    bg: 'rgba(59, 130, 246, 0.2)',
    text: 'rgb(37, 99, 235)'
  },
  cancelled: {
    bg: 'rgba(239, 68, 68, 0.2)',
    text: 'rgb(185, 28, 28)'
  }
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const colors = statusColors[status.toLowerCase()] || statusColors.cancelled

  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {status}
    </span>
  )
}

