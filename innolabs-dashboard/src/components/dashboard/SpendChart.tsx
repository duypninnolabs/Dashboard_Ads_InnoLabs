import { TrendingUp } from 'lucide-react'
import { spendPoints } from '../../data/dashboard'
import { SectionCard } from '../ui/SectionCard'

export function SpendChart() {
  const width = 700
  const height = 230
  const max = 100
  const points = spendPoints.map((point, index) => `${(index / (spendPoints.length - 1)) * width},${height - (point.value / max) * height}`).join(' ')
  const area = `0,${height} ${points} ${width},${height}`

  return (
    <SectionCard title="Xu hướng chi tiêu" icon={TrendingUp} className="bg-white shadow-sm">
      <div className="mb-5 flex items-end justify-between"><div><p className="font-headline text-2xl font-bold">428,65 triệu</p><p className="text-xs text-muted">Chi tiêu từ 01/08 đến 18/08</p></div><select className="field"><option>Theo ngày</option><option>Theo tuần</option></select></div>
      <div className="relative h-64 w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-1">{[100, 75, 50, 25, 0].map((value) => <div key={value} className="flex items-center gap-2"><span className="w-7 text-[10px] text-muted">{value}tr</span><span className="h-px flex-1 bg-outline/70" /></div>)}</div>
        <svg className="absolute bottom-5 left-9 right-0 h-[210px] w-[calc(100%_-_2.25rem)] overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Biểu đồ chi tiêu">
          <defs><linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#006d32" stopOpacity="0.24" /><stop offset="1" stopColor="#006d32" stopOpacity="0" /></linearGradient></defs>
          <polygon points={area} fill="url(#spendGradient)" />
          <polyline points={points} fill="none" stroke="#006d32" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute inset-x-9 bottom-0 flex justify-between text-[10px] text-muted">{spendPoints.map((point) => <span key={point.date}>{point.date}</span>)}</div>
      </div>
    </SectionCard>
  )
}
