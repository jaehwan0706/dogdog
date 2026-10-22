import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { LoadState, SummaryRow } from '../../components/shop/ShopParts';
import { shopService } from '../../api/shop/shopService';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ShopScreenProps } from '../../navigation/ShopNavigator';
import { colors, spacing, typography } from '../../theme';
import { confirmAction, notify } from '../../utils/dialog';
import { formatDateTime, formatWon } from '../../utils/shop';
import { StatusBadge } from './OrderListScreen';

export function OrderDetailScreen({ navigation, route }: ShopScreenProps<'OrderDetail'>) {
  const { orderNo, justPaid = false } = route.params;
  const { data: order, setData, loading, error, reload } = useAsyncData(() => shopService.getOrder(orderNo), [orderNo]);
  const [cancelling, setCancelling] = useState(false);

  const cancel = () => {
    confirmAction({
      title: '주문을 취소할까요?',
      message: order?.status === 'PAID' ? '결제가 취소되고 환불돼요.' : undefined,
      confirmText: '주문 취소',
      destructive: true,
      onConfirm: async () => {
        setCancelling(true);
        try {
          setData(await shopService.cancelOrder(orderNo));
        } catch (e) {
          notify('취소하지 못했어요', e instanceof Error ? e.message : undefined);
        } finally {
          setCancelling(false);
        }
      },
    });
  };

  return (
    // 결제 직후엔 뒤로가기 대신 마켓 홈으로
    <Screen title={justPaid ? '주문 완료' : '주문 상세'} onBack={justPaid ? () => navigation.popToTop() : () => navigation.goBack()}>
      <LoadState loading={loading} error={error} onRetry={reload} />
      {order ? (
        <>
          {justPaid && order.status === 'PAID' ? (
            <View style={styles.done}>
              <MaterialCommunityIcons name="check-circle" size={52} color={colors.forest} />
              <Text style={styles.doneTitle}>결제가 완료됐어요</Text>
              <Text style={styles.doneBody}>보리와의 산책이 더 즐거워질 거예요 🐾</Text>
            </View>
          ) : null}

          <AppCard>
            <View style={styles.section}>
              <View style={styles.headRow}>
                <Text style={styles.orderNo}>주문번호 {order.orderNo}</Text>
                <StatusBadge status={order.status} />
              </View>
              {order.items.map((item) => (
                <SummaryRow key={item.productId} label={`${item.productName} × ${item.quantity}`} value={formatWon(item.lineAmount)} />
              ))}
              <View style={styles.divider} />
              <SummaryRow label="결제 금액" value={formatWon(order.totalAmount)} strong />
              {order.paidAt ? <SummaryRow label="결제 일시" value={formatDateTime(order.paidAt)} /> : null}
              {order.cancelledAt ? <SummaryRow label="취소 일시" value={formatDateTime(order.cancelledAt)} /> : null}
              {order.cancelReason ? <SummaryRow label="취소 사유" value={order.cancelReason} /> : null}
            </View>
          </AppCard>

          <AppCard>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>배송 정보</Text>
              <Text style={styles.body}>{order.receiverName} · {order.receiverPhone}</Text>
              <Text style={styles.body}>
                ({order.zipCode}) {order.address} {order.addressDetail ?? ''}
              </Text>
              {order.deliveryMemo ? <Text style={styles.memo}>{order.deliveryMemo}</Text> : null}
            </View>
          </AppCard>

          {justPaid ? <AppButton label="쇼핑 계속하기" onPress={() => navigation.popToTop()} /> : null}
          {order.status !== 'CANCELLED' ? (
            <AppButton label={cancelling ? '취소 중…' : '주문 취소'} variant="ghost" disabled={cancelling} onPress={cancel} />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  done: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  doneTitle: { color: colors.ink, ...typography.title },
  doneBody: { color: colors.inkSoft, ...typography.body },
  section: { gap: spacing.sm },
  headRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  orderNo: { color: colors.inkFaint, ...typography.caption },
  divider: { backgroundColor: colors.line, height: 1 },
  sectionTitle: { color: colors.ink, ...typography.heading },
  body: { color: colors.ink, ...typography.body },
  memo: { color: colors.inkSoft, ...typography.caption },
});
