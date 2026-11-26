import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { facilityService } from '../../api/facility/facilityService';
import { photoPinService } from '../../api/map/photoPinService';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { FacilityDetailSheet } from '../../components/map/FacilitySheets';
import { NaverWebMap } from '../../components/map/NaverWebMap';
import type { MapMoveTo, MapViewport } from '../../components/map/naverMapCommon';
import { PhotoPinCreateSheet, PhotoPinDetailSheet } from '../../components/map/PhotoPinSheets';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { FACILITY_NOTICE_TEXT, useFacilitiesInView } from '../../hooks/useFacilitiesInView';
import { useLocationPermission } from '../../hooks/useLocationPermission';
import { useMainDog } from '../../store/dogStore';
import { colors, radius, spacing, typography } from '../../theme';
import { FACILITY_GROUPS, type FacilityGroup, type FacilitySummary } from '../../types/facility';
import type { PhotoPin, PickedPhoto } from '../../types/photoPin';
import { confirmAction, notify } from '../../utils/dialog';
import { withJosa } from '../../utils/format';
import { pickPhoto, type PhotoSource } from '../../utils/pickPhoto';

// 위치를 받기 전 기본으로 보여줄 좌표 (서울시청)
const DEFAULT_CAMERA = { latitude: 37.5666, longitude: 126.9784, zoom: 15 };

type MapFilter = 'all' | 'photo' | 'facility';

