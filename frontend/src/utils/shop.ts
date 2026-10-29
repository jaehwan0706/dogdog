import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { OrderStatus, ProductCategory } from '../types/shop';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const productCategories: { value: ProductCategory; label: string; icon: IconName }[] = [
  { value: 'WALK', label: '산책', icon: 'dog-side' },
  { value: 'FOOD', label: '사료', icon: 'food-drumstick-outline' },
  { value: 'SNACK', label: '간식', icon: 'bone' },
  { value: 'TOY', label: '장난감', icon: 'tennis-ball' },
  { value: 'HYGIENE', label: '위생', icon: 'shower-head' },
  { value: 'CLOTHING', label: '의류', icon: 'tshirt-crew-outline' },
  { value: 'ETC', label: '기타', icon: 'dots-horizontal-circle-outline' },
];

export function categoryIcon(category: ProductCategory): IconName {
  return productCategories.find((c) => c.value === category)?.icon ?? 'paw';
}

export function categoryLabel(category: ProductCategory) {
  return productCategories.find((c) => c.value === category)?.label ?? '기타';
}

export function formatWon(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`;
}

export const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  CANCELLED: '주문 취소',
};

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
