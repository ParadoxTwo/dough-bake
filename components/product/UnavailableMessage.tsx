export default function UnavailableMessage() {
  return (
    <div 
      className="rounded-lg p-4 border"
      style={{ 
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)'
      }}
    >
      <p 
        className="font-medium"
        style={{ color: 'rgb(185, 28, 28)' }}
      >
        Sorry, this item is currently unavailable.
      </p>
    </div>
  )
}

