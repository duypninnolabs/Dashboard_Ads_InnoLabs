import { useState, useRef, useEffect } from 'react'
import {
  RotateCcw,
  RefreshCw,
  Calendar,
  Building2,
  Layers,
  Tags,
  Check,
  ChevronDown,
  Filter,
  CheckCircle2,
} from 'lucide-react'
import type { DashboardFilterState, FilterPreset, FilterOption } from '../../types/dashboard'

interface DashboardFiltersProps {
  filters: DashboardFilterState
  onSelectPreset: (preset: FilterPreset) => void
  onCustomDateChange: (start: string, end: string) => void
  onToggleBm: (id: string) => void
  onToggleAccount: (id: string) => void
  onToggleBrand: (name: string) => void
  onReset: () => void
  options: {
    bms: FilterOption[]
    accounts: FilterOption[]
    brands: FilterOption[]
  }
  isSyncing?: boolean
  onSyncNow: () => void
}

export function DashboardFilters({
  filters,
  onSelectPreset,
  onCustomDateChange,
  onToggleBm,
  onToggleAccount,
  onToggleBrand,
  onReset,
  options,
  isSyncing,
  onSyncNow,
}: DashboardFiltersProps) {
  const [bmOpen, setBmOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [brandOpen, setBrandOpen] = useState(false)

  const bmRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bmRef.current && !bmRef.current.contains(event.target as Node)) setBmOpen(false)
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false)
      if (brandRef.current && !brandRef.current.contains(event.target as Node)) setBrandOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasActiveFilters =
    filters.preset !== 'all' ||
    filters.bmIds.length > 0 ||
    filters.accountIds.length > 0 ||
    filters.brandNames.length > 0

  const handleSelectSingleBm = (bmId: string) => {
    if (filters.bmIds.length === 1 && filters.bmIds[0] === bmId) {
      // Unselect to view all
      onToggleBm(bmId)
    } else {
      // Clear other BMs and select this one
      options.bms.forEach((b) => {
        if (filters.bmIds.includes(b.value) && b.value !== bmId) {
          onToggleBm(b.value)
        }
      })
      if (!filters.bmIds.includes(bmId)) {
        onToggleBm(bmId)
      }
    }
  }

  const handleSelectAllBms = () => {
    options.bms.forEach((b) => {
      if (filters.bmIds.includes(b.value)) {
        onToggleBm(b.value)
      }
    })
  }

  return (
    <div className="mb-6 space-y-3">
      {/* 1. Quick Business Portfolio Switcher (Prominent Header) */}
      <div className="rounded-xl border border-outline bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Building2 size={15} className="text-primary" />
            Chọn Business Portfolio:
          </span>
          <span className="text-[11px] text-muted">
            {filters.bmIds.length === 0
              ? 'Đang xem: Toàn bộ Business Portfolio (Tất cả BM)'
              : `Đang lọc: ${filters.bmIds.length} Business Portfolio`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* All BMs pill */}
          <button
            type="button"
            onClick={handleSelectAllBms}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              filters.bmIds.length === 0
                ? 'border-primary bg-primary text-white shadow-button'
                : 'border-outline bg-surface-soft text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Tất cả Portfolio</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                filters.bmIds.length === 0 ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-800'
              }`}
            >
              {options.bms.length}
            </span>
          </button>

          {/* Individual BMs */}
          {options.bms.map((bm) => {
            const isSelected = filters.bmIds.includes(bm.value)
            return (
              <button
                key={bm.value}
                type="button"
                onClick={() => handleSelectSingleBm(bm.value)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  isSelected
                    ? 'border-primary bg-primary-soft text-primary font-semibold shadow-sm ring-1 ring-primary/30'
                    : 'border-outline bg-white text-ink hover:bg-surface-soft'
                }`}
              >
                <div
                  className={`size-2 rounded-full ${
                    isSelected ? 'bg-primary' : 'bg-slate-400'
                  }`}
                />
                <span className="truncate max-w-[190px]">{bm.label}</span>
                {isSelected && <Check size={14} className="text-primary" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Date presets, Filters & Sync Bar */}
      <div className="rounded-xl border border-outline bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Date presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted mr-1">
              <Calendar size={14} /> Thời gian:
            </span>
            <button
              type="button"
              onClick={() => onSelectPreset('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filters.preset === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-soft text-ink hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset('today')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filters.preset === 'today'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-soft text-ink hover:bg-slate-200'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset('this_week')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filters.preset === 'this_week'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-soft text-ink hover:bg-slate-200'
              }`}
            >
              Tuần này
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset('this_month')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filters.preset === 'this_month'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-soft text-ink hover:bg-slate-200'
              }`}
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset('custom')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filters.preset === 'custom'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-soft text-ink hover:bg-slate-200'
              }`}
            >
              Tùy chọn
            </button>

            {/* Custom Date Pickers */}
            {filters.preset === 'custom' && (
              <div className="flex items-center gap-2 rounded-lg border border-outline bg-surface-soft px-2.5 py-1 text-xs">
                <span className="text-muted">Từ</span>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => onCustomDateChange(e.target.value, filters.endDate)}
                  className="bg-transparent font-medium text-ink outline-none"
                />
                <span className="text-muted">đến</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => onCustomDateChange(filters.startDate, e.target.value)}
                  className="bg-transparent font-medium text-ink outline-none"
                />
              </div>
            )}

            <span className="hidden text-xs text-muted xl:inline">
              (GMT+7 Asia/Ho_Chi_Minh)
            </span>
          </div>

          {/* Action buttons: Reset & Sync Now */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1.5 rounded-lg border border-outline px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-slate-100 hover:text-ink"
              >
                <RotateCcw size={13} />
                <span>Xóa bộ lọc</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-button transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Detailed Filters: Account & Brand */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-outline/70 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <Filter size={14} />
            <span>Lọc chi tiết:</span>
          </div>

          {/* Account Dropdown */}
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => setAccountOpen(!accountOpen)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                filters.accountIds.length > 0
                  ? 'border-primary bg-emerald-50/50 text-primary'
                  : 'border-outline bg-white text-ink hover:bg-surface-soft'
              }`}
            >
              <Layers size={14} />
              <span>
                Ad Account {filters.accountIds.length > 0 ? `(${filters.accountIds.length})` : '(Tất cả)'}
              </span>
              <ChevronDown size={14} />
            </button>

            {accountOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-72 rounded-xl border border-outline bg-white p-2 shadow-lg">
                <div className="mb-1.5 px-2 py-1 text-xs font-semibold text-muted">
                  Chọn Tài khoản quảng cáo
                </div>
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {options.accounts.map((acc) => {
                    const selected = filters.accountIds.includes(acc.value)
                    return (
                      <button
                        key={acc.value}
                        type="button"
                        onClick={() => onToggleAccount(acc.value)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-ink hover:bg-surface-soft"
                      >
                        <span className="truncate">{acc.label}</span>
                        {selected && <Check size={14} className="text-primary" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Brand Dropdown */}
          <div className="relative" ref={brandRef}>
            <button
              type="button"
              onClick={() => setBrandOpen(!brandOpen)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                filters.brandNames.length > 0
                  ? 'border-purple-600 bg-purple-50/50 text-purple-700'
                  : 'border-outline bg-white text-ink hover:bg-surface-soft'
              }`}
            >
              <Tags size={14} />
              <span>
                Brand {filters.brandNames.length > 0 ? `(${filters.brandNames.length})` : '(Tất cả)'}
              </span>
              <ChevronDown size={14} />
            </button>

            {brandOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-xl border border-outline bg-white p-2 shadow-lg">
                <div className="mb-1.5 px-2 py-1 text-xs font-semibold text-muted">
                  Chọn Brand
                </div>
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {options.brands.map((br) => {
                    const selected = filters.brandNames.includes(br.value)
                    return (
                      <button
                        key={br.value}
                        type="button"
                        onClick={() => onToggleBrand(br.value)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-ink hover:bg-surface-soft"
                      >
                        <span className="truncate">{br.label}</span>
                        {selected && <Check size={14} className="text-primary" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
