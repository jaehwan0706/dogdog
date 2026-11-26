import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { photoPinService } from '../../api/map/photoPinService';
import { walkService } from '../../api/walk/walkService';
import { AppButton } from '../../components/AppButton';
import { Screen } from '../../components/Screen';
import { NaverWebMap } from '../../components/map/NaverWebMap';
import { ROUTE_ENDPOINTS } from '../../components/map/naverMapHtml';
import { PhotoPinDetailSheet } from '../../components/map/PhotoPinSheets';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useStartCamera } from '../../hooks/useStartCamera';
import type { RootScreenProps } from '../../navigation/RootNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { PhotoPin } from '../../types/photoPin';
import { confirmAction, notify } from '../../utils/dialog';
import { withJosa } from '../../utils/format';
import { formatClock, formatDistance } from '../../utils/geo';
import { ROUTE_UNKNOWN_SPEED_COLOR, WALK_SPEED_BANDS, walkRouteSpeedSegments } from '../../utils/walkRouteSpeed';

// 산책 결과: 경로 지도 + 거리·시간·사진. 산책 종료 직후와 산책 기록 목록(WalkHistoryScreen)에서 함께 쓴다
export function WalkResultScreen({ navigation, route }: RootScreenProps<'WalkResult'>) {
  const { walkId } = route.params;
  const walk = useAsyncData(() => walkService.getDetail(walkId), [walkId]);
  const pins = useAsyncData(
    async () => (await photoPinService.getMyPins()).filter((pin) => pin.walkId === walkId),
    [walkId],
  );
  const [selectedPin, setSelectedPin] = useState<PhotoPin | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { width } = useWindowDimensions();

  const deleteWalk = () =>
    confirmAction({
      title: '이 산책 기록을 삭제할까요?',
      message: '경로와 시간이 지워져요. 사진 핀은 지도에 그대로 남아요.',
      confirmText: '삭제',
      destructive: true,
      onConfirm: async () => {
        setDeleting(true);
        try {
          await walkService.remove(walkId);
          navigation.goBack();
        } catch (e) {
          notify('삭제하지 못했어요', e instanceof Error ? e.message : undefined);
          setDeleting(false);
        }
      },
    });

  const [deletingPin, setDeletingPin] = useState(false);
  const deletePin = (pin: PhotoPin) =>
    confirmAction({
      title: '사진 핀을 삭제할까요?',
      message: '삭제한 사진은 되돌릴 수 없어요.',
      confirmText: '삭제',
      destructive: true,
      onConfirm: async () => {
        setDeletingPin(true);
        try {
          await photoPinService.deletePin(pin.id);
          pins.setData((current) => (current ?? []).filter((item) => item.id !== pin.id));
          setSelectedPin(null);
        } catch (e) {
          notify('삭제하지 못했어요', e instanceof Error ? e.message : undefined);
        } finally {
          setDeletingPin(false);
        }
      },
    });

  const data = walk.data;
  const speedSegments = useMemo(() => data ? walkRouteSpeedSegments(data.points) : [], [data]);
  // 경로·사진이 없는 짧은 산책이면 지난번 내 위치에서 보여준다 (없으면 서울시청)
  const startCamera = useStartCamera(16);
  const firstPhoto = pins.data?.[0];
  const photoCamera = useMemo(() => firstPhoto && (data?.points.length ?? 0) < 2
    ? { latitude: firstPhoto.latitude, longitude: firstPhoto.longitude, zoom: 16 }
    : null, [data, firstPhoto]);
  if (!data) {
    return (
      <Screen title="산책 기록" onBack={navigation.goBack}>
        <View style={styles.center}>
          {walk.error ? (
            <>
              <Text style={styles.body}>{walk.error}</Text>
              <AppButton label="다시 시도" variant="ghost" onPress={walk.reload} />
            </>
          ) : <ActivityIndicator color={colors.forest} />}
        </View>
      </Screen>
    );
  }

  const first = data.points[0];
  const started = new Date(Date.parse(data.startedAt));
  const title = data.dogName ? `${withJosa(data.dogName, '과', '와')} 함께 걸었어요` : '산책을 마쳤어요';
  const distance = formatDistance(data.distanceMeters);
  const distanceUnit = distance.endsWith('km') ? 'km' : 'm';
  const photoCount = pins.data ? `${pins.data.length}장` : '—';

  return (
    <Screen
      title={title}
      subtitle={`${started.getMonth() + 1}월 ${started.getDate()}일 ${started.getHours()}시 ${String(started.getMinutes()).padStart(2, '0')}분 시작`}
      onBack={navigation.goBack}
      headerRight={(
        <Pressable accessibilityRole="button" accessibilityLabel="산책 기록 삭제" hitSlop={8} disabled={deleting} onPress={deleteWalk}>
          <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.inkSoft} />
        </Pressable>
      )}
    >
      <View style={styles.content}>
        <View style={styles.summary}>
          <View style={styles.distanceHeader}>
            <Text style={styles.distanceLabel}>산책 거리</Text>
            <View style={styles.paw}>
              <MaterialCommunityIcons name="paw" size={23} color={colors.forest} />
            </View>
          </View>
          <Text style={styles.distanceValue}>
            {distance.slice(0, -distanceUnit.length)} <Text style={styles.distanceUnit}>{distanceUnit}</Text>
          </Text>
          <View style={styles.stats}>
            <Stat icon="clock-outline" label="산책 시간" value={formatClock(data.durationSeconds)} />
            <Stat icon="camera-outline" label="사진" value={photoCount} />
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>걸어온 길</Text>
            {data.points.length > 1 && (
              <View style={styles.legend}>
                {ROUTE_ENDPOINTS.map(({ label, color }) => (
                  <View key={label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: color }]} />
                    <Text style={styles.legendLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View style={[styles.mapFrame, { height: Math.max(260, Math.min(width - spacing.xl * 2, 420)) }]}>
            {/* 지도는 처음 만들 때만 시작 위치를 읽으므로, 경로·사진이 없으면 지난번 위치를 읽은 뒤에 만든다 */}
            {(photoCamera || first || startCamera) && <NaverWebMap
              style={styles.map}
              initialCamera={photoCamera ?? (first ? { latitude: first.latitude, longitude: first.longitude, zoom: 16 } : startCamera!)}
              myLocation={null}
              follow={false}
              moveTo={photoCamera}
              route={data.points}
              showRouteEndpoints
              routeSpeedSegments={speedSegments}
              fitRoute
              photoPins={pins.data ?? undefined}
              compactPhotoPins
              onPhotoPinPress={(pinId) => setSelectedPin(pins.data?.find((pin) => pin.id === pinId) ?? null)}
            />}
          </View>
          {speedSegments.length > 0 && (
            <View style={styles.speedLegend}>
              <Text style={styles.legendLabel}>속도 (km/h)</Text>
              {WALK_SPEED_BANDS.map(({ label, color }) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendLine, { backgroundColor: color }]} />
                  <Text style={styles.legendLabel}>{label}</Text>
                </View>
              ))}
              {speedSegments.some(({ color }) => color === ROUTE_UNKNOWN_SPEED_COLOR) && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendLine, { backgroundColor: ROUTE_UNKNOWN_SPEED_COLOR }]} />
                  <Text style={styles.legendLabel}>미측정</Text>
                </View>
              )}
            </View>
          )}
          {data.points.length < 2 && (
            <Text style={styles.notice}>기록된 산책 경로가 없어요.</Text>
          )}
          {pins.error && (
            <Pressable accessibilityRole="button" style={styles.notice} onPress={pins.reload}>
              <Text style={styles.legendLabel}>사진을 불러오지 못했어요. 다시 시도</Text>
            </Pressable>
          )}
        </View>

        <AppButton label="확인" onPress={navigation.goBack} />
      </View>

      <PhotoPinDetailSheet pin={selectedPin} deleting={deletingPin} onClose={() => setSelectedPin(null)} onDelete={deletePin} />
    </Screen>
  );
}

