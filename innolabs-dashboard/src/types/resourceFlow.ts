export interface ResourceFlowRow {
  id: string
  businessManager: string
  account: string
  brand: string
  brandColor: string
  currency: 'VND' | 'USD'
  metaSpend: number
  vatIncludedSpend: number
  ftf: number
  totalSpend: number
}
