import { useEffect, useState, type ReactNode } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { adminService, type ProductInput } from '../../api/admin/adminService';
import { shopService } from '../../api/shop/shopService';
import { AppButton } from '../../components/AppButton';
import { FilterChips } from '../../components/FilterChips';
import { Screen } from '../../components/Screen';
import { LoadState } from '../../components/shop/ShopParts';
import type { ProfileScreenProps } from '../../navigation/ProfileNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { ProductCategory, ProductStatus } from '../../types/shop';
import { productCategories } from '../../utils/shop';

const categoryOptions = productCategories.map((c) => ({ value: c.value as ProductCategory | undefined, label: c.label }));
const statusOptions: { value: ProductStatus | undefined; label: string }[] = [
  { value: 'ON_SALE', label: '노출' },
  { value: 'HIDDEN', label: '숨김' },
];

const coupangLinkPattern = /^https:\/\/([a-z0-9-]+\.)*(coupang\.com|coupa\.ng)(\/|$)/i;
const secureUrlPattern = /^https:\/\//i;

function decodeHtml(value: string) {
  return value.replaceAll('&amp;', '&').replaceAll('&#38;', '&');
}

function extractQueryUrl(html: string, key: 'linkUrl' | 'productImage') {
  const normalized = decodeHtml(html);
  const match = normalized.match(new RegExp(`[?&]${key}=([^&"'<>\\s]+)`, 'i'));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function extractDirectImage(html: string) {
  const match = decodeHtml(html).match(/<img[^>]+src=["'](https:\/\/[^"']+)["']/i);
  return match?.[1] ?? null;
}

function extractAnchorLink(html: string) {
  const match = decodeHtml(html).match(/<a[^>]+href=["'](https:\/\/[^"']+)["']/i);
  return match?.[1] ?? null;
}

function extractImageAlt(html: string) {
  const match = decodeHtml(html).match(/<img[^>]+alt=["']([^"']+)["']/i);
  return match?.[1]?.trim() ?? null;
}

function extractIframeLink(html: string) {
  const match = decodeHtml(html).match(/<iframe[^>]+src=["'](https:\/\/[^"']+)["']/i);
  return match?.[1] ?? null;
}

// 쿠팡 제휴 상품 등록(productId 없음)·수정. 이미지는 업로드 기능 전까지 이미지 주소(URL)로 입력한다.
export function AdminProductEditScreen({ navigation, route }: ProfileScreenProps<'AdminProductEdit'>) {
  const { productId } = route.params;
  const [loading, setLoading] = useState(productId !== undefined);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory | undefined>('WALK');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [partnerHtml, setPartnerHtml] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [status, setStatus] = useState<ProductStatus | undefined>('ON_SALE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId === undefined) return;
    // 판매중지 상품도 관리자 목록 API 에는 있으므로 상세는 공개 API 대신 관리자 목록에서 찾는다
    adminService.getProducts().then((page) => page.content.find((item) => item.id === productId) ?? shopService.getProduct(productId))
      .then((product) => {
        setName(product.name);
        setCategory(product.category);
        setAffiliateUrl(product.affiliateUrl ?? '');
        setDescription(product.description ?? '');
        setImageUrl(product.imageUrl ?? '');
        setStatus(product.status);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [productId]);

  const validAffiliateUrl = coupangLinkPattern.test(affiliateUrl.trim());
  const validImageUrl = secureUrlPattern.test(imageUrl.trim());
  const canSave = name.trim() !== '' && category && validAffiliateUrl && validImageUrl;

  const importPartnerHtml = () => {
    const extractedLink = extractQueryUrl(partnerHtml, 'linkUrl') ?? extractAnchorLink(partnerHtml) ?? extractIframeLink(partnerHtml);
    const extractedImage = extractQueryUrl(partnerHtml, 'productImage') ?? extractDirectImage(partnerHtml);
    const extractedName = extractImageAlt(partnerHtml);

    if (extractedLink && coupangLinkPattern.test(extractedLink)) setAffiliateUrl(extractedLink);
    if (extractedName && !name.trim()) setName(extractedName.slice(0, 100));
    if (extractedImage && secureUrlPattern.test(extractedImage)) {
      setImageUrl(extractedImage);
      setImageFailed(false);
    }

    if (!extractedLink && !extractedImage) {
      setError('파트너스 HTML에서 상품 링크나 이미지 주소를 찾지 못했어요. 이미지 + 텍스트 HTML 전체를 복사해 주세요.');
    } else if (extractedLink && !extractedImage) {
      setError('제휴 링크는 가져왔어요. 이 iframe에는 사진 주소가 없으므로 쿠팡 파트너스의 ‘이미지 + 텍스트 HTML’을 복사하거나 이미지 URL을 직접 입력해 주세요.');
    } else {
      setError(null);
    }
  };

  const save = async () => {
    const input: ProductInput = {
      name: name.trim(),
      category: category!,
      // 구매는 쿠팡에서 이뤄져 가격·재고를 관리하지 않는다 (서버 필수 값이라 0 으로 보냄)
      price: 0,
      stock: 0,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim(),
      affiliateUrl: affiliateUrl.trim(),
      status: status ?? 'ON_SALE',
    };
    setSaving(true);
    setError(null);
    try {
      if (productId === undefined) await adminService.createProduct(input);
      else await adminService.updateProduct(productId, input);
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했어요.');
      setSaving(false);
    }
  };

  return (
    <Screen title={productId === undefined ? '상품 등록' : '상품 수정'} onBack={navigation.goBack}>
      {loading ? <LoadState loading error={null} onRetry={() => {}} /> : (
        <>
          <Field label="상품명 *"><TextInput maxLength={100} onChangeText={setName} placeholder="예: 반사 리드줄 1.5m" placeholderTextColor={colors.inkFaint} style={styles.input} value={name} /></Field>
          <Field label="카테고리 *"><FilterChips options={categoryOptions} value={category} onChange={setCategory} /></Field>
          <Field label="파트너스 HTML 자동 입력 (선택)">
            <Text style={styles.help}>쿠팡 파트너스의 ‘이미지 + 텍스트 → HTML 복사’ 내용을 붙여 넣으면 링크와 사진을 자동으로 채워요.</Text>
            <TextInput autoCapitalize="none" multiline onChangeText={setPartnerHtml} placeholder="<iframe ... 또는 <a ...>" placeholderTextColor={colors.inkFaint} style={[styles.input, styles.htmlInput]} textAlignVertical="top" value={partnerHtml} />
            <AppButton disabled={!partnerHtml.trim()} label="HTML에서 링크·사진 가져오기" variant="ghost" onPress={importPartnerHtml} />
          </Field>
          <Field label="쿠팡 파트너스 링크 *">
            <TextInput autoCapitalize="none" maxLength={1000} onChangeText={setAffiliateUrl} placeholder="https://link.coupang.com/a/..." placeholderTextColor={colors.inkFaint} style={[styles.input, affiliateUrl && !validAffiliateUrl && styles.inputError]} value={affiliateUrl} />
            {affiliateUrl && !validAffiliateUrl ? <Text style={styles.validation}>coupang.com 또는 coupa.ng의 HTTPS 링크만 사용할 수 있어요.</Text> : null}
          </Field>
          <Field label="상품 설명"><TextInput maxLength={5000} multiline onChangeText={setDescription} placeholder="상품 소개" placeholderTextColor={colors.inkFaint} style={[styles.input, styles.multiline]} textAlignVertical="top" value={description} /></Field>
          <Field label="이미지 주소 (URL) *">
            <TextInput autoCapitalize="none" maxLength={500} onChangeText={(value) => { setImageUrl(value); setImageFailed(false); }} placeholder="https://..." placeholderTextColor={colors.inkFaint} style={[styles.input, imageUrl && !validImageUrl && styles.inputError]} value={imageUrl} />
            {imageUrl && !validImageUrl ? <Text style={styles.validation}>보안을 위해 HTTPS 이미지 주소만 사용할 수 있어요.</Text> : null}
          </Field>
          {validImageUrl ? (
            <Field label="상품 카드 미리보기">
              <View style={styles.previewCard}>
                {imageFailed ? <View style={styles.previewFallback}><Text style={styles.previewFallbackText}>이미지를 불러오지 못했어요.</Text></View> : <Image onError={() => setImageFailed(true)} resizeMode="cover" source={{ uri: imageUrl.trim() }} style={styles.previewImage} />}
                <View style={styles.previewCopy}>
                  <Text style={styles.previewName} numberOfLines={2}>{name.trim() || '상품명 미리보기'}</Text>
                  <Text style={styles.previewDescription} numberOfLines={2}>{description.trim() || '상품 설명이 여기에 표시돼요.'}</Text>
                  <Text style={styles.previewLink}>{validAffiliateUrl ? '쿠팡에서 보기 ›' : '제휴 링크를 확인해 주세요'}</Text>
                </View>
              </View>
            </Field>
          ) : null}
          <Field label="마켓 노출"><FilterChips options={statusOptions} value={status} onChange={setStatus} /></Field>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton disabled={!canSave || saving} label={saving ? '저장 중…' : '저장하기'} onPress={save} />
        </>
      )}
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { color: colors.inkSoft, ...typography.label },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, minHeight: 50, paddingHorizontal: spacing.lg, ...typography.body },
  inputError: { borderColor: colors.danger },
  multiline: { minHeight: 120, paddingTop: spacing.md },
  htmlInput: { minHeight: 92, paddingTop: spacing.md },
  help: { color: colors.inkSoft, ...typography.caption, lineHeight: 18 },
  validation: { color: colors.danger, ...typography.caption },
  previewCard: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.md, overflow: 'hidden', padding: spacing.sm },
  previewImage: { backgroundColor: colors.ivorySoft, borderRadius: radius.md, height: 104, width: 104 },
  previewFallback: { alignItems: 'center', backgroundColor: colors.ivorySoft, borderRadius: radius.md, height: 104, justifyContent: 'center', padding: spacing.sm, width: 104 },
  previewFallbackText: { color: colors.inkFaint, textAlign: 'center', ...typography.caption },
  previewCopy: { flex: 1, justifyContent: 'center' },
  previewName: { color: colors.ink, ...typography.label },
  previewDescription: { color: colors.inkSoft, marginTop: spacing.xs, ...typography.caption },
  previewLink: { color: colors.forest, marginTop: spacing.sm, ...typography.label },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
});
