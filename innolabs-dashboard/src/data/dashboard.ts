import type { AccountSummary, BrandSpend, DashboardMetric, SpendPoint } from '../types/dashboard'

export const dashboardMetrics: DashboardMetric[] = [
  { label: 'Tổng chi tiêu', value: '428.650.000 ₫', change: 12.5, helper: 'So với kỳ trước' },
  { label: 'Ngân sách đã nạp', value: '520.000.000 ₫', change: 8.2, helper: 'Trong kỳ đang chọn' },
  { label: 'Số dư ước tính', value: '91.350.000 ₫', change: -4.1, helper: 'Còn lại trên hệ thống' },
  { label: 'Ad Account hoạt động', value: '24/27', change: 3.0, helper: '3 tài khoản cần kiểm tra' },
]

export const spendPoints: SpendPoint[] = [
  { date: '01/08', value: 42 }, { date: '04/08', value: 55 }, { date: '07/08', value: 48 },
  { date: '10/08', value: 71 }, { date: '13/08', value: 63 }, { date: '16/08', value: 86 },
  { date: '18/08', value: 78 },
]

export const brandSpend: BrandSpend[] = [
  { name: 'PMP English', value: 126_800_000, percent: 30, color: '#006d32' },
  { name: 'HSA VNES', value: 102_500_000, percent: 24, color: '#0059bb' },
  { name: 'Đăng Hậu Store', value: 81_400_000, percent: 19, color: '#7c3aed' },
  { name: 'Hoàn Mỹ Đà Lạt', value: 67_300_000, percent: 16, color: '#e59a00' },
  { name: 'Brand khác', value: 50_650_000, percent: 11, color: '#94a3b8' },
]

export const accountSummaries: AccountSummary[] = [
  { id: 'act_784512963', name: 'PMP - Conversion', brand: 'PMP English', spent: '68.450.000 ₫', balance: '15.550.000 ₫', status: 'active' },
  { id: 'act_741852963', name: 'HSA - Lead Form', brand: 'HSA VNES', spent: '52.800.000 ₫', balance: '8.200.000 ₫', status: 'warning' },
  { id: 'act_963852741', name: 'Đăng Hậu - Sales', brand: 'Đăng Hậu Store', spent: '46.120.000 ₫', balance: '21.880.000 ₫', status: 'active' },
  { id: 'act_159357486', name: 'Hoàn Mỹ - Reach', brand: 'Hoàn Mỹ Đà Lạt', spent: '37.900.000 ₫', balance: '12.100.000 ₫', status: 'paused' },
]
