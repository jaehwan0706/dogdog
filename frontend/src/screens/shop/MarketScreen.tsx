import { useCallback, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { CartButton, LoadState, ProductThumb } from '../../components/shop/ShopParts';
import { isMockShop, shopService } from '../../api/shop/shopService';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useMainDog } from '../../store/dogStore';
import type { ShopScreenProps } from '../../navigation/ShopNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { Product, ProductCategory } from '../../types/shop';
import { formatWon, productCategories } from '../../utils/shop';

export function MarketScreen({ navigation }: ShopScreenProps<'MarketHome'>) {
  const dogName = useMainDog()?.name ?? '우리 아이';
  const [category, setCategory] = useState<ProductCategory | undefined>();
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const products = useAsyncData(() => shopService.getProducts({ category, keyword }), [category, keyword]);

  // 상세/장바구니에서 돌아올 때 배지·재고 갱신
  useFocusEffect(
    useCallback(() => {
      shopService.getCart().then((cart) => setCartCount(cart.items.length)).catch(() => {});
    }, []),
  );

  const items = products.data?.content ?? [];

  return (
    <Screen
      title="댕마켓"
      subtitle={`${dogName}에게 꼭 맞는 산책 아이템을 찾아보세요.`}
      headerRight={<CartButton count={cartCount} onPress={() => navigation.navigate('Cart')} />}
    >
      {isMockShop ? <Text style={styles.mockNotice}>테스트 모드 · 실제 결제가 되지 않아요</Text> : null}
      <View style={styles.banner}>
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerEyebrow}>AUTUMN WALK</Text>
          <Text style={styles.bannerTitle}>가을 산책을 위한{`\n`}필수 아이템</Text>
          <Text style={styles.bannerBody}>따뜻하고 안전한 산책 준비</Text>
        </View>
        <MaterialCommunityIcons name="dog" size={72} color={colors.orange} />
      </View>

      <View style={styles.search}>
        <MaterialCommunityIcons name="magnify" size={19} color={colors.inkSoft} />
        <TextInput
          style={styles.searchInput}
          placeholder="상품을 검색해보세요"
          placeholderTextColor={colors.inkFaint}
          returnKeyType="search"
          value={keywordInput}
          onChangeText={setKeywordInput}
          onSubmitEditing={() => setKeyword(keywordInput.trim())}
        />
        {keyword ? (
          <Pressable accessibilityLabel="검색어 지우기" hitSlop={8} onPress={() => { setKeywordInput(''); setKeyword(''); }}>
            <MaterialCommunityIcons name="close-circle" size={17} color={colors.inkFaint} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.categories}>
        <CategoryChip label="전체" icon="view-grid-outline" active={!category} onPress={() => setCategory(undefined)} />
        {productCategories.map((c) => (
          <CategoryChip key={c.value} label={c.label} icon={c.icon} active={category === c.value} onPress={() => setCategory(c.value)} />
        ))}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{keyword ? `'${keyword}' 검색 결과` : `${dogName}에게 딱 맞아요`}</Text>
        <Text style={styles.count}>{products.data ? `${products.data.totalElements}개` : ''}</Text>
      </View>

      <LoadState
        loading={products.loading}
        error={products.error}
        empty={items.length === 0}
        emptyText="조건에 맞는 상품이 없어요."
        onRetry={products.reload}
      />
      {!products.loading && !products.error ? (
        <View style={styles.products}>
          {items.map((product) => (
            <ProductCard key={product.id} product={product} onPress={() => navigation.navigate('ProductDetail', { productId: product.id })} />
          ))}
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('OrderList')}>
        <AppCard>
          <View style={styles.notice}>
            <MaterialCommunityIcons name="truck-fast-outline" size={24} color={colors.forest} />
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>주문 내역</Text>
              <Text style={styles.noticeBody}>결제한 상품과 배송 정보를 확인해요.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={21} color={colors.inkFaint} />
          </View>
        </AppCard>
      </Pressable>
    </Screen>
  );
}

function CategoryChip({ label, icon, active, onPress }: { label: string; icon: (typeof productCategories)[number]['icon']; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={styles.category}>
      <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
        <MaterialCommunityIcons name={icon} size={21} color={active ? colors.white : colors.forest} />
      </View>
      <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.product}>
      <ProductThumb imageUrl={product.imageUrl} category={product.category} size={130} />
      {product.soldOut ? (
        <View style={styles.soldOut}>
          <Text style={styles.soldOutText}>품절</Text>
        </View>
      ) : null}
      <Text style={styles.productTitle} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.productPrice}>{formatWon(product.price)}</Text>
      {!product.soldOut && product.stock <= 5 ? <Text style={styles.lowStock}>{product.stock}개 남음</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mockNotice: { alignSelf: 'flex-start', backgroundColor: colors.sky, borderRadius: radius.pill, color: colors.forest, overflow: 'hidden', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, ...typography.caption, fontWeight: '700' },
  banner: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderRadius: radius.lg, flexDirection: 'row', justifyContent: 'space-between', minHeight: 150, overflow: 'hidden', padding: spacing.lg },
  bannerCopy: { gap: 4 },
  bannerEyebrow: { color: colors.orange, ...typography.caption, fontWeight: '700' },
  bannerTitle: { color: colors.ink, ...typography.heading },
  bannerBody: { color: colors.inkSoft, ...typography.caption },
  search: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md },
  searchInput: { color: colors.ink, flex: 1, paddingVertical: spacing.md, ...typography.body },
  categories: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md },
  category: { alignItems: 'center', gap: 5, width: '23%' },
  categoryIcon: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: 99, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  categoryIconActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  categoryText: { color: colors.inkSoft, ...typography.caption },
  categoryTextActive: { color: colors.forest, fontWeight: '700' },
  sectionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: colors.ink, ...typography.heading },
  count: { color: colors.inkFaint, ...typography.label },
  products: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.lg },
  product: { width: '48%' },
  soldOut: { alignItems: 'center', backgroundColor: 'rgba(42,42,32,0.45)', borderRadius: radius.md, height: 130, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 },
  soldOutText: { color: colors.white, ...typography.heading },
  productTitle: { color: colors.ink, marginTop: spacing.sm, ...typography.label },
  productPrice: { color: colors.ink, fontWeight: '800', marginTop: 3 },
  lowStock: { color: colors.coral, marginTop: 2, ...typography.caption },
  notice: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  noticeCopy: { flex: 1 },
  noticeTitle: { color: colors.ink, ...typography.label },
  noticeBody: { color: colors.inkSoft, marginTop: 2, ...typography.caption },
});
