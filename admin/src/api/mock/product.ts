// ============================================================
// Mock 数据 - 商品域
// ============================================================

export interface MockCategory {
  id: number
  parentId: number | null
  name: string
  code: string
  sort: number
  icon: string | null
  status: '启用' | '停用'
  children?: MockCategory[]
}

/** 四大一级分类 + 二级 */
export const mockCategories: MockCategory[] = [
  {
    id: 1, parentId: null, name: '当季鲜果', code: 'fresh', sort: 1, icon: '🍎', status: '启用',
    children: [
      { id: 11, parentId: 1, name: '时令水果', code: 'seasonal', sort: 1, icon: null, status: '启用' },
      { id: 12, parentId: 1, name: '进口水果', code: 'imported', sort: 2, icon: null, status: '启用' }
    ]
  },
  {
    id: 2, parentId: null, name: '雅趣伴手礼', code: 'accompany', sort: 2, icon: '🎁', status: '启用',
    children: [
      { id: 21, parentId: 2, name: '地方特产', code: 'local', sort: 1, icon: null, status: '启用' },
      { id: 22, parentId: 2, name: '文创礼盒', code: 'cultural', sort: 2, icon: null, status: '启用' }
    ]
  },
  {
    id: 3, parentId: null, name: '节日专区', code: 'festival', sort: 3, icon: '🎉', status: '启用',
    children: [
      { id: 31, parentId: 3, name: '中秋月饼', code: 'midautumn', sort: 1, icon: null, status: '启用' },
      { id: 32, parentId: 3, name: '新春年货', code: 'spring', sort: 2, icon: null, status: '启用' }
    ]
  },
  {
    id: 4, parentId: null, name: '品质生活', code: 'quality', sort: 4, icon: '✨', status: '启用',
    children: [
      { id: 41, parentId: 4, name: '茶饮冲调', code: 'tea', sort: 1, icon: null, status: '启用' },
      { id: 42, parentId: 4, name: '休闲零食', code: 'snack', sort: 2, icon: null, status: '启用' }
    ]
  }
]

export interface MockSku {
  id: number
  productId: number
  specJson: Record<string, string>
  price: number
  marketPrice: number | null
  stock: number
  sales: number
  unit: string
  status: '在售' | '停售'
}

export interface MockProduct {
  id: number
  categoryId: number
  title: string
  subtitle: string
  mainImage: string
  images: string[]
  detailHtml: string
  isPresale: boolean
  presaleDeliverDate: string | null
  status: '在售' | '下架'
  sort: number
  createdAt: string
  skus: MockSku[]
}

const img = (n: number) => `https://picsum.photos/seed/hn${n}/400/400`

export const mockProducts: MockProduct[] = Array.from({ length: 28 }, (_, i) => {
  const id = i + 1
  const isFresh = id % 4 === 1
  const isPresale = id % 5 === 0
  return {
    id,
    categoryId: isFresh ? 11 : id % 4 === 2 ? 21 : id % 4 === 3 ? 31 : 41,
    title: `慧宁甄选·精品礼盒${id}号`,
    subtitle: `精选好物·品质之选·编号${id}`,
    mainImage: img(id),
    images: [img(id), img(id + 100), img(id + 200)],
    detailHtml: `<p>这是商品${id}的详情描述，品质保证，匠心之选。</p>`,
    isPresale,
    presaleDeliverDate: isPresale ? '2026-12-25' : null,
    status: id % 7 === 0 ? '下架' : '在售',
    sort: id,
    createdAt: `2026-10-${String((id % 17) + 1).padStart(2, '0')} 10:00:00`,
    skus: [
      { id: id * 10 + 1, productId: id, specJson: { 规格: '标准装' }, price: 99 + id, marketPrice: 139 + id, stock: 100 - (id % 30), sales: id * 13, unit: '件', status: '在售' },
      { id: id * 10 + 2, productId: id, specJson: { 规格: '礼盒装' }, price: 168 + id, marketPrice: 218 + id, stock: 50 - (id % 20), sales: id * 7, unit: '盒', status: id % 3 === 0 ? '停售' : '在售' }
    ]
  }
})

export interface MockStockLog {
  id: number
  skuId: number
  changeType: string
  changeQty: number
  beforeQty: number
  afterQty: number
  refOrderNo: string | null
  operator: string
  createdAt: string
}

export const mockStockLogs: MockStockLog[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  skuId: (i % 5) * 10 + 1,
  changeType: ['运营调整', '下单扣减', '取消回滚', '支付确认'][i % 4],
  changeQty: i % 2 === 0 ? 10 : -5,
  beforeQty: 100,
  afterQty: 100 + (i % 2 === 0 ? 10 : -5),
  refOrderNo: i % 2 === 0 ? null : `HNZY20261017${String(i).padStart(6, '0')}`,
  operator: 'admin',
  createdAt: `2026-10-17 ${String(10 + i).padStart(2, '0')}:00:00`
}))