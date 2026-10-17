// =============================================================================
// API 响应类型定义
// 对应 design.md 2.2.2 接口契约
// =============================================================================

// ---------- 统一响应体 ----------
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  traceId?: string;
}

// ---------- 分页 ----------
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------- 商品域 ----------
export interface CategoryNode {
  id: number;
  name: string;          // C 端展示名（accompany → 雅趣伴手礼）
  icon: string | null;
  sort: number;
  children: CategoryNode[];
}

export interface ProductCardVO {
  id: number;
  title: string;
  mainImage: string;
  priceFrom: number;
  marketPriceFrom: number;
  sales: number;
  isPresale: boolean;
  presaleDeliverDate: string | null;
}

export interface SkuInfo {
  id: number;
  specJson: Record<string, string>;
  price: number;
  marketPrice: number | null;
  stock: number;
  sales: number;
  unit: string;
  status: '在售' | '停售';
  soldOut: boolean;
}

export interface ProductDetailVO {
  id: number;
  title: string;
  subtitle: string | null;
  mainImage: string;
  images: string[];
  detailHtml: string;
  isPresale: boolean;
  presaleDeliverDate: string | null;
  category: { id: number; name: string };
  isFresh: boolean;
  complianceTips: string[];
  skus: SkuInfo[];
}

// ---------- 交易域 ----------
export interface CartItemVO {
  id: number;
  skuId: number;
  productId: number;
  productTitle: string;
  mainImage: string;
  specJson: Record<string, string>;
  price: number;
  qty: number;
  checked: boolean;
  stock: number;
  soldOut: boolean;
}

export interface CartResultVO {
  items: CartItemVO[];
  totalCount: number;
  totalAmount: number;
}

export interface CreateOrderReq {
  items: { skuId: number; qty: number }[];
  addressId: number;
  remark?: string;
  fromCart?: boolean;
}

export interface CreateOrderResultVO {
  orderNo: string;
  totalAmount: number;
  payAmount: number;
  status: string;
}

export interface OrderItemVO {
  productTitle: string;
  specJson: Record<string, string>;
  price: number;
  qty: number;
  mainImage: string;
}

export interface OrderCardVO {
  orderNo: string;
  status: string;
  totalAmount: number;
  payAmount: number;
  createdAt: string;
  items: OrderItemVO[];
}

export interface OrderDetailVO {
  orderNo: string;
  status: string;
  payStatus: string;
  orderType: string;
  totalAmount: number;
  payAmount: number;
  cardPayAmount: number;
  payType: string | null;
  payTime: string | null;
  tradeNo: string | null;
  receiver: { name: string; phone: string; address: string };
  remark: string | null;
  isPresale: boolean;
  presaleDeliverDate: string | null;
  logistics: { company: string; trackNo: string } | null;
  items: OrderItemVO[];
  createdAt: string;
}

export interface PayParamsVO {
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA';
  paySign: string;
}

export interface LogisticsVO {
  company: string;
  trackNo: string;
  traces: { time: string; content: string }[];
  isSigned: boolean;
}

// ---------- 会员域 ----------
export interface UserInfoVO {
  id: number;
  nickname: string;
  avatar: string;
  phone: string | null;
  level: number;
  points: number;
}

export interface LoginResultVO {
  token: string;
  user: { id: number; nickname: string; avatar: string; phone: string | null };
}

export interface AddressVO {
  id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

// ---------- 内容域 ----------
export interface BannerVO {
  id: number;
  image: string;
  linkType: string;
  linkValue: string;
}

export interface FestivalZoneVO {
  id: number;
  name: string;
  bannerImage: string;
  linkUrl: string;
  sort: number;
}

export interface HomeAggVO {
  banners: BannerVO[];
  festivals: FestivalZoneVO[];
  categories: CategoryNode[];
  presaleProducts: ProductCardVO[];
  recommends: ProductCardVO[];
}

export interface FestivalDetailVO {
  id: number;
  name: string;
  bannerImage: string;
  products: ProductCardVO[];
}

export interface SearchResultVO {
  list: ProductCardVO[];
  total: number;
  hotKeywords?: string[];
}

export interface TopicVO {
  id: number;
  title: string;
  banner: string;
  products: ProductCardVO[];
}