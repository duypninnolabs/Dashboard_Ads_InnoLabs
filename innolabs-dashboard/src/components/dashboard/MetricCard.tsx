import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { DashboardMetric } from '../../types/dashboard'

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const positive = metric.change >= 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <article className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-muted">{metric.label}</p>
      <p className="mt-3 font-headline text-2xl font-bold tracking-tight">{metric.value}</p>
      <div className="mt-3 flex items-center gap-2 text-xs"><span className={`flex items-center gap-1 font-semibold ${positive ? 'text-primary' : 'text-danger'}`}><Icon size={14} /> {Math.abs(metric.change)}%</span><span className="text-muted">{metric.helper}</span></div>
    </article>
  )
}
