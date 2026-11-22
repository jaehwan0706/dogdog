import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { isMockShop, shopService } from '../../api/shop/shopService';
import { Screen } from '../../components/Screen';
import { MarketProductGrid } from '../../components/shop/MarketProductGrid';
import { LoadState } from '../../components/shop/ShopParts';
import { useAsyncData } from '../../hooks/useAsyncData';
import { colors, radius, spacing, typography } from '../../theme';
import type { ProductCategory } from '../../types/shop';
import { categoryLabel, productCategories } from '../../utils/shop';

// 쿠팡 제휴 마켓: 상품 사진을 누르면 쿠팡 파트너스 링크로 이동한다. 상품은 관리자 메뉴에서 등록한다.
export function MarketScreen() {
  const [category, setCategory] = useState<ProductCategory | undefined>();
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  // 서버 연결 시에는 관리자가 승인된 제휴 링크를 등록한 상품만 공개한다.
  // 로컬 mock에서는 링크 등록 전에도 추천관 UI를 확인할 수 있다.
  const products = useAsyncData(() => shopService.getProducts({ category, keyword, linkedOnly: !isMockShop, page, size: 12 }), [category, keyword, page]);
  const items = products.data?.content ?? [];
  const selectedCategory = category ? categoryLabel(category) : '전체';

  const submitSearch = () => {
    setPage(0);
    setKeyword(searchInput.trim() || undefined);
  };
  const clearSearch = () => {
    setPage(0);
    setSearchInput('');
    setKeyword(undefined);
  };

  const selectCategory = (nextCategory?: ProductCategory) => {
    setPage(0);
    setCategory(nextCategory);
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
        <CategoryChip label="전체" icon="view-grid-outline" active={!category} onPress={() => selectCategory(undefined)} />
        {productCategories.map((c) => (
          <CategoryChip key={c.value} label={c.label} icon={c.icon} active={category === c.value} onPress={() => selectCategory(c.value)} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{keyword ? `'${keyword}' 검색 결과` : `${selectedCategory} 추천`}</Text>
        {products.data ? <Text style={styles.sectionSubtitle}>{products.data.totalElements}개의 상품을 준비했어요</Text> : null}
        </View>
        {(category || keyword) ? <Pressable accessibilityRole="button" onPress={() => { selectCategory(undefined); clearSearch(); }}><Text style={styles.resetText}>전체보기</Text></Pressable> : null}
      </View>

      {items.length > 0 && !products.error
        ? <MarketProductGrid products={items} />
        : <LoadState loading={products.loading} error={products.error} empty emptyText={keyword ? '검색 결과가 없어요.' : '준비 중인 상품이에요.'} onRetry={products.reload} />}

      {products.data && products.data.totalPages > 1 ? (
        <View style={styles.pagination}>
          <Pressable
            accessibilityLabel="이전 상품 페이지"
            accessibilityRole="button"
            disabled={page === 0 || products.loading}
            onPress={() => setPage((current) => Math.max(0, current - 1))}
            style={({ pressed }) => [styles.pageButton, (page === 0 || products.loading) && styles.pageButtonDisabled, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="chevron-left" size={19} color={page === 0 ? colors.inkFaint : colors.forest} />
            <Text style={[styles.pageButtonText, page === 0 && styles.pageButtonTextDisabled]}>이전</Text>
          </Pressable>
          <Text style={styles.pageStatus}>{page + 1} / {products.data.totalPages}</Text>
          <Pressable
            accessibilityLabel="다음 상품 페이지"
            accessibilityRole="button"
            disabled={!products.data.hasNext || products.loading}
            onPress={() => setPage((current) => current + 1)}
            style={({ pressed }) => [styles.pageButton, (!products.data?.hasNext || products.loading) && styles.pageButtonDisabled, pressed && styles.pressed]}
          >
            <Text style={[styles.pageButtonText, !products.data.hasNext && styles.pageButtonTextDisabled]}>다음</Text>
            <MaterialCommunityIcons name="chevron-right" size={19} color={products.data.hasNext ? colors.forest : colors.inkFaint} />
          </Pressable>
        </View>
      ) : null}

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

const styles = StyleSheet.create({
  hero: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderRadius: radius.xl, flexDirection: 'row', justifyContent: 'space-between', minHeight: 170, overflow: 'hidden', padding: spacing.lg },
  heroCopy: { flex: 1, gap: spacing.xs }, heroBadge: { alignItems: 'center', flexDirection: 'row', gap: 4 }, heroBadgeText: { color: colors.orange, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroTitle: { color: colors.ink, fontSize: 21, fontWeight: '800', lineHeight: 28, marginTop: 3 }, heroBody: { color: colors.inkSoft, ...typography.caption, marginTop: 3 }, heroIcon: { alignItems: 'center', height: 92, justifyContent: 'center', width: 86 }, sparkle: { position: 'absolute', right: 0, top: 3 },
  partnerNotice: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, partnerNoticeText: { color: colors.forestDeep, flex: 1, fontSize: 11, lineHeight: 16 },
  purchaseGuide: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xs }, purchaseGuideText: { color: colors.inkSoft, flex: 1, fontSize: 12, lineHeight: 18 },
  searchBox: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 50, paddingHorizontal: spacing.md }, searchInput: { color: colors.ink, flex: 1, ...typography.body, paddingVertical: spacing.sm },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md }, category: { alignItems: 'center', gap: 5, width: '20%' }, categoryIcon: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 }, categoryIconActive: { backgroundColor: colors.forest, borderColor: colors.forest }, categoryText: { color: colors.inkSoft, ...typography.caption }, categoryTextActive: { color: colors.forest, fontWeight: '800' }, pressed: { opacity: 0.72 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, sectionTitle: { color: colors.ink, ...typography.heading }, sectionSubtitle: { color: colors.inkSoft, ...typography.caption, marginTop: 2 }, resetText: { color: colors.forest, ...typography.label },
  pagination: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }, pageButton: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', minHeight: 42, paddingHorizontal: spacing.md }, pageButtonDisabled: { backgroundColor: colors.ivorySoft }, pageButtonText: { color: colors.forest, fontSize: 13, fontWeight: '700' }, pageButtonTextDisabled: { color: colors.inkFaint }, pageStatus: { color: colors.inkSoft, fontSize: 13, fontWeight: '700' },
  marketFooter: { alignItems: 'flex-start', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md }, marketFooterText: { color: colors.inkSoft, flex: 1, fontSize: 11, lineHeight: 17 },
});
