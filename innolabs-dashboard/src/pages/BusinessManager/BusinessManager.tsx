import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Settings,
  TriangleAlert,
  Database,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router";

import { useGetBusinessManagers } from "../../hooks/business-manager.hook";
import { QuickBMImportModal } from "../../components/business-manager/QuickBMImportModal";
import { triggerSyncNow } from "../../api/dashboard.api";

/* =========================
   TYPES
========================= */

type BMStatus = "active" | "inactive";

type BusinessManager = {
  id: string;
  platform: string;
  meta_business_id: string;
  business_name: string;
  is_active: boolean;
  initial_sync_completed: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

/* =========================
   HELPERS
========================= */

function formatDate(value?: string | null) {
  if (!value) {
    return "Chưa đồng bộ";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
}

/* =========================
   STATUS BADGE
========================= */

function StatusBadge({ isActive }: { isActive: boolean }) {
  const config = isActive
    ? {
        label: "Đang hoạt động",
        className: "bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
      }
    : {
        label: "Ngừng hoạt động",
        className: "bg-slate-100 text-slate-600",
        dot: "bg-slate-400",
      };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />

      {config.label}
    </span>
  );
}

/* =========================
   SYNC BADGE
========================= */

function SyncBadge({
  completed,
}: {
  completed: boolean;
}) {
  const config = completed
    ? {
        label: "Đã đồng bộ",
        className: "bg-blue-50 text-blue-700",
        dot: "bg-blue-500",
      }
    : {
        label: "Chưa đồng bộ",
        className: "bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
      };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />

      {config.label}
    </span>
  );
}

/* =========================
   PLATFORM BADGE
========================= */

