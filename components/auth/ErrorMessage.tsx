interface ErrorMessageProps {
  message: string
}

/**
 * Error message component for forms
 */
export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null

  return (
    <div 
      className="border px-4 py-3 rounded-lg"
      style={{ 
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        color: '#dc2626'
      }}
    >
      {message}
    </div>
  )
}

