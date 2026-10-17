/**
 * Redis 键前缀与命名约定（对应 design.md 2.1.3 幂等/库存预占）
 * 全局前缀 hn: 由 ioredis keyPrefix 注入，此处仅定义业务子键
 */
export const RedisKeys = {
  /** 幂等键：idem:{key} */
  idempotency: (key: string) => `idem:${key}`,
  /** 支付回调幂等：pay:callback:{tradeNo} */
  payCallback: (tradeNo: string) => `pay:callback:${tradeNo}`,
  /** 库存预占：stock:sku:{skuId} */
  stockSku: (skuId: number) => `stock:sku:${skuId}`,
  /** 订单号自增序号：order:seq:{yyyyMMdd} */
  orderSeq: (date: string) => `order:seq:${date}`,
  /** 支付超时订单：pay:timeout:{orderNo} */
  payTimeout: (orderNo: string) => `pay:timeout:${orderNo}`,
  /** 节日专区在线列表缓存：festival:online */
  festivalOnline: 'festival:online',
  /** 首页聚合缓存：home:aggregate */
  homeAggregate: 'home:aggregate',
  /** Banner 缓存：banner:{position} */
  bannerPosition: (position: string) => `banner:${position}`,
  /** 物流轨迹缓存：logistics:{trackNo} */
  logisticsTrack: (trackNo: string) => `logistics:${trackNo}`,
  /** 分类树缓存：category:tree */
  categoryTree: 'category:tree',
  /** 热门搜索词缓存：search:hot */
  searchHot: 'search:hot',
};

/** 幂等键 TTL（秒） */
export const IDEMPOTENCY_TTL = 30 * 60;

/** 支付回调幂等 TTL（秒） */
export const PAY_CALLBACK_TTL = 24 * 60 * 60;

/** 物流轨迹缓存 TTL（秒） */
export const LOGISTICS_CACHE_TTL = 1800;

/** 首页聚合缓存 TTL（秒） */
export const HOME_CACHE_TTL = 60;