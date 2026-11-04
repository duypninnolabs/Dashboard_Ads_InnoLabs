/**
 * Formatting utilities for Meta Ads Spend Dashboard
 * Timezone: Asia/Ho_Chi_Minh (GMT+7)
 * Currency: VND
 */

export function formatVND(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '0 ₫'
  const rounded = Math.round(amount)
  return new Intl.NumberFormat('vi-VN').format(rounded) + ' ₫'
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '0'
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function formatPercent(percent: number | null | undefined, decimals = 1): string {
  if (percent == null || isNaN(percent)) return '0.0%'
  return percent.toFixed(decimals) + '%'
}

/**
 * Format YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateVN(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateStr
  }
}

/**
 * Format DateTime to DD/MM/YYYY HH:mm (GMT+7)
 */
export function formatDateTimeVN(dateTimeStr: string | null | undefined): string {
  if (!dateTimeStr) return 'Chưa đồng bộ'
  try {
    const d = new Date(dateTimeStr)
    if (isNaN(d.getTime())) return dateTimeStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return dateTimeStr
  }
}

export const formatCurrencyVND = formatVND

