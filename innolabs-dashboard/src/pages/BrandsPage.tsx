import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tags,
  Plus,
  Search,
  Layers,
  Megaphone,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { fetchBrandsApi, createBrandApi, deleteBrandApi, BrandData } from '../api/brand.api'
import { formatDateVN, formatCurrencyVND, formatNumber } from '../utils/formatters'

export function BrandsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [newBrandName, setNewBrandName] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Fetch real brands from MySQL
  const { data: brands = [], isLoading, isRefetching, refetch } = useQuery<BrandData[]>({
    queryKey: ['brands-list'],
    queryFn: fetchBrandsApi,
  })

  // Mutation to create brand
  const createMutation = useMutation({
    mutationFn: (name: string) => createBrandApi(name),
    onSuccess: (newBrand) => {
      queryClient.invalidateQueries({ queryKey: ['brands-list'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-filter-options'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-spend'] })
      setNewBrandName('')
      setShowAddModal(false)
      setFormError(null)
      setSuccessMsg(`Đã tạo thương hiệu "${newBrand?.brand_name || 'mới'}" thành công!`)
      setTimeout(() => setSuccessMsg(null), 4000)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo Brand'
      setFormError(msg)
    },
  })

  // Mutation to delete brand
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBrandApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands-list'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-filter-options'] })
      setSuccessMsg('Đã xóa thương hiệu thành công!')
      setTimeout(() => setSuccessMsg(null), 4000)
    },
  })

  const handleAddBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBrandName.trim()) {
      setFormError('Vui lòng nhập tên thương hiệu')
      return
    }
    setFormError(null)
    createMutation.mutate(newBrandName.trim())
  }

  const handleDeleteBrand = (id: number, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa thương hiệu "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const filtered = brands.filter((b) =>
    b.brand_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Quản trị Thương hiệu (Brands)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
              <Sparkles size={13} />
              {brands.length} Thương hiệu
            </span>
          </div>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Quản lý các thương hiệu, gán chiến dịch quảng cáo và theo dõi ngân sách chi tiêu Meta Ads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 rounded-lg border border-outline bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAddModal(true)
              setFormError(null)
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-button transition hover:bg-emerald-700"
          >
            <Plus size={16} />
            <span>Thêm Brand mới</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 animate-fadeIn">
          <CheckCircle2 size={16} className="text-primary shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Overview Statistics */}
      <div className="flex flex-col gap-3 rounded-xl border border-outline bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm thương hiệu theo tên..."
            className="field w-full pl-9 text-xs"
          />
        </div>
        <p className="text-xs text-muted">
          Hiển thị <strong>{filtered.length}</strong> / <strong>{brands.length}</strong> thương hiệu trong database
        </p>
      </div>

      {/* Brands Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-surface-soft p-4" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-outline bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-muted">
            <div className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400 mb-2">
              <Tags size={24} />
            </div>
            <p className="text-sm font-semibold text-ink">Không tìm thấy thương hiệu</p>
            <p className="mt-1 text-xs">
              {search ? 'Không có Brand nào khớp với từ khóa tìm kiếm.' : 'Chưa có Brand nào được tạo trong hệ thống.'}
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-button hover:bg-emerald-700"
            >
              <Plus size={14} />
              <span>Thêm Brand ngay</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((brand) => (
            <div
              key={brand.id}
              onClick={() => navigate(`/brands/${brand.id}`)}
              className="group flex flex-col justify-between rounded-xl border border-outline bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-purple-400 hover:-translate-y-0.5 cursor-pointer relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-10 place-items-center rounded-xl bg-purple-100 text-purple-700 shrink-0 font-bold text-xs group-hover:bg-purple-600 group-hover:text-white transition">
                      <Tags size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-headline text-base font-bold text-ink group-hover:text-purple-700 transition" title={brand.brand_name}>
                        {brand.brand_name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono rounded bg-slate-100 px-1.5 py-0.5 text-muted">ID: {brand.id}</span>
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                          {brand.adset_count ?? 0} AdSets · {brand.ads_count ?? 0} Ads
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete button (stopPropagation để không kích hoạt click thẻ) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteBrand(brand.id, brand.brand_name)
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 z-10"
                    title="Xóa Brand"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Key Metrics Summary for this Brand */}
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-medium text-muted block">Chi tiêu Meta</span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {formatCurrencyVND(brand.spend_meta || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-muted block">Tin nhắn / Lead</span>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      {formatNumber(brand.messages || 0)} mess
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Footer & Xem chi tiết */}
              <div className="mt-4 border-t border-outline/60 pt-3">
                <div className="flex items-center justify-between text-xs text-muted mb-2.5">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Megaphone size={12} className="text-primary" />
                    <strong>{brand.campaign_count ?? 0}</strong> Chiến dịch
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Layers size={12} className="text-secondary" />
                    <strong>{brand.account_count ?? 0}</strong> Tài khoản
                  </span>
                </div>

                {/* Direct CTA into 3-level tree workspace */}
                <div className="flex items-center justify-between gap-1 pt-2 border-t border-dashed border-slate-200">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 group-hover:text-purple-900 transition">
                    <span>Vào Không gian Brand (Cây AdSet ➔ Ads)</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition" />
                  </span>
                </div>
              </div>

              {brand.created_at && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                  <Calendar size={11} />
                  <span>Ngày tạo: {formatDateVN(brand.created_at)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Brand */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-outline bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                <Tags size={18} />
              </div>
              <h3 className="text-lg font-bold text-ink">Thêm Brand mới</h3>
            </div>
            <p className="mt-1 text-xs text-muted">
              Nhập tên thương hiệu để mapping với các chiến dịch Meta Ads trong hệ thống.
            </p>

            {formError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddBrandSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tên thương hiệu <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Ví dụ: PMP English, HSA VNES, InnoTech..."
                  className="field w-full text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline/70">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-outline px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !newBrandName.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-button hover:bg-emerald-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Xác nhận thêm</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrandsPage
