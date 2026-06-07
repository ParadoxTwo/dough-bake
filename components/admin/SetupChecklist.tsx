'use client'

import { useEffect, useState } from 'react'
import { getDeliveryConfigStatus } from '@/lib/actions/config-status'
import type { ConfigIssue } from '@/lib/delivery/config-issues'
import ThemedText from '@/components/ui/ThemedText'
import Button from '@/components/ui/Button'

export default function SetupChecklist() {
  const [issues, setIssues] = useState<ConfigIssue[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let active = true
    getDeliveryConfigStatus()
      .then((result) => {
        if (active) setIssues(result.issues)
      })
      .catch(() => {
        /* never block the dashboard on a status check */
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (issues.length === 0) return null

  const errorCount = issues.filter((i) => i.severity === 'error').length

  return (
    <>
      <div
        role="status"
        className="mb-8 p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{
          borderColor: errorCount ? '#ef4444' : 'rgb(234, 179, 8)',
          backgroundColor: errorCount ? 'rgba(239, 68, 68, 0.08)' : 'rgba(234, 179, 8, 0.08)',
        }}
      >
        <ThemedText as="p" size="sm">
          ⚠ Delivery setup needs attention — {issues.length} item
          {issues.length > 1 ? 's' : ''}
          {errorCount ? ` (${errorCount} blocking)` : ''}.
        </ThemedText>
        <Button variant="outline" size="sm" fullWidth={false} onClick={() => setOpen(true)}>
          View setup steps
        </Button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="setup-modal-title"
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl"
            style={{ backgroundColor: 'var(--theme-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <ThemedText id="setup-modal-title" as="h2" size="xl" weight="bold">
                  Delivery setup steps
                </ThemedText>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="text-2xl leading-none px-2"
                  style={{ color: 'var(--theme-text)' }}
                >
                  ×
                </button>
              </div>

              <ThemedText as="p" size="sm" tone="secondary" className="mb-4">
                These items are missing or incomplete. The app keeps working — the affected
                features stay disabled until you complete them.
              </ThemedText>

              <ul className="space-y-4">
                {issues.map((issue) => (
                  <li
                    key={issue.key}
                    className="p-4 rounded-lg border"
                    style={{ borderColor: 'var(--theme-secondary)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs"
                        style={
                          issue.severity === 'error'
                            ? { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'rgb(185, 28, 28)' }
                            : { backgroundColor: 'rgba(234, 179, 8, 0.2)', color: 'rgb(161, 98, 7)' }
                        }
                      >
                        {issue.severity === 'error' ? 'Blocking' : 'Optional'}
                      </span>
                      <ThemedText as="span" weight="semibold">
                        {issue.label}
                      </ThemedText>
                    </div>
                    <ThemedText as="p" size="sm" tone="secondary" className="mb-1">
                      {issue.detail}
                    </ThemedText>
                    <ThemedText as="p" size="sm">
                      <strong>Fix:</strong> {issue.where}
                    </ThemedText>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" size="sm" fullWidth={false} onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
