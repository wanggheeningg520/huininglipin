/**
 * 错误码常量（对应 design.md 2.2.1 错误码规范）
 * 5 位数字，按域分段
 */
export enum ErrorCode {
  /** 成功 */
  SUCCESS = 0,
  /** 参数校验失败 */
  PARAM_INVALID = 10001,
  /** 未授权（未登录/token 失效） */
  UNAUTHORIZED = 10002,
  /** 无权限（RBAC 拒绝） */
  FORBIDDEN = 10003,
  /** 资源不存在 */
  NOT_FOUND = 10004,
  /** 限流 */
  TOO_MANY_REQUESTS = 10005,
  /** 服务器内部错误 */
  INTERNAL_ERROR = 10099,

  /** 商品不存在或已下架 */
  PRODUCT_NOT_FOUND = 20001,
  /** SKU 不存在或已停售 */
  SKU_NOT_FOUND = 20002,
  /** 库存不足 */
  STOCK_NOT_ENOUGH = 20003,
  /** 分类不存在 */
  CATEGORY_NOT_FOUND = 20004,

  /** 订单不存在 */
  ORDER_NOT_FOUND = 30001,
  /** 订单状态非法 */
  ORDER_STATUS_INVALID = 30002,
  /** 重复支付 */
  ORDER_PAID_REPEAT = 30003,
  /** 支付验签失败 */
  PAY_SIGN_INVALID = 30004,
  /** 退款金额超限 */
  REFUND_AMOUNT_EXCEED = 30005,
  /** 幂等键重复 */
  IDEMPOTENT_REPEAT = 30006,

  /** 会员不存在 */
  MEMBER_NOT_FOUND = 40001,
  /** 地址数量超限 */
  ADDRESS_LIMIT_EXCEED = 40002,
  /** 地址被订单引用不可删除 */
  ADDRESS_IN_USE = 40003,
  /** 微信登录失败 */
  WECHAT_LOGIN_FAIL = 40004,

  /** 节日配置非法 */
  FESTIVAL_CONFIG_INVALID = 50001,
  /** 搜索关键词为空 */
  SEARCH_KEYWORD_EMPTY = 50002,

  /** 一期未开放（卡券/分销预留接口） */
  NOT_OPEN_PHASE1 = 90001,
}

/** 错误码 → HTTP 状态码 映射 */
export const ERROR_HTTP_STATUS: Record<number, number> = {
  [ErrorCode.SUCCESS]: 200,
  [ErrorCode.PARAM_INVALID]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
};

/** 错误码 → 默认消息 映射 */
export const ERROR_MESSAGE: Record<number, string> = {
  [ErrorCode.SUCCESS]: 'success',
  [ErrorCode.PARAM_INVALID]: '参数校验失败',
  [ErrorCode.UNAUTHORIZED]: '未授权，请先登录',
  [ErrorCode.FORBIDDEN]: '无权限',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.TOO_MANY_REQUESTS]: '操作太频繁，请稍后再试',
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
  [ErrorCode.PRODUCT_NOT_FOUND]: '商品不存在或已下架',
  [ErrorCode.SKU_NOT_FOUND]: 'SKU 不存在或已停售',
  [ErrorCode.STOCK_NOT_ENOUGH]: '库存不足',
  [ErrorCode.CATEGORY_NOT_FOUND]: '分类不存在',
  [ErrorCode.ORDER_NOT_FOUND]: '订单不存在',
  [ErrorCode.ORDER_STATUS_INVALID]: '订单状态非法，不允许该操作',
  [ErrorCode.ORDER_PAID_REPEAT]: '订单已支付，请勿重复支付',
  [ErrorCode.PAY_SIGN_INVALID]: '支付验签失败',
  [ErrorCode.REFUND_AMOUNT_EXCEED]: '退款金额超过实付金额',
  [ErrorCode.IDEMPOTENT_REPEAT]: '幂等键重复，请勿重复提交',
  [ErrorCode.MEMBER_NOT_FOUND]: '会员不存在',
  [ErrorCode.ADDRESS_LIMIT_EXCEED]: '收货地址数量超过上限',
  [ErrorCode.ADDRESS_IN_USE]: '地址被未完成订单引用，不可删除',
  [ErrorCode.WECHAT_LOGIN_FAIL]: '微信登录失败',
  [ErrorCode.FESTIVAL_CONFIG_INVALID]: '节日配置非法',
  [ErrorCode.SEARCH_KEYWORD_EMPTY]: '搜索关键词为空',
  [ErrorCode.NOT_OPEN_PHASE1]: '一期未开放',
};