function Stat({ icon, label, value }: { icon: 'clock-outline' | 'camera-outline'; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons name={icon} size={19} color={colors.forestMuted} />
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.section },
  body: { ...typography.body, color: colors.ink },
  content: { gap: spacing.lg, maxWidth: 600, width: '100%', alignSelf: 'center' },
  summary: { backgroundColor: colors.forestSoft, borderColor: colors.line, borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  distanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  distanceLabel: { ...typography.label, color: colors.forest },
  paw: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  distanceValue: { ...typography.display, fontSize: 42, lineHeight: 49, fontVariant: ['tabular-nums'], color: colors.forestDeep },
  distanceUnit: { ...typography.heading, color: colors.forestMuted },
  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.ivory },
  statValue: { ...typography.heading, fontVariant: ['tabular-nums'], color: colors.ink },
  statLabel: { ...typography.caption, color: colors.forestMuted },
  mapCard: { borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, overflow: 'hidden' },
  mapHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, padding: spacing.lg },
  mapTitle: { ...typography.heading, color: colors.ink },
  mapFrame: { overflow: 'hidden', backgroundColor: colors.ivorySoft },
  map: { flex: 1 },
  legend: { flexDirection: 'row', gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  speedLegend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  legendLine: { width: 12, height: 5, borderRadius: 3 },
  legendLabel: { ...typography.caption, color: colors.ink },
  notice: { ...typography.caption, color: colors.inkSoft, padding: spacing.lg },
});
