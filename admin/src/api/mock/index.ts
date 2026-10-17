// ============================================================
// Mock 路由分发器
// 根据请求路径和方法返回 mock 数据，模拟后端 API
// ============================================================
import type { ApiResponse, PageResult } from '@/types'
import { mockLogin } from './auth'
import {
  mockCategories, mockProducts, mockStockLogs,
  type MockCategory, type MockProduct
} from './product'
import { mockOrders, mockRefunds, type MockOrder } from './order'
import {
  mockFestivals, mockBanners, mockRecommends, mockTopics, mockNotices,
  type MockFestival, type MockBanner, type MockRecommend, type MockTopic, type MockNotice
} from './content'
import { mockMembers, type MockMember } from './member'
import {
  mockRoles, mockAdminUsers, mockSysConfigs, mockAuditLogs, mockDashboardStats,
  type MockRole, type MockAdminUser, type MockSysConfig, type MockAuditLog
} from './system'

// ---------- 工具 ----------
function ok<T>(data: T, message = 'success'): ApiResponse<T> {
  return { code: 0, message, data }
}
function fail(code: number, message: string): ApiResponse<null> {
  return { code, message, data: null }
}
function page<T>(list: T[], total: number, p: number, ps: number): ApiResponse<PageResult<T>> {
  return ok({ list, total, page: p, pageSize: ps })
}
function paginate<T>(arr: T[], p: number, ps: number): ApiResponse<PageResult<T>> {
  const start = (p - 1) * ps
  return page(arr.slice(start, start + ps), arr.length, p, ps)
}
function delay(ms = 200): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// 内存可变副本（支持 CRUD 模拟）
let categories: MockCategory[] = JSON.parse(JSON.stringify(mockCategories))
let products: MockProduct[] = JSON.parse(JSON.stringify(mockProducts))
let stockLogs = JSON.parse(JSON.stringify(mockStockLogs))
let orders: MockOrder[] = JSON.parse(JSON.stringify(mockOrders))
let refunds = JSON.parse(JSON.stringify(mockRefunds))
let festivals: MockFestival[] = JSON.parse(JSON.stringify(mockFestivals))
let banners: MockBanner[] = JSON.parse(JSON.stringify(mockBanners))
let recommends: MockRecommend[] = JSON.parse(JSON.stringify(mockRecommends))
let topics: MockTopic[] = JSON.parse(JSON.stringify(mockTopics))
let notices: MockNotice[] = JSON.parse(JSON.stringify(mockNotices))
let members: MockMember[] = JSON.parse(JSON.stringify(mockMembers))
let roles: MockRole[] = JSON.parse(JSON.stringify(mockRoles))
let adminUsers: MockAdminUser[] = JSON.parse(JSON.stringify(mockAdminUsers))
let sysConfigs: MockSysConfig[] = JSON.parse(JSON.stringify(mockSysConfigs))
let auditLogs: MockAuditLog[] = JSON.parse(JSON.stringify(mockAuditLogs))

let nextId = 10000
function genId(): number {
  return ++nextId
}

function addAudit(operator: string, module: string, action: string): void {
  auditLogs.unshift({
    id: genId(), operator, module, action, ip: '127.0.0.1',
    beforeValue: null, afterValue: null, createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
  })
}

