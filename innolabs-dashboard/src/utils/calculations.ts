/**
 * Meta Ads Spend Calculation rules according to Section 7 of Specification:
 * VAT Amount = Spend (Meta) * VAT Rate (default 10%)
 * Spend (VAT Included) = Spend (Meta) + VAT Amount
 * FTF Amount = Spend (VAT Included) * FTF Rate (default 1.1%)
 * Total Spend = Spend (VAT Included) + FTF Amount
 */

export const DEFAULT_VAT_RATE = 0.10 // 10%
export const DEFAULT_FTF_RATE = 0.011 // 1.1%

export interface ComputedSpend {
  spendMeta: number
  vatAmount: number
  spendVat: number
  ftfAmount: number
  totalSpend: number
}

export function computeSpend(
  spendMeta: number,
  vatRate: number = DEFAULT_VAT_RATE,
  ftfRate: number = DEFAULT_FTF_RATE
): ComputedSpend {
  const safeSpendMeta = Math.max(0, spendMeta || 0)
  const vatAmount = safeSpendMeta * vatRate
  const spendVat = safeSpendMeta + vatAmount
  const ftfAmount = spendVat * ftfRate
  const totalSpend = spendVat + ftfAmount

  return {
    spendMeta: Math.round(safeSpendMeta),
    vatAmount: Math.round(vatAmount),
    spendVat: Math.round(spendVat),
    ftfAmount: Math.round(ftfAmount),
    totalSpend: Math.round(totalSpend),
  }
}
