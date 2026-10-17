/** 订单状态枚举（对应 design.md 2.1.3 订单状态机） */
export enum OrderStatus {
  PENDING_PAY = '待支付',
  PAID = '已支付',
  PENDING_SHIP = '待发货',
  SHIPPED = '已发货',
  RECEIVED = '已收货',
  FINISHED = '已完成',
  CANCELLED = '已取消',
  REFUNDING = '退款中',
  REFUNDED = '已退款',
}

/** 支付状态枚举 */
export enum PayStatus {
  PENDING = '待支付',
  PAID = '已支付',
  REFUNDED = '已退款',
  PARTIAL_REFUND = '部分退款',
}

/** 订单类型枚举 */
export enum OrderType {
  RETAIL = '零售单',
  CARD = '卡券单',
  ENTERPRISE = '企业集采单',
}

/** 退款状态枚举 */
export enum RefundStatus {
  PENDING_AUDIT = '待审核',
  APPROVED = '已通过',
  REJECTED = '已拒绝',
  REFUNDED = '已退款',
}

/** 库存变更类型枚举 */
export enum StockChangeType {
  ORDER_PREOCCUPY = '下单预占',
  PAY_CONFIRM = '支付确认',
  CANCEL_RELEASE = '取消释放',
  OPERATOR_ADJUST = '运营调整',
  REFUND_ROLLBACK = '退款回滚',
}

/** 历法类型枚举 */
export enum CalendarType {
  SOLAR = '公历',
  LUNAR = '农历',
}

/** Banner 位置枚举 */
export enum BannerPosition {
  HOME_TOP = '首页顶部',
  CATEGORY_TOP = '分类页顶部',
  FESTIVAL_ZONE = '节日专区',
}

/** 链接类型枚举 */
export enum LinkType {
  PRODUCT = '商品',
  CATEGORY = '分类',
  TOPIC = '专题',
  URL = '外链',
  NONE = '无',
}

/** 通用启用/停用状态 */
export enum CommonStatus {
  ENABLED = 1,
  DISABLED = 0,
}

/** SKU 售卖状态 */
export enum SkuStatus {
  ON_SALE = 1,
  OFF_SALE = 0,
}

/** 商品上下架状态 */
export enum ProductStatus {
  ON_SALE = 1,
  OFF_SHELF = 0,
}

/**
 * 订单状态合法迁移矩阵（对应 design.md 2.1.3 状态机）
 * key: 当前状态, value: 允许迁移到的目标状态集合
 */
export const ORDER_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.PENDING_PAY]: [OrderStatus.PAID, OrderStatus.PENDING_SHIP, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PENDING_SHIP, OrderStatus.REFUNDING],
  [OrderStatus.PENDING_SHIP]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.RECEIVED, OrderStatus.REFUNDING],
  [OrderStatus.RECEIVED]: [OrderStatus.FINISHED],
  [OrderStatus.REFUNDING]: [OrderStatus.REFUNDED, OrderStatus.PAID],
  [OrderStatus.FINISHED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

/** 校验订单状态迁移是否合法 */
export function canTransition(from: string, to: string): boolean {
  const allowed = ORDER_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}