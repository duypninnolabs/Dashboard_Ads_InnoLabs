import { useState, useMemo } from 'react'
import {
  TrendingUp,
  BarChart3,
  Building2,
  Layers,
  Tags,
} from 'lucide-react'
import type {
  SpendTrendPoint,
  CardItemData,
  MetricType,
} from '../../types/dashboard'
import { formatVND, formatPercent } from '../../utils/formatters'

interface DashboardChartsProps {
  dailyTrends: SpendTrendPoint[]
  bmCards: CardItemData[]
  accountCards: CardItemData[]
  brandCards: CardItemData[]
}

type TimeAggregation = 'day' | 'week' | 'month'

export function DashboardCharts({
  dailyTrends,
  bmCards,
  accountCards,
  brandCards,
}: DashboardChartsProps) {
  // Metric Switcher: Total Spend (default), Spend (Meta), Spend (VAT Included), FTF Amount
  const [metric, setMetric] = useState<MetricType>('totalSpend')
  const [timeAgg, setTimeAgg] = useState<TimeAggregation>('day')
  const [breakdownTab, setBreakdownTab] = useState<'bm' | 'account' | 'brand'>('bm')

  // Label for active metric
  const metricLabel = useMemo(() => {
    switch (metric) {
      case 'totalSpend':
        return 'Total Spend'
      case 'spendMeta':
        return 'Spend (Meta)'
      case 'spendVat':
        return 'Spend (VAT Included)'
      case 'ftfAmount':
        return 'FTF Amount (1.1%)'
    }
  }, [metric])

  // Aggregate points based on timeAgg
  const aggregatedPoints = useMemo(() => {
    if (dailyTrends.length === 0) return []

    if (timeAgg === 'day') {
      const slice = dailyTrends.length > 30 ? dailyTrends.slice(-30) : dailyTrends
      return slice.map((d) => ({
        label: d.displayDate,
        value: d[metric],
      }))
    }

    if (timeAgg === 'week') {
      // Group points into blocks of 7 days
      const weeks: { label: string; value: number }[] = []
      let currentVal = 0
      let weekIndex = 1
      dailyTrends.forEach((d, idx) => {
        currentVal += d[metric]
        if ((idx + 1) % 7 === 0 || idx === dailyTrends.length - 1) {
          weeks.push({
            label: `Tuần ${weekIndex}`,
            value: currentVal,
          })
          currentVal = 0
          weekIndex++
        }
      })
      return weeks
    }

    if (timeAgg === 'month') {
      const monthMap = new Map<string, number>()
      dailyTrends.forEach((d) => {
        const parts = d.date.split('-')
        const monthKey = parts.length === 3 ? `T${parts[1]}/${parts[0]}` : d.date
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + d[metric])
      })
      return Array.from(monthMap.entries()).map(([label, value]) => ({ label, value }))
    }

    return []
  }, [dailyTrends, metric, timeAgg])

  const maxVal = useMemo(() => {
    const values = aggregatedPoints.map((p) => p.value)
    return Math.max(...values, 1)
  }, [aggregatedPoints])

  // Breakdown items for right panel
  const activeBreakdown = useMemo(() => {
    let list: CardItemData[] = []
    if (breakdownTab === 'bm') list = bmCards
    if (breakdownTab === 'account') list = accountCards
    if (breakdownTab === 'brand') list = brandCards

    const totalSum = list.reduce((acc, curr) => acc + curr[metric], 0) || 1
    return list.slice(0, 6).map((item) => ({
      name: item.name,
      amount: item[metric],
      percentage: (item[metric] / totalSum) * 100,
    }))
  }, [breakdownTab, bmCards, accountCards, brandCards, metric])

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
      {/* 1. Main Time Trend Chart (Col span 2) */}
      <div className="rounded-xl border border-outline bg-white p-5 shadow-sm xl:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              <h2 className="text-base font-bold text-ink">Xu hướng chi tiêu ({metricLabel})</h2>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              Biểu đồ biến động chi phí theo thời gian thực tế từ cơ sở dữ liệu.
            </p>
          </div>

          {/* Time aggregation: Ngày, Tuần, Tháng */}
          <div className="inline-flex rounded-lg border border-outline bg-surface-soft p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTimeAgg('day')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                timeAgg === 'day'
                  ? 'bg-white text-primary shadow-sm font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Theo ngày
            </button>
            <button
              type="button"
              onClick={() => setTimeAgg('week')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                timeAgg === 'week'
                  ? 'bg-white text-primary shadow-sm font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Theo tuần
            </button>
            <button
              type="button"
              onClick={() => setTimeAgg('month')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                timeAgg === 'month'
                  ? 'bg-white text-primary shadow-sm font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Theo tháng
            </button>
          </div>
        </div>

        {/* Metric Switcher buttons (Section 6.4) */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-outline/60 py-2.5 text-xs">
          <span className="text-muted font-medium">Chỉ số hiển thị:</span>
          <button
            type="button"
            onClick={() => setMetric('totalSpend')}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              metric === 'totalSpend'
                ? 'bg-primary text-white shadow-sm font-semibold'
                : 'bg-surface-soft text-ink hover:bg-slate-200'
            }`}
          >
            Total Spend (Mặc định)
          </button>
          <button
            type="button"
            onClick={() => setMetric('spendMeta')}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              metric === 'spendMeta'
                ? 'bg-primary text-white shadow-sm font-semibold'
                : 'bg-surface-soft text-ink hover:bg-slate-200'
            }`}
          >
            Spend (Meta)
          </button>
          <button
            type="button"
            onClick={() => setMetric('spendVat')}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              metric === 'spendVat'
                ? 'bg-primary text-white shadow-sm font-semibold'
                : 'bg-surface-soft text-ink hover:bg-slate-200'
            }`}
          >
            Spend (VAT Included)
          </button>
          <button
            type="button"
            onClick={() => setMetric('ftfAmount')}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              metric === 'ftfAmount'
                ? 'bg-primary text-white shadow-sm font-semibold'
                : 'bg-surface-soft text-ink hover:bg-slate-200'
            }`}
          >
            FTF (1.1%)
          </button>
        </div>

        {/* Bar / Column Visualizer */}
        <div className="mt-6">
          {aggregatedPoints.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-xs text-muted">
              Không có dữ liệu xu hướng
            </div>
          ) : (
            <div className="flex h-56 items-end gap-2 overflow-x-auto pb-2 pt-6">
              {aggregatedPoints.map((pt, index) => {
                const heightPercent = Math.max(6, Math.round((pt.value / maxVal) * 100))
                return (
                  <div
                    key={index}
                    className="group relative flex flex-1 min-w-[28px] flex-col items-center justify-end h-full"
                  >
                    {/* Tooltip on hover */}
                    <div className="pointer-events-none absolute -top-10 z-20 hidden -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-[11px] text-white shadow-md group-hover:block whitespace-nowrap">
                      <p className="font-semibold">{pt.label}</p>
                      <p className="font-mono text-primary-soft">{formatVND(pt.value)}</p>
                    </div>

                    {/* Bar column */}
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 group-hover:bg-primary ${
                        metric === 'totalSpend'
                          ? 'bg-primary/80'
                          : metric === 'spendVat'
                          ? 'bg-emerald-600/80'
                          : metric === 'ftfAmount'
                          ? 'bg-amber-600/80'
                          : 'bg-secondary/80'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />

                    {/* X-axis label */}
                    <span className="mt-2 block truncate text-[10px] text-muted max-w-[40px] text-center">
                      {pt.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Spend Distribution by Dimension (Col span 1) */}
      <div className="rounded-xl border border-outline bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-secondary" />
            <h2 className="text-base font-bold text-ink">Phân bổ chi tiêu</h2>
          </div>
        </div>
        <p className="mt-0.5 text-xs text-muted">Tỷ trọng chi tiêu theo đối tượng được chọn.</p>

        {/* Breakdown Tabs: BM | Account | Brand */}
        <div className="mt-3 flex rounded-lg border border-outline bg-surface-soft p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setBreakdownTab('bm')}
            className={`flex-1 rounded-md py-1 font-medium transition ${
              breakdownTab === 'bm'
                ? 'bg-white text-secondary shadow-sm font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            Theo BM
          </button>
          <button
            type="button"
            onClick={() => setBreakdownTab('account')}
            className={`flex-1 rounded-md py-1 font-medium transition ${
              breakdownTab === 'account'
                ? 'bg-white text-primary shadow-sm font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            Theo Account
          </button>
          <button
            type="button"
            onClick={() => setBreakdownTab('brand')}
            className={`flex-1 rounded-md py-1 font-medium transition ${
              breakdownTab === 'brand'
                ? 'bg-white text-purple-700 shadow-sm font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            Theo Brand
          </button>
        </div>

        {/* Bars list */}
        <div className="mt-5 space-y-4">
          {activeBreakdown.length === 0 ? (
            <p className="text-center text-xs text-muted py-8">Chưa có dữ liệu phân bổ</p>
          ) : (
            activeBreakdown.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium text-ink max-w-[170px]" title={item.name}>
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-ink">
                      {formatVND(item.amount)}
                    </span>
                    <span className="font-mono text-muted text-[11px] w-12 text-right">
                      {formatPercent(item.percentage)}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-secondary/80 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(3, item.percentage))}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
