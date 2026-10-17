// =============================================================================
// Mock 数据 - 交易域（购物车/订单/支付/物流）
// =============================================================================

import type {
  CartItemVO, CartResultVO, OrderCardVO, OrderDetailVO,
  PayParamsVO, LogisticsVO, CreateOrderResultVO
} from '../../types';

// ---------- 购物车 ----------
export const mockCartItems: CartItemVO[] = [
  { id: 1, skuId: 1011, productId: 101, productTitle: '平谷大桃 礼盒装 5斤', mainImage: 'https://cdn.example.com/mock/peach.jpg', specJson: { 规格: '基础装' }, price: 88, qty: 2, checked: true, stock: 50, soldOut: false },
  { id: 2, skuId: 1031, productId: 103, productTitle: '广式月饼礼盒 双黄白莲蓉', mainImage: 'https://cdn.example.com/mock/mooncake.jpg', specJson: { 规格: '基础装' }, price: 168, qty: 1, checked: true, stock: 50, soldOut: false },
  { id: 3, skuId: 1051, productId: 105, productTitle: '新疆纸皮核桃 1kg', mainImage: 'https://cdn.example.com/mock/nut.jpg', specJson: { 规格: '基础装' }, price: 58, qty: 1, checked: false, stock: 50, soldOut: false }
];

export function mockCart(): CartResultVO {
  const checked = mockCartItems.filter((i) => i.checked);
  return {
    items: mockCartItems,
    totalCount: mockCartItems.reduce((s, i) => s + i.qty, 0),
    totalAmount: checked.reduce((s, i) => s + i.price * i.qty, 0)
  };
}

// ---------- 订单 ----------
export const mockOrders: OrderCardVO[] = [
  {
    orderNo: 'HNZY20261017000001',
    status: '待支付',
    totalAmount: 344,
    payAmount: 344,
    createdAt: '2026-10-17 10:00:00',
    items: [
      { productTitle: '平谷大桃 礼盒装 5斤', specJson: { 规格: '基础装' }, price: 88, qty: 2, mainImage: 'https://cdn.example.com/mock/peach.jpg' },
      { productTitle: '广式月饼礼盒', specJson: { 规格: '基础装' }, price: 168, qty: 1, mainImage: 'https://cdn.example.com/mock/mooncake.jpg' }
    ]
  },
  {
    orderNo: 'HNZY20261016000002',
    status: '待收货',
    totalAmount: 268,
    payAmount: 268,
    createdAt: '2026-10-16 14:30:00',
    items: [
      { productTitle: '西湖龙井 明前特级 50g', specJson: { 规格: '基础装' }, price: 268, qty: 1, mainImage: 'https://cdn.example.com/mock/tea.jpg' }
    ]
  },
  {
    orderNo: 'HNZY20261015000003',
    status: '已完成',
    totalAmount: 58,
    payAmount: 58,
    createdAt: '2026-10-15 09:00:00',
    items: [
      { productTitle: '新疆纸皮核桃 1kg', specJson: { 规格: '基础装' }, price: 58, qty: 1, mainImage: 'https://cdn.example.com/mock/nut.jpg' }
    ]
  }
];

export function mockOrderList(params: { status?: string; page?: number; pageSize?: number }) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  let list = mockOrders;
  if (params.status && params.status !== '全部') {
    list = mockOrders.filter((o) => o.status === params.status);
  }
  const start = (page - 1) * pageSize;
  return { list: list.slice(start, start + pageSize), total: list.length, page, pageSize };
}

export function mockOrderDetail(orderNo: string): OrderDetailVO {
  const o = mockOrders.find((x) => x.orderNo === orderNo) || mockOrders[0];
  return {
    ...o,
    payStatus: o.status === '待支付' ? '未支付' : '已支付',
    orderType: '普通订单',
    cardPayAmount: 0,
    payType: o.status === '待支付' ? null : '微信支付',
    payTime: o.status === '待支付' ? null : '2026-10-16 14:31:00',
    tradeNo: o.status === '待支付' ? null : '4200002026101601234567890',
    receiver: { name: '张三', phone: '138****8888', address: '北京市朝阳区慧宁路 1 号 2 栋 3 单元 401' },
    remark: '请尽快发货，谢谢',
    isPresale: o.items.some((i) => i.productTitle.includes('大桃')),
    presaleDeliverDate: o.items.some((i) => i.productTitle.includes('大桃')) ? '2026-10-25' : null,
    logistics: o.status === '待收货' || o.status === '已完成'
      ? { company: '顺丰速运', trackNo: 'SF1234567890' }
      : null,
    createdAt: o.createdAt
  };
}

export function mockCreateOrder(): CreateOrderResultVO {
  return {
    orderNo: 'HNZY' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + Math.floor(100000 + Math.random() * 900000),
    totalAmount: 344,
    payAmount: 344,
    status: '待支付'
  };
}

export function mockPayParams(): PayParamsVO {
  return {
    timeStamp: String(Math.floor(Date.now() / 1000)),
    nonceStr: Math.random().toString(36).slice(2, 14),
    package: 'prepay_id=wx202610171234567890',
    signType: 'RSA',
    paySign: 'MOCK_SIGN_' + Math.random().toString(36).slice(2)
  };
}

export function mockLogistics(): LogisticsVO {
  return {
    company: '顺丰速运',
    trackNo: 'SF1234567890',
    isSigned: false,
    traces: [
      { time: '2026-10-16 15:00:00', content: '已揽收' },
      { time: '2026-10-16 18:30:00', content: '快件已发往北京分拨中心' },
      { time: '2026-10-17 08:00:00', content: '快件到达北京朝阳派送点' },
      { time: '2026-10-17 09:30:00', content: '正在派送中，派送员：李师傅 13800000000' }
    ]
  };
}