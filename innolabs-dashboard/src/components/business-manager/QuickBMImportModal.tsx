import { useState } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  KeyRound,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import {
  useCreateBusinessManager,
  useVerifyBusinessManager,
} from "../../hooks/business-manager.hook";

type QuickBMItem = {
  id: string;
  bmId: string;
  bmName: string;
  token: string;
  status: "idle" | "verifying" | "valid" | "invalid";
  message?: string;
  verifiedName?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function QuickBMImportModal({ isOpen, onClose }: Props) {
  const [bms, setBms] = useState<QuickBMItem[]>([
    { id: "1", bmId: "", bmName: "", token: "", status: "idle" },
    { id: "2", bmId: "", bmName: "", token: "", status: "idle" },
    { id: "3", bmId: "", bmName: "", token: "", status: "idle" },
    { id: "4", bmId: "", bmName: "", token: "", status: "idle" },
    { id: "5", bmId: "", bmName: "", token: "", status: "idle" },
  ]);

  const [savingAll, setSavingAll] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const { mutateAsync: verifyBM } = useVerifyBusinessManager();
  const { mutateAsync: createBM } = useCreateBusinessManager();

  if (!isOpen) return null;

  const updateItem = (id: string, updates: Partial<QuickBMItem>) => {
    setBms((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleVerifyRow = async (item: QuickBMItem) => {
    if (!item.bmId.trim() || !item.token.trim()) {
      updateItem(item.id, {
        status: "invalid",
        message: "Chưa điền BM ID hoặc Token",
      });
      return;
    }

    updateItem(item.id, { status: "verifying", message: "Đang kiểm tra..." });

    try {
      const res = await verifyBM({
        bm_id: item.bmId.trim(),
        token: item.token.trim(),
      });

      if (res?.data?.valid) {
        updateItem(item.id, {
          status: "valid",
          message: "Token hợp lệ!",
          verifiedName: res.data.business_name,
          bmName: item.bmName || res.data.business_name,
        });
      } else {
        updateItem(item.id, {
          status: "invalid",
          message: res?.data?.message || "Token không hợp lệ",
        });
      }
    } catch (err: any) {
      updateItem(item.id, {
        status: "invalid",
        message: err?.response?.data?.message || err.message || "Lỗi kiểm tra",
      });
    }
  };

  const handleVerifyAll = async () => {
    const activeRows = bms.filter((b) => b.bmId.trim() && b.token.trim());
    if (activeRows.length === 0) return;

    for (const row of activeRows) {
      await handleVerifyRow(row);
    }
  };

  const handleSaveAll = async () => {
    const rowsToSave = bms.filter((b) => b.bmId.trim() && b.token.trim());
    if (rowsToSave.length === 0) return;

    setSavingAll(true);
    setSaveSuccessMsg("");

    let successCount = 0;
    try {
      for (const row of rowsToSave) {
        await createBM({
          bm_id: row.bmId.trim(),
          bm_name: row.bmName.trim() || row.verifiedName || `BM ${row.bmId}`,
          token: row.token.trim(),
          platform: "META",
          is_active: true,
        });
        successCount++;
      }
      setSaveSuccessMsg(`Đã lưu và mã hóa an toàn ${successCount} Business Managers!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      alert("Lỗi khi lưu: " + (err?.response?.data?.message || err.message));
    } finally {
      setSavingAll(false);
    }
  };

  const addRow = () => {
    setBms((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        bmId: "",
        bmName: "",
        token: "",
        status: "idle",
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (bms.length <= 1) return;
    setBms((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Nhập & Xác thực 5 Business Managers
              </h2>
              <p className="text-xs text-slate-500">
                Kiểm tra trực tiếp với Meta Graph API và mã hóa bảo mật token (AES-256)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {saveSuccessMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={16} /> {saveSuccessMsg}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3 w-40">BM ID (Meta)</th>
                  <th className="py-2.5 px-3 w-48">Tên Business (Tùy chọn)</th>
                  <th className="py-2.5 px-3">System User Token</th>
                  <th className="py-2.5 px-3 w-28 text-center">Xác thực</th>
                  <th className="py-2.5 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bms.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-400">
                      {index + 1}
                    </td>

                    {/* BM ID */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.bmId}
                        onChange={(e) =>
                          updateItem(item.id, {
                            bmId: e.target.value,
                            status: "idle",
                          })
                        }
                        placeholder="VD: 1048291..."
                        className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                      />
                    </td>

                    {/* BM Name */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.bmName}
                        onChange={(e) =>
                          updateItem(item.id, { bmName: e.target.value })
                        }
                        placeholder={item.verifiedName || "Tự động nhận diện"}
                        className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                      />
                    </td>

                    {/* Token */}
                    <td className="py-2.5 px-3">
                      <input
                        type="password"
                        value={item.token}
                        onChange={(e) =>
                          updateItem(item.id, {
                            token: e.target.value,
                            status: "idle",
                          })
                        }
                        placeholder="EAAG... (Dán token vào đây)"
                        className="w-full font-mono text-[11px] rounded-md border border-slate-200 px-2.5 py-1.5 text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                      />
                      {item.message && (
                        <p
                          className={`mt-1 text-[11px] flex items-center gap-1 ${
                            item.status === "valid"
                              ? "text-emerald-700 font-medium"
                              : item.status === "invalid"
                              ? "text-red-600"
                              : "text-slate-500"
                          }`}
                        >
                          {item.status === "valid" && <CheckCircle2 size={12} />}
                          {item.status === "invalid" && <AlertCircle size={12} />}
                          {item.message}
                        </p>
                      )}
                    </td>

                    {/* Verify button */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleVerifyRow(item)}
                        disabled={
                          item.status === "verifying" ||
                          !item.bmId.trim() ||
                          !item.token.trim()
                        }
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                          item.status === "valid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {item.status === "verifying" ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={12} />
                        )}
                        <span>{item.status === "valid" ? "Hợp lệ" : "Kiểm tra"}</span>
                      </button>
                    </td>

                    {/* Remove button */}
                    <td className="py-2.5 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Xóa dòng này"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <Plus size={14} />
              <span>Thêm dòng BM</span>
            </button>

            <button
              type="button"
              onClick={handleVerifyAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Kiểm tra tất cả</span>
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
          <p className="text-[11px] text-slate-500">
            Hệ thống tự động đồng bộ tài khoản quảng cáo ngay sau khi lưu.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={savingAll}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={
                savingAll ||
                bms.filter((b) => b.bmId.trim() && b.token.trim()).length === 0
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {savingAll ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang mã hóa & lưu...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Lưu tất cả BM</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
