import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { Screen } from '../components/Screen';
import { courseService } from '../api/course/courseService';
import { walkService } from '../api/walk/walkService';
import { useAsyncData } from '../hooks/useAsyncData';
import { useWalkTimeRecommendation } from '../hooks/useWalkTimeRecommendation';
import { useMainDog } from '../store/dogStore';
import { callName, withJosa } from '../utils/format';
import { formatDistance, formatDuration } from '../utils/geo';
import { conditionIcon, formatTemperature, slotLabel } from '../utils/recommendation';
import { addDays, estimateKcal, summarize, toDateKey, walkDateKey, walkStreak, weekSummaries } from '../utils/walkStats';
import { colors, radius, spacing, typography } from '../theme';

// 반려견 이름·산책 통계는 서버 데이터, 날씨·추천 시간은 내 위치 기준 추천 API (위치 권한이 없으면 안내 문구)
export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const mainDog = useMainDog();
  const dogName = mainDog?.name ?? '우리 아이';
  const weightKg = mainDog?.weightKg;

  // 연속 산책 일수까지 보려고 이번 주보다 넉넉히 최근 60일을 받는다
  const walks = useAsyncData(() => {
    const now = new Date();
    return walkService.getMyWalks({ from: toDateKey(addDays(now, -59)), to: toDateKey(now) });
  }, []);
  // 산책을 마치고 돌아오거나 기록을 지우고 돌아오면 다시 불러온다
  const { reload } = walks;
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const today = new Date();
  const todayKey = toDateKey(today);
  const stats = useMemo(() => {
    const list = walks.data ?? [];
    const now = new Date();
    const week = weekSummaries(list, now);
    const weekKeys = new Set(week.map((day) => day.dateKey));
    return {
      today: summarize(list.filter((walk) => walkDateKey(walk) === todayKey)),
      week,
      weekTotal: summarize(list.filter((walk) => weekKeys.has(walkDateKey(walk)))),
      streak: walkStreak(list, now),
    };
  }, [walks.data, todayKey]);
  const [selectedDayIndex, setSelectedDayIndex] = useState((today.getDay() + 6) % 7);
  const selectedDay = stats.week[selectedDayIndex];
  const todayKcal = estimateKcal(stats.today.distanceMeters, weightKg);
  const selectedKcal = estimateKcal(selectedDay.distanceMeters, weightKg);
  const openHistory = () => navigation.navigate('WalkHistory');

  const { location, recommendation } = useWalkTimeRecommendation();
  const walkTimes = recommendation.data;
  const best = walkTimes?.bestSlots[0];
  const bestIsNow = best !== undefined && best.time === walkTimes?.hourly[0]?.time;
  const openWalkTime = () => navigation.navigate('WalkTime');
  // 추천 시간의 권장 산책 시간에 맞는 코스 (추천 시간을 못 받으면 서버가 평소 산책 시간으로)
  const courseMinutes = best?.suggestedMinutes;
  const position = location.location;
  const courses = useAsyncData(
    () => (position ? courseService.recommend(position, courseMinutes) : Promise.resolve(null)),
    [position?.latitude, position?.longitude, courseMinutes],
  );
  const topCourse = courses.data?.courses[0];
  const openCourse = () => navigation.navigate('Course', courseMinutes ? { minutes: courseMinutes } : undefined);
  const weather = weatherCopy();

  function weatherCopy() {
    if (location.status === 'denied') return { title: '위치를 허용하면 날씨를 알려드려요', body: '눌러서 우리 동네 날씨·미세먼지 보기' };
    if (location.status === 'error' || recommendation.error) return { title: '날씨를 불러오지 못했어요', body: '눌러서 다시 확인해 보세요' };
    if (!walkTimes) return { title: '날씨를 확인하고 있어요', body: '잠시만 기다려 주세요' };
    const { current } = walkTimes;
    const body = [current.conditionLabel, current.temperature === null ? null : formatTemperature(current.temperature), current.airGradeLabel ? `미세먼지 ${current.airGradeLabel}` : null]
      .filter(Boolean).join(' · ');
    return { title: current.headline, body: body || '날씨 정보가 없어요' };
  }

  return (
    <Screen title={`${callName(dogName)}, 오늘도 걸을까?`} subtitle="오늘의 산책을 준비해볼까요?">
      <Pressable accessibilityRole="button" accessibilityLabel="산책하기 좋은 시간 보기" onPress={openWalkTime} style={styles.weather}>
        <View style={styles.weatherIcon}><MaterialCommunityIcons name={walkTimes ? conditionIcon(walkTimes.current.sky, walkTimes.current.precipitation) : 'weather-partly-cloudy'} size={22} color={colors.orange} /></View>
        <View style={styles.weatherCopy}><Text style={styles.weatherTitle}>{weather.title}</Text><Text style={styles.weatherBody}>{weather.body}</Text></View>
        <MaterialCommunityIcons name="chevron-right" size={21} color={colors.inkFaint} />
      </Pressable>
      <View style={styles.heroCard}>
        <View style={styles.heroCopy}>
          <Text style={styles.cardLabel}>오늘의 추천 산책</Text>
          <Text style={styles.cardTitle}>{best ? (bestIsNow ? '지금 나가기 좋아요' : `${slotLabel(best.time)}가 가장 좋아요`) : '동네 한 바퀴, 가볍게'}</Text>
          <Text style={styles.cardBody}>{withJosa(dogName, '과', '와')} 함께 {best?.suggestedMinutes ?? 30}분 정도 걸어보세요.</Text>
          {best?.reasons[0] ? <Text style={styles.cardReason}>{best.reasons[0]}</Text> : null}
          {topCourse ? <Text style={styles.cardCourse}>추천 코스 · {topCourse.title} (왕복 {formatDistance(topCourse.distanceMeters)})</Text> : null}
          <View style={styles.cardLinks}>
            <Pressable accessibilityRole="button" accessibilityLabel="추천 산책 시간 자세히 보기" hitSlop={8} onPress={openWalkTime}><Text style={styles.cardMore}>시간별 추천 ›</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="맞춤 산책 코스 보기" hitSlop={8} onPress={openCourse}><Text style={styles.cardMore}>코스 보기 ›</Text></Pressable>
          </View>
        </View>
        <View style={styles.heroPaw}><MaterialCommunityIcons name="paw" size={42} color={colors.orange} /></View>
        <View style={styles.buttonSpacing}>
          <AppButton label="산책 시작하기" variant="secondary" onPress={() => navigation.navigate('Walk')} />
        </View>
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>오늘의 활동</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={openHistory}><Text style={styles.link}>기록 보기</Text></Pressable>
      </View>
      <AppCard>
        <View style={styles.stats}>
          <Stat value={formatDistance(stats.today.distanceMeters)} label="거리" />
          <Stat value={formatDuration(stats.today.durationSeconds)} label="산책 시간" />
          <Stat value={todayKcal === null ? '-' : `${todayKcal} kcal`} label={todayKcal === null ? '칼로리 (체중 필요)' : '소모 칼로리'} />
        </View>
        {walks.error ? <Text style={styles.loadError}>산책 기록을 불러오지 못했어요.</Text> : null}
      </AppCard>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>이번 주 활동</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={openHistory}><Text style={styles.link}>자세히 보기</Text></Pressable>
      </View>
      <AppCard>
        <View style={styles.weekSummary}>
          <View><Text style={styles.weekEyebrow}>이번 주 산책</Text><Text style={styles.weekHeadline}>{stats.weekTotal.count > 0 ? '꾸준히 잘 걷고 있어요!' : '이번 주 산책을 시작해볼까요?'}</Text></View>
          {stats.streak > 0 ? <View style={styles.streak}><MaterialCommunityIcons name="fire" size={15} color={colors.orange} /><Text style={styles.streakText}>{stats.streak}일 연속</Text></View> : null}
        </View>
        <View style={styles.weekDays}>
          {stats.week.map(({ day, count }, index) => {
            const selected = selectedDayIndex === index;
            const walked = count > 0;

            return <View key={day} style={styles.weekDay}><Text style={[styles.dayLabel, selected && styles.dayLabelSelected]}>{day}</Text><View style={[styles.dayDot, walked && styles.dayDotActive, selected && (walked ? styles.dayDotSelectedActive : styles.dayDotSelected)]}><Pressable accessibilityRole="button" accessibilityLabel={`${day}요일 산책 기록 보기`} accessibilityState={{ selected }} onPress={() => setSelectedDayIndex(index)} style={styles.dayButton}>{walked ? <MaterialCommunityIcons name="paw" size={12} color={colors.white} /> : null}</Pressable></View></View>;
          })}
        </View>
        <Pressable accessibilityRole="button" onPress={openHistory} style={styles.dayDetail}>
          <View style={styles.dayDetailIcon}><MaterialCommunityIcons name={selectedDay.count > 0 ? 'walk' : 'calendar-blank-outline'} size={20} color={selectedDay.count > 0 ? colors.forest : colors.inkFaint} /></View>
          <View style={styles.dayDetailCopy}><Text style={styles.dayDetailTitle}>{selectedDay.day}요일 산책 기록</Text>{selectedDay.count > 0 ? <Text style={styles.dayDetailBody}>{selectedDay.count}회 · {formatDistance(selectedDay.distanceMeters)} · {formatDuration(selectedDay.durationSeconds)}{selectedKcal === null ? '' : ` · ${selectedKcal}kcal`}</Text> : <Text style={styles.dayDetailBody}>{selectedDay.dateKey > todayKey ? '아직 오지 않은 날이에요.' : '기록이 없어요. 가볍게 산책을 시작해볼까요?'}</Text>}</View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.inkFaint} />
        </Pressable>
        <View style={styles.weekFooter}><Text style={styles.weekMetric}><Text style={styles.metricStrong}>{stats.weekTotal.count}회</Text> 산책</Text><Text style={styles.weekMetric}><Text style={styles.metricStrong}>{formatDistance(stats.weekTotal.distanceMeters)}</Text> 총 거리</Text><Text style={styles.weekMetric}><Text style={styles.metricStrong}>{formatDuration(stats.weekTotal.durationSeconds)}</Text> 함께한 시간</Text></View>
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
  cardTitle: { ...typography.heading, color: colors.ivory, marginTop: spacing.sm },
  cardBody: { ...typography.body, color: '#C7D6CC', marginTop: spacing.xs },
  cardReason: { ...typography.label, color: colors.orangeSoft, marginTop: spacing.sm },
  cardCourse: { ...typography.label, color: colors.ivory, marginTop: spacing.sm },
  cardLinks: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  cardMore: { ...typography.label, color: colors.ivory, textDecorationLine: 'underline' },
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
  dayDotSelected: { backgroundColor: colors.forestSoft, borderColor: colors.forest, borderWidth: 2 },
  dayDotSelectedActive: { backgroundColor: colors.forest, borderColor: colors.forest, borderWidth: 2, transform: [{ scale: 1.08 }] },
  dayButton: { alignItems: 'center', height: 30, justifyContent: 'center', width: 30 },
  dayDetail: { alignItems: 'center', backgroundColor: colors.ivory, borderRadius: radius.md, flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, padding: spacing.md },
  dayDetailIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.md, height: 38, justifyContent: 'center', width: 38 },
  dayDetailCopy: { flex: 1 },
  dayDetailTitle: { ...typography.label, color: colors.ink },
  dayDetailBody: { ...typography.caption, color: colors.inkSoft, marginTop: 2 },
  weekFooter: { borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, paddingTop: spacing.md },
  weekMetric: { ...typography.caption, color: colors.inkSoft },
  metricStrong: { color: colors.ink, fontWeight: '800' },
  loadError: { ...typography.caption, color: colors.inkSoft, marginTop: spacing.md, textAlign: 'center' },
});
