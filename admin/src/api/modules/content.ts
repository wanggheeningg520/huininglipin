// ============================================================
// 内容运营 API
// ============================================================
import { http } from '@/api/request'
import type { PageResult } from '@/types'
import type {
  MockFestival, MockBanner, MockRecommend, MockTopic, MockNotice
} from '@/api/mock/content'

export type Festival = MockFestival
export type Banner = MockBanner
export type Recommend = MockRecommend
export type Topic = MockTopic
export type Notice = MockNotice

// ---------- 节日日历 ----------
export function getFestivalList(params: { page?: number; pageSize?: number }): Promise<PageResult<Festival>> {
  return http.get<PageResult<Festival>>('content/festival', params)
}
export function createFestival(data: Partial<Festival>): Promise<Festival> {
  return http.post<Festival>('content/festival', data)
}
export function updateFestival(id: number, data: Partial<Festival>): Promise<Festival> {
  return http.put<Festival>(`content/festival/${id}`, data)
}
export function updateFestivalStatus(id: number, status: '启用' | '停用'): Promise<Festival> {
  return http.patch<Festival>(`content/festival/${id}/status`, { status })
}
export function deleteFestival(id: number): Promise<null> {
  return http.del<null>(`content/festival/${id}`)
}

// ---------- Banner ----------
export function getBannerList(params: { page?: number; pageSize?: number }): Promise<PageResult<Banner>> {
  return http.get<PageResult<Banner>>('content/banner', params)
}
export function createBanner(data: Partial<Banner>): Promise<Banner> {
  return http.post<Banner>('content/banner', data)
}
export function updateBanner(id: number, data: Partial<Banner>): Promise<Banner> {
  return http.put<Banner>(`content/banner/${id}`, data)
}
export function deleteBanner(id: number): Promise<null> {
  return http.del<null>(`content/banner/${id}`)
}

// ---------- 精选推荐 ----------
export function getRecommendList(params: { page?: number; pageSize?: number }): Promise<PageResult<Recommend>> {
  return http.get<PageResult<Recommend>>('content/recommend', params)
}
export function createRecommend(data: Partial<Recommend>): Promise<Recommend> {
  return http.post<Recommend>('content/recommend', data)
}
export function updateRecommend(id: number, data: Partial<Recommend>): Promise<Recommend> {
  return http.put<Recommend>(`content/recommend/${id}`, data)
}
export function deleteRecommend(id: number): Promise<null> {
  return http.del<null>(`content/recommend/${id}`)
}

// ---------- 专题 ----------
export function getTopicList(params: { page?: number; pageSize?: number }): Promise<PageResult<Topic>> {
  return http.get<PageResult<Topic>>('content/topic', params)
}
export function createTopic(data: Partial<Topic>): Promise<Topic> {
  return http.post<Topic>('content/topic', data)
}
export function updateTopic(id: number, data: Partial<Topic>): Promise<Topic> {
  return http.put<Topic>(`content/topic/${id}`, data)
}
export function deleteTopic(id: number): Promise<null> {
  return http.del<null>(`content/topic/${id}`)
}

// ---------- 公告 ----------
export function getNoticeList(params: { page?: number; pageSize?: number }): Promise<PageResult<Notice>> {
  return http.get<PageResult<Notice>>('content/notice', params)
}
export function createNotice(data: Partial<Notice>): Promise<Notice> {
  return http.post<Notice>('content/notice', data)
}
export function updateNotice(id: number, data: Partial<Notice>): Promise<Notice> {
  return http.put<Notice>(`content/notice/${id}`, data)
}
export function deleteNotice(id: number): Promise<null> {
  return http.del<null>(`content/notice/${id}`)
}