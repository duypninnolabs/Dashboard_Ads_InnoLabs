import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  X,
  Sparkles,
  Copy,
  Check,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'
import { CampaignItem } from '../../api/campaign.api'
import { formatCurrencyVND, formatNumber, formatDateVN } from '../../utils/formatters'

export interface ExportItem {
  id: number | string
  name: string
  spend_meta?: number
  total_spend?: number
  impressions: number
  reach?: number
  clicks: number
  messages?: number
  results?: number
}

interface ExportGoogleSheetModalProps {
  isOpen: boolean
  onClose: () => void
  campaigns?: CampaignItem[]
  items?: ExportItem[]
  brandName?: string
  startDate?: string
  endDate?: string
  reportType?: 'campaign' | 'adset'
}

export function ExportGoogleSheetModal({
  isOpen,
  onClose,
  campaigns = [],
  items,
  brandName = 'Tất cả thương hiệu',
  startDate,
  endDate,
  reportType = 'campaign',
}: ExportGoogleSheetModalProps) {
  const [copied, setCopied] = useState(false)
  const defaultReportTitle = reportType === 'adset' 
    ? 'BÁO CÁO HIỆU QUẢ NHÓM QUẢNG CÁO META (AD SETS)' 
    : 'BÁO CÁO HIỆU QUẢ QUẢNG CÁO META'
  const [reportTitle, setReportTitle] = useState(defaultReportTitle)
  
  // Format dải ngày mặc định
  const dateRangeText = useMemo(() => {
    if (startDate && endDate) {
      return `${formatDateVN(startDate)} - ${formatDateVN(endDate)}`
    }
    if (startDate) return `Từ ngày ${formatDateVN(startDate)}`
    if (endDate) return `Đến ngày ${formatDateVN(endDate)}`
    const today = new Date()
    const last7Days = new Date()
    last7Days.setDate(today.getDate() - 7)
    return `${formatDateVN(last7Days.toISOString().split('T')[0])} - ${formatDateVN(today.toISOString().split('T')[0])}`
  }, [startDate, endDate])

  // Chuẩn hoá danh sách items (chỉ lấy chi tiêu gốc Meta spend_meta)
  const normalizedItems = useMemo(() => {
    if (items && items.length > 0) {
      return items.map((i) => ({
        ...i,
        spend_meta: i.spend_meta ?? i.total_spend ?? 0,
      }))
    }
    return campaigns.map((c) => ({
      id: c.id,
      name: c.campaign_name,
      spend_meta: c.spend_meta || 0,
      impressions: c.impressions || 0,
      reach: c.reach || 0,
      clicks: c.clicks || 0,
      messages: c.messages || c.results || 0,
    }))
  }, [items, campaigns])

  // Lọc các chiến dịch/adsets có chi tiêu Meta > 0
  const validCampaigns = useMemo(() => {
    return normalizedItems.filter((c) => (c.spend_meta || 0) > 0)
  }, [normalizedItems])

  // Tính tổng hàng TỔNG (toàn bộ theo chi tiêu Meta gốc)
  const summaryRow = useMemo(() => {
    const totalImpressions = validCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0)
    const totalReach = validCampaigns.reduce((sum, c) => sum + (c.reach || 0), 0)
    const totalSpend = validCampaigns.reduce((sum, c) => sum + (c.spend_meta || 0), 0)
    const totalClicks = validCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0)
    const totalMessages = validCampaigns.reduce((sum, c) => sum + (c.messages || 0), 0)

    const frequency = totalReach > 0 ? (totalImpressions / totalReach).toFixed(2) : '1.00'
    const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0.00%'
    const costPerMessage = totalMessages > 0 ? totalSpend / totalMessages : 0

    return {
      impressions: totalImpressions,
      reach: totalReach,
      frequency,
      cpm,
      cpc,
      ctr,
      clicks: totalClicks,
      messages: totalMessages,
      costPerMessage,
      spend: totalSpend,
    }
  }, [validCampaigns])

  // Chiến dịch nổi bật nhất (Chi phí tin nhắn rẻ nhất & có > 0 mess theo chi tiêu Meta)
  const bestPerformer = useMemo(() => {
    const withMessages = validCampaigns.filter((c) => (c.messages || 0) > 0)
    if (withMessages.length === 0) return null
    return [...withMessages].sort(
      (a, b) => a.spend_meta / (a.messages || 1) - b.spend_meta / (b.messages || 1)
    )[0]
  }, [validCampaigns])

  // Chiến dịch đóng góp nhiều kết quả nhất
  const topResultCamp = useMemo(() => {
    if (validCampaigns.length === 0) return null
    return [...validCampaigns].sort((a, b) => (b.messages || 0) - (a.messages || 0))[0]
  }, [validCampaigns])

  // State cho Nhận xét và Đề xuất (Cho phép chỉnh sửa trước khi xuất)
  const [reviews, setReviews] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Tự động sinh Nhận xét & Đề xuất theo đúng văn phong agency của template
  const handleGenerateAIReview = React.useCallback(() => {
    if (validCampaigns.length === 0) {
      setReviews([
        `Giai đoạn ${dateRangeText} của ${brandName} chưa ghi nhận chiến dịch nào có chi tiêu phát sinh trên hệ thống Meta Ads.`
      ])
      setSuggestions([
        `Kiểm tra lại ngân sách và trạng thái phê duyệt của các chiến dịch đang chạy trên Meta Trình quản lý quảng cáo.`
      ])
      return
    }

    const revs: string[] = []
    const suggs: string[] = []

    // Nhận xét tổng quan
    revs.push(
      `Giai đoạn ${dateRangeText} ghi nhận ${formatNumber(summaryRow.messages)} cuộc trò chuyện, tổng chi tiêu ${formatCurrencyVND(summaryRow.spend)}, tương ứng chi phí trung bình ${formatCurrencyVND(summaryRow.costPerMessage)}/cuộc trò chuyện. CTR toàn chiến dịch đạt ${summaryRow.ctr}, cho thấy các nội dung đang thu hút người dùng khá tốt.`
    )

    // Nhận xét về chiến dịch rẻ nhất / nổi bật nhất
    if (bestPerformer) {
      const bestCpr = bestPerformer.spend_meta / (bestPerformer.messages || 1)
      revs.push(
        `Nội dung "${bestPerformer.name}" nổi bật nhất về chi phí, mang về ${formatNumber(bestPerformer.messages || 0)} cuộc trò chuyện với mức ${formatCurrencyVND(bestCpr)}/mess, cho thấy khả năng tạo chuyển đổi rất tích cực.`
      )
    }

    // Nhận xét về chiến dịch đóng góp nhiều kết quả nhất
    if (topResultCamp && topResultCamp.id !== bestPerformer?.id && (topResultCamp.messages || 0) > 0) {
      const topCpr = topResultCamp.spend_meta / (topResultCamp.messages || 1)
      revs.push(
        `Nội dung "${topResultCamp.name}" là nội dung đóng góp nhiều kết quả nhất với tổng ${formatNumber(topResultCamp.messages || 0)} cuộc trò chuyện (${formatCurrencyVND(topCpr)}/mess).`
      )
    }

    // Nhận xét tổng kết chung
    revs.push(
      `Nhìn chung, chiến dịch đang duy trì CTR cao, CPC tốt và chi phí tin nhắn ở mức tích cực, giúp chiến dịch có thêm nhiều nguồn tạo tin nhắn để tiếp tục tối ưu hóa doanh số.`
    )

    // Đề xuất phát triển tiếp theo (Next Steps)
    if (bestPerformer) {
      suggs.push(
        `Tăng thêm 20% - 30% ngân sách vào nội dung hiệu quả "${bestPerformer.name}" để tối đa hóa số lượng tin nhắn giá rẻ.`
      )
    }
    suggs.push(
      `Tiếp tục duy trì và nhân bản các mẫu Creative dạng Video ngắn / Reels theo phong cách của nội dung hiệu quả nhất.`
    )
    suggs.push(
      `Theo dõi sát tần suất hiển thị (Frequency) nếu vượt quá 2.5 - 3.0 thì mở rộng thêm tệp đối tượng tương tự (Lookalike) để tránh bão hòa tệp.`
    )

    setReviews(revs)
    setSuggestions(suggs)
  }, [validCampaigns, summaryRow, bestPerformer, topResultCamp, dateRangeText, brandName])

  // Tự động sinh mới nhận xét & đề xuất mỗi khi mở modal hoặc khi dải ngày/thương hiệu/dữ liệu thay đổi
  React.useEffect(() => {
    if (isOpen) {
      handleGenerateAIReview()
    }
  }, [isOpen, dateRangeText, brandName, validCampaigns.length, summaryRow.spend, summaryRow.messages, handleGenerateAIReview])

  if (!isOpen) return null

  // Chuyển toàn bộ dữ liệu thành bảng TSV (Tab Separated Values) để paste thẳng vào Google Sheet chuẩn cột
  const handleCopyForGoogleSheet = () => {
    let tsv = ''
    tsv += `${reportTitle}\n`
    tsv += `Thời gian: ${dateRangeText} | Nguồn: Meta Ads Manager | Thương hiệu: ${brandName}\n\n`
    
    // Header cột
    tsv += `Quảng cáo\tLượt hiển thị\tNgười tiếp cận\tTần suất\tCPM\tCPC (tất cả)\tCTR (tất cả)\tLượt click\tCuộc trò chuyện\tChi phí/cuộc trò chuyện\tChi tiêu\n`

    // Các dòng dữ liệu
    validCampaigns.forEach((c) => {
      const freq = (c.reach || 0) > 0 ? ((c.impressions || 0) / (c.reach || 1)).toFixed(2) : '1.00'
      const cpm = (c.impressions || 0) > 0 ? Math.round(((c.spend_meta || 0) / c.impressions) * 1000) : 0
      const cpc = (c.clicks || 0) > 0 ? Math.round((c.spend_meta || 0) / c.clicks) : 0
      const ctr = (c.impressions || 0) > 0 ? (((c.clicks || 0) / c.impressions) * 100).toFixed(2) + '%' : '0.00%'
      const msgCount = c.messages || 0
      const cpr = msgCount > 0 ? Math.round((c.spend_meta || 0) / msgCount) : 0

      tsv += `${c.name}\t${c.impressions || 0}\t${c.reach || 0}\t${freq}\t${cpm}\t${cpc}\t${ctr}\t${c.clicks || 0}\t${msgCount}\t${cpr > 0 ? cpr : ''}\t${Math.round(c.spend_meta || 0)}\n`
    })

    // Dòng TỔNG
    tsv += `TỔNG\t${summaryRow.impressions}\t${summaryRow.reach}\t${summaryRow.frequency}\t${Math.round(summaryRow.cpm)}\t${Math.round(summaryRow.cpc)}\t${summaryRow.ctr}\t${summaryRow.clicks}\t${summaryRow.messages}\t${Math.round(summaryRow.costPerMessage)}\t${Math.round(summaryRow.spend)}\n\n`

    // Phần Nhận xét
    tsv += `Nhận xét:\n`
    reviews.forEach((r) => {
      tsv += `- ${r}\n\n`
    })

    // Phần Đề xuất
    tsv += `Đề xuất:\n`
    suggestions.forEach((s) => {
      tsv += `+ ${s}\n`
    })

    navigator.clipboard.writeText(tsv)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // Tải file CSV
  const handleDownloadCSV = () => {
    let csv = '\uFEFF' // BOM UTF-8 để mở Excel/Google Sheet không bị lỗi tiếng Việt
    csv += `"${reportTitle}"\n`
    csv += `"Thời gian: ${dateRangeText} | Nguồn: Meta Ads Manager | Thương hiệu: ${brandName}"\n\n`
    csv += `"Quảng cáo","Lượt hiển thị","Người tiếp cận","Tần suất","CPM","CPC (tất cả)","CTR (tất cả)","Lượt click","Cuộc trò chuyện","Chi phí/cuộc trò chuyện","Chi tiêu"\n`

    validCampaigns.forEach((c) => {
      const freq = (c.reach || 0) > 0 ? ((c.impressions || 0) / (c.reach || 1)).toFixed(2) : '1.00'
      const cpm = (c.impressions || 0) > 0 ? Math.round(((c.spend_meta || 0) / c.impressions) * 1000) : 0
      const cpc = (c.clicks || 0) > 0 ? Math.round((c.spend_meta || 0) / c.clicks) : 0
      const ctr = (c.impressions || 0) > 0 ? (((c.clicks || 0) / c.impressions) * 100).toFixed(2) + '%' : '0.00%'
      const msgCount = c.messages || 0
      const cpr = msgCount > 0 ? Math.round((c.spend_meta || 0) / msgCount) : 0

      csv += `"${(c.name || '').replace(/"/g, '""')}","${c.impressions || 0}","${c.reach || 0}","${freq}","${cpm}","${cpc}","${ctr}","${c.clicks || 0}","${msgCount}","${cpr > 0 ? cpr : ''}","${Math.round(c.spend_meta || 0)}"\n`
    })

    csv += `"TỔNG","${summaryRow.impressions}","${summaryRow.reach}","${summaryRow.frequency}","${Math.round(summaryRow.cpm)}","${Math.round(summaryRow.cpc)}","${summaryRow.ctr}","${summaryRow.clicks}","${summaryRow.messages}","${Math.round(summaryRow.costPerMessage)}","${Math.round(summaryRow.spend)}"\n\n`

    csv += `"Nhận xét:"\n`
    reviews.forEach((r) => {
      csv += `"- ${r.replace(/"/g, '""')}"\n`
    })

    csv += `\n"Đề xuất:"\n`
    suggestions.forEach((s) => {
      csv += `"+ ${s.replace(/"/g, '""')}"\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Bao_Cao_Meta_Ads_${brandName.replace(/\s+/g, '_')}_${dateRangeText.replace(/[^a-zA-Z0-9]/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative my-8 w-full max-w-6xl rounded-2xl border border-outline bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-outline px-6 py-4 bg-slate-50/70 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-xs">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline text-lg font-bold text-ink">
                  Xuất Báo Cáo Google Sheet (Template Chuẩn)
                </h3>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  {brandName}
                </span>
              </div>
              <p className="text-xs text-muted">
                Thời gian: <strong>{dateRangeText}</strong> • Tự động tính toán số liệu + Điền nhận xét và đề xuất
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAIReview}
              className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition shadow-xs"
              title="Tự động tính toán lại và viết lời khen, nhận xét mới"
            >
              <Sparkles size={14} className="text-purple-600 animate-spin-slow" />
              <span>Sinh lại Nhận xét & Đề xuất</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* BẢNG SỐ LIỆU ĐÚNG FORMAT GOOGLE SHEET */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Layers size={14} className="text-primary" />
                <span>Bảng số liệu hiệu quả ({validCampaigns.length} chiến dịch)</span>
              </h4>
              <span className="text-[11px] text-muted">
                Định dạng sẵn sàng để Paste vào Google Sheet
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-emerald-800 text-white font-bold text-[11px] divide-x divide-emerald-700/50">
                    <th className="px-3 py-2.5 min-w-[220px]">Quảng cáo</th>
                    <th className="px-2.5 py-2.5 text-right whitespace-nowrap">Lượt hiển thị</th>
                    <th className="px-2.5 py-2.5 text-right whitespace-nowrap">Người tiếp cận</th>
                    <th className="px-2 py-2.5 text-right whitespace-nowrap">Tần suất</th>
                    <th className="px-2.5 py-2.5 text-right whitespace-nowrap">CPM</th>
                    <th className="px-2.5 py-2.5 text-right whitespace-nowrap">CPC</th>
                    <th className="px-2.5 py-2.5 text-right whitespace-nowrap">CTR</th>
                    <th className="px-2.5 py-2.5 text-right whitespace-nowrap">Click</th>
                    <th className="px-2.5 py-2.5 text-right whitespace-nowrap">Cuộc trò chuyện</th>
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">Chi phí / mess</th>
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">Chi tiêu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {validCampaigns.map((c) => {
                    const freq = (c.reach || 0) > 0 ? ((c.impressions || 0) / (c.reach || 1)).toFixed(2) : '1.00'
                    const cpm = (c.impressions || 0) > 0 ? (c.spend_meta / c.impressions) * 1000 : 0
                    const cpc = (c.clicks || 0) > 0 ? c.spend_meta / c.clicks : 0
                    const ctr = (c.impressions || 0) > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) + '%' : '0.00%'
                    const msgCount = c.messages || 0
                    const cpr = msgCount > 0 ? c.spend_meta / msgCount : 0

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2 font-sans font-medium text-slate-900 max-w-xs truncate" title={c.name}>
                          {c.name}
                        </td>
                        <td className="px-2.5 py-2 text-right">{formatNumber(c.impressions)}</td>
                        <td className="px-2.5 py-2 text-right">{formatNumber(c.reach)}</td>
                        <td className="px-2 py-2 text-right">{freq}</td>
                        <td className="px-2.5 py-2 text-right">{formatNumber(Math.round(cpm))}</td>
                        <td className="px-2.5 py-2 text-right">{formatNumber(Math.round(cpc))}</td>
                        <td className="px-2.5 py-2 text-right text-emerald-700 font-bold">{ctr}</td>
                        <td className="px-2.5 py-2 text-right">{formatNumber(c.clicks)}</td>
                        <td className="px-2.5 py-2 text-right font-bold text-slate-900">{formatNumber(msgCount)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-primary">
                          {cpr > 0 ? formatNumber(Math.round(cpr)) : '-'}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {formatNumber(Math.round(c.spend_meta))}
                        </td>
                      </tr>
                    )
                  })}

                  {/* HÀNG TỔNG */}
                  <tr className="bg-emerald-50/80 font-bold border-t-2 border-emerald-300 text-slate-900">
                    <td className="px-3 py-2.5 font-sans uppercase text-emerald-950">TỔNG</td>
                    <td className="px-2.5 py-2.5 text-right">{formatNumber(summaryRow.impressions)}</td>
                    <td className="px-2.5 py-2.5 text-right">{formatNumber(summaryRow.reach)}</td>
                    <td className="px-2 py-2.5 text-right">{summaryRow.frequency}</td>
                    <td className="px-2.5 py-2.5 text-right">{formatNumber(Math.round(summaryRow.cpm))}</td>
                    <td className="px-2.5 py-2.5 text-right">{formatNumber(Math.round(summaryRow.cpc))}</td>
                    <td className="px-2.5 py-2.5 text-right text-emerald-800 font-extrabold">{summaryRow.ctr}</td>
                    <td className="px-2.5 py-2.5 text-right">{formatNumber(summaryRow.clicks)}</td>
                    <td className="px-2.5 py-2.5 text-right text-emerald-900 font-extrabold">{formatNumber(summaryRow.messages)}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-900 font-extrabold">
                      {formatNumber(Math.round(summaryRow.costPerMessage))}
                    </td>
                    <td className="px-3 py-2.5 text-right text-emerald-900 font-extrabold">
                      {formatNumber(Math.round(summaryRow.spend))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* KHỐI NHẬN XÉT & KHEN NGỢI (EDITABLE) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Award size={15} className="text-amber-500" />
                <span>Nhận xét hiệu quả (Tự động tạo & Có thể sửa trước khi copy)</span>
              </h4>
              <span className="text-[11px] text-muted">
                Mỗi gạch đầu dòng tương ứng 1 ý trong template
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
              {reviews.map((rev, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                  <textarea
                    rows={2}
                    value={rev}
                    onChange={(e) => {
                      const newRevs = [...reviews]
                      newRevs[idx] = e.target.value
                      setReviews(newRevs)
                    }}
                    className="w-full rounded-lg border border-outline bg-white px-3 py-2 text-xs leading-relaxed text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* KHỐI ĐỀ XUẤT (THEO YÊU CẦU CỦA BẠN) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Lightbulb size={15} className="text-primary" />
                <span>Đề xuất tối ưu tiếp theo (Next Actions)</span>
              </h4>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary-soft/20 p-4 space-y-2.5">
              {suggestions.map((sug, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 rounded-full bg-emerald-600 shrink-0" />
                  <input
                    type="text"
                    value={sug}
                    onChange={(e) => {
                      const newSuggs = [...suggestions]
                      newSuggs[idx] = e.target.value
                      setSuggestions(newSuggs)
                    }}
                    className="w-full rounded-lg border border-outline bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-outline px-6 py-4 bg-slate-50/70 rounded-b-2xl shrink-0">
          <div className="text-xs text-muted">
            💡 Mẹo: Bấm <strong>"Copy toàn bộ dữ liệu"</strong> rồi vào Google Sheet bấm <strong>Ctrl + V</strong> là tự động điền đầy đủ cả bảng và nhận xét!
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Download size={15} />
              <span>Tải file Excel / CSV</span>
            </button>

            <button
              onClick={handleCopyForGoogleSheet}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-button ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-primary text-white hover:bg-primary-hover'
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span>Đã copy vào Clipboard! (Ctrl+V để dán)</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy toàn bộ để dán vào Google Sheet</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ExportGoogleSheetModal
