import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { adminService } from '../../api/admin/adminService';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { FilterChips } from '../../components/FilterChips';
import { Screen } from '../../components/Screen';
import { LoadState } from '../../components/shop/ShopParts';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ProfileScreenProps } from '../../navigation/ProfileNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { Order, OrderStatus } from '../../types/shop';
import { notify } from '../../utils/dialog';
import { formatDateTime, formatWon, orderStatusLabel } from '../../utils/shop';
import { StatusBadge } from '../shop/OrderListScreen';

const filters: { value: OrderStatus | undefined; label: string }[] = [
  { value: 'PAID', label: '배송 준비중' },
  { value: 'SHIPPING', label: '배송중' },
  { value: 'DELIVERED', label: '배송 완료' },
  { value: undefined, label: '전체' },
];

export function AdminOrdersScreen({ navigation }: ProfileScreenProps<'AdminOrders'>) {
  const [status, setStatus] = useState<OrderStatus | undefined>('PAID');
  const orders = useAsyncData(() => adminService.getOrders(status), [status]);
  const items = orders.data?.content ?? [];

  // 상태가 바뀐 주문은 현재 필터에서 빠질 수 있어 목록을 다시 불러온다
  const update = async (order: Order, next: 'SHIPPING' | 'DELIVERED', courier?: string, trackingNumber?: string) => {
    try {
      await adminService.updateShipping(order.orderNo, next, courier, trackingNumber);
      notify(`${orderStatusLabel[next]} 처리했어요`);
      await orders.reload();
    } catch (e) {
      notify('처리하지 못했어요', e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <Screen title="주문·배송 관리" onBack={navigation.goBack}>
      <FilterChips options={filters} value={status} onChange={setStatus} />
      {items.length > 0 && !orders.error
        ? items.map((order) => <OrderCard key={order.orderNo} order={order} onUpdate={update} />)
        : <LoadState loading={orders.loading} error={orders.error} empty emptyText="해당하는 주문이 없어요." onRetry={orders.reload} />}
    </Screen>
  );
}

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: (order: Order, next: 'SHIPPING' | 'DELIVERED', courier?: string, trackingNumber?: string) => Promise<void> }) {
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (next: 'SHIPPING' | 'DELIVERED') => {
    setBusy(true);
    await onUpdate(order, next, courier.trim() || undefined, trackingNumber.trim() || undefined);
    setBusy(false);
  };

  return (
    <AppCard>
      <View style={styles.head}>
        <Text style={styles.orderNo} numberOfLines={1}>{order.orderNo}</Text>
        <StatusBadge status={order.status} />
      </View>
      <Text style={styles.name}>{order.orderName}</Text>
      <Text style={styles.meta}>{formatWon(order.totalAmount)} · {formatDateTime(order.createdAt)}</Text>
      <Text style={styles.address}>{order.receiverName} · {order.receiverPhone}{`\n`}({order.zipCode}) {order.address} {order.addressDetail ?? ''}</Text>
      {order.deliveryMemo ? <Text style={styles.meta}>배송 메모: {order.deliveryMemo}</Text> : null}
      {order.trackingNumber ? <Text style={styles.meta}>송장: {[order.courier, order.trackingNumber].filter(Boolean).join(' ')}</Text> : null}
      {order.status === 'PAID' ? (
        <View style={styles.form}>
          <View style={styles.pair}>
            <TextInput maxLength={50} onChangeText={setCourier} placeholder="택배사 (선택)" placeholderTextColor={colors.inkFaint} style={styles.input} value={courier} />
            <TextInput maxLength={50} onChangeText={setTrackingNumber} placeholder="송장번호 (선택)" placeholderTextColor={colors.inkFaint} style={styles.input} value={trackingNumber} />
          </View>
          <AppButton disabled={busy} label="발송 처리" variant="secondary" onPress={() => run('SHIPPING')} />
        </View>
      ) : order.status === 'SHIPPING' ? (
        <View style={styles.form}><AppButton disabled={busy} label="배송 완료 처리" onPress={() => run('DELIVERED')} /></View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  orderNo: { color: colors.inkFaint, flex: 1, ...typography.caption },
  name: { color: colors.ink, marginTop: spacing.xs, ...typography.body, fontWeight: '700' },
  meta: { color: colors.inkFaint, marginTop: 2, ...typography.caption },
  address: { color: colors.inkSoft, marginTop: spacing.sm, ...typography.caption },
  form: { gap: spacing.sm, marginTop: spacing.md },
  pair: { flexDirection: 'row', gap: spacing.sm },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, flex: 1, minHeight: 44, paddingHorizontal: spacing.md, ...typography.body },
});
