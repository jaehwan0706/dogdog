import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { LoadState, SummaryRow } from '../../components/shop/ShopParts';
import { shopService } from '../../api/shop/shopService';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ShopScreenProps } from '../../navigation/ShopNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { OrderCreateRequest, ShippingInfo } from '../../types/shop';
import { notify } from '../../utils/dialog';
import { formatWon } from '../../utils/shop';

type Line = { key: string; name: string; quantity: number; amount: number };

// 백엔드 OrderCreateRequest 검증 규칙과 동일하게 미리 확인
function validate(form: ShippingInfo): string | null {
  if (!form.receiverName.trim()) return '받는 분 이름을 입력해 주세요.';
  if (!/^[0-9-]{9,20}$/.test(form.receiverPhone.trim())) return '연락처 형식이 올바르지 않습니다.';
  if (!form.zipCode.trim()) return '우편번호를 입력해 주세요.';
  if (!form.address.trim()) return '주소를 입력해 주세요.';
  return null;
}

export function CheckoutScreen({ navigation, route }: ShopScreenProps<'Checkout'>) {
  const params = route.params;
  const [form, setForm] = useState<ShippingInfo>({ receiverName: '', receiverPhone: '', zipCode: '', address: '', addressDetail: '', deliveryMemo: '' });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 주문 요약은 서버 기준 가격으로 표시 (최종 금액은 주문 생성 응답의 totalAmount)
  const lines = useAsyncData<Line[]>(async () => {
    if ('cartItemIds' in params) {
      const cart = await shopService.getCart();
      return cart.items
        .filter((item) => params.cartItemIds.includes(item.cartItemId))
        .map((item) => ({ key: `c${item.cartItemId}`, name: item.productName, quantity: item.quantity, amount: item.lineAmount }));
    }
    return Promise.all(
      params.items.map(async ({ productId, quantity }) => {
        const product = await shopService.getProduct(productId);
        return { key: `p${productId}`, name: product.name, quantity, amount: product.price * quantity };
      }),
    );
  }, [params]);

  const total = lines.data?.reduce((sum, line) => sum + line.amount, 0) ?? 0;
  const set = (field: keyof ShippingInfo) => (value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async () => {
    const message = validate(form);
    if (message) {
      notify('배송 정보를 확인해 주세요', message);
      return;
    }
    const shipping: ShippingInfo = {
      receiverName: form.receiverName.trim(),
      receiverPhone: form.receiverPhone.trim(),
      zipCode: form.zipCode.trim(),
      address: form.address.trim(),
      addressDetail: form.addressDetail?.trim() || undefined,
      deliveryMemo: form.deliveryMemo?.trim() || undefined,
    };
    const request: OrderCreateRequest = 'cartItemIds' in params ? { ...shipping, cartItemIds: params.cartItemIds } : { ...shipping, items: params.items };

    setSubmitting(true);
    try {
      // 주문 생성 시 서버에서 재고가 확보된다 → 결제 화면으로 교체(뒤로가기로 주문서 재제출 방지)
      const order = await shopService.createOrder(request);
      navigation.replace('Payment', { orderNo: order.orderNo });
    } catch (e) {
      notify('주문하지 못했어요', e instanceof Error ? e.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title="주문서" onBack={() => navigation.goBack()}>
      <Text style={styles.sectionTitle}>주문 상품</Text>
      <LoadState loading={lines.loading} error={lines.error} onRetry={lines.reload} />
      {lines.data ? (
        <AppCard>
          <View style={styles.lines}>
            {lines.data.map((line) => (
              <SummaryRow key={line.key} label={`${line.name} × ${line.quantity}`} value={formatWon(line.amount)} />
            ))}
          </View>
        </AppCard>
      ) : null}

      <Text style={styles.sectionTitle}>배송 정보</Text>
      <Field label="받는 분" value={form.receiverName} onChangeText={set('receiverName')} maxLength={50} />
      <Field label="연락처" value={form.receiverPhone} onChangeText={set('receiverPhone')} keyboardType="phone-pad" placeholder="010-1234-5678" maxLength={20} />
      <Field label="우편번호" value={form.zipCode} onChangeText={set('zipCode')} keyboardType="number-pad" maxLength={10} />
      <Field label="주소" value={form.address} onChangeText={set('address')} maxLength={200} />
      <Field label="상세 주소 (선택)" value={form.addressDetail} onChangeText={set('addressDetail')} maxLength={200} />
      <Field label="배송 메모 (선택)" value={form.deliveryMemo} onChangeText={set('deliveryMemo')} placeholder="문 앞에 놓아주세요" maxLength={200} />

      <Text style={styles.sectionTitle}>결제</Text>
      <AppCard>
        <View style={styles.lines}>
          <SummaryRow label="상품 금액" value={formatWon(total)} />
          <SummaryRow label="배송비" value="무료" />
          <SummaryRow label="최종 결제 금액" value={formatWon(total)} strong />
          <Text style={styles.caption}>카드·간편결제는 토스페이먼츠 결제창에서 진행돼요. 카드 정보는 댕산책 서버에 저장되지 않아요.</Text>
        </View>
      </AppCard>

      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agreed }} onPress={() => setAgreed((v) => !v)} style={styles.agree}>
        <MaterialCommunityIcons name={agreed ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={agreed ? colors.forest : colors.inkFaint} />
        <Text style={styles.agreeText}>주문 내용을 확인했으며 결제에 동의합니다.</Text>
      </Pressable>

      <AppButton
        label={submitting ? '주문 생성 중…' : `${formatWon(total)} 결제하기`}
        disabled={!agreed || submitting || !lines.data?.length}
        onPress={submit}
      />
    </Screen>
  );
}

function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.inkFaint} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: colors.ink, ...typography.heading },
  lines: { gap: spacing.sm },
  field: { gap: spacing.xs },
  fieldLabel: { color: colors.inkSoft, ...typography.label },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: spacing.md, ...typography.body },
  caption: { color: colors.inkFaint, marginTop: spacing.xs, ...typography.caption },
  agree: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  agreeText: { color: colors.ink, flex: 1, ...typography.body },
});
