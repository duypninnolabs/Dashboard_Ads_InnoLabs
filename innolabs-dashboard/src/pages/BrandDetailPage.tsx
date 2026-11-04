import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building2,
  Tags,
  Layers,
  Megaphone,
  RefreshCw,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Calendar,
  Search,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Clock,
  Eye,
  Check,
  Copy,
} from 'lucide-react'
import { fetchBrandByIdApi, fetchBrandsApi, BrandData } from '../api/brand.api'
import { fetchAdSetsApi, AdSetItem } from '../api/adset.api'
import { fetchAdsDetailListApi, AdDetailItem } from '../api/ads-detail.api'
import { triggerSyncNow } from '../api/dashboard.api'
import { formatCurrencyVND, formatDateVN, formatNumber } from '../utils/formatters'
import { ExportGoogleSheetModal } from '../components/dashboard/ExportGoogleSheetModal'

export function BrandDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const brandId = Number(id)

  const [activeTab, setActiveTab] = useState<'hierarchy' | 'adsets' | 'ads'>('hierarchy')
  const [expandedAdSets, setExpandedAdSets] = useState<Record<string | number, boolean>>({})
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 1. Fetch Brand info
  const { data: brand, isLoading: isBrandLoading } = useQuery({
    queryKey: ['brand-detail', brandId],
    queryFn: async () => {
      if (!brandId) return null
      // Try direct API first
      const item = await fetchBrandByIdApi(brandId)
      if (item) return item
      // Fallback from list
      const list = await fetchBrandsApi()
      return list.find((b) => b.id === brandId) || null
    },
    enabled: !isNaN(brandId) && brandId > 0,
  })

  const brandName = brand?.brand_name || ''

  // 2. Fetch AdSets of this Brand
  const {
    data: adsetsData,
    isLoading: isAdsetsLoading,
    refetch: refetchAdsets,
  } = useQuery({
    queryKey: ['adsets-brand', brandName],
    queryFn: () =>
      fetchAdSetsApi({
        brand: brandName || undefined,
        brand_id: brandId ? String(brandId) : undefined,
      }),
    enabled: Boolean(brandName),
  })

  // 3. Fetch Ads of this Brand
  const {
    data: adsData,
    isLoading: isAdsLoading,
    refetch: refetchAds,
  } = useQuery({
    queryKey: ['ads-brand', brandName],
    queryFn: () =>
      fetchAdsDetailListApi({
        brand: brandName || undefined,
      }),
    enabled: Boolean(brandName),
  })

  const rawAdSets = adsetsData?.adsets || []
  const rawAds = adsData?.ads || []

  // Group Ads under their respective AdSet
  const adsByAdSet = useMemo(() => {
    const map = new Map<string, AdDetailItem[]>()
    rawAds.forEach((ad) => {
      // Key can be numeric adset_id or string meta_adset_id
      const numKey = String(ad.adset_id)
      const metaKey = ad.meta_adset_id ? String(ad.meta_adset_id) : ''

      if (numKey && numKey !== '0') {
        const arr = map.get(numKey) || []
        arr.push(ad)
        map.set(numKey, arr)
      }
      if (metaKey && metaKey !== numKey) {
        const arr = map.get(metaKey) || []
        arr.push(ad)
        map.set(metaKey, arr)
      }
    })
    return map
  }, [rawAds])

  // Group Ads under their respective Campaign (fallback nếu adset chưa map trực tiếp)
  const adsByCampaign = useMemo(() => {
    const map = new Map<string, AdDetailItem[]>()
    rawAds.forEach((ad) => {
      const campId = String(ad.campaign_id || '')
      const metaCampId = ad.meta_campaign_id ? String(ad.meta_campaign_id) : ''
      if (campId && campId !== '0') {
        const arr = map.get(campId) || []
        arr.push(ad)
        map.set(campId, arr)
      }
      if (metaCampId && metaCampId !== campId) {
        const arr = map.get(metaCampId) || []
        arr.push(ad)
        map.set(metaCampId, arr)
      }
    })
    return map
  }, [rawAds])

  // Filter AdSets by search and status
  const filteredAdSets = useMemo(() => {
    return rawAdSets.filter((ast) => {
      if (selectedStatus !== 'ALL' && ast.status !== selectedStatus) {
        return false
      }
      if (search) {
        const q = search.toLowerCase()
        const matchName = ast.adset_name.toLowerCase().includes(q)
        const matchMeta = ast.meta_adset_id.toLowerCase().includes(q)
        // Check if any child ad matches
        const childs = adsByAdSet.get(String(ast.id)) || adsByAdSet.get(String(ast.meta_adset_id)) || []
        const matchChild = childs.some(
          (ad) =>
            ad.ad_name.toLowerCase().includes(q) ||
            (ad.post_message && ad.post_message.toLowerCase().includes(q)) ||
            (ad.post_id && ad.post_id.includes(q))
        )
        return matchName || matchMeta || matchChild
      }
      return true
    })
  }, [rawAdSets, selectedStatus, search, adsByAdSet])

  // Filter Ads directly for the Ads tab
  const filteredAds = useMemo(() => {
    return rawAds.filter((ad) => {
      if (selectedStatus !== 'ALL' && ad.status !== selectedStatus) {
        return false
      }
      if (search) {
        const q = search.toLowerCase()
        return (
          ad.ad_name.toLowerCase().includes(q) ||
          ad.meta_ad_id.toLowerCase().includes(q) ||
          (ad.post_id && ad.post_id.toLowerCase().includes(q)) ||
          (ad.post_message && ad.post_message.toLowerCase().includes(q)) ||
          (ad.adset_name && ad.adset_name.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [rawAds, selectedStatus, search])

  // Rollup KPI figures for this Brand
  const brandKPI = useMemo(() => {
    const totalSpendMeta = rawAds.reduce((acc, a) => acc + (a.spend_meta || 0), 0)
    const totalSpend = rawAds.reduce((acc, a) => acc + (a.total_spend || 0), 0)
    const totalImpressions = rawAds.reduce((acc, a) => acc + (a.impressions || 0), 0)
    const totalClicks = rawAds.reduce((acc, a) => acc + (a.clicks || 0), 0)
    const totalMessages = rawAds.reduce((acc, a) => acc + (a.messages || 0), 0)
    const totalLeads = rawAds.reduce((acc, a) => acc + (a.leads || 0), 0)
    const totalResults = totalMessages + totalLeads

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const cpc = totalClicks > 0 ? totalSpendMeta / totalClicks : 0
    const cpm = totalImpressions > 0 ? (totalSpendMeta / totalImpressions) * 1000 : 0
    const cpa = totalResults > 0 ? totalSpendMeta / totalResults : 0

    return {
      spendMeta: totalSpendMeta,
      totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      messages: totalMessages,
      leads: totalLeads,
      results: totalResults,
      ctr,
      cpc,
      cpm,
      cpa,
      adsetsCount: rawAdSets.length,
      adsCount: rawAds.length,
    }
  }, [rawAds, rawAdSets])

  // Toggle accordion expand
  const toggleAdSetExpand = (key: string | number) => {
    setExpandedAdSets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const expandAll = () => {
    const next: Record<string | number, boolean> = {}
    filteredAdSets.forEach((ast) => {
      next[ast.id] = true
    })
    setExpandedAdSets(next)
  }

  const collapseAll = () => {
    setExpandedAdSets({})
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSyncMeta = async () => {
    setIsSyncing(true)
    try {
      await triggerSyncNow()
      await Promise.all([
        refetchAdsets(),
        refetchAds(),
        queryClient.invalidateQueries({ queryKey: ['brand-detail', brandId] }),
        queryClient.invalidateQueries({ queryKey: ['brands-list'] }),
      ])
    } catch (e) {
      console.error(e)
    } finally {
      setIsSyncing(false)
    }
  }

  if (isBrandLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <RefreshCw size={32} className="animate-spin text-primary" />
        <p className="text-sm font-medium text-muted">Đang tải cấu trúc dữ liệu Brand...</p>
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="rounded-xl border border-outline bg-white p-12 text-center shadow-xs">
        <p className="text-sm text-muted">Không tìm thấy thông tin Thương hiệu này.</p>
        <button
          type="button"
          onClick={() => navigate('/brands')}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition"
        >
          <ArrowLeft size={14} />
          <span>Quay lại danh sách Brands</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Brand Hierarchy Header */}
      <div className="rounded-xl border border-outline bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline/70 pb-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/brands')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-outline bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-ink transition shadow-2xs"
            >
              <ArrowLeft size={14} />
              <span>Tất cả Brands</span>
            </button>

            <span className="text-slate-300">/</span>

            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-lg bg-purple-100 text-purple-700 font-bold">
                <Tags size={18} />
              </div>
              <div>
                <h1 className="font-headline text-lg sm:text-2xl font-bold text-ink flex items-center gap-2">
                  <span>{brand.brand_name}</span>
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                    ID: {brand.id}
                  </span>
                </h1>
                <p className="text-xs text-muted">
                  Không gian quản lý phân cấp: <strong>Brand → AdSets ({brandKPI.adsetsCount}) → Ads chi tiết ({brandKPI.adsCount})</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncMeta}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-xl bg-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-button hover:bg-purple-800 disabled:opacity-50 transition cursor-pointer"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ từ Meta'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-button hover:bg-emerald-700 transition"
            >
              <FileSpreadsheet size={15} />
              <span>Xuất Báo Cáo Google Sheet</span>
            </button>
          </div>
        </div>

        {/* Brand Summary KPI Row */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* Chi tiêu Meta */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Chi tiêu Meta</span>
            <p className="mt-1 font-mono text-base font-bold text-ink">
              {formatCurrencyVND(brandKPI.spendMeta)}
            </p>
            <p className="mt-0.5 text-[10px] text-muted">Chi phí gốc trả cho Meta</p>
          </div>

          {/* Tổng chi phí (VAT+FTF) */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase">Tổng chi phí</span>
            <p className="mt-1 font-mono text-base font-bold text-emerald-900">
              {formatCurrencyVND(brandKPI.totalSpend)}
            </p>
            <p className="mt-0.5 text-[10px] text-emerald-700">Đã gồm VAT 10% + FTF 1.1%</p>
          </div>

          {/* Kết quả tin nhắn */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
            <span className="text-[11px] font-semibold text-blue-800 uppercase">Tin nhắn / Kết quả</span>
            <p className="mt-1 font-mono text-base font-bold text-blue-900">
              {brandKPI.results.toLocaleString('vi-VN')}
            </p>
            <p className="mt-0.5 text-[10px] text-blue-700">
              CPA: {brandKPI.cpa > 0 ? formatCurrencyVND(brandKPI.cpa) : '0 đ'}/mess
            </p>
          </div>

          {/* Clicks & CTR */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Clicks / CTR</span>
            <p className="mt-1 font-mono text-base font-bold text-ink">
              {brandKPI.clicks.toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-semibold text-emerald-600">({brandKPI.ctr.toFixed(2)}%)</span>
            </p>
            <p className="mt-0.5 text-[10px] text-muted">
              CPC: {brandKPI.cpc > 0 ? formatCurrencyVND(brandKPI.cpc) : '0 đ'}
            </p>
          </div>

          {/* Quy mô Nhóm AdSets */}
          <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-3">
            <span className="text-[11px] font-semibold text-purple-800 uppercase">Nhóm quảng cáo</span>
            <p className="mt-1 font-mono text-base font-bold text-purple-900">
              {brandKPI.adsetsCount} <span className="text-xs font-normal">AdSets</span>
            </p>
            <p className="mt-0.5 text-[10px] text-purple-700">Cấu hình nhóm đối tượng</p>
          </div>

          {/* Quy mô Ads chi tiết */}
          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
            <span className="text-[11px] font-semibold text-amber-800 uppercase">Ads & Bài Post</span>
            <p className="mt-1 font-mono text-base font-bold text-amber-900">
              {brandKPI.adsCount} <span className="text-xs font-normal">Ads</span>
            </p>
            <p className="mt-0.5 text-[10px] text-amber-700">Mẫu bài viết Facebook</p>
          </div>
        </div>
      </div>

      {/* 2. Control Tabs: [Cấu trúc Brand → AdSet → Ads] | [Danh sách AdSets] | [Tất cả Ads chi tiết] */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('hierarchy')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition rounded-lg ${
              activeTab === 'hierarchy'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-muted hover:text-ink hover:bg-slate-100'
            }`}
          >
            <Layers size={14} />
            <span>Phân cấp: AdSet → Ads chi tiết</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('adsets')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition rounded-lg ${
              activeTab === 'adsets'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-muted hover:text-ink hover:bg-slate-100'
            }`}
          >
            <Building2 size={14} />
            <span>Bảng AdSets ({filteredAdSets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition rounded-lg ${
              activeTab === 'ads'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-muted hover:text-ink hover:bg-slate-100'
            }`}
          >
            <Megaphone size={14} />
            <span>Tất cả Ads chi tiết ({filteredAds.length})</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'hierarchy' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={expandAll}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Mở rộng tất cả
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Thu gọn tất cả
              </button>
            </div>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang chạy (ACTIVE)</option>
            <option value="PAUSED">Tạm dừng (PAUSED)</option>
          </select>

          <div className="relative w-48 sm:w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm AdSet, bài post, ID..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-purple-600"
            />
          </div>
        </div>
      </div>

      {/* 3. TAB 1: PHÂN CẤP CHUẨN: BRAND → ADSET → ADS CHI TIẾT */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-4">
          {filteredAdSets.length === 0 ? (
            <div className="rounded-xl border border-outline bg-white p-12 text-center shadow-xs">
              <p className="text-sm text-muted">
                {search ? 'Không tìm thấy AdSet nào phù hợp với từ khóa.' : 'Brand này chưa có AdSet nào được đồng bộ.'}
              </p>
            </div>
          ) : (
            filteredAdSets.map((ast) => {
              const directAds =
                adsByAdSet.get(String(ast.id)) || adsByAdSet.get(String(ast.meta_adset_id)) || []
              const childAds = directAds.length > 0
                ? directAds
                : (ast.campaign_id ? adsByCampaign.get(String(ast.campaign_id)) || [] : [])
              const isExpanded = expandedAdSets[ast.id] ?? true // Mặc định mở rộng để thấy ngay ads con

              return (
                <div
                  key={ast.id}
                  className="rounded-xl border border-outline bg-white shadow-xs overflow-hidden transition"
                >
                  {/* LEVEL 2: ADSET HEADER ROW */}
                  <div
                    onClick={() => toggleAdSetExpand(ast.id)}
                    className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/90 p-4 border-b border-outline/70 cursor-pointer hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleAdSetExpand(ast.id)
                        }}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
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

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline text-sm sm:text-base font-bold text-ink truncate hover:text-purple-700 transition">
                            {ast.adset_name}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/adsets/${ast.id}`)
                            }}
                            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-purple-700 hover:underline"
                            title="Xem trang chi tiết AdSet"
                          >
                            <span>Chi tiết</span>
                            <Eye size={11} />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                          <span className="font-mono">ID: {ast.meta_adset_id}</span>
                          <span>•</span>
                          <span>
                            Ngân sách:{' '}
                            <strong className="text-slate-700">
                              {ast.daily_budget && ast.daily_budget > 0
                                ? formatCurrencyVND(ast.daily_budget)
                                : 'Ngân sách chiến dịch (CBO)'}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Chiến dịch: <strong className="text-slate-700">{ast.campaign_name}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AdSet Metrics Right */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="text-right">
                        <span className="text-[10px] text-muted block uppercase">Chi tiêu Meta</span>
                        <span className="font-bold text-ink text-sm">
                          {formatCurrencyVND(ast.spend_meta)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-muted block uppercase">Tin nhắn</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          {ast.results.toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-muted block uppercase">CPR</span>
                        <span className="font-semibold text-purple-800">
                          {ast.cost_per_result > 0 ? formatCurrencyVND(ast.cost_per_result) : '-'}
                        </span>
                      </div>

                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-muted block uppercase">Clicks (CTR)</span>
                        <span className="text-slate-700">
                          {ast.clicks.toLocaleString('vi-VN')}{' '}
                          <span className="text-[11px] text-emerald-600 font-semibold">({ast.ctr}%)</span>
                        </span>
                      </div>

                      <span className="rounded-full bg-purple-100 text-purple-800 px-2.5 py-1 text-xs font-bold shrink-0">
                        {childAds.length} Ads con
                      </span>
                    </div>
                  </div>

                  {/* LEVEL 3: ADS CHI TIẾT TABLE (EXPANDED) */}
                  {isExpanded && (
                    <div className="p-0">
                      {childAds.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted bg-slate-50/30">
                          Chưa có quảng cáo con nào được đồng bộ trong AdSet này.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/70 text-[10px] font-semibold text-slate-500 uppercase border-b border-outline">
                              <tr>
                                <th className="px-4 py-2.5">Mẫu Quảng Cáo & Bài Post Facebook (Ads chi tiết)</th>
                                <th className="px-3 py-2.5">Trạng thái</th>
                                <th className="px-3 py-2.5 text-right font-bold text-ink">Chi tiêu Meta</th>
                                <th className="px-3 py-2.5 text-right font-bold text-emerald-800">Tổng chi phí (VAT+FTF)</th>
                                <th className="px-3 py-2.5 text-right">Tin nhắn</th>
                                <th className="px-3 py-2.5 text-right">Chi phí/mess</th>
                                <th className="px-3 py-2.5 text-right">Hiển thị</th>
                                <th className="px-3 py-2.5 text-right">Clicks (CTR)</th>
                                <th className="px-3 py-2.5 text-right">CPC</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px]">
                              {childAds.map((ad) => {
                                const cpr = ad.messages > 0 ? (ad.spend_meta || 0) / ad.messages : 0
                                return (
                                  <tr key={ad.id} className="hover:bg-purple-50/30 transition">
                                    <td className="px-4 py-3 max-w-md">
                                      <div className="flex items-start gap-2.5">
                                        {ad.thumbnail_url ? (
                                          <img
                                            src={ad.thumbnail_url}
                                            alt=""
                                            className="size-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                                          />
                                        ) : (
                                          <div className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-400 shrink-0 border border-slate-200">
                                            <Megaphone size={16} />
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <p className="font-semibold text-ink line-clamp-1" title={ad.ad_name}>
                                            {ad.ad_name}
                                          </p>
                                          <p className="font-mono text-[10px] text-muted">ID: {ad.meta_ad_id}</p>

                                          {ad.post_id && (
                                            <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                                              <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                                Post: {ad.post_id}
                                              </span>
                                              {ad.post_url && (
                                                <a
                                                  href={ad.post_url}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
                                                >
                                                  <span>Xem bài post</span>
                                                  <ExternalLink size={10} />
                                                </a>
                                              )}
                                            </div>
                                          )}

                                          {ad.post_message && (
                                            <p className="mt-1 text-[10px] text-slate-500 italic line-clamp-1" title={ad.post_message}>
                                              "{ad.post_message}"
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </td>

                                    <td className="px-3 py-3">
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                          ad.status === 'ACTIVE'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-slate-200 text-slate-700'
                                        }`}
                                      >
                                        <span
                                          className={`size-1.5 rounded-full ${
                                            ad.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                                          }`}
                                        />
                                        {ad.status}
                                      </span>
                                    </td>

                                    <td className="px-3 py-3 text-right font-mono font-bold text-ink">
                                      {formatCurrencyVND(ad.spend_meta || 0)}
                                    </td>

                                    <td className="px-3 py-3 text-right font-mono font-bold text-emerald-900">
                                      {formatCurrencyVND(ad.total_spend || 0)}
                                    </td>

                                    <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700">
                                      {ad.messages.toLocaleString('vi-VN')}
                                    </td>

                                    <td className="px-3 py-3 text-right font-mono text-primary font-semibold">
                                      {cpr > 0 ? formatCurrencyVND(cpr) : '-'}
                                    </td>

                                    <td className="px-3 py-3 text-right font-mono text-slate-600">
                                      {ad.impressions.toLocaleString('vi-VN')}
                                    </td>

                                    <td className="px-3 py-3 text-right font-mono text-slate-700">
                                      {ad.clicks.toLocaleString('vi-VN')}{' '}
                                      <span className="text-[10px] text-emerald-600 font-semibold">({ad.ctr}%)</span>
                                    </td>

                                    <td className="px-3 py-3 text-right font-mono text-slate-600">
                                      {ad.cpc > 0 ? formatCurrencyVND(ad.cpc) : '-'}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* 4. TAB 2: FLAT ADSETS TABLE */}
      {activeTab === 'adsets' && (
        <div className="rounded-xl border border-outline bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-muted uppercase border-b border-outline">
                <tr>
                  <th className="px-4 py-3">Nhóm quảng cáo (AdSet)</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3 text-right">Ngân sách ngày</th>
                  <th className="px-3 py-3 text-right font-bold text-ink">Chi tiêu Meta</th>
                  <th className="px-3 py-3 text-right font-bold text-emerald-800">Tổng chi phí (VAT+FTF)</th>
                  <th className="px-3 py-3 text-right">Tin nhắn</th>
                  <th className="px-3 py-3 text-right">CPR</th>
                  <th className="px-3 py-3 text-right">Clicks (CTR)</th>
                  <th className="px-3 py-3 text-right">CPC</th>
                  <th className="px-3 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline text-[11px]">
                {filteredAdSets.map((ast) => (
                  <tr key={ast.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 max-w-sm">
                      <p className="font-semibold text-ink line-clamp-1">{ast.adset_name}</p>
                      <p className="font-mono text-[10px] text-muted">ID: {ast.meta_adset_id}</p>
                      <p className="text-[10px] text-slate-500 truncate">Chiến dịch: {ast.campaign_name}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          ast.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {ast.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-700">
                      {ast.daily_budget && ast.daily_budget > 0
                        ? formatCurrencyVND(ast.daily_budget)
                        : 'Ngân sách CBO'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-ink">
                      {formatCurrencyVND(ast.spend_meta)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-emerald-900">
                      {formatCurrencyVND(ast.total_spend)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700">
                      {ast.results.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-primary font-semibold">
                      {ast.cost_per_result > 0 ? formatCurrencyVND(ast.cost_per_result) : '-'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-700">
                      {ast.clicks.toLocaleString('vi-VN')} ({ast.ctr}%)
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-600">
                      {ast.cpc > 0 ? formatCurrencyVND(ast.cpc) : '-'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => navigate(`/adsets/${ast.id}`)}
                        className="inline-flex items-center gap-1 rounded-md bg-purple-50 text-purple-700 px-2.5 py-1 text-[11px] font-semibold hover:bg-purple-700 hover:text-white transition"
                      >
                        <Eye size={12} />
                        <span>Xem AdSet</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB 3: FLAT ADS TABLE */}
      {activeTab === 'ads' && (
        <div className="rounded-xl border border-outline bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-muted uppercase border-b border-outline">
                <tr>
                  <th className="px-4 py-3">Mẫu Quảng Cáo & Bài Post</th>
                  <th className="px-3 py-3">Nhóm AdSet</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3 text-right font-bold text-ink">Chi tiêu Meta</th>
                  <th className="px-3 py-3 text-right font-bold text-emerald-800">Tổng chi phí</th>
                  <th className="px-3 py-3 text-right">Tin nhắn</th>
                  <th className="px-3 py-3 text-right">Chi phí/mess</th>
                  <th className="px-3 py-3 text-right">Hiển thị</th>
                  <th className="px-3 py-3 text-right">Clicks (CTR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline text-[11px]">
                {filteredAds.map((ad) => {
                  const cpr = ad.messages > 0 ? (ad.spend_meta || 0) / ad.messages : 0
                  return (
                    <tr key={ad.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 max-w-md">
                        <div className="flex items-start gap-2.5">
                          {ad.thumbnail_url ? (
                            <img
                              src={ad.thumbnail_url}
                              alt=""
                              className="size-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-400 shrink-0">
                              <Megaphone size={16} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-ink line-clamp-1">{ad.ad_name}</p>
                            <p className="font-mono text-[10px] text-muted">ID: {ad.meta_ad_id}</p>
                            {ad.post_id && (
                              <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                                <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Post: {ad.post_id}
                                </span>
                                {ad.post_url && (
                                  <a
                                    href={ad.post_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
                                  >
                                    <span>Xem bài post</span>
                                    <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 max-w-xs">
                        <p className="font-medium text-slate-800 truncate">{ad.adset_name}</p>
                        <p className="text-[10px] text-muted truncate">{ad.campaign_name}</p>
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            ad.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {ad.status}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-right font-mono font-bold text-ink">
                        {formatCurrencyVND(ad.spend_meta || 0)}
                      </td>

                      <td className="px-3 py-3 text-right font-mono font-bold text-emerald-900">
                        {formatCurrencyVND(ad.total_spend || 0)}
                      </td>

                      <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700">
                        {ad.messages.toLocaleString('vi-VN')}
                      </td>

                      <td className="px-3 py-3 text-right font-mono text-primary font-semibold">
                        {cpr > 0 ? formatCurrencyVND(cpr) : '-'}
                      </td>

                      <td className="px-3 py-3 text-right font-mono text-slate-600">
                        {ad.impressions.toLocaleString('vi-VN')}
                      </td>

                      <td className="px-3 py-3 text-right font-mono text-slate-700">
                        {ad.clicks.toLocaleString('vi-VN')} ({ad.ctr}%)
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Google Sheet Modal dedicated to this Brand */}
      <ExportGoogleSheetModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        brandName={brand.brand_name}
        items={rawAds.map((a) => ({
          id: a.id,
          name: `${a.ad_name}${a.post_id ? ` (Post: ${a.post_id})` : ''}`,
          spend_meta: a.spend_meta || 0,
          impressions: a.impressions || 0,
          reach: a.reach || Math.round(a.impressions * 0.9),
          clicks: a.clicks || 0,
          messages: a.messages || 0,
          results: a.messages || a.leads || 0,
        }))}
      />
    </div>
  )
}
