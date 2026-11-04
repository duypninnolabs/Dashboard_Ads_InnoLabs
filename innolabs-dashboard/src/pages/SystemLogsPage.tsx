import { useState, useMemo } from 'react'
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  LogIn,
  Sliders,
  Share2,
  AlertTriangle,
  Info,
  Clock,
  Laptop,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useGetSystemLogs } from '../hooks/systemlog.hook'
import type { SystemLogItem } from '../api/systemlog.api'

type TabType = 'all' | 'auth' | 'setting' | 'meta_ads' | 'error'

export function SystemLogsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [selectedLog, setSelectedLog] = useState<SystemLogItem | null>(null)

  // Mapping tab sang service param hoặc level param
  const queryParams = useMemo(() => {
    let service: string | undefined = undefined
    let level = levelFilter || undefined

    if (activeTab === 'auth') {
      service = 'auth'
    } else if (activeTab === 'setting') {
      service = 'setting'
    } else if (activeTab === 'meta_ads') {
      service = 'meta_ads'
    } else if (activeTab === 'error') {
      level = 'ERROR'
    }

    return {
      service,
      level,
      search: search.trim() || undefined,
      page,
      limit: 20,
    }
  }, [activeTab, levelFilter, search, page])

  const { data, isLoading, isFetching, refetch } = useGetSystemLogs(queryParams)

  const logs = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1

  // Format datetime
  const formatTime = (ts: string) => {
    if (!ts) return '-'
    const d = new Date(ts)
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Render Badge Level
  const renderLevelBadge = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <XCircle size={12} /> ERROR
          </span>
        )
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            <AlertTriangle size={12} /> WARN
          </span>
        )
      case 'ACTION':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            <CheckCircle2 size={12} /> ACTION
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <Info size={12} /> INFO
          </span>
        )
    }
  }

  // Render Service Badge
  const renderServiceBadge = (service?: string) => {
    switch (service) {
      case 'auth':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
            <LogIn size={13} /> Đăng nhập
          </span>
        )
      case 'setting':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">
            <Sliders size={13} /> Cấu hình
          </span>
        )
      case 'meta_ads':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
            <Share2 size={13} /> Meta Ads
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            <ScrollText size={13} /> Hệ thống
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-white shadow-button">
              <ScrollText size={20} />
            </div>
            <h1 className="font-headline text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Nhật ký hệ thống (System Logs)
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Theo dõi toàn diện lịch sử đăng nhập, các thay đổi cấu hình thuế phí và lịch sử chỉnh sửa trên Meta Ads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg border border-outline bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin text-primary' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Tabs Phân loại */}
      <div className="flex flex-wrap items-center gap-2 border-b border-outline pb-2">
        <button
          onClick={() => { setActiveTab('all'); setPage(1) }}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'all'
              ? 'bg-primary text-white shadow-button'
              : 'text-muted hover:bg-white hover:text-ink'
          }`}
        >
          <ScrollText size={15} />
          <span>Tất cả</span>
        </button>
        <button
          onClick={() => { setActiveTab('auth'); setPage(1) }}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'auth'
              ? 'bg-primary text-white shadow-button'
              : 'text-muted hover:bg-white hover:text-ink'
          }`}
        >
          <LogIn size={15} />
          <span>Lịch sử đăng nhập</span>
        </button>
        <button
          onClick={() => { setActiveTab('setting'); setPage(1) }}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'setting'
              ? 'bg-primary text-white shadow-button'
              : 'text-muted hover:bg-white hover:text-ink'
          }`}
        >
          <Sliders size={15} />
          <span>Thay đổi cấu hình</span>
        </button>
        <button
          onClick={() => { setActiveTab('meta_ads'); setPage(1) }}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'meta_ads'
              ? 'bg-primary text-white shadow-button'
              : 'text-muted hover:bg-white hover:text-ink'
          }`}
        >
          <Share2 size={15} />
          <span>Chỉnh sửa Meta Ads</span>
        </button>
        <button
          onClick={() => { setActiveTab('error'); setPage(1) }}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'error'
              ? 'bg-rose-600 text-white shadow-button'
              : 'text-muted hover:bg-white hover:text-rose-600'
          }`}
        >
          <AlertTriangle size={15} />
          <span>Lỗi hệ thống</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-outline bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Tìm theo nội dung, IP, người dùng..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-outline py-2 pl-9 pr-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-muted" />
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-outline bg-white px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
            >
              <option value="">Tất cả mức độ (Level)</option>
              <option value="INFO">INFO</option>
              <option value="ACTION">ACTION</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-xl border border-outline bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-outline bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Thời gian</th>
                <th className="px-3 py-3.5">Mức độ</th>
                <th className="px-3 py-3.5">Dịch vụ</th>
                <th className="px-3 py-3.5">Nội dung thao tác</th>
                <th className="px-3 py-3.5">IP</th>
                <th className="py-3.5 pl-3 pr-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/60">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 pl-4 pr-3"><div className="h-4 w-28 rounded bg-slate-200" /></td>
                    <td className="px-3 py-4"><div className="h-5 w-16 rounded bg-slate-200" /></td>
                    <td className="px-3 py-4"><div className="h-5 w-20 rounded bg-slate-200" /></td>
                    <td className="px-3 py-4"><div className="h-4 w-72 rounded bg-slate-200" /></td>
                    <td className="px-3 py-4"><div className="h-4 w-20 rounded bg-slate-200" /></td>
                    <td className="py-4 pl-3 pr-4 text-right"><div className="ml-auto h-4 w-10 rounded bg-slate-200" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <ScrollText size={32} className="mx-auto mb-2 text-slate-300" />
                    Không tìm thấy dữ liệu nhật ký nào.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.log_id}
                    className="transition hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="whitespace-nowrap py-3.5 pl-4 pr-3 font-mono text-[11px] text-muted">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5">
                      {renderLevelBadge(log.level)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5">
                      {renderServiceBadge(log.service)}
                    </td>
                    <td className="px-3 py-3.5 font-medium text-ink max-w-md truncate">
                      {log.message}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 font-mono text-muted">
                      {log.ip || '-'}
                    </td>
                    <td className="whitespace-nowrap py-3.5 pl-3 pr-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLog(log)
                        }}
                        className="inline-flex items-center gap-1 rounded-md p-1.5 text-muted hover:bg-slate-100 hover:text-ink"
                        title="Xem chi tiết"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-outline px-4 py-3 sm:flex-row">
          <span className="text-xs text-muted">
            Hiển thị <span className="font-medium text-ink">{logs.length}</span> /{' '}
            <span className="font-medium text-ink">{pagination.total}</span> dòng nhật ký
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-outline bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Trước
            </button>
            <span className="px-3 text-xs text-muted">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-outline bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-40"
            >
              Sau <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Chi Tiết Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-outline animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <ScrollText size={18} className="text-primary" />
                <h3 className="font-headline text-base font-bold text-ink">
                  Chi tiết nhật ký hoạt động
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-muted hover:bg-slate-200 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[75vh] overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <p className="text-[11px] font-semibold uppercase text-muted">Nội dung</p>
                <p className="mt-1 text-sm font-semibold text-ink bg-slate-50 p-3 rounded-lg border border-outline">
                  {selectedLog.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-muted">Thời gian</p>
                  <p className="mt-1 font-mono text-ink">{formatTime(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-muted">Mức độ / Dịch vụ</p>
                  <div className="mt-1 flex items-center gap-2">
                    {renderLevelBadge(selectedLog.level)}
                    {renderServiceBadge(selectedLog.service)}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-muted">Địa chỉ IP</p>
                  <p className="mt-1 font-mono text-ink">{selectedLog.ip || 'Không ghi nhận'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-muted">Log ID</p>
                  <p className="mt-1 font-mono text-ink truncate">{selectedLog.log_id}</p>
                </div>
              </div>

              {selectedLog.metadata && (
                <div>
                  <p className="text-[11px] font-semibold uppercase text-muted mb-1">
                    Metadata (Dữ liệu bổ sung)
                  </p>
                  <pre className="rounded-lg bg-slate-900 p-3 text-[11px] text-emerald-400 font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.request_body && (
                <div>
                  <p className="text-[11px] font-semibold uppercase text-muted mb-1">
                    Request Body
                  </p>
                  <pre className="rounded-lg bg-slate-900 p-3 text-[11px] text-sky-400 font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.request_body, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.errors && (
                <div>
                  <p className="text-[11px] font-semibold uppercase text-rose-600 mb-1">
                    Thông tin lỗi
                  </p>
                  <pre className="rounded-lg bg-rose-950 p-3 text-[11px] text-rose-200 font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.errors, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-outline px-6 py-3 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-button hover:bg-green-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
