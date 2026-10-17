// =============================================================================
// 内容域 API
// 对应 design.md 2.2.2 接口 25-29
// =============================================================================

import { http } from '../request';
import type {
  HomeAggVO, FestivalDetailVO, SearchResultVO, TopicVO,
  ProductCardVO, PageResult
} from '../types';
import {
  mockHome, mockFestivalDetail, mockSearch, mockRecommend, mockTopic
} from '../mock/content';

// 25. 首页配置聚合 GET /content/home
export function fetchHome(): Promise<HomeAggVO> {
  return http.get<HomeAggVO>('/content/home', undefined, {
    auth: false,
    mock: async () => mockHome()
  });
}

// 26. 节日专区详情 GET /content/festival/{id}
export function fetchFestivalDetail(id: number): Promise<FestivalDetailVO> {
  return http.get<FestivalDetailVO>(`/content/festival/${id}`, undefined, {
    auth: false,
    mock: async () => mockFestivalDetail(id)
  });
}

// 27. 搜索 GET /content/search
export function search(params: { keyword?: string; sortBy?: string; categoryId?: number; page?: number; pageSize?: number }): Promise<SearchResultVO> {
  return http.get<SearchResultVO>('/content/search', params, {
    auth: false,
    mock: async () => mockSearch(params.keyword || '')
  });
}

// 28. 精选推荐（瀑布流分页）GET /content/recommend
export function fetchRecommend(params: { page?: number; pageSize?: number }): Promise<PageResult<ProductCardVO>> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  return http.get<PageResult<ProductCardVO>>('/content/recommend', params, {
    auth: false,
    mock: async () => mockRecommend(page, pageSize)
  });
}

// 29. 专题页 GET /content/topic/{id}
export function fetchTopic(id: number): Promise<TopicVO> {
  return http.get<TopicVO>(`/content/topic/${id}`, undefined, {
    auth: false,
    mock: async () => mockTopic(id)
  });
}