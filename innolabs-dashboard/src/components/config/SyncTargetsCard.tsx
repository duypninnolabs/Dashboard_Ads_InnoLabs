import { Building2, Megaphone, Plus, Workflow } from 'lucide-react'
import { useState } from 'react'
import { initialSyncTargets } from '../../data/config'
import { SectionCard } from '../ui/SectionCard'
import { Toggle } from '../ui/Toggle'

export function SyncTargetsCard() {
  const [targets, setTargets] = useState(initialSyncTargets)

  const updateTarget = (id: string, enabled: boolean) => setTargets((current) => current.map((target) => target.id === id ? { ...target, enabled } : target))

  return (
    <SectionCard title="Quản lý đối tượng đồng bộ" icon={Workflow} action={<button className="flex items-center gap-1 text-sm font-semibold text-primary"><Plus size={16} /> Thêm mới</button>}>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-surface-soft text-xs uppercase tracking-wide text-muted"><tr><th className="table-cell font-medium">Business Portfolio / Account</th><th className="table-cell font-medium">ID</th><th className="table-cell text-right font-medium">Đồng bộ</th></tr></thead>
          <tbody className="divide-y divide-outline">
            {targets.map((target) => {
              const Icon = target.kind === 'business' ? Building2 : Megaphone
              return (
                <tr key={target.id} className="transition hover:bg-background">
                  <td className={`table-cell ${target.kind === 'account' ? 'pl-10' : ''}`}><span className="flex items-center gap-2"><Icon size={17} className="text-muted" /><span className={target.kind === 'business' ? 'font-semibold' : ''}>{target.name}</span></span></td>
                  <td className="table-cell font-mono text-xs text-muted">{target.id}</td>
                  <td className="table-cell text-right"><Toggle label={`Đồng bộ ${target.name}`} checked={target.enabled} onChange={(checked) => updateTarget(target.id, checked)} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
