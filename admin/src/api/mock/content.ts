// ============================================================
// Mock 数据 - 内容运营域
// ============================================================

export interface MockFestival {
  id: number
  name: string
  calendarType: '公历' | '农历'
  month: number
  day: number
  prepDays: number
  saleStart: string
  saleEnd: string
  bannerImage: string
  linkUrl: string
  isOnline: boolean
  status: '启用' | '停用'
  sort: number
}

export const mockFestivals: MockFestival[] = [
  { id: 1, name: '中秋节', calendarType: '农历', month: 8, day: 15, prepDays: 30, saleStart: '2026-08-15 00:00:00', saleEnd: '2026-09-24 23:59:59', bannerImage: 'https://picsum.photos/seed/midautumn/750/300', linkUrl: '/festival/1', isOnline: false, status: '启用', sort: 1 },
  { id: 2, name: '春节', calendarType: '农历', month: 1, day: 1, prepDays: 45, saleStart: '2027-01-10 00:00:00', saleEnd: '2027-02-17 23:59:59', bannerImage: 'https://picsum.photos/seed/spring/750/300', linkUrl: '/festival/2', isOnline: false, status: '启用', sort: 2 },
  { id: 3, name: '端午节', calendarType: '农历', month: 5, day: 5, prepDays: 20, saleStart: '2027-05-20 00:00:00', saleEnd: '2027-06-19 23:59:59', bannerImage: 'https://picsum.photos/seed/dragon/750/300', linkUrl: '/festival/3', isOnline: false, status: '启用', sort: 3 },
  { id: 4, name: '母亲节', calendarType: '公历', month: 5, day: 10, prepDays: 15, saleStart: '2027-04-25 00:00:00', saleEnd: '2027-05-10 23:59:59', bannerImage: 'https://picsum.photos/seed/mother/750/300', linkUrl: '/festival/4', isOnline: false, status: '启用', sort: 4 },
  { id: 5, name: '教师节', calendarType: '公历', month: 9, day: 10, prepDays: 10, saleStart: '2027-09-01 00:00:00', saleEnd: '2027-09-10 23:59:59', bannerImage: 'https://picsum.photos/seed/teacher/750/300', linkUrl: '/festival/5', isOnline: false, status: '停用', sort: 5 }
]

export interface MockBanner {
  id: number
  position: 'home_top' | 'category_top' | 'festival_top'
  title: string
  image: string
  linkType: '商品' | '分类' | '专题' | '外链' | '无'
  linkValue: string
  startTime: string
  endTime: string
  sort: number
  status: '启用' | '停用'
}

export const mockBanners: MockBanner[] = [
  { id: 1, position: 'home_top', title: '中秋预热', image: 'https://picsum.photos/seed/b1/750/300', linkType: '专题', linkValue: '中秋专区', startTime: '2026-08-15 00:00:00', endTime: '2026-09-24 23:59:59', sort: 1, status: '启用' },
  { id: 2, position: 'home_top', title: '新品上市', image: 'https://picsum.photos/seed/b2/750/300', linkType: '商品', linkValue: '1', startTime: '2026-10-01 00:00:00', endTime: '2026-12-31 23:59:59', sort: 2, status: '启用' },
  { id: 3, position: 'category_top', title: '水果季', image: 'https://picsum.photos/seed/b3/750/300', linkType: '分类', linkValue: '1', startTime: '2026-10-01 00:00:00', endTime: '2026-11-30 23:59:59', sort: 1, status: '启用' },
  { id: 4, position: 'home_top', title: '品牌故事', image: 'https://picsum.photos/seed/b4/750/300', linkType: '外链', linkValue: 'https://example.com', startTime: '2026-01-01 00:00:00', endTime: '2026-12-31 23:59:59', sort: 3, status: '停用' }
]

export interface MockRecommend {
  id: number
  productId: number
  productTitle: string
  mainImage: string
  sort: number
  status: '启用' | '停用'
}

export const mockRecommends: MockRecommend[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  productId: i + 1,
  productTitle: `慧宁甄选·精品礼盒${i + 1}号`,
  mainImage: `https://picsum.photos/seed/rec${i}/200/200`,
  sort: i + 1,
  status: '启用'
}))

export interface MockTopic {
  id: number
  title: string
  banner: string
  productIds: number[]
  sort: number
  status: '启用' | '停用'
  createdAt: string
}

export const mockTopics: MockTopic[] = [
  { id: 1, title: '中秋甄选', banner: 'https://picsum.photos/seed/t1/750/300', productIds: [1, 2, 3, 4, 5], sort: 1, status: '启用', createdAt: '2026-09-01 10:00:00' },
  { id: 2, title: '年货大街', banner: 'https://picsum.photos/seed/t2/750/300', productIds: [6, 7, 8, 9, 10], sort: 2, status: '启用', createdAt: '2026-09-15 10:00:00' },
  { id: 3, title: '鲜果季', banner: 'https://picsum.photos/seed/t3/750/300', productIds: [11, 12, 13], sort: 3, status: '停用', createdAt: '2026-10-01 10:00:00' }
]

export interface MockNotice {
  id: number
  title: string
  content: string
  type: '系统' | '活动' | '公告'
  sort: number
  status: '启用' | '停用'
  createdAt: string
}

export const mockNotices: MockNotice[] = [
  { id: 1, title: '系统升级公告', content: '系统将于 2026-10-20 凌晨升级，届时暂停服务。', type: '系统', sort: 1, status: '启用', createdAt: '2026-10-15 10:00:00' },
  { id: 2, title: '中秋活动开启', content: '中秋专区已上线，精选月饼等您挑选。', type: '活动', sort: 2, status: '启用', createdAt: '2026-08-15 10:00:00' },
  { id: 3, title: '物流时效说明', content: '国庆期间物流可能延迟，请知悉。', type: '公告', sort: 3, status: '停用', createdAt: '2026-09-28 10:00:00' }
]