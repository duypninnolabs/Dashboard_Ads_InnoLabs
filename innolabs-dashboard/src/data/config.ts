import type { SyncLog, SyncTarget } from '../types/config'

export const initialSyncTargets: SyncTarget[] = [
  { id: '123456789012345', name: 'InnoLabs Main BM', kind: 'business', enabled: true },
  { id: '987654321098765', name: 'Account Alpha', kind: 'account', enabled: true },
  { id: '555666777888999', name: 'Account Beta', kind: 'account', enabled: false },
  { id: '112233445566778', name: 'Partner BM', kind: 'business', enabled: true },
]

export const syncLogs: SyncLog[] = [
  { id: '1', time: '10:00, hôm nay', status: 'success', message: 'Đồng bộ hoàn tất. Đã cập nhật 240 bản ghi.' },
  { id: '2', time: '06:00, hôm nay', status: 'success', message: 'Đồng bộ hoàn tất. Đã cập nhật 15 bản ghi.' },
  { id: '3', time: '02:00, hôm nay', status: 'error', message: 'Account Beta vượt giới hạn API. Hệ thống đang thử lại.' },
  { id: '4', time: '22:00, hôm qua', status: 'success', message: 'Admin đã kích hoạt đồng bộ thủ công.' },
]
