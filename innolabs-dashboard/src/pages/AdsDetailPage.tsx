import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Megaphone,
  Search,
  RefreshCw,
  Sparkles,
  DollarSign,
  TrendingUp,
  Target,
  Layers,
  Building2,
  Tags,
  WalletCards,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Image as ImageIcon,
  Video,
} from 'lucide-react'
import { fetchAdsDetailListApi, AdDetailItem } from '../api/ads-detail.api'
import { fetchFilterOptionsApi, triggerSyncNow } from '../api/dashboard.api'
import { fetchBrandsApi } from '../api/brand.api'
import { formatCurrencyVND, formatDateVN, formatNumber } from '../utils/formatters'
import { ExportGoogleSheetModal } from '../components/dashboard/ExportGoogleSheetModal'

export function AdsDetailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const brandFromUrl = searchParams.get('brand') || ''

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce tìm kiếm 400ms để người dùng gõ phím không bị giật lag gọi API liên tục
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])
  const [selectedBM, setSelectedBM] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedBrand, setSelectedBrand] = useState(brandFromUrl)

  useEffect(() => {
    if (brandFromUrl) {
      setSelectedBrand(brandFromUrl)
    }
  }, [brandFromUrl])
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [sortField, setSortField] = useState<keyof AdDetailItem>('total_spend')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 50

  // Tính dải ngày
  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    const fmt = (d: Date) => d.toISOString().split('T')[0]

    if (datePreset === 'today') {
      const d = fmt(now)
      return { startDate: d, endDate: d }
    }
    if (datePreset === 'this_week') {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(now.setDate(diff))
      return { startDate: fmt(monday), endDate: fmt(new Date()) }
    }
    if (datePreset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      return { startDate: fmt(firstDay), endDate: fmt(new Date()) }
    }
    if (datePreset === 'custom') {
      return { startDate: customStartDate, endDate: customEndDate }
    }
    return { startDate: '', endDate: '' }
  }, [datePreset, customStartDate, customEndDate])

  // Lấy bộ lọc từ DB
  const { data: filterOptions } = useQuery({
    queryKey: ['filter-options'],
    queryFn: fetchFilterOptionsApi,
  })

  const { data: brandsData } = useQuery({
    queryKey: ['brands-list'],
    queryFn: fetchBrandsApi,
  })

  // Lấy dữ liệu Ads chi tiết thật từ backend
  const {
    data: summaryData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      'ads-detail-list',
      startDate,
      endDate,
      selectedStatus,
      selectedBM,
      selectedAccount,
      selectedBrand,
      debouncedSearch,
    ],
    queryFn: () =>
      fetchAdsDetailListApi({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        bm_id: selectedBM || undefined,
        account_id: selectedAccount || undefined,
        brand: selectedBrand || undefined,
        search: debouncedSearch.trim() || undefined,
      }),
    staleTime: 5 * 60 * 1000, // Giữ cache 5 phút để chuyển trang/click lại không phải load lại từ đầu
    gcTime: 10 * 60 * 1000,
  })

  const queryClient = useQueryClient()
  const handleSyncMeta = async () => {
    setIsSyncing(true)
    try {
      await triggerSyncNow()
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['ads-detail-list'] }),
        queryClient.invalidateQueries({ queryKey: ['adsets'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-spend'] }),
      ])
    } catch (e) {
      console.error(e)
    } finally {
      setIsSyncing(false)
    }
  }

  const sortedAds = useMemo(() => {
    if (!summaryData?.ads) return []
    return [...summaryData.ads].sort((a, b) => {
      const valA = a[sortField] ?? 0
      const valB = b[sortField] ?? 0
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [summaryData?.ads, sortField, sortOrder])

  // Phân trang
  const totalPages = Math.ceil(sortedAds.length / pageSize) || 1
  const paginatedAds = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedAds.slice(start, start + pageSize)
  }, [sortedAds, page, pageSize])

  const toggleSort = (field: keyof AdDetailItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Megaphone size={20} />
            </span>
            <h1 className="text-xl font-bold text-ink">Quảng Cáo Chi Tiết (Ads & Creatives)</h1>
          </div>
          <p className="mt-1 text-xs text-muted">
            Quản lý từng Creative, bài post Facebook, lượt tin nhắn, chi phí thực tế và chỉ số chuyển đổi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <span>Xuất Báo Cáo Ads</span>
          </button>

          <button
            type="button"
            onClick={handleSyncMeta}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Đang đồng bộ Meta...' : 'Đồng bộ từ Meta'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-outline bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase">Tổng Chi Tiêu</span>
          <p className="mt-1 font-mono text-lg font-bold text-ink">
            {formatCurrencyVND(summaryData?.total_spend || 0)}
          </p>
          <div className="mt-1 text-[10px] text-muted">
            Meta: {formatCurrencyVND(summaryData?.spend_meta || 0)}
          </div>
        </div>

        <div className="rounded-xl border border-outline bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted uppercase">Tổng Ads</span>
          <p className="mt-1 font-mono text-lg font-bold text-ink">
            {formatNumber(summaryData?.total_ads || 0)}
          </p>
          <div className="mt-1 text-[10px] text-emerald-600 font-semibold">
            {formatNumber(summaryData?.active_ads || 0)} đang hoạt động
          </div>
        </div>

        <div className="rounded-xl border border-outline bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted uppercase">Lượt Tin Nhắn</span>
          <p className="mt-1 font-mono text-lg font-bold text-ink">
            {formatNumber(summaryData?.messages || 0)}
          </p>
          <div className="mt-1 text-[10px] text-muted">
            Leads: {formatNumber(summaryData?.leads || 0)}
          </div>
        </div>

        <div className="rounded-xl border border-outline bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted uppercase">Giá / Kết Quả (CPA)</span>
          <p className="mt-1 font-mono text-lg font-bold text-ink">
            {formatCurrencyVND(summaryData?.avg_cpa || 0)}
          </p>
          <div className="mt-1 text-[10px] text-muted">
            {formatNumber(summaryData?.results || 0)} kết quả
          </div>
        </div>

        <div className="rounded-xl border border-outline bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted uppercase">Clicks & CTR</span>
          <p className="mt-1 font-mono text-lg font-bold text-ink">
            {formatNumber(summaryData?.clicks || 0)}
          </p>
          <div className="mt-1 text-[10px] text-emerald-600 font-semibold">
            CTR: {(summaryData?.avg_ctr || 0).toFixed(2)}%
          </div>
        </div>

        <div className="rounded-xl border border-outline bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted uppercase">CPC Trung Bình</span>
          <p className="mt-1 font-mono text-lg font-bold text-ink">
            {formatCurrencyVND(summaryData?.avg_cpc || 0)}
          </p>
          <div className="mt-1 text-[10px] text-muted">
            Hiển thị: {formatNumber(summaryData?.impressions || 0)}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-outline bg-white p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Tìm theo tên Ads, ID, Post ID..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-ink outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedBM}
            onChange={(e) => {
              setSelectedBM(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-ink outline-none"
          >
            <option value="">Tất cả Business Manager</option>
            {filterOptions?.bms.map((bm) => (
              <option key={bm.value} value={bm.value}>
                {bm.label}
              </option>
            ))}
          </select>

          <select
            value={selectedAccount}
            onChange={(e) => {
              setSelectedAccount(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-ink outline-none"
          >
            <option value="">Tất cả Tài khoản</option>
            {filterOptions?.accounts.map((acc) => (
              <option key={acc.value} value={acc.value}>
                {acc.label}
              </option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-ink outline-none"
          >
            <option value="">Tất cả Brand</option>
            {brandsData?.map((b) => (
              <option key={b.id} value={b.brand_name}>
                {b.brand_name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-ink outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">ACTIVE (Đang chạy)</option>
            <option value="PAUSED">PAUSED (Tạm dừng)</option>
          </select>

          <select
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value as any)
              setPage(1)
            }}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-ink outline-none"
          >
            <option value="all">Toàn bộ thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="this_week">Tuần này</option>
            <option value="this_month">Tháng này</option>
            <option value="custom">Tùy chọn ngày</option>
          </select>
        </div>

        {datePreset === 'custom' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-muted">Từ ngày:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => {
                setCustomStartDate(e.target.value)
                setPage(1)
              }}
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
            <span className="text-muted">Đến ngày:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => {
                setCustomEndDate(e.target.value)
                setPage(1)
              }}
              className="rounded border border-slate-200 px-2 py-1 text-xs"
            />
          </div>
        )}
      </div>

      {/* Brand Filter Pills */}
      {brandsData && brandsData.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs">
          <span className="flex items-center gap-1 font-semibold text-slate-500 shrink-0 mr-1 text-[11px] uppercase tracking-wider">
            <Tags size={13} className="text-purple-600" />
            Brand:
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedBrand('')
              setPage(1)
            }}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
              selectedBrand === ''
                ? 'bg-purple-700 text-white shadow-xs font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Tất cả
          </button>

          {brandsData.map((brand) => {
            const isSelected = selectedBrand.toLowerCase() === brand.brand_name.toLowerCase()
            return (
              <button
                key={brand.id}
                type="button"
                onClick={() => {
                  setSelectedBrand(isSelected ? '' : brand.brand_name)
                  setPage(1)
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition shrink-0 ${
                  isSelected
                    ? 'bg-purple-700 text-white font-semibold shadow-xs ring-2 ring-purple-600/30'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-800'
                }`}
              >
                <span>{brand.brand_name}</span>
                {isSelected && (
                  <span className="size-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Table Ads Detail */}
      <div className="rounded-xl border border-outline bg-white shadow-xs overflow-hidden">
        <div className="border-b border-outline bg-slate-50/80 px-4 py-3 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">
            Hiển thị: <strong>{paginatedAds.length}</strong> / <strong>{sortedAds.length}</strong> Ads
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded px-2.5 py-1 border border-slate-200 text-xs disabled:opacity-40 hover:bg-white"
              >
                Trước
              </button>
              <span className="text-[11px] font-medium text-slate-600">
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded px-2.5 py-1 border border-slate-200 text-xs disabled:opacity-40 hover:bg-white"
              >
                Sau
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-muted uppercase border-b border-outline">
              <tr>
                <th className="px-4 py-3">Mẫu Quảng Cáo & Bài Post</th>
                <th className="px-3 py-3">Chiến dịch & Nhóm</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th
                  className="px-3 py-3 text-right font-bold text-ink cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort('spend_meta')}
                >
                  Chi tiêu
                </th>
                <th
                  className="px-3 py-3 text-right font-bold text-emerald-800 cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort('total_spend')}
                >
                  Tổng chi phí (VAT+FTF)
                </th>
                <th
                  className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort('messages')}
                >
                  Tin nhắn
                </th>
                <th
                  className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort('cost_per_result')}
                >
                  CPA
                </th>
                <th
                  className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort('clicks')}
                >
                  Clicks
                </th>
                <th
                  className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort('ctr')}
                >
                  CTR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted">
                    <RefreshCw size={18} className="animate-spin inline-block mr-2" />
                    Đang tải danh sách Ads chi tiết...
                  </td>
                </tr>
              ) : paginatedAds.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted">
                    Chưa có quảng cáo nào trong bảng dữ liệu hoặc không khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 max-w-[320px]">
                      <div className="flex items-start gap-3">
                        {ad.thumbnail_url ? (
                          <img
                            src={ad.thumbnail_url}
                            alt=""
                            className="h-11 w-11 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            {ad.creative_type === 'VIDEO' ? <Video size={18} /> : <ImageIcon size={18} />}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-ink line-clamp-1">{ad.ad_name}</p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted">
                            <span className="font-mono">ID: {ad.meta_ad_id}</span>
                            {ad.post_id && (
                              <>
                                <span>•</span>
                                <span className="font-mono truncate max-w-[120px]" title={ad.post_id}>
                                  Post: {ad.post_id}
                                </span>
                              </>
                            )}
                          </div>
                          {ad.post_url && (
                            <a
                              href={ad.post_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:underline"
                            >
                              <span>Xem bài viết Facebook</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 max-w-[200px]">
                      <div className="space-y-0.5">
                        <p className="font-medium text-slate-800 truncate" title={ad.campaign_name}>
                          {ad.campaign_name}
                        </p>
                        <p className="text-[10px] text-muted truncate" title={ad.adset_name}>
                          {ad.adset_name}
                        </p>
                        <span className="inline-block rounded bg-purple-50 px-1.5 py-0.2 text-[9px] font-medium text-purple-700 border border-purple-200">
                          {ad.brand_name}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${
                          ad.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {ad.status}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right font-mono font-bold text-ink whitespace-nowrap">
                      {formatCurrencyVND(ad.spend_meta)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {formatCurrencyVND(ad.total_spend)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {formatNumber(ad.messages)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-muted whitespace-nowrap">
                      {ad.cost_per_result > 0 ? formatCurrencyVND(ad.cost_per_result) : '-'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-muted whitespace-nowrap">{formatNumber(ad.clicks)}</td>
                    <td className="px-3 py-3 text-right font-mono font-medium text-emerald-600 whitespace-nowrap">
                      {ad.ctr.toFixed(2)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Xuất Báo Cáo Google Sheet cho toàn bộ Ads */}
      <ExportGoogleSheetModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        items={sortedAds.map((ad) => ({
          id: ad.id,
          name: `${ad.ad_name}${ad.post_id ? ` (Post: ${ad.post_id})` : ''}`,
          spend_meta: ad.spend_meta || 0,
          impressions: ad.impressions || 0,
          reach: ad.reach || Math.round(ad.impressions * 0.9),
          clicks: ad.clicks || 0,
          messages: ad.messages || 0,
          results: ad.results || 0,
        }))}
        brandName={selectedBrand || 'Báo cáo toàn bộ Ads'}
        startDate={startDate}
        endDate={endDate}
        reportType="adset"
      />
    </div>
  )
}
