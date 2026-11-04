import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  DashboardFilterState,
  FilterPreset,
  GroupByOption,
  CardViewLevel,
  CardItemData,
  GroupedRowData,
  SpendTrendPoint,
  SortState,
} from '../types/dashboard'
import { getPresetDateRange } from '../utils/date'
import { fetchDashboardSpend, triggerSyncNow, fetchFilterOptions } from '../api/dashboard.api'

export function useDashboardSpend() {
  const queryClient = useQueryClient()

  // Initialize with 'all' so all real database data is displayed immediately
  const initialPreset: FilterPreset = 'all'
  const initialRange = getPresetDateRange(initialPreset)

  const [filters, setFilters] = useState<DashboardFilterState>({
    preset: initialPreset,
    startDate: initialRange.startDate,
    endDate: initialRange.endDate,
    bmIds: [],
    accountIds: [],
    brandNames: [],
  })

  // List View controls
  const [groupBy, setGroupBy] = useState<GroupByOption>('none')
  const [sort, setSort] = useState<SortState>({ field: 'totalSpend', direction: 'desc' })
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // Card View level: 'bm' | 'account' | 'brand'
  const [cardLevel, setCardLevel] = useState<CardViewLevel>('bm')

  // Main spend query
  const spendQuery = useQuery({
    queryKey: ['dashboard-spend', filters],
    queryFn: () => fetchDashboardSpend(filters),
    staleTime: 60 * 1000,
  })

  // Filter options query
  const optionsQuery = useQuery({
    queryKey: ['dashboard-filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000,
  })

  // Sync Now mutation
  const syncMutation = useMutation({
    mutationFn: triggerSyncNow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-spend'] })
    },
  })

  // Handler to update preset
  const handleSelectPreset = (preset: FilterPreset) => {
    if (preset === 'custom') {
      setFilters((prev) => ({ ...prev, preset: 'custom' }))
    } else {
      const range = getPresetDateRange(preset)
      setFilters((prev) => ({
        ...prev,
        preset,
        startDate: range.startDate,
        endDate: range.endDate,
      }))
    }
    setPage(1)
  }

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    setFilters((prev) => ({
      ...prev,
      preset: 'custom',
      startDate,
      endDate,
    }))
    setPage(1)
  }

  const handleToggleBm = (bmId: string) => {
    setFilters((prev) => {
      const exists = prev.bmIds.includes(bmId)
      return {
        ...prev,
        bmIds: exists ? prev.bmIds.filter((id) => id !== bmId) : [...prev.bmIds, bmId],
      }
    })
    setPage(1)
  }

  const handleToggleAccount = (accId: string) => {
    setFilters((prev) => {
      const exists = prev.accountIds.includes(accId)
      return {
        ...prev,
        accountIds: exists ? prev.accountIds.filter((id) => id !== accId) : [...prev.accountIds, accId],
      }
    })
    setPage(1)
  }

  const handleToggleBrand = (brand: string) => {
    setFilters((prev) => {
      const exists = prev.brandNames.includes(brand)
      return {
        ...prev,
        brandNames: exists ? prev.brandNames.filter((b) => b !== brand) : [...prev.brandNames, brand],
      }
    })
    setPage(1)
  }

  const handleResetFilters = () => {
    const range = getPresetDateRange('all')
    setFilters({
      preset: 'all',
      startDate: range.startDate,
      endDate: range.endDate,
      bmIds: [],
      accountIds: [],
      brandNames: [],
    })
    setPage(1)
  }

  const items = spendQuery.data?.items || []
  const summary = spendQuery.data?.summary
  const totalSpendSum = summary?.totalSpend || 1 // Avoid divide by 0

  // 1. Grouped and sorted list for List View (Section 6.2)
  const processedRows = useMemo(() => {
    if (items.length === 0) return []

    if (groupBy === 'none') {
      // Raw detail items
      const mapped: GroupedRowData[] = items.map((item) => ({
        id: item.id,
        bmName: item.bmName,
        accountName: item.accountName,
        brandName: item.brand,
        campaignName: item.campaignName,
        currency: item.currency,
        spendMeta: item.spendMeta,
        spendVat: item.spendVat,
        ftfAmount: item.ftfAmount,
        totalSpend: item.totalSpend,
      }))

      return sortRows(mapped, sort)
    }

    if (groupBy === 'bm') {
      const map = new Map<string, GroupedRowData>()
      for (const it of items) {
        const key = it.bmId
        const existing = map.get(key)
        if (!existing) {
          map.set(key, {
            id: key,
            bmName: it.bmName,
            accountName: 'Toàn bộ Accounts',
            brandName: 'Nhiều Brand',
            currency: it.currency,
            spendMeta: it.spendMeta,
            spendVat: it.spendVat,
            ftfAmount: it.ftfAmount,
            totalSpend: it.totalSpend,
            subItemCount: 1,
          })
        } else {
          existing.spendMeta += it.spendMeta
          existing.spendVat += it.spendVat
          existing.ftfAmount += it.ftfAmount
          existing.totalSpend += it.totalSpend
          existing.subItemCount = (existing.subItemCount || 0) + 1
        }
      }
      return sortRows(Array.from(map.values()), sort)
    }

    if (groupBy === 'account') {
      const map = new Map<string, GroupedRowData>()
      for (const it of items) {
        const key = it.accountId
        const existing = map.get(key)
        if (!existing) {
          map.set(key, {
            id: key,
            bmName: it.bmName,
            accountName: it.accountName,
            brandName: it.brand,
            currency: it.currency,
            spendMeta: it.spendMeta,
            spendVat: it.spendVat,
            ftfAmount: it.ftfAmount,
            totalSpend: it.totalSpend,
            subItemCount: 1,
          })
        } else {
          existing.spendMeta += it.spendMeta
          existing.spendVat += it.spendVat
          existing.ftfAmount += it.ftfAmount
          existing.totalSpend += it.totalSpend
          existing.subItemCount = (existing.subItemCount || 0) + 1
        }
      }
      return sortRows(Array.from(map.values()), sort)
    }

    if (groupBy === 'brand') {
      const map = new Map<string, GroupedRowData>()
      for (const it of items) {
        const key = it.brand || 'Unbranded'
        const existing = map.get(key)
        if (!existing) {
          map.set(key, {
            id: key,
            bmName: 'Nhiều BM',
            accountName: 'Nhiều Account',
            brandName: key,
            currency: it.currency,
            spendMeta: it.spendMeta,
            spendVat: it.spendVat,
            ftfAmount: it.ftfAmount,
            totalSpend: it.totalSpend,
            subItemCount: 1,
          })
        } else {
          existing.spendMeta += it.spendMeta
          existing.spendVat += it.spendVat
          existing.ftfAmount += it.ftfAmount
          existing.totalSpend += it.totalSpend
          existing.subItemCount = (existing.subItemCount || 0) + 1
        }
      }
      return sortRows(Array.from(map.values()), sort)
    }

    return []
  }, [items, groupBy, sort])

  // Paginated slice
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return processedRows.slice(start, start + pageSize)
  }, [processedRows, page, pageSize])

  const totalPages = Math.ceil(processedRows.length / pageSize) || 1

  // 2. Card View data according to cardLevel (Section 6.3)
  const cardItems = useMemo<CardItemData[]>(() => {
    if (items.length === 0) return []

    if (cardLevel === 'bm') {
      const map = new Map<string, { bmName: string; meta: number; vat: number; ftf: number; total: number; accounts: Set<string>; lastSynced: string; currency: string }>()
      for (const it of items) {
        let entry = map.get(it.bmId)
        if (!entry) {
          entry = {
            bmName: it.bmName,
            meta: 0,
            vat: 0,
            ftf: 0,
            total: 0,
            accounts: new Set<string>(),
            lastSynced: it.lastSyncedAt,
            currency: it.currency,
          }
          map.set(it.bmId, entry)
        }
        entry.meta += it.spendMeta
        entry.vat += it.spendVat
        entry.ftf += it.ftfAmount
        entry.total += it.totalSpend
        entry.accounts.add(it.accountId)
      }

      return Array.from(map.entries()).map(([bmId, d]) => ({
        id: bmId,
        name: d.bmName,
        subtitle: `BM ID: ${bmId}`,
        spendMeta: d.meta,
        spendVat: d.vat,
        ftfAmount: d.ftf,
        totalSpend: d.total,
        contributionRate: (d.total / totalSpendSum) * 100,
        accountCount: d.accounts.size,
        currency: d.currency,
        lastSyncedAt: d.lastSynced,
      })).sort((a, b) => b.totalSpend - a.totalSpend)
    }

    if (cardLevel === 'account') {
      const map = new Map<string, { accountName: string; bmName: string; meta: number; vat: number; ftf: number; total: number; lastSynced: string; currency: string }>()
      for (const it of items) {
        let entry = map.get(it.accountId)
        if (!entry) {
          entry = {
            accountName: it.accountName,
            bmName: it.bmName,
            meta: 0,
            vat: 0,
            ftf: 0,
            total: 0,
            lastSynced: it.lastSyncedAt,
            currency: it.currency,
          }
          map.set(it.accountId, entry)
        }
        entry.meta += it.spendMeta
        entry.vat += it.spendVat
        entry.ftf += it.ftfAmount
        entry.total += it.totalSpend
      }

      return Array.from(map.entries()).map(([accId, d]) => ({
        id: accId,
        name: d.accountName,
        subtitle: `${d.bmName} • ${accId}`,
        spendMeta: d.meta,
        spendVat: d.vat,
        ftfAmount: d.ftf,
        totalSpend: d.total,
        contributionRate: (d.total / totalSpendSum) * 100,
        currency: d.currency,
        lastSyncedAt: d.lastSynced,
      })).sort((a, b) => b.totalSpend - a.totalSpend)
    }

    if (cardLevel === 'brand') {
      const map = new Map<string, { brandName: string; meta: number; vat: number; ftf: number; total: number; lastSynced: string; currency: string }>()
      for (const it of items) {
        const brandKey = it.brand || 'Khác'
        let entry = map.get(brandKey)
        if (!entry) {
          entry = {
            brandName: brandKey,
            meta: 0,
            vat: 0,
            ftf: 0,
            total: 0,
            lastSynced: it.lastSyncedAt,
            currency: it.currency,
          }
          map.set(brandKey, entry)
        }
        entry.meta += it.spendMeta
        entry.vat += it.spendVat
        entry.ftf += it.ftfAmount
        entry.total += it.totalSpend
      }

      return Array.from(map.entries()).map(([brandKey, d]) => ({
        id: brandKey,
        name: d.brandName,
        subtitle: 'Thương hiệu',
        spendMeta: d.meta,
        spendVat: d.vat,
        ftfAmount: d.ftf,
        totalSpend: d.total,
        contributionRate: (d.total / totalSpendSum) * 100,
        currency: d.currency,
        lastSyncedAt: d.lastSynced,
      })).sort((a, b) => b.totalSpend - a.totalSpend)
    }

    return []
  }, [items, cardLevel, totalSpendSum])

  // 3. Trends over time (Section 6.4)
  const dailyTrends = useMemo<SpendTrendPoint[]>(() => {
    if (items.length === 0) return []
    const map = new Map<string, SpendTrendPoint>()

    for (const it of items) {
      const existing = map.get(it.date)
      if (!existing) {
        const parts = it.date.split('-')
        const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : it.date
        map.set(it.date, {
          date: it.date,
          displayDate,
          spendMeta: it.spendMeta,
          spendVat: it.spendVat,
          ftfAmount: it.ftfAmount,
          totalSpend: it.totalSpend,
        })
      } else {
        existing.spendMeta += it.spendMeta
        existing.spendVat += it.spendVat
        existing.ftfAmount += it.ftfAmount
        existing.totalSpend += it.totalSpend
      }
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [items])

  return {
    filters,
    setFilters,
    handleSelectPreset,
    handleCustomDateChange,
    handleToggleBm,
    handleToggleAccount,
    handleToggleBrand,
    handleResetFilters,
    options: optionsQuery.data || { bms: [], accounts: [], brands: [] },
    isLoading: spendQuery.isLoading,
    isRefetching: spendQuery.isRefetching,
    refetch: spendQuery.refetch,
    syncMutation,
    summary,
    // List View props
    groupBy,
    setGroupBy,
    sort,
    setSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    processedRows,
    paginatedRows,
    totalPages,
    // Card View props
    cardLevel,
    setCardLevel,
    cardItems,
    // Trends
    dailyTrends,
  }
}

function sortRows(rows: GroupedRowData[], sort: SortState): GroupedRowData[] {
  return [...rows].sort((a, b) => {
    let aVal: any = (a as any)[sort.field]
    let bVal: any = (b as any)[sort.field]

    if (typeof aVal === 'string') {
      return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }

    aVal = Number(aVal) || 0
    bVal = Number(bVal) || 0
    return sort.direction === 'asc' ? aVal - bVal : bVal - aVal
  })
}
