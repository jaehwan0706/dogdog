import { PropsWithChildren, ReactNode } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';

// scroll=false: 지도처럼 자체 제스처가 있는 화면에서 남은 영역을 children 이 채우도록 함
// onBack: 스택 하위 화면에서 뒤로가기 버튼 표시, headerRight: 제목 오른쪽 액션(장바구니 등)
type ScreenProps = PropsWithChildren<{ title: string; subtitle?: string; scroll?: boolean; onBack?: () => void; headerRight?: ReactNode }>;

export function Screen({ title, subtitle, scroll = true, onBack, headerRight, children }: ScreenProps) {
  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="뒤로가기" hitSlop={10} onPress={onBack}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.ink} />
          </Pressable>
        ) : (
          <View style={styles.titleMark}>
            <MaterialCommunityIcons name="paw" size={13} color={colors.orange} />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
        {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill]}>
          {header}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: spacing.xl, paddingBottom: spacing.section, gap: spacing.lg },
  fill: { flex: 1 },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  titleMark: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderRadius: 99, height: 25, justifyContent: 'center', width: 25 },
  title: { ...typography.title, color: colors.ink, flexShrink: 1 },
  headerRight: { marginLeft: 'auto' },
  subtitle: { ...typography.body, color: colors.inkSoft },
});
