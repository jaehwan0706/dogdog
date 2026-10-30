import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import type { ProfileScreenProps } from '../../navigation/ProfileNavigator';
import { colors, radius, spacing, typography } from '../../theme';

const menus: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; body: string; screen: 'AdminReports' | 'AdminUsers' | 'AdminProducts' | 'AdminOrders' }[] = [
  { icon: 'alarm-light-outline', title: '신고 처리', body: '신고된 글·댓글·사용자를 검토하고 숨김·정지해요', screen: 'AdminReports' },
  { icon: 'account-multiple-outline', title: '회원 관리', body: '회원을 검색하고 이용정지·해제해요', screen: 'AdminUsers' },
  { icon: 'package-variant', title: '상품 관리', body: '마켓 상품을 등록·수정·판매중지해요', screen: 'AdminProducts' },
  { icon: 'truck-delivery-outline', title: '주문·배송 관리', body: '결제된 주문을 발송·배송 완료 처리해요', screen: 'AdminOrders' },
];

// 마이페이지에서 ADMIN 계정에만 보이는 관리자 메뉴. 실제 권한 검사는 서버(/admin/**)가 한다.
export function AdminHomeScreen({ navigation }: ProfileScreenProps<'AdminHome'>) {
  return (
    <Screen title="관리자" subtitle="댕산책 운영 도구" onBack={navigation.goBack}>
      {menus.map((menu) => (
        <Pressable key={menu.screen} accessibilityRole="button" onPress={() => navigation.navigate(menu.screen)}>
          <AppCard>
            <View style={styles.row}>
              <View style={styles.icon}><MaterialCommunityIcons name={menu.icon} size={22} color={colors.forest} /></View>
              <View style={styles.flex}>
                <Text style={styles.title}>{menu.title}</Text>
                <Text style={styles.body}>{menu.body}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={21} color={colors.inkFaint} />
            </View>
          </AppCard>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  icon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.md, height: 44, justifyContent: 'center', width: 44 },
  flex: { flex: 1 },
  title: { color: colors.ink, ...typography.heading },
  body: { color: colors.inkSoft, marginTop: 2, ...typography.caption },
});
