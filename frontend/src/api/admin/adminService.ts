import { apiRequest } from '../client';
import type { AdminReport, AdminUser, ReportAction, ReportStatus, UserStatus } from '../../types/moderation';
import type { Order, OrderStatus, PageResponse, Product, ProductCategory, ProductStatus } from '../../types/shop';

// 관리자 전용 API (/admin/**). 서버가 ADMIN 권한을 검사하므로 mock 없이 서버에서만 동작한다.

export type ProductInput = {
  name: string;
  description?: string;
  category: ProductCategory;
  price: number;
  stock: number;
  imageUrl?: string;
  status: ProductStatus;
};

export const adminService = {
  getReports: (status?: ReportStatus, page = 0) => apiRequest<PageResponse<AdminReport>>('/admin/reports', { query: { status, page, size: 20 } }),
  resolveReport: (reportId: number, action: ReportAction, memo?: string) =>
    apiRequest<AdminReport>(`/admin/reports/${reportId}`, { method: 'PATCH', body: { action, memo } }),

  getUsers: (query: { status?: UserStatus; keyword?: string; page?: number } = {}) =>
    apiRequest<PageResponse<AdminUser>>('/admin/users', { query: { ...query, size: 20 } }),
  changeUserStatus: (userId: number, status: 'ACTIVE' | 'SUSPENDED') =>
    apiRequest<AdminUser>(`/admin/users/${userId}/status`, { method: 'PATCH', body: { status } }),

  setPostHidden: (postId: number, hidden: boolean) => apiRequest<void>(`/admin/posts/${postId}/visibility`, { method: 'PATCH', body: { hidden } }),
  setCommentHidden: (commentId: number, hidden: boolean) => apiRequest<void>(`/admin/comments/${commentId}/visibility`, { method: 'PATCH', body: { hidden } }),

  getProducts: (query: { status?: ProductStatus; keyword?: string; page?: number } = {}) =>
    apiRequest<PageResponse<Product>>('/admin/products', { query: { ...query, size: 50 } }),
  createProduct: (input: ProductInput) => apiRequest<Product>('/admin/products', { method: 'POST', body: input }),
  updateProduct: (productId: number, input: Partial<ProductInput>) => apiRequest<Product>(`/admin/products/${productId}`, { method: 'PATCH', body: input }),

  getOrders: (status?: OrderStatus, page = 0) => apiRequest<PageResponse<Order>>('/admin/orders', { query: { status, page, size: 20 } }),
  updateShipping: (orderNo: string, status: 'SHIPPING' | 'DELIVERED', courier?: string, trackingNumber?: string) =>
    apiRequest<Order>(`/admin/orders/${orderNo}/shipping`, { method: 'PATCH', body: { status, courier, trackingNumber } }),
};
