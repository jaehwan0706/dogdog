import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
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

// 쿠팡 제휴 상품 등록(productId 없음)·수정. 이미지는 업로드 기능 전까지 이미지 주소(URL)로 입력한다.
export function AdminProductEditScreen({ navigation, route }: ProfileScreenProps<'AdminProductEdit'>) {
  const { productId } = route.params;
  const [loading, setLoading] = useState(productId !== undefined);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory | undefined>('WALK');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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

  const canSave = name.trim() !== '' && category && affiliateUrl.trim() !== '' && imageUrl.trim() !== '';

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
          <Field label="쿠팡 파트너스 링크 *"><TextInput autoCapitalize="none" maxLength={1000} onChangeText={setAffiliateUrl} placeholder="https://link.coupang.com/a/..." placeholderTextColor={colors.inkFaint} style={styles.input} value={affiliateUrl} /></Field>
          <Field label="상품 설명"><TextInput maxLength={5000} multiline onChangeText={setDescription} placeholder="상품 소개" placeholderTextColor={colors.inkFaint} style={[styles.input, styles.multiline]} textAlignVertical="top" value={description} /></Field>
          <Field label="이미지 주소 (URL) *"><TextInput autoCapitalize="none" maxLength={500} onChangeText={setImageUrl} placeholder="https://..." placeholderTextColor={colors.inkFaint} style={styles.input} value={imageUrl} /></Field>
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
  multiline: { minHeight: 120, paddingTop: spacing.md },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
});
