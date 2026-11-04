import {
  DollarSign,
  Receipt,
  Percent,
  Wallet,
  Building2,
  Layers,
  Tags,
  Calendar,
  Clock,
} from 'lucide-react'
import type { DashboardSummary } from '../../types/dashboard'
import { formatVND, formatDateTimeVN } from '../../utils/formatters'

interface SummaryCardsProps {
  summary?: DashboardSummary
  isLoading?: boolean
}

export function DashboardSummaryCards({ summary, isLoading }: SummaryCardsProps) {
  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-soft p-4" />
        ))}
      </div>
    )
  }

  const s = summary || {
    spendMeta: 0,
    spendVat: 0,
    ftfAmount: 0,
    totalSpend: 0,
    totalBms: 0,
    totalAccounts: 0,
    totalBrands: 0,
    dateRangeText: '-',
    lastSyncedAt: '',
  }

  const vatRate = s.vatRate ?? 0.10
  const ftfRate = s.ftfRate ?? 0.011
  const vatPercentLabel = `${Number((vatRate * 100).toFixed(2))}%`
  const ftfPercentLabel = `${Number((ftfRate * 100).toFixed(2))}%`

  return (
    <div className="mb-6 space-y-4">
      {/* Primary Financial Spend Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Spend (Highlight) */}
        <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary-soft/80 via-white to-primary-soft/30 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Total Spend (Thực tế)
            </span>
            <div className="grid size-9 place-items-center rounded-lg bg-primary text-white shadow-button">
              <Wallet size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink lg:text-3xl">
            {formatVND(s.totalSpend)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <span className="font-medium text-primary">VAT + FTF</span>
            <span>Tổng chi phí thực tế sau thuế & phí</span>
          </p>
        </div>

        {/* Spend (Meta) */}
        <div className="rounded-xl border border-outline bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Spend (Meta API)
            </span>
            <div className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-700">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight text-ink lg:text-2xl">
            {formatVND(s.spendMeta)}
          </p>
          <p className="mt-1 text-xs text-muted">Chi phí gốc ghi nhận từ Meta API</p>
        </div>

        {/* Spend (VAT Included) */}
        <div className="rounded-xl border border-outline bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Spend (VAT {vatPercentLabel})
            </span>
            <div className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <Receipt size={16} />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight text-ink lg:text-2xl">
            {formatVND(s.spendVat)}
          </p>
          <p className="mt-1 text-xs text-muted">Đã cộng thuế VAT {vatPercentLabel} ước tính</p>
        </div>

        {/* FTF Amount */}
        <div className="rounded-xl border border-outline bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Phí FTF ({ftfPercentLabel})
            </span>
            <div className="grid size-8 place-items-center rounded-lg bg-amber-50 text-amber-700">
              <Percent size={16} />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight text-ink lg:text-2xl">
            {formatVND(s.ftfAmount)}
          </p>
          <p className="mt-1 text-xs text-muted">Phí giao dịch ngoại tệ ({ftfPercentLabel})</p>
        </div>
      </div>

      {/* Scope & Metadata Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total BMs */}
        <div className="rounded-xl border border-outline bg-white px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-muted">
            <Building2 size={16} className="text-secondary" />
            <span className="text-xs font-medium">Business Portfolio</span>
          </div>
          <p className="mt-1 text-lg font-bold text-ink">{s.totalBms} BM</p>
        </div>

        {/* Total Ad Accounts */}
        <div className="rounded-xl border border-outline bg-white px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-muted">
            <Layers size={16} className="text-primary" />
            <span className="text-xs font-medium">Ad Accounts</span>
          </div>
          <p className="mt-1 text-lg font-bold text-ink">{s.totalAccounts} Tài khoản</p>
        </div>

        {/* Total Brands */}
        <div className="rounded-xl border border-outline bg-white px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-muted">
            <Tags size={16} className="text-purple-600" />
            <span className="text-xs font-medium">Brands</span>
          </div>
          <p className="mt-1 text-lg font-bold text-ink">{s.totalBrands} Thương hiệu</p>
        </div>

        {/* Date Range Viewing */}
        <div className="rounded-xl border border-outline bg-white px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-muted">
            <Calendar size={16} className="text-blue-600" />
            <span className="text-xs font-medium">Khoảng thời gian</span>
          </div>
          <p className="mt-1 truncate text-xs font-semibold text-ink" title={s.dateRangeText}>
            {s.dateRangeText}
          </p>
        </div>

        {/* Last Synced At */}
        <div className="col-span-2 rounded-xl border border-outline bg-white px-4 py-3.5 shadow-sm sm:col-span-1">
          <div className="flex items-center gap-2 text-muted">
            <Clock size={16} className="text-emerald-600" />
            <span className="text-xs font-medium">Đồng bộ gần nhất</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-ink">
            {formatDateTimeVN(s.lastSyncedAt)}
          </p>
        </div>
      </div>
    </div>
  )
}
