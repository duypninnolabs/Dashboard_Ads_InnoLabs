import { useState } from 'react'
import { LayoutGrid, ListFilter, Activity, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useDashboardSpend } from '../hooks/useDashboardSpend'
import { DashboardSummaryCards } from '../components/dashboard/DashboardSummaryCards'
import { DashboardFilters } from '../components/dashboard/DashboardFilters'
import { DashboardListView } from '../components/dashboard/DashboardListView'
import { DashboardCardView } from '../components/dashboard/DashboardCardView'
import { DashboardCharts } from '../components/dashboard/DashboardCharts'
import { ExportGoogleSheetModal } from '../components/dashboard/ExportGoogleSheetModal'
import { fetchCampaignsApi } from '../api/campaign.api'

export function DashboardPage() {
  const {
    filters,
    handleSelectPreset,
    handleCustomDateChange,
    handleToggleBm,
    handleToggleAccount,
    handleToggleBrand,
    handleResetFilters,
    options,
    isLoading,
    isRefetching,
    syncMutation,
    summary,
    // List View
    groupBy,
    setGroupBy,
    sort,
    setSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    processedRows,
    paginatedRows,
    totalPages,
    // Card View
    cardLevel,
    setCardLevel,
    cardItems,
    // Trends
    dailyTrends,
  } = useDashboardSpend()

  // Toggle between List View and Card View (Sections 6.2 & 6.3)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')

  const handleSortChange = (field: string) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  // Pre-generate cards for charts breakdown
  const bmCards = cardLevel === 'bm' ? cardItems : []
  const accountCards = cardLevel === 'account' ? cardItems : []
  const brandCards = cardLevel === 'brand' ? cardItems : []

  // State xuất báo cáo Google Sheet
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Tải danh sách campaigns tương ứng với filter ngày/brand hiện tại để xuất
  const { data: campaignData } = useQuery({
    queryKey: ['campaigns-export', filters.startDate, filters.endDate, filters.brandNames],
    queryFn: () =>
      fetchCampaignsApi({
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
      }),
    enabled: isExportModalOpen,
  })

  return (
    <div className="space-y-6">
      {/* Top Banner / Title Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Meta Ads Spend
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Theo dõi, kiểm soát và tổng hợp chi phí quảng cáo Meta Ads trên toàn bộ Business Portfolio của InnoLabs.
          </p>
        </div>

        {/* Actions & View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-button hover:bg-emerald-700 transition"
          >
            <FileSpreadsheet size={16} />
            <span>Xuất Báo Cáo Google Sheet</span>
          </button>

          <div className="inline-flex self-start rounded-xl border border-outline bg-white p-1 shadow-sm sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-primary text-white shadow-button'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <ListFilter size={15} />
              <span>List View (Bảng)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                viewMode === 'cards'
                  ? 'bg-primary text-white shadow-button'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <LayoutGrid size={15} />
              <span>Card View (Thẻ)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Mutation Notification / Banner */}
      {syncMutation.isSuccess && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <Activity size={16} />
            <span>{syncMutation.data.message}</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-600">Đã cập nhật cơ sở dữ liệu</span>
        </div>
      )}

      {/* Section 5: Filters (Time, BM, Account, Brand, Sync Now) */}
      <DashboardFilters
        filters={filters}
        onSelectPreset={handleSelectPreset}
        onCustomDateChange={handleCustomDateChange}
        onToggleBm={handleToggleBm}
        onToggleAccount={handleToggleAccount}
        onToggleBrand={handleToggleBrand}
        onReset={handleResetFilters}
        options={options}
        isSyncing={syncMutation.isPending || isRefetching}
        onSyncNow={() => syncMutation.mutate()}
      />

      {/* Section 6.1: Summary Cards */}
      <DashboardSummaryCards summary={summary} isLoading={isLoading} />

      {/* Section 6.4: Thống kê & Charts */}
      <DashboardCharts
        dailyTrends={dailyTrends}
        bmCards={cardItems}
        accountCards={cardItems}
        brandCards={cardItems}
      />

      {/* Main Data Section: Either List View (6.2) or Card View (6.3) */}
      {viewMode === 'list' ? (
        <DashboardListView
          rows={paginatedRows}
          allFilteredRows={processedRows}
          summary={summary}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          sort={sort}
          onSortChange={handleSortChange}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(1)
          }}
          isLoading={isLoading}
        />
      ) : (
        <DashboardCardView
          cardLevel={cardLevel}
          onCardLevelChange={setCardLevel}
          cardItems={cardItems}
          isLoading={isLoading}
          onSelectBm={(bmId) => {
            handleToggleBm(bmId)
            setViewMode('list')
            setGroupBy('account')
          }}
        />
      )}

      {/* Modal Xuất Báo Cáo Google Sheet */}
      <ExportGoogleSheetModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        campaigns={campaignData?.campaigns || []}
        brandName={filters.brandNames?.length ? filters.brandNames.join(', ') : 'Tất cả thương hiệu'}
        startDate={filters.startDate}
        endDate={filters.endDate}
      />
    </div>
  )
}
export default DashboardPage
