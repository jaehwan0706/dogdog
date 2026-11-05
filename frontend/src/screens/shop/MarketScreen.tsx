import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { colors, radius, spacing, typography } from '../../theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type CategoryId = 'all' | 'food' | 'snack' | 'health' | 'walk' | 'supplies';

const categories: { id: CategoryId; label: string; icon: IconName }[] = [
  { id: 'all', label: '전체', icon: 'view-grid-outline' },
  { id: 'food', label: '사료', icon: 'food-drumstick-outline' },
  { id: 'snack', label: '간식', icon: 'bone' },
  { id: 'health', label: '건강', icon: 'heart-pulse' },
  { id: 'walk', label: '산책', icon: 'dog-side' },
  { id: 'supplies', label: '용품', icon: 'tshirt-crew-outline' },
];

const products = [
  { category: 'walk' as CategoryId, name: '매일 쓰는 산책 필수템', description: '가볍고 튼튼한 리드줄', price: '28,900원', rating: '4.9', reviews: '128', icon: 'link-variant' as IconName, color: colors.sky, coupangUrl: 'https://www.coupang.com' },
  { category: 'snack' as CategoryId, name: '활동량 많은 강아지 간식', description: '산책 후 간편하게 급여해요', price: '16,800원', rating: '4.8', reviews: '86', icon: 'bone' as IconName, color: colors.orangeSoft, coupangUrl: 'https://www.coupang.com' },
  { category: 'supplies' as CategoryId, name: '포근한 휴식 방석', description: '집에서도 편안한 휴식', price: '39,900원', rating: '4.7', reviews: '54', icon: 'bed-outline' as IconName, color: colors.forestSoft, coupangUrl: 'https://www.coupang.com' },
  { category: 'health' as CategoryId, name: '발바닥 케어 밤', description: '산책 뒤 촉촉한 발 관리', price: '12,500원', rating: '4.9', reviews: '41', icon: 'paw' as IconName, color: '#F7E5E0', coupangUrl: 'https://www.coupang.com' },
  { category: 'food' as CategoryId, name: '균형 잡힌 데일리 사료', description: '매일 먹기 좋은 영양 밸런스', price: '34,800원', rating: '4.8', reviews: '203', icon: 'food-drumstick-outline' as IconName, color: '#E8E0D2', coupangUrl: 'https://www.coupang.com' },
  { category: 'supplies' as CategoryId, name: '산책 후 발 세정 티슈', description: '외출 뒤 간편한 발 닦기', price: '9,900원', rating: '4.7', reviews: '67', icon: 'hand-wash' as IconName, color: '#E2EEF1', coupangUrl: 'https://www.coupang.com' },
];

