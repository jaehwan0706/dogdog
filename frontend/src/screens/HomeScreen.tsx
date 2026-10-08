import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { Screen } from '../components/Screen';
import { colors, radius, spacing, typography } from '../theme';

export function HomeScreen() {
  const weeklyStats = getWeeklyStats(weekActivity);
  const [selectedDayIndex, setSelectedDayIndex] = useState(4);
  const selectedActivity = weekActivity[selectedDayIndex];

  return (
    <Screen title="보리야, 오늘도 걸을까?" subtitle="오늘의 산책을 준비해볼까요?">
      <View style={styles.weather}>
        <View style={styles.weatherIcon}><MaterialCommunityIcons name="white-balance-sunny" size={22} color={colors.orange} /></View>
        <View style={styles.weatherCopy}><Text style={styles.weatherTitle}>오늘은 산책하기 좋은 날이에요</Text><Text style={styles.weatherBody}>맑음 · 18°C · 미세먼지 좋음</Text></View>
        <MaterialCommunityIcons name="chevron-right" size={21} color={colors.inkFaint} />
      </View>
      <View style={styles.heroCard}>
        <View style={styles.heroCopy}><Text style={styles.cardLabel}>오늘의 추천 산책</Text><Text style={styles.cardTitle}>동네 한 바퀴, 가볍게</Text><Text style={styles.cardBody}>보리와 함께 2.3km를 천천히 걸어보세요.</Text></View>
        <View style={styles.heroPaw}><MaterialCommunityIcons name="paw" size={42} color={colors.orange} /></View>
        <View style={styles.buttonSpacing}>
          <AppButton label="산책 시작하기" variant="secondary" />
        </View>
      </View>
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
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>이번 주 활동</Text>
        <Text style={styles.link}>자세히 보기</Text>
      </View>
      <AppCard>
        <View style={styles.weekSummary}>
          <View><Text style={styles.weekEyebrow}>이번 주 산책</Text><Text style={styles.weekHeadline}>{weeklyStats.streak > 0 ? '꾸준히 잘 걷고 있어요!' : '이번 주 산책을 시작해볼까요?'}</Text></View>
          {weeklyStats.streak > 0 ? <View style={styles.streak}><MaterialCommunityIcons name="fire" size={15} color={colors.orange} /><Text style={styles.streakText}>{weeklyStats.streak}일 연속</Text></View> : null}
        </View>
        <View style={styles.weekDays}>
          {weekActivity.map(({ day, walked }, index) => <View key={day} style={styles.weekDay}><Text style={[styles.dayLabel, selectedDayIndex === index && styles.dayLabelSelected]}>{day}</Text><View style={[styles.dayDot, walked && styles.dayDotActive, selectedDayIndex === index && styles.dayDotSelected]}><Pressable accessibilityRole="button" accessibilityLabel={`${day}요일 산책 기록 보기`} onPress={() => setSelectedDayIndex(index)} style={styles.dayButton}>{walked ? <MaterialCommunityIcons name="paw" size={12} color={selectedDayIndex === index ? colors.orange : colors.white} /> : null}</Pressable></View></View>)}
        </View>
        <View style={styles.dayDetail}>
          <View style={styles.dayDetailIcon}><MaterialCommunityIcons name={selectedActivity.walked ? 'walk' : 'calendar-blank-outline'} size={20} color={selectedActivity.walked ? colors.forest : colors.inkFaint} /></View>
          <View style={styles.dayDetailCopy}><Text style={styles.dayDetailTitle}>{selectedActivity.day}요일 산책 기록</Text>{selectedActivity.walked ? <Text style={styles.dayDetailBody}>{selectedActivity.distance.toFixed(1)}km · {Math.round(selectedActivity.hours * 60)}분 · {selectedActivity.calories}kcal</Text> : <Text style={styles.dayDetailBody}>아직 기록이 없어요. 가볍게 산책을 시작해볼까요?</Text>}</View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.inkFaint} />
        </View>
        <View style={styles.weekFooter}><Text style={styles.weekMetric}><Text style={styles.metricStrong}>{weeklyStats.count}회</Text> 산책</Text><Text style={styles.weekMetric}><Text style={styles.metricStrong}>{weeklyStats.distance.toFixed(1)}km</Text> 총 거리</Text><Text style={styles.weekMetric}><Text style={styles.metricStrong}>{weeklyStats.hours.toFixed(1)}시간</Text> 함께한 시간</Text></View>
      </AppCard>
    </Screen>
  );
}

