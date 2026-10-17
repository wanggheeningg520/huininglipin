// ============================================================
// Mock 数据 - 订单域
// ============================================================

export interface MockOrderItem {
  skuId: number
  productId: number
  productTitle: string
  mainImage: string
  specJson: Record<string, string>
  price: number
  qty: number
  amount: number
}

export interface MockOrder {
  orderNo: string
  userId: number
  userNickname: string
  userPhone: string
  orderType: '普通' | '预售'
  totalAmount: number
  payAmount: number
  cardPayAmount: number
  payStatus: '未支付' | '已支付'
  payType: string | null
  payTime: string | null
  tradeNo: string | null
  status: '待支付' | '待发货' | '待收货' | '已完成' | '已取消' | '已退款'
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  remark: string
  isPresale: boolean
  presaleDeliverDate: string | null
  logisticsCompany: string | null
  logisticsNo: string | null
  shipTime: string | null
  confirmTime: string | null
  finishTime: string | null
  cancelTime: string | null
  createdAt: string
  items: MockOrderItem[]
}

const img = (n: number) => `https://picsum.photos/seed/order${n}/100/100`
const statuses: MockOrder['status'][] = ['待支付', '待发货', '待收货', '已完成', '已取消', '已退款']

export const mockOrders: MockOrder[] = Array.from({ length: 35 }, (_, i) => {
  const id = i + 1
  const status = statuses[i % 6]
  const isPresale = id % 5 === 0
  const paid = status !== '待支付' && status !== '已取消'
  const shipped = status === '待收货' || status === '已完成'
  return {
    orderNo: `HNZY20261017${String(id).padStart(6, '0')}`,
    userId: (id % 10) + 1,
    userNickname: `微信用户${(id % 10) + 1}`,
    userPhone: `138****${String(1000 + id).slice(-4)}`,
    orderType: isPresale ? '预售' : '普通',
    totalAmount: 99 + (id % 5) * 50,
    payAmount: 99 + (id % 5) * 50,
    cardPayAmount: 0,
    payStatus: paid ? '已支付' : '未支付',
    payType: paid ? '微信支付' : null,
    payTime: paid ? `2026-10-17 ${String(10 + (id % 10)).padStart(2, '0')}:30:00` : null,
    tradeNo: paid ? `wx_trade_${id}` : null,
    status,
    receiverName: `收货人${id}`,
    receiverPhone: `139****${String(2000 + id).slice(-4)}`,
    receiverAddress: `广东省深圳市南山区科技园路${id}号`,
    remark: id % 3 === 0 ? '请尽快发货，谢谢' : '',
    isPresale,
    presaleDeliverDate: isPresale ? '2026-12-25' : null,
    logisticsCompany: shipped ? '顺丰速运' : null,
    logisticsNo: shipped ? `SF${String(1234567890 + id)}` : null,
    shipTime: shipped ? `2026-10-18 09:00:00` : null,
    confirmTime: status === '已完成' ? `2026-10-20 12:00:00` : null,
    finishTime: status === '已完成' ? `2026-10-27 12:00:00` : null,
    cancelTime: status === '已取消' ? `2026-10-17 15:00:00` : null,
    createdAt: `2026-10-17 ${String(10 + (id % 12)).padStart(2, '0')}:00:00`,
    items: [
      {
        skuId: (id % 5) * 10 + 1,
        productId: (id % 5) + 1,
        productTitle: `慧宁甄选·精品礼盒${(id % 5) + 1}号`,
        mainImage: img(id),
        specJson: { 规格: '标准装' },
        price: 99 + (id % 5),
        qty: 1 + (id % 3),
        amount: (99 + (id % 5)) * (1 + (id % 3))
      }
    ]
  }
})

export interface MockRefund {
  refundNo: string
  orderNo: string
  userId: number
  amount: number
  reason: string
  status: '待审核' | '已通过' | '已拒绝' | '已退款'
  auditRemark: string | null
  auditor: string | null
  auditTime: string | null
  createdAt: string
  order: MockOrder
}

export const mockRefunds: MockRefund[] = Array.from({ length: 12 }, (_, i) => {
  const id = i + 1
  const status: MockRefund['status'][] = ['待审核', '已通过', '已拒绝', '已退款']
  const order = mockOrders[id * 2 - 1]
  return {
    refundNo: `RF20261017${String(id).padStart(6, '0')}`,
    orderNo: order.orderNo,
    userId: order.userId,
    amount: order.payAmount,
    reason: ['商品质量问题', '不想要了', '拍错了', '物流太慢'][id % 4],
    status: status[id % 4],
    auditRemark: id % 4 === 2 ? '已与客户沟通退款' : id % 4 === 3 ? '不符合退款条件' : null,
    auditor: id % 4 === 0 ? null : 'admin',
    auditTime: id % 4 === 0 ? null : `2026-10-17 16:00:00`,
    createdAt: `2026-10-17 ${String(11 + (id % 10)).padStart(2, '0')}:00:00`,
    order
  }
})