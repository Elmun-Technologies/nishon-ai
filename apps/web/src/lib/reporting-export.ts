/**
 * Client-side reporting exports (CSV / XLS / print-PDF / PNG snapshot).
 */

export interface ReportCampaignRow {
  id: string
  name: string
  status: string
  objective: string | null
  metrics: { spend: number; clicks: number; impressions: number; ctr: number; cpc: number }
}

export interface ReportAccountRow {
  id: string
  name: string
  currency: string
  timezone: string | null
  metrics: { spend: number; clicks: number; impressions: number; ctr: number; cpc: number }
  campaigns: ReportCampaignRow[]
}

export interface ReportDataShape {
  workspaceId: string
  days: number
  accounts: ReportAccountRow[]
}

const CSV_HEADER = [
  'Account',
  'Account ID',
  'Campaign',
  'Campaign ID',
  'Status',
  'Objective',
  'Spend',
  'Clicks',
  'Impressions',
  'CTR (%)',
  'CPC',
]

function csvEscape(cell: string | number): string {
  const s = String(cell ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** Header + one row per campaign for exports and detailed preview. */
export function buildFlatRows(data: ReportDataShape): string[][] {
  const rows: string[][] = []
  for (const account of data.accounts) {
    for (const campaign of account.campaigns) {
      rows.push([
        account.name,
        account.id,
        campaign.name,
        campaign.id,
        campaign.status,
        campaign.objective ?? '',
        campaign.metrics.spend.toFixed(2),
        String(campaign.metrics.clicks),
        String(campaign.metrics.impressions),
        campaign.metrics.ctr.toFixed(4),
        campaign.metrics.cpc.toFixed(4),
      ])
    }
  }
  return rows
}

export function buildCsvFromData(data: ReportDataShape): string {
  const body = buildFlatRows(data)
  const lines = [CSV_HEADER.map(csvEscape).join(','), ...body.map((r) => r.map(csvEscape).join(','))]
  return lines.join('\n')
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadCsvString(csv: string, filename: string) {
  downloadBlob(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }), filename)
}

/** Excel-friendly HTML table saved as .xls (opens in Excel / Sheets). */
export function downloadXlsHtmlTable(data: ReportDataShape, filename: string) {
  const rows = [CSV_HEADER, ...buildFlatRows(data)]
  const trs = rows
    .map(
      (r) =>
        `<tr>${r.map((c) => `<td>${String(c).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('')}</tr>`,
    )
    .join('')
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Reporting</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
<body><table border="1">${trs}</table></body></html>`
  downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' }), filename)
}

export function openPrintableReport(opts: {
  title: string
  subtitle: string
  data: ReportDataShape
}) {
  const rows = [CSV_HEADER, ...buildFlatRows(opts.data)]
  const table = `<table style="border-collapse:collapse;width:100%;font-size:11px;font-family:system-ui,sans-serif">
<thead><tr>${rows[0].map((h) => `<th style="border:1px solid #ccc;padding:6px;text-align:left;background:#f4f4f5">${h}</th>`).join('')}</tr></thead>
<tbody>${rows
    .slice(1)
    .map(
      (r) =>
        `<tr>${r.map((c) => `<td style="border:1px solid #ddd;padding:5px">${String(c).replace(/</g, '&lt;')}</td>`).join('')}</tr>`,
    )
    .join('')}
</tbody></table>`
  const w = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><title>${opts.title.replace(/</g, '')}</title>
<style>@media print { @page { margin: 12mm; } }</style></head>
<body style="padding:16px;color:#111">
<h1 style="font-size:18px;margin:0 0 4px">${opts.title}</h1>
<p style="margin:0 0 16px;color:#555;font-size:13px">${opts.subtitle}</p>
${table}
<p style="margin-top:16px;font-size:11px;color:#888">AdSpectr — ${new Date().toISOString().slice(0, 19)}</p>
<script>window.onload=function(){window.focus();window.print();}</script>
</body></html>`)
  w.document.close()
}

export async function downloadPngFromElement(el: HTMLElement, filename: string) {
  const { toPng } = await import('html-to-image')
  const dataUrl = await toPng(el, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#ffffff',
    filter: (node: HTMLElement) => node.dataset?.noExport !== 'true',
  })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}
