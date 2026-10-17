// =============================================================================
// 常量定义（订单状态枚举 / 错误码 / 业务常量）
// 对应 design.md 2.2.1 错误码规范 + 2.1.3 状态机
// =============================================================================

// ---------- 订单状态 ----------
export enum OrderStatus {
  ALL = '全部',
  PENDING_PAY = '待支付',
  PENDING_SHIP = '待发货',
  PENDING_RECEIVE = '待收货',
  FINISHED = '已完成',
  CANCELED = '已取消',
  REFUNDING = '退款中',
  REFUNDED = '已退款'
}

// 支付状态
export enum PayStatus {
  UNPAID = '未支付',
  PAID = '已支付',
  REFUNDED = '已退款'
}

// ---------- 商品排序 ----------
export enum ProductSortBy {
  DEFAULT = 'sort',
  SALES_DESC = 'sales_desc',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  CREATED_DESC = 'created_desc'
}

// ---------- SKU 状态 ----------
export enum SkuStatus {
  ON_SALE = '在售',
  OFF_SALE = '停售'
}

// ---------- 错误码（对应 design.md 2.2.1）----------
export enum ErrorCode {
  SUCCESS = 0,
  // 通用 1xxxx
  PARAM_INVALID = 10001,
  UNAUTHORIZED = 10002,
  FORBIDDEN = 10003,
  FESTIVAL_OFFLINE = 10004,
  // 商品 2xxxx
  PRODUCT_NOT_FOUND = 20001,
  SKU_OFF_SALE = 20002,
  STOCK_NOT_ENOUGH = 20003,
  // 交易 3xxxx
  ADDRESS_NOT_FOUND = 40001,
  ADDRESS_LIMIT = 40002,
  ADDRESS_IN_USE = 40003,
  ORDER_STATUS_INVALID = 30002,
  ORDER_PAID_REPEAT = 30003,
  REFUND_AMOUNT_EXCEED = 30005,
  IDEMPOTENT_REPEAT = 30006,
  // 节日 5xxxx
  LUNAR_INVALID = 50001,
  // 一期未开放
  NOT_OPEN = 90001
}

// ---------- 业务常量 ----------
export const BIZ = {
  CART_QTY_MAX: 99,            // 购物车数量上限
  ADDRESS_LIMIT: 20,           // 地址上限
  REMARK_MAX: 200,             // 订单备注最大长度
  PAGE_SIZE_DEFAULT: 20,
  PAGE_SIZE_MAX: 50,
  PAY_TIMEOUT_MINUTES: 30,     // 支付超时
  AFTER_SALE_DAYS: 7,          // 售后期
  IDempotencyTTL: 30 * 60 * 1000
} as const;

// ---------- 本地存储键 ----------
export const STORAGE_KEYS = {
  TOKEN: 'hn_token',
  USER_INFO: 'hn_user_info',
  CART_COUNT: 'hn_cart_count',
  LAST_ADDRESS: 'hn_last_address'
} as const;

// ---------- 合规提示文案 ----------
export const COMPLIANCE_TIPS = {
  FRESH_NO_RETURN: '生鲜商品不支持 7 天无理由退货',
  FRESH_COLD_CHAIN: '采用冷链物流配送，确保新鲜',
  PRESALE_LOCK_FIRST: '先锁单后采摘发货',
  FRESH_SIGNED_REFUND: '生鲜不支持无理由退货，请联系客服'
} as const;