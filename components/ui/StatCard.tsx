import Card from './Card'
import ThemedText from './ThemedText'

interface StatCardProps {
  label: string
  value: React.ReactNode
  valueColor?: 'default' | 'accent'
  className?: string
}

export default function StatCard({ 
  label, 
  value, 
  valueColor = 'default',
  className = ''
}: StatCardProps) {
  return (
    <Card className={className}>
      <ThemedText as="div" size="sm" tone="secondary" className="mb-2">
        {label}
      </ThemedText>
      <ThemedText as="div" size="3xl" weight="bold" className="mb-2" tone={valueColor === 'accent' ? 'accent' : 'primary'}>
        {value}
      </ThemedText>
    </Card>
  )
}

