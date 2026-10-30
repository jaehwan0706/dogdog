import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { adminService } from '../../api/admin/adminService';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { FilterChips } from '../../components/FilterChips';
import { Screen } from '../../components/Screen';
import { LoadState, ProductThumb } from '../../components/shop/ShopParts';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ProfileScreenProps } from '../../navigation/ProfileNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { ProductStatus } from '../../types/shop';
import { categoryLabel, formatWon } from '../../utils/shop';

const filters: { value: ProductStatus | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: 'ON_SALE', label: '판매중' },
  { value: 'HIDDEN', label: '판매중지' },
];

export function AdminProductsScreen({ navigation }: ProfileScreenProps<'AdminProducts'>) {
  const [status, setStatus] = useState<ProductStatus | undefined>();
  const products = useAsyncData(() => adminService.getProducts({ status }), [status]);
  const items = products.data?.content ?? [];

  // 등록·수정 화면에서 돌아오면 목록 갱신 (첫 진입은 useAsyncData 가 처리)
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) products.reload();
      focusedOnce.current = true;
    }, [products.reload]),
  );

  return (
    <Screen title="상품 관리" onBack={navigation.goBack}>
      <AppButton label="+ 상품 등록" onPress={() => navigation.navigate('AdminProductEdit', {})} />
      <FilterChips options={filters} value={status} onChange={setStatus} />
      {items.length > 0 && !products.error
        ? items.map((product) => (
            <Pressable key={product.id} accessibilityRole="button" accessibilityLabel={`${product.name} 수정`} onPress={() => navigation.navigate('AdminProductEdit', { productId: product.id })}>
              <AppCard>
                <View style={styles.row}>
                  <View style={styles.thumb}><ProductThumb imageUrl={product.imageUrl} category={product.category} size={56} /></View>
                  <View style={styles.flex}>
                    <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
                    <Text style={styles.meta}>{categoryLabel(product.category)} · {formatWon(product.price)} · 재고 {product.stock}</Text>
                  </View>
                  <Text style={[styles.badge, product.status === 'HIDDEN' && styles.badgeHidden]}>{product.status === 'ON_SALE' ? (product.soldOut ? '품절' : '판매중') : '판매중지'}</Text>
                </View>
              </AppCard>
            </Pressable>
          ))
        : <LoadState loading={products.loading} error={products.error} empty emptyText="등록된 상품이 없어요." onRetry={products.reload} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  thumb: { borderRadius: radius.md, overflow: 'hidden', width: 56 },
  flex: { flex: 1 },
  name: { color: colors.ink, ...typography.body, fontWeight: '700' },
  meta: { color: colors.inkFaint, marginTop: 2, ...typography.caption },
  badge: { backgroundColor: colors.forestSoft, borderRadius: radius.pill, color: colors.forest, overflow: 'hidden', paddingHorizontal: spacing.sm, paddingVertical: 2, ...typography.caption, fontWeight: '700' },
  badgeHidden: { backgroundColor: colors.ivorySoft, color: colors.inkFaint },
});