export function MarketScreen() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const visibleProducts = selectedCategory === 'all'
    ? products
    : products.filter((product) => product.category === selectedCategory);
  const selectedLabel = categories.find((category) => category.id === selectedCategory)?.label;

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
        <Text style={styles.partnerNoticeText}>상품을 누르면 쿠팡으로 이동해요. 구매 시 일정 수수료를 받을 수 있어요.</Text>
      </View>

      <View style={styles.categoryRow}>
        {categories.map((category) => {
          const active = category.id === selectedCategory;
          return (
            <Pressable
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={({ pressed }) => [styles.category, pressed && styles.pressed]}
            >
              <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
                <MaterialCommunityIcons name={category.icon} size={20} color={active ? colors.white : colors.forest} />
              </View>
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{category.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{selectedLabel} 추천 상품</Text>
          <Text style={styles.sectionSubtitle}>{visibleProducts.length}개의 상품을 준비했어요</Text>
        </View>
        <Text style={styles.more}>{selectedCategory === 'all' ? '전체보기' : '카테고리'}</Text>
      </View>

      <View style={styles.productGrid}>
        {visibleProducts.map((product) => <ProductCard key={product.name} product={product} />)}
      </View>

      {visibleProducts.length === 0 ? (
        <AppCard>
          <Text style={styles.emptyTitle}>준비 중인 상품이에요</Text>
          <Text style={styles.emptyBody}>곧 더 다양한 추천 상품을 추가할게요.</Text>
        </AppCard>
      ) : null}

      <AppCard>
        <View style={styles.guideRow}>
          <View style={styles.guideIcon}><MaterialCommunityIcons name="lightbulb-on-outline" size={23} color={colors.orange} /></View>
          <View style={styles.guideCopy}>
            <Text style={styles.guideTitle}>어떤 용품이 필요한지 모르겠다면?</Text>
            <Text style={styles.guideBody}>강아지의 나이와 산책 습관에 맞춰 골라보세요.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={21} color={colors.inkFaint} />
        </View>
      </AppCard>
    </Screen>
  );
}

function ProductCard({ product }: { product: (typeof products)[number] }) {
  const openProduct = () => { void Linking.openURL(product.coupangUrl); };

  return (
    <Pressable onPress={openProduct} style={({ pressed }) => [styles.product, pressed && styles.pressed]}>
      <View style={[styles.productImage, { backgroundColor: product.color }]}>
        <View style={styles.productTag}><Text style={styles.productTagText}>추천</Text></View>
        <MaterialCommunityIcons name={product.icon} size={48} color={colors.forest} />
        <View style={styles.externalBadge}><MaterialCommunityIcons name="open-in-new" size={12} color={colors.white} /></View>
      </View>
      <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
      <Text style={styles.productDescription} numberOfLines={1}>{product.description}</Text>
      <Text style={styles.productPrice}>{product.price}</Text>
      <View style={styles.ratingRow}>
        <MaterialCommunityIcons name="star" size={13} color={colors.orange} />
        <Text style={styles.rating}>{product.rating}</Text>
        <Text style={styles.reviews}>({product.reviews})</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderRadius: radius.xl, flexDirection: 'row', justifyContent: 'space-between', minHeight: 170, overflow: 'hidden', padding: spacing.lg },
  heroCopy: { flex: 1, gap: spacing.xs }, heroBadge: { alignItems: 'center', flexDirection: 'row', gap: 4 }, heroBadgeText: { color: colors.orange, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroTitle: { color: colors.ink, fontSize: 21, fontWeight: '800', lineHeight: 28, marginTop: 3 }, heroBody: { color: colors.inkSoft, ...typography.caption, marginTop: 3 }, heroIcon: { alignItems: 'center', height: 92, justifyContent: 'center', width: 86 }, sparkle: { position: 'absolute', right: 0, top: 3 },
  partnerNotice: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, partnerNoticeText: { color: colors.forestDeep, flex: 1, fontSize: 11, lineHeight: 16 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between' }, category: { alignItems: 'center', gap: 5 }, categoryIcon: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 }, categoryIconActive: { backgroundColor: colors.forest, borderColor: colors.forest }, categoryText: { color: colors.inkSoft, ...typography.caption }, categoryTextActive: { color: colors.forest, fontWeight: '800' }, pressed: { opacity: 0.72 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, sectionTitle: { color: colors.ink, ...typography.heading }, sectionSubtitle: { color: colors.inkSoft, ...typography.caption, marginTop: 2 }, more: { color: colors.forest, ...typography.label }, productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }, product: { width: '47%' },
  productImage: { alignItems: 'center', borderRadius: radius.lg, height: 145, justifyContent: 'center', overflow: 'hidden' }, productTag: { backgroundColor: colors.white, borderRadius: radius.pill, left: spacing.sm, paddingHorizontal: 7, paddingVertical: 3, position: 'absolute', top: spacing.sm }, productTagText: { color: colors.forest, fontSize: 10, fontWeight: '800' }, externalBadge: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radius.pill, bottom: spacing.sm, height: 25, justifyContent: 'center', position: 'absolute', right: spacing.sm, width: 25 },
  productName: { color: colors.ink, ...typography.label, marginTop: spacing.sm }, productDescription: { color: colors.inkSoft, ...typography.caption, marginTop: 2 }, productPrice: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 4 }, ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 3, marginTop: 3 }, rating: { color: colors.ink, fontSize: 11, fontWeight: '700' }, reviews: { color: colors.inkFaint, fontSize: 11 },
  emptyTitle: { color: colors.ink, ...typography.heading }, emptyBody: { color: colors.inkSoft, ...typography.body, marginTop: spacing.xs }, guideRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md }, guideIcon: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderRadius: radius.md, height: 42, justifyContent: 'center', width: 42 }, guideCopy: { flex: 1 }, guideTitle: { color: colors.ink, ...typography.label }, guideBody: { color: colors.inkSoft, ...typography.caption, marginTop: 2 },
});