// ---------- 路由匹配 ----------
export async function mockRequest(
  method: string,
  path: string,
  params: Record<string, unknown> = {},
  data: Record<string, unknown> = {}
): Promise<ApiResponse> {
  await delay()
  const m = method.toUpperCase()
  const p = path.replace(/^\//, '')
  const pp = (n: number) => p.split('/')[n] || ''
  const num = (v: unknown, d = 1) => Number(v) || d

  // ===== 登录 =====
  if (p === 'auth/login' && m === 'POST') {
    const { username, password } = data as { username: string; password: string }
    if (!username || !password) return fail(10001, '账号密码不能为空')
    return ok(mockLogin(username, password))
  }
  if (p === 'auth/info') return ok({ user: adminUsers[0], menus: [], permissions: [] })
  if (p === 'auth/logout') return ok(null)

  // ===== 数据看板 =====
  if (p === 'dashboard/stats') return ok(mockDashboardStats)

  // ===== 商品分类 =====
  if (p === 'product/categories' && m === 'GET') return ok(categories)
  if (p === 'product/categories' && m === 'POST') {
    const body = data as Partial<MockCategory>
    const cat: MockCategory = {
      id: genId(), parentId: body.parentId ?? null, name: body.name || '',
      code: body.code || '', sort: body.sort ?? 99, icon: body.icon ?? null,
      status: body.status || '启用'
    }
    categories.push(cat)
    addAudit('admin', '商品管理', '新增分类')
    return ok(cat)
  }
  if (p.startsWith('product/categories/') && m === 'PUT') {
    const id = Number(pp(2))
    const idx = categories.findIndex((c) => c.id === id)
    if (idx < 0) return fail(20001, '分类不存在')
    categories[idx] = { ...categories[idx], ...(data as MockCategory) }
    addAudit('admin', '商品管理', '编辑分类')
    return ok(categories[idx])
  }
  if (p.startsWith('product/categories/') && m === 'DELETE') {
    const id = Number(pp(2))
    categories = categories.filter((c) => c.id !== id)
    addAudit('admin', '商品管理', '删除分类')
    return ok(null)
  }

  // ===== 商品 =====
  if (p === 'product/list' && m === 'GET') {
    const { categoryId, status, keyword, isPresale } = params
    let list = [...products]
    if (categoryId) list = list.filter((x) => x.categoryId === Number(categoryId))
    if (status) list = list.filter((x) => x.status === status)
    if (isPresale === 'true') list = list.filter((x) => x.isPresale)
    if (keyword) list = list.filter((x) => x.title.includes(String(keyword)))
    return paginate(list, num(params.page, 1), num(params.pageSize, 20))
  }
  if (p === 'product' && m === 'POST') {
    const body = data as Partial<MockProduct>
    const prod: MockProduct = {
      id: genId(), categoryId: body.categoryId || 1, title: body.title || '',
      subtitle: body.subtitle || '', mainImage: body.mainImage || '',
      images: body.images || [], detailHtml: body.detailHtml || '',
      isPresale: body.isPresale ?? false, presaleDeliverDate: body.presaleDeliverDate ?? null,
      status: body.status || '下架', sort: body.sort ?? 99,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      skus: body.skus || []
    }
    products.unshift(prod)
    addAudit('admin', '商品管理', '新增商品')
    return ok(prod)
  }
  if (p.startsWith('product/') && m === 'GET' && !p.includes('/')) {
    const id = Number(pp(1))
    const prod = products.find((x) => x.id === id)
    if (!prod) return fail(20001, '商品不存在')
    return ok(prod)
  }
  if (p.startsWith('product/') && m === 'PUT' && !p.includes('/status') && !p.includes('/presale')) {
    const id = Number(pp(1))
    const idx = products.findIndex((x) => x.id === id)
    if (idx < 0) return fail(20001, '商品不存在')
    products[idx] = { ...products[idx], ...(data as MockProduct) }
    addAudit('admin', '商品管理', '编辑商品')
    return ok(products[idx])
  }
  if (p.includes('/status') && m === 'PATCH') {
    const id = Number(pp(1))
    const idx = products.findIndex((x) => x.id === id)
    if (idx < 0) return fail(20001, '商品不存在')
    products[idx].status = (data as { status: MockProduct['status'] }).status
    addAudit('admin', '商品管理', '上下架')
    return ok(products[idx])
  }
  if (p.includes('/presale') && m === 'PATCH') {
    const id = Number(pp(1))
    const idx = products.findIndex((x) => x.id === id)
    if (idx < 0) return fail(20001, '商品不存在')
    const { isPresale, presaleDeliverDate } = data as { isPresale: boolean; presaleDeliverDate: string }
    products[idx].isPresale = isPresale
    products[idx].presaleDeliverDate = presaleDeliverDate
    addAudit('admin', '商品管理', '预售配置')
    return ok(products[idx])
  }
  if (p === 'product/batch' && m === 'POST') {
    const { ids, action } = data as { ids: number[]; action: string }
    ids.forEach((id) => {
      const idx = products.findIndex((x) => x.id === id)
      if (idx >= 0) {
        if (action === 'on') products[idx].status = '在售'
        if (action === 'off') products[idx].status = '下架'
      }
    })
    addAudit('admin', '商品管理', '批量操作')
    return ok({ success: ids.length, fail: 0 })
  }

  // ===== 库存 =====
  if (p === 'product/stock/logs') {
    return paginate(stockLogs, num(params.page, 1), num(params.pageSize, 20))
  }
  if (p.includes('/stock') && m === 'PATCH') {
    const skuId = Number(pp(3))
    const { changeQty, changeType } = data as { changeQty: number; changeType: string }
    products.forEach((prod) => {
      prod.skus.forEach((sku) => {
        if (sku.id === skuId) {
          stockLogs.unshift({
            id: genId(), skuId, changeType: changeType || '运营调整',
            changeQty, beforeQty: sku.stock, afterQty: sku.stock + changeQty,
            refOrderNo: null, operator: 'admin',
            createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
          })
          sku.stock += changeQty
        }
      })
    })
    addAudit('admin', '商品管理', '库存调整')
    return ok(null)
  }

  // ===== 订单 =====
  if (p === 'order/list' && m === 'GET') {
    const { status, keyword, orderType } = params
    let list = [...orders]
    if (status && status !== '全部') list = list.filter((x) => x.status === status)
    if (orderType) list = list.filter((x) => x.orderType === orderType)
    if (keyword) list = list.filter((x) => x.orderNo.includes(String(keyword)))
    return paginate(list, num(params.page, 1), num(params.pageSize, 20))
  }
  if (p.startsWith('order/') && m === 'GET' && !p.includes('/ship') && !p.includes('/export')) {
    const orderNo = pp(1)
    const o = orders.find((x) => x.orderNo === orderNo)
    if (!o) return fail(30001, '订单不存在')
    return ok(o)
  }
  if (p.includes('/ship') && m === 'POST') {
    const orderNo = pp(1)
    const idx = orders.findIndex((x) => x.orderNo === orderNo)
    if (idx < 0) return fail(30001, '订单不存在')
    const { logisticsCompany, logisticsNo } = data as { logisticsCompany: string; logisticsNo: string }
    orders[idx].status = '待收货'
    orders[idx].logisticsCompany = logisticsCompany
    orders[idx].logisticsNo = logisticsNo
    orders[idx].shipTime = new Date().toISOString().replace('T', ' ').slice(0, 19)
    addAudit('admin', '订单管理', '发货')
    return ok(orders[idx])
  }
  if (p === 'order/export' && m === 'GET') return ok({ url: '/mock-export.csv', count: orders.length })

  // ===== 退款 =====
  if (p === 'refund/list' && m === 'GET') {
    const { status } = params
    let list = [...refunds]
    if (status && status !== '全部') list = list.filter((x) => x.status === status)
    return paginate(list, num(params.page, 1), num(params.pageSize, 20))
  }
  if (p.includes('/audit') && m === 'POST') {
    const refundNo = pp(1)
    const idx = refunds.findIndex((x) => x.refundNo === refundNo)
    if (idx < 0) return fail(30001, '退款单不存在')
    const { status, auditRemark } = data as { status: string; auditRemark: string }
    refunds[idx].status = status === 'pass' ? '已退款' : '已拒绝'
    refunds[idx].auditRemark = auditRemark
    refunds[idx].auditor = 'admin'
    refunds[idx].auditTime = new Date().toISOString().replace('T', ' ').slice(0, 19)
    addAudit('admin', '订单管理', '退款审核')
    return ok(refunds[idx])
  }

  // ===== 节日日历 =====
  if (p === 'content/festival' && m === 'GET') return paginate(festivals, num(params.page, 1), num(params.pageSize, 20))
  if (p === 'content/festival' && m === 'POST') {
    const f = { id: genId(), ...(data as MockFestival) }
    festivals.push(f); addAudit('admin', '内容运营', '新增节日'); return ok(f)
  }
  if (p.startsWith('content/festival/') && m === 'PUT') {
    const id = Number(pp(2))
    const idx = festivals.findIndex((x) => x.id === id)
    if (idx < 0) return fail(20001, '节日不存在')
    festivals[idx] = { ...festivals[idx], ...(data as MockFestival) }
    addAudit('admin', '内容运营', '编辑节日'); return ok(festivals[idx])
  }
  if (p.includes('content/festival/') && p.includes('/status') && m === 'PATCH') {
    const id = Number(pp(2))
    const idx = festivals.findIndex((x) => x.id === id)
    if (idx < 0) return fail(20001, '节日不存在')
    festivals[idx].status = (data as { status: MockFestival['status'] }).status
    addAudit('admin', '内容运营', '节日启停'); return ok(festivals[idx])
  }
  if (p.startsWith('content/festival/') && m === 'DELETE') {
    const id = Number(pp(2))
    festivals = festivals.filter((x) => x.id !== id)
    addAudit('admin', '内容运营', '删除节日'); return ok(null)
  }

  // ===== Banner =====
  if (p === 'content/banner' && m === 'GET') return paginate(banners, num(params.page, 1), num(params.pageSize, 20))
  if (p === 'content/banner' && m === 'POST') {
    const b = { id: genId(), ...(data as MockBanner) }; banners.push(b); addAudit('admin', '内容运营', '新增Banner'); return ok(b)
  }
  if (p.startsWith('content/banner/') && m === 'PUT') {
    const id = Number(pp(2)); const idx = banners.findIndex((x) => x.id === id)
    if (idx < 0) return fail(20001, 'Banner不存在')
    banners[idx] = { ...banners[idx], ...(data as MockBanner) }; addAudit('admin', '内容运营', '编辑Banner'); return ok(banners[idx])
  }
  if (p.startsWith('content/banner/') && m === 'DELETE') {
    const id = Number(pp(2)); banners = banners.filter((x) => x.id !== id); addAudit('admin', '内容运营', '删除Banner'); return ok(null)
  }

  // ===== 精选推荐 =====
  if (p === 'content/recommend' && m === 'GET') return paginate(recommends, num(params.page, 1), num(params.pageSize, 20))
  if (p === 'content/recommend' && m === 'POST') {
    const r = { id: genId(), ...(data as MockRecommend) }; recommends.push(r); addAudit('admin', '内容运营', '新增推荐'); return ok(r)
  }
  if (p.startsWith('content/recommend/') && m === 'PUT') {
    const id = Number(pp(2)); const idx = recommends.findIndex((x) => x.id === id)
    if (idx < 0) return fail(20001, '推荐不存在')
    recommends[idx] = { ...recommends[idx], ...(data as MockRecommend) }; return ok(recommends[idx])
  }
  if (p.startsWith('content/recommend/') && m === 'DELETE') {
    const id = Number(pp(2)); recommends = recommends.filter((x) => x.id !== id); return ok(null)
  }

  // ===== 专题 =====
  if (p === 'content/topic' && m === 'GET') return paginate(topics, num(params.page, 1), num(params.pageSize, 20))
  if (p === 'content/topic' && m === 'POST') {
    const t = { id: genId(), ...(data as MockTopic) }; topics.push(t); addAudit('admin', '内容运营', '新增专题'); return ok(t)
  }
  if (p.startsWith('content/topic/') && m === 'PUT') {
    const id = Number(pp(2)); const idx = topics.findIndex((x) => x.id === id)
    if (idx < 0) return fail(20001, '专题不存在')
    topics[idx] = { ...topics[idx], ...(data as MockTopic) }; return ok(topics[idx])
  }
  if (p.startsWith('content/topic/') && m === 'DELETE') {
    const id = Number(pp(2)); topics = topics.filter((x) => x.id !== id); return ok(null)
  }

  // ===== 公告 =====
  if (p === 'content/notice' && m === 'GET') return paginate(notices, num(params.page, 1), num(params.pageSize, 20))
  if (p === 'content/notice' && m === 'POST') {
    const n = { id: genId(), ...(data as MockNotice) }; notices.push(n); addAudit('admin', '内容运营', '新增公告'); return ok(n)
  }
  if (p.startsWith('content/notice/') && m === 'PUT') {
    const id = Number(pp(2)); const idx = notices.findIndex((x) => x.id === id)
    if (idx < 0) return fail(20001, '公告不存在')
    notices[idx] = { ...notices[idx], ...(data as MockNotice) }; return ok(notices[idx])
  }
  if (p.startsWith('content/notice/') && m === 'DELETE') {
    const id = Number(pp(2)); notices = notices.filter((x) => x.id !== id); return ok(null)
  }

  // ===== 会员 =====
  if (p === 'member/list' && m === 'GET') {
    const { keyword } = params
    let list = [...members]
    if (keyword) list = list.filter((x) => x.nickname.includes(String(keyword)) || x.phone.includes(String(keyword)))
    return paginate(list, num(params.page, 1), num(params.pageSize, 20))
  }
  if (p.startsWith('member/') && m === 'GET') {
    const id = Number(pp(1)); const mb = members.find((x) => x.id === id)
    if (!mb) return fail(40001, '会员不存在')
    return ok(mb)
  }

  // ===== 角色 =====
  if (p === 'system/role' && m === 'GET') return ok(roles)
  if (p === 'system/role' && m === 'POST') {
    const r = { id: genId(), ...(data as MockRole), createdAt: new Date().toISOString().slice(0, 19) }
    roles.push(r); addAudit('admin', '系统设置', '新增角色'); return ok(r)
  }
  if (p.startsWith('system/role/') && m === 'PUT') {
    const id = Number(pp(2)); const idx = roles.findIndex((x) => x.id === id)
    if (idx < 0) return fail(20001, '角色不存在')
    roles[idx] = { ...roles[idx], ...(data as MockRole) }; addAudit('admin', '系统设置', '编辑角色'); return ok(roles[idx])
  }
  if (p.startsWith('system/role/') && m === 'DELETE') {
    const id = Number(pp(2)); roles = roles.filter((x) => x.id !== id); addAudit('admin', '系统设置', '删除角色'); return ok(null)
  }

  // ===== 管理员 =====
  if (p === 'system/admin' && m === 'GET') return ok(adminUsers)
  if (p === 'system/admin' && m === 'POST') {
    const a = { id: genId(), ...(data as MockAdminUser), createdAt: new Date().toISOString().slice(0, 19) }
    adminUsers.push(a); addAudit('admin', '系统设置', '新增管理员'); return ok(a)
  }
  if (p.startsWith('system/admin/') && m === 'PUT') {
    const id = Number(pp(2)); const idx = adminUsers.findIndex((x) => x.id === id)
    if (idx < 0) return fail(20001, '管理员不存在')
    adminUsers[idx] = { ...adminUsers[idx], ...(data as MockAdminUser) }; addAudit('admin', '系统设置', '编辑管理员'); return ok(adminUsers[idx])
  }

  // ===== 菜单 =====
  if (p === 'system/menu' && m === 'GET') {
    const { mockMenus } = await import('./auth')
    return ok(mockMenus)
  }

  // ===== 系统参数 =====
  if (p === 'system/config' && m === 'GET') return ok(sysConfigs)
  if (p === 'system/config' && m === 'PUT') {
    const list = data as MockSysConfig[]
    sysConfigs = list; addAudit('admin', '系统设置', '修改系统参数'); return ok(null)
  }

  // ===== 审计日志 =====
  if (p === 'system/audit-log' && m === 'GET') {
    const { operator, module } = params
    let list = [...auditLogs]
    if (operator) list = list.filter((x) => x.operator === operator)
    if (module) list = list.filter((x) => x.module === module)
    return paginate(list, num(params.page, 1), num(params.pageSize, 20))
  }

  // ===== OSS 上传凭证 =====
  if (p === 'oss/upload-token') {
    return ok({ uploadToken: 'mock-upload-token', expire: 3600, dir: 'admin/', host: 'https://mock-oss.example.com' })
  }

  return fail(40400, `Mock 未匹配: ${m} ${p}`)
}