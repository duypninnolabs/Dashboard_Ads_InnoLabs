import { CloudCog } from 'lucide-react'
import { ApiConnectionCard } from '../components/config/ApiConnectionCard'
import { FinancialRatesCard } from '../components/config/FinancialRatesCard'
import { SyncHistoryCard } from '../components/config/SyncHistoryCard'
import { SyncTargetsCard } from '../components/config/SyncTargetsCard'

export function ConfigPage() {
  return (
    <>
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 className="font-headline text-3xl font-bold tracking-tight">Cấu hình hệ thống</h1><p className="mt-1 text-muted">Quản lý VAT, FTF, trạng thái API và đối tượng đồng bộ.</p></div>
        <div className="flex flex-wrap items-center gap-3"><span className="flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-primary"><CloudCog size={18} /> Hệ thống ổn định</span>
<button 
  type="submit"
  form="financial-form"
  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-button transition hover:bg-green-800"
>
  Lưu thay đổi
</button>        </div>
      </header>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6"><FinancialRatesCard /><ApiConnectionCard /></div>
        <div className="space-y-6 lg:col-span-2"><SyncTargetsCard /><SyncHistoryCard /></div>
      </div>
    </>
  )
}
