'use client'

import { useCurrency } from '@/lib/currency/context'

interface CurrencyTextProps {
  /**
   * Amount in base currency (INR)
   */
  amount: number
}

export default function CurrencyText({ amount }: CurrencyTextProps) {
  const { formatPrice, convertPrice } = useCurrency()
  const converted = convertPrice(amount)

  return <>{formatPrice(converted)}</>
}


