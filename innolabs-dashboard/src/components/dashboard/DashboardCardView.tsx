import { Building2, Layers, Tags, Clock, Wallet, Percent, Inbox, ArrowRight, ExternalLink } from 'lucide-react'
import type { CardItemData, CardViewLevel } from '../../types/dashboard'
import { formatVND, formatPercent, formatDateTimeVN } from '../../utils/formatters'

interface DashboardCardViewProps {
  cardLevel: CardViewLevel
  onCardLevelChange: (level: CardViewLevel) => void
  cardItems: CardItemData[]
  isLoading?: boolean
  onSelectBm?: (bmId: string) => void
}

export function DashboardCardView({
  cardLevel,
  onCardLevelChange,
  cardItems,
  isLoading,
  onSelectBm,
}: DashboardCardViewProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Level switcher bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-outline bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div>
          <h2 className="text-base font-bold text-ink">Thẻ tổng hợp đối tượng (Card View)</h2>
          <p className="text-xs text-muted">
            Theo dõi chi tiêu, số lượng tài khoản và tỷ lệ đóng góp (Contribution Rate) theo từng cấp quản lý.
          </p>
        </div>

        {/* Level Switcher: BM | Account | Brand */}
        <div className="inline-flex rounded-lg border border-outline bg-surface-soft p-1 text-xs">
          <button
            type="button"
            onClick={() => onCardLevelChange('bm')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
              cardLevel === 'bm'
                ? 'bg-white text-secondary shadow-sm font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Building2 size={14} />
            <span>Theo Business Portfolio</span>
          </button>
          <button
            type="button"
            onClick={() => onCardLevelChange('account')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
              cardLevel === 'account'
                ? 'bg-white text-primary shadow-sm font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Layers size={14} />
            <span>Theo Ad Account</span>
          </button>
          <button
            type="button"
            onClick={() => onCardLevelChange('brand')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
              cardLevel === 'brand'
                ? 'bg-white text-purple-700 shadow-sm font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Tags size={14} />
            <span>Theo Brand</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-surface-soft p-4" />
          ))}
        </div>
      ) : cardItems.length === 0 ? (
        <div className="rounded-xl border border-outline bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-muted">
            <div className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400 mb-2">
              <Inbox size={24} />
            </div>
            <p className="text-sm font-semibold text-ink">No data available</p>
            <p className="mt-1 text-xs">Không có dữ liệu thẻ trong phạm vi bộ lọc đang chọn.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cardItems.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-xl border border-outline bg-white p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {cardLevel === 'bm' && <Building2 size={16} className="text-secondary shrink-0" />}
                      {cardLevel === 'account' && <Layers size={16} className="text-primary shrink-0" />}
                      {cardLevel === 'brand' && <Tags size={16} className="text-purple-600 shrink-0" />}
                      <h3 className="truncate font-headline text-base font-bold text-ink" title={item.name}>
                        {item.name}
                      </h3>
                    </div>
                    {item.subtitle && (
                      <p className="mt-1 truncate font-mono text-[11px] text-muted" title={item.subtitle}>
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                    {item.currency}
                  </span>
                </div>

                {/* Contribution Rate Bar (Section 6.3) */}
                <div className="mt-4 rounded-lg bg-surface-soft p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <Percent size={12} className="text-primary" /> Tỷ lệ đóng góp:
                    </span>
                    <span className="font-bold text-primary">
                      {formatPercent(item.contributionRate)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(3, item.contributionRate))}%` }}
                    />
                  </div>
                </div>

                {/* Financial breakdown */}
                <div className="mt-4 space-y-2 border-t border-outline/60 pt-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Spend (Meta):</span>
                    <span className="font-mono font-medium text-slate-800">
                      {formatVND(item.spendMeta)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Spend (VAT):</span>
                    <span className="font-mono font-medium text-emerald-800">
                      {formatVND(item.spendVat)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Phí FTF:</span>
                    <span className="font-mono font-medium text-amber-800">
                      {formatVND(item.ftfAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Spend & Footer */}
              <div className="mt-4 border-t border-outline/70 pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-primary">Total Spend</span>
                  <span className="font-headline text-lg font-bold text-primary">
                    {formatVND(item.totalSpend)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-dashed border-outline/60 pt-2 text-[11px] text-muted">
                  {cardLevel === 'bm' && item.accountCount != null ? (
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Layers size={12} className="text-primary" />
                      <strong>{item.accountCount}</strong> Ad Accounts
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatDateTimeVN(item.lastSyncedAt)}
                  </span>
                </div>

                {cardLevel === 'bm' && onSelectBm && (
                  <button
                    type="button"
                    onClick={() => onSelectBm(item.id)}
                    className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-outline bg-surface-soft py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-primary-soft hover:text-primary hover:border-primary/30"
                  >
                    <span>Xem chi tiết Portfolio này</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
