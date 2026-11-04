import { Tags } from 'lucide-react'
import { brandSpend } from '../../data/dashboard'
import { SectionCard } from '../ui/SectionCard'

const formatCurrency = (value: number) => `${(value / 1_000_000).toLocaleString('vi-VN')} triệu`

export function BrandBreakdown() {
  return (
    <SectionCard title="Chi tiêu theo Brand" icon={Tags} className="bg-white shadow-sm">
      <div className="mb-6 flex h-3 overflow-hidden rounded-full">{brandSpend.map((brand) => <span key={brand.name} style={{ width: `${brand.percent}%`, backgroundColor: brand.color }} />)}</div>
      <div className="space-y-4">{brandSpend.map((brand) => (
        <div key={brand.name} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
          <div className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: brand.color }} /><span className="truncate font-medium">{brand.name}</span></div>
          <div className="text-right"><strong>{formatCurrency(brand.value)}</strong><span className="ml-2 inline-block w-8 text-xs text-muted">{brand.percent}%</span></div>
        </div>
      ))}</div>
      <button className="mt-6 w-full rounded-lg border py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-soft">Xem tất cả Brand</button>
    </SectionCard>
  )
}
