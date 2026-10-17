// ============================================================
// 会员管理 API
// ============================================================
import { http } from '@/api/request'
import type { PageResult } from '@/types'
import type { MockMember } from '@/api/mock/member'

export type Member = MockMember

export function getMemberList(params: { keyword?: string; page?: number; pageSize?: number }): Promise<PageResult<Member>> {
  return http.get<PageResult<Member>>('member/list', params as Record<string, unknown>)
}
export function getMemberDetail(id: number): Promise<Member> {
  return http.get<Member>(`member/${id}`)
}