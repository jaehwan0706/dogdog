import { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { NaverMapView, type NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { useLocationPermission } from '../../hooks/useLocationPermission';
import { colors, spacing, typography } from '../../theme';

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
    <View style={styles.container}>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  banner: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
  bannerText: { ...typography.body, color: colors.ink },
  bannerButton: { marginTop: spacing.md },
});
