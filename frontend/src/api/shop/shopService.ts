import { API_BASE_URL } from '../client';
import type { Cart, Order, OrderCreateRequest, PageResponse, Product, ProductQuery } from '../../types/shop';
import { httpShopService } from './httpShopService';
import { mockShopService } from './mockShopService';

// 화면은 이 계약만 사용한다. 백엔드 연결 여부와 무관하게 화면 코드는 그대로 유지
export type ShopService = {
  getProducts(query?: ProductQuery): Promise<PageResponse<Product>>;
  getProduct(productId: number): Promise<Product>;

  getCart(): Promise<Cart>;
  addToCart(productId: number, quantity: number): Promise<Cart>;
  changeCartQuantity(cartItemId: number, quantity: number): Promise<Cart>;
  removeCartItem(cartItemId: number): Promise<Cart>;

  createOrder(request: OrderCreateRequest): Promise<Order>;
  // PG 결제창 성공 시 받은 paymentKey 로 서버 승인
  confirmPayment(orderNo: string, paymentKey: string, amount: number): Promise<Order>;
  cancelOrder(orderNo: string, reason?: string): Promise<Order>;
  getOrders(page?: number): Promise<PageResponse<Order>>;
  getOrder(orderNo: string): Promise<Order>;
};

// EXPO_PUBLIC_API_BASE_URL 이 없으면 하드코딩 상품 + 테스트 결제로 동작
export const isMockShop = !API_BASE_URL;

export const shopService: ShopService = isMockShop ? mockShopService : httpShopService;
