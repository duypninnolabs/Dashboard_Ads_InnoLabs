import { useState } from "react";
import {
  ChevronRight,
  Save,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  useCreateBusinessManager,
  useVerifyBusinessManager,
} from "../../hooks/business-manager.hook";

type Platform = "facebook" | "tiktok" | "google" | "";
type BMStatus = boolean;

type BusinessManagerForm = {
  bmName: string;
  bmId: string;
  platform: Platform;
  accessToken: string;
  isActive: BMStatus;
};

export default function CreateBusinessManagerPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<BusinessManagerForm>({
    bmName: "",
    bmId: "",
    platform: "facebook",
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

  const { mutate: createBM, isPending: isCreating } = useCreateBusinessManager();
  const { mutate: verifyBM, isPending: isVerifying } = useVerifyBusinessManager();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "isActive" ? value === "true" : value,
    }));
    // Reset verify status on credential change
    if (name === "bmId" || name === "accessToken") {
      setVerifyStatus({ tested: false });
      setErrorMsg("");
    }
  };

  const handleVerify = () => {
    if (!form.bmId.trim() || !form.accessToken.trim()) {
      setErrorMsg("Vui lòng nhập BM ID và Access Token trước khi kiểm tra.");
      return;
    }
    setErrorMsg("");

    verifyBM(
      {
        bm_id: form.bmId.trim(),
        token: form.accessToken.trim(),
        platform: form.platform || "facebook",
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
            // Auto fill BM name if empty
            if (!form.bmName && res.data.business_name) {
              setForm((prev) => ({
                ...prev,
                bmName: res.data.business_name,
              }));
            }
          } else {
            setVerifyStatus({
              tested: true,
              valid: false,
              message: res?.data?.message || "Token không hợp lệ hoặc không có quyền truy cập BM này.",
            });
          }
        },
        onError: (err: any) => {
          setVerifyStatus({
            tested: true,
            valid: false,
            message: err?.response?.data?.message || err.message || "Lỗi khi kết nối xác thực.",
          });
        },
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.bmId.trim() || !form.accessToken.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ BM ID và Access Token.");
      return;
    }

    createBM(
      {
        bm_name: form.bmName.trim() || (verifyStatus.verifiedName ?? `BM ${form.bmId}`),
        bm_id: form.bmId.trim(),
        platform: form.platform || "META",
        token: form.accessToken.trim(),
        is_active: form.isActive,
      },
      {
        onSuccess: () => {
          navigate("/business-managers");
        },
        onError: (err: any) => {
          setErrorMsg(err?.response?.data?.message || "Lỗi lưu Business Manager.");
        },
      }
    );
  };

  const handleCancel = () => {
    navigate("/business-managers");
  };


  return (
    <div className="min-h-full bg-[#f7f9fc] p-4 md:p-8">
      <main className="mx-auto w-full max-w-4xl">
        {/* HEADER */}
        <div className="mb-6">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex items-center text-sm text-slate-500"
          >
            <Link
              to="/business-manager"
              className="transition-colors hover:text-emerald-700"
            >
              BM Management
            </Link>

            <ChevronRight size={16} className="mx-1" />

            <span className="font-medium text-slate-800">
              Thêm BM mới
            </span>
          </nav>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Thêm mới Business Manager
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Nhập thông tin chi tiết để kết nối tài khoản Business Manager mới
            vào hệ thống.
          </p>
        </div>

        {/* FORM CARD */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* BASIC INFO */}
            <section>
              <h2 className="mb-4 border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">
                Thông tin cơ bản
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* BM NAME */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="bmName"
                    className="block text-sm font-medium text-slate-600"
                  >
                    Tên Business Manager{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="bmName"
                    name="bmName"
                    type="text"
                    required
                    value={form.bmName}
                    onChange={handleChange}
                    placeholder="Ví dụ: InnoLabs Agency BM 1"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>

                {/* BM ID */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="bmId"
                    className="block text-sm font-medium text-slate-600"
                  >
                    Business Manager ID (Meta ID){" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="bmId"
                    name="bmId"
                    type="text"
                    required
                    value={form.bmId}
                    onChange={handleChange}
                    placeholder="Nhập dãy số ID từ Meta"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>

                {/* PLATFORM */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="platform"
                    className="block text-sm font-medium text-slate-600"
                  >
                    Nền tảng (Platform){" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="platform"
                    name="platform"
                    required
                    value={form.platform}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
                  >
                    <option value="" disabled>
                      Chọn nền tảng
                    </option>

                    <option value="facebook">Facebook</option>

                    <option value="tiktok">TikTok</option>

                    <option value="google">Google Ads</option>
                  </select>
                </div>

                 <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="accessToken"
                      className="block text-sm font-medium text-slate-600"
                    >
                      System User Access Token <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Token được mã hóa AES-256 an toàn trong database
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="accessToken"
                      name="accessToken"
                      type="password"
                      required
                      value={form.accessToken}
                      onChange={handleChange}
                      placeholder="EAAG... (Dán Meta System User Token vào đây)"
                      className="w-full flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs text-slate-800 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
                    />
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={isVerifying || !form.bmId || !form.accessToken}
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

                  {errorMsg && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> {errorMsg}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* STATUS */}
            <section>
              <h2 className="mb-4 border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">
                Trạng thái
              </h2>

              <div className="w-full space-y-1.5 md:w-1/2">
                <label
                  htmlFor="isActive"
                  className="block text-sm font-medium text-slate-600"
                >
                  Trạng thái hệ thống
                </label>

                <select
                  id="isActive"
                  name="isActive"
                  value={String(form.isActive)}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
                >
                  <option value="true">Hoạt động (Active)</option>
                  <option value="false">Tạm ngưng (Inactive)</option>
                </select>
              </div>
            </section>

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCreating}
                className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={isCreating || isVerifying}
                className="flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    <span>Lưu & Mã hóa Token</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}