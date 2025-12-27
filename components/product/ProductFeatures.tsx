export default function ProductFeatures() {
  const features = [
    'Fresh baked daily',
    'Made with premium ingredients',
    'Same-day delivery available'
  ]

  return (
    <div 
      className="border-t pt-6 space-y-3 text-sm"
      style={{ 
        borderColor: 'var(--theme-secondary)',
        color: 'var(--theme-text-secondary)'
      }}
    >
      {features.map((feature, index) => (
        <p key={index}>✓ {feature}</p>
      ))}
    </div>
  )
}

