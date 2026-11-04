import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react'
import type {
  GroupedRowData,
  GroupByOption,
  SortState,
  DashboardSummary,
} from '../../types/dashboard'
import { formatVND } from '../../utils/formatters'

interface DashboardListViewProps {
  rows: GroupedRowData[]
  allFilteredRows: GroupedRowData[]
  summary?: DashboardSummary
  groupBy: GroupByOption
  onGroupByChange: (option: GroupByOption) => void
  sort: SortState
  onSortChange: (field: string) => void
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  isLoading?: boolean
}

export function DashboardListView({
  rows,
  allFilteredRows,
  summary,
  groupBy,
  onGroupByChange,
  sort,
  onSortChange,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  isLoading,
}: DashboardListViewProps) {
  // Calculate Grand Total row from ALL filtered items (Section 6.2: "Dòng Total phải tính trên toàn bộ dữ liệu sau filter, không chỉ tính các dòng của trang hiện tại")
  const grandTotal = {
    spendMeta: summary?.spendMeta ?? allFilteredRows.reduce((acc, r) => acc + r.spendMeta, 0),
    spendVat: summary?.spendVat ?? allFilteredRows.reduce((acc, r) => acc + r.spendVat, 0),
    ftfAmount: summary?.ftfAmount ?? allFilteredRows.reduce((acc, r) => acc + r.ftfAmount, 0),
    totalSpend: summary?.totalSpend ?? allFilteredRows.reduce((acc, r) => acc + r.totalSpend, 0),
  }

  const renderSortIcon = (field: string) => {
    if (sort.field !== field) {
      return <ArrowUpDown size={13} className="text-muted/60" />
    }
    return sort.direction === 'asc' ? (
      <ArrowUp size={13} className="text-primary font-bold" />
    ) : (
      <ArrowDown size={13} className="text-primary font-bold" />
    )
  }

  return (
    <div className="rounded-xl border border-outline bg-white shadow-sm">
      {/* Header with Group By control */}
      <div className="flex flex-col gap-3 border-b border-outline p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">Bảng chi tiết chi phí quảng cáo (List View)</h2>
          <p className="text-xs text-muted">
            Hiển thị chi phí quảng cáo Meta Ads, thuế VAT và phí FTF theo cấu hình.
          </p>
        </div>

        {/* Group By selector */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <Layers size={14} /> Group By:
          </span>
          <div className="inline-flex rounded-lg border border-outline bg-surface-soft p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onGroupByChange('none')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                groupBy === 'none'
                  ? 'bg-white text-primary shadow-sm font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Chi tiết
            </button>
            <button
              type="button"
              onClick={() => onGroupByChange('bm')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                groupBy === 'bm'
                  ? 'bg-white text-primary shadow-sm font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Theo BM
            </button>
            <button
              type="button"
              onClick={() => onGroupByChange('account')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                groupBy === 'account'
                  ? 'bg-white text-primary shadow-sm font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Theo Account
            </button>
            <button
              type="button"
              onClick={() => onGroupByChange('brand')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                groupBy === 'brand'
                  ? 'bg-white text-primary shadow-sm font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Theo Brand
            </button>
          </div>
        </div>
      </div>

      {/* Table content */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-xs">
          <thead className="border-b border-outline bg-surface-soft uppercase tracking-wider text-muted font-semibold">
            <tr>
              <th
                onClick={() => onSortChange('bmName')}
                className="cursor-pointer px-4 py-3 hover:text-ink"
              >
                <div className="flex items-center gap-1">
                  <span>BM</span>
                  {renderSortIcon('bmName')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('accountName')}
                className="cursor-pointer px-4 py-3 hover:text-ink"
              >
                <div className="flex items-center gap-1">
                  <span>Account</span>
                  {renderSortIcon('accountName')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('brandName')}
                className="cursor-pointer px-4 py-3 hover:text-ink"
              >
                <div className="flex items-center gap-1">
                  <span>Brand</span>
                  {renderSortIcon('brandName')}
                </div>
              </th>
              <th className="px-4 py-3">Currency</th>
              <th
                onClick={() => onSortChange('spendMeta')}
                className="cursor-pointer px-4 py-3 text-right hover:text-ink"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Spend (Meta)</span>
                  {renderSortIcon('spendMeta')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('spendVat')}
                className="cursor-pointer px-4 py-3 text-right hover:text-ink"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Spend (VAT Included)</span>
                  {renderSortIcon('spendVat')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('ftfAmount')}
                className="cursor-pointer px-4 py-3 text-right hover:text-ink"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>FTF (1.1%)</span>
                  {renderSortIcon('ftfAmount')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('totalSpend')}
                className="cursor-pointer px-4 py-3 text-right hover:text-ink"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total Spend</span>
                  {renderSortIcon('totalSpend')}
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-outline/60 text-ink">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted">
                  <div className="inline-flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-muted">
                    <div className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400 mb-2">
                      <Inbox size={24} />
                    </div>
                    <p className="text-sm font-semibold text-ink">No data available</p>
                    <p className="mt-1 text-xs">
                      Không tìm thấy dữ liệu chi tiêu Meta Ads trong khoảng thời gian hoặc bộ lọc đã chọn.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-surface-soft/60 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <div className="truncate max-w-[200px]" title={r.bmName}>
                      {r.bmName}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="truncate max-w-[220px]" title={r.accountName}>
                      {r.accountName}
                    </div>
                    {r.campaignName && (
                      <p className="mt-0.5 truncate text-[11px] text-muted max-w-[220px]" title={r.campaignName}>
                        {r.campaignName}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                      {r.brandName}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted">{r.currency}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium">
                    {formatVND(r.spendMeta)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-emerald-800">
                    {formatVND(r.spendVat)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-amber-800">
                    {formatVND(r.ftfAmount)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                    {formatVND(r.totalSpend)}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Dòng Total ở cuối bảng (Section 6.2: tính trên toàn bộ dữ liệu sau filter) */}
          {rows.length > 0 && (
            <tfoot className="border-t-2 border-primary/40 bg-primary-soft/40 font-bold text-ink">
              <tr>
                <td colSpan={4} className="px-4 py-3.5 text-xs uppercase tracking-wider text-primary">
                  Tổng cộng ({allFilteredRows.length} {groupBy === 'none' ? 'chiến dịch' : 'mục'})
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs">
                  {formatVND(grandTotal.spendMeta)}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs text-emerald-900">
                  {formatVND(grandTotal.spendVat)}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs text-amber-900">
                  {formatVND(grandTotal.ftfAmount)}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-sm text-primary">
                  {formatVND(grandTotal.totalSpend)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer */}
      {allFilteredRows.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-outline px-4 py-3 sm:flex-row text-xs text-muted">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-outline bg-white px-2 py-1 text-ink outline-none"
            >
              <option value={10}>10 dòng</option>
              <option value={25}>25 dòng</option>
              <option value={50}>50 dòng</option>
            </select>
            <span>
              trên tổng số <strong>{allFilteredRows.length}</strong> kết quả sau lọc
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>
              Trang <strong>{page}</strong> / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-outline p-1 text-ink hover:bg-surface-soft disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="rounded-lg border border-outline p-1 text-ink hover:bg-surface-soft disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
