import { History } from 'lucide-react'
import { Link } from 'react-router-dom'
import { syncLogs } from '../../data/config'
import { SectionCard } from '../ui/SectionCard'

export function SyncHistoryCard() {
  return (
    <SectionCard title="Lịch sử đồng bộ" icon={History} action={<Link to="/system-logs" className="rounded-full bg-white px-4 py-2 text-xs font-semibold hover:bg-background">Xem toàn bộ</Link>}>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[560px] text-left text-sm"><tbody className="divide-y divide-outline">
          {syncLogs.map((log) => (
            <tr key={log.id} className="hover:bg-background">
              <td className="table-cell w-36 whitespace-nowrap text-xs text-muted">{log.time}</td>
              <td className="table-cell"><span className={`mr-2 inline-block rounded px-2 py-1 text-xs font-semibold ${log.status === 'success' ? 'bg-primary-soft text-primary' : 'bg-danger-soft text-danger'}`}>{log.status === 'success' ? 'Thành công' : 'Lỗi'}</span>{log.message}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </SectionCard>
  )
}
