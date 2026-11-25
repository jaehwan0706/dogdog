import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { LoadState, ProductThumb, QuantityStepper } from '../../components/shop/ShopParts';
import { shopService } from '../../api/shop/shopService';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ShopScreenProps } from '../../navigation/ShopNavigator';
import { colors, spacing, typography } from '../../theme';
import { MAX_CART_QUANTITY } from '../../types/shop';
import { confirmAction, notify } from '../../utils/dialog';
import { categoryLabel, formatWon } from '../../utils/shop';

export function ProductDetailScreen({ navigation, route }: ShopScreenProps<'ProductDetail'>) {
  const { productId } = route.params;
  const { data: product, loading, error, reload } = useAsyncData(() => shopService.getProduct(productId), [productId]);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const addToCart = async () => {
    setAdding(true);
    try {
      await shopService.addToCart(productId, quantity);
      confirmAction({ title: '장바구니에 담았어요', message: '장바구니로 이동할까요?', confirmText: '장바구니 보기', cancelText: '계속 쇼핑', onConfirm: () => navigation.navigate('Cart') });
    } catch (e) {
      notify('담지 못했어요', e instanceof Error ? e.message : undefined);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Screen title="상품 상세" onBack={() => navigation.goBack()}>
      <LoadState loading={loading} error={error} onRetry={reload} />
      {product ? (
        <>
          <ProductThumb imageUrl={product.imageUrl} category={product.category} size={260} />
          <View style={styles.info}>
            <Text style={styles.category}>{categoryLabel(product.category)}</Text>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>{formatWon(product.price)}</Text>
            <Text style={[styles.stock, product.soldOut && styles.soldOut]}>
              {product.soldOut ? '품절' : product.stock <= 5 ? `재고 ${product.stock}개 남음` : '구매 가능'}
            </Text>
          </View>
          {product.description ? (
            <AppCard>
              <Text style={styles.description}>{product.description}</Text>
            </AppCard>
          ) : null}
          {!product.soldOut ? (
            <>
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>수량</Text>
                <QuantityStepper value={quantity} max={Math.min(product.stock, MAX_CART_QUANTITY)} onChange={setQuantity} />
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.quantityLabel}>총 상품 금액</Text>
                <Text style={styles.total}>{formatWon(product.price * quantity)}</Text>
              </View>
              <View style={styles.actions}>
                <View style={styles.action}>
                  <AppButton label="장바구니" variant="ghost" disabled={adding} onPress={addToCart} />
                </View>
                <View style={styles.action}>
                  <AppButton label="바로 구매" onPress={() => navigation.navigate('Checkout', { items: [{ productId, quantity }] })} />
                </View>
              </View>
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  info: { gap: spacing.xs },
  category: { color: colors.forest, ...typography.label },
  name: { color: colors.ink, ...typography.title },
  price: { color: colors.ink, ...typography.heading, fontWeight: '800' },
  stock: { color: colors.success, ...typography.label },
  soldOut: { color: colors.danger },
  description: { color: colors.inkSoft, ...typography.body },
  quantityRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  quantityLabel: { color: colors.ink, ...typography.body, fontWeight: '600' },
  totalRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  total: { color: colors.forest, ...typography.heading, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
});
