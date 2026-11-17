import { useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { LoadState, QuantityStepper, SummaryRow } from '../../components/shop/ShopParts';
import { shopService } from '../../api/shop/shopService';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ShopScreenProps } from '../../navigation/ShopNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import { MAX_CART_QUANTITY, type Cart, type CartItem } from '../../types/shop';
import { notify } from '../../utils/dialog';
import { formatWon } from '../../utils/shop';

export function CartScreen({ navigation }: ShopScreenProps<'Cart'>) {
  const { data: cart, setData, loading, error, reload } = useAsyncData(() => shopService.getCart(), []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // 서버 응답 장바구니로 바로 교체 (합계·구매가능 여부는 서버 기준)
  const update = async (request: Promise<Cart>) => {
    try {
      setData(await request);
    } catch (e) {
      notify('변경하지 못했어요', e instanceof Error ? e.message : undefined);
    }
  };

  const availableIds = cart?.items.filter((item) => item.available).map((item) => item.cartItemId) ?? [];
  const hasUnavailable = !!cart && availableIds.length < cart.items.length;

  return (
    <Screen title="장바구니" onBack={() => navigation.goBack()}>
      <LoadState
        loading={loading && !cart}
        error={cart ? null : error}
        empty={cart?.items.length === 0}
        emptyText="장바구니가 비어 있어요."
        onRetry={reload}
      />
      {cart?.items.map((item) => (
        <CartRow
          key={item.cartItemId}
          item={item}
          onChangeQuantity={(quantity) => update(shopService.changeCartQuantity(item.cartItemId, quantity))}
          onRemove={() => update(shopService.removeCartItem(item.cartItemId))}
        />
      ))}
      {cart && cart.items.length > 0 ? (
        <>
          {hasUnavailable ? <Text style={styles.warning}>품절·재고 부족 상품은 주문에서 제외돼요.</Text> : null}
          <AppCard>
            <View style={styles.summary}>
              <SummaryRow label="상품 수량" value={`${cart.totalQuantity}개`} />
              <SummaryRow label="배송비" value="무료" />
              <SummaryRow label="결제 예정 금액" value={formatWon(cart.totalAmount)} strong />
            </View>
          </AppCard>
          <AppButton
            label={`${formatWon(cart.totalAmount)} 주문하기`}
            disabled={availableIds.length === 0}
            onPress={() => navigation.navigate('Checkout', { cartItemIds: availableIds })}
          />
        </>
      ) : null}
    </Screen>
  );
}

function CartRow({ item, onChangeQuantity, onRemove }: { item: CartItem; onChangeQuantity: (quantity: number) => void; onRemove: () => void }) {
  return (
    <AppCard>
      <View style={styles.row}>
        <View style={styles.rowCopy}>
          <Text style={[styles.name, !item.available && styles.unavailable]} numberOfLines={2}>{item.productName}</Text>
          <Text style={styles.unitPrice}>{formatWon(item.price)}</Text>
          {!item.available ? <Text style={styles.warning}>{item.stock === 0 ? '품절' : `재고 ${item.stock}개`}</Text> : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="삭제" hitSlop={8} onPress={onRemove}>
          <MaterialCommunityIcons name="close" size={20} color={colors.inkFaint} />
        </Pressable>
      </View>
      <View style={styles.rowFooter}>
        <QuantityStepper value={item.quantity} max={MAX_CART_QUANTITY} onChange={onChangeQuantity} />
        <Text style={styles.lineAmount}>{formatWon(item.lineAmount)}</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  rowCopy: { flex: 1, gap: 2 },
  name: { color: colors.ink, ...typography.body, fontWeight: '600' },
  unavailable: { color: colors.inkFaint, textDecorationLine: 'line-through' },
  unitPrice: { color: colors.inkSoft, ...typography.caption },
  rowFooter: { alignItems: 'center', borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md },
  lineAmount: { color: colors.ink, ...typography.body, fontWeight: '800' },
  warning: { backgroundColor: colors.orangeSoft, borderRadius: radius.sm, color: colors.danger, overflow: 'hidden', paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: 'flex-start', ...typography.caption },
  summary: { gap: spacing.sm },
});
