import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePreventRemove } from '@react-navigation/native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { photoPinService } from '../../api/map/photoPinService';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { NaverWebMap } from '../../components/map/NaverWebMap';
import { PhotoPinCreateSheet } from '../../components/map/PhotoPinSheets';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { useLocationPermission } from '../../hooks/useLocationPermission';
import { useWalkRecorder } from '../../hooks/useWalkRecorder';
import type { RootScreenProps } from '../../navigation/RootNavigator';
import { useMainDog } from '../../store/dogStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { PhotoPin, PickedPhoto } from '../../types/photoPin';
import { confirmAction, notify } from '../../utils/dialog';
import { withJosa } from '../../utils/format';
import { formatClock, formatDistance } from '../../utils/geo';
import { pickPhoto, type PhotoSource } from '../../utils/pickPhoto';

// 위치를 받기 전 기본으로 보여줄 좌표 (서울시청)
const DEFAULT_CAMERA = { latitude: 37.5666, longitude: 126.9784, zoom: 16 };
const KEEP_AWAKE_TAG = 'walk-recording';

// 산책 중 화면: 실시간 경로·거리·시간, 사진 핀 남기기, 종료/취소.
// Expo Go 는 앱이 화면에 떠 있을 때만 위치를 받을 수 있어 산책 중에는 앱을 켜 두어야 한다
export function WalkScreen({ navigation }: RootScreenProps<'Walk'>) {
  const dog = useMainDog();
  const { status, request } = useLocationPermission();
  const hasLocation = status === 'granted';
  const location = useCurrentLocation(hasLocation);
  const recorder = useWalkRecorder({ enabled: hasLocation, location, dogId: dog?.id });
  const [follow, setFollow] = useState(true);

  // 이번 산책 중 남긴 사진 핀 (이어하기면 이미 남긴 것도 불러옴)
  const [walkPins, setWalkPins] = useState<PhotoPin[]>([]);
  const [draft, setDraft] = useState<{ photo: PickedPhoto; latitude: number; longitude: number } | null>(null);
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    if (!recorder.walkId || !recorder.resumed) return;
    photoPinService.getMyPins()
      .then((pins) => setWalkPins(pins.filter((pin) => pin.walkId === recorder.walkId)))
      .catch(() => {});
  }, [recorder.walkId, recorder.resumed]);

  // 종료(→ 결과 화면)·취소(→ 이전 화면)가 끝나 화면을 떠나는 중이면 뒤로가기를 막지 않는다
  const [leaving, setLeaving] = useState<{ to: 'result'; walkId: number } | { to: 'back' } | null>(null);
  const busy = recorder.phase === 'ending';

  const finish = async () => {
    try {
      const finished = await recorder.end();
      if (finished) setLeaving({ to: 'result', walkId: finished.id });
    } catch (e) {
      notify('산책을 저장하지 못했어요', `${e instanceof Error ? e.message : ''}\n기록은 그대로 있으니 잠시 후 다시 눌러주세요.`);
    }
  };

  const discard = async () => {
    try {
      await recorder.cancel();
      setLeaving({ to: 'back' });
    } catch (e) {
      notify('산책을 취소하지 못했어요', e instanceof Error ? e.message : undefined);
    }
  };

  // leaving 이 반영돼 usePreventRemove 가 꺼진 다음 렌더에서 이동해야 막히지 않는다
  useEffect(() => {
    if (!leaving) return;
    if (leaving.to === 'result') navigation.replace('WalkResult', { walkId: leaving.walkId });
    else navigation.goBack();
  }, [leaving, navigation]);

  const askFinish = () =>
    confirmAction({
      title: '산책을 마칠까요?',
      message: `${formatDistance(recorder.distanceMeters)} · ${formatClock(recorder.elapsedSeconds)} 걸었어요.`,
      confirmText: '종료하고 저장',
      cancelText: '계속 걷기',
      onConfirm: finish,
    });

  const askDiscard = () =>
    confirmAction({
      title: '이번 산책 기록을 지울까요?',
      message: '경로와 시간이 저장되지 않아요. 남긴 사진 핀은 지도에 그대로 남아요.',
      confirmText: '기록 지우기',
      cancelText: '계속 걷기',
      destructive: true,
      // 취소는 결과 화면 없이 바로 이전 화면으로
      onConfirm: discard,
    });

  // 안드로이드 뒤로가기 등으로 나가려 할 때: 시작 전·실패 상태면 그냥 나가고, 기록 중이면 확인
  const recording = recorder.phase === 'recording' || recorder.phase === 'ending';

  // 기록 중에는 화면이 자동으로 꺼지지 않게 함. Expo Go 는 화면이 꺼지면(백그라운드) 위치를 못 받아
  // 그 구간 경로가 직선으로 이어지기 때문 (백그라운드 추적은 dev build 전환 시 추가)
  useEffect(() => {
    if (!recording) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [recording]);

  usePreventRemove(recording && !leaving, () => {
    if (!busy) askFinish();
  });

  const startPhotoPin = () => {
    if (!location) {
      notify('현재 위치를 확인하는 중이에요', '위치가 잡힌 뒤에 사진 핀을 남길 수 있어요.');
      return;
    }
    const { latitude, longitude } = location;
    const pick = async (source: PhotoSource) => {
      const photo = await pickPhoto(source);
      if (photo) setDraft({ photo, latitude, longitude });
    };
    if (Platform.OS === 'web') {
      pick('library');
      return;
    }
    Alert.alert('사진 핀 남기기', '지금 위치에 남길 사진을 골라주세요.', [
      { text: '사진 찍기', onPress: () => pick('camera') },
      { text: '앨범에서 선택', onPress: () => pick('library') },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const savePhotoPin = async (memo: string) => {
    if (!draft || !recorder.walkId) return;
    setSavingPin(true);
    try {
      const created = await photoPinService.createPin({ ...draft, memo: memo || undefined, walkId: recorder.walkId });
      setWalkPins((current) => [created, ...current]);
      setDraft(null);
    } catch (e) {
      notify('사진 핀을 저장하지 못했어요', e instanceof Error ? e.message : undefined);
    } finally {
      setSavingPin(false);
    }
  };

  const withDog = dog ? `${withJosa(dog.name, '과', '와')} 함께 걷는 중` : '산책 중';

  return (
    <Screen title="산책 중" subtitle={recorder.resumed ? `${withDog} · 이어서 기록하고 있어요` : withDog} scroll={false}>
      <View style={styles.stats}>
        <Stat label="시간" value={formatClock(recorder.elapsedSeconds)} />
        <View style={styles.divider} />
        <Stat label="거리" value={formatDistance(recorder.distanceMeters)} />
        <View style={styles.divider} />
        <Stat label="사진" value={`${walkPins.length}장`} />
      </View>

      <View style={styles.mapCard}>
        <NaverWebMap
          style={styles.map}
          initialCamera={DEFAULT_CAMERA}
          myLocation={location}
          follow={follow}
          onUserGesture={() => setFollow(false)}
          route={recorder.route}
          photoPins={walkPins}
        />
        {location && (
          <Pressable style={styles.locationButton} onPress={() => setFollow(true)} accessibilityRole="button" accessibilityLabel="내 위치로 이동">
            <MaterialCommunityIcons name={follow ? 'crosshairs-gps' : 'crosshairs'} size={22} color={follow ? colors.forest : colors.inkSoft} />
          </Pressable>
        )}
        {recorder.phase === 'recording' && (
          <Pressable style={styles.photoButton} onPress={startPhotoPin} accessibilityRole="button" accessibilityLabel="사진 핀 남기기">
            <MaterialCommunityIcons name="camera-plus-outline" size={22} color={colors.white} />
          </Pressable>
        )}

        {(status === 'denied' || status === 'blocked') && (
          <Overlay>
            <Text style={styles.overlayText}>산책 경로를 기록하려면 위치 권한이 필요해요.</Text>
            <AppButton
              label={status === 'blocked' ? '설정에서 허용하기' : '권한 허용하기'}
              onPress={() => (status === 'blocked' ? Linking.openSettings() : request())}
            />
            <AppButton label="돌아가기" variant="ghost" onPress={navigation.goBack} />
          </Overlay>
        )}
        {hasLocation && recorder.phase === 'preparing' && (
          <Overlay>
            <ActivityIndicator color={colors.forest} />
            <Text style={styles.overlayText}>산책을 준비하고 있어요</Text>
          </Overlay>
        )}
        {recorder.phase === 'failed' && (
          <Overlay>
            <Text style={styles.overlayText}>{recorder.error}</Text>
            <AppButton label="다시 시도" onPress={recorder.retry} />
            <AppButton label="돌아가기" variant="ghost" onPress={navigation.goBack} />
          </Overlay>
        )}
      </View>

      {recording && (
        <View style={styles.actions}>
          <View style={styles.actionGrow}>
            <AppButton label={busy ? '저장하는 중…' : '산책 종료'} disabled={busy} onPress={askFinish} />
          </View>
          <Pressable style={styles.discard} disabled={busy} onPress={askDiscard} accessibilityRole="button" accessibilityLabel="산책 기록 지우기">
            <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.inkSoft} />
          </Pressable>
        </View>
      )}

      <PhotoPinCreateSheet photo={draft?.photo ?? null} saving={savingPin} onCancel={() => setDraft(null)} onSave={savePhotoPin} />
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

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.overlay}>
      <AppCard>
        <View style={styles.overlayBody}>{children}</View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', paddingVertical: spacing.lg },
  stat: { alignItems: 'center', flex: 1, gap: 2 },
  statValue: { ...typography.title, color: colors.ink, fontVariant: ['tabular-nums'] },
  statLabel: { ...typography.caption, color: colors.inkSoft },
  divider: { backgroundColor: colors.line, height: 32, width: 1 },
  mapCard: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  map: { flex: 1 },
  locationButton: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: 99, borderWidth: 1, height: 42, justifyContent: 'center', position: 'absolute', right: spacing.md, top: spacing.md, width: 42 },
  photoButton: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: 99, bottom: spacing.md, elevation: 3, height: 52, justifyContent: 'center', position: 'absolute', right: spacing.md, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, width: 52 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(245, 247, 245, 0.7)', justifyContent: 'center', padding: spacing.lg },
  overlayBody: { alignItems: 'stretch', gap: spacing.md },
  overlayText: { ...typography.body, color: colors.ink, textAlign: 'center' },
  actions: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  actionGrow: { flex: 1 },
  discard: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
});
