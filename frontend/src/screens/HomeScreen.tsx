import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { Screen } from '../components/Screen';
import { colors, spacing, typography } from '../theme';

export function HomeScreen() {
  return (
    <Screen title="보리야, 오늘도 걸을까?" subtitle="오늘의 산책을 준비해볼까요?">
      <AppCard>
        <Text style={styles.cardLabel}>오늘의 추천 산책</Text>
        <Text style={styles.cardTitle}>동네 한 바퀴, 가볍게</Text>
        <Text style={styles.cardBody}>보리와 함께 2.3km를 천천히 걸어보세요.</Text>
        <View style={styles.buttonSpacing}>
          <AppButton label="산책 시작하기" variant="secondary" />
        </View>
      </AppCard>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>오늘의 활동</Text>
        <Text style={styles.link}>기록 보기</Text>
      </View>
      <AppCard>
        <View style={styles.stats}>
          <Stat value="1.2 km" label="거리" />
          <Stat value="18분" label="산책 시간" />
          <Stat value="86 kcal" label="소모 칼로리" />
        </View>
      </AppCard>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardLabel: { ...typography.label, color: colors.orange },
  cardTitle: { ...typography.heading, color: colors.ink, marginTop: spacing.sm },
  cardBody: { ...typography.body, color: colors.inkSoft, marginTop: spacing.xs },
  buttonSpacing: { marginTop: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.heading, color: colors.ink },
  link: { ...typography.label, color: colors.forest },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { ...typography.heading, color: colors.ink },
  statLabel: { ...typography.caption, color: colors.inkSoft, marginTop: spacing.xs },
});
