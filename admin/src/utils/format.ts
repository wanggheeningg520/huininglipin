// ============================================================
// 格式化工具
// ============================================================

/** 手机号脱敏：中间 4 位 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone || ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/** 金额分转元 */
export function fenToYuan(fen: number): number {
  return Number((fen / 100).toFixed(2))
}

/** 金额元转分 */
export function yuanToFen(yuan: number): number {
  return Math.round(yuan * 100)
}

/** 格式化金额（元，两位小数） */
export function formatMoney(yuan: number): string {
  return `¥${Number(yuan || 0).toFixed(2)}`
}

/** 格式化日期时间 */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 格式化日期 */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 订单状态颜色映射 */
export function orderStatusType(status: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    待支付: 'warning',
    待发货: 'primary',
    待收货: 'primary',
    已完成: 'success',
    已取消: 'info',
    已退款: 'danger',
    退款中: 'warning'
  }
  return map[status] || 'info'
}

/** 退款状态颜色映射 */
export function refundStatusType(status: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    待审核: 'warning',
    已通过: 'success',
    已拒绝: 'danger',
    已退款: 'success'
  }
  return map[status] || 'info'
}

/** 下载 CSV */
export function downloadCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h]
          const s = val === null || val === undefined ? '' : String(val)
          return `"${s.replace(/"/g, '""')}"`
        })
        .join(',')
    )
  ].join('\n')
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}