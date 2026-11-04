export interface SpendItem {
  id: string
  date: string // YYYY-MM-DD
  bmId: string
  bmName: string
  accountId: string
  accountName: string
  campaignId: string
  campaignName: string
  brandId?: number | null
  brand: string
  currency: string
  spendMeta: number
  vatRate: number // default 0.10
  spendVat: number // spendMeta * (1 + vatRate)
  ftfRate: number // default 0.011
  ftfAmount: number // spendVat * ftfRate
  totalSpend: number // spendVat + ftfAmount
  lastSyncedAt: string
}

export interface DashboardSummary {
  spendMeta: number
  vatRate?: number
  spendVat: number
  ftfRate?: number
  ftfAmount: number
  totalSpend: number
  totalBms: number
  totalAccounts: number
  totalBrands: number
  dateRangeText: string
  lastSyncedAt: string
}

export type FilterPreset = 'all' | 'today' | 'this_week' | 'this_month' | 'custom'

export interface DashboardFilterState {
  preset: FilterPreset
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  bmIds: string[]
  accountIds: string[]
  brandNames: string[]
}

export type GroupByOption = 'none' | 'bm' | 'account' | 'brand'

export type CardViewLevel = 'bm' | 'account' | 'brand'

export type MetricType = 'totalSpend' | 'spendMeta' | 'spendVat' | 'ftfAmount'

export interface CardItemData {
  id: string
  name: string
  subtitle?: string
  spendMeta: number
  spendVat: number
  ftfAmount: number
  totalSpend: number
  contributionRate: number // percentage 0 - 100
  accountCount?: number
  currency: string
  lastSyncedAt: string
  status?: 'active' | 'inactive' | 'paused'
}

export interface GroupedRowData {
  id: string
  bmName: string
  accountName: string
  brandName: string
  campaignName?: string
  currency: string
  spendMeta: number
  spendVat: number
  ftfAmount: number
  totalSpend: number
  subItemCount?: number
}

export interface SpendTrendPoint {
  date: string // YYYY-MM-DD
  displayDate: string // DD/MM or DD/MM/YYYY
  spendMeta: number
  spendVat: number
  ftfAmount: number
  totalSpend: number
}

export interface FilterOption {
  value: string
  label: string
  metaId?: string
  category?: string
}

export interface SortState {
  field: string
  direction: 'asc' | 'desc'
}


export interface DashboardMetric {
  label: string
  value: string
  change: number
  helper: string
}

export interface SpendPoint {
  date: string
  value: number
}

export interface BrandSpend {
  name: string
  value: number
  percent: number
  color: string
}

export interface AccountSummary {
  id: string
  name: string
  brand: string
  spent: string
  balance: string
  status: 'active' | 'warning' | 'paused'
}