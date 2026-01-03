/**
 * Hardcoded Stripe account ID for dashboard URLs
 */
const STRIPE_ACCOUNT_ID = '1SixG9GWfInJByRy'

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
 * @param secretKey - Stripe secret key (used to determine test/live mode)
 * @returns Stripe dashboard URL or null if unable to build
 */
export function buildStripeTransactionUrl(
  paymentId: string,
  secretKey: string
): string | null {
  // Only process Stripe payment intent IDs
  if (!paymentId || !paymentId.startsWith('pi_')) {
    return null
  }
  
  // Determine if test or live mode
  const isTest = isTestMode(secretKey)
  
  // Build URL
  // Test: https://dashboard.stripe.com/acct_{ACCOUNT_ID}/test/payments/{PAYMENT_ID}
  // Live: https://dashboard.stripe.com/acct_{ACCOUNT_ID}/payments/{PAYMENT_ID}
  const baseUrl = `https://dashboard.stripe.com/acct_${STRIPE_ACCOUNT_ID}`
  const testPath = isTest ? '/test' : ''
  const url = `${baseUrl}${testPath}/payments/${paymentId}`
  
  return url
}

