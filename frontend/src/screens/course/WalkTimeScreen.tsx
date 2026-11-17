import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { useWalkTimeRecommendation } from '../../hooks/useWalkTimeRecommendation';
import type { RootScreenProps, RootStackParamList } from '../../navigation/RootNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { WalkTimeRecommendation, WalkTimeSlot } from '../../types/recommendation';
import { AIR_GRADE_COLOR, LEVEL_COLOR, conditionIcon, formatTemperature, hourLabel, slotLabel } from '../../utils/recommendation';

// 산책하기 좋은 시간: 지금 날씨·미세먼지, 추천 시간(최대 3개)과 이유, 앞으로 24시간 점수
export function WalkTimeScreen({ navigation }: RootScreenProps<'WalkTime'>) {
  const { location, recommendation } = useWalkTimeRecommendation();
  const data = recommendation.data;

  let body;
  if (location.status === 'denied' || location.status === 'error') {
    body = (
      <AppCard>
        <Text style={styles.body}>{location.status === 'denied' ? '위치를 허용하면 우리 동네 날씨와 미세먼지로 산책하기 좋은 시간을 알려드려요.' : '현재 위치를 확인하지 못했어요.'}</Text>
        <View style={styles.actionSpacing}>
          <AppButton label={location.status === 'denied' ? '위치 허용하기' : '다시 시도'} variant="secondary" onPress={location.status === 'denied' ? location.request : location.refresh} />
        </View>
      </AppCard>
    );
  } else if (!data) {
    body = (
      <View style={styles.center}>
        {recommendation.error ? (
          <>
            <Text style={styles.body}>{recommendation.error}</Text>
            <AppButton label="다시 시도" variant="ghost" onPress={recommendation.reload} />
          </>
        ) : <ActivityIndicator color={colors.forest} />}
      </View>
    );
  } else {
    body = <RecommendationBody data={data} />;
  }

  return (
    <Screen title="산책하기 좋은 시간" onBack={navigation.goBack}>
      {body}
    </Screen>
  );
}

function RecommendationBody({ data }: { data: WalkTimeRecommendation }) {
  const { current, habit } = data;
  const conditionText = [current.conditionLabel, current.temperature === null ? null : formatTemperature(current.temperature)].filter(Boolean).join(' · ');

  return (
    <>
      <AppCard>
        <View style={styles.currentRow}>
          <View style={styles.currentIcon}>
            <MaterialCommunityIcons name={conditionIcon(current.sky, current.precipitation)} size={26} color={colors.orange} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.headline}>{current.headline}</Text>
            {conditionText ? <Text style={styles.caption}>{conditionText}</Text> : null}
          </View>
        </View>
        {current.airGrade ? (
          <View style={styles.airRow}>
            <View style={[styles.airChip, { backgroundColor: AIR_GRADE_COLOR[current.airGrade] }]}>
              <Text style={styles.airChipText}>미세먼지 {current.airGradeLabel}</Text>
            </View>
            <Text style={styles.caption}>
              {[current.pm10 === null ? null : `PM10 ${current.pm10}`, current.pm25 === null ? null : `PM2.5 ${current.pm25}`].filter(Boolean).join(' · ')}
              {current.stationName ? `  (${current.stationName} 측정소)` : ''}
            </Text>
          </View>
        ) : null}
      </AppCard>

      <Text style={styles.sectionTitle}>추천 시간</Text>
      {data.bestSlots.map((slot, index) => <BestSlotCard key={slot.time} slot={slot} rank={index} isNow={slot.time === data.hourly[0]?.time} />)}
      <Text style={styles.habit}>
        {habit.favoriteHours.length > 0
          ? `최근 90일 ${habit.walkCount}회 산책 · 평소 ${habit.usualMinutes}분 · 주로 ${habit.favoriteHours.map(hourLabel).join(', ')}에 걸었어요`
          : '산책 기록이 쌓이면 평소 산책하는 시간에 맞춰 추천해 드려요.'}
      </Text>

      <Text style={styles.sectionTitle}>시간별</Text>
      <AppCard>
        {data.hourly.map((slot, index) => <HourRow key={slot.time} slot={slot} isNow={index === 0} />)}
      </AppCard>

      <Text style={styles.source}>
        날씨: 기상청 단기예보 · 미세먼지: 한국환경공단 에어코리아{'\n'}
        실시간 측정값은 확정 전 자료라 바뀔 수 있어요.
        {data.sample ? '\n지금은 서버에 공공데이터 인증키가 없어 예시 날씨로 계산했어요.' : ''}
      </Text>
    </>
  );
}

