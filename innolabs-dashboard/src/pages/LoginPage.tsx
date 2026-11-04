import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, AlertCircle, Shield } from "lucide-react";
import { useLogin } from "../hooks/auth.hook";
import { useNavigate } from "react-router";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [customUsername, setCustomUsername] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useLogin();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const targetUsername = customUsername.trim() || "admin";
    const targetPassword = password.trim();

    loginMutation.mutate(
      {
        username: targetUsername,
        password: targetPassword,
      },
      {
        onSuccess: (response: any) => {
          // Check if success (response.success or response.code === 200 or response.status === 200)
          if (response?.success === true || response?.code === 200 || response?.status === 200) {
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("storefront_password", targetPassword);
            localStorage.setItem("user", JSON.stringify(response.data || { username: targetUsername }));
            navigate("/");
          } else {
            setErrorMessage(response?.message || "Mật khẩu xác thực không chính xác");
          }
        },
        onError: (error: any) => {
          const msg =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Mật khẩu Storefront không chính xác, vui lòng thử lại.";
          setErrorMessage(msg);
        },
      }
    );
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f0f3ff] px-6 font-sans text-[#111c2d]">
      {/* Background Decor */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[800px] w-[800px] rounded-full bg-[#006d32]/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-[600px] w-[600px] rounded-full bg-[#d8e3fb]/20 blur-2xl" />
      </div>

      {/* Login Card */}
      <section className="relative z-10 w-full max-w-md rounded-2xl border border-[#d8e3fb] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary shadow-sm">
            <Shield size={26} />
          </div>

          <div className="text-2xl font-bold tracking-tight text-ink">
            InnoLabs Meta Ads
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Hệ thống quản trị và kiểm soát chi phí quảng cáo nội bộ
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Advanced username input (collapsible) */}
          {showAdvanced && (
            <div className="flex flex-col gap-1.5 animate-fadeIn">
              <label
                htmlFor="customUsername"
                className="text-xs font-semibold text-slate-700"
              >
                Tài khoản quản trị
              </label>
              <input
                id="customUsername"
                type="text"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl border border-outline bg-slate-50 py-2.5 px-3.5 text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
              />
            </div>
          )}

          {/* Storefront Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-slate-700"
              >
                Mật khẩu Storefront
              </label>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] text-muted hover:text-primary transition"
              >
                {showAdvanced ? "Ẩn tài khoản" : "Tùy chọn nâng cao"}
              </button>
            </div>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu truy cập..."
                className="w-full rounded-xl border border-outline bg-slate-50 py-3 pl-11 pr-11 text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loginMutation.isPending || !password}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-button transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {loginMutation.isPending ? "Đang mở khóa..." : "Mở khóa Dashboard"}
          </button>
        </form>

        {/* Footer note */}
        <p className="mt-6 text-center text-[11px] text-muted">
          ads.innolabs.vn • Bảo mật kết nối HTTPS & Storefront Token
        </p>
      </section>
    </main>
  );
};

export default LoginPage;