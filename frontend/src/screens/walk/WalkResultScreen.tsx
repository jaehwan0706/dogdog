import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { photoPinService } from '../../api/map/photoPinService';
import { walkService } from '../../api/walk/walkService';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { NaverWebMap } from '../../components/map/NaverWebMap';
import { PhotoPinDetailSheet } from '../../components/map/PhotoPinSheets';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { RootScreenProps } from '../../navigation/RootNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { PhotoPin } from '../../types/photoPin';
import { confirmAction, notify } from '../../utils/dialog';
import { withJosa } from '../../utils/format';
import { formatDistance, formatDuration } from '../../utils/geo';

// 산책 결과: 경로 지도 + 거리·시간·사진. 산책 종료 직후와 (추후) 기록 목록에서 함께 쓴다
export function WalkResultScreen({ navigation, route }: RootScreenProps<'WalkResult'>) {
  const { walkId } = route.params;
  const walk = useAsyncData(() => walkService.getDetail(walkId), [walkId]);
  const pins = useAsyncData(
    async () => (await photoPinService.getMyPins()).filter((pin) => pin.walkId === walkId),
    [walkId],
  );
  const [selectedPin, setSelectedPin] = useState<PhotoPin | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <Screen
      title={title}
      subtitle={`${started.getMonth() + 1}월 ${started.getDate()}일 ${started.getHours()}시 ${String(started.getMinutes()).padStart(2, '0')}분 시작`}
      scroll={false}
      onBack={navigation.goBack}
      headerRight={(
        <Pressable accessibilityRole="button" accessibilityLabel="산책 기록 삭제" hitSlop={8} disabled={deleting} onPress={deleteWalk}>
          <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.inkSoft} />
        </Pressable>
      )}
    >
      <View style={styles.stats}>
        <Stat label="거리" value={formatDistance(data.distanceMeters)} />
        <View style={styles.divider} />
        <Stat label="시간" value={formatDuration(data.durationSeconds)} />
        <View style={styles.divider} />
        <Stat label="사진" value={`${pins.data?.length ?? 0}장`} />
      </View>

      <View style={styles.mapCard}>
        <NaverWebMap
          style={styles.map}
          initialCamera={first ? { latitude: first.latitude, longitude: first.longitude, zoom: 16 } : { latitude: 37.5666, longitude: 126.9784, zoom: 15 }}
          myLocation={null}
          follow={false}
          route={data.points}
          fitRoute
          photoPins={pins.data ?? []}
          onPhotoPinPress={(pinId) => setSelectedPin(pins.data?.find((pin) => pin.id === pinId) ?? null)}
        />
        {data.points.length < 2 && (
          <View style={styles.notice}>
            <AppCard>
              <Text style={styles.body}>경로가 기록되지 않았어요. 산책 중에는 앱을 켜 둔 채로 걸어주세요.</Text>
            </AppCard>
          </View>
        )}
      </View>

      <AppButton label="확인" onPress={navigation.goBack} />

      <PhotoPinDetailSheet pin={selectedPin} deleting={deletingPin} onClose={() => setSelectedPin(null)} onDelete={deletePin} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.section },
  body: { ...typography.body, color: colors.ink },
  stats: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', paddingVertical: spacing.lg },
  stat: { alignItems: 'center', flex: 1, gap: 2 },
  statValue: { ...typography.title, color: colors.ink },
  statLabel: { ...typography.caption, color: colors.inkSoft },
  divider: { backgroundColor: colors.line, height: 32, width: 1 },
  mapCard: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  map: { flex: 1 },
  notice: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md },
});