function PlatformBadge({
  platform,
}: {
  platform: string;
}) {
  const normalizedPlatform = platform?.toUpperCase();

  const config = {
    META: {
      text: "M",
      label: "Meta",
      className: "bg-blue-50 text-blue-600",
    },

    FACEBOOK: {
      text: "F",
      label: "Facebook",
      className: "bg-blue-50 text-blue-600",
    },

    TIKTOK: {
      text: "T",
      label: "TikTok",
      className: "bg-slate-900 text-white",
    },

    GOOGLE: {
      text: "G",
      label: "Google Ads",
      className: "bg-emerald-50 text-emerald-600",
    },
  };

  const item =
    config[
      normalizedPlatform as keyof typeof config
    ] ?? {
      text: platform?.charAt(0)?.toUpperCase() || "?",
      label: platform || "Unknown",
      className: "bg-slate-100 text-slate-600",
    };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${item.className}`}
      >
        {item.text}
      </div>

      <span className="text-sm text-slate-700">
        {item.label}
      </span>
    </div>
  );
}

/* =========================
   PAGE
========================= */

export default function BusinessManagerPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BMStatus | "">("");
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    data,
    isLoading,
    refetch,
  } = useGetBusinessManagers();

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await triggerSyncNow();
      alert(res.message || "Đồng bộ Meta thành công!");
      refetch();
    } catch (err: any) {
      alert("Lỗi đồng bộ: " + (err?.response?.data?.message || err.message));
    } finally {
      setIsSyncing(false);
    }
  };
  
  /* =========================
     DATA
  ========================= */

  const businessManagers: BusinessManager[] =
    data?.data ?? [];

  /* =========================
     STATISTICS
  ========================= */

  const totalBM = businessManagers.length;

  const activeBM = businessManagers.filter(
    (bm) => bm.is_active,
  ).length;

  const inactiveBM = businessManagers.filter(
    (bm) => !bm.is_active,
  ).length;

  const syncedBM = businessManagers.filter(
    (bm) => bm.initial_sync_completed,
  ).length;

  const activePercentage =
    totalBM > 0
      ? Math.round((activeBM / totalBM) * 100)
      : 0;

  /* =========================
     FILTER
  ========================= */

  const filteredBusinessManagers = useMemo(() => {
    const keyword = search
      .toLowerCase()
      .trim();

    return businessManagers.filter((bm) => {
      const matchSearch =
        !keyword ||
        bm.business_name
          ?.toLowerCase()
          .includes(keyword) ||
        bm.meta_business_id
          ?.toLowerCase()
          .includes(keyword);

      const matchStatus =
        status === ""
          ? true
          : status === "active"
            ? bm.is_active
            : !bm.is_active;

      return matchSearch && matchStatus;
    });
  }, [
    businessManagers,
    search,
    status,
  ]);

  return (
    <div className="min-h-full bg-[#f7f9fc] p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* =========================
            PAGE HEADER
        ========================= */}

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Quản lý Business Manager
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Theo dõi và quản lý tài nguyên Business Manager.
          </p>
        </div>

        {/* =========================
            STATISTICS
        ========================= */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tổng số BM
              </p>

              <Building2
                size={21}
                className="text-emerald-600"
              />
            </div>

            <h2 className="text-3xl font-bold text-slate-900">
              {totalBM}
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              Business Manager trong hệ thống
            </p>
          </div>

          {/* ACTIVE */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                BM đang hoạt động
              </p>

              <CheckCircle2
                size={21}
                className="text-emerald-600"
              />
            </div>

            <h2 className="text-3xl font-bold text-slate-900">
              {activeBM}
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              Chiếm {activePercentage}% tổng số BM
            </p>
          </div>

          {/* SYNCED */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Đã đồng bộ
              </p>

              <Database
                size={21}
                className="text-blue-600"
              />
            </div>

            <h2 className="text-3xl font-bold text-slate-900">
              {syncedBM}
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              Hoàn tất đồng bộ dữ liệu ban đầu
            </p>
          </div>

          {/* INACTIVE */}

          <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-50" />

            <div className="relative mb-2 flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                BM ngừng hoạt động
              </p>

              <TriangleAlert
                size={21}
                className="text-amber-600"
              />
            </div>

            <h2 className="relative text-3xl font-bold text-slate-900">
              {inactiveBM}
            </h2>

            <p className="relative mt-2 text-xs text-slate-500">
              Không tham gia đồng bộ dữ liệu
            </p>
          </div>
        </div>

        {/* =========================
            TABLE CONTAINER
        ========================= */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* =========================
              CONTROLS
          ========================= */}

          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">

              {/* SEARCH */}

              <div className="relative w-full sm:max-w-[320px]">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Tìm tên BM / Meta Business ID..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </div>

              {/* STATUS FILTER */}

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as BMStatus | "",
                  )
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
              >
                <option value="">
                  Tất cả trạng thái
                </option>

                <option value="active">
                  Đang hoạt động
                </option>

                <option value="inactive">
                  Ngừng hoạt động
                </option>
              </select>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={16} className={isSyncing ? "animate-spin text-emerald-600" : ""} />
                <span>{isSyncing ? "Đang đồng bộ..." : "Đồng bộ từ Meta"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQuickModalOpen(true)}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                <KeyRound size={16} />
                <span>Nhập nhanh 5 BM</span>
              </button>

              <Link
                to="create"
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <Plus size={18} />
                Thêm BM mới
              </Link>
            </div>
          </div>

          {/* =========================
              TABLE
          ========================= */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    BM Name & ID
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Platform
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Trạng thái
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Đồng bộ
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Đồng bộ gần nhất
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ngày tạo
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>

                {/* LOADING */}

                {isLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-14 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <RefreshCw
                          size={28}
                          className="mb-3 animate-spin text-emerald-600"
                        />

                        <p className="text-sm font-medium text-slate-600">
                          Đang tải dữ liệu...
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* DATA */}

                {!isLoading &&
                  filteredBusinessManagers.map((bm) => (
                    <tr
                      key={bm.id}
                      className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                    >

                      {/* BM NAME */}

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {bm.business_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Meta ID: {bm.meta_business_id}
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Internal ID: {bm.id}
                        </p>
                      </td>

                      {/* PLATFORM */}

                      <td className="px-6 py-4">
                        <PlatformBadge
                          platform={bm.platform}
                        />
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">
                        <StatusBadge
                          isActive={bm.is_active}
                        />
                      </td>

                      {/* SYNC */}

                      <td className="px-6 py-4">
                        <SyncBadge
                          completed={
                            bm.initial_sync_completed
                          }
                        />
                      </td>

                      {/* LAST SYNC */}

                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">
                          {formatDate(
                            bm.last_synced_at,
                          )}
                        </p>
                      </td>

                      {/* CREATED */}

                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">
                          {formatDate(bm.created_at)}
                        </p>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">

                          {/* SETTINGS / EDIT */}
                          <Link
                            to={`/business-manager/${bm.id}/edit`}
                            title="Chỉnh sửa & Cập nhật Token"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Settings size={18} />
                          </Link>

                          {/* SYNC */}
                          <button
                            type="button"
                            onClick={handleSync}
                            disabled={isSyncing}
                            title="Đồng bộ dữ liệu từ Meta"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                          >
                            <RefreshCw size={18} className={isSyncing ? "animate-spin text-emerald-600" : ""} />
                          </button>

                          {/* DETAIL */}
                          <Link
                            to={`/business-manager/${bm.id}/edit`}
                            title="Xem chi tiết"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye size={18} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}

                {/* EMPTY */}

                {!isLoading &&
                  filteredBusinessManagers.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-14 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <Search
                            size={30}
                            className="mb-3 text-slate-300"
                          />

                          <p className="font-medium text-slate-600">
                            Không tìm thấy Business Manager
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            Hãy thử thay đổi từ khóa hoặc trạng thái.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          {/* =========================
              FOOTER
          ========================= */}

          <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Hiển thị{" "}
              <span className="font-medium text-slate-700">
                {filteredBusinessManagers.length}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-medium text-slate-700">
                {totalBM}
              </span>{" "}
              Business Manager
            </p>

            {(search || status) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                }}
                className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      <QuickBMImportModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
      />
    </div>
  );
}