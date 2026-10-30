import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { adminService } from '../../api/admin/adminService';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { FilterChips } from '../../components/FilterChips';
import { Screen } from '../../components/Screen';
import { LoadState } from '../../components/shop/ShopParts';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ProfileScreenProps } from '../../navigation/ProfileNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { AdminUser, UserStatus } from '../../types/moderation';
import { confirmAction, notify } from '../../utils/dialog';

const filters: { value: UserStatus | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: 'ACTIVE', label: '정상' },
  { value: 'SUSPENDED', label: '이용정지' },
];

const statusLabel: Record<UserStatus, string> = { ACTIVE: '정상', SUSPENDED: '이용정지', DELETED: '탈퇴' };

export function AdminUsersScreen({ navigation }: ProfileScreenProps<'AdminUsers'>) {
  const [status, setStatus] = useState<UserStatus | undefined>();
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const users = useAsyncData(() => adminService.getUsers({ status, keyword }), [status, keyword]);
  const items = users.data?.content ?? [];

  const toggle = (user: AdminUser) => {
    const suspend = user.status === 'ACTIVE';
    confirmAction({
      title: suspend ? `${user.nickname}님을 이용정지할까요?` : `${user.nickname}님의 이용정지를 해제할까요?`,
      message: suspend ? '로그인과 글쓰기가 막히고, 로그인된 기기에서도 곧 로그아웃돼요.' : undefined,
      confirmText: suspend ? '정지' : '해제',
      destructive: suspend,
      onConfirm: async () => {
        try {
          const updated = await adminService.changeUserStatus(user.id, suspend ? 'SUSPENDED' : 'ACTIVE');
          users.setData({ ...users.data!, content: items.map((item) => (item.id === updated.id ? updated : item)) });
        } catch (e) {
          notify('처리하지 못했어요', e instanceof Error ? e.message : undefined);
        }
      },
    });
  };

  return (
    <Screen title="회원 관리" onBack={navigation.goBack}>
      <View style={styles.search}>
        <MaterialCommunityIcons name="magnify" size={19} color={colors.inkSoft} />
        <TextInput autoCapitalize="none" onChangeText={setKeywordInput} onSubmitEditing={() => setKeyword(keywordInput.trim())} placeholder="닉네임·이메일 검색" placeholderTextColor={colors.inkFaint} returnKeyType="search" style={styles.searchInput} value={keywordInput} />
      </View>
      <FilterChips options={filters} value={status} onChange={setStatus} />
      {items.length > 0 && !users.error
        ? items.map((user) => (
            <AppCard key={user.id}>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.name}>{user.nickname}{user.role === 'ADMIN' ? '  👑' : ''}</Text>
                  <Text style={styles.meta}>{user.email ?? '이메일 없음'} · {user.provider} · #{user.id}</Text>
                </View>
                <Text style={[styles.badge, user.status === 'SUSPENDED' && styles.badgeSuspended]}>{statusLabel[user.status]}</Text>
              </View>
              {user.role !== 'ADMIN' && user.status !== 'DELETED' ? (
                <View style={styles.action}>
                  <AppButton label={user.status === 'ACTIVE' ? '이용정지' : '정지 해제'} variant="ghost" onPress={() => toggle(user)} />
                </View>
              ) : null}
            </AppCard>
          ))
        : <LoadState loading={users.loading} error={users.error} empty emptyText="회원이 없어요." onRetry={users.reload} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md },
  searchInput: { color: colors.ink, flex: 1, minHeight: 45, ...typography.body },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  name: { color: colors.ink, ...typography.heading },
  meta: { color: colors.inkFaint, marginTop: 2, ...typography.caption },
  badge: { backgroundColor: colors.forestSoft, borderRadius: radius.pill, color: colors.forest, overflow: 'hidden', paddingHorizontal: spacing.sm, paddingVertical: 2, ...typography.caption, fontWeight: '700' },
  badgeSuspended: { backgroundColor: '#FBE3DA', color: colors.coral },
  action: { marginTop: spacing.md },
});
