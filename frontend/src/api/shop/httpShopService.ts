import { apiRequest } from '../client';
import type { Cart, Order, PageResponse, Product } from '../../types/shop';
import type { ShopService } from './shopService';

export const httpShopService: ShopService = {
  getProducts: ({ category, keyword, page = 0, size = 20 } = {}) =>
    apiRequest<PageResponse<Product>>('/products', { query: { category, keyword, page, size } }),
  getProduct: (productId) => apiRequest<Product>(`/products/${productId}`),

  getCart: () => apiRequest<Cart>('/cart'),
  addToCart: (productId, quantity) => apiRequest<Cart>('/cart/items', { method: 'POST', body: { productId, quantity } }),
  changeCartQuantity: (cartItemId, quantity) =>
    apiRequest<Cart>(`/cart/items/${cartItemId}`, { method: 'PATCH', body: { quantity } }),
  removeCartItem: (cartItemId) => apiRequest<Cart>(`/cart/items/${cartItemId}`, { method: 'DELETE' }),

  createOrder: (request) => apiRequest<Order>('/orders', { method: 'POST', body: request }),
  confirmPayment: (orderNo, paymentKey, amount) =>
    apiRequest<Order>(`/orders/${orderNo}/payments/confirm`, { method: 'POST', body: { paymentKey, amount } }),
  cancelOrder: (orderNo, reason) => apiRequest<Order>(`/orders/${orderNo}/cancel`, { method: 'POST', body: { reason } }),
  getOrders: (page = 0) => apiRequest<PageResponse<Order>>('/orders', { query: { page, size: 20 } }),
  getOrder: (orderNo) => apiRequest<Order>(`/orders/${orderNo}`),
};
