import React from 'react'

interface AuthFormLayoutProps {
  children: React.ReactNode
}

/**
 * Layout wrapper for auth forms
 */
export default function AuthFormLayout({ children }: AuthFormLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {children}
      </div>
    </div>
  )
}

