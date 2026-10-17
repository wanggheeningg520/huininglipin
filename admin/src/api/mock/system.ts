// ============================================================
// Mock 数据 - 系统设置域
// ============================================================
import { mockMenus, allPermissions } from './auth'

export interface MockRole {
  id: number
  name: string
  code: string
  remark: string
  status: '启用' | '停用'
  permissions: string[]
  createdAt: string
}

export const mockRoles: MockRole[] = [
  { id: 1, name: '超级管理员', code: 'super_admin', remark: '拥有全部权限', status: '启用', permissions: allPermissions, createdAt: '2026-01-01 00:00:00' },
  { id: 2, name: '商品运营', code: 'product_ops', remark: '商品与库存管理', status: '启用', permissions: ['product:category:*', 'product:list', 'product:write', 'product:stock', 'product:presale', 'product:status'], createdAt: '2026-02-01 00:00:00' },
  { id: 3, name: '订单运营', code: 'order_ops', remark: '订单与退款管理', status: '启用', permissions: ['order:list', 'order:detail', 'order:ship', 'order:export', 'order:refund', 'order:refund:audit'], createdAt: '2026-02-01 00:00:00' },
  { id: 4, name: '内容运营', code: 'content_ops', remark: '内容运营管理', status: '启用', permissions: ['content:festival', 'content:banner', 'content:recommend', 'content:topic', 'content:notice'], createdAt: '2026-02-01 00:00:00' }
]

export interface MockAdminUser {
  id: number
  username: string
  password: string
  realName: string
  phone: string
  status: '启用' | '停用'
  roleIds: number[]
  roleNames: string[]
  createdAt: string
}

export const mockAdminUsers: MockAdminUser[] = [
  { id: 1, username: 'admin', password: 'admin123', realName: '超级管理员', phone: '13800000001', status: '启用', roleIds: [1], roleNames: ['超级管理员'], createdAt: '2026-01-01 00:00:00' },
  { id: 2, username: 'product01', password: '123456', realName: '张商品', phone: '13800000002', status: '启用', roleIds: [2], roleNames: ['商品运营'], createdAt: '2026-03-01 00:00:00' },
  { id: 3, username: 'order01', password: '123456', realName: '李订单', phone: '13800000003', status: '启用', roleIds: [3], roleNames: ['订单运营'], createdAt: '2026-03-01 00:00:00' },
  { id: 4, username: 'content01', password: '123456', realName: '王内容', phone: '13800000004', status: '启用', roleIds: [4], roleNames: ['内容运营'], createdAt: '2026-03-01 00:00:00' },
  { id: 5, username: 'test', password: '123456', realName: '测试账号', phone: '13800000005', status: '停用', roleIds: [2, 3], roleNames: ['商品运营', '订单运营'], createdAt: '2026-04-01 00:00:00' }
]

export interface MockSysConfig {
  key: string
  value: string
  name: string
  remark: string
  group: string
  updatedAt: string
}

export const mockSysConfigs: MockSysConfig[] = [
  { key: 'pay_timeout_minutes', value: '30', name: '支付超时时间(分钟)', remark: '待支付订单超时自动取消', group: '交易', updatedAt: '2026-10-01 00:00:00' },
  { key: 'after_sale_days', value: '7', name: '售后期天数', remark: '确认收货后售后期天数', group: '交易', updatedAt: '2026-10-01 00:00:00' },
  { key: 'address_limit', value: '20', name: '地址上限', remark: '会员收货地址最大数量', group: '会员', updatedAt: '2026-10-01 00:00:00' },
  { key: 'cart_qty_limit', value: '99', name: '购物车数量上限', remark: '单 SKU 加购数量上限', group: '交易', updatedAt: '2026-10-01 00:00:00' },
  { key: 'order_remark_limit', value: '200', name: '订单备注字数上限', remark: '下单备注最大字数', group: '交易', updatedAt: '2026-10-01 00:00:00' },
  { key: 'presale_card_pay', value: '0', name: '预售卡券支付(二期)', remark: '一期未开放，二期启用', group: '卡券', updatedAt: '2026-10-01 00:00:00' },
  { key: 'distrib_enabled', value: 'false', name: '分销开关(三期)', remark: '一期未开放，三期启用', group: '分销', updatedAt: '2026-10-01 00:00:00' }
]

export interface MockAuditLog {
  id: number
  operator: string
  module: string
  action: string
  ip: string
  beforeValue: string | null
  afterValue: string | null
  createdAt: string
}

const modules = ['商品管理', '订单管理', '内容运营', '会员管理', '系统设置']
const actions = ['新增', '编辑', '删除', '上下架', '发货', '退款审核', '库存调整', '登录']

export const mockAuditLogs: MockAuditLog[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  operator: ['admin', 'product01', 'order01', 'content01'][i % 4],
  module: modules[i % 5],
  action: actions[i % 8],
  ip: `192.168.1.${100 + (i % 50)}`,
  beforeValue: i % 2 === 0 ? '{"status":"在售"}' : null,
  afterValue: i % 2 === 0 ? '{"status":"下架"}' : '{"id":' + (i + 1) + '}',
  createdAt: `2026-10-17 ${String(8 + (i % 12)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00`
}))

/** 数据看板统计 */
export const mockDashboardStats = {
  todayOrderCount: 38,
  todaySalesAmount: 12856.5,
  pendingShipCount: 12,
  productCount: 28,
  pendingRefundCount: 3,
  memberCount: 22,
  // 近 7 天趋势
  orderTrend: [
    { date: '10-11', count: 25, amount: 8200 },
    { date: '10-12', count: 32, amount: 10500 },
    { date: '10-13', count: 28, amount: 9800 },
    { date: '10-14', count: 41, amount: 15200 },
    { date: '10-15', count: 35, amount: 11800 },
    { date: '10-16', count: 44, amount: 13500 },
    { date: '10-17', count: 38, amount: 12856.5 }
  ],
  // 分类销量占比
  categorySales: [
    { name: '当季鲜果', value: 35 },
    { name: '雅趣伴手礼', value: 28 },
    { name: '节日专区', value: 22 },
    { name: '品质生活', value: 15 }
  ]
}

export { mockMenus, allPermissions }