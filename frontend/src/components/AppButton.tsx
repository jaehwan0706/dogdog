import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

type AppButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function AppButton({ label, onPress, variant = 'primary' }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  primary: { backgroundColor: colors.forest },
  secondary: { backgroundColor: colors.orange },
  ghost: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  label: { ...typography.body, fontWeight: '700' },
  primaryLabel: { color: colors.white },
  secondaryLabel: { color: colors.ink },
  pressed: { opacity: 0.78 },
});