function BestSlotCard({ slot, rank, isNow }: { slot: WalkTimeSlot; rank: number; isNow: boolean }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <AppCard>
      <View style={styles.bestHeader}>
        <View style={styles.flex}>
          <Text style={styles.bestEyebrow}>{rank === 0 ? '가장 좋아요' : `추천 ${rank + 1}`}</Text>
          <Text style={styles.bestTitle}>{slotLabel(slot.time, isNow)}</Text>
        </View>
        <View style={styles.bestMeta}>
          <MaterialCommunityIcons name={conditionIcon(slot.sky, slot.precipitation, slot.time)} size={20} color={colors.inkSoft} />
          <Text style={styles.body}>{formatTemperature(slot.temperature)}</Text>
          <ScoreBadge score={slot.score} level={slot.level} />
        </View>
      </View>
      {slot.reasons.map((reason) => (
        <View key={reason} style={styles.reasonRow}>
          <MaterialCommunityIcons name="paw" size={12} color={colors.orange} />
          <Text style={styles.reason}>{reason}</Text>
        </View>
      ))}
      <View style={styles.suggestRow}>
        <Text style={styles.suggest}>권장 산책 {slot.suggestedMinutes}분</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => navigation.navigate('Course', { minutes: slot.suggestedMinutes })}>
          <Text style={styles.courseLink}>이 시간에 맞는 코스 ›</Text>
        </Pressable>
      </View>
    </AppCard>
  );
}

function HourRow({ slot, isNow }: { slot: WalkTimeSlot; isNow: boolean }) {
  return (
    <View style={styles.hourRow}>
      <Text style={[styles.hourLabel, isNow && styles.hourLabelNow]}>{slotLabel(slot.time, isNow)}</Text>
      <MaterialCommunityIcons name={conditionIcon(slot.sky, slot.precipitation, slot.time)} size={18} color={colors.inkSoft} />
      <Text style={styles.hourTemp}>{formatTemperature(slot.temperature)}</Text>
      <Text style={styles.hourPop}>{slot.precipitationProbability === null ? '' : `☂ ${slot.precipitationProbability}%`}</Text>
      <View style={[styles.airDot, { backgroundColor: slot.airGrade ? AIR_GRADE_COLOR[slot.airGrade] : colors.line }]} />
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${slot.score}%`, backgroundColor: LEVEL_COLOR[slot.level] }]} />
      </View>
      <Text style={styles.hourScore}>{slot.score}</Text>
    </View>
  );
}

function ScoreBadge({ score, level }: Pick<WalkTimeSlot, 'score' | 'level'>) {
  return (
    <View style={[styles.badge, { borderColor: LEVEL_COLOR[level] }]}>
      <Text style={[styles.badgeText, { color: LEVEL_COLOR[level] }]}>{score}점</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.section },
  body: { ...typography.body, color: colors.ink },
  caption: { ...typography.caption, color: colors.inkSoft, marginTop: 2 },
  actionSpacing: { marginTop: spacing.md },
  currentRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  currentIcon: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderRadius: radius.md, height: 48, justifyContent: 'center', width: 48 },
  headline: { ...typography.heading, color: colors.ink },
  airRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  airChip: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  airChipText: { ...typography.label, color: colors.white },
  sectionTitle: { ...typography.heading, color: colors.ink },
  bestHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  bestEyebrow: { ...typography.label, color: colors.orange },
  bestTitle: { ...typography.title, color: colors.ink },
  bestMeta: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  badge: { borderRadius: radius.pill, borderWidth: 1.5, marginLeft: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { ...typography.label },
  reasonRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  reason: { ...typography.body, color: colors.ink, flex: 1 },
  suggestRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  suggest: { ...typography.label, color: colors.forest },
  courseLink: { ...typography.label, color: colors.orange },
  habit: { ...typography.caption, color: colors.inkSoft, marginTop: -spacing.xs },
  hourRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingVertical: 7 },
  hourLabel: { ...typography.label, color: colors.inkSoft, width: 84 },
  hourLabelNow: { color: colors.forest },
  hourTemp: { ...typography.label, color: colors.ink, width: 38 },
  hourPop: { ...typography.caption, color: colors.inkFaint, width: 40 },
  airDot: { borderRadius: 99, height: 8, width: 8 },
  barTrack: { backgroundColor: colors.ivorySoft, borderRadius: radius.pill, flex: 1, height: 8, overflow: 'hidden' },
  barFill: { borderRadius: radius.pill, height: 8 },
  hourScore: { ...typography.label, color: colors.ink, textAlign: 'right', width: 24 },
  source: { ...typography.caption, color: colors.inkFaint },
});
