import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { courseService } from '../../api/course/courseService';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { NaverWebMap } from '../../components/map/NaverWebMap';
import { FACILITY_MARKER_STYLE } from '../../components/map/naverMapHtml';
import { Screen } from '../../components/Screen';
import { useApproxLocation } from '../../hooks/useApproxLocation';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { RootScreenProps } from '../../navigation/RootNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { Course } from '../../types/course';
import { formatDistance } from '../../utils/geo';

// 맞춤 산책 코스: 주변 공원(공공데이터)과 내가 걸었던 길 중 목표 시간에 맞는 코스. 고르면 지도에 표시
export function CourseScreen({ navigation, route }: RootScreenProps<'Course'>) {
  const minutes = route.params?.minutes;
  const location = useApproxLocation();
  const position = location.location;
  const recommendation = useAsyncData(
    () => (position ? courseService.recommend(position, minutes) : Promise.resolve(null)),
    [position?.latitude, position?.longitude, minutes],
  );
  const data = recommendation.data;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const courses = data?.courses ?? [];
  const selected = courses.find((course) => course.id === selectedId) ?? courses[0] ?? null;

  const markers = useMemo(
    () => courses.map((course, index) => ({ id: index, latitude: course.latitude, longitude: course.longitude, category: course.type })),
    [courses],
  );
  // 내 경로는 실제 좌표, 공원은 지금 위치에서 공원까지 직선 (실제 길 안내는 아님)
  const routeLine = useMemo(() => {
    if (!selected || !position) return [];
    return selected.type === 'MY_ROUTE' ? selected.path : [position, { latitude: selected.latitude, longitude: selected.longitude }];
  }, [selected, position]);
  const myLocation = useMemo(
    () => (position ? { ...position, accuracy: null, timestamp: 0 } : null),
    [position],
  );

  let body;
  if (location.status === 'denied' || location.status === 'error') {
    body = (
      <AppCard>
        <Text style={styles.body}>{location.status === 'denied' ? '위치를 허용하면 내 주변 공원과 전에 걸었던 길로 코스를 추천해 드려요.' : '현재 위치를 확인하지 못했어요.'}</Text>
        <View style={styles.actionSpacing}>
          <AppButton label={location.status === 'denied' ? '위치 허용하기' : '다시 시도'} variant="secondary" onPress={location.status === 'denied' ? location.request : location.refresh} />
        </View>
      </AppCard>
    );
  } else if (!data || !position) {
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
    body = (
      <>
        <Text style={styles.target}>
          목표 {data.targetMinutes}분 · 약 {formatDistance(data.targetMeters)}
          {minutes ? ' (날씨를 반영한 권장 시간)' : ' (평소 산책 시간)'}
        </Text>
        <View style={styles.mapCard}>
          <NaverWebMap
            style={styles.map}
            initialCamera={{ latitude: position.latitude, longitude: position.longitude, zoom: 15 }}
            myLocation={myLocation}
            follow={false}
            facilities={markers}
            onFacilityPress={(index) => setSelectedId(courses[index]?.id ?? null)}
            route={routeLine}
            fitRoute
          />
        </View>
        {courses.length === 0 ? (
          <AppCard><Text style={styles.body}>반경 3km 안에서 공원을 찾지 못했어요. 지도 탭에서 가까운 시설을 둘러보세요.</Text></AppCard>
        ) : courses.map((course, index) => (
          <CourseCard key={course.id} course={course} rank={index} selected={course.id === selected?.id} onPress={() => setSelectedId(course.id)} />
        ))}
        <Text style={styles.source}>
          공원 정보: 전국도시공원정보표준데이터(공공데이터포털). 공원 거리는 직선거리로 추정한 값이라 실제 길과 다를 수 있어요.
          일부 공원은 반려견 출입이 제한될 수 있으니 현장 안내를 확인해 주세요.
        </Text>
        <AppButton label="산책 시작하기" onPress={() => navigation.navigate('Walk')} />
      </>
    );
  }

  return (
    <Screen title="맞춤 산책 코스" onBack={navigation.goBack}>
      {body}
    </Screen>
  );
}

function CourseCard({ course, rank, selected, onPress }: { course: Course; rank: number; selected: boolean; onPress: () => void }) {
  const look = FACILITY_MARKER_STYLE[course.type];
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { borderColor: look?.color ?? colors.line }]}><Text style={styles.badgeEmoji}>{look?.emoji ?? '🐾'}</Text></View>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>{rank === 0 ? '가장 잘 맞아요' : course.type === 'MY_ROUTE' ? '익숙한 길' : '추천 공원'}</Text>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.caption}>{course.subtitle}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaValue}>{formatDistance(course.distanceMeters)}</Text>
          <Text style={styles.caption}>왕복 약 {course.estimatedMinutes}분</Text>
        </View>
      </View>
      {course.reasons.map((reason) => (
        <View key={reason} style={styles.reasonRow}>
          <MaterialCommunityIcons name="paw" size={12} color={colors.orange} />
          <Text style={styles.reason}>{reason}</Text>
        </View>
      ))}
      {selected && course.nearbyFacilities.length > 0 ? (
        <View style={styles.nearby}>
          {course.nearbyFacilities.map((facility) => (
            <Text key={facility.id} style={styles.nearbyItem}>
              {FACILITY_MARKER_STYLE[facility.category]?.emoji ?? '🐾'} {facility.name} · {formatDistance(facility.distanceMeters)}
            </Text>
          ))}
        </View>
      ) : null}
      {selected && course.address ? <Text style={styles.caption}>{course.address}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.section },
  body: { ...typography.body, color: colors.ink },
  actionSpacing: { marginTop: spacing.md },
  target: { ...typography.label, color: colors.forest },
  mapCard: { borderRadius: radius.lg, height: 260, overflow: 'hidden' },
  map: { flex: 1 },
  card: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.xs, padding: spacing.lg },
  cardSelected: { borderColor: colors.forest, borderWidth: 2 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xs },
  badge: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 99, borderWidth: 3, height: 40, justifyContent: 'center', width: 40 },
  badgeEmoji: { fontSize: 18 },
  eyebrow: { ...typography.label, color: colors.orange },
  title: { ...typography.heading, color: colors.ink },
  caption: { ...typography.caption, color: colors.inkSoft },
  meta: { alignItems: 'flex-end' },
  metaValue: { ...typography.heading, color: colors.forest },
  reasonRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  reason: { ...typography.body, color: colors.ink, flex: 1 },
  nearby: { backgroundColor: colors.ivory, borderRadius: radius.md, gap: 2, marginTop: spacing.xs, padding: spacing.sm },
  nearbyItem: { ...typography.caption, color: colors.ink },
  source: { ...typography.caption, color: colors.inkFaint },
});
