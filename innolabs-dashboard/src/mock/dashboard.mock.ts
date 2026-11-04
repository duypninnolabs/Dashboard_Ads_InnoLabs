import type { SpendItem, FilterOption } from '../types/dashboard'
import { computeSpend } from '../utils/calculations'

export const MOCK_BMS: FilterOption[] = [
  { value: '963054885398621', label: 'InnoLabs Portfolio Primary', metaId: '963054885398621' },
  { value: '1356063385547293', label: 'InnoLabs Media Portfolio', metaId: '1356063385547293' },
  { value: '661167323390286', label: 'InnoLabs Agency Hub', metaId: '661167323390286' },
  { value: '1099157790932650', label: 'InnoLabs Global Portfolio', metaId: '1099157790932650' },
]

export const MOCK_ACCOUNTS: FilterOption[] = [
  { value: 'act_784512963', label: 'PMP - Conversion Main', metaId: 'act_784512963', category: '963054885398621' },
  { value: 'act_784512964', label: 'PMP - Brand Awareness', metaId: 'act_784512964', category: '963054885398621' },
  { value: 'act_741852963', label: 'HSA - Lead Form North', metaId: 'act_741852963', category: '1356063385547293' },
  { value: 'act_741852964', label: 'HSA - VNES Enrollment', metaId: 'act_741852964', category: '1356063385547293' },
  { value: 'act_963852741', label: 'Đăng Hậu - Retail Sales', metaId: 'act_963852741', category: '661167323390286' },
  { value: 'act_963852742', label: 'Đăng Hậu - VIP Club', metaId: 'act_963852742', category: '661167323390286' },
  { value: 'act_159357486', label: 'Hoàn Mỹ - Clinic Reach', metaId: 'act_159357486', category: '1099157790932650' },
  { value: 'act_159357487', label: 'Hoàn Mỹ - Specialist Care', metaId: 'act_159357487', category: '1099157790932650' },
]

export const MOCK_BRANDS: FilterOption[] = [
  { value: 'PMP English', label: 'PMP English' },
  { value: 'HSA VNES', label: 'HSA VNES' },
  { value: 'Đăng Hậu Store', label: 'Đăng Hậu Store' },
  { value: 'Hoàn Mỹ Đà Lạt', label: 'Hoàn Mỹ Đà Lạt' },
  { value: 'InnoEdu', label: 'InnoEdu' },
  { value: 'InnoTech', label: 'InnoTech' },
]

// Generate realistic daily items for the current month and last month
export function generateMockSpendItems(): SpendItem[] {
  const items: SpendItem[] = []
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const campaignConfigs = [
    {
      bmId: '963054885398621',
      bmName: 'InnoLabs Portfolio Primary',
      accountId: 'act_784512963',
      accountName: 'PMP - Conversion Main',
      campaignId: 'cmp_10101',
      campaignName: 'PMP_IELTS_Master_Q4_LeadGen',
      brand: 'PMP English',
      baseDaily: 4500000,
      volatility: 0.25,
    },
    {
      bmId: '963054885398621',
      bmName: 'InnoLabs Portfolio Primary',
      accountId: 'act_784512964',
      accountName: 'PMP - Brand Awareness',
      campaignId: 'cmp_10102',
      campaignName: 'PMP_Brand_Video_TikTok_Retarget',
      brand: 'PMP English',
      baseDaily: 2800000,
      volatility: 0.15,
    },
    {
      bmId: '1356063385547293',
      bmName: 'InnoLabs Media Portfolio',
      accountId: 'act_741852963',
      accountName: 'HSA - Lead Form North',
      campaignId: 'cmp_20201',
      campaignName: 'HSA_Exam_Prep_2026_North',
      brand: 'HSA VNES',
      baseDaily: 3800000,
      volatility: 0.2,
    },
    {
      bmId: '1356063385547293',
      bmName: 'InnoLabs Media Portfolio',
      accountId: 'act_741852964',
      accountName: 'HSA - VNES Enrollment',
      campaignId: 'cmp_20202',
      campaignName: 'HSA_Scholarship_Webinar_Promo',
      brand: 'HSA VNES',
      baseDaily: 2400000,
      volatility: 0.3,
    },
    {
      bmId: '661167323390286',
      bmName: 'InnoLabs Agency Hub',
      accountId: 'act_963852741',
      accountName: 'Đăng Hậu - Retail Sales',
      campaignId: 'cmp_30301',
      campaignName: 'DangHau_MensFashion_Autumn_Sale',
      brand: 'Đăng Hậu Store',
      baseDaily: 3200000,
      volatility: 0.35,
    },
    {
      bmId: '661167323390286',
      bmName: 'InnoLabs Agency Hub',
      accountId: 'act_963852742',
      accountName: 'Đăng Hậu - VIP Club',
      campaignId: 'cmp_30302',
      campaignName: 'DangHau_Messenger_VIP_Exclusive',
      brand: 'Đăng Hậu Store',
      baseDaily: 1900000,
      volatility: 0.2,
    },
    {
      bmId: '1099157790932650',
      bmName: 'InnoLabs Global Portfolio',
      accountId: 'act_159357486',
      accountName: 'Hoàn Mỹ - Clinic Reach',
      campaignId: 'cmp_40401',
      campaignName: 'HoanMy_General_Checkup_Dalat',
      brand: 'Hoàn Mỹ Đà Lạt',
      baseDaily: 2600000,
      volatility: 0.2,
    },
    {
      bmId: '1099157790932650',
      bmName: 'InnoLabs Global Portfolio',
      accountId: 'act_159357487',
      accountName: 'Hoàn Mỹ - Specialist Care',
      campaignId: 'cmp_40402',
      campaignName: 'HoanMy_Dental_Cardiology_Promo',
      brand: 'Hoàn Mỹ Đà Lạt',
      baseDaily: 1800000,
      volatility: 0.25,
    },
  ]

  // Loop back for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(year, month, now.getDate() - i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    campaignConfigs.forEach((cfg, idx) => {
      // Deterministic variation using sin to make it look realistic and consistent across re-renders
      const dayFactor = 1 + Math.sin((d.getDate() + idx * 7) * 0.45) * cfg.volatility
      const rawSpend = Math.round(cfg.baseDaily * dayFactor)
      const computed = computeSpend(rawSpend, 0.10, 0.011)

      items.push({
        id: `${dateStr}_${cfg.bmId}_${cfg.accountId}_${cfg.campaignId}`,
        date: dateStr,
        bmId: cfg.bmId,
        bmName: cfg.bmName,
        accountId: cfg.accountId,
        accountName: cfg.accountName,
        campaignId: cfg.campaignId,
        campaignName: cfg.campaignName,
        brand: cfg.brand,
        currency: 'VND',
        spendMeta: computed.spendMeta,
        vatRate: 0.10,
        spendVat: computed.spendVat,
        ftfRate: 0.011,
        ftfAmount: computed.ftfAmount,
        totalSpend: computed.totalSpend,
        lastSyncedAt: '2026-10-21T08:00:00+07:00',
      })
    })
  }

  return items
}

export const MOCK_SPEND_ITEMS = generateMockSpendItems()
