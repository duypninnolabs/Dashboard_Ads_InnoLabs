import { Braces, CheckCircle2 } from 'lucide-react'
import { SectionCard } from '../ui/SectionCard'

export function ApiConnectionCard() {
  return (
    <SectionCard title="Kết nối Meta API" icon={Braces} action={<span className="size-3 animate-pulse rounded-full bg-primary" />}>
      <div className="space-y-3">
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="text-muted">System User Access Token</span>
            <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-1 text-xs font-semibold text-primary"><CheckCircle2 size={13} /> Hợp lệ</span>
          </div>
          <p className="truncate font-mono text-xs text-muted">EAAIxxxxxxx...xxxxx</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Chu kỳ tự động đồng bộ</span>
            <strong className="text-emerald-700 font-semibold">Mỗi 4 giờ (Lấy ngày còn thiếu)</strong>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-soft">
            <div className="h-full w-[100%] rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
