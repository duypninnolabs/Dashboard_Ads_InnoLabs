import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  RefreshCw,
  Copy,
  Check,
  Megaphone,
  Building2,
  WalletCards,
  Tags,
  Image as ImageIcon,
  Video,
  Users,
  Compass,
  MapPin,
  FileSpreadsheet,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Heart,
  Sparkles,
  Code,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react'
import { fetchAdSetDetailApi, AdSetDetail } from '../api/adset.api'
import { formatCurrencyVND, formatDateVN, formatNumber } from '../utils/formatters'
import { ExportGoogleSheetModal } from '../components/dashboard/ExportGoogleSheetModal'

export function AdSetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const adsetId = Number(id)

  const [activeTab, setActiveTab] = useState<'ads' | 'daily' | 'targeting'>('ads')
  const [copied, setCopied] = useState(false)
  const [isExportAdsOpen, setIsExportAdsOpen] = useState(false)
  const [showRawJson, setShowRawJson] = useState(false)

  // Bộ lọc ngày (Date Range Filter State)
  type DatePresetType = 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'custom'
  const [datePreset, setDatePreset] = useState<DatePresetType>('all')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')

  // Chuyển đổi các preset ngày nhanh
  const handlePresetChange = (preset: DatePresetType) => {
    setDatePreset(preset)
    const fmt = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    const today = new Date()

    if (preset === 'today') {
      const dStr = fmt(today)
      setCustomStart(dStr)
      setCustomEnd(dStr)
    } else if (preset === 'yesterday') {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      const dStr = fmt(y)
      setCustomStart(dStr)
      setCustomEnd(dStr)
    } else if (preset === '7days') {
      const s = new Date(today)
      s.setDate(s.getDate() - 6)
      setCustomStart(fmt(s))
      setCustomEnd(fmt(today))
    } else if (preset === '30days') {
      const s = new Date(today)
      s.setDate(s.getDate() - 29)
      setCustomStart(fmt(s))
      setCustomEnd(fmt(today))
    } else if (preset === 'this_month') {
      const s = new Date(today.getFullYear(), today.getMonth(), 1)
      setCustomStart(fmt(s))
      setCustomEnd(fmt(today))
    } else if (preset === 'all') {
      setCustomStart('')
      setCustomEnd('')
    }
  }

  const activeStart = customStart
  const activeEnd = customEnd

  const {
    data: detail,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<AdSetDetail>({
    queryKey: ['adset-detail', adsetId, activeStart, activeEnd],
    queryFn: () => fetchAdSetDetailApi(adsetId, activeStart, activeEnd),
    enabled: !isNaN(adsetId) && adsetId > 0,
  })

  const adset = detail?.adset

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Interface và parser cho cấu hình Targeting (Đối tượng & Cấu hình)
  const parsedTargeting = useMemo(() => {
    const raw = adset?.targeting_summary || ''
    const fallback = {
      ageMin: detail?.targeting_info?.age_min ?? 18,
      ageMax: detail?.targeting_info?.age_max ?? 65,
      ageRange:
        detail?.targeting_info?.age_range ||
        `${detail?.targeting_info?.age_min ?? 18} - ${detail?.targeting_info?.age_max ?? 65} tuổi`,
      genders: detail?.targeting_info?.genders || 'Tất cả (Nam & Nữ)',
      locations: detail?.targeting_info?.locations || ['Việt Nam'],
      customLocations: [] as Array<{
        country: string
        radius: number
        unit: string
        lat: number
        lng: number
      }>,
      locationTypes: ['Người sống tại vị trí này hoặc ở đây gần đây'],
      interests: detail?.targeting_info?.interests || [],
      familyStatuses: detail?.targeting_info?.family_statuses || [],
      educationStatuses: detail?.targeting_info?.education_statuses || [],
      advantageAudience: detail?.targeting_info?.advantage_audience ?? false,
      brandSafety: detail?.targeting_info?.brand_safety || [],
      isParsed: false,
      rawJson: raw || '{}',
    }

    if (!raw || !raw.trim().startsWith('{')) {
      return fallback
    }

    try {
      const data = JSON.parse(raw)
      const res = {
        ageMin: data.age_min ?? fallback.ageMin,
        ageMax: data.age_max ?? fallback.ageMax,
        ageRange:
          Array.isArray(data.age_range) && data.age_range.length === 2
            ? `${data.age_range[0]} - ${data.age_range[1]} tuổi`
            : `${data.age_min ?? 18} - ${data.age_max ?? 65} tuổi`,
        genders:
          Array.isArray(data.genders) && data.genders.length === 1
            ? data.genders[0] === 1
              ? 'Nam'
              : 'Nữ'
            : 'Tất cả (Nam & Nữ)',
        locations: [] as string[],
        customLocations: [] as Array<{
          country: string
          radius: number
          unit: string
          lat: number
          lng: number
        }>,
        locationTypes: [] as string[],
        interests: [] as string[],
        familyStatuses: [] as string[],
        educationStatuses: [] as string[],
        advantageAudience: Boolean(data.targeting_automation?.advantage_audience === 1),
        brandSafety: (Array.isArray(data.brand_safety_content_filter_levels)
          ? data.brand_safety_content_filter_levels
          : []) as string[],
        isParsed: true,
        rawJson: JSON.stringify(data, null, 2),
      }

      // Geo Locations & Custom Locations
      if (data.geo_locations) {
        if (Array.isArray(data.geo_locations.custom_locations)) {
          data.geo_locations.custom_locations.forEach((c: any) => {
            const unit = c.distance_unit === 'kilometer' ? 'km' : c.distance_unit || 'km'
            res.customLocations.push({
              country: c.country || 'VN',
              radius: c.radius || 0,
              unit,
              lat: c.latitude || 0,
              lng: c.longitude || 0,
            })
            if (c.radius > 0) {
              res.locations.push(
                `Bán kính ${c.radius} ${unit} quanh tọa độ (${c.latitude}, ${c.longitude})`
              )
            }
          })
        }
        if (Array.isArray(data.geo_locations.countries)) {
          data.geo_locations.countries.forEach((ct: string) => {
            if (!res.locations.includes(ct)) res.locations.push(ct)
          })
        }
        if (Array.isArray(data.geo_locations.cities)) {
          data.geo_locations.cities.forEach((ct: any) => {
            if (ct?.name && !res.locations.includes(ct.name)) res.locations.push(ct.name)
          })
        }
        if (Array.isArray(data.geo_locations.location_types)) {
          const typeMap: Record<string, string> = {
            home: 'Người sống tại vị trí này',
            recent: 'Người ở đây gần đây',
            travel_in: 'Người đang đi du lịch tại đây',
          }
          res.locationTypes = data.geo_locations.location_types.map(
            (t: string) => typeMap[t] || t
          )
        }
      }

      // Flexible Spec
      if (Array.isArray(data.flexible_spec)) {
        data.flexible_spec.forEach((fs: any) => {
          if (Array.isArray(fs.interests)) {
            fs.interests.forEach((it: any) => {
              if (it?.name && !res.interests.includes(it.name)) res.interests.push(it.name)
            })
          }
          if (Array.isArray(fs.family_statuses)) {
            fs.family_statuses.forEach((fam: any) => {
              if (fam?.name && !res.familyStatuses.includes(fam.name))
                res.familyStatuses.push(fam.name)
            })
          }
          if (Array.isArray(fs.education_statuses)) {
            const eduMap: Record<number, string> = {
              1: 'Đang học trung học',
              2: 'Tốt nghiệp trung học',
              3: 'Đang học đại học',
              4: 'Tốt nghiệp đại học',
              5: 'Bằng thạc sĩ / tiến sĩ',
              6: 'Đang học cao học',
            }
            fs.education_statuses.forEach((e: number) => {
              const label = eduMap[e] || `Học vấn mã ${e}`
              if (!res.educationStatuses.includes(label)) res.educationStatuses.push(label)
            })
          }
        })
      }

      if (res.locations.length === 0) {
        res.locations = fallback.locations
      }

      return res
    } catch {
      return fallback
    }
  }, [adset?.targeting_summary, detail?.targeting_info])

  const [selectedLocIndex, setSelectedLocIndex] = useState(0)

  const activeLoc = useMemo(() => {
    if (parsedTargeting.customLocations.length > 0) {
      return (
        parsedTargeting.customLocations[selectedLocIndex] ||
        parsedTargeting.customLocations[0]
      )
    }
    return null
  }, [parsedTargeting.customLocations, selectedLocIndex])

  const activeMapUrl = useMemo(() => {
    if (activeLoc && activeLoc.lat && activeLoc.lng) {
      let zoom = 13
      if (activeLoc.radius) {
        if (activeLoc.radius <= 3) zoom = 14
        else if (activeLoc.radius <= 8) zoom = 13
        else if (activeLoc.radius <= 20) zoom = 12
        else if (activeLoc.radius <= 50) zoom = 11
        else zoom = 9
      }
      return `https://maps.google.com/maps?q=${activeLoc.lat},${activeLoc.lng}&hl=vi&z=${zoom}&output=embed`
    }
    if (parsedTargeting.locations.length > 0) {
      const locStr = parsedTargeting.locations[0]
      return `https://maps.google.com/maps?q=${encodeURIComponent(locStr)}&hl=vi&z=9&output=embed`
    }
    return null
  }, [activeLoc, parsedTargeting.locations])

  // Metrics aggregation for the selected date range
  const aggregateMetrics = (startDate: string, endDate: string) => {
    const list = (detail?.daily_metrics || []).filter((m) => {
      if (startDate && m.date < startDate) return false
      if (endDate && m.date > endDate) return false
      return true
    })
    const totalSpend = list.reduce((acc, m) => acc + m.total_spend, 0)
    const spendMeta = list.reduce((acc, m) => acc + m.spend_meta, 0)
    const spendVat = list.reduce((acc, m) => acc + m.spend_vat, 0)
    const ftf = list.reduce((acc, m) => acc + m.ftf_amount, 0)
    const clicks = list.reduce((acc, m) => acc + m.clicks, 0)
    const impressions = list.reduce((acc, m) => acc + m.impressions, 0)
    const reach = list.reduce((acc, m) => acc + m.reach, 0)
    const results = list.reduce((acc, m) => acc + m.results, 0)

    const cpa = results > 0 ? totalSpend / results : 0
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    const cpc = clicks > 0 ? spendMeta / clicks : 0
    const cpm = impressions > 0 ? (spendMeta / impressions) * 1000 : 0

    return {
      count: list.length,
      totalSpend,
      spendMeta,
      spendVat,
      ftf,
      clicks,
      impressions,
      reach,
      results,
      cpa,
      ctr,
      cpc,
      cpm,
      list,
    }
  }

  const currentPeriod = useMemo(
    () => aggregateMetrics(activeStart, activeEnd),
    [detail?.daily_metrics, activeStart, activeEnd]
  )

  // Danh sách ads con hiển thị (chỉ dùng dữ liệu thật từ backend, không mock dữ liệu giả)
  const displayAds = useMemo(() => {
    if (detail?.child_ads && detail.child_ads.length > 0) {
      return detail.child_ads
    }
    return []
  }, [detail?.child_ads])

  // Daily metrics with row-to-row comparison (So sánh từng ngày với ngày hôm trước trong khoảng thời gian đã chọn)
  const dailyMetricsWithComparison = useMemo(() => {
    const allSorted = [...(detail?.daily_metrics || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Tạo map để tra cứu ngày liền trước trong toàn bộ dữ liệu lịch sử
    const prevMap = new Map<string, (typeof allSorted)[0]>()
    for (let i = 0; i < allSorted.length; i++) {
      if (i < allSorted.length - 1) {
        prevMap.set(allSorted[i].date, allSorted[i + 1])
      }
    }

    const filtered = allSorted.filter((m) => {
      if (activeStart && m.date < activeStart) return false
      if (activeEnd && m.date > activeEnd) return false
      return true
    })

    return filtered.map((item) => {
      const prev = prevMap.get(item.date) || null

      const calcFieldPct = (cur: number, pVal: number | null | undefined) => {
        if (!pVal || pVal === 0) {
          if (cur > 0) return { pct: 100, diff: cur, status: 'up' as const }
          return { pct: 0, diff: 0, status: 'neutral' as const }
        }
        const diff = cur - pVal
        const pct = Number(((diff / pVal) * 100).toFixed(1))
        return {
          pct: Math.abs(pct),
          diff,
          status: diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('neutral' as const),
        }
      }

      const spendComp = calcFieldPct(item.total_spend, prev ? prev.total_spend : null)
      const ctrComp = calcFieldPct(item.ctr, prev ? prev.ctr : null)
      const cpcComp = calcFieldPct(item.cpc, prev ? prev.cpc : null)
      const cpmComp = calcFieldPct(item.cpm || 0, prev ? prev.cpm || 0 : null)
      const resultsComp = calcFieldPct(item.results, prev ? prev.results : null)
      const cpaComp = calcFieldPct(item.cost_per_result, prev ? prev.cost_per_result : null)

      return {
        ...item,
        prevDate: prev?.date ? formatDateVN(prev.date) : null,
        comp: {
          spend: spendComp,
          ctr: ctrComp,
          cpc: cpcComp,
          cpm: cpmComp,
          results: resultsComp,
          cpa: cpaComp,
        },
        comparison: {
          changePct: spendComp.pct,
          isPositive: spendComp.status === 'up',
          isNegative: spendComp.status === 'down',
          status: spendComp.status,
        },
      }
    })
  }, [detail?.daily_metrics, activeStart, activeEnd])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <RefreshCw size={32} className="animate-spin text-primary" />
        <p className="text-sm font-medium text-muted">Đang tải dữ liệu chi tiết Nhóm Quảng cáo...</p>
      </div>
    )
  }

  if (!adset) {
    return (
      <div className="rounded-xl border border-outline bg-white p-12 text-center shadow-xs">
        <p className="text-sm text-muted">Không tìm thấy thông tin Nhóm Quảng cáo này.</p>
        <button
          type="button"
          onClick={() => navigate('/adsets')}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition"
        >
          <ArrowLeft size={14} />
          <span>Quay lại danh sách Ad Sets</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Meta-style Breadcrumbs & Hierarchy Header */}
      <div className="rounded-xl border border-outline bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline/70 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/brands')}
              className="inline-flex items-center gap-1 rounded-lg border border-outline bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-ink transition shadow-2xs"
              title="Quay lại danh sách Brands"
            >
              <Tags size={13} className="text-purple-600" />
              <span>Brands</span>
            </button>

            {adset.brand_name && (
              <>
                <span className="text-slate-300">/</span>
                <button
                  type="button"
                  onClick={() => adset.brand_id ? navigate(`/brands/${adset.brand_id}`) : navigate(`/adsets?brand=${encodeURIComponent(adset.brand_name)}`)}
                  className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition border border-purple-200"
                  title="Vào Không gian Brand (Cây AdSet ➔ Ads con)"
                >
                  <Tags size={12} />
                  <span>{adset.brand_name}</span>
                </button>
              </>
            )}

            <span className="text-slate-300">/</span>

            {/* Breadcrumb level 2: AdSet */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${adset.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                  }`}
              >
                <span className={`size-1.5 rounded-full ${adset.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {adset.status === 'ACTIVE' ? 'ĐANG CHẠY' : 'TẠM DỪNG'}
              </span>

              <h2 className="font-headline text-base sm:text-lg font-bold text-ink line-clamp-1">
                {adset.adset_name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="inline-flex items-center gap-1 rounded-lg border border-outline bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition shadow-2xs"
            >
              <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Metadata sub-row */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600 flex items-center gap-1">
            ID: {adset.meta_adset_id}
            <button
              type="button"
              onClick={() => handleCopyId(adset.meta_adset_id)}
              className="hover:text-primary transition"
              title="Copy ID"
            >
              {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
            </button>
          </span>

          <span>•</span>
          <span className="flex items-center gap-1 text-slate-700">
            <Megaphone size={13} className="text-primary" />
            <span>Chiến dịch: <strong>{adset.campaign_name}</strong></span>
          </span>

          <span>•</span>
          <span className="flex items-center gap-1 text-slate-700">
            <Building2 size={13} className="text-secondary" />
            <span>BM: <strong>{adset.business_name}</strong></span>
          </span>

          <span>•</span>
          <span className="flex items-center gap-1 text-slate-700">
            <WalletCards size={13} className="text-slate-500" />
            <span>Tài khoản: <strong>{adset.account_name}</strong></span>
          </span>

          <span>•</span>
          <button
            type="button"
            onClick={() => adset.brand_id ? navigate(`/brands/${adset.brand_id}`) : navigate(`/adsets?brand=${encodeURIComponent(adset.brand_name)}`)}
            className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200 hover:bg-purple-100 transition cursor-pointer"
            title="Bấm để xem Cây Brand ➔ AdSets ➔ Ads con"
          >
            <Tags size={11} />
            <span>Thương hiệu: {adset.brand_name}</span>
            <ArrowRight size={11} />
          </button>
        </div>
      </div>

      {/* 2. Date Range Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => handlePresetChange('all')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                datePreset === 'all'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('today')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                datePreset === 'today'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('yesterday')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                datePreset === 'yesterday'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hôm qua
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('7days')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                datePreset === '7days'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              7 ngày qua
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('30days')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                datePreset === '30days'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              30 ngày qua
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('this_month')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                datePreset === 'this_month'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tháng này
            </button>
          </div>

          <span className="text-slate-300 font-light mx-1 hidden sm:inline">|</span>

          {/* Date Picker Inputs */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-slate-700">
            <Calendar size={14} className="text-muted" />
            <span className="text-[11px] text-muted font-medium">Từ:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value)
                setDatePreset('custom')
              }}
              className="bg-transparent font-medium text-xs text-ink outline-none cursor-pointer"
            />
            <span className="text-slate-400 font-bold">→</span>
            <span className="text-[11px] text-muted font-medium">Đến:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => {
                setCustomEnd(e.target.value)
                setDatePreset('custom')
              }}
              className="bg-transparent font-medium text-xs text-ink outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {(customStart || customEnd || datePreset !== 'all') && (
            <button
              type="button"
              onClick={() => handlePresetChange('all')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Đặt lại
            </button>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
          >
            <RefreshCw size={13} className={isRefetching ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 3. Top Stat Highlights */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Tổng Chi Tiêu */}
        <div className="rounded-xl border border-outline bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase">Tổng Chi Tiêu (VND)</span>
          <p className="mt-1 font-mono text-base sm:text-lg font-bold text-ink">
            {formatCurrencyVND(currentPeriod.totalSpend)}
          </p>
          <div className="mt-2 text-[10px] text-muted space-y-0.5 border-t border-slate-100 pt-1.5">
            <p>Meta: <span className="font-semibold text-slate-700">{formatCurrencyVND(currentPeriod.spendMeta)}</span></p>
            <p>VAT (10%): <span className="font-semibold text-slate-700">{formatCurrencyVND(currentPeriod.spendVat)}</span></p>
            <p>FTF (1.1%): <span className="font-semibold text-slate-700">{formatCurrencyVND(currentPeriod.ftf)}</span></p>
          </div>
        </div>

        {/* Ngân sách / ngày */}
        <div className="rounded-xl border border-outline bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted uppercase">Ngân sách / ngày</span>
          <p className="mt-1 font-mono text-base font-bold text-ink">
            {adset.daily_budget && adset.daily_budget > 0 ? formatCurrencyVND(adset.daily_budget) : 'Ngân sách cấp CBO'}
          </p>
          <div className="mt-2 text-[10px] text-muted space-y-0.5 border-t border-slate-100 pt-1.5">
            <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">
              {adset.daily_budget && adset.daily_budget > 0 ? 'Cấp Nhóm (AdSet)' : 'Cấp Chiến dịch (CBO)'}
            </span>
            <p className="text-[10px] text-emerald-600 font-medium pt-0.5">
              {adset.status === 'ACTIVE' ? 'Đang phân bổ ngân sách' : 'Tạm dừng phân bổ'}
            </p>
          </div>
        </div>

        {/* Kết quả (Tin nhắn/Lead) */}
        <div className="rounded-xl border border-outline bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted uppercase">Kết quả (Tin nhắn/Lead)</span>
          <p className="mt-1 font-mono text-base font-bold text-emerald-700">
            {currentPeriod.results.toLocaleString('vi-VN')}
          </p>
          <div className="mt-2 text-[10px] text-muted space-y-0.5 border-t border-slate-100 pt-1.5">
            <p className="text-slate-800 font-semibold">CPA: {formatCurrencyVND(currentPeriod.cpa)}/kết quả</p>
            <p>
              CR: {currentPeriod.clicks > 0 ? ((currentPeriod.results / currentPeriod.clicks) * 100).toFixed(1) : '0'}% / click
            </p>
          </div>
        </div>

        {/* Lượt Click (CTR) */}
        <div className="rounded-xl border border-outline bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted uppercase">Lượt Click (CTR)</span>
          <p className="mt-1 font-mono text-base font-bold text-ink">
            {currentPeriod.clicks.toLocaleString('vi-VN')}{' '}
            <span className="text-xs font-semibold text-emerald-600">({currentPeriod.ctr.toFixed(2)}%)</span>
          </p>
          <div className="mt-2 text-[10px] text-muted space-y-0.5 border-t border-slate-100 pt-1.5">
            <p className="text-slate-800 font-semibold">CPC: {formatCurrencyVND(currentPeriod.cpc)}/click</p>
            <p>Tỷ lệ nhấp CTR: {currentPeriod.ctr.toFixed(2)}%</p>
          </div>
        </div>

        {/* Hiển thị (Impressions) */}
        <div className="rounded-xl border border-outline bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted uppercase">Hiển thị (Impressions)</span>
          <p className="mt-1 font-mono text-base font-bold text-ink">
            {currentPeriod.impressions.toLocaleString('vi-VN')}
          </p>
          <div className="mt-2 text-[10px] text-muted space-y-0.5 border-t border-slate-100 pt-1.5">
            <p className="text-slate-800 font-semibold">Reach: {currentPeriod.reach.toLocaleString('vi-VN')}</p>
            <p>
              Tần suất: {currentPeriod.reach > 0 ? (currentPeriod.impressions / currentPeriod.reach).toFixed(2) : '1.00'}
            </p>
          </div>
        </div>

        {/* Chi phí / 1k hiển thị (CPM) */}
        <div className="rounded-xl border border-outline bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-muted uppercase">Chi phí / 1k hiển thị (CPM)</span>
          <p className="mt-1 font-mono text-base font-bold text-ink">
            {formatCurrencyVND(currentPeriod.cpm)}
          </p>
          <div className="mt-2 text-[10px] text-muted space-y-0.5 border-t border-slate-100 pt-1.5">
            <p>Số ngày có số liệu: <span className="font-semibold text-slate-700">{currentPeriod.count} ngày</span></p>
            <p className="text-slate-600 font-medium">FTF (1.1%): {formatCurrencyVND(currentPeriod.ftf)}</p>
          </div>
        </div>
      </div>

      {/* 4. Meta-style Level Tabs: [Quảng cáo con (Ads)] | [Hiệu quả theo ngày] | [Đối tượng & Cấu hình] */}
      <div className="flex border-b border-outline">
        <button
          type="button"
          onClick={() => setActiveTab('ads')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition border-b-2 ${activeTab === 'ads'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-muted hover:text-ink'
            }`}
        >
          <Megaphone size={15} />
          <span>Quảng cáo con (Ads - {displayAds.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition border-b-2 ${activeTab === 'daily'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-muted hover:text-ink'
            }`}
        >
          <Calendar size={15} />
          <span>Hiệu quả chi tiết từng ngày ({dailyMetricsWithComparison.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('targeting')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition border-b-2 ${activeTab === 'targeting'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-muted hover:text-ink'
            }`}
        >
          <Compass size={15} />
          <span>Đối tượng & Cấu hình</span>
        </button>
      </div>

      {/* 5. TAB 1: ADS CON (Meta Ads level 3) */}
      {activeTab === 'ads' && (
        <div className="rounded-xl border border-outline bg-white shadow-xs overflow-hidden space-y-0">
          <div className="border-b border-outline bg-slate-50/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Danh sách Mẫu Quảng Cáo con & Bài Post (Ads trong Ad Set)
              </h4>
              <p className="text-[11px] text-muted">
                {activeStart || activeEnd ? (
                  <>Số liệu mẫu quảng cáo con đã lọc theo kỳ: <strong className="text-emerald-700">{activeStart ? formatDateVN(activeStart) : 'Từ đầu'}</strong> → <strong className="text-emerald-700">{activeEnd ? formatDateVN(activeEnd) : 'Hiện tại'}</strong></>
                ) : (
                  <>Theo dõi hiệu quả từng creative, bài post Facebook, lượt tin nhắn và chi phí (Toàn bộ thời gian)</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500">
                Tổng số: <strong>{displayAds.length} Ads</strong>
              </span>

              <button
                type="button"
                onClick={() => setIsExportAdsOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                title="Xuất bảng mẫu quảng cáo con & bài post ra Google Sheet / CSV"
              >
                <FileSpreadsheet size={14} />
                <span>Xuất Báo Cáo Ads</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-muted uppercase border-b border-outline">
                <tr>
                  <th className="px-4 py-3">Mẫu Quảng Cáo & Bài Post</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3 text-right font-bold text-ink">Chi tiêu</th>
                  <th className="px-3 py-3 text-right font-bold text-emerald-800">Tổng chi phí (VAT+FTF)</th>
                  <th className="px-3 py-3 text-right">Hiển thị</th>
                  <th className="px-3 py-3 text-right">Clicks</th>
                  <th className="px-3 py-3 text-right">Tin nhắn</th>
                  <th className="px-3 py-3 text-right">CTR</th>
                  <th className="px-3 py-3 text-right">CPC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline text-[11px]">
                {displayAds.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted">
                      Chưa có danh sách mẫu quảng cáo con
                    </td>
                  </tr>
                ) : (
                  displayAds.map((ad) => (
                    <tr key={ad.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 max-w-md">
                        <div className="flex items-start gap-2.5">
                          {ad.thumbnail_url && (
                            <img
                              src={ad.thumbnail_url}
                              alt=""
                              className="size-9 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-ink line-clamp-1">{ad.ad_name}</p>
                            <p className="font-mono text-[10px] text-muted">ID: {ad.meta_ad_id}</p>
                            {ad.post_id && (
                              <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                                <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Post: {ad.post_id}
                                </span>
                                {ad.post_url && (
                                  <a
                                    href={ad.post_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                                  >
                                    <span>Xem bài post</span>
                                    <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                            )}
                            {ad.post_message && (
                              <p className="mt-0.5 text-[10px] text-slate-500 italic line-clamp-1">
                                "{ad.post_message}"
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ad.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                            }`}
                        >
                          <span className={`size-1.5 rounded-full ${ad.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {ad.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-ink">
                        {formatCurrencyVND(ad.spend_meta)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700">
                        {formatCurrencyVND(ad.total_spend)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-600">
                        {formatNumber(ad.impressions)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-600">
                        {formatNumber(ad.clicks)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700">
                        {formatNumber(ad.messages || 0)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-primary">
                        {ad.ctr}%
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-600">
                        {formatCurrencyVND(ad.cpc)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {displayAds.length > 0 && (
                <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-mono text-[11px] font-bold text-ink">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 font-sans">
                      TỔNG ({displayAds.length} MẪU QUẢNG CÁO)
                    </td>
                    <td className="px-3 py-3 text-right text-slate-800">
                      {formatCurrencyVND(displayAds.reduce((acc, a) => acc + (a.spend_meta || 0), 0))}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-700 font-extrabold">
                      {formatCurrencyVND(displayAds.reduce((acc, a) => acc + (a.total_spend || 0), 0))}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {formatNumber(displayAds.reduce((acc, a) => acc + (a.impressions || 0), 0))}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {formatNumber(displayAds.reduce((acc, a) => acc + (a.clicks || 0), 0))}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-700 font-extrabold">
                      {formatNumber(displayAds.reduce((acc, a) => acc + (a.messages || 0), 0))}
                    </td>
                    <td className="px-3 py-3 text-right text-primary font-semibold">
                      {(() => {
                        const totImp = displayAds.reduce((acc, a) => acc + (a.impressions || 0), 0)
                        const totClk = displayAds.reduce((acc, a) => acc + (a.clicks || 0), 0)
                        return totImp > 0 ? `${((totClk / totImp) * 100).toFixed(2)}%` : '0%'
                      })()}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {(() => {
                        const totSpend = displayAds.reduce((acc, a) => acc + (a.spend_meta || 0), 0)
                        const totClk = displayAds.reduce((acc, a) => acc + (a.clicks || 0), 0)
                        return totClk > 0 ? formatCurrencyVND(Math.round(totSpend / totClk)) : '-'
                      })()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB 2: HIỆU QUẢ CHI TIẾT TỪNG NGÀY */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Table header & data with day-by-day comparison */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                THỐNG KÊ CHI TIẾT TỪNG NGÀY & SO SÁNH BIẾN ĐỘNG
              </h4>
              <p className="text-[11px] text-muted">
                {activeStart || activeEnd ? (
                  <>Khoảng thời gian: <strong>{activeStart ? formatDateVN(activeStart) : 'Từ đầu'}</strong> → <strong>{activeEnd ? formatDateVN(activeEnd) : 'Hiện tại'}</strong> ({dailyMetricsWithComparison.length} ngày) — tự động so sánh từng ngày với ngày hôm trước</>
                ) : (
                  <>Hiển thị toàn bộ lịch sử <strong>{dailyMetricsWithComparison.length} ngày</strong> (tự động so sánh từng ngày với ngày hôm trước)</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 font-medium text-slate-600">
                <span className="text-emerald-600 font-bold">▲</span> Tăng so với hôm trước
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 font-medium text-slate-600">
                <span className="text-red-500 font-bold">▼</span> Giảm so với hôm trước
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-outline bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-muted uppercase border-b border-outline">
                <tr>
                  <th className="px-3 py-3">NGÀY</th>
                  <th className="px-3 py-3 text-right">CHI TIÊU META</th>
                  <th className="px-3 py-3 text-right">VAT (10%)</th>
                  <th className="px-3 py-3 text-right">FTF (1.1%)</th>
                  <th className="px-3 py-3 text-right font-bold text-ink">TỔNG CHI PHÍ</th>
                  <th className="px-3 py-3 text-right">CLICKS</th>
                  <th className="px-3 py-3 text-right">CTR</th>
                  <th className="px-3 py-3 text-right">CPC</th>
                  <th className="px-3 py-3 text-right">CPM</th>
                  <th className="px-3 py-3 text-right">KẾT QUẢ</th>
                  <th className="px-3 py-3 text-right">CPA</th>
                  <th className="px-3 py-3 text-right font-bold text-slate-700">SO SÁNH HÔM TRƯỚC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline font-mono text-[11px]">
                {dailyMetricsWithComparison.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-6 text-center text-muted font-sans text-xs">
                      Không có dữ liệu chi tiêu theo ngày
                    </td>
                  </tr>
                ) : (
                  dailyMetricsWithComparison.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="px-3 py-2.5 font-sans font-medium text-slate-800">
                        {formatDateVN(row.date)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600">
                        {formatCurrencyVND(row.spend_meta)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-500">
                        {formatCurrencyVND(row.spend_vat)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-500">
                        {formatCurrencyVND(row.ftf_amount)}
                      </td>
                      {/* TỔNG CHI PHÍ */}
                      <td className="px-3 py-2.5 text-right font-bold text-ink">
                        <div>{formatCurrencyVND(row.total_spend)}</div>
                        {row.comp.spend.status !== 'neutral' && row.prevDate && (
                          <div
                            className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${row.comp.spend.status === 'up' ? 'text-red-500' : 'text-emerald-600'
                              }`}
                            title={`So với ${row.prevDate}`}
                          >
                            {row.comp.spend.status === 'up' ? '▲' : '▼'} {row.comp.spend.pct}%
                          </div>
                        )}
                      </td>

                      {/* CLICKS */}
                      <td className="px-3 py-2.5 text-right text-slate-600">
                        {row.clicks.toLocaleString('vi-VN')}
                      </td>

                      {/* CTR (Tỷ lệ click) kèm tăng giảm */}
                      <td className="px-3 py-2.5 text-right">
                        <span className="text-emerald-700 font-semibold">{row.ctr}%</span>
                        {row.comp.ctr.status !== 'neutral' && row.prevDate && (
                          <div
                            className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${row.comp.ctr.status === 'up' ? 'text-emerald-600' : 'text-amber-600'
                              }`}
                            title={`So với ${row.prevDate}`}
                          >
                            {row.comp.ctr.status === 'up' ? '▲' : '▼'} {row.comp.ctr.pct}%
                          </div>
                        )}
                      </td>

                      {/* CPC (Chi phí / Click) kèm tăng giảm */}
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-700">
                        <div>{row.cpc > 0 ? formatCurrencyVND(row.cpc) : '-'}</div>
                        {row.cpc > 0 && row.comp.cpc.status !== 'neutral' && row.prevDate && (
                          <div
                            className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${row.comp.cpc.status === 'down' ? 'text-emerald-600' : 'text-red-500'
                              }`}
                            title={`So với ${row.prevDate}`}
                          >
                            {row.comp.cpc.status === 'up' ? '▲' : '▼'} {row.comp.cpc.pct}%
                          </div>
                        )}
                      </td>

                      {/* CPM (Chi phí / 1k hiển thị) kèm tăng giảm */}
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-700">
                        <div>{row.cpm > 0 ? formatCurrencyVND(row.cpm) : '-'}</div>
                        {row.cpm > 0 && row.comp.cpm.status !== 'neutral' && row.prevDate && (
                          <div
                            className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${row.comp.cpm.status === 'down' ? 'text-emerald-600' : 'text-red-500'
                              }`}
                            title={`So với ${row.prevDate}`}
                          >
                            {row.comp.cpm.status === 'up' ? '▲' : '▼'} {row.comp.cpm.pct}%
                          </div>
                        )}
                      </td>

                      {/* KẾT QUẢ kèm tăng giảm */}
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-700">
                        <div>{row.results.toLocaleString('vi-VN')}</div>
                        {row.comp.results.status !== 'neutral' && row.prevDate && (
                          <div
                            className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${row.comp.results.status === 'up' ? 'text-emerald-600' : 'text-red-500'
                              }`}
                            title={`So với ${row.prevDate}`}
                          >
                            {row.comp.results.status === 'up' ? '▲' : '▼'} {row.comp.results.pct}%
                          </div>
                        )}
                      </td>

                      {/* CPA */}
                      <td className="px-3 py-2.5 text-right text-slate-700">
                        <div>{row.cost_per_result > 0 ? formatCurrencyVND(row.cost_per_result) : '-'}</div>
                        {row.cost_per_result > 0 && row.comp.cpa.status !== 'neutral' && row.prevDate && (
                          <div
                            className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${row.comp.cpa.status === 'down' ? 'text-emerald-600' : 'text-red-500'
                              }`}
                            title={`So với ${row.prevDate}`}
                          >
                            {row.comp.cpa.status === 'up' ? '▲' : '▼'} {row.comp.cpa.pct}%
                          </div>
                        )}
                      </td>

                      {/* Cột SO SÁNH (Tổng chi tiêu so với ngày trước) */}
                      <td className="px-3 py-2.5 text-right font-sans font-semibold">
                        {row.comparison.status === 'down' ? (
                          <span className="inline-flex items-center gap-0.5 text-red-600 text-[11px]" title={`So với ${row.prevDate}`}>
                            ▼ {row.comparison.changePct}%
                          </span>
                        ) : row.comparison.status === 'up' ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[11px]" title={`So với ${row.prevDate}`}>
                            ▲ {row.comparison.changePct}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {dailyMetricsWithComparison.length > 0 && (
                <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-mono text-[11px] font-bold text-ink">
                  <tr>
                    <td className="px-3 py-3 font-sans">
                      TỔNG ({dailyMetricsWithComparison.length} NGÀY)
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {formatCurrencyVND(currentPeriod.spendMeta)}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {formatCurrencyVND(currentPeriod.spendVat)}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {formatCurrencyVND(currentPeriod.ftf)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-700 font-extrabold">
                      {formatCurrencyVND(currentPeriod.totalSpend)}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {currentPeriod.clicks.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-700">
                      {currentPeriod.ctr.toFixed(2)}%
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {currentPeriod.cpc > 0 ? formatCurrencyVND(currentPeriod.cpc) : '-'}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {currentPeriod.cpm > 0 ? formatCurrencyVND(currentPeriod.cpm) : '-'}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-700 font-extrabold">
                      {currentPeriod.results.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {currentPeriod.cpa > 0 ? formatCurrencyVND(currentPeriod.cpa) : '-'}
                    </td>
                    <td className="px-3 py-3 text-right font-sans text-muted font-normal text-[10px]">
                      Kỳ chọn
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* 7. TAB 3: TARGETING & CẤU HÌNH NHẮM MỤC TIÊU */}
      {activeTab === 'targeting' && (
        <div className="space-y-5">
          {/* Top Banner: Overview & Advantage+ Status */}
          <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-purple-600 text-white shadow-xs shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-headline text-base font-bold text-ink">
                    Cấu hình Nhắm mục tiêu & Đối tượng (Targeting Details)
                  </h3>
                  {parsedTargeting.advantageAudience ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-800 border border-purple-200">
                      <Sparkles size={11} />
                      Advantage+ Audience: Bật
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                      Targeting thủ công
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Thiết lập tệp khách hàng mục tiêu, vị trí địa lý, độ tuổi, sở thích và tối ưu hóa phân phối của AdSet.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => handleCopyId(parsedTargeting.rawJson)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-2xs hover:bg-purple-50 transition"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? 'Đã sao chép JSON' : 'Sao chép JSON'}</span>
              </button>
            </div>
          </div>

          {/* Grid Layout Cards */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Card 1: Nhân khẩu học (Demographics) */}
            <div className="rounded-xl border border-outline bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-outline pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">Nhân khẩu học (Demographics)</h4>
                    <p className="text-[11px] text-muted">Độ tuổi, giới tính và học vấn mục tiêu</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Độ tuổi */}
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Độ tuổi mục tiêu</span>
                  <p className="mt-1 font-mono text-base font-bold text-ink">
                    {parsedTargeting.ageRange}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">
                    Giới hạn hệ thống: {parsedTargeting.ageMin} - {parsedTargeting.ageMax} tuổi
                  </p>
                </div>

                {/* Giới tính */}
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Giới tính</span>
                  <p className="mt-1 text-base font-bold text-ink">
                    {parsedTargeting.genders}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">Phân phối đều cho cả 2 giới tính</p>
                </div>
              </div>

              {/* Trình độ học vấn */}
              {parsedTargeting.educationStatuses.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-muted block text-[11px] font-semibold flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-purple-600" />
                    Trình độ học vấn (Education Status)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedTargeting.educationStatuses.map((edu, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700 border border-purple-200"
                      >
                        <GraduationCap size={11} />
                        {edu}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Vị trí địa lý & Bản đồ thả ghim (Geofencing Map) */}
            <div className="rounded-xl border border-outline bg-white p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-outline pb-3">
                  <div className="flex items-center gap-2">
                    <div className="grid size-8 place-items-center rounded-lg bg-red-50 text-red-600">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink">Bản đồ Vị trí & Thả ghim (Geofencing)</h4>
                      <p className="text-[11px] text-muted">Khu vực phân phối và bán kính thả ghim thực tế</p>
                    </div>
                  </div>

                  {activeLoc?.radius ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                      <MapPin size={11} />
                      Bán kính: {activeLoc.radius} {activeLoc.unit}
                    </span>
                  ) : null}
                </div>

                {/* Multiple locations tab switcher */}
                {parsedTargeting.customLocations.length > 1 && (
                  <div className="flex items-center gap-1 overflow-x-auto pt-3 pb-1">
                    {parsedTargeting.customLocations.map((loc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedLocIndex(idx)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition ${
                          selectedLocIndex === idx
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Vị trí {idx + 1} ({loc.radius} {loc.unit})
                      </button>
                    ))}
                  </div>
                )}

                {/* Coordinates & Location info chips */}
                {activeLoc ? (
                  <div className="mt-3 rounded-lg bg-red-50/50 p-3 border border-red-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin size={13} className="text-red-500" />
                        <span>Bán kính quét: <strong>{activeLoc.radius} {activeLoc.unit}</strong> quanh tọa độ thả ghim</span>
                      </p>
                      <p className="font-mono text-[11px] text-slate-600">
                        Vĩ độ (Lat): {activeLoc.lat} • Kinh độ (Lng): {activeLoc.lng} ({activeLoc.country})
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${activeLoc.lat},${activeLoc.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 border border-red-200 hover:bg-red-50 shadow-2xs transition"
                    >
                      <span>Xem Google Maps</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {parsedTargeting.locations.map((loc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 border border-slate-200"
                      >
                        <MapPin size={10} className="text-red-500" />
                        {loc}
                      </span>
                    ))}
                  </div>
                )}

                {/* Embedded Interactive Map Frame */}
                {activeMapUrl && (
                  <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 mt-3 group">
                    <iframe
                      src={activeMapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Meta AdSet Target Geofence Map"
                      className="w-full h-full"
                    />

                    {/* Overlay badge on the map */}
                    {activeLoc && (
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-sm border border-slate-200 pointer-events-none">
                        <span className="relative flex size-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full size-2 bg-red-500"></span>
                        </span>
                        <span>Tâm thả ghim • Bán kính {activeLoc.radius} {activeLoc.unit}</span>
                      </div>
                    )}

                    {/* Direct external link button */}
                    {activeLoc && (
                      <a
                        href={`https://www.google.com/maps?q=${activeLoc.lat},${activeLoc.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg bg-white/95 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-red-700 shadow-sm border border-red-200 hover:bg-red-50 transition"
                      >
                        <span>Mở bản đồ lớn</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Location types */}
              {parsedTargeting.locationTypes.length > 0 && (
                <div className="pt-2 border-t border-outline/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Loại đối tượng theo địa điểm
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedTargeting.locationTypes.map((t, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-700 font-medium"
                      >
                        ✓ {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Nhắm mục tiêu chi tiết (Interests & Family Statuses) */}
            <div className="rounded-xl border border-outline bg-white p-5 shadow-xs space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-outline pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
                    <Compass size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">
                      Nhắm mục tiêu chi tiết (Detailed Targeting - Flexible Spec)
                    </h4>
                    <p className="text-[11px] text-muted">
                      Sở thích, hành vi và tình trạng gia đình được cấu hình trong nhóm quảng cáo
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tình trạng gia đình & Phụ huynh */}
                <div className="rounded-lg bg-pink-50/40 p-3.5 border border-pink-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-pink-900">
                    <Heart size={14} className="text-pink-600" />
                    <span>Tình trạng gia đình & Phụ huynh ({parsedTargeting.familyStatuses.length})</span>
                  </div>
                  {parsedTargeting.familyStatuses.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {parsedTargeting.familyStatuses.map((fam, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-pink-800 border border-pink-200 shadow-2xs"
                        >
                          <span className="size-1.5 rounded-full bg-pink-500" />
                          {fam}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted italic">Không cấu hình điều kiện gia đình</p>
                  )}
                </div>

                {/* Sở thích (Interests) */}
                <div className="rounded-lg bg-emerald-50/40 p-3.5 border border-emerald-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Sparkles size={14} className="text-emerald-600" />
                    <span>Sở thích liên quan (Interests - {parsedTargeting.interests.length})</span>
                  </div>
                  {parsedTargeting.interests.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {parsedTargeting.interests.map((it, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-2xs"
                        >
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          {it}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted italic">Không cấu hình sở thích cụ thể</p>
                  )}
                </div>
              </div>
            </div>

            {/* Card 4: Vị trí hiển thị & Tối ưu hóa phân phối */}
            <div className="rounded-xl border border-outline bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-outline pb-3">
                <div className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Layers size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">Vị trí hiển thị & Tối ưu hóa (Placements)</h4>
                  <p className="text-[11px] text-muted">Nền tảng xuất hiện và mục tiêu phân bổ của Meta</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-muted block text-[11px] mb-1 font-semibold">Vị trí hiển thị (Placements)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {detail?.targeting_info.placements.map((plc, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-800 border border-indigo-200"
                      >
                        {plc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] text-muted uppercase font-bold block">Mục tiêu tối ưu hóa</span>
                    <p className="font-semibold text-ink text-xs mt-0.5">{adset.optimization_goal}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] text-muted uppercase font-bold block">Sự kiện thanh toán</span>
                    <p className="font-semibold text-ink text-xs mt-0.5">{adset.billing_event}</p>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-muted block text-[11px] mb-0.5 font-semibold">Cài đặt phân bổ (Attribution)</span>
                  <p className="font-medium text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 text-[11px]">
                    {detail?.targeting_info.attribution}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 5: An toàn thương hiệu & Tự động hóa */}
            <div className="rounded-xl border border-outline bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-outline pb-3">
                <div className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">An toàn thương hiệu & Tự động hóa (Brand Safety)</h4>
                  <p className="text-[11px] text-muted">Bộ lọc nội dung và tính năng máy học Meta</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {/* Brand Safety Levels */}
                <div>
                  <span className="text-muted block text-[11px] mb-1 font-semibold">
                    Bộ lọc an toàn thương hiệu (Brand Safety Filters)
                  </span>
                  {parsedTargeting.brandSafety.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {parsedTargeting.brandSafety.map((bs: string, idx: number) => (
                        <span
                          key={idx}
                          className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-200"
                        >
                          ✓ {bs === 'FACEBOOK_RELAXED' ? 'Facebook: Tiêu chuẩn mở rộng (Relaxed)' : bs === 'AN_RELAXED' ? 'Audience Network: Mở rộng' : bs}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted italic">Mặc định tiêu chuẩn Meta</p>
                  )}
                </div>

                {/* Targeting Automation */}
                <div className="pt-2">
                  <span className="text-muted block text-[11px] mb-1 font-semibold">
                    Công nghệ máy học Meta Advantage+
                  </span>
                  <div className="rounded-lg bg-purple-50/60 p-3 border border-purple-100">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-purple-600" />
                      <span className="font-bold text-purple-900 text-xs">
                        {parsedTargeting.advantageAudience ? 'Advantage+ Audience: Đang hoạt động' : 'Nhắm mục tiêu cố định'}
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-800 mt-1">
                      {parsedTargeting.advantageAudience
                        ? 'Meta tự động phân tích hành vi và mở rộng hiển thị quảng cáo đến những người có khả năng phản hồi cao ngoài tệp gợi ý.'
                        : 'Quảng cáo chỉ phân phối nghiêm ngặt trong tệp đối tượng được cấu hình.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 6: Raw JSON Viewer (Collapsible) */}
          <div className="rounded-xl border border-outline bg-white p-4 shadow-xs">
            <button
              type="button"
              onClick={() => setShowRawJson((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-purple-700 transition"
            >
              <div className="flex items-center gap-2">
                <Code size={15} className="text-slate-500" />
                <span>Xem mã cấu hình JSON gốc từ Meta API (Raw Payload)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted">
                <span>{showRawJson ? 'Thu gọn' : 'Mở rộng'}</span>
                {showRawJson ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {showRawJson && (
              <div className="mt-3 pt-3 border-t border-outline/70">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => handleCopyId(parsedTargeting.rawJson)}
                    className="absolute right-2 top-2 rounded bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-300 transition"
                  >
                    {copied ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                  <pre className="max-h-72 overflow-y-auto rounded-lg bg-slate-900 p-4 font-mono text-[11px] text-slate-200">
                    {parsedTargeting.rawJson}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Xuất Báo Cáo Google Sheet cho các bài Ads con */}
      <ExportGoogleSheetModal
        isOpen={isExportAdsOpen}
        onClose={() => setIsExportAdsOpen(false)}
        items={displayAds.map((ad) => ({
          id: ad.id,
          name: `${ad.ad_name}${ad.post_id ? ` (Post: ${ad.post_id})` : ''}`,
          spend_meta: ad.spend_meta || 0,
          impressions: ad.impressions || 0,
          reach: Math.round(ad.impressions * 0.9),
          clicks: ad.clicks || 0,
          messages: ad.messages || 0,
        }))}
        brandName={adset?.brand_name || 'Chi tiết Ads'}
        startDate={activeStart}
        endDate={activeEnd}
        reportType="adset"
      />
    </div>
  )
}

export default AdSetDetailPage
