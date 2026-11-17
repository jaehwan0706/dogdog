import { useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { LoadState } from '../../components/shop/ShopParts';
import { shopService } from '../../api/shop/shopService';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ShopScreenProps } from '../../navigation/ShopNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { OrderStatus } from '../../types/shop';
import { formatDateTime, formatWon, orderStatusLabel } from '../../utils/shop';

export function OrderListScreen({ navigation }: ShopScreenProps<'OrderList'>) {
  const { data, loading, error, reload } = useAsyncData(() => shopService.getOrders(), []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return (
    <Screen title="주문 내역" onBack={() => navigation.goBack()}>
      <LoadState loading={loading && !data} error={data ? null : error} empty={data?.content.length === 0} emptyText="아직 주문한 상품이 없어요." onRetry={reload} />
      {data?.content.map((order) => (
        <Pressable key={order.orderNo} accessibilityRole="button" onPress={() => navigation.navigate('OrderDetail', { orderNo: order.orderNo })}>
          <AppCard>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text style={styles.date}>{formatDateTime(order.createdAt)}</Text>
                <Text style={styles.name} numberOfLines={1}>{order.orderName}</Text>
                <Text style={styles.amount}>{formatWon(order.totalAmount)}</Text>
              </View>
              <StatusBadge status={order.status} />
              <MaterialCommunityIcons name="chevron-right" size={21} color={colors.inkFaint} />
            </View>
          </AppCard>
        </Pressable>
      ))}
    </Screen>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = { PENDING_PAYMENT: styles.pending, PAID: styles.paid, SHIPPING: styles.paid, DELIVERED: styles.paid, CANCELLED: styles.cancelled }[status];
  return <Text style={[styles.badge, tone]}>{orderStatusLabel[status]}</Text>;
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  copy: { flex: 1, gap: 2 },
  date: { color: colors.inkFaint, ...typography.caption },
  name: { color: colors.ink, ...typography.body, fontWeight: '600' },
  amount: { color: colors.ink, ...typography.body, fontWeight: '800' },
  badge: { borderRadius: radius.pill, overflow: 'hidden', paddingHorizontal: spacing.sm, paddingVertical: 2, ...typography.caption, fontWeight: '700' },
  pending: { backgroundColor: colors.orangeSoft, color: colors.ink },
  paid: { backgroundColor: colors.forestSoft, color: colors.forest },
  cancelled: { backgroundColor: colors.ivorySoft, color: colors.inkFaint },
});
