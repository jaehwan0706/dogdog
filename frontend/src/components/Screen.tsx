import { PropsWithChildren } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';

type ScreenProps = PropsWithChildren<{ title: string; subtitle?: string }>;

export function Screen({ title, subtitle, children }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleMark}>
              <MaterialCommunityIcons name="paw" size={13} color={colors.orange} />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: spacing.xl, paddingBottom: spacing.section, gap: spacing.lg },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  titleMark: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderRadius: 99, height: 25, justifyContent: 'center', width: 25 },
  title: { ...typography.title, color: colors.ink },
  subtitle: { ...typography.body, color: colors.inkSoft },
});
