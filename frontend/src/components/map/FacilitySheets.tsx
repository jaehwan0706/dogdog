import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { facilityService } from '../../api/facility/facilityService';
import { useAsyncData } from '../../hooks/useAsyncData';
import { colors, radius, spacing, typography } from '../../theme';
import type { FacilityDetail } from '../../types/facility';
import { AppButton } from '../AppButton';
import { FACILITY_MARKER_STYLE } from './naverMapHtml';
import { Sheet } from './PhotoPinSheets';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

// 지도에서 시설 마커(또는 검색 결과)를 눌렀을 때 상세. facilityId 가 null 이면 닫힘
export function FacilityDetailSheet({ facilityId, onClose }: { facilityId: number | null; onClose: () => void }) {
  return (
    <Sheet visible={facilityId !== null} onClose={onClose}>
      {facilityId !== null && <FacilityDetailBody facilityId={facilityId} onClose={onClose} />}
    </Sheet>
  );
}

function FacilityDetailBody({ facilityId, onClose }: { facilityId: number; onClose: () => void }) {
  const detail = useAsyncData(() => facilityService.getDetail(facilityId), [facilityId]);
  const facility = detail.data;

  if (!facility) {
    return (
      <View style={styles.center}>
        {detail.error ? (
          <>
            <Text style={styles.body}>{detail.error}</Text>
            <AppButton label="다시 시도" variant="ghost" onPress={detail.reload} />
          </>
        ) : <ActivityIndicator color={colors.forest} />}
      </View>
    );
  }

  const look = FACILITY_MARKER_STYLE[facility.category];
  return (
    <>
      <View style={styles.header}>
        <View style={[styles.badge, { borderColor: look?.color ?? colors.line }]}>
          <Text style={styles.badgeEmoji}>{look?.emoji ?? '🐾'}</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.name}>{facility.name}</Text>
          <Text style={styles.caption}>{facility.categoryLabel}{facility.description && facility.description !== facility.categoryLabel ? ` · ${facility.description}` : ''}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.rows}>
        <Row icon="map-marker-outline" text={facility.roadAddress ?? facility.lotAddress} />
        <Row icon="clock-outline" text={joinText(facility.openingHours, facility.closedDays && `휴무 ${facility.closedDays}`)} />
        <Row icon="phone-outline" text={facility.phone} onPress={facility.phone ? () => Linking.openURL(`tel:${facility.phone}`) : undefined} />
        <Row icon="web" text={facility.homepage} onPress={facility.homepage ? () => Linking.openURL(withScheme(facility.homepage!)) : undefined} />

        <View style={styles.petBox}>
          <Text style={styles.petTitle}>반려동물 동반 안내</Text>
          <Row icon="dog-side" text={facility.petSize && `입장 가능: ${facility.petSize}`} />
          <Row icon="alert-circle-outline" text={facility.petRestrictions && `제한사항: ${facility.petRestrictions}`} />
          <Row icon="cash" text={facility.petExtraFee && `동반 추가 요금: ${facility.petExtraFee}`} />
          <Row icon="home-city-outline" text={placeText(facility)} />
          <Row icon="car-outline" text={facility.parking === null ? null : facility.parking ? '주차 가능' : '주차 불가'} />
        </View>

        <Text style={styles.source}>
          출처: 한국문화정보원 반려동물 동반 가능 문화시설 데이터{facility.sourceUpdatedAt ? ` (${facility.sourceUpdatedAt} 기준)` : ''}.{'\n'}
          방문 전 운영 정보와 동반 조건을 시설에 확인해 주세요.
        </Text>
      </ScrollView>

      <AppButton label="닫기" onPress={onClose} />
    </>
  );
}

function Row({ icon, text, onPress }: { icon: IconName; text: string | null | undefined; onPress?: () => void }) {
  if (!text) return null;
  const content = (
    <>
      <MaterialCommunityIcons name={icon} size={18} color={colors.inkSoft} />
      <Text style={[styles.body, styles.rowText, onPress && styles.link]}>{text}</Text>
    </>
  );
  return onPress ? (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.row}>{content}</Pressable>
  ) : (
    <View style={styles.row}>{content}</View>
  );
}

const joinText = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ') || null;

function placeText({ indoor, outdoor }: FacilityDetail) {
  if (indoor && outdoor) return '실내·실외 모두 동반 가능';
  if (indoor) return '실내 동반 가능';
  if (outdoor) return '실외만 동반 가능';
  return null;
}

// 원본 홈페이지 값은 "www.example.com" 처럼 http 가 빠진 경우가 있다
const withScheme = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  badge: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 99, borderWidth: 3, height: 44, justifyContent: 'center', width: 44 },
  badgeEmoji: { fontSize: 20 },
  headerCopy: { flex: 1 },
  name: { color: colors.ink, ...typography.heading },
  caption: { color: colors.inkSoft, marginTop: 2, ...typography.caption },
  scroll: { maxHeight: 360 },
  rows: { gap: spacing.sm },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  rowText: { flex: 1 },
  body: { color: colors.ink, ...typography.body },
  link: { color: colors.forest, textDecorationLine: 'underline' },
  petBox: { backgroundColor: colors.ivory, borderRadius: radius.md, gap: spacing.sm, marginTop: spacing.xs, padding: spacing.md },
  petTitle: { color: colors.forest, ...typography.label },
  source: { color: colors.inkFaint, marginTop: spacing.xs, ...typography.caption },
});
