import { SlidersHorizontal } from 'lucide-react'
import { SectionCard } from '../ui/SectionCard'
import { useGetSettings, useUpdateSettingByKey } from '../../hooks/setting.hook'

export function FinancialRatesCard() {
  const [vatQuery, ftfQuery] = useGetSettings(['vat_rate', 'ftf_rate'])
  const updateSettings = useUpdateSettingByKey()

  if (vatQuery.isLoading || ftfQuery.isLoading) {
    return (
      <SectionCard title="Thông số tài chính" icon={SlidersHorizontal}>
        <div className="text-sm text-muted">Đang tải...</div>
      </SectionCard>
    )
  }

  const vatValue = vatQuery.data?.data?.value ?? vatQuery.data?.value ?? '0'
  const ftfValue = ftfQuery.data?.data?.value ?? ftfQuery.data?.value ?? '0'
  const vatDate = vatQuery.data?.data?.effective_date ?? vatQuery.data?.effective_date ?? '2026-01-01'
  const ftfDate = ftfQuery.data?.data?.effective_date ?? ftfQuery.data?.effective_date ?? '2026-01-01'

  const vatPercent = (Math.round(Number(vatValue) * 10000) / 100).toString()
  const ftfPercent = (Math.round(Number(ftfValue) * 10000) / 100).toString()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    const vatRate = Number(formData.get("vat_rate")) / 100
    const ftfRate = Number(formData.get("ftf_rate")) / 100

    const payload = [
      {
        key: "vat_rate",
        value: vatRate,
        dataType: "number",
        effective_date: formData.get("vat_date"),
      },
      {
        key: "ftf_rate",
        value: ftfRate,
        dataType: "number",
        effective_date: formData.get("ftf_date"),
      },
    ]

    console.log("Dữ liệu gửi đi:", payload)

    payload.forEach((item) => {
      updateSettings.mutate(
        {
          key: item.key,
          data: {
            value: item.value,
            data_type: "number",
            effective_date: item.effective_date,
          },
        },
        {
          onSuccess: () => {
            alert("Lưu thông số cấu hình thành công!")
          },
        }
      )
    })
  }

  return (
    <SectionCard title="Thông số tài chính" icon={SlidersHorizontal}>
      <form id="financial-form" onSubmit={handleSubmit} className="space-y-5">
        <RateField 
          label="VAT (%)" 
          rateName="vat_rate" 
          dateName="vat_date" 
          defaultRate={vatPercent} 
          defaultDate={vatDate} 
        />
        <RateField 
          label="FTF (%)" 
          rateName="ftf_rate" 
          dateName="ftf_date" 
          defaultRate={ftfPercent} 
          defaultDate={ftfDate} 
          step="0.01" 
        />
      </form>
    </SectionCard>
  )
}

function RateField({
  label,
  rateName,
  dateName,
  defaultRate,
  defaultDate,
  step,
}: {
  label: string
  rateName: string
  dateName: string
  defaultRate: string
  defaultDate: string
  step?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-muted">{label}</span>
      <span className="grid grid-cols-[96px_1fr] gap-3">
        <input 
          name={rateName} 
          className="field w-full" 
          type="number" 
          defaultValue={defaultRate} 
          step={step} 
        />
        <input 
          name={dateName} 
          className="field w-full" 
          type="date" 
          defaultValue={defaultDate} 
        />
      </span>
    </label>
  )
}