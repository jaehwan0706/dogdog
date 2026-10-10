import { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NaverMapView, type NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { useLocationPermission } from '../../hooks/useLocationPermission';
import { colors, radius, spacing, typography } from '../../theme';

// 위치를 받기 전 기본으로 보여줄 좌표 (서울시청)
const DEFAULT_CAMERA = { latitude: 37.5666, longitude: 126.9784, zoom: 15 };

export function MapScreen() {
  const mapRef = useRef<NaverMapViewRef>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const { status, request } = useLocationPermission();
  const hasLocation = status === 'granted';

  // 지도 준비 + 권한 허용이 모두 끝나면 카메라가 내 위치를 따라가도록 설정
  useEffect(() => {
    if (isMapReady && hasLocation) {
      mapRef.current?.setLocationTrackingMode('Follow');
    }
  }, [isMapReady, hasLocation]);

  return (
    <Screen title="산책 지도" subtitle="보리와 함께 걸었던 장소를 한눈에 모아보세요." scroll={false}>
      {/* 검색·필터는 아직 UI 만 있음 (시설/사진 핀 API 연동 시 동작 추가) */}
      <View style={styles.search}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.inkSoft} />
        <Text style={styles.searchText}>산책 장소나 시설을 검색해보세요</Text>
        <MaterialCommunityIcons name="tune-variant" size={18} color={colors.forest} />
      </View>
      <View style={styles.filters}>
        <Filter label="전체" active />
        <Filter label="사진 핀" />
        <Filter label="친화시설" />
      </View>

      <View style={styles.mapCard}>
        <NaverMapView
          ref={mapRef}
          style={styles.map}
          initialCamera={DEFAULT_CAMERA}
          locale="ko"
          isShowLocationButton={hasLocation}
          onInitialized={() => setIsMapReady(true)}
        />
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

      <AppCard>
        <View style={styles.cardRow}>
          <View style={styles.iconBubble}>
            <MaterialCommunityIcons name="storefront-outline" size={21} color={colors.forest} />
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>보리와 함께 찾은 장소</Text>
            <Text style={styles.cardBody}>반려동물과 함께 갈 수 있는 장소를 추천해드려요.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.inkFaint} />
        </View>
      </AppCard>
    </Screen>
  );
}

function Filter({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.filter, active && styles.filterActive]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  searchText: { color: colors.inkFaint, flex: 1, ...typography.caption },
  filters: { flexDirection: 'row', gap: spacing.sm },
  filter: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 99, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  filterActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  filterText: { color: colors.inkSoft, ...typography.label },
  filterTextActive: { color: colors.white },
  // 남은 세로 공간을 지도가 채우도록 flex: 1 (Screen scroll={false})
  mapCard: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  map: { flex: 1 },
  banner: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md },
  bannerText: { ...typography.body, color: colors.ink },
  bannerButton: { marginTop: spacing.md },
  cardRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  iconBubble: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.md, height: 42, justifyContent: 'center', width: 42 },
  cardCopy: { flex: 1 },
  cardTitle: { color: colors.ink, ...typography.heading },
  cardBody: { color: colors.inkSoft, marginTop: 3, ...typography.caption },
});
