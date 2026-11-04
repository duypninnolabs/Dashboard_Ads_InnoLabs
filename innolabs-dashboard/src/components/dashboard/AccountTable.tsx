import { ExternalLink, WalletCards } from 'lucide-react'
import { accountSummaries } from '../../data/dashboard'
import { SectionCard } from '../ui/SectionCard'

const statusMap = {
  active: { label: 'Đang hoạt động', className: 'bg-primary-soft text-primary' },
  warning: { label: 'Số dư thấp', className: 'bg-amber-100 text-amber-700' },
  paused: { label: 'Tạm dừng', className: 'bg-slate-100 text-slate-600' },
}

export function AccountTable() {
  return (
    <SectionCard title="Tài khoản quảng cáo" icon={WalletCards} className="bg-white shadow-sm" action={<button className="flex items-center gap-1 text-sm font-semibold text-primary">Xem tất cả <ExternalLink size={15} /></button>}>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface-soft text-xs uppercase tracking-wide text-muted"><tr><th className="table-cell font-medium">Tài khoản</th><th className="table-cell font-medium">Brand</th><th className="table-cell font-medium">Chi tiêu</th><th className="table-cell font-medium">Số dư</th><th className="table-cell font-medium">Trạng thái</th></tr></thead>
          <tbody className="divide-y divide-outline">{accountSummaries.map((account) => { const status = statusMap[account.status]; return (
            <tr key={account.id} className="hover:bg-background"><td className="table-cell"><p className="font-semibold">{account.name}</p><p className="mt-1 font-mono text-xs text-muted">{account.id}</p></td><td className="table-cell">{account.brand}</td><td className="table-cell font-semibold">{account.spent}</td><td className="table-cell">{account.balance}</td><td className="table-cell"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span></td></tr>
          )})}</tbody>
        </table>
      </div>
    </SectionCard>
  )
}
