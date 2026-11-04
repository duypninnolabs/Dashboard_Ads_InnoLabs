import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ShieldAlert,
  Sliders,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  MessageCircle,
  Flame,
  BellRing,
  Save,
  RotateCcw,
  Search,
  Filter,
} from 'lucide-react'
import { fetchCampaignsApi, CampaignItem } from '../api/campaign.api'
import { fetchBrandsApi, BrandData } from '../api/brand.api'
import { formatCurrencyVND, formatNumber } from '../utils/formatters'

interface BrandBudgetSetting {
  monthlyBudget: number
  cprThreshold: number // Ngưỡng chi phí/tin nhắn tối đa cho phép
}

export function BudgetAlertsPage() {
  // Local storage để lưu hạn mức ngân sách theo Brand
  const [budgetSettings, setBudgetSettings] = useState<Record<string, BrandBudgetSetting>>(() => {
    try {
      const saved = localStorage.getItem('innolabs_brand_budgets')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const [activeTab, setActiveTab] = useState<'alerts' | 'budgets'>('alerts')
  const [searchBrand, setSearchBrand] = useState('')
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('ALL')
  const [isSavedNotify, setIsSavedNotify] = useState(false)

  // Tải danh sách Campaigns thực tế
  const { data: campaignData, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['campaigns-budget-alerts'],
    queryFn: () => fetchCampaignsApi({}),
  })

  // Tải danh sách Brands
  const { data: brands = [], isLoading: loadingBrands } = useQuery<BrandData[]>({
    queryKey: ['brands-list'],
    queryFn: fetchBrandsApi,
  })

  const campaigns = campaignData?.campaigns || []

  // Xử lý lưu cài đặt hạn mức
  const handleUpdateBudget = (brandName: string, field: keyof BrandBudgetSetting, value: number) => {
    setBudgetSettings((prev) => ({
      ...prev,
      [brandName]: {
        monthlyBudget: prev[brandName]?.monthlyBudget || 20000000,
        cprThreshold: prev[brandName]?.cprThreshold || 50000,
        [field]: value,
      },
    }))
  }

  const handleSaveSettings = () => {
    localStorage.setItem('innolabs_brand_budgets', JSON.stringify(budgetSettings))
    setIsSavedNotify(true)
    setTimeout(() => setIsSavedNotify(false), 3000)
  }

  // Gom nhóm tổng chi tiêu và hiệu quả theo từng Brand
  const brandStats = React.useMemo(() => {
    const stats: Record<
      string,
      {
        totalSpend: number
        messages: number
        clicks: number
        campaignCount: number
        activeCampaigns: number
        avgCpr: number
      }
    > = {}

    campaigns.forEach((camp) => {
      const bName = camp.brand_name || 'Khác / Chưa phân loại'
      if (!stats[bName]) {
        stats[bName] = {
          totalSpend: 0,
          messages: 0,
          clicks: 0,
          campaignCount: 0,
          activeCampaigns: 0,
          avgCpr: 0,
        }
      }
      stats[bName].totalSpend += camp.total_spend || 0
      stats[bName].messages += camp.messages || 0
      stats[bName].clicks += camp.clicks || 0
      stats[bName].campaignCount += 1
      if (camp.campaign_status === 'ACTIVE' || camp.status === 'ACTIVE') {
        stats[bName].activeCampaigns += 1
      }
    })

    Object.keys(stats).forEach((bName) => {
      const s = stats[bName]
      s.avgCpr = s.messages > 0 ? s.totalSpend / s.messages : 0
    })

    return stats
  }, [campaigns])

  // Tự động phân tích và tạo CẢNH BÁO THÔNG MINH (Smart Alerts)
  const smartAlerts = React.useMemo(() => {
    const alerts: Array<{
      id: string
      type: 'danger' | 'warning' | 'info'
      title: string
      message: string
      brandName: string
      campaignId?: number
      valueText: string
      actionHint: string
    }> = []

    // 1. Quét kiểm tra vượt ngân sách theo Brand
    Object.entries(brandStats).forEach(([bName, stat]) => {
      const cfg = budgetSettings[bName] || { monthlyBudget: 25000000, cprThreshold: 50000 }
      const percentUsed = (stat.totalSpend / cfg.monthlyBudget) * 100

      if (percentUsed >= 100) {
        alerts.push({
          id: `budget-over-${bName}`,
          type: 'danger',
          title: `VƯỢT HẠN MỨC NGÂN SÁCH THÁNG (${Math.round(percentUsed)}%)`,
          message: `Thương hiệu "${bName}" đã chi tiêu ${formatCurrencyVND(stat.totalSpend)}, vượt quá ngân sách đề ra ${formatCurrencyVND(cfg.monthlyBudget)}.`,
          brandName: bName,
          valueText: `${Math.round(percentUsed)}% ngân sách`,
          actionHint: 'Nên xem xét bổ sung ngân sách hoặc tạm dừng các chiến dịch chi phí cao.',
        })
      } else if (percentUsed >= 85) {
        alerts.push({
          id: `budget-warn-${bName}`,
          type: 'warning',
          title: `SẮP CHẠM HẠN MỨC NGÂN SÁCH (${Math.round(percentUsed)}%)`,
          message: `Thương hiệu "${bName}" đã dùng ${Math.round(percentUsed)}% hạn mức (${formatCurrencyVND(stat.totalSpend)} / ${formatCurrencyVND(cfg.monthlyBudget)}).`,
          brandName: bName,
          valueText: `${Math.round(percentUsed)}% đã dùng`,
          actionHint: 'Kiểm soát tốc độ cắn tiền trong những ngày còn lại của tháng.',
        })
      }
    })

    // 2. Quét kiểm tra chiến dịch có chi phí tin nhắn / kết quả quá cao (CPR Spike)
    campaigns.forEach((camp) => {
      const bName = camp.brand_name || 'Khác / Chưa phân loại'
      const cfg = budgetSettings[bName] || { monthlyBudget: 25000000, cprThreshold: 50000 }
      const cpr = camp.messages > 0 ? camp.total_spend / camp.messages : 0

      // Nếu đã tiêu trên 200k mà chi phí/mess vượt quá ngưỡng cho phép
      if (camp.total_spend > 200000 && cpr > cfg.cprThreshold) {
        alerts.push({
          id: `cpr-high-${camp.id}`,
          type: 'danger',
          title: `GIÁ TIN NHẮN TĂNG ĐỘT BIẾN (${formatCurrencyVND(cpr)}/mess)`,
          message: `Chiến dịch "${camp.campaign_name}" thuộc [${bName}] có chi phí tin nhắn cao vượt ngưỡng cho phép (${formatCurrencyVND(cfg.cprThreshold)}).`,
          brandName: bName,
          campaignId: camp.id,
          valueText: `${formatCurrencyVND(cpr)}/tin nhắn`,
          actionHint: 'Nên kiểm tra lại tệp đối tượng (Audience) hoặc thay đổi Creative/Banner mới.',
        })
      }

      // 3. Chiến dịch đốt tiền nhưng 0 tin nhắn (Zero Results Burning)
      if (camp.total_spend > 350000 && camp.messages === 0) {
        alerts.push({
          id: `zero-result-${camp.id}`,
          type: 'warning',
          title: `ĐỐT TIỀN NHƯNG CHƯA CÓ TIN NHẮN`,
          message: `Chiến dịch "${camp.campaign_name}" đã chi tiêu ${formatCurrencyVND(camp.total_spend)} nhưng chưa đem về lượt tin nhắn nào.`,
          brandName: bName,
          campaignId: camp.id,
          valueText: `Chi ${formatCurrencyVND(camp.total_spend)} (0 mess)`,
          actionHint: 'Nên cân nhắc tạm tắt hoặc kiểm tra lại luồng tin nhắn/nút kêu gọi hành động.',
        })
      }
    })

    return alerts
  }, [brandStats, budgetSettings, campaigns])

  const filteredAlerts = smartAlerts.filter((al) => {
    if (selectedBrandFilter !== 'ALL' && al.brandName !== selectedBrandFilter) return false
    return true
  })

  const brandListToDisplay = Object.keys(brandStats).filter((bName) =>
    !searchBrand || bName.toLowerCase().includes(searchBrand.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Hạn mức & Cảnh báo chi tiêu
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
              <ShieldAlert size={13} className="text-rose-600" />
              {smartAlerts.length} Cảnh báo
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Kiểm soát trần ngân sách từng thương hiệu, tự động phát hiện chiến dịch đốt tiền hoặc giá tin nhắn tăng cao.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 shadow-inner">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'alerts'
                ? 'bg-white text-ink shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <BellRing size={15} className={smartAlerts.length > 0 ? 'text-rose-600 animate-pulse' : ''} />
            <span>Danh sách Cảnh báo ({smartAlerts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'budgets'
                ? 'bg-white text-ink shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Sliders size={15} />
            <span>Cài đặt Hạn mức Ngân sách</span>
          </button>
        </div>
      </div>

      {isSavedNotify && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm animate-fade-in shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>Đã lưu thành công cấu hình hạn mức ngân sách và ngưỡng cảnh báo!</span>
        </div>
      )}

      {/* TAB 1: DANH SÁCH CẢNH BÁO THÔNG MINH */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Quick Filter */}
          <div className="flex flex-col gap-3 rounded-xl border border-outline bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted" />
              <span className="text-xs font-semibold text-slate-700">Lọc theo Brand:</span>
              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="rounded-lg border border-outline bg-slate-50 px-3 py-1.5 text-xs font-medium text-ink focus:border-primary focus:outline-none"
              >
                <option value="ALL">Tất cả thương hiệu ({smartAlerts.length} cảnh báo)</option>
                {Object.keys(brandStats).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-muted">
              Đang quét trực tiếp từ <strong>{campaigns.length}</strong> chiến dịch trong hệ thống
            </div>
          </div>

          {/* Alert Cards */}
          {filteredAlerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={30} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-emerald-900">Mọi thứ đang hoạt động tối ưu!</h3>
              <p className="mt-1 text-sm text-emerald-700 max-w-md mx-auto">
                Không có chiến dịch nào vượt ngưỡng giá tin nhắn và không có thương hiệu nào bị chạm trần ngân sách.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAlerts.map((al) => (
                <div
                  key={al.id}
                  className={`rounded-2xl border p-5 transition shadow-sm hover:shadow-md ${
                    al.type === 'danger'
                      ? 'border-rose-200 bg-rose-50/30'
                      : al.type === 'warning'
                      ? 'border-amber-200 bg-amber-50/30'
                      : 'border-blue-200 bg-blue-50/30'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          al.type === 'danger'
                            ? 'bg-rose-100 text-rose-600'
                            : al.type === 'warning'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {al.type === 'danger' ? (
                          <Flame size={20} />
                        ) : (
                          <AlertTriangle size={20} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold shadow-2xs border border-slate-200 text-slate-800">
                            {al.brandName}
                          </span>
                          <h4
                            className={`text-sm font-bold ${
                              al.type === 'danger'
                                ? 'text-rose-900'
                                : 'text-amber-900'
                            }`}
                          >
                            {al.title}
                          </h4>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                          {al.message}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500 bg-white/70 rounded-lg p-2 border border-slate-100">
                          <strong className="text-slate-800">💡 Khuyến nghị xử lý:</strong>
                          <span>{al.actionHint}</span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <span
                        className={`inline-block rounded-xl px-3 py-1.5 text-xs font-bold ${
                          al.type === 'danger'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-amber-500 text-white shadow-sm'
                        }`}
                      >
                        {al.valueText}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CÀI ĐẶT HẠN MỨC & NGƯỠNG CHI TIÊU */}
      {activeTab === 'budgets' && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-outline bg-white p-4 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Tìm kiếm thương hiệu để đặt ngân sách..."
                value={searchBrand}
                onChange={(e) => setSearchBrand(e.target.value)}
                className="w-full rounded-xl border border-outline bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-ink focus:border-primary focus:bg-white focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-button hover:bg-primary-hover transition"
            >
              <Save size={16} />
              <span>Lưu cấu hình hạn mức</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-outline bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-outline text-muted uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Thương hiệu (Brand)</th>
                  <th className="px-6 py-4">Đã chi tiêu thực tế</th>
                  <th className="px-6 py-4">Hạn mức Ngân sách tháng (VND)</th>
                  <th className="px-6 py-4">% Tiến độ chi tiêu</th>
                  <th className="px-6 py-4">Ngưỡng giá tin nhắn tối đa</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {brandListToDisplay.map((bName) => {
                  const stat = brandStats[bName]
                  const setting = budgetSettings[bName] || {
                    monthlyBudget: 25000000,
                    cprThreshold: 50000,
                  }
                  const percent = Math.min(
                    100,
                    Math.round((stat.totalSpend / setting.monthlyBudget) * 100)
                  )

                  return (
                    <tr key={bName} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">{bName}</div>
                        <div className="text-[11px] text-muted mt-0.5">
                          {stat.campaignCount} chiến dịch ({stat.activeCampaigns} đang bật)
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {formatCurrencyVND(stat.totalSpend)}
                        <div className="text-[11px] text-muted">
                          {formatNumber(stat.messages)} tin nhắn • CPR: {formatCurrencyVND(stat.avgCpr)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="relative max-w-[170px]">
                          <input
                            type="number"
                            step="1000000"
                            value={setting.monthlyBudget}
                            onChange={(e) =>
                              handleUpdateBudget(
                                bName,
                                'monthlyBudget',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full rounded-lg border border-outline bg-slate-50 px-3 py-1.5 text-xs font-bold text-ink focus:border-primary focus:bg-white focus:outline-none"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted font-bold">
                            đ
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-36 space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span
                              className={
                                percent >= 100
                                  ? 'text-rose-600'
                                  : percent >= 80
                                  ? 'text-amber-600'
                                  : 'text-primary'
                              }
                            >
                              {percent}%
                            </span>
                            <span className="text-muted text-[10px]">
                              {percent >= 100 ? 'Hết ngân sách' : 'Còn lại'}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                percent >= 100
                                  ? 'bg-rose-500'
                                  : percent >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-primary'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="relative max-w-[140px]">
                          <input
                            type="number"
                            step="5000"
                            value={setting.cprThreshold}
                            onChange={(e) =>
                              handleUpdateBudget(
                                bName,
                                'cprThreshold',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full rounded-lg border border-outline bg-slate-50 px-3 py-1.5 text-xs font-bold text-ink focus:border-primary focus:bg-white focus:outline-none"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted">
                            đ/tin
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {percent >= 100 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                            <Flame size={12} />
                            Vượt ngân sách
                          </span>
                        ) : percent >= 80 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            <AlertTriangle size={12} />
                            Cảnh báo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 size={12} />
                            An toàn
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default BudgetAlertsPage
