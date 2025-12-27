interface PageHeaderProps {
  title: string
  subtitle?: string
  className?: string
}

export default function PageHeader({ 
  title, 
  subtitle,
  className = ''
}: PageHeaderProps) {
  return (
    <div className={`text-center mb-12 ${className}`}>
      <h1 
        className="text-4xl font-bold mb-4"
        style={{ color: 'var(--theme-text)' }}
      >
        {title}
      </h1>
      {subtitle && (
        <p 
          className="text-xl"
          style={{ color: 'var(--theme-text-secondary)' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}

