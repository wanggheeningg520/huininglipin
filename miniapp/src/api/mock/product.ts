// =============================================================================
// Mock 数据 - 商品域
// =============================================================================

import type { CategoryNode, ProductCardVO, ProductDetailVO, PageResult } from '../../types';

// ---------- 分类树（四大品类 + 二级）----------
export const mockCategories: CategoryNode[] = [
  {
    id: 1, name: '食品', icon: 'food', sort: 1,
    children: [
      { id: 11, name: '坚果炒货', icon: null, sort: 1, children: [] },
      { id: 12, name: '糕点甜品', icon: null, sort: 2, children: [] },
      { id: 13, name: '茶叶', icon: null, sort: 3, children: [] }
    ]
  },
  {
    id: 2, name: '节日', icon: 'festival', sort: 2,
    children: [
      { id: 21, name: '中秋礼盒', icon: null, sort: 1, children: [] },
      { id: 22, name: '春节礼盒', icon: null, sort: 2, children: [] },
      { id: 23, name: '端午礼盒', icon: null, sort: 3, children: [] }
    ]
  },
  {
    id: 3, name: '水果', icon: 'fruit', sort: 3,
    children: [
      { id: 31, name: '时令鲜果', icon: null, sort: 1, children: [] },
      { id: 32, name: '进口水果', icon: null, sort: 2, children: [] },
      { id: 33, name: '果篮礼盒', icon: null, sort: 3, children: [] }
    ]
  },
  {
    id: 4, name: '雅趣伴手礼', icon: 'accompany', sort: 4,
    children: [
      { id: 41, name: '文创摆件', icon: null, sort: 1, children: [] },
      { id: 42, name: '茶具器皿', icon: null, sort: 2, children: [] }
    ]
  }
];

// ---------- 商品图片占位 ----------
const IMG = {
  peach: 'https://cdn.example.com/mock/peach.jpg',
  mooncake: 'https://cdn.example.com/mock/mooncake.jpg',
  tea: 'https://cdn.example.com/mock/tea.jpg',
  nut: 'https://cdn.example.com/mock/nut.jpg',
  pot: 'https://cdn.example.com/mock/pot.jpg',
  placeholder: 'https://cdn.example.com/mock/placeholder.jpg'
};

// ---------- 商品列表 ----------
export const mockProducts: ProductCardVO[] = [
  { id: 101, title: '平谷大桃 礼盒装 5斤', mainImage: IMG.peach, priceFrom: 88, marketPriceFrom: 128, sales: 326, isPresale: true, presaleDeliverDate: '2026-10-25' },
  { id: 102, title: '阳澄湖大闸蟹礼券 8只装', mainImage: IMG.placeholder, priceFrom: 388, marketPriceFrom: 488, sales: 156, isPresale: false, presaleDeliverDate: null },
  { id: 103, title: '广式月饼礼盒 双黄白莲蓉', mainImage: IMG.mooncake, priceFrom: 168, marketPriceFrom: 218, sales: 892, isPresale: false, presaleDeliverDate: null },
  { id: 104, title: '西湖龙井 明前特级 50g', mainImage: IMG.tea, priceFrom: 268, marketPriceFrom: 358, sales: 432, isPresale: false, presaleDeliverDate: null },
  { id: 105, title: '新疆纸皮核桃 1kg', mainImage: IMG.nut, priceFrom: 58, marketPriceFrom: 88, sales: 1245, isPresale: false, presaleDeliverDate: null },
  { id: 106, title: '景德镇青花茶具套装', mainImage: IMG.pot, priceFrom: 468, marketPriceFrom: 698, sales: 78, isPresale: false, presaleDeliverDate: null },
  { id: 107, title: '阿克苏苹果 礼盒装 5斤', mainImage: IMG.placeholder, priceFrom: 78, marketPriceFrom: 108, sales: 567, isPresale: true, presaleDeliverDate: '2026-10-28' },
  { id: 108, title: '云南鲜花饼 礼盒 20枚', mainImage: IMG.placeholder, priceFrom: 48, marketPriceFrom: 68, sales: 2103, isPresale: false, presaleDeliverDate: null },
  { id: 109, title: '福建平和蜜柚 2个装', mainImage: IMG.placeholder, priceFrom: 39, marketPriceFrom: 59, sales: 876, isPresale: false, presaleDeliverDate: null },
  { id: 110, title: '挪威三文鱼冰鲜 500g', mainImage: IMG.placeholder, priceFrom: 128, marketPriceFrom: 168, sales: 234, isPresale: false, presaleDeliverDate: null }
];

// ---------- 商品列表分页 ----------
export function mockProductList(params: { page?: number; pageSize?: number; categoryId?: number }): PageResult<ProductCardVO> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  let list = mockProducts;
  if (params.categoryId) {
    // 简单按 id 模拟分类筛选
    list = mockProducts.filter((_, i) => (i + params.categoryId!) % 4 === 0);
  }
  const start = (page - 1) * pageSize;
  return {
    list: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize
  };
}

// ---------- 商品详情 ----------
export function mockProductDetail(id: number): ProductDetailVO {
  const p = mockProducts.find((x) => x.id === id) || mockProducts[0];
  const isFresh = p.id === 101 || p.id === 107 || p.id === 109 || p.id === 110;
  return {
    id: p.id,
    title: p.title,
    subtitle: '慧宁甄选 · 品质之选',
    mainImage: p.mainImage,
    images: [p.mainImage, IMG.placeholder, IMG.placeholder],
    detailHtml: '<div style="padding:20px;"><h3>商品详情</h3><p>慧宁甄选，匠心之选。本商品精选优质原料，严格品控，确保每一份礼品都传递心意。</p></div>',
    isPresale: p.isPresale,
    presaleDeliverDate: p.presaleDeliverDate,
    category: { id: isFresh ? 3 : 1, name: isFresh ? '水果' : '食品' },
    isFresh,
    complianceTips: isFresh
      ? ['生鲜商品不支持 7 天无理由退货', '采用冷链物流配送，确保新鲜']
      : [],
    skus: [
      { id: p.id * 10 + 1, specJson: { 规格: '基础装' }, price: p.priceFrom, marketPrice: p.marketPriceFrom, stock: 50, sales: p.sales, unit: '件', status: '在售', soldOut: false },
      { id: p.id * 10 + 2, specJson: { 规格: '精装版' }, price: Math.round(p.priceFrom * 1.3), marketPrice: Math.round(p.marketPriceFrom * 1.3), stock: 20, sales: 30, unit: '件', status: '在售', soldOut: false },
      { id: p.id * 10 + 3, specJson: { 规格: '豪华礼盒' }, price: Math.round(p.priceFrom * 1.8), marketPrice: Math.round(p.marketPriceFrom * 1.8), stock: 0, sales: 10, unit: '件', status: '在售', soldOut: true }
    ]
  };
}