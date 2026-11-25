import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import type { Product } from '../../types/shop';
import { notify } from '../../utils/dialog';

// 마켓 추천 상품 그리드: PC 4열 / 태블릿 3열 / 모바일 2열. 카드 전체를 누르면 쿠팡 파트너스 링크로 바로 이동한다.

const COUPANG_LINK = /^https:\/\/([a-z0-9-]+\.)*(coupang\.com|coupa\.ng)(\/|$)/i;
// 쿠팡 파트너스 '이미지+텍스트' 배너 그림(세로 1:2, 위에 로고·아래에 상품명과 버튼이 그려져 있음)
const BANNER_IMAGE = /coupangcdn\.com\/image\/affiliate\/banner\//i;
// 배너 그림에서 상품 사진이 있는 부분만 정사각형으로 보이도록 위로 올리는 비율 (그림 높이 대비)
const BANNER_TOP_OFFSET = 0.14;

function columnsFor(windowWidth: number) {
  if (windowWidth >= 1024) return 4;
  if (windowWidth >= 768) return 3;
  return 2;
}

export function MarketProductGrid({ products }: { products: Product[] }) {
  const { width: windowWidth } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(0);
  const columns = columnsFor(windowWidth);
  const isMobile = columns === 2;
  const gap = isMobile ? 12 : 20;
  const cardWidth = gridWidth > 0 ? Math.floor((gridWidth - gap * (columns - 1)) / columns) : 0;

  return (
    <View onLayout={(e: LayoutChangeEvent) => setGridWidth(e.nativeEvent.layout.width)} style={[styles.grid, { columnGap: gap, rowGap: gap }]}>
      {cardWidth > 0 ? products.map((product) => <MarketProductCard key={product.id} product={product} width={cardWidth} showDescription={!isMobile} />) : null}
    </View>
  );
}

function MarketProductCard({ product, width, showDescription }: { product: Product; width: number; showDescription: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const partnerUrl = product.affiliateUrl?.trim() ?? '';
  const hasLink = COUPANG_LINK.test(partnerUrl);
  const label = `${product.name} — 쿠팡에서 가격 보기`;

  // 웹은 진짜 <a href target="_blank" rel="sponsored ..."> 로 그려서 브라우저가 이동을 처리한다.
  // 앱은 쿠팡 단축 링크를 열면 쿠팡 앱(없으면 브라우저)으로 넘어간다.
  const webLinkProps = Platform.OS === 'web' && hasLink
    ? { href: partnerUrl, hrefAttrs: { target: '_blank', rel: 'sponsored noopener noreferrer' } }
    : {};

  const open = () => {
    if (!hasLink) {
      notify('제휴 링크 준비 중이에요', '상품 링크가 등록되면 쿠팡에서 확인할 수 있어요.');
      return;
    }
    if (Platform.OS === 'web') return;
    Linking.openURL(partnerUrl).catch(() => notify('쿠팡을 열지 못했어요', '잠시 후 다시 시도해 주세요.'));
  };

  const imageUrl = product.imageUrl?.trim();
  const showImage = !!imageUrl && !imageFailed;
  const isBanner = !!imageUrl && BANNER_IMAGE.test(imageUrl);

  return (
    <Pressable
      {...webLinkProps}
      accessibilityLabel={label}
      accessibilityRole="link"
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={open}
      style={({ pressed }) => [styles.card, { width }, hovered && styles.cardHovered, pressed && styles.cardPressed]}
    >
      <View style={[styles.imageBox, { height: width }]}>
        {showImage ? (
          <Image
            onError={() => setImageFailed(true)}
            resizeMode="cover"
            source={{ uri: imageUrl }}
            // 배너 그림은 세로로 길어서 위쪽 로고와 아래쪽 글자·버튼을 잘라 내고 상품 사진 부분만 보여준다
            style={isBanner ? { height: width * 2, left: 0, position: 'absolute', top: -width * 2 * BANNER_TOP_OFFSET, width } : StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.imageFallback}>
            <MaterialCommunityIcons name="image-outline" size={32} color={colors.inkFaint} />
            <Text style={styles.imageFallbackText}>이미지 준비 중</Text>
          </View>
        )}
        {product.isRocket ? <View style={styles.rocketBadge}><Text style={styles.rocketText}>로켓배송</Text></View> : null}
      </View>

      <View style={styles.info}>
        {product.brand ? <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text> : null}
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        {showDescription && product.description ? <Text style={styles.description} numberOfLines={2}>{product.description}</Text> : null}
        {/* 남는 높이를 채워서 버튼이 항상 카드 맨 아래에 붙도록 (margin-top: auto 와 같은 역할) */}
        <View style={styles.spacer} />
        <View style={[styles.cta, hovered && styles.ctaHovered]}>
          <Text style={[styles.ctaText, hovered && styles.ctaTextHovered]}>쿠팡에서 가격 보기 →</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { alignItems: 'stretch', flexDirection: 'row', flexWrap: 'wrap' },
  card: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardHovered: { elevation: 4, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, transform: [{ translateY: -3 }] },
  cardPressed: { opacity: 0.85 },
  imageBox: { backgroundColor: colors.white, overflow: 'hidden', width: '100%' },
  imageFallback: { alignItems: 'center', backgroundColor: colors.ivorySoft, flex: 1, gap: spacing.xs, justifyContent: 'center' },
  imageFallbackText: { color: colors.inkFaint, fontSize: 12, fontWeight: '600' },
  rocketBadge: { backgroundColor: colors.white, borderRadius: radius.pill, left: spacing.sm, paddingHorizontal: 8, paddingVertical: 4, position: 'absolute', top: spacing.sm },
  rocketText: { color: colors.forestDeep, fontSize: 11, fontWeight: '800' },
  info: { flexGrow: 1, gap: 4, padding: 16 },
  brand: { color: colors.forest, fontSize: 12, fontWeight: '700' },
  name: { color: colors.ink, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  description: { color: colors.inkSoft, fontSize: 13, lineHeight: 19 },
  spacer: { flexGrow: 1, minHeight: 8 },
  cta: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.md, paddingVertical: 10 },
  ctaHovered: { backgroundColor: colors.forest },
  ctaText: { color: colors.forest, fontSize: 13, fontWeight: '700' },
  ctaTextHovered: { color: colors.white },
});
