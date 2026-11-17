import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../AppButton';
import { colors, radius, spacing, typography } from '../../theme';
import type { ProductCategory } from '../../types/shop';
import { categoryIcon } from '../../utils/shop';

// 상품 이미지가 없으면 카테고리 아이콘으로 대체
export function ProductThumb({ imageUrl, category, size }: { imageUrl: string | null; category: ProductCategory; size: number }) {
  return (
    <View style={[styles.thumb, { height: size }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <MaterialCommunityIcons name={categoryIcon(category)} size={size * 0.36} color={colors.forest} />
      )}
    </View>
  );
}

export function QuantityStepper({ value, min = 1, max, onChange }: { value: number; min?: number; max: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.stepper}>
      <StepButton icon="minus" disabled={value <= min} onPress={() => onChange(value - 1)} label="수량 줄이기" />
      <Text style={styles.stepValue}>{value}</Text>
      <StepButton icon="plus" disabled={value >= max} onPress={() => onChange(value + 1)} label="수량 늘리기" />
    </View>
  );
}

function StepButton({ icon, disabled, onPress, label }: { icon: 'minus' | 'plus'; disabled: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} hitSlop={6} onPress={onPress} style={[styles.stepButton, disabled && styles.stepDisabled]}>
      <MaterialCommunityIcons name={icon} size={16} color={colors.ink} />
    </Pressable>
  );
}

// 로딩 / 오류(재시도) / 빈 결과 공통 표시
export function LoadState({ loading, error, empty, emptyText, onRetry }: { loading: boolean; error: string | null; empty?: boolean; emptyText?: string; onRetry: () => void }) {
  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.state}>
        <MaterialCommunityIcons name="wifi-alert" size={30} color={colors.inkFaint} />
        <Text style={styles.stateText}>{error}</Text>
        <AppButton label="다시 시도" variant="ghost" onPress={onRetry} />
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.state}>
        <MaterialCommunityIcons name="paw-off-outline" size={30} color={colors.inkFaint} />
        <Text style={styles.stateText}>{emptyText}</Text>
      </View>
    );
  }
  return null;
}

export function CartButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`장바구니 ${count}개`} hitSlop={8} onPress={onPress} style={styles.cartButton}>
      <MaterialCommunityIcons name="cart-outline" size={22} color={colors.forest} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { alignItems: 'center', backgroundColor: colors.ivorySoft, borderRadius: radius.md, justifyContent: 'center', overflow: 'hidden' },
  stepper: { alignItems: 'center', borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row' },
  stepButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  stepDisabled: { opacity: 0.3 },
  stepValue: { color: colors.ink, minWidth: 28, textAlign: 'center', ...typography.body, fontWeight: '700' },
  state: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.section },
  stateText: { color: colors.inkSoft, textAlign: 'center', ...typography.body },
  cartButton: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  badge: { alignItems: 'center', backgroundColor: colors.coral, borderRadius: radius.pill, minWidth: 18, paddingHorizontal: 4, position: 'absolute', right: -5, top: -5 },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800', lineHeight: 18 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.inkSoft, ...typography.body },
  summaryValue: { color: colors.ink, ...typography.body },
  summaryStrong: { color: colors.ink, fontWeight: '800' },
});
