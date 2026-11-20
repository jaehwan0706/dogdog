import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { isMockShop, shopService } from '../../api/shop/shopService';
import { Screen } from '../../components/Screen';
import { LoadState } from '../../components/shop/ShopParts';
import { useAsyncData } from '../../hooks/useAsyncData';
import { colors, radius, spacing, typography } from '../../theme';
import type { Product, ProductCategory } from '../../types/shop';
import { confirmAction, notify } from '../../utils/dialog';
import { categoryIcon, categoryLabel, productCategories } from '../../utils/shop';

// 쿠팡 제휴 마켓: 상품 사진을 누르면 쿠팡 파트너스 링크로 이동한다. 상품은 관리자 메뉴에서 등록한다.
export function MarketScreen() {
  const [category, setCategory] = useState<ProductCategory | undefined>();
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState<string | undefined>();
  // 서버 연결 시에는 관리자가 승인된 제휴 링크를 등록한 상품만 공개한다.
  // 로컬 mock에서는 링크 등록 전에도 추천관 UI를 확인할 수 있다.
  const products = useAsyncData(() => shopService.getProducts({ category, keyword, linkedOnly: !isMockShop }), [category, keyword]);
  const items = products.data?.content ?? [];
  const selectedCategory = category ? categoryLabel(category) : '전체';

  const submitSearch = () => setKeyword(searchInput.trim() || undefined);
  const clearSearch = () => {
    setSearchInput('');
    setKeyword(undefined);
  };

  // 탭에 돌아올 때 새로 등록된 상품 반영 (첫 진입은 useAsyncData 가 처리)
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) products.reload();
      focusedOnce.current = true;
    }, [products.reload]),
  );

  return (
    <Screen
      title="추천 용품"
      subtitle="산책과 일상에 도움 되는 제품을 골라봤어요."
      headerRight={(
        <Pressable accessibilityLabel="상품 새로고침" accessibilityRole="button" disabled={products.loading} hitSlop={10} onPress={products.reload} style={({ pressed }) => pressed && styles.pressed}>
          {products.loading ? <ActivityIndicator color={colors.forest} size="small" /> : <MaterialCommunityIcons name="refresh" size={24} color={colors.forest} />}
        </Pressable>
      )}
    >
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

      <View style={styles.purchaseGuide}>
        <MaterialCommunityIcons name="open-in-new" size={18} color={colors.inkSoft} />
        <Text style={styles.purchaseGuideText}>상품 선택 시 쿠팡으로 이동하며, 결제·배송·환불은 쿠팡에서 진행됩니다.</Text>
      </View>

      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={21} color={colors.inkFaint} />
        <TextInput
          accessibilityLabel="추천 상품 검색"
          autoCapitalize="none"
          enterKeyHint="search"
          onChangeText={setSearchInput}
          onSubmitEditing={submitSearch}
          placeholder="사료, 간식, 하네스를 검색해보세요"
          placeholderTextColor={colors.inkFaint}
          returnKeyType="search"
          style={styles.searchInput}
          value={searchInput}
        />
        {searchInput ? (
          <Pressable accessibilityLabel="검색어 지우기" accessibilityRole="button" hitSlop={8} onPress={clearSearch}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.inkFaint} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.categoryRow}>
        <CategoryChip label="전체" icon="view-grid-outline" active={!category} onPress={() => setCategory(undefined)} />
        {productCategories.map((c) => (
          <CategoryChip key={c.value} label={c.label} icon={c.icon} active={category === c.value} onPress={() => setCategory(c.value)} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{keyword ? `'${keyword}' 검색 결과` : `${selectedCategory} 추천`}</Text>
        {products.data ? <Text style={styles.sectionSubtitle}>{products.data.totalElements}개의 상품을 준비했어요</Text> : null}
        </View>
        {(category || keyword) ? <Pressable accessibilityRole="button" onPress={() => { setCategory(undefined); clearSearch(); }}><Text style={styles.resetText}>전체보기</Text></Pressable> : null}
      </View>

      {items.length > 0 && !products.error
        ? <View style={styles.productGrid}>{items.map((product) => <ProductCard key={product.id} product={product} />)}</View>
        : <LoadState loading={products.loading} error={products.error} empty emptyText={keyword ? '검색 결과가 없어요.' : '준비 중인 상품이에요.'} onRetry={products.reload} />}

      <View style={styles.marketFooter}>
        <MaterialCommunityIcons name="shield-check-outline" size={19} color={colors.forest} />
        <Text style={styles.marketFooterText}>댕산책은 상품을 직접 판매하지 않으며, 실제 상품 정보와 구매 조건은 쿠팡에서 확인할 수 있어요.</Text>
      </View>
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
  const affiliateUrl = product.affiliateUrl?.trim();
  const hasLink = !!affiliateUrl && /^https:\/\/([a-z0-9-]+\.)*(coupang\.com|coupa\.ng)(\/|$)/i.test(affiliateUrl);

  const openProduct = async () => {
    if (!hasLink) {
      notify('제휴 링크 준비 중이에요', '승인된 상품 링크가 등록되면 쿠팡에서 확인할 수 있어요.');
      return;
    }

    const supported = await Linking.canOpenURL(affiliateUrl);
    if (!supported) {
      notify('안전한 링크가 아니에요', '등록된 상품 링크를 확인해 주세요.');
      return;
    }

    confirmAction({
      title: '쿠팡으로 이동할까요?',
      message: '구매와 결제는 쿠팡에서 진행되며 댕산책은 일정액의 수수료를 받을 수 있어요.',
      confirmText: '쿠팡에서 보기',
      cancelText: '취소',
      onConfirm: () => {
        Linking.openURL(affiliateUrl).catch(() => notify('쿠팡을 열지 못했어요', '잠시 후 다시 시도해 주세요.'));
      },
    });
  };

  return (
    <Pressable accessibilityRole={hasLink ? 'link' : 'button'} accessibilityLabel={`${product.name} ${hasLink ? '쿠팡에서 보기' : '링크 준비 중'}`} onPress={openProduct} style={({ pressed }) => [styles.product, pressed && styles.pressed]}>
      <View style={styles.productImage}>
        {product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <MaterialCommunityIcons name={categoryIcon(product.category)} size={44} color={colors.forest} />}
        <View style={styles.categoryBadge}><Text style={styles.categoryBadgeText}>{categoryLabel(product.category)}</Text></View>
        <View style={[styles.externalBadge, !hasLink && styles.externalBadgePending]}><MaterialCommunityIcons name={hasLink ? 'open-in-new' : 'clock-outline'} size={12} color={colors.white} /></View>
      </View>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      {product.description ? <Text style={styles.productDescription} numberOfLines={1}>{product.description}</Text> : null}
      <View style={styles.productLinkRow}>
        <Text style={[styles.productLinkText, !hasLink && styles.productLinkTextMuted]}>{hasLink ? '쿠팡에서 보기' : '링크 준비 중'}</Text>
        <MaterialCommunityIcons name={hasLink ? 'chevron-right' : 'clock-outline'} size={15} color={hasLink ? colors.forest : colors.inkFaint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderRadius: radius.xl, flexDirection: 'row', justifyContent: 'space-between', minHeight: 170, overflow: 'hidden', padding: spacing.lg },
  heroCopy: { flex: 1, gap: spacing.xs }, heroBadge: { alignItems: 'center', flexDirection: 'row', gap: 4 }, heroBadgeText: { color: colors.orange, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroTitle: { color: colors.ink, fontSize: 21, fontWeight: '800', lineHeight: 28, marginTop: 3 }, heroBody: { color: colors.inkSoft, ...typography.caption, marginTop: 3 }, heroIcon: { alignItems: 'center', height: 92, justifyContent: 'center', width: 86 }, sparkle: { position: 'absolute', right: 0, top: 3 },
  partnerNotice: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, partnerNoticeText: { color: colors.forestDeep, flex: 1, fontSize: 11, lineHeight: 16 },
  purchaseGuide: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xs }, purchaseGuideText: { color: colors.inkSoft, flex: 1, fontSize: 12, lineHeight: 18 },
  searchBox: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 50, paddingHorizontal: spacing.md }, searchInput: { color: colors.ink, flex: 1, ...typography.body, paddingVertical: spacing.sm },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md }, category: { alignItems: 'center', gap: 5, width: '23%' }, categoryIcon: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 }, categoryIconActive: { backgroundColor: colors.forest, borderColor: colors.forest }, categoryText: { color: colors.inkSoft, ...typography.caption }, categoryTextActive: { color: colors.forest, fontWeight: '800' }, pressed: { opacity: 0.72 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, sectionTitle: { color: colors.ink, ...typography.heading }, sectionSubtitle: { color: colors.inkSoft, ...typography.caption, marginTop: 2 }, resetText: { color: colors.forest, ...typography.label }, productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }, product: { width: '47%' },
  productImage: { alignItems: 'center', backgroundColor: colors.ivorySoft, borderRadius: radius.lg, height: 145, justifyContent: 'center', overflow: 'hidden' }, categoryBadge: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: radius.pill, left: spacing.sm, paddingHorizontal: 8, paddingVertical: 4, position: 'absolute', top: spacing.sm }, categoryBadgeText: { color: colors.forestDeep, fontSize: 10, fontWeight: '800' }, externalBadge: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radius.pill, bottom: spacing.sm, height: 25, justifyContent: 'center', position: 'absolute', right: spacing.sm, width: 25 }, externalBadgePending: { backgroundColor: colors.inkFaint },
  productName: { color: colors.ink, ...typography.label, marginTop: spacing.sm }, productDescription: { color: colors.inkSoft, ...typography.caption, marginTop: 2 }, productLinkRow: { alignItems: 'center', flexDirection: 'row', gap: 2, marginTop: spacing.xs }, productLinkText: { color: colors.forest, fontSize: 12, fontWeight: '700' }, productLinkTextMuted: { color: colors.inkFaint },
  marketFooter: { alignItems: 'flex-start', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md }, marketFooterText: { color: colors.inkSoft, flex: 1, fontSize: 11, lineHeight: 17 },
});
