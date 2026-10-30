// 백엔드 ShopDtos(com.dangsanchaek.shop.dto) 와 1:1 로 맞춘 타입

export type ProductCategory = 'FOOD' | 'SNACK' | 'TOY' | 'WALK' | 'HYGIENE' | 'CLOTHING' | 'ETC';

export type ProductStatus = 'ON_SALE' | 'HIDDEN';

// PAID(배송 준비중) → SHIPPING(배송중) → DELIVERED(배송 완료). 배송이 시작되면 구매자 취소 불가
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

export type Product = {
  id: number;
  name: string;
  description: string | null;
  category: ProductCategory;
  price: number;
  stock: number;
  soldOut: boolean;
  imageUrl: string | null;
  status: ProductStatus;
  createdAt: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export type ProductQuery = {
  category?: ProductCategory;
  keyword?: string;
  page?: number;
  size?: number;
};

export type CartItem = {
  cartItemId: number;
  productId: number;
  productName: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  lineAmount: number;
  stock: number;
  // 판매중 + 재고 충분 여부. false 면 주문 불가, 합계에서 제외
  available: boolean;
};

export type Cart = {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
};

export type ShippingInfo = {
  receiverName: string;
  receiverPhone: string;
  zipCode: string;
  address: string;
  addressDetail?: string;
  deliveryMemo?: string;
};

// items(바로 구매) 또는 cartItemIds(장바구니 주문) 중 하나만 지정
export type OrderCreateRequest = ShippingInfo &
  ({ items: { productId: number; quantity: number }[]; cartItemIds?: never } | { cartItemIds: number[]; items?: never });

export type OrderItem = {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineAmount: number;
};

export type Order = {
  orderNo: string;
  orderName: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  receiverName: string;
  receiverPhone: string;
  zipCode: string;
  address: string;
  addressDetail: string | null;
  deliveryMemo: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  courier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
};

export const MAX_CART_QUANTITY = 99;