type DayActivity = { day: string; walked: boolean; distance: number; hours: number; calories: number };

const weekActivity: DayActivity[] = [
  { day: '월', walked: true, distance: 2.4, hours: 0.6, calories: 102 },
  { day: '화', walked: false, distance: 0, hours: 0, calories: 0 },
  { day: '수', walked: true, distance: 3.1, hours: 0.8, calories: 135 },
  { day: '목', walked: true, distance: 3.1, hours: 0.7, calories: 128 },
  { day: '금', walked: true, distance: 2.1, hours: 0.5, calories: 86 },
  { day: '토', walked: false, distance: 0, hours: 0, calories: 0 },
  { day: '일', walked: false, distance: 0, hours: 0, calories: 0 },
];

function getWeeklyStats(activities: DayActivity[]) {
  let lastWalkedIndex = -1;
  for (let index = activities.length - 1; index >= 0; index -= 1) {
    if (activities[index].walked) {
      lastWalkedIndex = index;
      break;
    }
  }

  let streak = 0;
  for (let index = lastWalkedIndex; index >= 0 && activities[index].walked; index -= 1) streak += 1;

  return {
    count: activities.filter((activity) => activity.walked).length,
    distance: activities.reduce((total, activity) => total + activity.distance, 0),
    hours: activities.reduce((total, activity) => total + activity.hours, 0),
    streak,
  };
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
  cardTitle: { ...typography.heading, color: colors.ivory, marginTop: spacing.sm },
  cardBody: { ...typography.body, color: '#C7D6CC', marginTop: spacing.xs },
  buttonSpacing: { marginTop: spacing.lg },
  weather: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  weatherIcon: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderRadius: radius.md, height: 42, justifyContent: 'center', width: 42 },
  weatherCopy: { flex: 1 },
  weatherTitle: { ...typography.label, color: colors.ink },
  weatherBody: { ...typography.caption, color: colors.inkSoft, marginTop: 2 },
  heroCard: { backgroundColor: colors.forestMuted, borderRadius: radius.xl, minHeight: 220, overflow: 'hidden', padding: spacing.xl, position: 'relative' },
  heroCopy: { maxWidth: '78%' },
  heroPaw: { alignItems: 'center', backgroundColor: '#FFFFFF1C', borderRadius: 99, height: 82, justifyContent: 'center', position: 'absolute', right: -8, top: 22, width: 82 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.heading, color: colors.ink },
  link: { ...typography.label, color: colors.forest },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { ...typography.heading, color: colors.ink },
  statLabel: { ...typography.caption, color: colors.inkSoft, marginTop: spacing.xs },
  weekSummary: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  weekEyebrow: { ...typography.caption, color: colors.orange, fontWeight: '700' },
  weekHeadline: { ...typography.heading, color: colors.ink, marginTop: 3 },
  streak: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderRadius: radius.pill, flexDirection: 'row', gap: 3, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  streakText: { ...typography.caption, color: colors.orange, fontWeight: '700' },
  weekDays: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl },
  weekDay: { alignItems: 'center', gap: spacing.xs },
  dayLabel: { ...typography.caption, color: colors.inkSoft },
  dayLabelSelected: { color: colors.forest, fontWeight: '800' },
  dayDot: { alignItems: 'center', backgroundColor: colors.ivorySoft, borderRadius: radius.pill, height: 30, justifyContent: 'center', width: 30 },
  dayDotActive: { backgroundColor: colors.orange },
  dayDotSelected: { borderColor: colors.forest, borderWidth: 2 },
  dayButton: { alignItems: 'center', height: 30, justifyContent: 'center', width: 30 },
  dayDetail: { alignItems: 'center', backgroundColor: colors.ivory, borderRadius: radius.md, flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, padding: spacing.md },
  dayDetailIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.md, height: 38, justifyContent: 'center', width: 38 },
  dayDetailCopy: { flex: 1 },
  dayDetailTitle: { ...typography.label, color: colors.ink },
  dayDetailBody: { ...typography.caption, color: colors.inkSoft, marginTop: 2 },
  weekFooter: { borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, paddingTop: spacing.md },
  weekMetric: { ...typography.caption, color: colors.inkSoft },
  metricStrong: { color: colors.ink, fontWeight: '800' },
});
