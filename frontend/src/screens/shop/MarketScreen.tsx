import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { shopService } from '../../api/shop/shopService';
import { Screen } from '../../components/Screen';
import { LoadState } from '../../components/shop/ShopParts';
import { useAsyncData } from '../../hooks/useAsyncData';
import { colors, radius, spacing, typography } from '../../theme';
import type { Product, ProductCategory } from '../../types/shop';
import { notify } from '../../utils/dialog';
import { productCategories } from '../../utils/shop';

// 쿠팡 제휴 마켓: 상품 사진을 누르면 쿠팡 파트너스 링크로 이동한다. 상품은 관리자 메뉴에서 등록한다.
export function MarketScreen() {
  const [category, setCategory] = useState<ProductCategory | undefined>();
  const products = useAsyncData(() => shopService.getProducts({ category, linkedOnly: true }), [category]);
  const items = products.data?.content ?? [];

  // 탭에 돌아올 때 새로 등록된 상품 반영 (첫 진입은 useAsyncData 가 처리)
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) products.reload();
      focusedOnce.current = true;
    }, [products.reload]),
  );

  return (
    <Screen title="마켓" subtitle="우리 강아지에게 필요한 것을 골라보세요.">
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="star-four-points" size={12} color={colors.orange} />
            <Text style={styles.heroBadgeText}>댕산책 PICK</Text>
          </View>
          <Text style={styles.heroTitle}>산책을 더{'\n'}즐겁게 만드는 아이템</Text>
          <Text style={styles.heroBody}>직접 고른 추천 상품을 한곳에서 만나보세요.</Text>
        </View>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="dog" size={64} color={colors.orange} />
          <MaterialCommunityIcons name="creation" size={20} color={colors.coral} style={styles.sparkle} />
        </View>
      </View>

      <View style={styles.partnerNotice}>
        <MaterialCommunityIcons name="information-outline" size={17} color={colors.forest} />
        <Text style={styles.partnerNoticeText}>이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</Text>
      </View>

      <View style={styles.categoryRow}>
        <CategoryChip label="전체" icon="view-grid-outline" active={!category} onPress={() => setCategory(undefined)} />
        {productCategories.map((c) => (
          <CategoryChip key={c.value} label={c.label} icon={c.icon} active={category === c.value} onPress={() => setCategory(c.value)} />
        ))}
      </View>

      <View>
        <Text style={styles.sectionTitle}>추천 상품</Text>
        {products.data ? <Text style={styles.sectionSubtitle}>{products.data.totalElements}개의 상품을 준비했어요</Text> : null}
      </View>

      {items.length > 0 && !products.error
        ? <View style={styles.productGrid}>{items.map((product) => <ProductCard key={product.id} product={product} />)}</View>
        : <LoadState loading={products.loading} error={products.error} empty emptyText="준비 중인 상품이에요." onRetry={products.reload} />}
    </Screen>
  );
}

function CategoryChip({ label, icon, active, onPress }: { label: string; icon: (typeof productCategories)[number]['icon']; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.category, pressed && styles.pressed]}>
      <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
        <MaterialCommunityIcons name={icon} size={20} color={active ? colors.white : colors.forest} />
      </View>
      <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ProductCard({ product }: { product: Product }) {
  const openProduct = () => {
    Linking.openURL(product.affiliateUrl!).catch(() => notify('쿠팡을 열지 못했어요', '잠시 후 다시 시도해 주세요.'));
  };

  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`${product.name} 쿠팡에서 보기`} onPress={openProduct} style={({ pressed }) => [styles.product, pressed && styles.pressed]}>
      <View style={styles.productImage}>
        {product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <MaterialCommunityIcons name="paw" size={40} color={colors.forest} />}
        <View style={styles.externalBadge}><MaterialCommunityIcons name="open-in-new" size={12} color={colors.white} /></View>
      </View>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      {product.description ? <Text style={styles.productDescription} numberOfLines={1}>{product.description}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderRadius: radius.xl, flexDirection: 'row', justifyContent: 'space-between', minHeight: 170, overflow: 'hidden', padding: spacing.lg },
  heroCopy: { flex: 1, gap: spacing.xs }, heroBadge: { alignItems: 'center', flexDirection: 'row', gap: 4 }, heroBadgeText: { color: colors.orange, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroTitle: { color: colors.ink, fontSize: 21, fontWeight: '800', lineHeight: 28, marginTop: 3 }, heroBody: { color: colors.inkSoft, ...typography.caption, marginTop: 3 }, heroIcon: { alignItems: 'center', height: 92, justifyContent: 'center', width: 86 }, sparkle: { position: 'absolute', right: 0, top: 3 },
  partnerNotice: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, partnerNoticeText: { color: colors.forestDeep, flex: 1, fontSize: 11, lineHeight: 16 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md }, category: { alignItems: 'center', gap: 5, width: '23%' }, categoryIcon: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 }, categoryIconActive: { backgroundColor: colors.forest, borderColor: colors.forest }, categoryText: { color: colors.inkSoft, ...typography.caption }, categoryTextActive: { color: colors.forest, fontWeight: '800' }, pressed: { opacity: 0.72 },
  sectionTitle: { color: colors.ink, ...typography.heading }, sectionSubtitle: { color: colors.inkSoft, ...typography.caption, marginTop: 2 }, productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }, product: { width: '47%' },
  productImage: { alignItems: 'center', backgroundColor: colors.ivorySoft, borderRadius: radius.lg, height: 145, justifyContent: 'center', overflow: 'hidden' }, externalBadge: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radius.pill, bottom: spacing.sm, height: 25, justifyContent: 'center', position: 'absolute', right: spacing.sm, width: 25 },
  productName: { color: colors.ink, ...typography.label, marginTop: spacing.sm }, productDescription: { color: colors.inkSoft, ...typography.caption, marginTop: 2 },
});
