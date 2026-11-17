import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { LoadState, SummaryRow } from '../../components/shop/ShopParts';
import { shopService } from '../../api/shop/shopService';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ShopScreenProps } from '../../navigation/ShopNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import { confirmAction, notify } from '../../utils/dialog';
import { formatWon } from '../../utils/shop';

// 결제 흐름: 주문 생성(PENDING_PAYMENT) → PG 결제창 → paymentKey 로 서버 승인(confirm) → PAID
// TODO(토스 연동): 아래 테스트 결제창을 토스페이먼츠 결제위젯(WebView)으로 교체하고,
//   successUrl 로 받은 paymentKey 를 그대로 confirmPayment 에 넘기면 된다. 서버 쪽은 PAYMENT_MODE=toss 로 전환.
//   지금은 백엔드 PAYMENT_MODE=mock / 프론트 mock 서비스 모두 "fail" 로 시작하는 키를 실패로 처리한다.
const methods = [
  { key: 'CARD', label: '신용·체크카드', icon: 'credit-card-outline' },
  { key: 'TOSSPAY', label: '토스페이', icon: 'wallet-outline' },
  { key: 'TRANSFER', label: '계좌이체', icon: 'bank-outline' },
] as const;

export function PaymentScreen({ navigation, route }: ShopScreenProps<'Payment'>) {
  const { orderNo } = route.params;
  const { data: order, loading, error, reload } = useAsyncData(() => shopService.getOrder(orderNo), [orderNo]);
  const [method, setMethod] = useState<(typeof methods)[number]['key']>('CARD');
  const [processing, setProcessing] = useState(false);

  const pay = async (simulateFailure: boolean) => {
    if (!order) return;
    setProcessing(true);
    try {
      const paymentKey = `${simulateFailure ? 'fail' : 'test'}_${method}_${Date.now()}`;
      await shopService.confirmPayment(orderNo, paymentKey, order.totalAmount);
      navigation.replace('OrderDetail', { orderNo, justPaid: true });
    } catch (e) {
      // 승인 실패 시 주문은 결제 대기 상태로 남아 있어 다시 시도할 수 있다
      notify('결제에 실패했어요', `${e instanceof Error ? e.message : ''}\n다시 시도하거나 주문을 취소할 수 있어요.`);
    } finally {
      setProcessing(false);
    }
  };

  const cancel = () => {
    confirmAction({
      title: '결제를 취소할까요?',
      message: '주문이 취소되고 상품 재고가 복구돼요.',
      confirmText: '주문 취소',
      cancelText: '계속 결제',
      destructive: true,
      onConfirm: async () => {
        try {
          await shopService.cancelOrder(orderNo, '결제 전 구매자 취소');
        } catch {
          // 이미 만료·취소된 주문이어도 화면은 닫는다
        }
        navigation.popToTop();
      },
    });
  };

  return (
    <Screen title="결제" onBack={cancel}>
      <LoadState loading={loading} error={error} onRetry={reload} />
      {order ? (
        <>
          <AppCard>
            <View style={styles.summary}>
              <Text style={styles.orderName}>{order.orderName}</Text>
              <Text style={styles.orderNo}>주문번호 {order.orderNo}</Text>
              <SummaryRow label="결제 금액" value={formatWon(order.totalAmount)} strong />
            </View>
          </AppCard>

          <Text style={styles.sectionTitle}>결제 수단</Text>
          <View style={styles.methods}>
            {methods.map((m) => (
              <Pressable
                key={m.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: method === m.key }}
                onPress={() => setMethod(m.key)}
                style={[styles.method, method === m.key && styles.methodActive]}
              >
                <MaterialCommunityIcons name={m.icon} size={22} color={method === m.key ? colors.forest : colors.inkSoft} />
                <Text style={[styles.methodLabel, method === m.key && styles.methodLabelActive]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.testNotice}>
            <MaterialCommunityIcons name="flask-outline" size={18} color={colors.forest} />
            <Text style={styles.testText}>토스페이먼츠 연동 전 테스트 결제창이에요. 실제로 결제되지 않아요.</Text>
          </View>

          <AppButton label={processing ? '결제 승인 중…' : `${formatWon(order.totalAmount)} 결제 승인`} disabled={processing || order.status !== 'PENDING_PAYMENT'} onPress={() => pay(false)} />
          <AppButton label="결제 실패 테스트" variant="ghost" disabled={processing || order.status !== 'PENDING_PAYMENT'} onPress={() => pay(true)} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.sm },
  orderName: { color: colors.ink, ...typography.heading },
  orderNo: { color: colors.inkFaint, ...typography.caption },
  sectionTitle: { color: colors.ink, ...typography.heading },
  methods: { flexDirection: 'row', gap: spacing.sm },
  method: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flex: 1, gap: spacing.xs, paddingVertical: spacing.md },
  methodActive: { backgroundColor: colors.forestSoft, borderColor: colors.forest },
  methodLabel: { color: colors.inkSoft, ...typography.label },
  methodLabelActive: { color: colors.forest },
  testNotice: { alignItems: 'center', backgroundColor: colors.sky, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  testText: { color: colors.forest, flex: 1, ...typography.caption },
});
