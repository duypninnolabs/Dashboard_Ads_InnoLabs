import { Building2, Gauge, Layers, ScrollText, Settings2, Tags, ShieldAlert, Megaphone, CircleHelp, LogOut } from 'lucide-react'
import type { NavigationItem } from '../types/navigation'

export const mainNavigation: NavigationItem[] = [
  { label: 'Meta Ads Spend', href: '/', icon: Gauge, active: true },
  { label: 'Business Portfolio', href: '/business-managers', icon: Building2 },
  { label: 'Hạn mức & Cảnh báo', href: '/budgets-alerts', icon: ShieldAlert },
  { label: 'Nhóm quảng cáo (Ad Sets)', href: '/adsets', icon: Layers },
  { label: 'Quảng cáo chi tiết (Ads)', href: '/ads-detail', icon: Megaphone },
  { label: 'Brands', href: '/brands', icon: Tags },
  { label: 'Cấu hình hệ thống', href: '/config', icon: Settings2 },
  { label: 'Nhật ký hệ thống', href: '/system-logs', icon: ScrollText },
]

export const utilityNavigation: NavigationItem[] = [
  { label: 'Help Center', href: '/help', icon: CircleHelp },
  { label: 'Đăng xuất', href: '/login', icon: LogOut },
]
