import { useState, useEffect } from "react";
import {
  ChevronRight,
  Trash2,
  Fingerprint,
  Link2,
  Save,
  SlidersHorizontal,
  TriangleAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useGetBusinessManagerById,
  useUpdateBusinessManager,
  useDeleteBusinessManager,
  useVerifyBusinessManager,
} from "../../hooks/business-manager.hook";

export default function EditBusinessManagerPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const bmId = id || "";

  const { data: bmData, isLoading: isFetching } = useGetBusinessManagerById(bmId);
  const bm = bmData?.data;

  const [form, setForm] = useState({
    name: "",
    bmId: "",
    platform: "META",
    accessToken: "",
    isActive: true,
  });

  const [verifyStatus, setVerifyStatus] = useState<{
    tested: boolean;
    valid?: boolean;
    message?: string;
    verifiedName?: string;
  }>({ tested: false });

  const [errorMsg, setErrorMsg] = useState("");

  const { mutate: updateBM, isPending: isUpdating } = useUpdateBusinessManager();
  const { mutate: deleteBM, isPending: isDeleting } = useDeleteBusinessManager();
  const { mutate: verifyBM, isPending: isVerifying } = useVerifyBusinessManager();

  // Populate data when fetched
  useEffect(() => {
    if (bm) {
      setForm({
        name: bm.business_name || "",
        bmId: bm.meta_business_id || "",
        platform: bm.platform || "META",
        accessToken: "",
        isActive: bm.is_active ?? true,
      });
    }
  }, [bm]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "isActive" ? value === "true" : value,
    }));

    if (name === "accessToken") {
      setVerifyStatus({ tested: false });
      setErrorMsg("");
    }
  };

  const handleVerify = () => {
    if (!form.bmId.trim() || !form.accessToken.trim()) {
      setErrorMsg("Vui lòng nhập Token mới để kiểm tra trước khi lưu.");
      return;
    }
    setErrorMsg("");

    verifyBM(
      {
        bm_id: form.bmId.trim(),
        token: form.accessToken.trim(),
        platform: form.platform,
      },
      {
        onSuccess: (res) => {
          if (res?.data?.valid) {
            setVerifyStatus({
              tested: true,
              valid: true,
              message: res.data.message || "Token hợp lệ và đã kết nối Meta!",
              verifiedName: res.data.business_name,
            });
            if (res.data.business_name) {
              setForm((prev) => ({
                ...prev,
                name: res.data.business_name,
              }));
            }
          } else {
            setVerifyStatus({
              tested: true,
              valid: false,
              message: res?.data?.message || "Token không hợp lệ hoặc không có quyền BM này.",
            });
          }
        },
        onError: (err: any) => {
          setVerifyStatus({
            tested: true,
            valid: false,
            message: err?.response?.data?.message || err.message || "Lỗi kiểm tra token.",
          });
        },
      }
    );
  };

  const handleSubmit = async () => {
    setErrorMsg("");

    updateBM(
      {
        id: bmId,
        data: {
          bm_id: form.bmId.trim(),
          business_name: form.name.trim(),
          platform: form.platform,
          token: form.accessToken.trim(), // Nếu để trống backend sẽ giữ token cũ
          is_active: form.isActive,
        },
      },
      {
        onSuccess: () => {
          navigate("/business-managers");
        },
        onError: (err: any) => {
          setErrorMsg(err?.response?.data?.message || "Lỗi khi cập nhật Business Manager.");
        },
      }
    );
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Business Manager này khỏi hệ thống?")) {
      return;
    }

    deleteBM(bmId, {
      onSuccess: () => {
        navigate("/business-managers");
      },
      onError: (err: any) => {
        alert("Lỗi khi xóa BM: " + (err?.response?.data?.message || err.message));
      },
    });
  };

  if (isFetching) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-emerald-700" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f7f9fc] p-4 md:p-6">
      <main className="mx-auto w-full max-w-[1000px]">
        {/* HEADER */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-1 text-sm text-slate-500">
            <Link
              to="/business-managers"
              className="transition hover:text-emerald-700"
            >
              Business Portfolio
            </Link>
            <ChevronRight size={15} />
            <span>Chỉnh sửa BM</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Chỉnh sửa Business Manager & Cập nhật Token
          </h1>

          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 font-mono">
            <Fingerprint size={16} />
            <span>Meta ID: {form.bmId || bmId}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        {/* FORM */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
            <SlidersHorizontal size={19} className="text-emerald-700" />
            <h2 className="font-semibold text-slate-900">
              Thông tin cấu hình & Token
            </h2>
          </div>

          <div className="space-y-6">
            {/* NAME */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-slate-600">
                Tên Business Manager
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Tên Business Manager"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
              />
            </div>

            {/* BM ID */}
            <div className="space-y-1.5">
              <label htmlFor="bmId" className="block text-sm font-medium text-slate-600">
                Meta Business ID
              </label>
              <input
                id="bmId"
                name="bmId"
                type="text"
                disabled
                value={form.bmId}
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 font-mono text-sm text-slate-500 outline-none cursor-not-allowed"
              />
            </div>

            {/* TOKEN UPDATE */}
            <div className="space-y-1.5 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between">
                <label htmlFor="accessToken" className="block text-sm font-medium text-slate-600">
                  Cập nhật Access Token mới (Tùy chọn)
                </label>
                <span className="text-[11px] text-slate-400">
                  Nếu không đổi, để trống để giữ nguyên token cũ
                </span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="accessToken"
                  name="accessToken"
                  type="password"
                  value={form.accessToken}
                  onChange={handleChange}
                  placeholder="Dán token mới nếu cần thay thế (EAAG...)"
                  className="w-full flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs text-slate-800 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
                />

                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isVerifying || !form.accessToken.trim()}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang kiểm tra...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>Xác thực với Meta</span>
                    </>
                  )}
                </button>
              </div>

              {/* VERIFICATION FEEDBACK */}
              {verifyStatus.tested && (
                <div
                  className={`mt-2.5 flex items-start gap-2.5 rounded-lg p-3 text-xs ${
                    verifyStatus.valid
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {verifyStatus.valid ? (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{verifyStatus.message}</p>
                    {verifyStatus.valid && verifyStatus.verifiedName && (
                      <p className="mt-0.5 text-slate-600">
                        Tên BM xác thực từ Meta:{" "}
                        <strong className="text-emerald-900">{verifyStatus.verifiedName}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* STATUS */}
            <div className="space-y-1.5 border-t border-slate-100 pt-5">
              <label htmlFor="isActive" className="block text-sm font-medium text-slate-600">
                Trạng thái hệ thống
              </label>

              <select
                id="isActive"
                name="isActive"
                value={String(form.isActive)}
                onChange={handleChange}
                className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
              >
                <option value="true">Hoạt động (Active)</option>
                <option value="false">Tạm ngưng (Inactive)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          {/* DELETE */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isUpdating}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium text-red-600 transition hover:border-red-100 hover:bg-red-50 disabled:opacity-50 sm:w-auto"
          >
            <Trash2 size={17} />
            <span>{isDeleting ? "Đang xóa..." : "Xóa Business Manager"}</span>
          </button>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            {/* CANCEL */}
            <button
              type="button"
              onClick={() => navigate("/business-managers")}
              disabled={isUpdating || isDeleting}
              className="flex-1 rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:flex-none"
            >
              Hủy
            </button>

            {/* SAVE */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUpdating || isDeleting || isVerifying}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              {isUpdating ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <Save size={17} />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}