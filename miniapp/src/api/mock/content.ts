// =============================================================================
// Mock 数据 - 内容域（首页聚合/节日/搜索/推荐/专题）
// =============================================================================

import type {
  HomeAggVO, FestivalDetailVO, SearchResultVO, TopicVO,
  BannerVO, FestivalZoneVO
} from '../../types';
import { mockCategories, mockProducts } from './product';

// ---------- 首页聚合 ----------
export function mockHome(): HomeAggVO {
  const banners: BannerVO[] = [
    { id: 1, image: 'https://cdn.example.com/mock/banner1.jpg', linkType: 'festival', linkValue: '1' },
    { id: 2, image: 'https://cdn.example.com/mock/banner2.jpg', linkType: 'product', linkValue: '103' },
    { id: 3, image: 'https://cdn.example.com/mock/banner3.jpg', linkType: 'topic', linkValue: '1' }
  ];
  const festivals: FestivalZoneVO[] = [
    { id: 1, name: '中秋专区', bannerImage: 'https://cdn.example.com/mock/festival-midautumn.jpg', linkUrl: '/pages/festival/index?id=1', sort: 1 },
    { id: 2, name: '国庆甄选', bannerImage: 'https://cdn.example.com/mock/festival-national.jpg', linkUrl: '/pages/festival/index?id=2', sort: 2 }
  ];
  return {
    banners,
    festivals,
    categories: mockCategories,
    presaleProducts: mockProducts.filter((p) => p.isPresale),
    recommends: mockProducts.slice(0, 6)
  };
}

// ---------- 节日专区详情 ----------
export function mockFestivalDetail(id: number): FestivalDetailVO {
  return {
    id,
    name: id === 1 ? '中秋专区' : '国庆甄选',
    bannerImage: 'https://cdn.example.com/mock/festival-banner.jpg',
    products: mockProducts.slice(0, 4)
  };
}

// ---------- 搜索 ----------
const HOT_KEYWORDS = ['月饼', '大桃', '龙井', '核桃', '茶具'];

export function mockSearch(keyword: string): SearchResultVO {
  if (!keyword) {
    return { list: [], total: 0, hotKeywords: HOT_KEYWORDS };
  }
  const list = mockProducts.filter(
    (p) => p.title.includes(keyword) || keyword.length > 0 && p.title.toLowerCase().includes(keyword.toLowerCase())
  );
  return {
    list: list.length ? list : mockProducts.slice(0, 4),  // 空结果返回热门商品
    total: list.length,
    hotKeywords: HOT_KEYWORDS
  };
}

// ---------- 精选推荐 ----------
export function mockRecommend(page: number, pageSize: number) {
  const list = mockProducts;
  const start = (page - 1) * pageSize;
  return {
    list: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize
  };
}

// ---------- 专题 ----------
export function mockTopic(id: number): TopicVO {
  return {
    id,
    title: '慧宁甄选 · 秋季好礼',
    banner: 'https://cdn.example.com/mock/topic-banner.jpg',
    products: mockProducts.slice(2, 8)
  };
}