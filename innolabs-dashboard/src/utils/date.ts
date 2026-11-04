import { formatDateVN } from './formatters'
import type { FilterPreset } from '../types/dashboard'

export function toYYYYMMDD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns [startDate, endDate] in YYYY-MM-DD
 * GMT+7 Asia/Ho_Chi_Minh timezone
 * Week starts on Monday (Thứ Hai đến Chủ Nhật)
 */
export function getPresetDateRange(preset: FilterPreset): { startDate: string; endDate: string; label: string } {
  const now = new Date()

  if (preset === 'all') {
    return {
      startDate: '',
      endDate: '',
      label: 'Toàn bộ thời gian (Tất cả dữ liệu)',
    }
  }

  if (preset === 'today') {
    const todayStr = toYYYYMMDD(now)
    return {
      startDate: todayStr,
      endDate: todayStr,
      label: `Hôm nay (${formatDateVN(todayStr)})`,
    }
  }

  if (preset === 'this_week') {
    // Week is Monday to Sunday
    const day = now.getDay() // 0 is Sunday, 1 is Monday ...
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(now)
    monday.setDate(now.getDate() + diffToMonday)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const start = toYYYYMMDD(monday)
    const end = toYYYYMMDD(sunday)
    return {
      startDate: start,
      endDate: end,
      label: `Tuần này (${formatDateVN(start)} - ${formatDateVN(end)})`,
    }
  }

  if (preset === 'this_month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const start = toYYYYMMDD(startOfMonth)
    const end = toYYYYMMDD(endOfMonth)
    return {
      startDate: start,
      endDate: end,
      label: `Tháng này (${formatDateVN(start)} - ${formatDateVN(end)})`,
    }
  }

  // default / custom
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const defaultEnd = now
  const start = toYYYYMMDD(defaultStart)
  const end = toYYYYMMDD(defaultEnd)
  return {
    startDate: start,
    endDate: end,
    label: `Tùy chọn (${formatDateVN(start)} - ${formatDateVN(end)})`,
  }
}
