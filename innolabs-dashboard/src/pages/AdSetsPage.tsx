import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Layers,
  Search,
  RefreshCw,
  Sparkles,
  DollarSign,
  TrendingUp,
  Target,
  Megaphone,
  Eye,
  Sliders,
  Filter,
  CheckCircle2,
  Building2,
  Tags,
  WalletCards,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { fetchAdSetsApi, AdSetItem, AdSetsSummary } from '../api/adset.api'
import { fetchFilterOptionsApi, triggerSyncNow } from '../api/dashboard.api'
import { fetchBrandsApi, BrandData } from '../api/brand.api'
import { formatCurrencyVND, formatDateVN } from '../utils/formatters'
import { AdSetDetailModal } from '../components/adset/AdSetDetailModal'
import { ExportGoogleSheetModal } from '../components/dashboard/ExportGoogleSheetModal'

export function AdSetsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const brandFromUrl = searchParams.get('brand') || ''

  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedBM, setSelectedBM] = useState('')
  const [selectedBrand, setSelectedBrand] = useState(brandFromUrl)
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedAdSetId, setSelectedAdSetId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'by_brand' | 'flat'>('by_brand')
  const [expandedBrandGroups, setExpandedBrandGroups] = useState<Record<string, boolean>>({})
  const [sortField, setSortField] = useState<
    | 'id'
    | 'total_spend'
    | 'spend_meta'
    | 'daily_budget'
    | 'clicks'
    | 'ctr'
    | 'cpc'
    | 'cpm'
    | 'results'
    | 'cost_per_result'
    | 'impressions'
    | 'reach'
    | 'adset_name'
  >('id')
  const [sortAsc, setSortAsc] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  // Date range mapping
  const dateParams = useMemo(() => {
    const today = new Date()
    const fmt = (d: Date) => d.toISOString().split('T')[0]

    if (datePreset === 'today') {
      return { start_date: fmt(today), end_date: fmt(today) }
    }
    if (datePreset === 'this_week') {
      const d = new Date(today)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(d.setDate(diff))
      return { start_date: fmt(monday), end_date: fmt(today) }
    }
    if (datePreset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start_date: fmt(firstDay), end_date: fmt(today) }
    }
    if (datePreset === 'custom') {
      const params: { start_date?: string; end_date?: string } = {}
      if (customStartDate) params.start_date = customStartDate
      if (customEndDate) params.end_date = customEndDate
      return params
    }
    return {}
  }, [datePreset, customStartDate, customEndDate])

  // Filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['dashboard-filter-options'],
    queryFn: fetchFilterOptionsApi,
  })

  // Real brands from database
  const { data: realBrands = [] } = useQuery<BrandData[]>({
    queryKey: ['brands-list'],
    queryFn: fetchBrandsApi,
  })

  // Danh sách thương hiệu hiển thị
  const brandList = useMemo(() => {
    const list: { label: string; value: string }[] = []
    const seen = new Set<string>()

    for (const b of realBrands) {
      const name = b.brand_name.trim()
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase())
        list.push({ label: name, value: name })
      }
    }

    if (filterOptions?.brands) {
      for (const b of filterOptions.brands) {
        const name = (b.value || b.label).trim()
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase())
          list.push({ label: b.label || name, value: name })
        }
      }
    }

    return list
  }, [realBrands, filterOptions?.brands])

  // Fetch Ad Sets
  const {
    data: summary = {
      total_adsets: 0,
      active_adsets: 0,
      total_spend: 0,
      spend_meta: 0,
      spend_vat: 0,
      ftf_amount: 0,
      impressions: 0,
      clicks: 0,
      messages: 0,
      leads: 0,
      results: 0,
      avg_ctr: 0,
      avg_cpc: 0,
      avg_cpa: 0,
      adsets: [],
    },
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<AdSetsSummary>({
    queryKey: [
      'adsets-list',
      dateParams.start_date,
      dateParams.end_date,
      selectedBM,
      selectedBrand,
      selectedStatus,
      search,
    ],
    queryFn: () =>
      fetchAdSetsApi({
        ...dateParams,
        bm_id: selectedBM || undefined,
        brand: selectedBrand || undefined,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: search.trim() || undefined,
      }),
  })

  // Client-side filtering & sorting
  const sortedAdSets = useMemo(() => {
    let list = [...summary.adsets]

    list.sort((a, b) => {
      let va: any = a[sortField]
      let vb: any = b[sortField]
      if (typeof va === 'string') {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortAsc ? va - vb : vb - va
    })

    return list
  }, [summary.adsets, sortField, sortAsc])

  // Pagination for flat table
  const totalPages = Math.ceil(sortedAdSets.length / pageSize) || 1
  const paginatedAdSets = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedAdSets.slice(start, start + pageSize)
  }, [sortedAdSets, currentPage, pageSize])

  // Group AdSets by Brand (Brand -> AdSets)
  const adsetsByBrand = useMemo(() => {
    const map = new Map<
      string,
      {
        brand_id: number | null
        brand_name: string
        items: AdSetItem[]
        total_spend_meta: number
        total_spend: number
        total_messages: number
        total_clicks: number
        total_impressions: number
      }
    >()

    for (const ast of sortedAdSets) {
      const bName = ast.brand_name?.trim() || 'Chưa phân Brand'
      const entry = map.get(bName) || {
        brand_id: ast.brand_id || null,
        brand_name: bName,
        items: [],
        total_spend_meta: 0,
        total_spend: 0,
        total_messages: 0,
        total_clicks: 0,
        total_impressions: 0,
      }
      if (!entry.brand_id && ast.brand_id) {
        entry.brand_id = ast.brand_id
      }
      entry.items.push(ast)
      entry.total_spend_meta += ast.spend_meta || 0
      entry.total_spend += ast.total_spend || 0
      entry.total_messages += ast.messages || 0
      entry.total_clicks += ast.clicks || 0
      entry.total_impressions += ast.impressions || 0
      map.set(bName, entry)
    }

    return Array.from(map.values()).sort((a, b) => b.total_spend_meta - a.total_spend_meta)
  }, [sortedAdSets])

  const toggleBrandGroup = (brandKey: string) => {
    setExpandedBrandGroups((prev) => ({
      ...prev,
      [brandKey]: !(prev[brandKey] ?? true),
    }))
  }

  const expandAllBrands = () => {
    const next: Record<string, boolean> = {}
    adsetsByBrand.forEach((b) => {
      next[b.brand_name] = true
    })
    setExpandedBrandGroups(next)
  }

  const collapseAllBrands = () => {
    const next: Record<string, boolean> = {}
    adsetsByBrand.forEach((b) => {
      next[b.brand_name] = false
    })
    setExpandedBrandGroups(next)
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(field === 'adset_name')
    }
    setCurrentPage(1)
  }

  const renderSortIndicator = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={11} className="text-slate-300 group-hover:text-slate-500 transition shrink-0" />
    }
    return sortAsc ? (
      <ArrowUp size={12} className="text-primary font-bold shrink-0" />
    ) : (
      <ArrowDown size={12} className="text-primary font-bold shrink-0" />
    )
  }

  const queryClient = useQueryClient()
  const handleSyncMeta = async () => {
    setIsSyncing(true)
    try {
      await triggerSyncNow()
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['adsets'] }),
        queryClient.invalidateQueries({ queryKey: ['ads-detail-list'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-spend'] }),
      ])
    } catch (e) {
      console.error(e)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Nhóm Quảng cáo (Ad Sets)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              <Layers size={13} />
              {summary.total_adsets} Nhóm
            </span>
          </div>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Phân loại theo từng Brand để kiểm soát chặt chẽ ngân sách, AdSets và chi tiết mẫu Ads Facebook.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncMeta}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-xl bg-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-button hover:bg-purple-800 disabled:opacity-50 transition cursor-pointer"
            title="Đồng bộ toàn bộ Business, Chiến dịch, Ad Sets và Quảng cáo từ Meta"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Đang đồng bộ Meta...' : 'Đồng bộ từ Meta'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-button hover:bg-emerald-700 transition"
          >
            <FileSpreadsheet size={16} />
            <span>Xuất Báo Cáo Google Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching || isSyncing}
            className="flex items-center gap-1.5 rounded-lg border border-outline bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Spend */}
        <div className="rounded-xl border border-primary/20 bg-primary-soft/40 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-primary">Tổng Chi Phí (Total Spend)</span>
          <p className="mt-1 font-mono text-lg font-bold text-ink sm:text-xl">
            {formatCurrencyVND(summary.total_spend)}
          </p>
          <span className="text-[10px] text-muted">Đã bao gồm VAT 10% & FTF 1.1%</span>
        </div>

        {/* Spend Meta */}
        <div className="rounded-xl border border-outline bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-muted">Chi phí Meta gốc</span>
          <p className="mt-1 font-mono text-lg font-bold text-slate-700 sm:text-xl">
            {formatCurrencyVND(summary.spend_meta)}
          </p>
          <span className="text-[10px] text-muted">Chưa tính thuế phí</span>
        </div>

        {/* VAT + FTF */}
        <div className="rounded-xl border border-outline bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-muted">Thuế VAT & Phí FTF</span>
          <p className="mt-1 font-mono text-lg font-bold text-amber-700 sm:text-xl">
            {formatCurrencyVND(summary.spend_vat - summary.spend_meta + summary.ftf_amount)}
          </p>
          <span className="text-[10px] text-muted">VAT: {formatCurrencyVND(summary.spend_vat - summary.spend_meta)}</span>
        </div>

        {/* Active AdSets */}
        <div className="rounded-xl border border-outline bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-muted">Số lượng Nhóm QC</span>
          <p className="mt-1 font-mono text-lg font-bold text-ink sm:text-xl">
            {summary.total_adsets} <span className="text-xs font-semibold text-emerald-600">({summary.active_adsets} Active)</span>
          </p>
          <span className="text-[10px] text-muted">Đang phân phối</span>
        </div>

        {/* Results & CPA */}
        <div className="rounded-xl border border-outline bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-muted">Tin nhắn / Leads</span>
          <p className="mt-1 font-mono text-lg font-bold text-emerald-600 sm:text-xl">
            {summary.results.toLocaleString('vi-VN')}
          </p>
          <span className="text-[10px] text-muted">
            CPA: <strong>{formatCurrencyVND(summary.avg_cpa)}</strong>
          </span>
        </div>

        {/* Clicks & CTR */}
        <div className="rounded-xl border border-outline bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-muted">Lượt Click (CTR)</span>
          <p className="mt-1 font-mono text-lg font-bold text-ink sm:text-xl">
            {summary.clicks.toLocaleString('vi-VN')}{' '}
            <span className="text-xs font-semibold text-primary">({summary.avg_ctr}%)</span>
          </p>
          <span className="text-[10px] text-muted">CPC: {formatCurrencyVND(summary.avg_cpc)}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-outline bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Date presets */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setDatePreset('all')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              datePreset === 'all' ? 'bg-white text-ink shadow-xs font-semibold' : 'text-muted hover:text-ink'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setDatePreset('today')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              datePreset === 'today' ? 'bg-white text-ink shadow-xs font-semibold' : 'text-muted hover:text-ink'
            }`}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setDatePreset('this_week')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              datePreset === 'this_week' ? 'bg-white text-ink shadow-xs font-semibold' : 'text-muted hover:text-ink'
            }`}
          >
            Tuần này
          </button>
          <button
            type="button"
            onClick={() => setDatePreset('this_month')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              datePreset === 'this_month' ? 'bg-white text-ink shadow-xs font-semibold' : 'text-muted hover:text-ink'
            }`}
          >
            Tháng này
          </button>
          <button
            type="button"
            onClick={() => setDatePreset('custom')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              datePreset === 'custom' ? 'bg-white text-ink shadow-xs font-semibold' : 'text-muted hover:text-ink'
            }`}
          >
            Tùy chọn
          </button>

          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs">
              <span className="text-muted text-[11px]">Từ</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-transparent font-medium text-slate-800 outline-none text-xs"
              />
              <span className="text-muted text-[11px]">đến</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-transparent font-medium text-slate-800 outline-none text-xs"
              />
            </div>
          )}
        </div>

        {/* Dropdowns & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* BM Select */}
          <select
            value={selectedBM}
            onChange={(e) => {
              setSelectedBM(e.target.value)
              setCurrentPage(1)
            }}
            className="field text-xs py-1.5"
          >
            <option value="">Tất cả Business Portfolio</option>
            {filterOptions?.bms?.map((bm) => (
              <option key={bm.value} value={bm.value}>
                {bm.label}
              </option>
            ))}
          </select>

          {/* Brand Select */}
          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value)
              setCurrentPage(1)
            }}
            className="field text-xs py-1.5 max-w-[200px]"
          >
            <option value="">Tất cả Thương hiệu</option>
            {brandList.map((brand) => (
              <option key={brand.value} value={brand.value}>
                {brand.label}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setCurrentPage(1)
            }}
            className="field text-xs py-1.5"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang chạy (ACTIVE)</option>
            <option value="PAUSED">Tạm dừng (PAUSED)</option>
          </select>

          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm AdSet, Campaign, ID..."
              className="field w-full pl-8 text-xs py-1.5"
            />
          </div>
        </div>
      </div>

      {/* Brand Filter Pills */}
      {brandList.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs">
          <span className="flex items-center gap-1 font-semibold text-slate-500 shrink-0 mr-1 text-[11px] uppercase tracking-wider">
            <Tags size={13} className="text-purple-600" />
            Brand:
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedBrand('')
              setCurrentPage(1)
            }}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
              selectedBrand === ''
                ? 'bg-purple-700 text-white shadow-xs font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Tất cả
          </button>

          {brandList.map((brand) => {
            const isSelected = selectedBrand.toLowerCase() === brand.value.toLowerCase()
            return (
              <button
                key={brand.value}
                type="button"
                onClick={() => {
                  setSelectedBrand(isSelected ? '' : brand.value)
                  setCurrentPage(1)
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition shrink-0 ${
                  isSelected
                    ? 'bg-purple-700 text-white font-semibold shadow-xs ring-2 ring-purple-600/30'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-800'
                }`}
              >
                <span>{brand.label}</span>
                {isSelected && (
                  <span className="size-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* View Mode Switcher: Phân chia theo Brand vs Bảng phẳng */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 rounded-xl border border-outline bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('by_brand')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              viewMode === 'by_brand'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Tags size={13} />
            <span>Phân chia theo Brand ({adsetsByBrand.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('flat')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              viewMode === 'flat'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers size={13} />
            <span>Bảng phẳng tất cả ({sortedAdSets.length})</span>
          </button>
        </div>

        {viewMode === 'by_brand' && (
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={expandAllBrands}
              className="text-purple-700 hover:text-purple-900 font-semibold"
            >
              Mở rộng tất cả
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={collapseAllBrands}
              className="text-slate-500 hover:text-slate-700 font-semibold"
            >
              Thu gọn tất cả
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: PHÂN CHIA THEO BRAND (Brand -> AdSets) */}
      {viewMode === 'by_brand' ? (
        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-xl border border-outline bg-white p-12 text-center text-muted shadow-xs">
              <RefreshCw size={24} className="animate-spin text-primary mx-auto mb-2" />
              <p>Đang tải và phân nhóm AdSets theo từng Brand...</p>
            </div>
          ) : adsetsByBrand.length === 0 ? (
            <div className="rounded-xl border border-outline bg-white p-12 text-center text-muted shadow-xs">
              Không có nhóm quảng cáo nào phù hợp với bộ lọc đã chọn
            </div>
          ) : (
            adsetsByBrand.map((group) => {
              const isExpanded = expandedBrandGroups[group.brand_name] ?? true
              const cpr = group.total_messages > 0 ? group.total_spend_meta / group.total_messages : 0

              return (
                <div
                  key={group.brand_name}
                  className="rounded-xl border border-outline bg-white shadow-xs overflow-hidden transition"
                >
                  {/* Brand Header */}
                  <div
                    onClick={() => toggleBrandGroup(group.brand_name)}
                    className="flex flex-wrap items-center justify-between gap-3 bg-purple-50/50 p-4 border-b border-purple-100 cursor-pointer hover:bg-purple-50/80 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleBrandGroup(group.brand_name)
                        }}
                        className="rounded-lg p-1 text-purple-600 hover:bg-purple-200/60 transition"
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>

                      <div className="grid size-8 place-items-center rounded-lg bg-purple-700 text-white font-bold text-xs shrink-0 shadow-2xs">
                        <Tags size={15} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline text-base font-bold text-ink truncate">
                            {group.brand_name}
                          </h3>
                          <span className="rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-xs font-bold">
                            {group.items.length} Nhóm QC
                          </span>
                        </div>
                        <p className="text-[11px] text-muted">
                          Chiếm {((group.total_spend_meta / (summary.spend_meta || 1)) * 100).toFixed(1)}% ngân sách toàn hệ thống
                        </p>
                      </div>
                    </div>

                    {/* Right side summary & link */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="text-right">
                        <span className="text-[10px] text-muted block uppercase font-sans">Chi tiêu Meta</span>
                        <span className="font-bold text-ink text-sm">
                          {formatCurrencyVND(group.total_spend_meta)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-muted block uppercase font-sans">Tin nhắn</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          {group.total_messages.toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-muted block uppercase font-sans">Giá/mess</span>
                        <span className="font-semibold text-purple-800">
                          {cpr > 0 ? formatCurrencyVND(cpr) : '-'}
                        </span>
                      </div>

                      {group.brand_id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/brands/${group.brand_id}`)
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-800 transition shadow-2xs"
                          title="Vào Không gian Cây Brand ➔ AdSets ➔ Ads con"
                        >
                          <span>Cây Brand ➔ Ads con</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AdSets Table under this Brand */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-semibold text-muted uppercase border-b border-outline">
                          <tr>
                            <th className="px-4 py-2.5">Chiến dịch / Nhóm QC</th>
                            <th className="px-3 py-2.5">Trạng thái</th>
                            <th className="px-3 py-2.5">Tài khoản & BM</th>
                            <th className="px-3 py-2.5 text-right">Ngân sách</th>
                            <th className="px-3 py-2.5 text-right font-bold text-ink">Spend Meta</th>
                            <th className="px-3 py-2.5 text-right font-bold text-emerald-800">Total Spend</th>
                            <th className="px-3 py-2.5 text-right">Tin nhắn (CPA)</th>
                            <th className="px-3 py-2.5 text-right">Clicks (CTR)</th>
                            <th className="px-3 py-2.5 text-right">CPC</th>
                            <th className="px-3 py-2.5 text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline text-[11px]">
                          {group.items.map((ast) => (
                            <tr key={ast.id} className="hover:bg-purple-50/20 transition">
                              <td className="px-4 py-2.5 max-w-xs">
                                <p className="font-semibold text-ink line-clamp-1" title={ast.adset_name}>
                                  {ast.adset_name}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted">
                                  <span className="font-mono">ID: {ast.meta_adset_id}</span>
                                  <span>•</span>
                                  <span className="truncate">{ast.campaign_name}</span>
                                </div>
                              </td>

                              <td className="px-3 py-2.5">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    ast.status === 'ACTIVE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span
                                    className={`size-1.5 rounded-full ${
                                      ast.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                                    }`}
                                  />
                                  {ast.status}
                                </span>
                              </td>

                              <td className="px-3 py-2.5 max-w-[160px]">
                                <p className="truncate text-slate-700 font-medium">{ast.account_name}</p>
                                <p className="text-[10px] text-muted truncate">{ast.business_name}</p>
                              </td>

                              <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                                {ast.daily_budget && ast.daily_budget > 0
                                  ? formatCurrencyVND(ast.daily_budget)
                                  : 'CBO'}
                              </td>

                              <td className="px-3 py-2.5 text-right font-mono font-bold text-ink">
                                {formatCurrencyVND(ast.spend_meta || 0)}
                              </td>

                              <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-900">
                                {formatCurrencyVND(ast.total_spend || 0)}
                              </td>

                              <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">
                                {ast.results.toLocaleString('vi-VN')}
                                {ast.cost_per_result > 0 && (
                                  <span className="text-[10px] text-purple-700 block font-normal">
                                    {formatCurrencyVND(ast.cost_per_result)}
                                  </span>
                                )}
                              </td>

                              <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                                {ast.clicks.toLocaleString('vi-VN')}{' '}
                                <span className="text-[10px] text-emerald-600 font-semibold">({ast.ctr}%)</span>
                              </td>

                              <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                                {ast.cpc > 0 ? formatCurrencyVND(ast.cpc) : '-'}
                              </td>

                              <td className="px-3 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/adsets/${ast.id}`)}
                                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-purple-700 hover:text-white transition shadow-2xs"
                                  title="Xem chi tiết AdSet & Ads con"
                                >
                                  <Eye size={11} />
                                  <span>Chi tiết</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* VIEW 2: FLAT TABLE */
        <div className="rounded-xl border border-outline bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-muted uppercase border-b border-outline">
                <tr>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition group select-none"
                    onClick={() => handleSort('id')}
                    title="Bấm để sắp xếp theo Mới nhất / Cũ nhất"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Chiến dịch / Nhóm QC</span>
                      {sortField === 'id' ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                          {sortAsc ? 'Cũ nhất' : 'Mới nhất'}
                        </span>
                      ) : (
                        renderSortIndicator('id')
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3">BM / Tài khoản</th>
                  <th className="px-3 py-3">Brand</th>
                  <th
                    className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition group select-none"
                    onClick={() => handleSort('daily_budget')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Ngân sách</span>
                      {renderSortIndicator('daily_budget')}
                    </div>
                  </th>
                  <th
                    className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition group select-none"
                    onClick={() => handleSort('spend_meta')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Spend Meta</span>
                      {renderSortIndicator('spend_meta')}
                    </div>
                  </th>
                  <th
                    className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition group select-none"
                    onClick={() => handleSort('total_spend')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-bold text-ink">Total Spend</span>
                      {renderSortIndicator('total_spend')}
                    </div>
                  </th>
                  <th
                    className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition group select-none"
                    onClick={() => handleSort('results')}
                    title="Bấm để sắp xếp theo Kết quả (hoặc giữ để so sánh CPA)"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Kết quả (CPA)</span>
                      {renderSortIndicator('results')}
                    </div>
                  </th>
                  <th
                    className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition group select-none"
                    onClick={() => handleSort('clicks')}
                    title="Bấm để sắp xếp theo Lượt Click (CTR)"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Clicks (CTR)</span>
                      {renderSortIndicator('clicks')}
                    </div>
                  </th>
                  <th
                    className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition group select-none"
                    onClick={() => handleSort('cpc')}
                    title="Bấm để so sánh CPC tăng/giảm"
                  >
                    <div className="flex items-center justify-end gap-1 text-primary">
                      <span>CPC</span>
                      {renderSortIndicator('cpc')}
                    </div>
                  </th>
                  <th
                    className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition group select-none"
                    onClick={() => handleSort('cpm')}
                    title="Bấm để so sánh CPM tăng/giảm"
                  >
                    <div className="flex items-center justify-end gap-1 text-primary">
                      <span>CPM</span>
                      {renderSortIndicator('cpm')}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline">
                {isLoading ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center text-muted">
                      <RefreshCw size={24} className="animate-spin text-primary mx-auto mb-2" />
                      <p>Đang tải danh sách Nhóm Quảng cáo...</p>
                    </td>
                  </tr>
                ) : paginatedAdSets.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-center text-muted">
                      Không có nhóm quảng cáo nào phù hợp với bộ lọc đã chọn
                    </td>
                  </tr>
                ) : (
                  paginatedAdSets.map((adset) => (
                    <tr key={adset.id} className="hover:bg-slate-50/80 transition group">
                      {/* Name & ID */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <p
                              className="font-semibold text-ink truncate cursor-pointer hover:text-primary transition"
                              title={adset.adset_name}
                              onClick={() => navigate(`/adsets/${adset.id}`)}
                            >
                              {adset.adset_name}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted">
                              <span className="font-mono">ID: {adset.meta_adset_id}</span>
                              <span>•</span>
                              <span className="truncate" title={adset.campaign_name}>
                                {adset.campaign_name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            adset.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              adset.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {adset.status}
                        </span>
                      </td>

                      {/* BM & Account */}
                      <td className="px-3 py-3 max-w-[160px]">
                        <p className="truncate text-slate-800 font-medium" title={adset.account_name}>
                          {adset.account_name}
                        </p>
                        <p className="text-[10px] text-muted truncate" title={adset.business_name}>
                          {adset.business_name}
                        </p>
                      </td>

                      {/* Brand */}
                      <td className="px-3 py-3">
                        {adset.brand_name ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (adset.brand_id) {
                                navigate(`/brands/${adset.brand_id}`)
                              } else {
                                setSelectedBrand(adset.brand_name)
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
                          >
                            <Tags size={11} />
                            <span>{adset.brand_name}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Chưa gán</span>
                        )}
                      </td>

                      {/* Daily Budget */}
                      <td className="px-3 py-3 text-right font-mono text-slate-800">
                        {adset.daily_budget && adset.daily_budget > 0 ? (
                          <span>{formatCurrencyVND(adset.daily_budget)}</span>
                        ) : (
                          <span className="text-[10px] text-muted italic">CBO (Chiến dịch)</span>
                        )}
                      </td>

                      {/* Spend Meta */}
                      <td className="px-3 py-3 text-right font-mono text-slate-600">
                        {formatCurrencyVND(adset.spend_meta)}
                      </td>

                      {/* Total Spend */}
                      <td className="px-3 py-3 text-right font-mono font-bold text-ink">
                        {formatCurrencyVND(adset.total_spend)}
                      </td>

                      {/* Results & CPA */}
                      <td className="px-3 py-3 text-right font-mono">
                        <span className="font-bold text-emerald-700">{adset.results.toLocaleString('vi-VN')}</span>
                        {adset.cost_per_result > 0 && (
                          <p className="text-[10px] text-muted">
                            {formatCurrencyVND(adset.cost_per_result)}
                          </p>
                        )}
                      </td>

                      {/* Clicks & CTR */}
                      <td className="px-3 py-3 text-right font-mono">
                        <span className="text-slate-700">{adset.clicks.toLocaleString('vi-VN')}</span>
                        <p className="text-[10px] text-primary font-semibold">{adset.ctr}%</p>
                      </td>

                      {/* CPC */}
                      <td className="px-3 py-3 text-right font-mono text-slate-800">
                        {adset.cpc > 0 ? (
                          <span className="font-medium text-slate-700">{formatCurrencyVND(adset.cpc)}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* CPM */}
                      <td className="px-3 py-3 text-right font-mono text-slate-800">
                        {adset.cpm > 0 ? (
                          <span className="font-medium text-slate-700">{formatCurrencyVND(adset.cpm)}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/adsets/${adset.id}`)}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-primary hover:text-white transition shadow-2xs"
                          title="Xem chi tiết AdSet & Ads (Drill-down)"
                        >
                          <Eye size={12} />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* GRAND TOTAL ROW */}
              {summary.adsets.length > 0 && (
                <tfoot className="border-t-2 border-slate-300 bg-slate-100/90 font-mono text-[11px] font-bold text-ink">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 font-sans text-xs uppercase tracking-wider">
                      Tổng cộng ({summary.adsets.length} Ad Sets sau filter)
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {formatCurrencyVND(summary.spend_meta)}
                    </td>
                    <td className="px-3 py-3 text-right text-ink font-extrabold text-xs">
                      {formatCurrencyVND(summary.total_spend)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-700">
                      {summary.results.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {summary.clicks.toLocaleString('vi-VN')}{' '}
                      <span className="text-primary font-semibold">({summary.avg_ctr}%)</span>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {summary.avg_cpc > 0 ? formatCurrencyVND(summary.avg_cpc) : '-'}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      -
                    </td>
                    <td className="px-3 py-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-outline px-4 py-3 text-xs text-muted">
              <span>
                Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> (Hiển thị {paginatedAdSets.length} / {sortedAdSets.length} nhóm)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded border border-outline px-2.5 py-1 hover:bg-slate-50 disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded border border-outline px-2.5 py-1 hover:bg-slate-50 disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAdSetId !== null && (
        <AdSetDetailModal
          adsetId={selectedAdSetId}
          onClose={() => setSelectedAdSetId(null)}
        />
      )}

      {/* Modal Xuất Báo Cáo Google Sheet cho Ad Sets */}
      <ExportGoogleSheetModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        items={summary.adsets.map((ad) => ({
          id: ad.id,
          name: ad.adset_name,
          spend_meta: ad.spend_meta || 0,
          impressions: ad.impressions || 0,
          reach: ad.reach || 0,
          clicks: ad.clicks || 0,
          messages: ad.messages || ad.results || 0,
        }))}
        brandName={selectedBrand || 'Tất cả thương hiệu'}
        startDate={dateParams.start_date}
        endDate={dateParams.end_date}
        reportType="adset"
      />
    </div>
  )
}

export default AdSetsPage
