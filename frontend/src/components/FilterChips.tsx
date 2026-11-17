import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

// 목록 상단 상태/카테고리 필터. value 가 undefined 인 항목은 "전체"
export function FilterChips<T extends string>({ options, value, onChange }: { options: { value: T | undefined; label: string }[]; value: T | undefined; onChange: (value: T | undefined) => void }) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value ?? 'ALL'} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => onChange(option.value)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.text, active && styles.textActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 99, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  text: { color: colors.inkSoft, ...typography.label },
  textActive: { color: colors.white },
});