export function MapScreen() {
  const withDog = withJosa(useMainDog()?.name ?? '우리 아이', '과', '와');
  const { status, request } = useLocationPermission();
  const hasLocation = status === 'granted';
  const myLocation = useCurrentLocation(hasLocation);
  // 처음엔 내 위치를 따라가고, 지도를 직접 끌면 멈춤 → 내 위치 버튼으로 다시 켬
  const [follow, setFollow] = useState(true);
  const [filter, setFilter] = useState<MapFilter>('all');

  const pins = useAsyncData(() => photoPinService.getMyPins(), []);
  // 사진 주소(서명)는 1시간 뒤 만료되므로 지도 탭에 돌아올 때마다 다시 불러옴 (첫 진입은 useAsyncData 가 처리)
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) pins.reload();
      focusedOnce.current = true;
    }, [pins.reload]),
  );
  // 친화시설 필터에서는 사진 핀을, 사진 핀 필터에서는 시설을 숨김
  const visiblePins = useMemo(() => (filter === 'facility' ? [] : pins.data ?? []), [filter, pins.data]);
  const showFacilities = filter !== 'photo';

  // 친화시설: 지도가 멈출 때마다 보이는 범위 안의 시설을 불러옴
  const [viewport, setViewport] = useState<MapViewport | null>(null);
  const [group, setGroup] = useState<FacilityGroup | undefined>(undefined);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  const [moveTo, setMoveTo] = useState<MapMoveTo | null>(null);
  const { facilities, loading: facilityLoading, notice: facilityNotice } = useFacilitiesInView({
    enabled: showFacilities,
    viewport,
    categories: FACILITY_GROUPS.find((item) => item.value === group)?.categories,
  });

  // 시설 이름 검색 (지도 가운데에서 가까운 순)
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FacilitySummary[] | null>(null);
  const [searching, setSearching] = useState(false);

  const searchFacilities = async () => {
    const keyword = query.trim();
    if (!keyword) return;
    Keyboard.dismiss();
    const center = viewport
      ? { latitude: (viewport.swLat + viewport.neLat) / 2, longitude: (viewport.swLng + viewport.neLng) / 2 }
      : myLocation ?? DEFAULT_CAMERA;
    setSearching(true);
    try {
      setSearchResults(await facilityService.search(keyword, center));
    } catch (e) {
      notify('검색하지 못했어요', e instanceof Error ? e.message : undefined);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults(null);
  };

  const selectSearchResult = (facility: FacilitySummary) => {
    setSearchResults(null);
    setFollow(false);
    if (filter === 'photo') setFilter('all');
    // 검색 결과가 지금 분류 칩에 안 맞으면 칩을 풀어서 마커가 보이게 함
    if (group && !FACILITY_GROUPS.find((item) => item.value === group)?.categories.includes(facility.category)) setGroup(undefined);
    setMoveTo({ latitude: facility.latitude, longitude: facility.longitude, zoom: 17 });
    setSelectedFacilityId(facility.id);
  };

  // 사진 핀 만들기: 버튼 누른 순간의 위치 → 사진 고르기 → 미리보기·메모 → 저장
  const [draft, setDraft] = useState<{ photo: PickedPhoto; latitude: number; longitude: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedPin, setSelectedPin] = useState<PhotoPin | null>(null);
  const [deleting, setDeleting] = useState(false);

  const startPhotoPin = () => {
    if (!myLocation) {
      notify('현재 위치를 확인하는 중이에요', '위치가 잡힌 뒤에 사진 핀을 남길 수 있어요.');
      return;
    }
    const { latitude, longitude } = myLocation;
    const pick = async (source: PhotoSource) => {
      const photo = await pickPhoto(source);
      if (photo) setDraft({ photo, latitude, longitude });
    };
    // 웹은 Alert 버튼이 동작하지 않아 바로 파일 선택
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
    if (!draft) return;
    setSaving(true);
    try {
      const created = await photoPinService.createPin({ ...draft, memo: memo || undefined });
      pins.setData((current) => [created, ...(current ?? [])]);
      setDraft(null);
    } catch (e) {
      notify('사진 핀을 저장하지 못했어요', e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const deletePhotoPin = (pin: PhotoPin) =>
    confirmAction({
      title: '사진 핀을 삭제할까요?',
      message: '삭제한 사진은 되돌릴 수 없어요.',
      confirmText: '삭제',
      destructive: true,
      onConfirm: async () => {
        setDeleting(true);
        try {
          await photoPinService.deletePin(pin.id);
          pins.setData((current) => (current ?? []).filter((item) => item.id !== pin.id));
          setSelectedPin(null);
        } catch (e) {
          notify('삭제하지 못했어요', e instanceof Error ? e.message : undefined);
        } finally {
          setDeleting(false);
        }
      },
    });

  return (
    <Screen title="산책 지도" subtitle={`${withDog} 함께 걸었던 장소를 한눈에 모아보세요.`} scroll={false}>
      <View style={styles.search}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.inkSoft} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={searchFacilities}
          placeholder="친화시설 이름을 검색해보세요"
          placeholderTextColor={colors.inkFaint}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {searching ? <ActivityIndicator size="small" color={colors.forest} /> : query ? (
          <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" hitSlop={8} onPress={clearSearch}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.inkFaint} />
          </Pressable>
        ) : null}
      </View>
      {searchResults && (
        <View style={styles.results}>
          {searchResults.length === 0 ? (
            <Text style={styles.resultEmpty}>'{query.trim()}' 검색 결과가 없어요.</Text>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              {searchResults.map((facility) => (
                <Pressable key={facility.id} accessibilityRole="button" onPress={() => selectSearchResult(facility)} style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}>
                  <Text style={styles.resultName} numberOfLines={1}>{facility.name}</Text>
                  <Text style={styles.resultBody} numberOfLines={1}>{facility.categoryLabel}{facility.address ? ` · ${facility.address}` : ''}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Pressable accessibilityRole="button" onPress={() => setSearchResults(null)} style={styles.resultClose}>
            <Text style={styles.resultCloseText}>닫기</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.filters}>
        <Filter label="전체" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Filter
          label={pins.data?.length ? `사진 핀 ${pins.data.length}` : '사진 핀'}
          active={filter === 'photo'}
          onPress={() => setFilter('photo')}
        />
        <Filter label="친화시설" active={filter === 'facility'} onPress={() => setFilter('facility')} />
      </View>
      {filter === 'facility' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll} contentContainerStyle={styles.groups}>
          <GroupChip label="전체" active={group === undefined} onPress={() => setGroup(undefined)} />
          {FACILITY_GROUPS.map((item) => (
            <GroupChip key={item.value} label={item.label} active={group === item.value} onPress={() => setGroup(item.value)} />
          ))}
        </ScrollView>
      )}

      <View style={styles.mapCard}>
        <NaverWebMap
          style={styles.map}
          initialCamera={DEFAULT_CAMERA}
          myLocation={myLocation}
          follow={follow}
          onUserGesture={() => setFollow(false)}
          photoPins={visiblePins}
          onPhotoPinPress={(pinId) => setSelectedPin(pins.data?.find((pin) => pin.id === pinId) ?? null)}
          facilities={facilities}
          onFacilityPress={setSelectedFacilityId}
          onCameraIdle={setViewport}
          moveTo={moveTo}
        />
        {showFacilities && (facilityLoading || facilityNotice) && (
          <View style={styles.facilityNotice} pointerEvents="none">
            {facilityLoading ? <ActivityIndicator size="small" color={colors.forest} /> : null}
            <Text style={styles.facilityNoticeText}>
              {facilityLoading ? '친화시설을 불러오는 중' : FACILITY_NOTICE_TEXT[facilityNotice!]}
            </Text>
          </View>
        )}
        {pins.error && (
          <Pressable style={styles.pinError} onPress={pins.reload} accessibilityRole="button">
            <Text style={styles.pinErrorText}>사진 핀을 불러오지 못했어요 · 다시 시도</Text>
          </Pressable>
        )}
        {myLocation && (
          <Pressable
            style={styles.locationButton}
            onPress={() => setFollow(true)}
            accessibilityRole="button"
            accessibilityLabel="내 위치로 이동"
          >
            <MaterialCommunityIcons
              name={follow ? 'crosshairs-gps' : 'crosshairs'}
              size={22}
              color={follow ? colors.forest : colors.inkSoft}
            />
          </Pressable>
        )}
        {hasLocation && (
          <Pressable
            style={styles.addPinButton}
            onPress={startPhotoPin}
            accessibilityRole="button"
            accessibilityLabel="사진 핀 남기기"
          >
            <MaterialCommunityIcons name="camera-plus-outline" size={22} color={colors.white} />
            <Text style={styles.addPinText}>사진 핀</Text>
          </Pressable>
        )}
        {(status === 'denied' || status === 'blocked') && (
          <View style={styles.banner}>
            <AppCard>
              <Text style={styles.bannerText}>위치 권한이 없어 기본 위치(서울시청)를 보여주고 있어요.</Text>
              <View style={styles.bannerButton}>
                <AppButton
                  label={status === 'blocked' ? '설정에서 허용하기' : '권한 허용하기'}
                  // blocked 면 앱에서 다시 물어볼 수 없으니 설정 화면으로 보냄
                  onPress={() => (status === 'blocked' ? Linking.openSettings() : request())}
                />
              </View>
            </AppCard>
          </View>
        )}
      </View>

      <Pressable accessibilityRole="button" onPress={() => setFilter('facility')}>
        <AppCard>
          <View style={styles.cardRow}>
            <View style={styles.iconBubble}>
              <MaterialCommunityIcons name="storefront-outline" size={21} color={colors.forest} />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{withDog} 함께 갈 수 있는 곳</Text>
              <Text style={styles.cardBody}>
                {showFacilities && facilities.length > 0
                  ? `지금 지도에 반려동물 동반 가능 시설 ${facilities.length}곳이 있어요.`
                  : '반려동물과 함께 갈 수 있는 카페·식당·병원을 지도에서 찾아보세요.'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.inkFaint} />
          </View>
        </AppCard>
      </Pressable>

      <PhotoPinCreateSheet photo={draft?.photo ?? null} saving={saving} onCancel={() => setDraft(null)} onSave={savePhotoPin} />
      <PhotoPinDetailSheet pin={selectedPin} deleting={deleting} onClose={() => setSelectedPin(null)} onDelete={deletePhotoPin} />
      <FacilityDetailSheet facilityId={selectedFacilityId} onClose={() => setSelectedFacilityId(null)} />
    </Screen>
  );
}

function GroupChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.groupChip, active && styles.groupChipActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.groupChipText, active && styles.groupChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Filter({ label, active = false, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      style={[styles.filter, active && styles.filterActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  searchInput: { color: colors.ink, flex: 1, padding: 0, ...typography.body },
  results: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, maxHeight: 260, overflow: 'hidden' },
  result: { borderBottomColor: colors.line, borderBottomWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  resultPressed: { backgroundColor: colors.ivory },
  resultName: { color: colors.ink, ...typography.label },
  resultBody: { color: colors.inkSoft, marginTop: 2, ...typography.caption },
  resultEmpty: { color: colors.inkSoft, padding: spacing.md, ...typography.body },
  resultClose: { alignItems: 'center', paddingVertical: spacing.sm },
  resultCloseText: { color: colors.forest, ...typography.label },
  groupScroll: { flexGrow: 0 },
  groups: { gap: spacing.xs },
  groupChip: { backgroundColor: colors.ivory, borderRadius: 99, paddingHorizontal: spacing.md, paddingVertical: 6 },
  groupChipActive: { backgroundColor: colors.forestSoft },
  groupChipText: { color: colors.inkSoft, ...typography.caption },
  groupChipTextActive: { color: colors.forest, fontWeight: '700' },
  facilityNotice: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: 99, borderWidth: 1, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, position: 'absolute', top: spacing.md + 50 },
  facilityNoticeText: { color: colors.inkSoft, ...typography.caption },
  filters: { flexDirection: 'row', gap: spacing.sm },
  filter: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 99, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  filterActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  filterText: { color: colors.inkSoft, ...typography.label },
  filterTextActive: { color: colors.white },
  // 남은 세로 공간을 지도가 채우도록 flex: 1 (Screen scroll={false})
  mapCard: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  map: { flex: 1 },
  locationButton: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: 99, borderWidth: 1, height: 42, justifyContent: 'center', position: 'absolute', right: spacing.md, top: spacing.md, width: 42 },
  addPinButton: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: 99, bottom: spacing.md, elevation: 3, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, position: 'absolute', right: spacing.md, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  addPinText: { color: colors.white, ...typography.label },
  pinError: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 99, borderWidth: 1, left: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, position: 'absolute', top: spacing.md },
  pinErrorText: { color: colors.danger, ...typography.caption },
  banner: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md },
  bannerText: { ...typography.body, color: colors.ink },
  bannerButton: { marginTop: spacing.md },
  cardRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  iconBubble: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.md, height: 42, justifyContent: 'center', width: 42 },
  cardCopy: { flex: 1 },
  cardTitle: { color: colors.ink, ...typography.heading },
  cardBody: { color: colors.inkSoft, marginTop: 3, ...typography.caption },
});
