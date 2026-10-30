import { ApiError } from '../client';
import { MAX_CART_QUANTITY, type Cart, type CartItem, type Order, type PageResponse, type Product } from '../../types/shop';
import { mockProducts } from './mockProducts';
import type { ShopService } from './shopService';

// 백엔드 OrderService / CartService 규칙을 메모리에서 흉내 낸다 (앱 재시작 시 초기화)
// - 주문 생성 시 재고 차감 + 장바구니에서 제거, 결제 승인 시 PAID, 취소 시 재고 복구
// - paymentKey 가 "fail" 로 시작하면 결제 승인 실패 (백엔드 MockPaymentGateway 와 동일)

const products: Product[] = mockProducts.map((product) => ({ ...product }));
let cartRows: { cartItemId: number; productId: number; quantity: number }[] = [];
const orders: (Order & { paymentKey?: string })[] = [];
let nextCartItemId = 1;

const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(JSON.parse(JSON.stringify(value))), 250));

function findProduct(productId: number) {
  const product = products.find((p) => p.id === productId && p.status === 'ON_SALE');
  if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND', '상품을 찾을 수 없습니다.');
  return product;
}

function setStock(product: Product, stock: number) {
  product.stock = stock;
  product.soldOut = stock <= 0;
}

function buildCart(): Cart {
  const items: CartItem[] = cartRows.map(({ cartItemId, productId, quantity }) => {
    const p = products.find((product) => product.id === productId)!;
    return {
      cartItemId, productId, quantity,
      productName: p.name, imageUrl: p.imageUrl, price: p.price, stock: p.stock,
      lineAmount: p.price * quantity,
      available: p.status === 'ON_SALE' && p.stock >= quantity,
    };
  });
  const available = items.filter((item) => item.available);
  return {
    items,
    totalQuantity: available.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: available.reduce((sum, item) => sum + item.lineAmount, 0),
  };
}

function findOrder(orderNo: string) {
  const order = orders.find((o) => o.orderNo === orderNo);
  if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND', '주문을 찾을 수 없습니다.');
  return order;
}

function toPage<T>(content: T[], page: number, size: number): PageResponse<T> {
  const totalPages = Math.ceil(content.length / size);
  return { content: content.slice(page * size, (page + 1) * size), page, size, totalElements: content.length, totalPages, hasNext: page + 1 < totalPages };
}

const now = () => new Date().toISOString();

export const mockShopService: ShopService = {
  async getProducts({ category, keyword, page = 0, size = 20 } = {}) {
    const word = keyword?.trim();
    const filtered = products
      .filter((p) => p.status === 'ON_SALE' && (!category || p.category === category) && (!word || p.name.includes(word)))
      .sort((a, b) => b.id - a.id);
    return delay(toPage(filtered, page, size));
  },
  async getProduct(productId) {
    return delay(findProduct(productId));
  },

  async getCart() {
    return delay(buildCart());
  },
  async addToCart(productId, quantity) {
    const product = findProduct(productId);
    const row = cartRows.find((r) => r.productId === productId);
    const nextQuantity = Math.min((row?.quantity ?? 0) + quantity, MAX_CART_QUANTITY);
    if (product.stock < nextQuantity) throw new ApiError(409, 'OUT_OF_STOCK', '재고가 부족합니다.');
    if (row) row.quantity = nextQuantity;
    else cartRows.push({ cartItemId: nextCartItemId++, productId, quantity: nextQuantity });
    return delay(buildCart());
  },
  async changeCartQuantity(cartItemId, quantity) {
    const row = cartRows.find((r) => r.cartItemId === cartItemId);
    if (!row) throw new ApiError(404, 'CART_ITEM_NOT_FOUND', '장바구니 항목을 찾을 수 없습니다.');
    row.quantity = Math.max(1, Math.min(quantity, MAX_CART_QUANTITY));
    return delay(buildCart());
  },
  async removeCartItem(cartItemId) {
    cartRows = cartRows.filter((r) => r.cartItemId !== cartItemId);
    return delay(buildCart());
  },

  async createOrder(request) {
    const lines = request.cartItemIds
      ? request.cartItemIds.map((id) => {
          const row = cartRows.find((r) => r.cartItemId === id);
          if (!row) throw new ApiError(404, 'CART_ITEM_NOT_FOUND', '장바구니 항목을 찾을 수 없습니다.');
          return { productId: row.productId, quantity: row.quantity };
        })
      : request.items;
    if (!lines.length) throw new ApiError(400, 'ORDER_ITEMS_REQUIRED', '주문할 상품이 없습니다.');

    const resolved = lines.map((line) => ({ product: findProduct(line.productId), quantity: line.quantity }));
    if (resolved.some(({ product, quantity }) => product.stock < quantity)) {
      throw new ApiError(409, 'OUT_OF_STOCK', '재고가 부족합니다.');
    }
    resolved.forEach(({ product, quantity }) => setStock(product, product.stock - quantity));
    if (request.cartItemIds) cartRows = cartRows.filter((r) => !request.cartItemIds!.includes(r.cartItemId));

    const items = resolved.map(({ product, quantity }) => ({
      productId: product.id, productName: product.name, unitPrice: product.price, quantity, lineAmount: product.price * quantity,
    }));
    const order: Order = {
      orderNo: `MOCK${Date.now()}`,
      orderName: items.length > 1 ? `${items[0].productName} 외 ${items.length - 1}건` : items[0].productName,
      status: 'PENDING_PAYMENT',
      totalAmount: items.reduce((sum, item) => sum + item.lineAmount, 0),
      items,
      receiverName: request.receiverName,
      receiverPhone: request.receiverPhone,
      zipCode: request.zipCode,
      address: request.address,
      addressDetail: request.addressDetail ?? null,
      deliveryMemo: request.deliveryMemo ?? null,
      paymentMethod: null,
      paidAt: null,
      cancelledAt: null,
      cancelReason: null,
      courier: null,
      trackingNumber: null,
      shippedAt: null,
      deliveredAt: null,
      createdAt: now(),
    };
    orders.unshift(order);
    return delay(order);
  },
  async confirmPayment(orderNo, paymentKey, amount) {
    const order = findOrder(orderNo);
    if (order.status !== 'PENDING_PAYMENT') throw new ApiError(409, 'INVALID_ORDER_STATUS', '현재 주문 상태에서는 처리할 수 없습니다.');
    if (order.totalAmount !== amount) throw new ApiError(400, 'PAYMENT_AMOUNT_MISMATCH', '결제 금액이 주문 금액과 일치하지 않습니다.');
    if (paymentKey.startsWith('fail')) throw new ApiError(502, 'PAYMENT_FAILED', '[MOCK] 결제 승인 실패 테스트');
    Object.assign(order, { status: 'PAID', paymentKey, paymentMethod: 'MOCK', paidAt: now() });
    return delay(order);
  },
  async cancelOrder(orderNo, reason) {
    const order = findOrder(orderNo);
    if (order.status !== 'PENDING_PAYMENT' && order.status !== 'PAID') throw new ApiError(409, 'INVALID_ORDER_STATUS', '현재 주문 상태에서는 처리할 수 없습니다.');
    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) setStock(product, product.stock + item.quantity);
    });
    Object.assign(order, { status: 'CANCELLED', cancelledAt: now(), cancelReason: reason?.trim() || '구매자 요청' });
    return delay(order);
  },
  async getOrders(page = 0) {
    return delay(toPage(orders, page, 20));
  },
  async getOrder(orderNo) {
    return delay(findOrder(orderNo));
  },
};
