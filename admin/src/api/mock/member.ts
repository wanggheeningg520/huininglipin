// ============================================================
// Mock 数据 - 会员域
// ============================================================

export interface MockMember {
  id: number
  openid: string
  unionid: string | null
  phone: string
  nickname: string
  avatar: string
  level: number
  points: number
  status: '正常' | '禁用'
  orderCount: number
  totalAmount: number
  createdAt: string
  lastLoginAt: string
}

export const mockMembers: MockMember[] = Array.from({ length: 22 }, (_, i) => {
  const id = i + 1
  return {
    id,
    openid: `o${String(id).padStart(8, '0')}_mock`,
    unionid: null,
    phone: `138${String(10000000 + id * 137).slice(0, 8)}`,
    nickname: `微信用户${id}`,
    avatar: `https://picsum.photos/seed/u${id}/80/80`,
    level: id % 5 === 0 ? 2 : 1,
    points: id * 100 % 5000,
    status: id % 11 === 0 ? '禁用' : '正常',
    orderCount: id % 7,
    totalAmount: (id % 7) * (99 + id),
    createdAt: `2026-0${(id % 9) + 1}-1${id % 9} 10:00:00`,
    lastLoginAt: `2026-10-1${id % 7} 18:00:00`
  }
})