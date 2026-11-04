import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  WalletCards,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  RefreshCw,
  Power,
  ShieldCheck,
  Plus,
} from 'lucide-react'
import { fetchFilterOptionsApi } from '../api/dashboard.api'
import { formatDateTimeVN } from '../utils/formatters'
import { MOCK_ACCOUNTS, MOCK_BMS } from '../mock/dashboard.mock'

interface AdAccountItem {
  id: string
  metaAccountId: string
  accountName: string
  bmId: string
  bmName: string
  currency: string
  timezone: string
  accountStatus: 'ACTIVE' | 'DISABLED' | 'UNSETTLED'
  isSyncEnabled: boolean
  lastSyncedAt: string
}

export function AdAccountsPage() {
  const [search, setSearch] = useState('')
  const [bmFilter, setBmFilter] = useState('')

  // Query real accounts from database
  const { data: filterOptions, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-filter-options'],
    queryFn: fetchFilterOptionsApi,
  })

  const accounts: AdAccountItem[] = (filterOptions?.accounts && filterOptions.accounts.length > 0)
    ? filterOptions.accounts.map((acc, idx) => ({
        id: String(idx + 1),
        metaAccountId: acc.value,
        accountName: acc.label,
        bmId: acc.category || '',
        bmName: filterOptions.bms.find((b) => b.value === acc.category)?.label || 'InnoLabs Portfolio',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        accountStatus: 'ACTIVE',
        isSyncEnabled: true,
        lastSyncedAt: new Date().toISOString(),
      }))
    : MOCK_ACCOUNTS.map((acc, idx) => ({
        id: String(idx + 1),
        metaAccountId: acc.value,
        accountName: acc.label,
        bmId: '963054885398621',
        bmName: 'InnoLabs Portfolio',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        accountStatus: 'ACTIVE',
        isSyncEnabled: true,
        lastSyncedAt: new Date().toISOString(),
      }))


  const [syncStatus, setSyncStatus] = useState<Record<string, boolean>>({})

  const handleToggleSync = (id: string) => {
    setSyncStatus((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }))
  }

  const filtered = accounts.filter((acc) => {
    const matchSearch =
      !search ||
      acc.accountName.toLowerCase().includes(search.toLowerCase()) ||
      acc.metaAccountId.toLowerCase().includes(search.toLowerCase())
    const matchBm = !bmFilter || acc.bmId === bmFilter
    return matchSearch && matchBm
  })

  const syncEnabledCount = accounts.filter((a) => (syncStatus[a.id] !== undefined ? syncStatus[a.id] : a.isSyncEnabled)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Quản trị Ad Accounts
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Quản lý danh sách tài khoản quảng cáo Meta Ads, múi giờ và bật/tắt đồng bộ tự động.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 rounded-lg border border-outline bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw size={13} className={isRefetching ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={14} />
            {syncEnabledCount}/{accounts.length} Đang đồng bộ
          </span>
        </div>
      </div>

      {/* Control filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-outline bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tài khoản / Meta Account ID..."
              className="field w-full pl-9 text-xs"
            />
          </div>

          <select
            value={bmFilter}
            onChange={(e) => setBmFilter(e.target.value)}
            className="field text-xs sm:w-60"
          >
            <option value="">Tất cả Business Portfolio</option>
            {filterOptions?.bms?.map((bm) => (
              <option key={bm.value} value={bm.value}>
                {bm.label}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* Accounts Table */}
      <div className="overflow-hidden rounded-xl border border-outline bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-outline bg-surface-soft uppercase tracking-wider text-muted font-semibold">
              <tr>
                <th className="px-5 py-3.5">Ad Account</th>
                <th className="px-5 py-3.5">Business Portfolio</th>
                <th className="px-5 py-3.5">Tiền tệ & Múi giờ</th>
                <th className="px-5 py-3.5">Trạng thái Meta</th>
                <th className="px-5 py-3.5">Đồng bộ tự động</th>
                <th className="px-5 py-3.5">Cập nhật gần nhất</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline/60 text-ink">
              {filtered.map((acc) => {
                const isSync = syncStatus[acc.id] !== undefined ? syncStatus[acc.id] : acc.isSyncEnabled

                return (
                  <tr key={acc.id} className="hover:bg-surface-soft/60 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">{acc.accountName}</p>
                      <p className="font-mono text-[11px] text-muted">{acc.metaAccountId}</p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Building2 size={14} className="text-secondary" />
                        <span className="font-medium">{acc.bmName}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono font-semibold text-ink">{acc.currency}</span>
                      <p className="text-[11px] text-muted">{acc.timezone}</p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 size={12} />
                        {acc.accountStatus}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleSync(acc.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                          isSync
                            ? 'bg-primary-soft text-primary hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Power size={12} />
                        {isSync ? 'BẬT (4h/lần)' : 'TẮT'}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-muted">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatDateTimeVN(acc.lastSyncedAt)}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleSync(acc.id)}
                        className="rounded-lg border border-outline px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {isSync ? 'Dừng đồng bộ' : 'Kích hoạt'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdAccountsPage
