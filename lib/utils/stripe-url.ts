/**
 * Extract Stripe account ID from publishable key
 * Format: pk_test_ACCOUNT_ID or pk_live_ACCOUNT_ID
 * Returns the account ID part (without pk_test_ or pk_live_ prefix)
 */
function extractAccountIdFromPublishableKey(publishableKey: string): string | null {
  if (!publishableKey) return null
  
  // Stripe publishable keys start with pk_test_ or pk_live_
  // Format: pk_test_ACCOUNT_ID... or pk_live_ACCOUNT_ID...
  // The account ID in dashboard URLs is typically 16 characters
  const testMatch = publishableKey.match(/^pk_test_(.{16})/)
  const liveMatch = publishableKey.match(/^pk_live_(.{16})/)
  
  if (testMatch) {
    return testMatch[1]
  }
  
  if (liveMatch) {
    return liveMatch[1]
  }
  
  return null
}

/**
 * Determine if Stripe secret key is for test or live mode
 */
function isTestMode(secretKey: string): boolean {
  if (!secretKey) return false
  return secretKey.includes('test')
}

/**
 * Build Stripe dashboard transaction URL
 * @param paymentId - Payment intent ID (starts with pi_)
 * @param publishableKey - Stripe publishable key
 * @param secretKey - Stripe secret key
 * @returns Stripe dashboard URL or null if unable to build
 */
export function buildStripeTransactionUrl(
  paymentId: string,
  publishableKey: string,
  secretKey: string
): string | null {
  // Only process Stripe payment intent IDs
  if (!paymentId || !paymentId.startsWith('pi_')) {
    return null
  }
  
  // Extract account ID from publishable key
  const accountId = extractAccountIdFromPublishableKey(publishableKey)
  if (!accountId) {
    return null
  }
  
  // Determine if test or live mode
  const isTest = isTestMode(secretKey)
  
  // Build URL
  // Test: https://dashboard.stripe.com/acct_{ACCOUNT_ID}/test/payments/{PAYMENT_ID}
  // Live: https://dashboard.stripe.com/acct_{ACCOUNT_ID}/payments/{PAYMENT_ID}
  const baseUrl = `https://dashboard.stripe.com/acct_${accountId}`
  const testPath = isTest ? '/test' : ''
  const url = `${baseUrl}${testPath}/payments/${paymentId}`
  
  return url
}

