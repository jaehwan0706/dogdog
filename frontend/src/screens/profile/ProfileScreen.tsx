import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { authService } from '../../api/auth/authService';
import { userService } from '../../api/user/userService';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { LoadState } from '../../components/shop/ShopParts';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ProfileScreenProps } from '../../navigation/ProfileNavigator';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuthSession } from '../../store/authStore';
import { useDogs } from '../../store/dogStore';
import { colors, radius, spacing, typography } from '../../theme';
import { confirmAction, notify } from '../../utils/dialog';
import { dogSummary } from '../../utils/format';

const providerLabel = { LOCAL: '이메일', KAKAO: '카카오', GOOGLE: 'Google', NAVER: '네이버', APPLE: 'Apple' } as const;

export function ProfileScreen({ navigation }: ProfileScreenProps<'ProfileHome'>) {
  // 산책 기록 화면은 탭 밖(최상위 스택)에 있어서 그쪽 navigation 으로 이동
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const me = useAsyncData(() => userService.getMe(), []);
  const session = useAuthSession();
  const { dogs } = useDogs();

  const withdraw = () =>
    confirmAction({
      title: '정말 탈퇴할까요?',
      message: '반려견 정보와 작성한 글이 모두 삭제되고 되돌릴 수 없어요.',
      confirmText: '탈퇴하기',
      destructive: true,
      onConfirm: () => userService.withdraw().catch((e: Error) => notify('탈퇴하지 못했어요', e.message)),
    });

  return (
    <Screen title="마이페이지" subtitle="내 정보와 반려견 프로필을 관리해보세요.">
      <AppCard>
        {me.data ? (
          <View style={styles.userRow}>
            <View style={styles.userAvatar}><MaterialCommunityIcons name="account" size={28} color={colors.forest} /></View>
            <View style={styles.flex}>
              {/* 닉네임을 바꾸면 세션이 바로 바뀌므로 세션 값을 먼저 보여준다 */}
              <Text style={styles.userName}>{session?.user.nickname ?? me.data.nickname}</Text>
              <Text style={styles.meta}>{me.data.email} · {providerLabel[me.data.provider]} 로그인</Text>
            </View>
            <Pressable accessibilityLabel="닉네임 변경" accessibilityRole="button" hitSlop={10} onPress={() => navigation.navigate('NicknameEdit')}>
              <MaterialCommunityIcons name="pencil-outline" size={21} color={colors.forest} />
            </Pressable>
          </View>
        ) : (
          <LoadState loading={me.loading} error={me.error} onRetry={me.reload} />
        )}
      </AppCard>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>우리 아이</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => navigation.navigate('DogEdit', {})}>
          <Text style={styles.more}>+ 추가</Text>
        </Pressable>
      </View>
      {(dogs ?? []).map((dog) => (
        <Pressable key={dog.id} accessibilityRole="button" accessibilityLabel={`${dog.name} 프로필 수정`} onPress={() => navigation.navigate('DogEdit', { dogId: dog.id })}>
          <AppCard>
            <View style={styles.userRow}>
              <View style={styles.dogAvatar}><MaterialCommunityIcons name="dog" size={32} color={colors.forest} /></View>
              <View style={styles.flex}>
                <Text style={styles.dogName}>{dog.name}</Text>
                <Text style={styles.meta}>{dogSummary(dog)}</Text>
              </View>
              <MaterialCommunityIcons name="pencil-outline" size={21} color={colors.forest} />
            </View>
          </AppCard>
        </Pressable>
      ))}

      <View style={styles.menu}>
        {/* 관리자 메뉴는 ADMIN 계정에만 보인다. 실제 권한은 서버가 /admin/** 에서 검사 */}
        {me.data?.role === 'ADMIN' ? <Menu icon="shield-account-outline" title="관리자" body="신고 처리, 회원·상품 관리" onPress={() => navigation.navigate('AdminHome')} /> : null}
        <Menu icon="file-document-outline" title="내가 쓴 글" body="커뮤니티에 남긴 글을 모아봐요" onPress={() => navigation.navigate('MyPosts')} />
        <Menu icon="account-cancel-outline" title="차단한 사용자" body="차단 목록을 확인하고 해제해요" onPress={() => navigation.navigate('BlockedUsers')} />
        <Menu icon="calendar-check-outline" title="산책 기록" body="지금까지 걸은 산책을 모아봐요" onPress={() => rootNavigation.navigate('WalkHistory')} />
        <Menu icon="logout" title="로그아웃" body="이 기기에서 로그아웃해요" onPress={() => authService.logout()} />
      </View>
      <Pressable accessibilityRole="button" onPress={withdraw} style={styles.withdraw}>
        <Text style={styles.withdrawText}>회원 탈퇴</Text>
      </Pressable>
    </Screen>
  );
}

function Menu({ icon, title, body, onPress }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; body: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={!onPress && styles.disabled}>
      <AppCard>
        <View style={styles.menuRow}>
          <View style={styles.menuIcon}><MaterialCommunityIcons name={icon} size={21} color={colors.forest} /></View>
          <View style={styles.flex}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuBody}>{body}</Text></View>
          {onPress ? <MaterialCommunityIcons name="chevron-right" size={21} color={colors.inkFaint} /> : null}
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  userRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  userAvatar: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 99, height: 52, justifyContent: 'center', width: 52 },
  userName: { color: colors.ink, ...typography.heading },
  dogAvatar: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderRadius: 99, height: 60, justifyContent: 'center', width: 60 },
  dogName: { color: colors.ink, ...typography.title },
  meta: { color: colors.inkSoft, marginTop: 3, ...typography.caption },
  sectionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: colors.ink, ...typography.heading },
  more: { color: colors.forest, ...typography.label },
  menu: { gap: spacing.sm },
  menuRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  menuIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.md, height: 42, justifyContent: 'center', width: 42 },
  menuTitle: { color: colors.ink, ...typography.label },
  menuBody: { color: colors.inkSoft, marginTop: 2, ...typography.caption },
  disabled: { opacity: 0.55 },
  withdraw: { alignItems: 'center', paddingVertical: spacing.md },
  withdrawText: { color: colors.inkFaint, textDecorationLine: 'underline', ...typography.caption },
});
